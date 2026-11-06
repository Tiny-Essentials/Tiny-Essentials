import {
  countObj,
  isJsonObject,
  isValidObj,
  isClass,
  isClassInstance,
  isAnyClassInstance,
} from '../../dist/v1/basics/objChecker.mjs';
import {
  jsonFilter,
  jsonFilterRecursive,
  jsonFilterByKeys,
} from '../../dist/v1/basics/jsonFilter.mjs';
import {
  extendObjType,
  reorderObjTypeOrder,
  cloneObjTypeOrder,
  objTypeName,
  isObjType,
  objType,
  checkObj,
  getObjTypeRegistry,
  getObjTypeOrder,
} from '../../dist/v1/basics/objFilter.mjs';
import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based data helper test environments
 * (`test/html/basics/jsonFilter` and `test/html/basics/objChecker`).
 *
 * Covers:
 *
 * - objChecker (countObj, isJsonObject, isValidObj, isClass, isClassInstance, ...)
 * - jsonFilter (jsonFilter, jsonFilterRecursive, jsonFilterByKeys)
 * - objFilter (type registry, objTypeName, isObjType, objType, checkObj, ...)
 *
 * @returns {Promise<number>}
 */
const testBasicsData = async () => {
  const t = new TestRunner('basics/objChecker');

  // -------------------------------------------------------------------
  // countObj
  // -------------------------------------------------------------------
  section('objChecker - countObj', '🔢');
  t.equal(countObj([1, 2, 3]), 3, 'Counts array items');
  t.equal(countObj({ a: 1, b: 2 }), 2, 'Counts object keys');
  t.throws(() => countObj('nope'), 'Rejects a non-object');
  t.throws(() => countObj(null), 'Rejects null');

  // -------------------------------------------------------------------
  // isJsonObject / isValidObj
  // -------------------------------------------------------------------
  section('objChecker - type guards', '🧭');
  t.equal(isJsonObject({}), true, 'isJsonObject accepts a plain object');
  t.equal(isJsonObject([]), false, 'isJsonObject rejects arrays');
  t.equal(isJsonObject(null), false, 'isJsonObject rejects null');
  t.equal(isJsonObject(new Date()), false, 'isJsonObject rejects class instances');

  t.equal(isValidObj({}), true, 'isValidObj accepts a plain object');
  t.equal(isValidObj([]), false, 'isValidObj rejects arrays');
  t.equal(isValidObj(null), false, 'isValidObj rejects null');

  // -------------------------------------------------------------------
  // isClass / isClassInstance / isAnyClassInstance
  // -------------------------------------------------------------------
  section('objChecker - class helpers', '🏛️');
  class Example {}
  function plainFunction() {}

  t.equal(isClass(Example), true, 'isClass detects a class');
  t.equal(isClass(plainFunction), false, 'isClass rejects a function');
  t.throws(() => isClass('nope'), 'isClass rejects non-functions');

  t.equal(isClassInstance(new Example()), true, 'isClassInstance detects a class instance');
  t.equal(isClassInstance({}), false, 'isClassInstance rejects plain objects');
  t.equal(isClassInstance(null), false, 'isClassInstance rejects null');

  t.equal(isAnyClassInstance(new Map()), true, 'isAnyClassInstance accepts native instances');
  t.equal(isAnyClassInstance({}), false, 'isAnyClassInstance rejects plain objects');
  t.equal(isAnyClassInstance(Object.create(null)), false, 'isAnyClassInstance rejects null prototypes');

  // -------------------------------------------------------------------
  // jsonFilter
  // -------------------------------------------------------------------
  section('jsonFilter - jsonFilter', '🧪');
  const source = { a: 1, b: 2, c: 3 };
  t.deepEqual(
    jsonFilter(source, ([, value]) => value > 1),
    { b: 2, c: 3 },
    'Filters the entries',
  );
  t.throws(() => jsonFilter(null, () => true), 'Rejects a non-object value');
  t.throws(() => jsonFilter({}, 'nope'), 'Rejects a non-function filter');

  // -------------------------------------------------------------------
  // jsonFilterRecursive
  // -------------------------------------------------------------------
  section('jsonFilter - jsonFilterRecursive', '🪄');
  const nested = { a: 1, b: null, c: { d: 2, e: null }, f: [1, null, 3] };
  const filtered = jsonFilterRecursive(nested, {
    value: ([, value]) => value !== null,
  });
  t.equal(filtered.a, 1, 'Keeps truthy primitives');
  t.equal('b' in filtered, false, 'Drops filtered primitives');
  t.deepEqual(filtered.f, [1, 3], 'Filters nested arrays');

  const map = jsonFilterRecursive(new Map([['x', 1]]), {});
  t.equal(map instanceof Map, true, 'Preserves Map instances');

  const set = jsonFilterRecursive(new Set([1, 2]), {});
  t.equal(set instanceof Set, true, 'Preserves Set instances');

  t.throws(() => jsonFilterRecursive({}, { obj: 5 }), 'Validates filter.obj');
  t.throws(() => jsonFilterRecursive({}, { value: 5 }), 'Validates filter.value');
  t.throws(() => jsonFilterRecursive({}, { array: 5 }), 'Validates filter.array');

  // -------------------------------------------------------------------
  // jsonFilterByKeys
  // -------------------------------------------------------------------
  section('jsonFilter - jsonFilterByKeys', '🔑');
  const data = { a: 1, b: 2, c: 3 };
  t.deepEqual(jsonFilterByKeys(data, ['a', 'c']), { a: 1, c: 3 }, 'Keeps the listed keys');
  t.deepEqual(
    jsonFilterByKeys(data, [['a', 1]]),
    { a: 1 },
    'Supports [key, value] tuples',
  );
  t.deepEqual(
    jsonFilterByKeys(data, [['a', (v) => v === 1]]),
    { a: 1 },
    'Supports validator tuples',
  );
  t.deepEqual(jsonFilterByKeys(data, [], [2]), { b: 2 }, 'Filters by value');
  t.throws(() => jsonFilterByKeys(data, 'nope'), 'Rejects a non-array keys argument');
  t.throws(() => jsonFilterByKeys(data, [], 'nope'), 'Rejects a non-array values argument');

  // -------------------------------------------------------------------
  // objFilter
  // -------------------------------------------------------------------
  const o = new TestRunner('basics/objFilter');
  section('objFilter - type detection', '🏷️');
  o.equal(objTypeName('hello'), 'string', 'Detects strings');
  o.equal(objTypeName(1), 'number', 'Detects numbers');
  o.equal(objTypeName(NaN), 'nannumber', 'Detects NaN');
  o.equal(objTypeName([]), 'array', 'Detects arrays');
  o.equal(objTypeName(new Date()), 'date', 'Detects dates');
  o.equal(objTypeName(new Map()), 'map', 'Detects maps');
  o.equal(objTypeName(null), 'null', 'Detects null');
  o.equal(objTypeName(undefined), 'undefined', 'Detects undefined');

  o.equal(isObjType([], 'array'), true, 'isObjType matches the type');
  o.equal(isObjType([], 'object'), false, 'isObjType rejects a different type');
  o.throws(() => isObjType([], 5), 'isObjType validates the type argument');

  o.equal(objType([]), 'array', 'objType returns the type name');
  o.equal(objType([], 'array'), true, 'objType matches a type');
  o.equal(objType(undefined), null, 'objType returns null for undefined');
  o.throws(() => objType([], 5), 'objType validates the type argument');

  section('objFilter - registry', '🗂️');
  o.equal(Array.isArray(getObjTypeOrder()), true, 'getObjTypeOrder returns an array');
  o.equal(typeof getObjTypeRegistry(), 'object', 'getObjTypeRegistry returns the registry');
  o.equal(Array.isArray(cloneObjTypeOrder()), true, 'cloneObjTypeOrder returns a copy');

  const pudding = { __pudding: true };
  const added = extendObjType(['pudding', (value) => value === pudding]);
  o.deepEqual(added, ['pudding'], 'extendObjType registers a new type');
  o.equal(objTypeName(pudding), 'pudding', 'The new type is used by objTypeName');
  o.deepEqual(extendObjType(['pudding', () => true]), [], 'Ignores duplicate types');
  o.throws(() => extendObjType(null), 'Rejects a null argument');
  o.throws(() => extendObjType([['x', 'nope']]), 'Rejects a non-function validator');
  o.throws(() => extendObjType([[5, () => true]]), 'Rejects a non-string key');

  o.equal(reorderObjTypeOrder(['nope']), false, 'reorderObjTypeOrder rejects unknown types');
  o.equal(
    reorderObjTypeOrder(getObjTypeOrder()),
    true,
    'reorderObjTypeOrder accepts the current order',
  );
  o.throws(() => reorderObjTypeOrder('nope'), 'reorderObjTypeOrder validates the input');

  section('objFilter - checkObj', '✅');
  const checked = checkObj('hello');
  o.equal(checked.type, 'string', 'checkObj reports the type');
  o.equal(checked.valid, true, 'checkObj reports a match');

  console.log(`\n${color('gray', 'basics/data test-suite finished.')}`);

  return t.summary() + o.summary();
};

export default testBasicsData;
