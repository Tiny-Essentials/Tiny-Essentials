/**
 * @fileoverview Array comparison utility with deep object diffing capabilities.
 * @module TinyArrayComparator
 */

/**
 * @template Item
 * @typedef {Object} HashEntry
 * @property {Item} item - The original item stored in the map.
 * @property {string} hash - The calculated hash representing the item's value.
 */

// STRUCTURAL TRANSFORMATION & TYPE DERIVATION:
// Here we remove 'any' and use 'Partial<Item>' and Mapped Types.
// VSCode/Intellisense will now know exactly which keys exist within 'added', 'deleted', and 'modified',
// deriving the types directly from the data structure you pass to the class.

/**
 * @template Item
 * @typedef {Object} ObjectDiff
 * @property {Partial<Item>} added - Properties added in the new object.
 * @property {Partial<Item>} deleted - Properties removed from the old object.
 * @property {Partial<{ [K in keyof Item]: { oldValue: Item[K], newValue: Item[K] } }>} modified - Properties that changed value.
 * @property {Partial<{ [K in keyof Item]: ObjectDiff<Item[K]> }>} nested - Nested differences for nested objects.
 */

// ADVANCED PATTERN MATCHING:
// We use a discriminated union (status) so the IDE knows that 'oldItem' and 'details'
// only make sense (or are more relevant) in contexts where the change requires it.

/**
 * @template Item
 * @typedef {Object} DiffResult
 * @property {Item} item - The item that was affected.
 * @property {Item} [oldItem] - The original item before the change (only for 'edited' status).
 * @property {'added'|'deleted'|'edited'} status - The nature of the change.
 * @property {ObjectDiff<Item>} [details] - Detailed property changes (only if status is 'edited' and deepComparison is enabled).
 */

/**
 * @template Item
 * @typedef {Object} InternalState
 * Holds the internal tracking variables during the comparison process.
 * @property {Map<string|number, HashEntry<Item>>} oldItemsMap - A map storing the identity key as the key and the hash entry as the value.
 * @property {Array<DiffResult<Item>>} affectedItems - The final array that collects added, deleted, or edited items.
 */

/**
 * The final array that collects added, deleted, or edited items.
 * @template Item
 * @typedef {Array<DiffResult<Item>>} AffectedItems
 */

// ZERO-REDUNDANCY RULE:
// If 'Item' is a known object, 'idKey' will suggest the valid keys of that object (keyof Item).
// The '(string & {})' is an advanced trick to allow the user to type other strings if the base type is dynamic,
// without losing autocomplete for the known keys.

/**
 * Options to configure the comparator.
 * @template Item
 * @typedef {Object} ComparatorOptions
 * @property {keyof Item | (string & {})} [idKey='id'] - The property name used as a unique identifier for objects to detect edits.
 * @property {boolean} [deepComparison=true] - If true, provides detailed property-level diffs for edited objects.
 */

/**
 * Compares two arrays efficiently by hashing their items to detect additions, deletions, and edits.
 * @template {any} ArrayItem
 */
class TinyArrayComparator {
  /**
   * Generates a simple 32-bit integer hash converted to a base36 string.
   * @param {any} item - The item to be hashed.
   * @returns {string} The unique hash representing the item's value.
   * @throws {TypeError} Throws a TypeError if the item cannot be stringified due to circular references.
   */
  static generateHash(item) {
    let stringified;
    try {
      stringified = typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item);
    } catch (error) {
      throw new TypeError(
        'Failed to stringify item for hashing. Ensure the object does not have circular references.',
      );
    }

    let hash = 0;
    for (let i = 0, len = stringified.length; i < len; i++) {
      const char = stringified.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }

