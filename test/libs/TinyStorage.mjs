/**
 * Node.js port of the browser based storage test environments
 * (`test/html/storage/*`).
 *
 * Covers:
 * - TinyLocalStorage (typed getters/setters, extended JSON types, events)
 * - TinyMapCache (TTL cache, events, iteration)
 * - TinySetMapDatabase (schema resolution / validation)
 *
 * The browser `localStorage`/`Storage` globals are polyfilled so the module
 * can be exercised outside of a real browser.
 */

// ---------------------------------------------------------------------------
// Minimal Web Storage polyfill (must exist before importing TinyLocalStorage)
// ---------------------------------------------------------------------------
class Storage {
  #data = new Map();
  get length() {
    return this.#data.size;
  }
  key(index) {
    return [...this.#data.keys()][index] ?? null;
  }
  getItem(key) {
    return this.#data.has(String(key)) ? this.#data.get(String(key)) : null;
  }
  setItem(key, value) {
    this.#data.set(String(key), String(value));
  }
  removeItem(key) {
    this.#data.delete(String(key));
  }
  clear() {
    this.#data.clear();
  }
}

const storage = new Storage();

/**
 * (Re)installs the Web Storage polyfill on the global scope.
 *
 * Other test modules replace `globalThis.window` while they run, so the polyfill
 * has to be (re)applied right before the storage classes are used instead of
 * only once at import time.
 */
const installStorage = () => {
  globalThis.Storage = Storage;
  globalThis.localStorage = storage;
  globalThis.window = globalThis.window ?? {};
  globalThis.window.localStorage = storage;
  if (typeof globalThis.window.addEventListener !== 'function') {
    globalThis.window.addEventListener = () => {};
    globalThis.window.removeEventListener = () => {};
  }
};

installStorage();

const { default: TinyLocalStorage } =
  await import('../../dist/v1/libs/storage/TinyLocalStorage.mjs');
const { default: TinyMapCache } = await import('../../dist/v1/libs/storage/TinyMapCache.mjs');
const { TinySetMapDatabase } = await import('../../dist/v1/libs/storage/TinySetMapDatabase.mjs');

import { TestRunner, section, color, sleep } from './_helpers.mjs';

/**
 * Node.js port of the browser storage test environments.
 * @returns {Promise<number>}
 */
const testStorage = async () => {
  installStorage();
  const t = new TestRunner('TinyLocalStorage');
  const store = new TinyLocalStorage('TinyTest');

  // -------------------------------------------------------------------
  // Primitive helpers
  // -------------------------------------------------------------------
  section('TinyLocalStorage - primitives', '💾');
  store.setString('str', 'Hello World');
  t.equal(store.getString('str'), 'Hello World', 'setString/getString round-trips');

  store.setNumber('num', 123.456);
  t.equal(store.getNumber('num'), 123.456, 'setNumber/getNumber round-trips');

  store.setBool('bool', true);
  t.equal(store.getBool('bool'), true, 'setBool/getBool round-trips');

  store.setItem('raw', 'rawValue');
  t.equal(store.getItem('raw'), 'rawValue', 'setItem/getItem round-trips');

  // -------------------------------------------------------------------
  // Extended JSON types
  // -------------------------------------------------------------------
  section('TinyLocalStorage - extended types', '🧬');
  store.setDate('date', new Date('2023-07-01T12:34:56.000Z'));
  t.equal(
    store.getDate('date')?.toISOString(),
    '2023-07-01T12:34:56.000Z',
    'setDate/getDate round-trips',
  );

  store.setRegExp('regex', /pudding\d+/gi);
  t.equal(store.getRegExp('regex')?.source, 'pudding\\d+', 'setRegExp/getRegExp round-trips');

  store.setBigInt('big', BigInt('12345678901234567890'));
  t.equal(
    store.getBigInt('big'),
    BigInt('12345678901234567890'),
    'setBigInt/getBigInt round-trips',
  );

  store.setSymbol('sym', Symbol.for('pudding'));
  t.equal(store.getSymbol('sym'), Symbol.for('pudding'), 'setSymbol/getSymbol round-trips');

  store.setJson('map', new Map([['key1', 1]]));
  const map = store.getJson('map');
  t.equal(map instanceof Map, true, 'setJson restores a Map');
  t.equal(map.get('key1'), 1, 'Map keeps its entries');

  store.setJson('set', new Set(['a', 'b', 'c']));
  const set = store.getJson('set');
  t.equal(set instanceof Set, true, 'setJson restores a Set');
  t.equal(set.has('b'), true, 'Set keeps its values');

  store.setJson('nested', { a: 1, b: new Set([1, 2]), c: new Map([['x', 'y']]) });
  const nested = store.getJson('nested');
  t.equal(nested.b instanceof Set, true, 'Nested Set is restored');
  t.equal(nested.c instanceof Map, true, 'Nested Map is restored');

  // -------------------------------------------------------------------
  // Events + validation
  // -------------------------------------------------------------------
  section('TinyLocalStorage - events & validation', '🔔');
  let emitted = null;
  store.on('setString', (name, value) => (emitted = { name, value }));
  store.setString('evented', 'yes');
  t.deepEqual(emitted, { name: 'evented', value: 'yes' }, 'Emits typed events');

  t.throws(() => store.setString('bad', 5), 'setString rejects non-strings');
  t.throws(() => store.setNumber('bad', 'x'), 'setNumber rejects non-numbers');
  t.throws(() => store.setBool('bad', 'x'), 'setBool rejects non-booleans');
  t.throws(() => store.setItem('LSDB::reserved', 'x'), 'Rejects reserved db keys');
  t.throws(() => new TinyLocalStorage(42), 'Rejects a non-string dbName');

  store.removeItem('str');
  t.equal(store.getItem('str'), null, 'removeItem deletes the key');

  store.destroy();
  t.equal(store.destroyed, true, 'destroy marks the instance as destroyed');
  t.throws(() => store.getItem('raw'), 'Throws after being destroyed');

  // -------------------------------------------------------------------
  // TinyMapCache
  // -------------------------------------------------------------------
  const c = new TestRunner('TinyMapCache');
  section('TinyMapCache - basics', '🗄️');
  const cache = new TinyMapCache();
  cache.set('a', 1);
  cache.set('b', 2);
  c.equal(cache.size, 2, 'Tracks the amount of entries');
  c.equal(cache.get('a'), 1, 'get returns the stored value');
  c.equal(cache.has('b'), true, 'has finds an existing key');
  c.equal(cache.delete('a'), true, 'delete removes an entry');
  c.equal(cache.has('a'), false, 'Deleted entry is gone');

  section('TinyMapCache - ttl & events', '⏱️');
  const ttlCache = new TinyMapCache();
  ttlCache.ttl = 20;
  let expired = false;
  ttlCache.on('expire', () => (expired = true));
  ttlCache.set('temp', 123);
  await sleep(40);
  c.equal(ttlCache.get('temp'), null, 'Expired entries are purged');
  c.equal(expired, true, 'Emits the expire event');
  c.throws(() => (ttlCache.ttl = -1), 'Rejects a negative ttl');
  c.throws(() => ttlCache.get(1), 'Rejects a non-string key');

  // -------------------------------------------------------------------
  // TinySetMapDatabase (schema resolution only, no IndexedDB required)
  // -------------------------------------------------------------------
  const d = new TestRunner('TinySetMapDatabase');
  section('TinySetMapDatabase - schema', '🗃️');
  const db = new TinySetMapDatabase('TestDB', [
    { version: 1, create: ['users', { name: 'settings', type: 'map' }] },
  ]);
  d.equal(db.name, 'TestDB', 'Exposes the database name');
  d.equal(db.version, 1, 'Derives the version from the migration count');
  d.deepEqual([...db.tableNames].sort(), ['settings', 'users'], 'Exposes every declared table');
  d.equal(db.has('users'), true, 'has() finds a declared table');
  d.equal(db.has('ghost'), false, 'has() returns false for unknown tables');
  d.throws(() => db.tableMap('users'), 'tableMap rejects a set table');
  d.throws(() => db.tableSet('settings'), 'tableSet rejects a map table');
  d.throws(() => new TinySetMapDatabase('', []), 'Rejects an empty migration list');

  console.log(`\n${color('gray', 'Storage test-suite finished.')}`);

  return t.summary() + c.summary() + d.summary();
};

export default testStorage;
