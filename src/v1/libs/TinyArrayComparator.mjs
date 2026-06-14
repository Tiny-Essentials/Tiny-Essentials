/**
 * @fileoverview Array comparison utility.
 * @module TinyArrayComparator
 */

/**
 * @typedef {Object} InternalState
 * Holds the internal tracking variables during the comparison process.
 * @property {Map<string, any>} oldItemsMap - A map storing the hash as the key and the original item as the value.
 * @property {AffectedItems} affectedItems - The final array that collects added or deleted items.
 */

/**
 * The final array that collects added or deleted items.
 * @typedef {Array<{item: any, status: 'added'|'deleted'}>} AffectedItems
 */

/**
 * Compares two arrays efficiently by hashing their items to detect additions and deletions.
 */
class TinyArrayComparator {
  /**
   * Generates a simple 32-bit integer hash converted to a base36 string.
   * @param {any} item - The item to be hashed (can be an object, array, string, or number).
   * @returns {string} The unique hash representing the item's value.
   */
  static generateHash(item) {
    const stringified = typeof item === 'object' ? JSON.stringify(item) : String(item);
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
   * @type {any[]}
   */
  #oldArray = [];

  /**
   * Gets the current base array used for comparisons.
   * @returns {any[]} The current initial state of the array.
   */
  get oldArray() {
    return this.#oldArray;
  }

  /**
   * Sets a new base array for future comparisons.
   * @param {Array<any>} oldArray - The initial state of the array.
   * @throws {TypeError} Throws an error if the provided value is not an array.
   */
  set oldArray(oldArray) {
    if (!Array.isArray(oldArray))
      throw new TypeError('The provided oldArray must be a valid Array.');
    this.#oldArray = oldArray;
  }

  /**
   * Initializes the comparator with an optional base array.
   * @param {Array<any>} [oldArray] - The initial state of the array to be stored.
   */
  constructor(oldArray) {
    if (typeof oldArray !== 'undefined') this.oldArray = oldArray;
  }

  /**
   * Proxy to generates a hash converted to a string.
   * @param {any} item - The item to be hashed (can be an object, array, string, or number).
   * @returns {string} The unique hash representing the item's value.
   * @private
   */
  _generateHash(item) {
    return TinyArrayComparator.generateHash(item);
  }

  /**
   * Compares the stored older array with a newer array and identifies missing or new items.
   *
   * @param {Array<any>} newArray - The modified state of the array.
   * @returns {AffectedItems} An array containing the affected items and their status.
   * @throws {TypeError} Throws an error if the provided value is not an array.
   */
  compare(newArray) {
    if (!Array.isArray(newArray))
      throw new TypeError('The provided newArray must be a valid Array.');

    /** @type {InternalState} */
    const state = {
      oldItemsMap: new Map(),
      affectedItems: [],
    };

    // Step 1: Hash and store all items from the first array
    for (const item of this.#oldArray) {
      const hashKey = this._generateHash(item);
      state.oldItemsMap.set(hashKey, item);
    }

    // Step 2: Iterate through the second array to find matches or additions
    for (const item of newArray) {
      const hashKey = this._generateHash(item);

      if (state.oldItemsMap.has(hashKey)) {
        // Item exists in both, so it is unchanged. Remove from map.
        state.oldItemsMap.delete(hashKey);
      } else {
        // Item was not in the old array, so it is an addition.
        state.affectedItems.push({ item, status: 'added' });
      }
    }

    // Step 3: Any item left in the oldItemsMap was not present in the new array (deleted)
    for (const item of state.oldItemsMap.values()) {
      state.affectedItems.push({ item, status: 'deleted' });
    }

    return state.affectedItems;
  }
}

export default TinyArrayComparator;
