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
  if (typeof value !== 'object' || value === null) {
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
 * @template {Record<string|number|symbol, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {(value: [string | number | symbol, any], index: number, array: any[]) => boolean} [filterJson]
 * @param {(value: [string | number | symbol, any], index: number, array: any[]) => boolean} [filterArray]
 * @returns {Partial<any>} - A new object containing a subset of the original object's keys.
 * @throws {TypeError} If the value is not a non-null object or filterContent is not a function.
 */
export function jsonFilterRecursive(value, filterJson, filterArray) {
  /** @type {JsonFilterCallback<any>} */
  const fr = ([_, value], index, array) =>
    Array.isArray(value)
      ? typeof filterArray !== 'undefined'
        ? filterArray([_, value], index, array)
        : true
      : isJsonObject(value)
        ? (() => {
            value;
            const d = jsonFilterRecursive(value, filterJson, filterArray);
            const amount = countObj(d);
            return amount > 0;
          })()
        : typeof filterJson !== 'undefined'
          ? filterJson([_, value], index, array)
          : true;

  return jsonFilter(value, fr);
}
