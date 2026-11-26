# 🔔 TinyNotificationAdapter

> **One adapter. Two worlds: the Service Worker and the Page.**
> Stop guessing which properties survive the trip from `ServiceWorkerRegistration.showNotification()` to `new Notification()`.

---

## 📑 Table of Contents

- [🎯 Why This Exists](#-why-this-exists)
- [📦 Installation & Import](#-installation--import)
- [🧠 Core Concepts](#-core-concepts)
- [🗺️ API Reference](#️-api-reference)
  - [Typedefs](#typedefs)
  - [`TinyNotificationAdapter.PUSH_TYPE`](#tinynotificationadapterpush_type)
  - [`toBrowser()`](#tobrowser)
  - [`toServiceWorker()`](#toserviceworker)
- [⚠️ Gotchas & Edge Cases](#️-gotchas--edge-cases)
- [🧪 Testing in the Console](#-testing-in-the-console)

---

## 🎯 Why This Exists

The Web Notifications API has **two different constructors** that look almost identical but are **not**:

| | Service Worker | Page |
|---|---|---|
| API | `registration.showNotification(title, options)` | `new Notification(title, options)` |
| `actions` | ✅ Supported | ❌ Throws / ignored |
| `badge` | ✅ Supported | ❌ Throws / ignored |
| `renotify` without `tag` | ✅ Tolerated | 💥 Throws on Chromium |
| `dir` | `string` | Closed union `'auto' \| 'ltr' \| 'rtl'` |

If you forward a payload from one side to the other **without adapting it**, you get silent failures, or worse, a hard `TypeError` that only happens on one browser.

`TinyNotificationAdapter` is the **single, tested place** where that translation happens.

```text
┌──────────────────────┐                      ┌──────────────────────┐
│   SERVICE WORKER     │                      │        PAGE          │
│                      │                      │                      │
│  push event          │   TinyPushNotif.     │  new Notification()  │
│  ────────────────────┼─────────────────────▶│                      │
│                      │   toBrowser()  ──────┼──▶  { title, options }│
│                      │                      │                      │
│                      │   toServiceWorker()  │                      │
│                      │◀─────────────────────┼──  { title, body,    │
│                      │                      │       options }      │
└──────────────────────┘                      └──────────────────────┘
```

---

## 📦 Installation & Import

The class is a **default export** and has **zero runtime dependencies** beyond `PUSH_TYPE`.

```js
import TinyNotificationAdapter from 'tiny-essentials/libs/sw/browser/TinyNotificationAdapter';
```

Because every member is `static`, you **never** write `new TinyNotificationAdapter()`. The constructor is never called.

---

## 🧠 Core Concepts

### 1. It is a namespace, not a factory

The class is a **static-only utility**. It holds no state and stores nothing between calls. Every method is pure with respect to the instance (there is no instance).

### 2. It normalizes in both directions

| Direction | Method | Use it right before… |
|---|---|---|
| Service Worker ➡️ Page | `toBrowser()` | `new Notification(...)` |
| Page ➡️ Service Worker | `toServiceWorker()` | `postMessage(...)` / `fetch(...)` |

### 3. It is *defensive*, not *strict*

The adapter **repairs** bad input instead of throwing whenever it can:

- A missing `title` becomes `'Notification'`.
- An invalid `dir` is **deleted**.
- `renotify: true` without a `tag` is **deleted**.
- `undefined` values are **skipped**.

It only throws when the **shape** of an argument is fundamentally wrong (e.g. you passed a string or an array).

---

## 🗺️ API Reference

### Typedefs

#### `BrowserNotificationOptions`

Options accepted by the page-level `Notification` constructor.

| Property | Type | Default | Description |
|---|---|---|---|
| `body` | `string` | `undefined` | The main text of the notification, shown below the title. |
| `icon` | `string` | `undefined` | URL of the image used as the notification icon. |
| `image` | `string` | `undefined` | URL of an image shown inside the notification body. |
| `tag` | `string` | `undefined` | Identifier used to group and replace notifications sharing the same tag. |
| `lang` | `string` | `undefined` | BCP 47 language tag describing the notification text. |
| `dir` | `'auto' \| 'ltr' \| 'rtl'` | `undefined` | Text direction used to render the notification content. |
| `renotify` | `boolean` | `undefined` | Whether to notify again when a notification with the same `tag` is replaced. |
| `requireInteraction` | `boolean` | `undefined` | Whether the notification stays visible until the user interacts with it. |
| `silent` | `boolean` | `undefined` | Whether the notification is shown without sound or vibration feedback. |
| `timestamp` | `number` | `undefined` | Time the notification was created, in ms since the Unix epoch. |
| `vibrate` | `number[]` | `undefined` | Vibration pattern, in milliseconds, on supported devices. |
| `data` | `Record<string, unknown>` | `undefined` | Arbitrary payload attached to the notification for later retrieval. |

#### `BrowserNotification`

```js
/**
 * @typedef {Object} BrowserNotification
 * @property {string} title
 * @property {BrowserNotificationOptions} options
 */
```

---

### `TinyNotificationAdapter.PUSH_TYPE`

**Why it exists:** it lets a consumer compare message types **without importing `utils.mjs` a second time**, which keeps the dependency graph shallow and avoids duplicate-module bugs in bundlers.

```js
if (event.data.type === TinyNotificationAdapter.PUSH_TYPE) {
  // ...
}
```

---

### `toBrowser()`

> **Service Worker ➡️ Page.** Call this *before* `new Notification(...)`.

#### Signature

```js
static toBrowser(notification, overrides = {}) → BrowserNotification
```

#### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `notification` | `TinyPushNotification \| null` | ✅ | Descriptor sent by the Service Worker. `null` is valid and produces a safe default. |
| `overrides` | `Partial<BrowserNotificationOptions>` | ❌ | Values that **win** over the descriptor. |

#### Returns

`BrowserNotification` — always an object with a **guaranteed string** `title` and a plain `options` object.

#### Throws

| Error | Condition |
|---|---|
| `TypeError` | `notification` is neither `null` nor a non-null, non-array object. |
| `TypeError` | `overrides` is not a non-null, non-array object. |

#### What it does, step by step

1. **Validates** both arguments.
2. **Strips** every key listed in the private `#SW_ONLY_KEYS` (`'actions'`, `'badge'`).
3. **Drops** any key whose value is `undefined`.
4. **Sanitizes `dir`** — anything that is not `'auto'`, `'ltr'` or `'rtl'` is deleted.
5. **Drops `renotify`** when it is `true` but `tag` is not a string (Chromium throws otherwise).
6. **Falls back to `'Notification'`** when `title` is missing, empty, or not a string.
7. **Merges `overrides` last.**

#### Example

```js
import TinyNotificationAdapter from 'tiny-essentials/libs/sw/browser/TinyNotificationAdapter';

const { title, options } = TinyNotificationAdapter.toBrowser(
  {
    title: 'Build finished',
    body: 'main@a1b2c3d',
    badge: '/icons/badge.png', // stripped: SW-only
    actions: [{ action: 'open' }], // stripped: SW-only
    dir: 'sideways', // stripped: invalid union member
    renotify: true, // stripped: no tag
    icon: '/icons/ok.png',
  },
  { silent: false },
);

new Notification(title, options);
// → title:   'Build finished'
// → options: { body: 'main@a1b2c3d', icon: '/icons/ok.png', silent: false }
```

---

### `toServiceWorker()`

> **Page ➡️ Service Worker.** Call this before sending a click/close event back.

#### Signature

```js
static toServiceWorker(notification, overrides = {}) → { title: string, body: string, options: BrowserNotificationOptions }
```

#### Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `notification` | `BrowserNotification` | ✅ | The value returned by `toBrowser()`. |
| `overrides` | `Partial<BrowserNotificationOptions>` | ❌ | Values that **win** over the descriptor. |

#### Returns

An object with a **guaranteed string `body`** (empty string when the merged `body` is not a string), plus the full merged `options`.

#### Throws

| Error | Condition |
|---|---|
| `TypeError` | `notification` is not a non-null, non-array object. |
| `TypeError` | `overrides` is not a non-null, non-array object. |

> ⚠️ **Asymmetry to remember:** `toServiceWorker()` does **not** strip `actions` or `badge`. That is intentional — the Service Worker is the only side allowed to use them.

#### Example

```js
const payload = TinyNotificationAdapter.toServiceWorker(
  { title: 'Build finished', options: { body: 'main@a1b2c3d' } },
  { body: 'clicked' },
);

navigator.serviceWorker.controller.postMessage(payload);
// → { title: 'Build finished', body: 'clicked', options: { body: 'clicked' } }
```

---

## ⚠️ Gotchas & Edge Cases

| # | Behaviour | Why it matters |
|---|---|---|
| 1 | `overrides` are merged **after** sanitization. | An override can re-introduce an invalid `dir`. Sanitize your overrides at the call site. |
| 2 | `toBrowser()` never mutates the input. | It builds a fresh `options` object. Safe to reuse the payload. |
| 3 | `title` falls back to `'Notification'` for `''`, `0`, or `null`. | Only a non-empty `string` survives. |
| 4 | `toServiceWorker()` does **not** validate `title`. | A `null` title passes through untouched. Validate upstream if it matters. |
| 5 | `body` is guaranteed to be a `string` in the **return value**, but `options.body` keeps the original value. | Read `result.body` when you need certainty. |
| 6 | `actions` and `badge` are dropped by `toBrowser()` only. | They are legal in the Service Worker and preserved by `toServiceWorker()`. |
| 7 | `#SW_ONLY_KEYS` is `Object.freeze`d. | You cannot patch the list at runtime. See [Extending](#-extending-the-adapter). |

---

## 🧪 Testing in the Console

Paste this into DevTools to verify the adapter without a Service Worker:

```js
const adapter = (await import('tiny-essentials/libs/sw/browser/TinyNotificationAdapter')).default;

console.table([
  adapter.toBrowser(null),
  adapter.toBrowser({ title: 'Hi', badge: 'x', dir: 'nope' }),
  adapter.toBrowser({ title: 'Hi', renotify: true }),
  adapter.toBrowser({ title: 'Hi', renotify: true, tag: 'build' }),
]);
```

Expected highlights:

- `badge` and `dir` are gone in the second row.
- `renotify` is gone in the third row.
- `renotify` **survives** in the fourth row because `tag` is a string.
