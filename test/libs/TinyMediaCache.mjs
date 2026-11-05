import { TestRunner, section, color, sleep } from './_helpers.mjs';

/**
 * Node.js port of the browser based TinyMediaCache test environment
 * (`test/html/html/loader/TinyMediaCache`).
 *
 * Covers:
 * - Construction & option validation
 * - set / get / has / delete / entries
 * - Reference counting (acquire / release) and the cleanup strategies
 * - TTL expiration and pruning
 * - maxItems / maxBytes eviction
 * - Parent/child links (children / links / cascade delete)
 * - Statistics and teardown
 *
 * @returns {Promise<number>}
 */

const { default: TinyMediaCache } =
  await import('../../dist/v1/libs/html/loader/utils/TinyMediaCache.mjs');

/**
 * Builds a blob with the given payload.
 * @param {string} [value] - The blob contents.
 * @param {string} [type] - The blob MIME type.
 * @returns {Blob} The new blob.
 */
const blob = (value = 'x', type = 'text/plain') => new Blob([value], { type });

/**
 * Node.js port of the browser TinyMediaCache test environment.
 * @returns {Promise<number>}
 */
const testMediaCache = async () => {
  const t = new TestRunner('TinyMediaCache');

  // -------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------
  section('TinyMediaCache - construction', '🗄️');
  const cache = new TinyMediaCache();
  t.equal(cache.size, 0, 'Starts empty');
  t.equal(cache.bytes, 0, 'Starts with no bytes');
  t.equal(cache.links, 0, 'Starts with no links');
  t.equal(cache.maxItems, Infinity, 'Defaults maxItems to Infinity');
  t.equal(cache.maxBytes, Infinity, 'Defaults maxBytes to Infinity');
  t.equal(cache.ttl, 0, 'Defaults ttl to 0');
  t.equal(cache.evictions, 0, 'Starts with no evictions');
  t.equal(cache.destroyed, false, 'Starts alive');
  t.equal(cache.strategy, TinyMediaCache.Strategy.MANUAL, 'Defaults to the manual strategy');
  t.throws(() => new TinyMediaCache(null), 'Rejects a null options object');
  t.throws(() => new TinyMediaCache({ maxItems: 0 }), 'Rejects an invalid maxItems');
  t.throws(() => new TinyMediaCache({ maxBytes: -1 }), 'Rejects an invalid maxBytes');
  t.throws(() => new TinyMediaCache({ ttl: -1 }), 'Rejects an invalid ttl');
  t.throws(() => new TinyMediaCache({ strategy: 'nope' }), 'Rejects an unknown strategy');
  t.throws(() => new TinyMediaCache({ ignoreSearch: 'yes' }), 'Rejects a non-boolean flag');

  // -------------------------------------------------------------------
  // Basic operations
  // -------------------------------------------------------------------
  section('TinyMediaCache - set & get', '📦');
  const entry = cache.set('https://cdn/a.png', blob('aaaa'), false, { width: 10 });
  t.equal(entry.url, 'https://cdn/a.png', 'Returns the stored entry');
  t.equal(entry.size, 4, 'Records the blob size');
  t.equal(cache.size, 1, 'Tracks the entry count');
  t.equal(cache.bytes, 4, 'Tracks the byte count');
  t.equal(cache.has('https://cdn/a.png'), true, 'has() finds the entry');
  t.equal(cache.has('https://cdn/missing.png'), false, 'has() is false for unknown URLs');
  t.equal(cache.get('https://cdn/a.png').metadata.width, 10, 'get() returns the entry');
  t.equal(cache.get('https://cdn/missing.png'), null, 'get() is null for unknown URLs');
  t.throws(() => cache.set('https://cdn/a.png', 'nope'), 'set() validates the blob');
  t.throws(() => cache.set('https://cdn/a.png', blob(), 'yes'), 'set() validates pinned');
  t.throws(() => cache.set('https://cdn/a.png', blob(), false, 'nope'), 'set() validates metadata');
  t.throws(
    () => cache.set('https://cdn/a.png', blob(), false, {}, 5),
    'set() validates the parent',
  );

  section('TinyMediaCache - entries', '📋');
  const snapshot = cache.entries();
  t.equal(snapshot.length, 1, 'entries() returns every entry');
  snapshot[0].metadata.width = 999;
  t.equal(
    cache.get('https://cdn/a.png').metadata.width,
    10,
    'entries() returns a defensive copy of the metadata',
  );

  // -------------------------------------------------------------------
  // Reference counting
  // -------------------------------------------------------------------
  section('TinyMediaCache - references', '🔗');
  const refCache = new TinyMediaCache();
  refCache.set('https://cdn/ref.png', blob('abc'));
  t.equal(refCache.acquire('https://cdn/ref.png').refs, 1, 'acquire() increments the refs');
  t.equal(refCache.release('https://cdn/ref.png'), true, 'release() reports success');
  t.equal(refCache.get('https://cdn/ref.png').refs, 0, 'release() decrements the refs');
  t.equal(refCache.release('https://cdn/ghost.png'), false, 'release() is false for unknown URLs');
  t.equal(refCache.acquire('https://cdn/ghost.png'), null, 'acquire() is null for unknown URLs');
  refCache.destroy();

  // -------------------------------------------------------------------
  // Strategies
  // -------------------------------------------------------------------
  section('TinyMediaCache - auto strategy', '♻️');
  const autoCache = new TinyMediaCache({ strategy: TinyMediaCache.Strategy.AUTO });
  autoCache.set('https://cdn/auto.png', blob('abc'));
  autoCache.acquire('https://cdn/auto.png');
  autoCache.release('https://cdn/auto.png');
  t.equal(autoCache.size, 0, 'The auto strategy drops the entry at zero refs');
  autoCache.destroy();

  // -------------------------------------------------------------------
  // TTL
  // -------------------------------------------------------------------
  section('TinyMediaCache - ttl', '⏱️');
  const ttlCache = new TinyMediaCache({ ttl: 20 });
  ttlCache.set('https://cdn/ttl.png', blob('abc'));
  t.equal(ttlCache.has('https://cdn/ttl.png'), true, 'The entry is live right away');
  await sleep(40);
  t.equal(ttlCache.has('https://cdn/ttl.png'), false, 'The entry expires after the ttl');
  ttlCache.set('https://cdn/ttl2.png', blob('abc'));
  await sleep(40);
  t.ok(ttlCache.prune() >= 1, 'prune() removes the expired entries');
  t.equal(ttlCache.size, 0, 'prune() leaves no expired entry behind');
  ttlCache.destroy();

  // -------------------------------------------------------------------
  // Eviction
  // -------------------------------------------------------------------
  section('TinyMediaCache - eviction', '🗑️');
  const lru = new TinyMediaCache({ maxItems: 2 });
  lru.set('https://cdn/1.png', blob('a'));
  lru.set('https://cdn/2.png', blob('b'));
  lru.set('https://cdn/3.png', blob('c'));
  t.equal(lru.size, 2, 'Respects maxItems');
  t.equal(lru.has('https://cdn/1.png'), false, 'Evicts the least recently used entry');
  t.equal(lru.has('https://cdn/3.png'), true, 'Keeps the newest entry');
  t.ok(lru.evictions > 0, 'Counts the evictions');
  lru.destroy();

  const byteCache = new TinyMediaCache({ maxBytes: 4 });
  byteCache.set('https://cdn/big1.png', blob('aaaa'));
  byteCache.set('https://cdn/big2.png', blob('bbbb'));
  t.ok(byteCache.bytes <= 4, 'Respects maxBytes');
  byteCache.destroy();

  // -------------------------------------------------------------------
  // Parent / child links
  // -------------------------------------------------------------------
  section('TinyMediaCache - links', '🧩');
  const linked = new TinyMediaCache();
  const parent = 'https://cdn/anim.gif';
  linked.set(parent, blob('gif'));
  linked.set(`${parent}#0`, blob('f0'), false, { index: 0 }, parent);
  linked.set(`${parent}#1`, blob('f1'), false, { index: 1 }, parent);
  t.equal(linked.links, 1, 'Tracks the amount of parents');
  t.equal(linked.children(parent).length, 2, 'children() lists the owned keys');
  t.deepEqual(linked.children('https://cdn/ghost.gif'), [], 'children() is empty for unknown keys');
  t.equal(linked.stats.links, 1, 'stats.links reports the parents');

  linked.delete(`${parent}#0`);
  t.equal(linked.children(parent).length, 1, 'Deleting a child updates the parent');
  linked.delete(`${parent}#1`);
  t.equal(linked.has(parent), false, 'Deleting the last child removes the parent');
  linked.destroy();

  // -------------------------------------------------------------------
  // Pinning
  // -------------------------------------------------------------------
  section('TinyMediaCache - pinning', '📌');
  const pinned = new TinyMediaCache({ maxItems: 1 });
  pinned.set('https://cdn/keep.png', blob('keep'));
  t.equal(pinned.pin('https://cdn/keep.png'), true, 'pin() finds the entry');
  t.equal(pinned.pin('https://cdn/ghost.png'), false, 'pin() is false for unknown URLs');
  t.throws(() => pinned.pin('https://cdn/keep.png', 'yes'), 'pin() validates the value');
  pinned.set('https://cdn/other.png', blob('other'));
  t.equal(pinned.has('https://cdn/keep.png'), true, 'A pinned entry survives eviction');
  pinned.destroy();

  // -------------------------------------------------------------------
  // Statistics & teardown
  // -------------------------------------------------------------------
  section('TinyMediaCache - stats', '📊');
  const stats = cache.stats;
  t.equal(typeof stats.size, 'number', 'stats exposes the size');
  t.equal(typeof stats.bytes, 'number', 'stats exposes the bytes');
  t.equal(typeof stats.hits, 'number', 'stats exposes the hits');
  t.equal(typeof stats.misses, 'number', 'stats exposes the misses');
  t.equal(typeof stats.links, 'number', 'stats exposes the links');
  t.equal(typeof stats.instances, 'number', 'stats exposes the instance count');
  t.equal(typeof stats.blobs, 'number', 'stats exposes the blob count');

  section('TinyMediaCache - teardown', '💥');
  cache.clear();
  t.equal(cache.size, 0, 'clear() empties the cache');
  cache.destroy();
  t.equal(cache.destroyed, true, 'destroy() marks the instance as destroyed');
  t.throws(() => cache.get('https://cdn/a.png'), 'Throws after being destroyed');
  t.throws(() => cache.set('https://cdn/a.png', blob()), 'set() throws after destroy');
  t.throws(() => cache.entries(), 'entries() throws after destroy');
  t.throws(() => cache.prune(), 'prune() throws after destroy');
  cache.destroy();
  t.equal(cache.destroyed, true, 'destroy() is idempotent');

  console.log(`\n${color('gray', 'TinyMediaCache test-suite finished.')}`);

  return t.summary();
};

export default testMediaCache;
