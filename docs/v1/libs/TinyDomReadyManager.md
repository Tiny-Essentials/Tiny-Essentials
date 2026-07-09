# 🕒 TinyDomReadyManager

A flexible, customizable JavaScript class to execute code **only when the DOM is ready**, or when additional asynchronous requirements (like Promises or asset loads) are met.
Supports **prioritized callbacks**, **filters**, and now even **DOM-only fast execution**!

---

## 🧠 Type Definitions

### `Fn` 🛠️

```ts
type Fn = () => void;
```

A basic function to be executed once the system is ready.

---

### `FnFilter` 🔍

```ts
type FnFilter = () => boolean;
```

A conditional function that decides whether a handler should be executed.
Returns `true` to allow execution, or `false` to skip.

---

### `Handler` 🧩

```ts
interface Handler {
  fn: Fn;
  once: boolean;
  priority: number;
  filter: FnFilter | null;
  domOnly: boolean;
}
```

Describes a registered handler and how it should be treated during readiness flow.

---

## 🚀 Class: `TinyDomReadyManager`

### `init()` 🕓

```ts
init(): void
```

Initializes the manager and waits for the `DOMContentLoaded` event.
If the DOM is already ready, it triggers immediately.

* ⚠️ Throws an `Error` if called more than once.

---

### `addPromise(promise)` ⏳

```ts
addPromise(promise: Promise<any>): void
```

Adds a custom `Promise` that delays full readiness.
This allows tasks like `fetch()` or image preloading to block late-stage handlers.

* ⚠️ Throws a `TypeError` if `promise` is not a real `Promise`.

---

### `onReady(fn, options?)` ✅

```ts
onReady(fn: Fn, options?: {
  once?: boolean;
  priority?: number;
  filter?: FnFilter | null;
  domOnly?: boolean;
}): void
```

Registers a function to run at the right moment:

| Option     | Type               | Default | Description                                                              |
| ---------- | ------------------ | ------- | ------------------------------------------------------------------------ |
| `once`     | `boolean`          | `true`  | Whether to execute only once                                             |
| `priority` | `number`           | `0`     | Higher values run earlier                                                |
| `filter`   | `FnFilter \| null` | `null`  | Optional condition before executing                                      |
| `domOnly`  | `boolean`          | `false` | 🚀 If `true`, runs immediately after **DOM is ready**, skipping promises |

* ⚠️ Throws a `TypeError` if `fn` is not a function.

---

### `isReady()` 📡

```ts
isReady(): boolean
```

Returns `true` only after both the DOM is ready **and** all added promises have resolved.

---

### `isDomReady()` 🧱

```ts
isDomReady(): boolean
```

Returns `true` if the DOM is already ready (i.e., `DOMContentLoaded` has fired).
Returns `false` if the DOM is still loading.

> ✅ Useful when you want to know *just* when the document is interactive, regardless of async operations.

---

## 🧪 Readiness Phases

| Phase           | Description                              |
| --------------- | ---------------------------------------- |
| **DOM Ready**   | Triggers `domOnly: true` handlers        |
| **Fully Ready** | Triggers all normal `onReady()` handlers |

---

## 💡 Example Usage

### Basic Usage

```js
import TinyDomReadyManager from 'tiny-essentials/libs/TinyDomReadyManager';

const manager = new TinyDomReadyManager();

manager.onReady(() => {
  console.log('Ready after DOM + Promises!');
});

manager.addPromise(fetch('/config.json'));
manager.init();
```

---

### DOM-Only Handler (Faster)

```js
manager.onReady(() => {
  console.log('DOM is ready, skipping Promises!');
}, { domOnly: true, priority: 100 });
```

---

### Conditional + Prioritized

```js
manager.onReady(() => {
  console.log('Only runs if in dark mode');
}, {
  priority: 5,
  filter: () => document.documentElement.classList.contains('dark')
});
```

---

### Mixing Both Types

```js
manager.onReady(() => {
  console.log('DOM-only logic A');
}, { domOnly: true, priority: 10 });

manager.onReady(() => {
  console.log('DOM-only logic B');
}, { domOnly: true, priority: 5 });

manager.onReady(() => {
  console.log('Waits for API call');
});

manager.addPromise(fetch('/api/user'));
manager.init();
```

---

## 📌 Notes

* `domOnly` handlers are ideal for UI setup or event binding.
* Regular handlers are best for things that depend on data loading or external states.
* All handlers are executed safely, and exceptions are caught with warning logs.
