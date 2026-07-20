import { countObj, isJsonObject } from './objChecker.mjs';

export { countObj, isJsonObject };

const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * An object containing type validation functions and their evaluation order.
 *
 * Each item in `typeValidator.items` is a function that receives any value
 * and returns a boolean indicating whether the value matches the corresponding type.
 *
 * The `order` array defines the priority in which types should be checked,
 * which can be useful for functions that infer types in a consistent manner.
 *
 */
const typeValidator = {
  items: {},
  /**
   * Evaluation order of the type checkers.
   * @type {string[]}
   * */
  order: [],
};

/** @typedef {Object.<string, (val: any) => *>} ExtendObjType */
/** @typedef {Array<[string, (val: any) => *]>} ExtendObjTypeArray */

/**
 * Adds new type checkers to the typeValidator without overwriting existing ones.
 *
 * Accepts either an object with named functions or an array of [key, fn] arrays.
 * If no index is provided, the type is inserted just before 'object' (if it exists), or at the end.
 *
 * @param {ExtendObjType|ExtendObjTypeArray} newItems
 * - New type validators to be added.
 * @param {number} [index] - Optional. Position at which to insert each new type. Ignored if the type already exists.
 * @returns {string[]} - A list of successfully added type names.
 *
 * @example
 * extendObjType({
 * htmlElement2: val => typeof HTMLElement !== 'undefined' && val instanceof HTMLElement
 * });
 *
 * @example
 * extendObjType([
 * ['alpha', val => typeof val === 'string'],
 * ['beta', val => Array.isArray(val)]
 * ]);
 */
export function extendObjType(newItems, index) {
  if (typeof newItems !== 'object' || newItems === null) {
    throw new TypeError("Argument 'newItems' must be an object or an array.");
  }

  if (typeof index !== 'undefined' && typeof index !== 'number') {
    throw new TypeError("Argument 'index' must be a number.");
  }

  const added = [];

  const entries = Array.isArray(newItems) ? newItems : Object.entries(newItems);

  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length < 2) {
      throw new TypeError("Each item in 'newItems' array must be a [key, function] pair.");
    }

    const [key, fn] = entry;

    if (typeof key !== 'string') {
      throw new TypeError('Validator key must be a string.');
    }
    if (typeof fn !== 'function') {
      throw new TypeError(`Validator for key '${key}' must be a function.`);
    }

    if (!typeValidator.items.hasOwnProperty(key)) {
      // @ts-ignore
      typeValidator.items[key] = fn;

      let insertAt = typeof index === 'number' ? index : -1; // Default to -1 if index isn't provided

      // Default to before 'object', or to the end
      if (insertAt === -1) {
        const objectIndex = typeValidator.order.indexOf('object');
        insertAt = objectIndex > -1 ? objectIndex : typeValidator.order.length;
      }

      // Ensure insertAt is a valid number and not out of bounds
      insertAt = Math.min(Math.max(0, insertAt), typeValidator.order.length);

      typeValidator.order.splice(insertAt, 0, key);
      added.push(key);
    }
  }

  return added;
}

/**
 * Reorders the typeValidator.order array according to a custom new order.
 * All values in the new order must already exist in the current order.
 * The function does not mutate the original array structure directly.
 *
 * @param {string[]} newOrder - The new order of type names.
 * @returns {boolean} - Returns true if the reorder was successful, false if invalid keys were found.
 *
 * @example
 * reorderObjTypeOrder([
 * 'string', 'number', 'array', 'object'
 * ]);
 */
export function reorderObjTypeOrder(newOrder) {
  if (!Array.isArray(newOrder)) {
    throw new TypeError("Argument 'newOrder' must be an array of strings.");
  }
  if (!newOrder.every((item) => typeof item === 'string')) {
    throw new TypeError("All elements in 'newOrder' must be strings.");
  }

  const currentOrder = [...typeValidator.order]; // shallow clone

  // All keys in newOrder must exist in currentOrder
  const isValid = newOrder.every((type) => currentOrder.includes(type));

  if (!isValid) return false;

  // Reassign only if valid
  typeValidator.order = newOrder.slice(); // assign shallow copy
  return true;
}

/**
 * Returns a cloned version of the `typeValidator.order` array.
 * The cloned array will not be affected by future changes to the original `order`.
 *
 * @returns {string[]} - A new array with the same values as `typeValidator.order`.
 */
export function cloneObjTypeOrder() {
  return [...typeValidator.order]; // Creates a shallow copy of the array
}

/**
 * Returns the detected type name of a given value based on predefined type validators.
 *
 * This function uses `getType` with a predefined `typeValidator` to determine or compare types safely.
 * in the specified `typeValidator.order`. The first matching type is returned.
 *
 * If `val` is `null`, it immediately returns `'null'`.
 * If no match is found, it returns `'unknown'`.
 *
 * @param {any} val - The value whose type should be determined.
 * @returns {string} - The type name of the value (e.g., "array", "date", "map"), or "unknown" if no match is found.
 *
 * @example
 * getType([]); // "array"
 * getType(null); // "null"
 * getType(new Set()); // "set"
 * getType(() => {}); // "unknown"
 */