    return hash.toString(36);
  }

  /**
   * Internal storage for the base array.
   * @type {ArrayItem[]}
   */
  #oldArray = [];

  /**
   * The key used to track identity of an object (e.g., 'id', 'uuid').
   * @type {string|null}
   */
  #idKey = null;

  /**
   * Detects whether deep comparison is enabled.
   * @type {boolean}
   */
  #deepComparison = true;

  /**
   * Gets the current identity key.
   * @returns {string|null}
   */
  get idKey() {
    return this.#idKey;
  }

  /**
   * Sets the identity key used for object comparison.
   * @param {string|null} value - The property name to use as an identifier.
   * @throws {TypeError} Throws a TypeError if the value is not a string.
   */
  set idKey(value) {
    if (value !== null && typeof value !== 'string')
      throw new TypeError('The idKey must be a string or null.');
    this.#idKey = value;
  }

  /**
   * Gets whether deep comparison is enabled.
   * @returns {boolean}
   */
  get deepComparison() {
    return this.#deepComparison;
  }

  /**
   * Sets whether deep comparison is enabled.
   * @param {boolean} value - The configuration value.
   */
  set deepComparison(value) {
    if (typeof value !== 'boolean')
      throw new TypeError('The deepComparison option must be a boolean.');
    this.#deepComparison = value;
  }

  /**
   * Gets the current base array used for comparisons.
   * @returns {ArrayItem[]} The current initial state of the array.
   */
  get oldArray() {
    return this.#oldArray;
  }

  /**
   * Sets a new base array for future comparisons.
   * @param {ArrayItem[]} oldArray - The initial state of the array.
   * @throws {TypeError} Throws an error if the provided value is not an array.
   */
  set oldArray(oldArray) {
    if (!Array.isArray(oldArray))
      throw new TypeError('The provided oldArray must be a valid Array.');
    this.#oldArray = oldArray;
  }

  /**
   * Initializes the comparator with an optional base array and options.
   * @param {ArrayItem[]} [oldArray] - The initial state of the array to be stored.
   * @param {ComparatorOptions<ArrayItem>} [options={}] - Configuration options for the comparator.
   */
  constructor(oldArray, options = {}) {
    if (typeof oldArray !== 'undefined') this.oldArray = oldArray;

    if (typeof options.idKey === 'string') {
      this.idKey = options.idKey;
    }

    if (typeof options.deepComparison === 'boolean') {
      this.deepComparison = options.deepComparison;
    }
  }

  /**
   * Proxy to generates a hash converted to a string.
   * @param {ArrayItem} item - The item to be hashed.
   * @returns {string} The unique hash representing the item's value.
   * @private
   */
  _generateHash(item) {
    return TinyArrayComparator.generateHash(item);
  }

  /**
   * Recursively compares two objects to find differences.
   * @param {Object} oldObj - The original object.
   * @param {Object} newObj - The modified object.
   * @returns {ObjectDiff<ArrayItem>} A structured object containing the differences.
   */
  #getDeepDiff(oldObj, newObj) {
    /** @type {ObjectDiff<ArrayItem>} */
    const diff = {
      added: {},
      deleted: {},
      modified: {},
      nested: {},
    };

    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      // @ts-ignore
      const oldVal = oldObj[key];
      // @ts-ignore
      const newVal = newObj[key];

      if (!(key in oldObj)) {
        // Key exists in new object but not in old
        // @ts-ignore
        diff.added[key] = newVal;
      } else if (!(key in newObj)) {
        // Key exists in old object but not in new
        // @ts-ignore
        diff.deleted[key] = oldVal;
      } else if (
        typeof oldVal === 'object' &&
        oldVal !== null &&
        typeof newVal === 'object' &&
        newVal !== null &&
        !Array.isArray(oldVal) &&
        !Array.isArray(newObj)
      ) {
        // Both are objects, recurse
        const nestedDiff = this.#getDeepDiff(oldVal, newVal);
        // Only add nested if it actually contains differences
        if (
          Object.keys(nestedDiff.added).length > 0 ||
          Object.keys(nestedDiff.deleted).length > 0 ||
          Object.keys(nestedDiff.modified).length > 0 ||
          Object.keys(nestedDiff.nested).length > 0
        ) {
          // @ts-ignore
          diff.nested[key] = nestedDiff;
        }
      } else if (oldVal !== newVal) {
        // Values are different and not objects (or one is an array)
        // @ts-ignore
        diff.modified[key] = {
          oldValue: oldVal,
          newValue: newVal,
        };
      }
    }
    return diff;
  }

  /**
   * Compares the stored older array with a newer array and identifies added, deleted, or edited items.
   *
   * @param {ArrayItem[]} newArray - The modified state of the array.
   * @returns {AffectedItems<ArrayItem>} An array containing the affected items and their status.
   * @throws {TypeError} Throws an error if the provided value is not an array.
   */
  compare(newArray) {
    if (!Array.isArray(newArray))
      throw new TypeError('The provided newArray must be a valid Array.');

    /** @type {InternalState<ArrayItem>} */
    const state = {
      oldItemsMap: new Map(),
      affectedItems: [],
    };

    // Step 1: Hash and store all items from the first array
    for (const item of this.#oldArray) {
      const hash = this._generateHash(item);

      // Identity is determined by the idKey. Otherwise, it relies purely on the hash.
      const identityKey =
        this.#idKey !== null && item !== null && typeof item === 'object' && this.#idKey in item
          ? // @ts-ignore
            item[this.#idKey]
          : hash;

      state.oldItemsMap.set(identityKey, { item, hash });
    }

    // Step 2: Iterate through the second array to find matches, edits or additions
    for (const item of newArray) {
      const hash = this._generateHash(item);

      const identityKey =
        this.#idKey !== null && item !== null && typeof item === 'object' && this.#idKey in item
          ? // @ts-ignore
            item[this.#idKey]
          : hash;

      const oldData = state.oldItemsMap.get(identityKey);
      if (oldData) {
        if (oldData.hash === hash) {
          // Item exists and the content is identical. Unchanged.
          state.oldItemsMap.delete(identityKey);
        } else {
          // Item has the same identity but a different hash. It was edited.
          /** @type {DiffResult<ArrayItem>} */
          const diffResult = {
            item: item,
            oldItem: oldData.item,
            status: 'edited',
          };

          // Perform deep comparison if enabled and items are objects
          if (
            this.#deepComparison &&
            typeof item === 'object' &&
            item !== null &&
            typeof oldData.item === 'object' &&
            oldData.item !== null
          ) {
            diffResult.details = this.#getDeepDiff(oldData.item, item);
          }

          state.affectedItems.push(diffResult);
          state.oldItemsMap.delete(identityKey);
        }
      } else {
        // Item identity was not found in the old array. It is an addition.
        state.affectedItems.push({ item, status: 'added' });
      }
    }

    // Step 3: Any item left in the oldItemsMap was not present in the new array (deleted)
    for (const oldData of state.oldItemsMap.values()) {
      state.affectedItems.push({ item: oldData.item, status: 'deleted' });
    }

    return state.affectedItems;
  }
}

export default TinyArrayComparator;
