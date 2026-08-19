import { countObj, isJsonObject } from './objChecker.mjs';

/**
 * A predicate function used to filter object entries. It receives the current entry as a [key, value] tuple,
 * the current index, and the array of all entries. It must act as a type guard to ensure the entry maintains the
 * correct tuple structure.
 *
 * @template T
 * @typedef {(
 *   entry: [keyof T, T[keyof T]],
 *   index: number,
 *   array: [keyof T, T[keyof T]][]
 * ) => entry is [keyof T, T[keyof T]]} JsonFilterCallback
 */

/**
 * @template {Record<string|number|symbol, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {JsonFilterCallback<T>} filterContent - Predicate function used to filter the object's entries.
 * @returns {Partial<T>} - A new object containing a subset of the original object's keys.
 * @throws {TypeError} If the value is not a non-null object or filterContent is not a function.
 */
export function jsonFilter(value, filterContent) {
  // Argument validation
  if (Array.isArray(value) || typeof value !== 'object' || value === null) {
    throw new TypeError('The first argument must be a non-null object.');
  }

  if (typeof filterContent !== 'function') {
    throw new TypeError('The second argument must be a function.');
  }

  const filtered = Object.entries(value).filter(filterContent);

  // We use a type cast here because Object.fromEntries returns { [k: string]: any }
  // which is too broad to be automatically assigned to Partial<T>.
  return /** @type {Partial<T>} */ (Object.fromEntries(filtered));
}

/**
 * @callback EntryPredicate
 * @param {[string, any]} entry - The current [key, value] pair.
 * @param {number} index - The current index.
 * @param {any[]} array - The array of entries being processed.
 * @returns {boolean}
 */

/**
 * Recursively filters an object.
 * If an object is encountered, it is only kept if its filtered content is not empty.
 *
 * @template {Record<string|number|symbol, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {EntryPredicate} [filterJson] - Predicate applied to non-array values.
 * @param {EntryPredicate} [filterArray] - Predicate applied to array values.
 * @returns {Partial<T>} A new filtered structure.
 * @throws {TypeError} If filterJson or filterArray are provided but are not functions.
 */
export function jsonFilterRecursive(value, filterJson, filterArray) {
  // Validation for optional functional arguments
  if (filterJson !== undefined && typeof filterJson !== 'function') {
    throw new TypeError('filterJson must be a function if provided.');
  }
  if (filterArray !== undefined && typeof filterArray !== 'function') {
    throw new TypeError('filterArray must be a function if provided.');
  }

  /** @type {JsonFilterCallback<any>} */
  // @ts-ignore
  const fr = ([_, value], index, array) =>
    // Case 1: Value is an Array
    Array.isArray(value)
      ? typeof filterArray !== 'undefined'
        ? // @ts-ignore
          filterArray([_, value], index, array)
        : true
      : // Case 2: Value is an Object (pruning logic)
        isJsonObject(value)
        ? (() => {
            value;
            const d = jsonFilterRecursive(value, filterJson, filterArray);
            const amount = countObj(d);
            return amount > 0;
          })()
        : // Case 3: Value is a primitive/other
          typeof filterJson !== 'undefined'
          ? // @ts-ignore
            filterJson([_, value], index, array)
          : true;

  return jsonFilter(value, fr);
}
