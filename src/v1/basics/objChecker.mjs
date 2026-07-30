/**
 * Counts the number of elements in an array or the number of properties in an object.
 *
 * @param {Array<*>|Record<string | number | symbol, any>} obj - The array or object to count.
 * @returns {number} - The count of items (array elements or object keys).
 * @throws {TypeError} If the input is neither an array nor a pure object.
 *
 * @example
 * countObj([1, 2, 3]); // 3
 * countObj({ a: 1, b: 2 }); // 2
 * countObj('not an object'); // Throws TypeError
 */
export function countObj(obj) {
  if (!Array.isArray(obj) && !isJsonObject(obj))
    throw new TypeError('Argument must be either an Array or a pure JSON Object.');

  // Is Array
  if (Array.isArray(obj)) return obj.length;
  // Object
  return Object.keys(obj).length;
}

/**
 * Determines whether a given value is a pure JSON object (plain object).
 *
 * A pure object satisfies the following:
 * - It is not null.
 * - Its type is "object".
 * - Its internal [[Class]] is "[object Object]".
 * - It is not an instance of built-in types like Array, Date, Map, Set, etc.
 *
 * This function is useful for strict data validation when you want to ensure
 * a value is a clean JSON-compatible object, free of class instances or special types.
 *
 * @param {unknown} value - The value to test.
 * @returns {value is Record<string | number | symbol, unknown>} Returns true if the value is a pure object.
 */
export function isJsonObject(value) {
  if (value === null || typeof value !== 'object') return false;
  if (Array.isArray(value)) return false;
  if (Object.prototype.toString.call(value) !== '[object Object]') return false;
  return true;
}

/**
 * Determines whether a given value is a JSON object.
 *
 * A pure object satisfies the following:
 * - It is not null.
 * - Its type is "object".
 * - It is not an Array instance.
 *
 * @param {unknown} value - The value to test.
 * @returns {value is Object<string | number | symbol, unknown>} Returns true if the value is a object.
 */
export function isValidObj(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
