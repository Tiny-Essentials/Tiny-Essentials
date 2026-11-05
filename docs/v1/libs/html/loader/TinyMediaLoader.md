# 📦 TinyMediaLoader

`TinyMediaLoader` is the abstract base class that powers every media loader in the library. It owns the whole lifecycle of a media element — download, cache, progress, state machine and cleanup — while subclasses only describe **how** a specific kind of media is created and decoded.

> **Note:** this class cannot be instantiated directly. Use [`TinyImageLoader`](./TinyImageLoader.md), [`TinyFetchLoader`](./TinyFetchLoader.md) or extend it with your own `_createElement` / `_startLoad` implementation.

---

## ✨ Highlights

* **Full state machine** — `idle` → `loading` → `loaded` / `error` → `destroyed`.
* **Streaming with progress** — every chunk is measured, so you get speed, ETA and byte counts for free.
* **Shared cache** — plug a [`TinyMediaCache`](./TinyMediaCache.md) and the same URL is never downloaded twice.
* **Mirror registry** — concurrent loads of the same URL share a single network request.
* **Progressive rendering** — the element is updated while the bytes are still arriving.
* **Optional `HEAD` pre-flight** — read the response headers before downloading the body.
* **Typed events** — the entire event surface is described by `MediaLoaderEvents`.

---

## 🚀 Quick start

```js
import TinyImageLoader from 'tiny-essentials/libs/html/loader/formats/TinyImageLoader';
import TinyMediaCache from 'tiny-essentials/libs/html/loader/utils/TinyMediaCache';

const cache = new TinyMediaCache({ maxItems: 50, maxBytes: 64 * 1024 * 1024 });

const loader = new TinyImageLoader({
  src: 'https://picsum.photos/1200/800',
  cache,
  timeout: 30_000,
});

loader.on('progress', (p) => console.log(`${p.percent.toFixed(1)}%`));
loader.on('error', (error) => console.error(error));

await loader.load();
loader.mount(document.body);
```

---

## ⚙️ Options

Every option is optional.

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `''` | The media source URL. |
| `timeout` | `number` | `Infinity` | Maximum time in milliseconds before the load is aborted. |
| `element` | `HTMLElement \| null` | `null` | An existing DOM element to adopt instead of creating a new one. |
| `autoReload` | `boolean` | `false` | Reloads automatically when the `src` attribute changes externally. |
| `originalSrc` | `boolean` | `false` | Mirrors the original URL into the `original-src` attribute. |
| `earlyDecode` | `boolean` | `true` | Decodes dimensions from the response headers using WebCodecs. |
| `progressive` | `boolean` | `true` | Renders the media while it is still downloading. |
| `useHeadRequest` | `boolean` | `false` | Performs a `HEAD` request to read the headers before downloading. |
| `mirror` | `boolean` | `true` | Shares a single download between loaders that request the same URL. |
| `cache` | `TinyMediaCache \| null` | `null` | A shared memory cache. |

---

## 🧩 Properties

### State

| Getter | Type | Description |
| :--- | :--- | :--- |
| `state` | `string` | The current state machine value. |
| `isLoading` | `boolean` | `true` while a load is in flight. |
| `isLoaded` | `boolean` | `true` after a successful load. |
| `hasError` | `boolean` | `true` when the last load failed. |
| `aborted` | `boolean` | `true` when the last load was aborted. |

### Source & element

| Getter | Type | Description |
| :--- | :--- | :--- |
| `src` | `string` | The current source URL (settable). |
| `internalSrc` | `string` | The URL currently assigned to the element (may be an object URL). |
| `objectUrl` | `string \| null` | The object URL created for a streamed blob. |
| `element` | `HTMLElement \| null` | The managed DOM element. |

### Network

| Getter | Type | Description |
| :--- | :--- | :--- |
| `response` | `Response \| null` | The `GET` response, when one was received. |
| `headResponse` | `Response \| null` | The `HEAD` response, when `useHeadRequest` is enabled. |
| `useHeadRequest` | `boolean` | Whether the `HEAD` pre-flight is enabled. |
| `progressive` | `boolean` | Whether progressive rendering is enabled. |
| `mirror` | `boolean` | Whether download mirroring is enabled. |
| `mirrored` | `boolean` | `true` when the payload was shared by another loader. |
| `signal` | `AbortSignal` | The signal of the current request. |

### Metrics