const getType = (val) => {
  if (val === null) return 'null';
  // @ts-ignore
  for (const name of typeValidator.order) {
    // @ts-ignore
    if (typeof typeValidator.items[name] !== 'function' || typeValidator.items[name](val))
      return name;
  }
  return 'unknown';
};

/**
 * Checks the type of a given object or returns its type as a string.
 *
 * @param {*} obj - The object to check or identify.
 * @param {string} [type] - Optional. If provided, checks whether the object matches this type (e.g., "object", "array", "string").
 * @returns {boolean|string|null} - Returns `true` if the type matches, `false` if not,
 * the type string if no type is provided, or `null` if the object is `undefined`.
 *
 * @example
 * objType([], 'array'); // true
 * objType({}, 'object'); // true
 * objType('hello'); // "string"
 * objType(undefined); // null
 */
export function objType(obj, type) {
  if (typeof obj === 'undefined') return null;
  if (typeof type !== 'undefined' && typeof type !== 'string') {
    throw new TypeError("Argument 'type' must be a string.");
  }

  const result = getType(obj);
  if (typeof type === 'string') return result === type.toLowerCase();
  return result;
}

/**
 * Checks the type of a given object and returns the validation value if a known type is detected.
 *
 * @param {*} obj - The object to check or identify.
 * @returns {{ valid:*; type: string | null }} - Returns the type result.
 */
export function checkObj(obj) {
  /** @type {{ valid:*; type: string | null }} */
  const data = { valid: null, type: null };
  for (const name of typeValidator.order) {
    // @ts-ignore
    if (typeof typeValidator.items[name] === 'function') {
      // @ts-ignore
      const result = typeValidator.items[name](obj);
      if (result) {
        data.valid = result;
        data.type = name;
        break;
      }
    }
  }
  return data;
}

/**
 * Creates a clone of the functions from the `typeValidator` object.
 * It returns a new object where the keys are the same and the values are the cloned functions.
 */
export function getCheckObj() {
  return Object.fromEntries(Object.entries(typeValidator.items).map(([key, fn]) => [key, fn]));
}

// Insert obj types

extendObjType([
  [
    'undefined',
    /** @param {*} val @returns {val is undefined} */
    (val) => typeof val === 'undefined',
  ],
  [
    'null',
    /** @param {*} val @returns {val is null} */
    (val) => val === null,
  ],
  [
    'boolean',
    /** @param {*} val @returns {val is boolean} */
    (val) => typeof val === 'boolean',
  ],
  [
    'number',
    /** @param {*} val @returns {val is number} */
    (val) => typeof val === 'number' && !Number.isNaN(val),
  ],
  [
    'bigint',
    /** @param {*} val @returns {val is bigint} */
    (val) => typeof val === 'bigint',
  ],
  [
    'string',
    /** @param {*} val @returns {val is string} */
    (val) => typeof val === 'string',
  ],
  [
    'symbol',
    /** @param {*} val @returns {val is symbol} */
    (val) => typeof val === 'symbol',
  ],
  [
    'function',
    /** @param {*} val @returns {val is Function} */
    (val) => typeof val === 'function',
  ],
  [
    'array',
    /**
     * @template {any} Value
     * @param {*} val @returns {val is Value[]}
     */
    (val) => Array.isArray(val),
  ],
]);

if (isBrowser) {
  extendObjType([
    [
      'file',
      /** @param {*} val @returns {val is File} */
      (val) => typeof File !== 'undefined' && val instanceof File,
    ],
  ]);
}

extendObjType([
  [
    'date',
    /** @param {*} val @returns {val is Date} */
    (val) => val instanceof Date,
  ],
  [
    'regexp',
    /** @param {*} val @returns {val is RegExp} */
    (val) => val instanceof RegExp,
  ],
  [
    'map',
    /**
     * @template {any} Key
     * @template {any} Value
     * @param {*} val @returns {val is Map<Key, Value>}
     */
    (val) => val instanceof Map,
  ],
  [
    'set',
    /**
     * @template {any} Value
     * @param {*} val @returns {val is Set<Value>}
     */
    (val) => val instanceof Set,
  ],
  [
    'weakmap',
    /**
     * @template {WeakKey} Key
     * @template {any} Value
     * @param {*} val @returns {val is WeakMap<Key, Value>}
     */
    (val) => val instanceof WeakMap,
  ],
  [
    'weakset',
    /**
     * @template {WeakKey} Value
     * @param {*} val @returns {val is WeakSet<Value>}
     */
    (val) => val instanceof WeakSet,
  ],
  [
    'promise',
    /**
     * @template {any} Value
     * @param {*} val @returns {val is Promise<Value>}
     */
    (val) => val instanceof Promise,
  ],
]);

if (isBrowser) {
  extendObjType([
    [
      'htmlelement',
      /** @param {*} val @returns {val is HTMLElement} */
      (val) => typeof HTMLElement !== 'undefined' && val instanceof HTMLElement,
    ],
  ]);
}

extendObjType([
  [
    'object',
    /**
     * @template {string | number | symbol} Key
     * @template {any} Value
     * @param {*} val @returns {val is Record<Key, Value>}
     */
    (val) => isJsonObject(val),
  ],
]);
