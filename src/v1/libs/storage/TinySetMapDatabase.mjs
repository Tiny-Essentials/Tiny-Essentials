import TinyPromiseQueue from '../utils/TinyPromiseQueue.mjs';

/**
 * A key that can be stored in an IndexedDB object store.
 * @typedef {IDBValidKey | IDBKeyRange} TableValue
 */

/**
 * Validates that a value is a non-empty string.
 * @param {unknown} value - The value to validate.
 * @param {string} [name='value'] - Parameter name used in the error message.
 * @returns {void}
 * @throws {TypeError} If the value is not a non-empty string.
 */
function assertNonEmptyString(value, name = 'value') {
  if (typeof value !== 'string' || value.length === 0) {
    throw new TypeError(`The "${name}" argument must be a non-empty string.`);
  }
}

/**
 * A single persisted record.
 * @template {TableValue} Key
 * @template {*} Value
 * @typedef {Object} TinyTableDbRecord
 * @property {Key} key - The record key.
 * @property {Value} value - The record value.
 * @property {number} timestamp - Unix timestamp (in milliseconds).
 */

/**
 * Shared IndexedDB plumbing for {@link TinySetDb} and {@link TinyMapDb}.
 *
 * This class owns the connection, the write queue, the action queue and the
 * hydration lifecycle. Subclasses only implement the in-memory cache and the
 * public API, which keeps both collections perfectly consistent.
 */
class TinyTableDb {
  /** @type {string} */
  #storeName;

  /** @type {() => Promise<IDBDatabase>} */
  #openDatabase;

  /** @type {TinyPromiseQueue} */
  #writeQueue = new TinyPromiseQueue();

  /** @type {TinyPromiseQueue} */
  #actionQueue = new TinyPromiseQueue();

  /** @type {Promise<void>|null} */
  #ready = null;

  /** @type {boolean} */
  #hydrated = false;

  /**
   * @param {{ storeName: string, openDatabase: () => Promise<IDBDatabase> }} options - Table options.
   * @throws {TypeError} If `storeName` is not a non-empty string.
   * @throws {TypeError} If `openDatabase` is not a function.
   */
  constructor({ storeName, openDatabase }) {
    assertNonEmptyString(storeName, 'storeName');
    if (typeof openDatabase !== 'function') {
      throw new TypeError('The "openDatabase" option must be a function.');
    }
    this.#storeName = storeName;
    this.#openDatabase = openDatabase;
  }

  /**
   * Name of the object store that backs this table.
   * @returns {string}
   */
  get storeName() {
    return this.#storeName;
  }

  /**
   * Whether the in-memory cache was already hydrated from IndexedDB.
   * @returns {boolean}
   */
  get isReady() {
    return this.#hydrated;
  }

  /**
   * Tag used by `Object.prototype.toString`.
   * @returns {string}
   */
  get [Symbol.toStringTag]() {
    return this.constructor.name;
  }

  /**
   * Loads every persisted value into the in-memory cache.
   * Safe to call multiple times, the work happens only once.
   * @returns {Promise<void>}
   */
  hydrate() {
    this.#ready ??= this.#hydrate();
    return this.#ready;
  }

  /**
   * Runs an operation with exclusive access to the in-memory cache.
   * @param {() => Promise<void>} operation - The operation to run.
   * @returns {Promise<void>}
   */
  _action(operation) {
    return this.#actionQueue.enqueue(operation);
  }

  /**
   * Runs a write operation with exclusive access to the object store.
   * @param {() => Promise<void>} operation - The operation to run.
   * @returns {Promise<void>}
   */
  _write(operation) {
    return this.#writeQueue.enqueue(operation);
  }

