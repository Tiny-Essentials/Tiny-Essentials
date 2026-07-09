import { EventEmitter } from 'events';
import { isJsonObject } from '../basics/objChecker.mjs';
import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyLocalStorage');

/** @type {Map<any, EncodeFn>} */
const customEncoders = new Map();

/** @type {Map<any, DecodeFn>} */
const customDecoders = new Map();

/** @type {Set<any>} */
const customTypesFreezed = new Set([
  'string',
  'boolean',
  'object',
  'array',
  String,
  Boolean,
  Number,
  Object,
  Array,
  BigInt,
  Symbol,
]);

/**
 * A function that encodes a value into a serializable JSON-compatible format.
 *
 * @callback EncodeFn
 * @param {any} value - The value to encode.
 * @param {encodeSpecialJson} encodeSpecialJson - Recursive encoder helper.
 * @returns {any} The encoded value.
 */

/**
 * An object that defines how to check and decode a specific serialized type.
 *
 * @typedef {Object} DecodeFn
 * @property {(value: any) => any} check - Checks if the value matches the custom encoded structure.
 * @property {(value: any, decodeSpecialJson: decodeSpecialJson) => any} decode - Decodes the structure back into its original form.
 */

/**
 * Encodes extended JSON-compatible structures recursively.
 * @callback encodeSpecialJson
 * @param {any} value
 * @returns {any}
 */

/**
 * Decodes extended JSON-compatible structures recursively.
 * @callback decodeSpecialJson
 * @param {any} value
 * @returns {any}
 */

/**
 * Represents a value that can be safely stored and restored using JSON in `localStorage`,
 * including structures like arrays, plain objects, Map and Set.
 *
 * - `Record<string|number|symbol, any>` → plain object (e.g., `{ key: value }`)
 * - `any[]` → array of any JSON-serializable values
 * - `Map<string|number|symbol, any>` → converted to `{ __map__: true, data: [[k, v], ...] }`
 * - `Set<any>` → converted to `{ __set__: true, data: [v1, v2, ...] }`
 *
 * These conversions allow complex structures to be restored after JSON serialization.
 *
 * @typedef {(Record<string|number|symbol, any> | any[] | Map<string|number|symbol, any> | Set<any>)} LocalStorageJsonValue
 */

/**
 * A powerful wrapper for Web Storage (`localStorage` or `sessionStorage`) that supports
 * type-safe methods and full JSON-like structure encoding and decoding.
 *
 * `TinyLocalStorage` allows storing and retrieving complex types such as:
 * - `Map`, `Set`
 * - `Date`, `RegExp`
 * - `BigInt`, `Symbol`
 * - `undefined`, `null`
 * - Plain objects and arrays
 *
 * Includes:
 * - Type-specific `set` and `get` methods (`setDate`, `getBool`, etc.)
 * - `getValue()` to retrieve any structure regardless of type
 * - Auto-encoding/decoding with support for custom types via `registerJsonType`
 * - Built-in event system to listen for changes
 * - Optional fallback values on decoding errors
 *
 * Supports registering and unregistering custom types via:
 * - `registerJsonType(...)`
 * - `deleteJsonType(...)`
 *
 * This class is suitable for applications that require structured persistence in the browser.
 */
class TinyLocalStorage extends EventEmitter {
  /**
   * Checks whether a JSON-serializable type is already registered.
   *
   * @param {any} type - The type identifier, which can be a string (e.g., `"bigint"`, `"symbol"`)
   *                     or a reference to a class/constructor function.
   * @returns {boolean} True if the type has both an encoder and decoder registered.
   */
  static hasJsonType(type) {
    return (customEncoders.has(type) && customDecoders.has(type)) || customTypesFreezed.has(type);
  }

