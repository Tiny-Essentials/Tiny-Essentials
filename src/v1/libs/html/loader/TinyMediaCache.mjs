/**
 * @fileoverview Shared memory cache for media blobs and object URLs.
 * Instances are tracked statically so a blob survives until the last cache
 * releases it, which prevents revoking an object URL that another part of the
 * application is still rendering.
 */

/**
 * Cleanup strategy applied when an entry reaches zero references.
 * @typedef {'auto'|'manual'|'ttl'} MediaCacheStrategy
 */

/**
 * @typedef {Object} MediaCacheOptions
 * @property {number} [maxItems] - Maximum number of entries (Infinity by default).
 * @property {number} [ttl] - Entry lifetime in milliseconds (0 = never expires).
 * @property {MediaCacheStrategy} [strategy] - Cleanup strategy at zero references.
 * @property {boolean} [ignoreSearch] - Whether the query string is ignored when building keys.
 * @property {number} [sweepInterval] - Interval in milliseconds for active TTL sweeping (0 = disabled).
 */

/**
 * @typedef {Object} MediaCacheEntry
 * @property {string} key - The normalized cache key.
 * @property {string} url - The original URL.
 * @property {Blob} blob - The cached blob.
 * @property {string} objectUrl - The shared object URL.
 * @property {number} size - The blob size in bytes.
 * @property {string} type - The blob MIME type.
 * @property {number} refs - The number of active consumers.
 * @property {number} createdAt - The epoch timestamp when the entry was created.
 * @property {number} lastAccess - The epoch timestamp of the last access.
 * @property {number} expiresAt - The epoch timestamp when the entry expires (0 = never).
 * @property {boolean} pinned - Whether the entry is protected from eviction.
 */

/**
 * @typedef {Object} MediaCacheStats
 * @property {number} size - The number of entries in this cache.
 * @property {number} bytes - The total size in bytes held by this cache.
 * @property {number} refs - The total number of active references.
 * @property {number} hits - The number of successful lookups.
 * @property {number} misses - The number of failed lookups.
 * @property {number} evictions - The number of evicted entries.
 * @property {number} instances - The number of live cache instances.
 * @property {number} blobs - The number of blobs in the shared registry.
 */

/**
 * @typedef {Object} MediaCacheRecord
 * @property {string} objectUrl - The shared object URL.
 * @property {number} refs - The number of cache instances holding the key.
 * @property {number} size - The blob size in bytes.
 */

/**
 * Memory cache shared by every media loader.
 */
class TinyMediaCache {
  /**
   * Cleanup strategies applied when an entry reaches zero references.
   */
  static Strategy = Object.freeze({
    AUTO: 'auto',
    MANUAL: 'manual',
    TTL: 'ttl',
  });

  /** @type {Set<TinyMediaCache>} */
  static #instances = new Set();
  /** @type {Map<string, MediaCacheRecord>} */
  static #blobs = new Map();
  /** @type {number} */
  static #evictions = 0;

  /** @type {Map<string, MediaCacheEntry>} */
  #entries = new Map();
  /** @type {number} */
  #maxItems;
  /** @type {number} */
  #ttl;
  /** @type {MediaCacheStrategy} */
  #strategy;
  /** @type {boolean} */
  #ignoreSearch;
  /** @type {number} */
  #hits = 0;
  /** @type {number} */
  #misses = 0;
  /** @type {ReturnType<typeof setInterval>|null} */
  #timer = null;
  /** @type {boolean} */
  #destroyed = false;

  /**
   * @param {MediaCacheOptions} [options] - The cache configuration.
   * @throws {TypeError} If `options` is not a plain object.
   * @throws {RangeError} If `maxItems` is not a positive number.
   * @throws {RangeError} If `ttl` is not a positive number.
   * @throws {TypeError} If `strategy` is not a known strategy.
   * @throws {TypeError} If `ignoreSearch` is not a boolean.
   * @throws {RangeError} If `sweepInterval` is not a positive number.
   */
  constructor(options = {}) {
    if (options === null || typeof options !== 'object') {
      throw new TypeError('The "options" argument must be an object.');
    }
    const {
      maxItems = Infinity,
      ttl = 0,
      strategy = TinyMediaCache.Strategy.MANUAL,
      ignoreSearch = false,
      sweepInterval = 0,
    } = options;
    if (typeof maxItems !== 'number' || Number.isNaN(maxItems) || maxItems < 1) {
      throw new RangeError('The "maxItems" option must be a positive number.');
    }
    if (typeof ttl !== 'number' || Number.isNaN(ttl) || ttl < 0) {
      throw new RangeError('The "ttl" option must be a positive number.');
    }
    if (!Object.values(TinyMediaCache.Strategy).includes(strategy)) {
      throw new TypeError(`Unknown cache strategy: ${strategy}`);
    }
    if (typeof ignoreSearch !== 'boolean') {
      throw new TypeError('The "ignoreSearch" option must be a boolean.');
    }
    if (typeof sweepInterval !== 'number' || Number.isNaN(sweepInterval) || sweepInterval < 0) {
      throw new RangeError('The "sweepInterval" option must be a positive number.');
    }
    this.#maxItems = maxItems;
    this.#ttl = ttl;
    this.#strategy = strategy;
    this.#ignoreSearch = ignoreSearch;
    TinyMediaCache.#instances.add(this);
    if (sweepInterval > 0) {
      this.#timer = setInterval(() => this.prune(), sweepInterval);
      if (typeof this.#timer.unref === 'function') {
        this.#timer.unref();
      }
    }
  }

