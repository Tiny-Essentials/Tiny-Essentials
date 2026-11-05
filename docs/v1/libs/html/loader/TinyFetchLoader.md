# 📥 TinyFetchLoader

`TinyFetchLoader` is a generic file loader built on top of [`TinyMediaLoader`](./TinyMediaLoader.md). It does not create a DOM element — it downloads any resource and exposes the payload as a `Blob`, `ArrayBuffer`, `string` or parsed `JSON`.

Because it reuses the whole media pipeline, it inherits progress tracking, caching, mirroring, timeouts and the typed event surface.

---

## ✨ Highlights

* **Any payload type** — `blob`, `arraybuffer`, `text` or `json`.
* **`fetch` compatible** — `exportFetch()` returns a drop-in replacement for `globalThis.fetch`.
* **Cloneable** — `clone(overrides)` creates an independent loader that reuses the shared cache.
* **No DOM required** — works in workers and in Node.js (with a `fetch` implementation).

---

## 🚀 Quick start

```js
import TinyFetchLoader from 'tiny-essentials/libs/html/loader/formats/TinyFetchLoader';

const loader = new TinyFetchLoader({
  src: 'https://api.example.com/data.json',
  responseType: 'json',
  init: { headers: { Accept: 'application/json' } },
  timeout: 15_000,
});

loader.on('progress', (p) => console.log(`${p.percent.toFixed(0)}%`));

await loader.load();
console.log(loader.data);
```

---

## ⚙️ Options

Inherits every [`TinyMediaLoader`](./TinyMediaLoader.md) option, plus:

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `''` | The file URL. |
| `init` | `RequestInit` | `{}` | Options forwarded to `fetch` (method, headers, body, credentials, mode, cache, redirect, referrer, referrerPolicy, integrity, keepalive). |
| `fetch` | `typeof fetch` | `globalThis.fetch` | A custom fetch implementation. |
| `responseType` | `'blob' \| 'arraybuffer' \| 'text' \| 'json'` | `'blob'` | How the payload is parsed. |
| `body` | `BodyInit \| undefined` | `undefined` | The request body forwarded to the transport. Ignored by `GET`/`HEAD`; `init.body` wins when both are set. |

> **Note:** `body` is inherited from [`TinyMediaLoader`](./TinyMediaLoader.md#-request-body) and is only sent when the request method is not `GET`/`HEAD`.

---

## 🧩 Properties

| Getter | Type | Description |
| :--- | :--- | :--- |
| `blob` | `Blob \| null` | The raw payload, or `null` before the load finishes. |
| `data` | `Blob \| ArrayBuffer \| string \| unknown \| null` | The parsed payload. |
| `responseType` | `string` | The requested response type. |
| `init` | `RequestInit` | A defensive copy of the fetch options. |

---

## 🛠️ Methods

### `clone(overrides = {})`

Creates a new, fully independent loader. The shared `cache` and the custom `fetch` implementation are reused by reference, which makes cloning cheap.

```js
const json = loader.clone({ responseType: 'json' });
const text = loader.clone({ responseType: 'text' });
```

### `exportFetch()`

Returns a function with the same signature as `fetch` that is backed by this loader.

```js
const tinyFetch = loader.exportFetch();
const response = await tinyFetch('https://api.example.com/ping');
```

---

## 📦 Response types

| `responseType` | `loader.data` |
| :--- | :--- |
| `'blob'` *(default)* | `Blob` |
| `'arraybuffer'` | `ArrayBuffer` |
| `'text'` | `string` |
| `'json'` | `unknown` |

---

## 🧪 Example: downloading a JSON file with progress

```js
import TinyFetchLoader from 'tiny-essentials/libs/html/loader/formats/TinyFetchLoader';

const loader = new TinyFetchLoader({
  src: './data/large-dataset.json',
  responseType: 'json',
});

loader.on('progress', ({ percent, rate, eta }) => {
  console.log(`${percent.toFixed(1)}% — ${(rate / 1024).toFixed(0)} KB/s — ETA ${(eta / 1000).toFixed(1)}s`);
});

await loader.load();
console.log(loader.data);
```