  /**
   * Registers a new JSON-serializable type with its encoder and decoder.
   *
   * @param {any} type - The type identifier, which can be a string (e.g., `"bigint"`, `"symbol"`)
   *                     or a reference to a class/constructor function.
   * @param {EncodeFn} encodeFn - A function that receives a value of this type and returns a JSON-safe representation.
   * @param {DecodeFn} decodeFn - An object with `check(value)` to identify this type and `decode(value)` to restore it.
   * @param {boolean} [freezeType=false] - If true, prevents this type from being unregistered later.
   * @throws {Error} Throws an error if the type is frozen and cannot be registered.
   */
  static registerJsonType(type, encodeFn, decodeFn, freezeType = false) {
    if (customTypesFreezed.has(type))
      throw new Error(`Cannot register type "${type}" because it is frozen.`);
    customEncoders.set(type, encodeFn);
    customDecoders.set(type, decodeFn);
    if (freezeType) customTypesFreezed.add(type);
  }

  /**
   * Unregisters a previously registered custom type from the encoding/decoding system.
   *
   * @param {any} type - The primitive name or constructor reference used in the registration.
   * @returns {boolean} Returns true if the type existed and was removed, or false if it wasn't found.
   * @throws {Error} Throws an error if the type is frozen and cannot be unregistered.
   */
  static deleteJsonType(type) {
    if (customTypesFreezed.has(type))
      throw new Error(`Cannot remove type "${type}" because it is frozen.`);
    let isDeleted = false;
    if (customEncoders.delete(type)) isDeleted = true;
    if (customDecoders.delete(type)) isDeleted = true;
    return isDeleted;
  }

  //////////////////////////////////////////////////////

  /**
   * Recursively serializes a value to a JSON-compatible format.
   *
   * This includes custom types (via `registerJsonType`), plus support for:
   * - `undefined` → `{ __undefined__: true }`
   * - `null` → `{ __null__: true }`
   *
   * @type {encodeSpecialJson}
   */
  static encodeSpecialJson(value) {
    if (typeof value === 'undefined') return { __undefined__: true };
    if (value === null) return { __null__: true };
    for (const [type, encoder] of customEncoders.entries()) {
      if ((typeof type !== 'string' && value instanceof type) || typeof value === type) {
        return encoder(value, TinyLocalStorage.encodeSpecialJson);
      }
    }

    if (Array.isArray(value)) {
      return value.map(TinyLocalStorage.encodeSpecialJson);
    }

    if (isJsonObject(value)) {
      const encoded = {};
      for (const key in value) {
        // @ts-ignore
        encoded[key] = TinyLocalStorage.encodeSpecialJson(value[key]);
      }
      return encoded;
    }

    return value;
  }

  /**
   * Recursively deserializes a JSON-compatible value into its original structure.
   *
   * Automatically handles:
   * - `__undefined__` → `undefined`
   * - `__null__` → `null`
   * - Any type registered via `registerJsonType`
   *
   * @type {decodeSpecialJson}
   */
  static decodeSpecialJson(value) {
    const isJson = isJsonObject(value);
    if (isJson) {
      if (value.__undefined__) return undefined;
      if (value.__null__) return null;
    }

    if (Array.isArray(value)) {
      return value.map(TinyLocalStorage.decodeSpecialJson);
    }

    if (isJson) {
      for (const [type, decoder] of customDecoders.entries()) {
        if (decoder.check && decoder.check(value)) {
          return decoder.decode(value, TinyLocalStorage.decodeSpecialJson);
        }
      }

      const decoded = {};
      for (const key in value) {
        // @ts-ignore
        decoded[key] = TinyLocalStorage.decodeSpecialJson(value[key]);
      }
      return decoded;
    }

    return value;
  }

  //////////////////////////////////////////////////////

  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /** @type {Storage} */
  #localStorage = window.localStorage;

  /** @type {string|null} */
  #dbKey = null;

  /** @type {number} */
  #version = 0;

  /** @type {(ev: StorageEvent) => any} */
  #storageEvent = (ev) => this.emit('storage', ev);

