# 🗄️ TinyMediaCache

`TinyMediaCache` is the shared memory cache used by every media loader. It stores blobs and their object URLs, reference-counts the consumers and releases the underlying `Blob` only when the last cache that knows about it is gone.

---

## ✨ Highlights

* **Shared registry** — the same URL is downloaded once, no matter how many loaders ask for it.
* **Reference counting** — an object URL is only revoked when the last consumer releases it.
* **Three cleanup strategies** — `auto`, `manual` and `ttl`.
* **Budgets** — limit the cache by number of entries (`maxItems`) and by total size (`maxBytes`).
* **Parent/child links** — derived entries (e.g. animation frames) can be attached to the entry that owns them.
* **Statistics** — hits, misses, evictions, bytes and links.

---

## 🚀 Quick start

```js
import TinyMediaCache from 'tiny-essentials/libs/html/loader/utils/TinyMediaCache';

const cache = new TinyMediaCache({
  maxItems: 100,
  maxBytes: 128 * 1024 * 1024,
  ttl: 5 * 60 * 1000,
  strategy: TinyMediaCache.Strategy.TTL,
});
```

---

## ⚙️ Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `maxItems` | `number` | `Infinity` | Maximum number of entries. |
| `maxBytes` | `number` | `Infinity` | Maximum cache size in bytes. |
| `ttl` | `number` | `0` | Entry lifetime in milliseconds (`0` = never expires). |
| `strategy` | `'auto' \| 'manual' \| 'ttl'` | `'manual'` | Cleanup strategy applied when an entry reaches zero references. |
| `ignoreSearch` | `boolean` | `false` | Ignores the query string when building keys. |
| `sweepInterval` | `number` | `0` | Interval in milliseconds for active TTL sweeping (`0` = disabled). |

---

## 🧩 Properties

| Getter | Type | Description |
| :--- | :--- | :--- |
| `size` | `number` | Number of entries in this cache. |
| `bytes` | `number` | Total size in bytes held by this cache. |
| `links` | `number` | Number of entries that own at least one child. |
| `maxItems` | `number` | The configured item budget. |
| `maxBytes` | `number` | The configured byte budget. |
| `strategy` | `string` | The active cleanup strategy. |
| `evictions` | `number` | Number of evicted entries. |
| `destroyed` | `boolean` | `true` after `destroy()` ran. |
| `stats` | `MediaCacheStats` | A snapshot of every counter. |

---

## 🛠️ Methods

### `set(url, blob, pinned?, metadata?, parent?)`

Stores a blob and returns the created entry.

```js
cache.set('https://cdn/a.png', blob, true, { width: 100 }, null);
```

* **Throws:** `TypeError` when `blob` is not a `Blob`, when `pinned` is not a boolean, when `metadata` is not a plain object, or when `parent` is neither a string nor `null`.

### `get(url)` / `has(url)`

Reads an entry without changing its reference count.

### `peek(url)`

Reads an entry without changing its reference count **and** without touching the `hits`/`misses` counters. Expired entries are reported as missing but are not removed, so a read-only probe never mutates the cache.

```js
const entry = cache.peek('https://cdn/a.png');
if (entry) console.log(entry.size, entry.type);
```

* **Returns:** `MediaCacheEntry | null` — the live entry, or `null` when absent or expired.
* **Throws:** `TypeError` when `url` is not a string; `Error` when the cache was destroyed.

> Use `peek()` to decide *whether* to load a resource. Never use it as a replacement for `get()`/`acquire()`, which are the methods that keep the reference count correct.

### `acquire(url)` / `release(url)`

Increments / decrements the reference count. When the count reaches zero the configured strategy is applied.

### `delete(url)`

Removes an entry. When the removed entry was the last child of a parent, the parent is removed as well.

### `children(url)`

Returns the normalized keys of the entries owned by `url`.

```js
cache.set(frameUrl, frameBlob, false, {}, 'https://cdn/anim.gif');
console.log(cache.children('https://cdn/anim.gif')); // [frameUrl]
```

### `entries()`

Returns a defensive copy of every entry, including a shallow copy of each `metadata` object.

### `pin(url, value?)`

Protects (or unprotects) an entry from eviction.

### `prune()` / `clear()` / `destroy()`

Removes expired entries, empties the cache, or tears the instance down and releases the shared registry.

---

## 🧠 Strategies

| Strategy | Behavior |
| :--- | :--- |
| `auto` | The entry is deleted as soon as its reference count reaches zero. |
| `manual` | The entry stays until `delete`, `clear` or eviction. |
| `ttl` | The entry expires after `ttl` milliseconds. |

---

## 📊 Statistics

```js
const { size, bytes, hits, misses, evictions, links, instances, blobs } = cache.stats;
```

| Field | Description |
| :--- | :--- |
| `size` | Entries in this cache. |
| `bytes` | Total size in bytes held by this cache. |
| `refs` | Total number of active references. |
| `hits` / `misses` | Lookup counters. |
| `evictions` | Entries evicted by the limits. |
| `links` | Entries that own at least one child. |
| `instances` | Live cache instances. |
| `blobs` | Blobs in the shared registry. |

---

## 🔗 Parent / child links

Derived blobs (animation frames, thumbnails, transcoded variants) can be attached to the entry that produced them:

```js
cache.set(originalUrl, originalBlob);

frames.forEach((frame, index) => {
  cache.set(`${originalUrl}#frame-${index}`, frame, false, { index }, originalUrl);
});

console.log(cache.links); // 1
console.log(cache.children(originalUrl).length); // frames.length
```
Deleting the last child also deletes the parent, which keeps the cache consistent without any manual bookkeeping.