  /**
   * Every live cache instance.
   * @returns {TinyMediaCache[]}
   */
  static get instances() {
    return Array.from(TinyMediaCache.#instances);
  }

  /**
   * The number of blobs held by the shared registry.
   * @returns {number}
   */
  static get size() {
    return TinyMediaCache.#blobs.size;
  }

  /**
   * The total number of bytes held by the shared registry.
   * @returns {number}
   */
  static get bytes() {
    let total = 0;
    for (const record of TinyMediaCache.#blobs.values()) {
      total += record.size;
    }
    return total;
  }

  /**
   * Checks the shared registry without touching any instance.
   * @param {string} url - The media URL.
   * @param {boolean} [ignoreSearch] - Whether the query string is ignored.
   * @returns {boolean}
   */
  static has(url, ignoreSearch = false) {
    return TinyMediaCache.#blobs.has(TinyMediaCache.#normalize(url, ignoreSearch));
  }

  /**
   * Revokes every object URL in the shared registry.
   * @returns {void}
   */
  static clear() {
    for (const record of TinyMediaCache.#blobs.values()) {
      URL.revokeObjectURL(record.objectUrl);
    }
    TinyMediaCache.#blobs.clear();
  }

  /**
   * Destroys every live cache instance.
   * @returns {void}
   */
  static destroyAll() {
    for (const instance of Array.from(TinyMediaCache.#instances)) {
      instance.destroy();
    }
  }

  /**
   * @returns {number} The number of entries in this cache.
   */
  get size() {
    return this.#entries.size;
  }

  /**
   * @returns {number} The total size in bytes held by this cache.
   */
  get bytes() {
    let total = 0;
    for (const entry of this.#entries.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * @returns {boolean} True after `destroy` has run.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * @returns {MediaCacheStats} A snapshot of the cache counters.
   */
  get stats() {
    let refs = 0;
    for (const entry of this.#entries.values()) {
      refs += entry.refs;
    }
    return {
      size: this.#entries.size,
      bytes: this.bytes,
      refs,
      hits: this.#hits,
      misses: this.#misses,
      evictions: TinyMediaCache.#evictions,
      instances: TinyMediaCache.#instances.size,
      blobs: TinyMediaCache.#blobs.size,
    };
  }

  /**
   * Stores a blob and returns its entry.
   * @param {string} url - The media URL.
   * @param {Blob} blob - The blob to cache.
   * @param {boolean} [pinned] - Whether the entry is protected from eviction.
   * @returns {MediaCacheEntry} The stored entry.
   * @throws {TypeError} If `blob` is not a Blob.
   * @throws {Error} If the cache was destroyed.
   */
  set(url, blob, pinned = false) {
    this.#assertAlive();
    if (!(blob instanceof Blob)) {
      throw new TypeError('The "blob" argument must be a Blob.');
    }
    const key = this.#key(url);
    this.delete(key);
    const record = TinyMediaCache.#acquire(key, blob);
    const now = Date.now();
    /** @type {MediaCacheEntry} */
    const entry = {
      key,
      url,
      blob,
      objectUrl: record.objectUrl,
      size: blob.size,
      type: blob.type,
      refs: 0,
      createdAt: now,
      lastAccess: now,
      expiresAt: this.#ttl > 0 ? now + this.#ttl : 0,
      pinned: Boolean(pinned),
    };
    this.#entries.set(key, entry);
    this.#enforceLimit();
    return entry;
  }

  /**
   * Reads an entry without changing its reference count.
   * @param {string} url - The media URL.
   * @returns {MediaCacheEntry|null}
   */
  get(url) {
    const key = this.#key(url);
    const entry = this.#entries.get(key);
    if (!entry) {
      this.#misses += 1;
      return null;
    }
    if (this.#isExpired(entry)) {
      this.delete(key);
      this.#misses += 1;
      return null;
    }
    entry.lastAccess = Date.now();
    this.#hits += 1;
    return entry;
  }

  /**
   * @param {string} url - The media URL.
   * @returns {boolean}
   */
  has(url) {
    return this.get(url) !== null;
  }

  /**
   * Increments the reference count of an entry.
   * @param {string} url - The media URL.
   * @returns {MediaCacheEntry|null} The acquired entry, or null when missing.
   */
  acquire(url) {
    const entry = this.get(url);
    if (!entry) {
      return null;
    }
    entry.refs += 1;
    return entry;
  }

  /**
   * Decrements the reference count and applies the cleanup strategy.
   * @param {string} url - The media URL.
   * @returns {boolean} True when the entry was released.
   */
  release(url) {
    const key = this.#key(url);
    const entry = this.#entries.get(key);
    if (!entry) {
      return false;
    }
    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs === 0 && this.#strategy === TinyMediaCache.Strategy.AUTO) {
      this.delete(key);
    }
    return true;
  }

  /**
   * Removes an entry and releases its share of the shared registry.
   * @param {string} url - The media URL.
   * @returns {boolean} True when an entry was removed.
   */
  delete(url) {
    const key = this.#key(url);
    const entry = this.#entries.get(key);
    if (!entry) {
      return false;
    }
    this.#entries.delete(key);
    TinyMediaCache.#release(key);
    return true;
  }

  /**
   * Pins an entry so the limit enforcement skips it.
   * @param {string} url - The media URL.
   * @param {boolean} [value] - The new pinned state.
   * @returns {boolean} True when the entry exists.
   */
  pin(url, value = true) {
    const entry = this.#entries.get(this.#key(url));
    if (!entry) {
      return false;
    }
    entry.pinned = Boolean(value);
    return true;
  }

  /**
   * Removes every expired entry.
   * @returns {number} The number of removed entries.
   */
  prune() {
    let removed = 0;
    for (const [key, entry] of this.#entries) {
      if (this.#isExpired(entry)) {
        this.#entries.delete(key);
        TinyMediaCache.#release(key);
        removed += 1;
      }
    }
    return removed;
  }

  /**
   * Removes every entry, regardless of its reference count.
   * @returns {void}
   */
  clear() {
    for (const key of Array.from(this.#entries.keys())) {
      this.#entries.delete(key);
      TinyMediaCache.#release(key);
    }
  }

  /**
   * Detaches this instance from the shared registry.
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) {
      return;
    }
    if (this.#timer) {
      clearInterval(this.#timer);
      this.#timer = null;
    }
    this.clear();
    TinyMediaCache.#instances.delete(this);
    this.#destroyed = true;
  }

  /**
   * Evicts the least recently used entries until the limit is respected.
   * @returns {void}
   */
  #enforceLimit() {
    if (this.#entries.size <= this.#maxItems) {
      return;
    }
    const candidates = Array.from(this.#entries.values())
      .filter((entry) => !entry.pinned && entry.refs === 0)
      .sort((a, b) => a.lastAccess - b.lastAccess);
    let overflow = this.#entries.size - this.#maxItems;
    for (const entry of candidates) {
      if (overflow <= 0) {
        break;
      }
      this.delete(entry.key);
      TinyMediaCache.#evictions += 1;
      overflow -= 1;
    }
  }

  /**
   * @param {MediaCacheEntry} entry - The entry to test.
   * @returns {boolean}
   */
  #isExpired(entry) {
    return entry.expiresAt > 0 && Date.now() >= entry.expiresAt;
  }

  /**
   * @param {string} url - The media URL.
   * @returns {string}
   */
  #key(url) {
    return TinyMediaCache.#normalize(url, this.#ignoreSearch);
  }

  /**
   * @returns {void}
   * @throws {Error} If the cache was destroyed.
   */
  #assertAlive() {
    if (this.#destroyed) {
      throw new Error('Cannot use a destroyed media cache.');
    }
  }

  /**
   * @param {string} url - The media URL.
   * @param {boolean} ignoreSearch - Whether the query string is ignored.
   * @returns {string}
   * @throws {TypeError} If `url` is not a string.
   */
  static #normalize(url, ignoreSearch) {
    if (typeof url !== 'string') {
      throw new TypeError('The "url" argument must be a string.');
    }
    if (!ignoreSearch) {
      return url;
    }
    const clean = url.split('#')[0];
    const query = clean.indexOf('?');
    return query === -1 ? clean : clean.slice(0, query);
  }

  /**
   * @param {string} key - The normalized cache key.
   * @param {Blob} blob - The blob to register.
   * @returns {MediaCacheRecord}
   */
  static #acquire(key, blob) {
    const existing = TinyMediaCache.#blobs.get(key);
    if (existing) {
      existing.refs += 1;
      return existing;
    }
    /** @type {MediaCacheRecord} */
    const record = {
      objectUrl: URL.createObjectURL(blob),
      refs: 1,
      size: blob.size,
    };
    TinyMediaCache.#blobs.set(key, record);
    return record;
  }

  /**
   * @param {string} key - The normalized cache key.
   * @returns {void}
   */
  static #release(key) {
    const record = TinyMediaCache.#blobs.get(key);
    if (!record) {
      return;
    }
    record.refs -= 1;
    if (record.refs > 0) {
      return;
    }
    URL.revokeObjectURL(record.objectUrl);
    TinyMediaCache.#blobs.delete(key);
  }
}

export default TinyMediaCache;
