import { countObj, isJsonObject, isValidObj } from './objChecker.mjs';

/**
 * Represents a valid key for an object, which can be a string, number, or symbol.
 * @typedef {string|number|symbol} RecordKey
 */

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
 * @template {Record<RecordKey, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {JsonFilterCallback<T>} filterContent - Predicate function used to filter the object's entries.
 * @returns {Partial<T>} - A new object containing a subset of the original object's keys.
 * @throws {TypeError} If the value is not a non-null object or filterContent is not a function.
 */
export function jsonFilter(value, filterContent) {
  // Argument validation
  if (!isValidObj(value)) {
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
 * @template T
 * @callback EntryPredicate
 * @param {T} entry - The current [key, value] pair.
 * @param {number} index - The current index.
 * @param {any[]} array - The array of entries being processed.
 * @returns {boolean}
 */

/**
 * Recursively filters an object.
 *
 * @template {Record<RecordKey, any>} T
 * @param {T} value - The source object to be filtered.
 * @param {Object} filter
 * @param {EntryPredicate<[string, any]>} [filter.value] - Predicate applied to values.
 * @param {EntryPredicate<Record<RecordKey, any>>} [filter.obj] - Predicate applied to non-array values.
 * @param {EntryPredicate<[string, any]>} [filter.array] - Predicate applied to array values.
 * @returns {Partial<T>} A new filtered structure.
 * @throws {TypeError} If filterJson or filterArray are provided but are not functions.
 */
export function jsonFilterRecursive(value, filter) {
  // Validation for optional functional arguments
  if (filter.obj !== undefined && typeof filter.obj !== 'function') {
    throw new TypeError('filter.obj must be a function if provided.');
  }
  if (filter.value !== undefined && typeof filter.value !== 'function') {
    throw new TypeError('filter.value must be a function if provided.');
  }
  if (filter.array !== undefined && typeof filter.array !== 'function') {
    throw new TypeError('filter.array must be a function if provided.');
  }

  /** @type {JsonFilterCallback<any>} */
  // @ts-ignore
  const fr = ([_, value], index, array) =>
    // Case 1: Value is an Array
    Array.isArray(value)
      ? typeof filter.array !== 'undefined'
        ? // @ts-ignore
          filter.array([_, value], index, array)
        : true
      : // Case 2: Value is an Object (pruning logic)
        isValidObj(value)
        ? (() => {
            value;
            const d = jsonFilterRecursive(value, filter);
            return typeof filter.obj !== 'undefined' ? filter.obj(d, index, array) : true;
          })()
        : // Case 3: Value is a primitive/other
          typeof filter.value !== 'undefined'
          ? // @ts-ignore
            filter.value([_, value], index, array)
          : true;

  return jsonFilter(value, fr);
}

/**
 * A predicate function used to validate whether a given value satisfies a specific condition or type requirement.
 * @typedef {(value: any) => boolean} ValueTypeValidator
 */

/**
 * @template {Record<RecordKey, any>} T
 * @param {T} item - The source object to be filtered.
 * @param {(RecordKey|[RecordKey, any|ValueTypeValidator])[]} keys - An array of keys or [key, value/validator] tuples to keep.
 * @param {(any|ValueTypeValidator)[]} [values] - An array of values or validators to validate against when using simple keys.
 * @returns {Partial<T>} - A new object containing only the specified keys.
 * @throws {TypeError} If the item is not a non-null object, keys is not an array, or values is not an array.
 */
export function jsonFilterByKeys(item, keys, values) {
  if (!Array.isArray(keys)) {
    throw new TypeError('The second argument must be an array.');
  }
  if (typeof values !== 'undefined' && !Array.isArray(values)) {
    throw new TypeError('The third argument must be an array.');
  }

  return jsonFilter(
    item,
    // @ts-ignore
    ([key, value]) => {
      if (keys.length > 0)
        return keys.some((k) => {
          // Case 1: The element in 'keys' is a tuple [targetKey, targetValueOrValidator]
          if (Array.isArray(k)) {
            const [targetKey, targetValue] = k;
            const keyMatches = key === targetKey;
            const valueMatches =
              typeof targetValue === 'function' ? targetValue(value) : value === targetValue;

            return keyMatches && valueMatches;
          }

          // Case 2: The element in 'keys' is a simple key (RecordKey)
          const keyMatches = key === k;

          // Universal validation: check if value is in 'values' OR matches a validator in 'values'
          const valueMatches =
            typeof values === 'undefined' ||
            values.some((v) => (typeof v === 'function' ? v(value) : v === value));

          return keyMatches && valueMatches;
        });
      // Universal validation: check if value is in 'values' OR matches a validator in 'values'
      if (typeof values !== 'undefined')
        return values.some((v) => (typeof v === 'function' ? v(value) : v === value));
      return false;
    },
  );
}