  /**
   * Persists a single record.
   * @param {TinyTableDbRecord<TableValue, unknown>|TinySetDbRecord<TableValue>} record - The record to persist.
   * @returns {Promise<void>}
   */
  async _persist(record) {
    const database = await this.#openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(this.#storeName, 'readwrite');
      const request = transaction.objectStore(this.#storeName).put(record);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes a single record by its key.
   * @param {TableValue} key - The key to delete.
   * @returns {Promise<void>}
   */
  async _remove(key) {
    const database = await this.#openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(this.#storeName, 'readwrite');
      const request = transaction.objectStore(this.#storeName).delete(key);
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Deletes every record from the object store.
   * @returns {Promise<void>}
   */
  async _clear() {
    const database = await this.#openDatabase();
    await new Promise((resolve, reject) => {
      const transaction = database.transaction(this.#storeName, 'readwrite');
      const request = transaction.objectStore(this.#storeName).clear();
      request.onsuccess = () => resolve(undefined);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Reads every stored value into the cache.
   * @returns {Promise<void>}
   */
  async #hydrate() {
    const database = await this.#openDatabase();
    const records = await TinyTableDb.#readAll(database, this.#storeName);
    this._load(records);
    this.#hydrated = true;
  }

  /**
   * Populates the in-memory cache from the persisted records.
   * @abstract
   * @param {(TinyTableDbRecord<TableValue, unknown>|TinySetDbRecord<TableValue>)[]} records - The persisted records.
   * @returns {void}
   */
  _load(records) {
    throw new Error(`The "_load" method of "${this.constructor.name}" is not implemented.`);
  }

  /**
   * Reads every persisted record from the object store.
   * @param {IDBDatabase} database - The open database connection.
   * @param {string} storeName - Name of the object store to read.
   * @returns {Promise<TinyTableDbRecord<TableValue, unknown>[]>} Every record currently stored.
   */
  static #readAll(database, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = database.transaction(storeName, 'readonly');
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }
}

/**
 * A single persisted value entry.
 * @template {TableValue} Value
 * @typedef {Object} TinySetDbRecord
 * @property {Value} value - The unique value that was stored.
 * @property {number} timestamp - Unix timestamp (in milliseconds) of the first detection.
 */

/**
 * Predicate used to reject values that must never reach a table.
 * @template {TableValue} Value
 * @callback TinySetDbValidator
 * @param {Value} value - The candidate value.
 * @returns {boolean} A truthy value when the value is accepted.
 */

/**
 * @template {TableValue} Value
 * @typedef {Object} TinySetDbOptions
 * @property {string} storeName - Name of the object store (table) that backs this set.
 * @property {() => Promise<IDBDatabase>} openDatabase - Resolves with the shared connection.
 * @property {TinySetDbValidator<Value>|null} [validate] - Optional predicate applied to every value.
 */

/**
 * A source of values accepted by the set operations.
 * @template {TableValue} Value
 * @typedef {TinySetDb<Value>|Set<Value>|Value[]} TinySetDbSource
 */

/**
 * Callback invoked by {@link TinySetDb#forEach}.
 * @template {TableValue} Value
 * @callback TinySetDbForEachCallback
 * @param {Value} value - The current value.
 * @param {Value} sameValue - The same value, mirroring `Set.prototype.forEach`.
 * @param {TinySetDb<Value>} set - The set being iterated.
 * @returns {void}
 */

/**
 * @template {TableValue} Value
 * @extends {TinyTableDb}
 * Persistent set of values backed by a single IndexedDB object store.
 */
class TinySetDb extends TinyTableDb {
  /** @type {TinySetDbValidator<Value>|null} */
  #validate;

  /** @type {Set<Value>} */
  #cache = new Set();

  /**
   * @param {TinySetDbOptions<Value>} options - Table options.
   * @throws {TypeError} If `validate` is neither a function nor `null`.
   */
  constructor({ storeName, openDatabase, validate = null }) {
    super({ storeName, openDatabase });
    if (validate !== null && typeof validate !== 'function') {
      throw new TypeError('The "validate" option must be a function or null.');
    }
    this.#validate = validate;
  }

  /**
   * Number of values currently held in the in-memory cache.
   * @returns {number}
   */
  get size() {
    return this.#cache.size;
  }

  /**
   * Checks whether the given value is already stored.
   * @param {Value} value - The value to look up.
   * @returns {Promise<boolean>} `true` when the value was already logged.
   * @throws {TypeError} If `value` is not a non-empty string.
   * @throws {TypeError} If the table validator rejects the value.
   */
  async has(value) {
    assertNonEmptyString(value);
    this.#assertAccepted(value);
    await this.hydrate();
    let found = false;
    await this._action(async () => {
      found = this.#cache.has(value);
    });
    return found;
  }

  /**
   * Adds a value to the cache and persists it.
   * @param {Value} value - The value to store.
   * @returns {Promise<boolean>} `true` when the value was added, `false` when it already existed.
   * @throws {TypeError} If `value` is not a non-empty string.
   * @throws {TypeError} If the table validator rejects the value.
   */
  async add(value) {
    assertNonEmptyString(value);
    this.#assertAccepted(value);
    await this.hydrate();
    let added = false;
    await this._action(async () => {
      if (this.#cache.has(value)) return;
      await this._write(() => this._persist({ value, timestamp: Date.now() }));
      this.#cache.add(value);
      added = true;
    });
    return added;
  }

  /**
   * Removes a value from the cache and from the object store.
   * @param {Value} value - The value to remove.
   * @returns {Promise<boolean>} `true` when the value existed and was removed.
   * @throws {TypeError} If `value` is not a non-empty string.
   * @throws {TypeError} If the table validator rejects the value.
   */
  async delete(value) {
    assertNonEmptyString(value);
    this.#assertAccepted(value);
    await this.hydrate();
    let deleted = false;
    await this._action(async () => {
      if (!this.#cache.has(value)) return;
      await this._write(() => this._remove(value));
      this.#cache.delete(value);
      deleted = true;
    });
    return deleted;
  }

  /**
   * Removes every value from both the cache and the object store.
   * @returns {Promise<void>}
   */
  async clear() {
    await this.hydrate();
    await this._action(async () => {
      await this._write(() => this._clear());
      this.#cache.clear();
    });
  }

  /**
   * Returns a snapshot of every stored value.
   * @returns {Promise<Value[]>} A new array with the current values.
   */
  async toArray() {
    await this.hydrate();
    return [...this.#cache];
  }

  /**
   * Serialization hook used by `JSON.stringify`.
   * @returns {Promise<Value[]>} A new array with the current values.
   */
  async toJSON() {
    return this.toArray();
  }

  /**
   * Iterates over the stored values.
   * @returns {AsyncGenerator<Value, void, void>} An async generator of values.
   */
  async *values() {
    await this.hydrate();
    for (const value of [...this.#cache]) {
      yield value;
    }
  }

  /**
   * Alias of {@link TinySetDb#values}, mirroring `Set.prototype.keys`.
   * @returns {AsyncGenerator<Value, void, void>} An async generator of values.
   */
  keys() {
    return this.values();
  }

  /**
   * Iterates over `[value, value]` pairs, mirroring `Set.prototype.entries`.
   * @returns {AsyncGenerator<[Value, Value], void, void>} An async generator of pairs.
   */
  async *entries() {
    for await (const value of this.values()) {
      yield [value, value];
    }
  }

  /**
   * Iterates over the stored values.
   * @returns {AsyncGenerator<Value, void, void>} An async generator of values.
   */
  [Symbol.asyncIterator]() {
    return this.values();
  }

  /**
   * Runs a callback for every stored value.
   * @param {TinySetDbForEachCallback<Value>} callbackFn - Callback invoked per value.
   * @param {unknown} [thisArg] - Value used as `this` inside the callback.
   * @returns {Promise<void>}
   * @throws {TypeError} If `callbackFn` is not a function.
   */
  async forEach(callbackFn, thisArg) {
    if (typeof callbackFn !== 'function') {
      throw new TypeError('The "callbackFn" argument must be a function.');
    }
    await this.hydrate();
    for (const value of [...this.#cache]) {
      callbackFn.call(thisArg, value, value, this);
    }
  }

  /**
   * Returns a new native `Set` with the values of this set and every source.
   * @param {...TinySetDbSource<Value>} sources - Extra value sources.
   * @returns {Promise<Set<Value>>} A new native `Set`.
   */
  async union(...sources) {
    await this.hydrate();
    const result = new Set(this.#cache);
    for (const source of sources) {
      const values = await TinySetDb.#resolveValues(source);
      for (const value of values) result.add(value);
    }
    return result;
  }

  /**
   * Returns a new native `Set` with the values present in both sets.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<Set<Value>>} A new native `Set`.
   */
  async intersection(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    const result = new Set();
    for (const value of this.#cache) {
      if (values.has(value)) result.add(value);
    }
    return result;
  }

  /**
   * Returns a new native `Set` with the values of this set that are not in `other`.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<Set<Value>>} A new native `Set`.
   */
  async difference(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    const result = new Set();
    for (const value of this.#cache) {
      if (!values.has(value)) result.add(value);
    }
    return result;
  }

  /**
   * Returns a new native `Set` with the values present in only one of the sets.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<Set<Value>>} A new native `Set`.
   */
  async symmetricDifference(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    const result = new Set();
    for (const value of this.#cache) {
      if (!values.has(value)) result.add(value);
    }
    for (const value of values) {
      if (!this.#cache.has(value)) result.add(value);
    }
    return result;
  }

  /**
   * Checks whether every value of this set exists in `other`.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<boolean>} `true` when this set is a subset of `other`.
   */
  async isSubsetOf(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    for (const value of this.#cache) {
      if (!values.has(value)) return false;
    }
    return true;
  }

  /**
   * Checks whether every value of `other` exists in this set.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<boolean>} `true` when this set is a superset of `other`.
   */
  async isSupersetOf(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    for (const value of values) {
      if (!this.#cache.has(value)) return false;
    }
    return true;
  }

  /**
   * Checks whether this set and `other` share no values.
   * @param {TinySetDbSource<Value>} other - The other value source.
   * @returns {Promise<boolean>} `true` when the sets are disjoint.
   */
  async isDisjointFrom(other) {
    const values = await TinySetDb.#resolveValues(other);
    await this.hydrate();
    for (const value of this.#cache) {
      if (values.has(value)) return false;
    }
    return true;
  }

  /**
   * Populates the in-memory cache from the persisted records.
   * @param {TinySetDbRecord<Value>[]} records - The persisted records.
   * @returns {void}
   */
  _load(records) {
    for (const record of records.sort((a, b) => a.timestamp - b.timestamp)) {
      this.#cache.add(record.value);
    }
  }

  /**
   * Normalizes a value source into a native `Set`.
   * @template {TableValue} Value
   * @param {TinySetDbSource<Value>} source - The value source to normalize.
   * @returns {Promise<Set<Value>>} A native `Set` with the same values.
   * @throws {TypeError} If `source` is not a `TinySetDb`, a `Set` or an array.
   */
  static async #resolveValues(source) {
    if (source instanceof TinySetDb) {
      return new Set(await source.toArray());
    }
    if (source instanceof Set) {
      return new Set(source);
    }
    if (Array.isArray(source)) {
      return new Set(source);
    }
    throw new TypeError('The "other" argument must be a TinySetDb, a Set, or an Array.');
  }

  /**
   * Runs the optional table validator against a candidate value.
   * @param {Value} value - The candidate value.
   * @returns {void}
   * @throws {TypeError} If the validator rejects the value.
   */
  #assertAccepted(value) {
    if (this.#validate === null) return;
    if (!this.#validate(value)) {
      throw new TypeError(`The value is rejected by the "${this.storeName}" table validator.`);
    }
  }
}

/**
 * A single persisted entry.
 * @template {TableValue} Key
 * @template {*} Value
 * @typedef {Object} TinyMapDbRecord
 * @property {Key} key - The unique key that was stored.
 * @property {Value} value - The value bound to the key.
 * @property {number} timestamp - Unix timestamp (in milliseconds) of the last write.
 */

/**
 * Predicate used to reject entries that must never reach a table.
 * @template {TableValue} Key
 * @template {*} Value
 * @callback TinyMapDbValidator
 * @param {Key} key - The candidate key.
 * @param {Value} value - The candidate value.
 * @returns {boolean} A truthy value when the entry is accepted.
 */

/**
 * @template {TableValue} Key
 * @template {*} Value
 * @typedef {Object} TinyMapDbOptions
 * @property {string} storeName - Name of the object store (table) that backs this map.
 * @property {() => Promise<IDBDatabase>} openDatabase - Resolves with the shared connection.
 * @property {TinyMapDbValidator<Key, Value>|null} [validate] - Optional predicate applied to every entry.
 */

/**
 * Callback invoked by {@link TinyMapDb#forEach}.
 * @template {TableValue} Key
 * @template {*} Value
 * @callback TinyMapDbForEachCallback
 * @param {Value} value - The current value.
 * @param {Key} key - The current key.
 * @param {TinyMapDb<Key, Value>} map - The map being iterated.
 * @returns {void}
 */

/**
 * @template {TableValue} Key
 * @template {*} Value
 * @extends {TinyTableDb}
 * Persistent key/value map backed by a single IndexedDB object store.
 *
 * The class keeps a synchronous in-memory cache so it can be queried from
 * synchronous code while every write is mirrored to IndexedDB, so the data
 * survives a service worker restart.
 */
class TinyMapDb extends TinyTableDb {
  /** @type {TinyMapDbValidator<Key, Value>|null} */
  #validate;

  /** @type {Map<Key, Value>} */
  #cache = new Map();

  /**
   * @param {TinyMapDbOptions<Key, Value>} options - Table options.
   * @throws {TypeError} If `validate` is neither a function nor `null`.
   */
  constructor({ storeName, openDatabase, validate = null }) {
    super({ storeName, openDatabase });
    if (validate !== null && typeof validate !== 'function') {
      throw new TypeError('The "validate" option must be a function or null.');
    }
    this.#validate = validate;
  }

  /**
   * Number of entries currently held in the in-memory cache.
   * @returns {number}
   */
  get size() {
    return this.#cache.size;
  }

  /**
   * Checks whether the given key is already stored.
   * @param {Key} key - The key to look up.
   * @returns {Promise<boolean>} `true` when the key exists.
   * @throws {TypeError} If `key` is not a non-empty string.
   */
  async has(key) {
    assertNonEmptyString(key, 'key');
    await this.hydrate();
    let found = false;
    await this._action(async () => {
      found = this.#cache.has(key);
    });
    return found;
  }

  /**
   * Reads the value bound to the given key.
   * @param {Key} key - The key to look up.
   * @returns {Promise<Value|undefined>} The stored value, or `undefined` when absent.
   * @throws {TypeError} If `key` is not a non-empty string.
   */
  async get(key) {
    assertNonEmptyString(key, 'key');
    await this.hydrate();
    let value;
    await this._action(async () => {
      value = this.#cache.get(key);
    });
    return value;
  }

  /**
   * Binds a value to a key, in the cache and in the object store.
   * @param {Key} key - The key to write.
   * @param {Value} value - The value to bind.
   * @returns {Promise<this>} The same instance, allowing chained calls.
   * @throws {TypeError} If `key` is not a non-empty string.
   * @throws {TypeError} If the table validator rejects the entry.
   */
  async set(key, value) {
    assertNonEmptyString(key, 'key');
    this.#assertAccepted(key, value);
    await this.hydrate();
    await this._action(async () => {
      await this._write(() => this._persist({ key, value, timestamp: Date.now() }));
      this.#cache.set(key, value);
    });
    return this;
  }

  /**
   * Removes an entry from the cache and from the object store.
   * @param {Key} key - The key to remove.
   * @returns {Promise<boolean>} `true` when the key existed and was removed.
   * @throws {TypeError} If `key` is not a non-empty string.
   */
  async delete(key) {
    assertNonEmptyString(key, 'key');
    await this.hydrate();
    let deleted = false;
    await this._action(async () => {
      if (!this.#cache.has(key)) return;
      await this._write(() => this._remove(key));
      this.#cache.delete(key);
      deleted = true;
    });
    return deleted;
  }

  /**
   * Removes every entry from both the cache and the object store.
   * @returns {Promise<void>}
   */
  async clear() {
    await this.hydrate();
    await this._action(async () => {
      await this._write(() => this._clear());
      this.#cache.clear();
    });
  }

  /**
   * Returns a snapshot of every stored entry.
   * @returns {Promise<Array<[Key, Value]>>} A new array with the current entries.
   */
  async toArray() {
    await this.hydrate();
    return [...this.#cache.entries()];
  }

  /**
   * Serialization hook used by `JSON.stringify`.
   * @returns {Promise<Array<[Key, Value]>>} A new array with the current entries.
   */
  async toJSON() {
    return this.toArray();
  }

  /**
   * Iterates over the stored keys.
   * @returns {AsyncGenerator<Key, void, void>} An async generator of keys.
   */
  async *keys() {
    await this.hydrate();
    for (const key of [...this.#cache.keys()]) {
      yield key;
    }
  }

  /**
   * Iterates over the stored values.
   * @returns {AsyncGenerator<Value, void, void>} An async generator of values.
   */
  async *values() {
    await this.hydrate();
    for (const value of [...this.#cache.values()]) {
      yield value;
    }
  }

  /**
   * Iterates over the stored entries.
   * @returns {AsyncGenerator<[Key, Value], void, void>} An async generator of entries.
   */
  async *entries() {
    await this.hydrate();
    for (const entry of [...this.#cache.entries()]) {
      yield entry;
    }
  }

  /**
   * Iterates over the stored entries.
   * @returns {AsyncGenerator<[Key, Value], void, void>} An async generator of entries.
   */
  [Symbol.asyncIterator]() {
    return this.entries();
  }

  /**
   * Runs a callback for every stored entry.
   * @param {TinyMapDbForEachCallback<Key, Value>} callbackFn - Callback invoked per entry.
   * @param {unknown} [thisArg] - Value used as `this` inside the callback.
   * @returns {Promise<void>}
   * @throws {TypeError} If `callbackFn` is not a function.
   */
  async forEach(callbackFn, thisArg) {
    if (typeof callbackFn !== 'function') {
      throw new TypeError('The "callbackFn" argument must be a function.');
    }
    await this.hydrate();
    for (const [key, value] of [...this.#cache]) {
      callbackFn.call(thisArg, value, key, this);
    }
  }

  /**
   * Populates the in-memory cache from the persisted records.
   * @param {TinyMapDbRecord<Key, Value>[]} records - The persisted records.
   * @returns {void}
   */
  _load(records) {
    for (const record of records.sort((a, b) => a.timestamp - b.timestamp)) {
      this.#cache.set(record.key, record.value);
    }
  }

  /**
   * Runs the optional table validator against a candidate entry.
   * @param {Key} key - The candidate key.
   * @param {Value} value - The candidate value.
   * @returns {void}
   * @throws {TypeError} If the validator rejects the entry.
   */
  #assertAccepted(key, value) {
    if (this.#validate === null) return;
    if (!this.#validate(key, value)) {
      throw new TypeError(`The entry is rejected by the "${this.storeName}" table validator.`);
    }
  }
}

/**
 * A single table definition.
 * @typedef {Object} TinyDatabaseTableConfig
 * @property {string} name - Name of the object store.
 * @property {'set'|'map'} type - Kind of table.
 * @property {((...args: any[]) => boolean)|null} [validate] - Optional predicate, read from the latest migration that creates the table.
 */

/**
 * A table can be declared by name or with a full configuration object.
 * @typedef {string|TinyDatabaseTableConfig} TinyDatabaseTableDefinition
 */

/**
 * A single schema migration.
 *
 * The version number of a migration is its 1-based position in the array, so
 * the first entry is version 1, the second is version 2, and so on. Dropping a
 * table and creating it again inside the same entry is the supported way of
 * changing a key path.
 *
 * @typedef {Object} TinyDatabaseMigration
 * @property {TinyDatabaseTableDefinition[]} [create] - Tables created by this version.
 * @property {string[]} [delete] - Names of the tables dropped by this version.
 */

/**
 * A migration whose table definitions were already normalized.
 *
 * Unlike {@link TinyDatabaseMigration}, every property is present and every
 * table is a full configuration object, so the upgrade handler can read
 * `name` and `type` without narrowing the union first.
 *
 * @typedef {Object} TinyDatabaseNormalizedMigration
 * @property {Required<TinyDatabaseTableConfig>[]} create - Tables created by this version.
 * @property {string[]} delete - Names of the tables dropped by this version.
 */

/**
 * A single IndexedDB database that owns several {@link TinySetDb} and
 * {@link TinyMapDb} tables.
 *
 * The migration array is the single source of truth: the schema is the result
 * of replaying every entry, and the database version is the array length. Every
 * table is an object store inside the same database, so a service worker only
 * ever opens one connection.
 */
class TinySetMapDatabase {
  /** @type {string} */
  #name;

  /** @type {number} */
  #version;

  /** @type {Map<string, TinySetDb<any>|TinyMapDb<any, any>>} */
  #tables = new Map();

  /** @type {Promise<IDBDatabase>} */
  #connection;

  /** @type {Promise<void>} */
  #ready;

  /**
   * @param {string} name - Name of the IndexedDB database.
   * @param {TinyDatabaseMigration[]} migrations - Ordered schema history, one entry per version.
   * @throws {TypeError} If `name` is not a non-empty string.
   * @throws {TypeError} If `migrations` is not a non-empty array.
   * @throws {TypeError} If a migration is invalid.
   * @throws {Error} If a table is created twice without being dropped in between.
   */
  constructor(name, migrations) {
    assertNonEmptyString(name, 'name');
    if (!Array.isArray(migrations) || migrations.length === 0) {
      throw new TypeError('The "migrations" argument must be a non-empty array.');
    }

    this.#name = name;
    this.#version = migrations.length;

    const history = migrations.map((migration, index) =>
      TinySetMapDatabase.#normalizeMigration(migration, index),
    );
    const schema = TinySetMapDatabase.#resolveSchema(history);

    this.#connection = TinySetMapDatabase.#openDatabase(name, history);

    for (const definition of schema.values()) {
      const tableCfg = {
        storeName: definition.name,
        validate: definition.validate,
        openDatabase: () => this.#connection,
      };

      if (definition.type === 'map') {
        this.#tables.set(definition.name, new TinyMapDb(tableCfg));
      } else {
        this.#tables.set(definition.name, new TinySetDb(tableCfg));
      }
    }

    this.#ready = this.#connection.then(() =>
      Promise.all([...this.#tables.values()].map((table) => table.hydrate())).then(() => undefined),
    );
    this.#ready.catch(() => {});
  }

  /**
   * Name of the IndexedDB database in use.
   * @returns {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * Schema version of the IndexedDB database in use.
   * @returns {number}
   */
  get version() {
    return this.#version;
  }

  /**
   * Names of every table exposed by this database.
   * @returns {string[]}
   */
  get tableNames() {
    return [...this.#tables.keys()];
  }

  /**
   * Resolves once the connection is open and every table is hydrated.
   * @returns {Promise<void>}
   */
  get ready() {
    return this.#ready;
  }

  /**
   * Returns a table by name.
   * @param {string} tableName - Name of the table.
   * @returns {TinySetDb<any>} The requested table.
   * @throws {TypeError} If `tableName` is not a non-empty string.
   * @throws {RangeError} If the table was not declared in the constructor.
   */
  tableSet(tableName) {
    assertNonEmptyString(tableName, 'tableName');
    const table = this.#tables.get(tableName);
    if (table === undefined) {
      throw new RangeError(`The "${tableName}" table is not declared in this database.`);
    }
    if (!(table instanceof TinySetDb))
      throw new Error(`The "${tableName}" table is not a Set instance.`);
    return table;
  }

  /**
   * Returns a table by name.
   * @param {string} tableName - Name of the table.
   * @returns {TinyMapDb<any, any>} The requested table.
   * @throws {TypeError} If `tableName` is not a non-empty string.
   * @throws {RangeError} If the table was not declared in the constructor.
   */
  tableMap(tableName) {
    assertNonEmptyString(tableName, 'tableName');
    const table = this.#tables.get(tableName);
    if (table === undefined) {
      throw new RangeError(`The "${tableName}" table is not declared in this database.`);
    }
    if (!(table instanceof TinyMapDb))
      throw new Error(`The "${tableName}" table is not a Map instance.`);
    return table;
  }

  /**
   * Checks whether a table was declared in the constructor.
   * @param {string} tableName - Name of the table.
   * @returns {boolean} `true` when the table exists.
   * @throws {TypeError} If `tableName` is not a non-empty string.
   */
  has(tableName) {
    assertNonEmptyString(tableName, 'tableName');
    return this.#tables.has(tableName);
  }

  /**
   * Closes the underlying connection.
   * @returns {Promise<void>}
   */
  async close() {
    const database = await this.#connection;
    database.close();
  }

  /**
   * Normalizes a table definition into a full configuration object.
   * @param {TinyDatabaseTableDefinition} definition - The raw table definition.
   * @returns {Required<TinyDatabaseTableConfig>} The normalized configuration.
   * @throws {TypeError} If the definition is not a string or a valid object.
   */
  static #normalizeTable(definition) {
    if (typeof definition === 'string') {
      return { name: definition, type: 'set', validate: null };
    }
    if (typeof definition !== 'object' || definition === null) {
      throw new TypeError('Each table must be a string or an object with a "name" property.');
    }
    const { name, type, validate = null } = definition;
    assertNonEmptyString(name, 'table.name');
    if (type !== 'set' && type !== 'map') {
      throw new TypeError(`The "type" option of the "${name}" table must be "set" or "map".`);
    }
    if (validate !== null && typeof validate !== 'function') {
      throw new TypeError(`The "validate" option of the "${name}" table must be a function.`);
    }
    return { name, type, validate };
  }

  /**
   * Opens the IndexedDB database and replays every pending migration.
   * @param {string} name - Name of the database.
   * @param {TinyDatabaseNormalizedMigration[]} history - Normalized migrations, in order.
   * @returns {Promise<IDBDatabase>} The open database connection.
   */
  static #openDatabase(name, history) {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new ReferenceError('IndexedDB is not available in the current environment.'));
        return;
      }

      const request = indexedDB.open(name, history.length);

      request.onupgradeneeded = (event) => {
        try {
          for (let version = event.oldVersion + 1; version <= history.length; version += 1) {
            TinySetMapDatabase.#applyMigration(request.result, history[version - 1]);
          }
        } catch (error) {
          reject(error);
          request.transaction?.abort();
        }
      };
      request.onsuccess = () => {
        const database = request.result;
        database.onversionchange = () => database.close();
        resolve(database);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Applies a single migration to the version change transaction.
   * @param {IDBDatabase} database - The database being upgraded.
   * @param {TinyDatabaseNormalizedMigration} migration - The normalized migration.
   * @returns {void}
   */
  static #applyMigration(database, migration) {
    for (const name of migration.delete) {
      if (database.objectStoreNames.contains(name)) {
        database.deleteObjectStore(name);
      }
    }

    for (const definition of migration.create) {
      database.createObjectStore(definition.name, {
        keyPath: definition.type === 'map' ? 'key' : 'value',
      });
    }
  }

  /**
   * Validates a single migration and normalizes its table definitions.
   * @param {TinyDatabaseMigration} migration - The migration to validate.
   * @param {number} index - Zero-based position of the migration.
   * @returns {TinyDatabaseNormalizedMigration} The normalized migration.
   * @throws {TypeError} If the migration is not an object.
   * @throws {TypeError} If `create` is not an array of table definitions.
   * @throws {TypeError} If `delete` is not an array of non-empty strings.
   */
  static #normalizeMigration(migration, index) {
    if (typeof migration !== 'object' || migration === null) {
      throw new TypeError(`The migration at index ${index} must be an object.`);
    }

    const { create = [], delete: drop = [] } = migration;

    if (!Array.isArray(create)) {
      throw new TypeError(`The "create" list of the migration at index ${index} must be an array.`);
    }
    if (!Array.isArray(drop)) {
      throw new TypeError(`The "delete" list of the migration at index ${index} must be an array.`);
    }

    for (const name of drop) {
      assertNonEmptyString(name, `migrations[${index}].delete[]`);
    }

    return {
      create: create.map((table) => TinySetMapDatabase.#normalizeTable(table)),
      delete: [...drop],
    };
  }

  /**
   * Replays every migration and returns the resulting table set.
   * @param {TinyDatabaseNormalizedMigration[]} history - Normalized migrations, in order.
   * @returns {Map<string, Required<TinyDatabaseTableConfig>>} The final schema, keyed by table name.
   * @throws {Error} If a table is created twice without being dropped in between.
   */
  static #resolveSchema(history) {
    /** @type {Map<string, Required<TinyDatabaseTableConfig>>} */
    const schema = new Map();

    for (const migration of history) {
      for (const name of migration.delete) {
        schema.delete(name);
      }

      for (const definition of migration.create) {
        if (schema.has(definition.name)) {
          throw new Error(`The "${definition.name}" table is created twice.`);
        }
        schema.set(definition.name, definition);
      }
    }

    return schema;
  }
}

export { TinySetMapDatabase, TinySetDb, TinyMapDb, TinyTableDb };
