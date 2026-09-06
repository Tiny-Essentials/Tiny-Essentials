/**
 * @fileoverview Array comparison utility.
 * @module TinyArrayComparator
 */

/**
 * @template {any} ArrayItem
 * @typedef {Object} HashEntry
 * @property {ArrayItem} item - The original item stored in the map.
 * @property {string} hash - The calculated hash representing the item's value.
 */

/**
 * @template {any} ArrayItem
 * @typedef {Object} DiffResult
 * @property {ArrayItem} item - The item that was affected.
 * @property {ArrayItem} [oldItem] - The original item before the change (only for 'edited' status).
 * @property {'added'|'deleted'|'edited'} status - The nature of the change.
 */

/**
 * @template {any} ArrayItem
 * @typedef {Object} InternalState
 * Holds the internal tracking variables during the comparison process.
 * @property {Map<string|number, HashEntry<ArrayItem>>} oldItemsMap - A map storing the identity key as the key and the hash entry as the value.
 * @property {AffectedItems<ArrayItem>} affectedItems - The final array that collects added, deleted, or edited items.
 */

/**
 * The final array that collects added, deleted, or edited items.
 * @template {any} ArrayItem
 * @typedef {Array<DiffResult<ArrayItem>>} AffectedItems
 */

/**
 * Options to configure the comparator.
 * @typedef {Object} ComparatorOptions
 * @property {string} [idKey='id'] - The property name used as a unique identifier for objects to detect edits.
 */

/**
 * Compares two arrays efficiently by hashing their items to detect additions, deletions, and edits.
 * @template {any} ArrayItem
 */
class TinyArrayComparator {
  /**
   * Generates a simple 32-bit integer hash converted to a base36 string.
   * @param {any} item - The item to be hashed (can be an object, array, string, or number).
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
   * @param {ComparatorOptions} [options={}] - Configuration options for the comparator.
   */
  constructor(oldArray, options = {}) {
    if (typeof oldArray !== 'undefined') this.oldArray = oldArray;

    if (typeof options.idKey === 'string') {
      this.idKey = options.idKey;
    }
  }

  /**
   * Proxy to generates a hash converted to a string.
   * @param {ArrayItem} item - The item to be hashed (can be an object, array, string, or number).
   * @returns {string} The unique hash representing the item's value.
   * @private
   */
  _generateHash(item) {
    return TinyArrayComparator.generateHash(item);
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

      if (state.oldItemsMap.has(identityKey)) {
        const oldData = state.oldItemsMap.get(identityKey);

        if (oldData?.hash === hash) {
          // Item exists and the content is identical. Unchanged.
          state.oldItemsMap.delete(identityKey);
        } else {
          // Item has the same identity but a different hash. It was edited.
          state.affectedItems.push({
            item: item,
            oldItem: oldData?.item,
            status: 'edited',
          });
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