| Getter | Type | Description |
| :--- | :--- | :--- |
| `progress` | `MediaProgressSnapshot \| null` | The latest progress snapshot. |
| `metadata` | `MediaMetadata` | The metadata of the last successful load. |
| `resourceSize` | `number` | The resource size in bytes. |
| `startTime` | `number` | Timestamp of when the load started. |
| `endTime` | `number` | Timestamp of when the load finished. |
| `cacheHint` | `boolean` | Whether the resource is expected to come from the cache. |
| `cacheAcquired` | `boolean` | Whether the cache entry is currently acquired. |

---

## 🛠️ Methods

### `load()`

Starts the download and resolves with the final `MediaMetadata`.

```js
const metadata = await loader.load();
console.log(metadata.width, metadata.height, metadata.size);
```

* **Throws:** `Error` when the loader was destroyed, is already loading, or has no source.

### `reload()`

Resets the state machine and loads the current source again.

### `abort()`

Cancels the in-flight load.

* **Returns:** `boolean` — `true` when a load was cancelled.

### `mount(container)`

Appends the managed element to `container`.

```js
loader.mount(document.querySelector('#stage'));
```

### `destroy()`

Aborts the request, releases the cache entry, detaches every listener and revokes the object URLs. The instance cannot be reused afterwards.

---

## 📡 Events

| Event | Payload | Description |
| :--- | :--- | :--- |
| `loadstart` | `{ src }` | A load just started. |
| `progress` | `MediaProgressSnapshot` | Download progress. |
| `chunk` | `{ chunk, loaded, total }` | A binary chunk was received. |
| `metadata` | `(metadata, type)` | Partial or full metadata was resolved. |
| `response` | `Response` | The `GET` response was received. |
| `headResponse` | `Response` | The `HEAD` response was received. |
| `cachemiss` | `MediaCacheEntry` | The resource was not in the cache. |
| `cachehit` | `MediaCacheEntry` | The resource was served from the cache. |
| `mirror` | `MediaMirrorPayload` | The download is being shared with another loader. |
| `statechange` | `{ state, previous, src }` | The state machine transitioned. |
| `srcchange` | `{ src, previousSrc }` | The source URL changed. |
| `srctransition` | `{ src, internalSrc }` | The element swapped between a network and an object URL. |
| `timeout` | `{ src, timeout }` | The configured timeout was reached. |
| `abort` | `{ src }` | The load was aborted. |
| `loaded` | `MediaMetadata` | The media was fully loaded. |
| `loadend` | `{ src, state }` | The load finished, successfully or not. |
| `error` | `Error` | An unrecoverable error occurred. |
| `destroy` | — | The loader was destroyed. |

---

## 🧬 Metadata

```ts
type MediaMetadata = {
  src: string;
  type: string;
  width: number;
  height: number;
  duration: number;
  size: number;
  fromCache: boolean;
  loadTime: number;
  timestamp: number;
  animation: AnimationProbeData | null;
  httpHeaders?: Record<string, string>;
};
```

---

## 🪞 Mirror registry

When two loaders request the same URL at the same time, only one connection is opened. The second loader attaches to the running download, replays the events emitted so far and receives the very same `Blob` instance.

```js
const a = new TinyImageLoader({ src, mirror: true });
const b = new TinyImageLoader({ src, mirror: true });

b.on('mirror', (info) => console.log(`sharing with ${info.mirrors} loader(s)`));

await Promise.all([a.load(), b.load()]);
console.log(b.mirrored); // true
```

Set `mirror: false` to always open a dedicated request.

---

## 🧩 Extending

Subclasses must implement the protected hooks below.

| Hook | Description |
| :--- | :--- |
| `static get tagName` | The uppercase tag name of the managed element. |
| `_createElement()` | Creates the DOM element. |
| `_startLoad()` | Performs the download and resolves when the media is ready. |
| `_getMetadataDetails()` | Returns the media specific metadata fields. |
| `_abort()` | Cancels the underlying operation. |
| `_cleanup()` | Releases the subclass resources. |

```js
import TinyMediaLoader from 'tiny-essentials/libs/html/loader/TinyMediaLoader';

class TinyJsonLoader extends TinyMediaLoader {
  static get tagName() {
    return 'DIV';
  }

  async _startLoad() {
    const blob = await this._downloadStream(this.src);
    this.data = JSON.parse(await blob.text());
  }

  _getMetadataDetails() {
    return { type: 'application/json', width: 0, height: 0, duration: 0, size: 0 };
  }

  _createElement() {
    return document.createElement('div');
  }
}
```