  /**
   * Initializes the TinyLocalStorage instance and sets up cross-tab sync.
   *
   * Adds listener for the native `storage` event to support tab synchronization.
   * @param {string} [dbName] - Unique database name.
   */
  constructor(dbName) {
    super();
    if (typeof dbName !== 'undefined' && typeof dbName !== 'string')
      throw new TypeError('TinyLocalStorage: dbName must be a string if provided.');
    if (typeof dbName === 'string') this.#dbKey = `LSDB::${dbName}`;
    window.addEventListener('storage', this.#storageEvent);
  }

  /**
   * Validates that a given key does not conflict with internal database keys.
   *
   * This method is used to prevent accidental overwriting of reserved `LSDB::` keys
   * in `localStorage`, which are used internally by TinyLocalStorage for versioning
   * and data management.
   *
   * @param {string} name - The key to validate before writing to localStorage.
   * @throws {Error} If the key starts with `LSDB::`.
   */
  #isProtectedDbKey(name) {
    if (typeof name === 'string' && name.startsWith('LSDB::'))
      throw new Error(`TinyLocalStorage: Key "${name}" may conflict with reserved dbKeys.`);
  }

  /**
   * Updates the version of the storage and triggers migration if needed.
   *
   * @param {number} version - Desired version of the database.
   * @param {(oldVersion: number, newVersion: number) => void} onUpgrade - Callback to perform migration logic.
   * @throws {Error} If the database key has not been initialized.
   * @throws {TypeError} If `version` is not a valid positive number.
   * @throws {TypeError} If `onUpgrade` is not a function.
   */
  updateStorageVersion(version, onUpgrade) {
    checkDestroy(this.#destroyed);
    if (typeof this.#dbKey !== 'string')
      throw new Error(
        'TinyLocalStorage: Database key is not initialized. Set a valid dbName in the constructor.',
      );
    if (typeof version !== 'number' || Number.isNaN(version) || version < 1)
      throw new TypeError('TinyLocalStorage: version must be a positive number.');
    if (typeof onUpgrade !== 'function')
      throw new TypeError('TinyLocalStorage: onUpgrade must be a function.');

    // @ts-ignore
    const savedVersion = parseInt(localStorage.getItem(this.#dbKey), 10) || 0;
    if (typeof savedVersion !== 'number' || Number.isNaN(savedVersion) || savedVersion < 0)
      throw new TypeError('TinyLocalStorage: saved version in localStorage is not a valid number.');

    if (version < savedVersion)
      throw new Error(
        `TinyLocalStorage: Cannot downgrade database version from ${savedVersion} to ${version}.`,
      );

    if (version > savedVersion) {
      onUpgrade(savedVersion, version);
      localStorage.setItem(this.#dbKey, String(version));
      this.#version = version;
    }
  }

  /**
   * Gets the current database key used in localStorage.
   *
   * @returns {string|null} The database key, or null if not set.
   */
  getDbKey() {
    checkDestroy(this.#destroyed);
    return this.#dbKey;
  }

  /**
   * Gets the current version of the database.
   *
   * @returns {number} The current version number.
   */
  getVersion() {
    checkDestroy(this.#destroyed);
    return this.#version;
  }

  /**
   * Defines a custom storage interface (e.g. `sessionStorage`).
   *
   * @param {Storage} localstorage - A valid Storage object (localStorage or sessionStorage).
   */
  setLocalStorage(localstorage) {
    checkDestroy(this.#destroyed);
    if (!(localstorage instanceof Storage))
      throw new TypeError('Argument must be a valid instance of Storage.');
    this.#localStorage = localstorage;
  }

  /**
   * Checks if `localStorage` is supported by the current environment.
   *
   * @returns {boolean} True if `localStorage` exists, false otherwise.
   */
  localStorageExists() {
    checkDestroy(this.#destroyed);
    return this.#localStorage instanceof Storage;
  }

  /**
   * Automatically serializes nested instances.
   *
   * @param {string} name - The key under which to store the data.
   * @param {*} data - The data to be serialized.
   * @returns {*}
   */
  #setJson(name, data) {
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    return TinyLocalStorage.encodeSpecialJson(data);
  }

  /**
   * Stores a JSON-compatible value in `localStorage`.
   *
   * Automatically serializes nested `Map` and `Set` instances.
   *
   * @param {string} name - The key under which to store the data.
   * @param {LocalStorageJsonValue} data - The data to be serialized and stored.
   */
  setJson(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (
      !isJsonObject(data) &&
      !Array.isArray(data) &&
      !(data instanceof Map) &&
      !(data instanceof Set)
    ) {
      throw new TypeError('The storage value is not a valid JSON-compatible structure.');
    }
    const encoded = this.#setJson(name, data);
    this.emit('setJson', name, data);
    return this.#localStorage.setItem(name, JSON.stringify(encoded));
  }

  /**
   * Retrieves a value from `localStorage`.
   *
   * Automatically restores nested instances.
   *
   * @param {string} name - The key to retrieve.
   * @param {'array'|'obj'|'map'|'set'|'null'} [defaultData] - Default fallback format if value is invalid.
   * @returns {{ decoded: any, fallback: any }} The parsed object or fallback.
   */
  #getJson(name, defaultData) {
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');

    const raw = this.#localStorage.getItem(name);
    const fallbackTypes = {
      obj: () => ({}),
      array: () => [],
      map: () => new Map(),
      set: () => new Set(),
    };

    const fallback =
      // @ts-ignore
      typeof fallbackTypes[defaultData] === 'function' ? fallbackTypes[defaultData]() : null;

    let parsed;

    try {
      // @ts-ignore
      parsed = JSON.parse(raw);
    } catch {
      // @ts-ignore
      return fallback;
    }

    return { decoded: TinyLocalStorage.decodeSpecialJson(parsed), fallback };
  }

  /**
   * Retrieves and parses a JSON value from `localStorage`.
   *
   * Automatically restores nested `Map` and `Set` instances.
   *
   * @param {string} name - The key to retrieve.
   * @param {'array'|'obj'|'map'|'set'|'null'} [defaultData] - Default fallback format if value is invalid.
   * @returns {LocalStorageJsonValue|null} The parsed object or fallback.
   */
  getJson(name, defaultData) {
    checkDestroy(this.#destroyed);
    const { decoded, fallback } = this.#getJson(name, defaultData);
    if (
      decoded instanceof Map ||
      decoded instanceof Set ||
      Array.isArray(decoded) ||
      isJsonObject(decoded)
    )
      return decoded;
    return fallback;
  }

  /**
   * Stores a Date in localStorage.
   * @param {string} name
   * @param {Date} data
   */
  setDate(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (!(data instanceof Date)) throw new TypeError('Value must be a Date.');
    const encoded = this.#setJson(name, data);
    this.emit('setDate', name, data);
    return this.#localStorage.setItem(name, JSON.stringify(encoded));
  }

  /**
   * Retrieves a Date from localStorage.
   * @param {string} name
   * @returns {Date|null}
   */
  getDate(name) {
    checkDestroy(this.#destroyed);
    const value = this.#getJson(name).decoded;
    return value instanceof Date ? value : null;
  }

  /**
   * Stores a RegExp in localStorage.
   * @param {string} name
   * @param {RegExp} data
   */
  setRegExp(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (!(data instanceof RegExp)) throw new TypeError('Value must be a RegExp.');
    const encoded = this.#setJson(name, data);
    this.emit('setRegExp', name, data);
    return this.#localStorage.setItem(name, JSON.stringify(encoded));
  }

  /**
   * Retrieves a RegExp from localStorage.
   * @param {string} name
   * @returns {RegExp|null}
   */
  getRegExp(name) {
    checkDestroy(this.#destroyed);
    const value = this.#getJson(name).decoded;
    return value instanceof RegExp ? value : null;
  }

  /**
   * Stores a BigInt in localStorage.
   * @param {string} name
   * @param {bigint} data
   */
  setBigInt(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof data !== 'bigint') throw new TypeError('Value must be a BigInt.');
    const encoded = this.#setJson(name, data);
    this.emit('setBigInt', name, data);
    return this.#localStorage.setItem(name, JSON.stringify(encoded));
  }

  /**
   * Retrieves a BigInt from localStorage.
   * @param {string} name
   * @returns {bigint|null}
   */
  getBigInt(name) {
    checkDestroy(this.#destroyed);
    const value = this.#getJson(name).decoded;
    return typeof value === 'bigint' ? value : null;
  }

  /**
   * Stores a Symbol in localStorage.
   * Only global symbols (`Symbol.for`) will preserve the key.
   * @param {string} name
   * @param {symbol} data
   */
  setSymbol(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof data !== 'symbol') throw new TypeError('Value must be a Symbol.');
    const encoded = this.#setJson(name, data);
    this.emit('setSymbol', name, data);
    return this.#localStorage.setItem(name, JSON.stringify(encoded));
  }

  /**
   * Retrieves a Symbol from localStorage.
   * @param {string} name
   * @returns {symbol|null}
   */
  getSymbol(name) {
    checkDestroy(this.#destroyed);
    const value = this.#getJson(name).decoded;
    return typeof value === 'symbol' ? value : null;
  }

  /**
   * Retrieves a value from `localStorage`.
   *
   * @param {string} name - The key to retrieve.
   * @returns {any} The stored value or null if not found.
   */
  getValue(name) {
    checkDestroy(this.#destroyed);
    return this.#getJson(name).decoded ?? null;
  }

  /**
   * Stores a raw string value in `localStorage`.
   *
   * @param {string} name - The key to use.
   * @param {any} data - The data to store.
   */
  setItem(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    this.emit('setItem', name, data);
    return this.#localStorage.setItem(name, data);
  }

  /**
   * Retrieves a raw string value from `localStorage`.
   *
   * @param {string} name - The key to retrieve.
   * @returns {string|null} The stored value or null if not found.
   */
  getItem(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    return this.#localStorage.getItem(name);
  }

  /**
   * Stores a string in `localStorage`, ensuring the data is a valid string.
   *
   * @param {string} name - The key to store the string under.
   * @param {string} data - The string to store.
   */
  setString(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    if (typeof data !== 'string') throw new TypeError('Value must be a string.');

    this.emit('setString', name, data);
    return this.#localStorage.setItem(
      name,
      JSON.stringify({
        __string__: true,
        value: data,
      }),
    );
  }

  /**
   * Retrieves a string value from `localStorage`.
   *
   * @param {string} name - The key to retrieve.
   * @returns {string|null} The string if valid, or null.
   */
  getString(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    let value = this.#localStorage.getItem(name);
    try {
      /** @type {{ value: string; __string__: boolean }} */
      // @ts-ignore
      value = JSON.parse(value);
      if (!isJsonObject(value) || !value.__string__ || typeof value.value !== 'string') return null;
      value = value.value;
    } catch {
      value = null;
    }
    if (typeof value === 'string') return value;
    return null;
  }

  /**
   * Stores a number value in `localStorage`.
   *
   * @param {string} name - The key to use.
   * @param {number} data - The number to store.
   */
  setNumber(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    if (typeof data !== 'number') throw new TypeError('Value must be a number.');
    this.emit('setNumber', name, data);
    return this.#localStorage.setItem(name, String(data));
  }

  /**
   * Retrieves a number from `localStorage`.
   *
   * @param {string} name - The key to retrieve.
   * @returns {number|null} The number or null if invalid.
   */
  getNumber(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');

    /** @type {number|string|null} */
    let number = this.#localStorage.getItem(name);
    if (typeof number === 'number') return number;
    if (typeof number === 'string' && number.length > 0) {
      number = parseFloat(number);
      if (!Number.isNaN(number)) return number;
    }
    return null;
  }

  /**
   * Stores a boolean value in `localStorage`.
   *
   * @param {string} name - The key to use.
   * @param {boolean} data - The boolean value to store.
   */
  setBool(name, data) {
    checkDestroy(this.#destroyed);
    this.#isProtectedDbKey(name);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');
    if (typeof data !== 'boolean') throw new TypeError('Value must be a boolean.');
    this.emit('setBool', name, data);
    return this.#localStorage.setItem(name, String(data));
  }

  /**
   * Retrieves a boolean value from `localStorage`.
   *
   * @param {string} name - The key to retrieve.
   * @returns {boolean|null} The boolean or null if invalid.
   */
  getBool(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');

    const value = this.#localStorage.getItem(name);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      if (value === 'true') return true;
      if (value === 'false') return false;
    }

    return null;
  }

  /**
   * Removes a value from `localStorage`.
   *
   * @param {string} name - The key to remove.
   */
  removeItem(name) {
    checkDestroy(this.#destroyed);
    if (typeof name !== 'string' || !name.length)
      throw new TypeError('Key must be a non-empty string.');

    this.emit('removeItem', name);
    return this.#localStorage.removeItem(name);
  }

  /**
   * Clears all data from `localStorage`.
   */
  clearLocalStorage() {
    checkDestroy(this.#destroyed);
    return this.#localStorage.clear();
  }

  /**
   * Destroys the storage instance by removing the storage event listener.
   */
  destroy() {
    if (this.#destroyed) return;
    window.removeEventListener('storage', this.#storageEvent);
    this.removeAllListeners();

    // Lock the instance
    this.#destroyed = true;
  }
}

// First registers

// Map
TinyLocalStorage.registerJsonType(
  Map,
  (value, encodeSpecialJson) => ({
    __map__: true,
    data: Array.from(value.entries()).map(([k, v]) => [k, encodeSpecialJson(v)]),
  }),
  {
    check: (value) => value.__map__,
    /** @param {{ data: any[] }} value */
    decode: (value, decodeSpecialJson) =>
      new Map(value.data.map(([k, v]) => [k, decodeSpecialJson(v)])),
  },
  true,
);

// Set
TinyLocalStorage.registerJsonType(
  Set,
  (value, encodeSpecialJson) => ({
    __set__: true,
    data: Array.from(value).map(encodeSpecialJson),
  }),
  {
    check: (value) => value.__set__,
    decode: (value, decodeSpecialJson) => new Set(value.data.map(decodeSpecialJson)),
  },
  true,
);

// Date
TinyLocalStorage.registerJsonType(
  Date,
  (value) => ({
    __date__: true,
    value: value.toISOString(),
  }),
  {
    check: (value) => value.__date__,
    decode: (value) => new Date(value.value),
  },
  true,
);

// Regex
TinyLocalStorage.registerJsonType(
  RegExp,
  (value) => ({
    __regexp__: true,
    source: value.source,
    flags: value.flags,
  }),
  {
    check: (value) => value.__regexp__,
    decode: (value) => new RegExp(value.source, value.flags),
  },
  true,
);

// Number
TinyLocalStorage.registerJsonType(
  'number',
  (value) => ({
    __number__: true,
    value: value.toString(),
  }),
  {
    check: (value) => value.__number__,
    decode: (value) => Number(value.value),
  },
  true,
);

// Big Int
TinyLocalStorage.registerJsonType(
  'bigint',
  (value) => ({
    __bigint__: true,
    value: value.toString(),
  }),
  {
    check: (value) => value.__bigint__,
    decode: (value) => BigInt(value.value),
  },
  true,
);

// Symbol
TinyLocalStorage.registerJsonType(
  'symbol',
  (value) => ({
    __symbol__: true,
    key: Symbol.keyFor(value) ?? value.description ?? null,
  }),
  {
    check: (value) => value.__symbol__,
    decode: (value) => {
      const key = value.key;
      return key != null ? Symbol.for(key) : Symbol();
    },
  },
  true,
);

export default TinyLocalStorage;
