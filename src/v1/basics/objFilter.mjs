// @ts-nocheck
import { isJsonObject } from './objChecker.mjs';

/**
 * A flag indicating if the current environment is a web browser.
 * @type {boolean}
 */
const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';

/**
 * An object containing type validation functions and their evaluation order.
 *
 * Each item in `typeValidator.items` is a function that receives any value
 * and returns a boolean indicating whether the value matches the corresponding type.
 *
 * The `order` array defines the priority in which types should be checked,
 * which can be useful for functions that infer types in a consistent manner.
 */
const typeValidator = {
  /**
   * A registry where keys are type names and values are their validation and cloning logic.
   * @type {Record<string, ObjTypeRegistry<any, any>>}
   */
  items: {},
  /**
   * The sequence in which type validators are checked.
   * The first validator to return true for a value determines the type name.
   * @type {string[]}
   */
  order: [],
};

/**
 * @typedef {import('../libs/utils/TinyCloner.mjs').default} TinyCloner
 */

/**
 * A function type used to validate a value and return a specific result.
 *
 * @template {any} Value - The type of the value being validated.
 * @template {any} Result - The type of the result returned by the function.
 * @typedef {(val: Value) => Result} ExtendObjTypeFunc
 */

/**
 * A function type used to clone a value, supporting deep cloning operations.
 *
 * @template {any} Value - The type of the value to be cloned.
 * @typedef {(val: Value, isDeep: boolean, cloner: TinyCloner) => Value} ExtendObjTypeCloner
 */

/**
 * A mapping of type names to their corresponding validation functions.
 *
 * @template {any} Value - The type of the value being mapped.
 * @typedef {Object.<string, ExtendObjTypeFunc<Value, any>>} ExtendObjType
 */

/**
 * A tuple representing a type definition, containing a key, a validator, and an optional cloner.
 *
 * @template {any} Value - The type of the value.
 * @template {any} Result - The type of the result returned by the validator.
 * @typedef {[string, ExtendObjTypeFunc<Value, Result>, ExtendObjTypeCloner<Value>]|[string, ExtendObjTypeFunc<Value, Result>]} ExtendObjTypeValue
 */

/**
 * A registry object containing the validator and cloner for a specific type.
 *
 * @template {any} Value - The type of the value being registered.
 * @template {any} Result - The type of the result returned by the validator.
 * @typedef {Object} ObjTypeRegistry
 * @property {ExtendObjTypeFunc<Value, Result>} validator - The function used to validate the type.
 * @property {ExtendObjTypeCloner<Value>} cloner - The function used to create a clone of the value.
 */

/**
 * Adds new type checkers to the `typeValidator` registry.
 *
 * Accepts an object of functions, an array of [key, validator] tuples, or an array of [key, validator, cloner] tuples.
 * If an `index` is provided, the new type is inserted at that position.
 * If no index is provided, it is inserted before the 'object' type or at the end of the registry.
 *
 * @template {any} Value
 * @template {any} Result
 * @param {ExtendObjType<Value> | ExtendObjTypeValue<Value, Result>[] | ExtendObjTypeValue<Value, Result>} ni
 * - New type validators to be added.
 * @param {number} [index] - Optional. Position at which to insert each new type. Ignored if the type already exists.
 * @returns {string[]} - A list of successfully added type names.
 * @throws {TypeError} If `ni` is not an object/array, if `index` is not a number, if a key is not a string, or if a validator is not a function.
 *
 * @example
 * extendObjType({
 *   htmlElement2: val => typeof HTMLElement !== 'undefined' && val instanceof HTMLElement
 * });
 *
 * @example
 * extendObjType([
 * ['alpha', val => typeof val === 'string'],
 * ['beta', val => Array.isArray(val)]
 * ]);
 *
 * @example
 * extendObjType(['gamma', val => typeof val === 'number']);
 */
