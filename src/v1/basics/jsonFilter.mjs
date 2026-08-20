import { isValidObj } from './objChecker.mjs';

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
 * A predicate function used to determine whether an element should be included in the filtered result.
 *
 * @template T
 * @callback BasePredicate
 * @param {T} current - The current element being evaluated. Depending on the recursion level, this can be an entry tuple `[key, value]`, a primitive value, or a nested object.
 * @param {number} index - The zero-based index of the current element within the array being iterated.
 * @param {any[]} array - The array containing the current element.
 * @returns {boolean} True if the element satisfies the condition and should be kept; otherwise, false.
 */

/**
 * Configuration object for the `jsonFilterRecursive` function, containing predicate functions for different data types.
 *
 * @typedef {Object} FilterOptions
 * @property {BasePredicate<[RecordKey, any]>} [value] - A predicate function applied to primitive values. Receives the entry as a `[key, value]` tuple.
 * @property {BasePredicate<Record<RecordKey, any>>} [obj] - A predicate function applied to nested objects. Receives the filtered sub-object as its first argument.
 * @property {BasePredicate<[RecordKey, any]>} [array] - A predicate function applied to array elements. Receives the entry as a `[key, value]` tuple.
 */

/**
 * Recursively traverses an object and returns a new structure containing only the elements
 * that satisfy the provided filtering criteria.
 *
 * The function applies specific predicates based on the type of the current value:
 * 1. If the value is an Array, the `filter.array` predicate is applied.
 * 2. If the value is an Object, the function recurses, and then the `filter.obj` predicate is applied to the result.
 * 3. If the value is a primitive, the `filter.value` predicate is applied.
 *
 * @template {Record<RecordKey, any>} T
 * @param {T} value - The source object to be deeply filtered.
 * @param {FilterOptions} filter - An object containing optional predicate functions for different data types.
 * @returns {Partial<T>} A new, deeply filtered version of the original object.
 * @throws {TypeError} If `filter.value`, `filter.obj`, or `filter.array` are provided but are not functions.
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
  const arrFr = ([_, value], index, array) => {
    if (typeof filter.array === 'undefined') return true;
    const newArr = [];
    for (const arrValue of value) {
      // Case 1: Value is an Array
      if (Array.isArray(arrValue)) {
        if (arrFr([_, arrValue], index, array)) newArr.push(arrValue);
      }

      // Case 2: Value is an Object (pruning logic)
      if (isValidObj(arrValue)) {
        const d = jsonFilterRecursive(arrValue, filter);
        if (typeof filter.obj !== 'undefined' ? filter.obj(d, index, array) : true) newArr.push(d);
      }

      // Case 3: Value is a primitive/other
      else {
        if (typeof filter.value !== 'undefined' ? filter.value([_, arrValue], index, array) : true)
          newArr.push(arrValue);
      }
    }
    return filter.array([_, newArr], index, array);
  };

  /** @type {JsonFilterCallback<any>} */
  // @ts-ignore
  const fr = ([_, value], index, array) =>
    // Case 1: Value is an Array
    Array.isArray(value)
      ? arrFr([_, value], index, array)
      : // Case 2: Value is an Object (pruning logic)
        isValidObj(value)
        ? (() => {
            const d = jsonFilterRecursive(value, filter);
            return typeof filter.obj !== 'undefined' ? filter.obj(d, index, array) : true;
          })()
        : // Case 3: Value is a primitive/other
          typeof filter.value !== 'undefined'
          ? filter.value([_, value], index, array)
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
