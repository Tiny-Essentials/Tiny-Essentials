/**
 * @template T
 * @typedef {(
 *   entry: [keyof T, T[keyof T]],
 *   index: number,
 *   array: [keyof T, T[keyof T]][]
 * ) => entry is [keyof T, T[keyof T]]} FilterObjCallback
 */

/**
 * @template {Record<string|number|symbol, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {FilterObjCallback<T>} filterContent - Predicate function used to filter the object's entries.
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