export function extendObjType(ni, index) {
  if (typeof ni !== 'object' || ni === null) {
    throw new TypeError("Argument 'ni' must be an object or an array.");
  }

  if (typeof index !== 'undefined' && typeof index !== 'number') {
    throw new TypeError("Argument 'index' must be a number.");
  }

  const added = [];

  // Normalization logic:
  // 1. If ni is an array:
  //    - If the first element is also an array, it is an array of tuples (ExtendObjTypeValue[]).
  //    - If the first element is not an array, it is a single tuple (ExtendObjTypeValue).
  //    - If the array is empty, we use an empty array.
  // 2. If ni is an object:
  //    - We use Object.entries to convert it to an array of [key, value] pairs.

  /**
   * @type {[string, ExtendObjTypeFunc<Value, Result>, ExtendObjTypeCloner<Value> | undefined][]}
   */
  let entries;
  if (Array.isArray(ni)) {
    if (ni.length > 0 && Array.isArray(ni[0])) {
      // @ts-ignore
      entries = ni;
    } else if (ni.length > 0) {
      // @ts-ignore
      entries = [ni];
    } else {
      entries = [];
    }
  } else {
    // @ts-ignore
    entries = Object.entries(ni);
  }

  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length < 2) {
      throw new TypeError('Each item in the input must be a [key, function] pair.');
    }

    const [key, validator, cloner] = entry;
    if (typeof cloner !== 'undefined' && typeof cloner !== 'function') {
      throw new TypeError(`Cloner for key '${key}' must be a function.`);
    }
    /** @type {ExtendObjTypeCloner<Value>} */
    const effectiveCloner = typeof cloner === 'function' ? cloner : (val) => val;

    if (typeof key !== 'string') {
      throw new TypeError('Validator key must be a string.');
    }
    if (typeof validator !== 'function') {
      throw new TypeError(`Validator for key '${key}' must be a function.`);
    }

    if (!typeValidator.items.hasOwnProperty(key)) {
      typeValidator.items[key] = {
        validator: validator,
        cloner: effectiveCloner,
      };

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
 * If `val` is `null`, it immediately returns `'null'`.
 * If no match is found, it returns `'unknown'`.
 *
 * @param {any} val - The value whose type should be determined.
 * @returns {string} - The type name of the value (e.g., "array", "date", "map"), or "unknown" if no match is found.
 *
 * @example
 * objTypeName([]); // "array"
 * objTypeName(null); // "null"
 * objTypeName(new Set()); // "set"
 */
export const objTypeName = (val) => {
  if (val === null) return 'null';
  for (const name of typeValidator.order) {
    if (
      typeof typeValidator.items[name].validator !== 'function' ||
      typeValidator.items[name].validator(val)
    )
      return name;
  }
  return 'unknown';
};

/**
 * Checks the type of a given object.
 *
 * @param {*} obj - The object to check.
 * @param {string} [type] - Checks whether the object matches this type (e.g., "object", "array", "string").
 * @returns {boolean} - Returns `true` if the type matches.
 * @throws {TypeError} If `type` is not a string.
 */
export function isObjType(obj, type) {
  if (typeof type !== 'string') throw new TypeError("Argument 'type' must be a string.");
  return objTypeName(obj) === type.toLowerCase();
}

/**
 * Checks the type of a given object or returns its type as a string.
 *
 * @deprecated Use {@link isObjType} or {@link objTypeName} instead.
 * @param {*} obj - The object to check or identify.
 * @param {string} [type] - Optional. If provided, checks whether the object matches this type (e.g., "object", "array", "string").
 * @returns {boolean|string|null} - Returns `true` if the type matches, `false` if not,
 * the type string if no type is provided, or `null` if the object is `undefined`.
 * @throws {TypeError} If `type` is provided but is not a string.
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

  const result = objTypeName(obj);
  if (typeof type === 'string') return result === type.toLowerCase();
  return result;
}

/**
 * @typedef {Object} CheckResult
 * @property {*} valid - The result of the validator function (often the value itself if truthy).
 * @property {string | null} type - The name of the detected type.
 */

/**
 * Evaluates an object against the registered validators and returns the first match.
 *
 * @param {unknown} obj - The object to check.
 * @returns {CheckResult} An object containing the validation result and the type name.
 */
export function checkObj(obj) {
  /** @type {CheckResult} */
  const data = { valid: null, type: null };
  for (const name of typeValidator.order) {
    if (typeof typeValidator.items[name].validator === 'function') {
      const result = typeValidator.items[name].validator(obj);
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
 * Returns a shallow clone of the `typeValidator.items` registry.
 *
 * @returns {Record<string, ObjTypeRegistry<any, any>>} A new object containing the registry data.
 */
export function getObjTypeRegistry() {
  return Object.fromEntries(
    Object.entries(typeValidator.items).map(([key, data]) => [key, { ...data }]),
  );
}

/**
 * Returns a copy of the current order of type validators.
 * @returns {string[]} A new array containing the type order.
 */
export const getObjTypeOrder = () => [...typeValidator.order];

// --- Type Registration ---

extendObjType([
  [
    'undefined',
    /** @param {unknown} val @returns {val is undefined} */
    (val) => typeof val === 'undefined',
  ],
  [
    'null',
    /** @param {unknown} val @returns {val is null} */
    (val) => val === null,
  ],
  [
    'boolean',
    /** @param {unknown} val @returns {val is boolean} */
    (val) => typeof val === 'boolean',
  ],
  [
    'number',
    /** @param {unknown} val @returns {val is number} */
    (val) => typeof val === 'number' && !Number.isNaN(val),
  ],
  [
    'nannumber',
    /** @param {unknown} val @returns {val is number} */
    (val) => typeof val === 'number' && Number.isNaN(val),
  ],
  [
    'bigint',
    /** @param {unknown} val @returns {val is bigint} */
    (val) => typeof val === 'bigint',
  ],
  [
    'string',
    /** @param {unknown} val @returns {val is string} */
    (val) => typeof val === 'string',
  ],
  [
    'symbol',
    /** @param {unknown} val @returns {val is symbol} */
    (val) => typeof val === 'symbol',
  ],
  [
    'function',
    /** @param {unknown} val @returns {val is Function} */
    (val) => typeof val === 'function',
  ],
]);

extendObjType([
  'array',
  /**  @param {unknown} val @returns {val is unknown[]} */
  (val) => Array.isArray(val),
  /** @type {ExtendObjTypeCloner<unknown[]>} */
  (item, isDeep, cloner) =>
    item.map((element) => (isDeep ? cloner.clone(element, isDeep) : element)),
]);

if (isBrowser) {
  extendObjType([
    'file',
    /** @param {unknown} val @returns {val is File} */
    (val) => typeof File !== 'undefined' && val instanceof File,
    /** @type {ExtendObjTypeCloner<File>} */
    (item) => new File([item], item.name, { type: item.type, lastModified: item.lastModified }),
  ]);
}

extendObjType([
  'date',
  /** @param {unknown} val @returns {val is Date} */
  (val) => val instanceof Date,
  /** @type {ExtendObjTypeCloner<Date>} */
  (item) => new Date(item.getTime()),
]);

extendObjType([
  'regexp',
  /** @param {unknown} val @returns {val is RegExp} */
  (val) => val instanceof RegExp,
  /** @type {ExtendObjTypeCloner<RegExp>} */
  (item) => new RegExp(item.source, item.flags),
]);

extendObjType([
  'map',
  /** @param {unknown} val @returns {val is Map<unknown, unknown>} */
  (val) => val instanceof Map,
  /** @type {ExtendObjTypeCloner<Map<unknown, unknown>>} */
  (item, isDeep, cloner) => {
    const result = new Map();
    for (const [key, value] of item.entries()) {
      result.set(key, isDeep ? cloner.clone(value, isDeep) : value);
    }
    return result;
  },
]);

extendObjType([
  'set',
  /** @param {unknown} val @returns {val is Set<unknown>} */
  (val) => val instanceof Set,
  /** @type {ExtendObjTypeCloner<Set<any>>} */
  (item, isDeep, cloner) => {
    const result = new Set();
    for (const value of item) {
      result.add(isDeep ? cloner.clone(value, isDeep) : value);
    }
    return result;
  },
]);

extendObjType([
  [
    'weakmap',
    /** @param {unknown} val @returns {val is WeakMap<unknown, unknown>} */
    (val) => val instanceof WeakMap,
  ],
  [
    'weakset',
    /** @param {unknown} val @returns {val is WeakSet<unknown>} */
    (val) => val instanceof WeakSet,
  ],
  [
    'promise',
    /** @param {unknown} val @returns {val is Promise<unknown>} */
    (val) => val instanceof Promise,
  ],
]);

extendObjType([
  'url',
  /** @param {unknown} val @returns {val is URL} */
  (val) => val instanceof URL,
  /** @type {ExtendObjTypeCloner<URL>} */
  (item) => new URL(item.href),
]);

if (isBrowser) {
  extendObjType([
    'htmlelement',
    /** @param {unknown} val @returns {val is HTMLElement} */
    (val) => typeof HTMLElement !== 'undefined' && val instanceof HTMLElement,
    /** @type {ExtendObjTypeCloner<Node>} */
    (item) => item.cloneNode(true),
  ]);
}

extendObjType([
  'object',
  /** @param {unknown} val @returns {val is Record<string | number | symbol, unknown>} */
  (val) => isJsonObject(val),
  /** @type {ExtendObjTypeCloner<Record<string | number | symbol, unknown>>} */
  (item, isDeep, cloner) => {
    /** @type {Record<string | number | symbol, unknown>} */
    const result = {};
    for (const key in item) {
      if (Object.prototype.hasOwnProperty.call(item, key)) {
        result[key] = isDeep ? cloner.clone(item[key], isDeep) : item[key];
      }
    }
    return result;
  },
]);
