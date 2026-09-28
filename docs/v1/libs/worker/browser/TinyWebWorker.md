# 🧵 TinyWebWorker

A tiny, strictly-typed wrapper around the native `Worker` API with a built-in
request/response (RPC) layer, lifecycle management, and a plugin system.

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Installation](#-installation)
4. [Quick Start](#-quick-start)
5. [Core Concepts](#-core-concepts)
6. [API Reference](#-api-reference)
7. [The Worker Side](#-the-worker-side)
8. [Message Protocol](#-message-protocol)
9. [Error Handling](#-error-handling)
10. [Best Practices](#-best-practices)
11. [Troubleshooting](#-troubleshooting)

---

## 🔎 Overview

`TinyWebWorker` turns the low-level, string-based `postMessage` API into a
predictable, promise-based experience. It handles three things for you:

| Responsibility | What it means |
| --- | --- |
| 🔄 **Lifecycle** | Start, wait for readiness, terminate, and destroy safely. |
| 📨 **Events** | Fire-and-forget messages from the main thread to the worker. |
| 🔌 **RPC / API** | Request/response calls in **both directions**, with timeouts. |

It extends `TinyPluginCore`, so every instance is also a plugin host with an
event emitter (`on`, `emit`, `removeAllListeners`).

---

## ✨ Features

- ✅ **Promise-based RPC** — call functions inside the worker and `await` the result.
- ✅ **Bidirectional API** — the worker can call back into the main thread too.
- ✅ **Timeouts** — every API call has a configurable timeout (default: `10s`).
- ✅ **Reserved namespace** — the `ww:` prefix protects internal events.
- ✅ **Zero-leak teardown** — `destroy()` removes listeners and clears references.
- ✅ **Pluggable logger** — bring your own `console`-compatible logger.

---

## 🚀 Quick Start

### 1. Create the worker file

```javascript
// my.worker.js
self.postMessage({ type: 'ww:EngineReady' });

self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  if (type === 'greet') {
    self.postMessage({ type: 'greeted', data: `Hello, ${data.name}!` });
  }
});
```

### 2. Use it from the main thread

```javascript
import TinyWebWorker from 'tiny-essentials/libs/worker/browser/TinyWebWorker';

const worker = new TinyWebWorker({
  id: 'greeter',
  workerUrl: new URL('./my.worker.js', import.meta.url),
  debugMode: true,
});

// Wait until the worker signals readiness.
await worker.init();

// Listen for a standard event coming from the worker.
worker.on('greeted', ({ data }) => {
  console.log(data); // "Hello, Yasmin!"
});

// Send a fire-and-forget message.
worker.emitMessage('greet', { name: 'Yasmin' });

// Clean up when done.
worker.destroy();
```

---

## 🧠 Core Concepts

### 🏷️ The `ww:` Reserved Prefix

Any event type that starts with `ww:` is **reserved for internal use**.
Calling `emitMessage('ww:something')` throws a `TypeError`. This prevents your
code from accidentally colliding with lifecycle events like `ww:Started`.

### 🔁 Two Communication Styles

| Style | Method | Direction | Returns | Use when... |
| --- | --- | --- | --- | --- |
| **Event** | `emitMessage()` | Main ➡️ Worker | `void` | You don't need an answer. |
| **API** | `emitApi()` | Main ➡️ Worker | `Promise` | You need a response. |
| **API (reverse)** | `onApi()` | Worker ➡️ Main | — | The worker needs data from the main thread. |

### 🧬 Lifecycle

```
new TinyWebWorker()  ──▶  init()  ──▶  [ ww:EngineReady ]  ──▶  ready ✅
                             │
                             └──▶  terminate()  ──▶  destroy()  ──▶  💀
```

---

## 📚 API Reference

### `new TinyWebWorker(options)`

Creates a new manager instance.

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | `string` | — | **Required.** Unique identifier for this instance. |
| `workerUrl` | `string \| URL` | — | **Required.** Path to the worker file. |
| `workerOptions` | `WorkerOptions` | `{}` | Native worker options (`type`, `name`, etc.). |
| `debugMode` | `boolean` | `false` | Enables verbose internal logging. |
| `useLogColors` | `boolean` | `false` | Enables ANSI colors in logs. |
| `logger` | `Partial<Console>` | `console` | A custom logger. |

**Throws:** `TypeError` if `id` is not a non-empty string, or if `workerUrl`
is neither a `string` nor a `URL`.

---

### ⚙️ Methods

#### `init(): Promise<void>`

Instantiates the worker and wires up the message bridge. Resolves when the
worker posts the `ww:EngineReady` signal.

```javascript
await worker.init();
```

**Throws:** `Error` if the worker is already initialized or the instance was destroyed.

---

#### `emitMessage(type, data?): void`

Sends a fire-and-forget event to the worker. This is the **strict** sender.

```javascript
worker.emitMessage('resize', { width: 800, height: 600 });
```

**Throws:**
- `TypeError` — if `type` is not a string.
- `TypeError` — if `data` is not a non-null object (arrays are rejected).
- `TypeError` — if `type` starts with the reserved `ww:` prefix.

---

#### `emitApi(type, data?, timeout?): Promise<any>`

Sends a request and resolves with the worker's response.

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `string` | — | The API call identifier. |
| `data` | `object` | `undefined` | The request payload. |
| `timeout` | `number` | `10000` | Max wait time in milliseconds. |

```javascript
const result = await worker.emitApi('math:sum', { a: 2, b: 3 });
console.log(result); // 5
```

**Rejects:** with an `Error` if the worker returns an error or the timeout elapses.

---

#### `onApi(type, callback): void`

Registers a handler for API calls **coming from the worker**.

```javascript
worker.onApi('user:getTheme', () => {
  return { theme: 'dark' };
});
```

**Throws:** `TypeError` if `callback` is not a function.

---

#### `offApi(type): boolean`

Removes a previously registered handler. Returns `true` if a handler was removed.

```javascript
worker.offApi('user:getTheme');
```

---

#### `terminate(): void`

Immediately terminates the worker and removes all listeners. The instance can
technically be re-initialized afterwards, but a new worker will be created.

```javascript
worker.terminate();
```

---

#### `destroy(): void`

The nuclear option. Calls `terminate()`, removes all event listeners, destroys
plugins, and marks the instance as destroyed. **After this, the instance is unusable.**

```javascript
worker.destroy();
```

---

### 🎛️ Getters

| Getter | Type | Description |
| --- | --- | --- |
| `isReady` | `boolean` | `true` once the worker signals readiness. |
| `isDestroyed` | `boolean` | `true` after `destroy()` is called. |
| `worker` | `Worker \| null` | The native worker. **Throws if destroyed.** |

---

### 📡 Events

Subscribe with `worker.on(eventName, handler)`.

| Event | Payload | Fired when... |
| --- | --- | --- |
| `ww:Started` | — | The worker is ready. |
| `ww:Error` | `{ error: ErrorEvent }` | The worker throws an uncaught error. |
| `ww:Terminated` | — | `terminate()` completes. |
| *custom* | `{ data, event }` | Any event sent by the worker. |

```javascript
worker.on('ww:Error', ({ error }) => {
  console.error('Worker crashed:', error.message);
});
```

---

## 📨 Message Protocol

Every message is a plain object. These are the exact shapes the main thread
reads and writes.

### Main ➡️ Worker

```javascript
// Fire-and-forget event
{ type: 'my:event', data: { /* ... */ } }

// API request
{ type: 'my:api', data: { /* ... */ }, correlationId: 'uuid', isApi: true }
```

### Worker ➡️ Main

```javascript
// Readiness signal (required once)
{ type: 'ww:EngineReady' }

// API response (success)
{ type: 'ww:ApiResponse', correlationId: 'uuid', data: { /* ... */ } }

// API response (error)
{ type: 'ww:ApiResponse', correlationId: 'uuid', error: 'Something failed' }
```

---

## 🚨 Error Handling

`TinyWebWorker` fails loudly and early:

- **Construction** validates `id` and `workerUrl` immediately.
- **`emitMessage`** rejects arrays and primitives as `data`.
- **`emitApi`** rejects its promise on timeout or worker-side errors.
- **`ww:Error`** is emitted for uncaught worker errors.

```javascript
try {
  const result = await worker.emitApi('risky:operation', { id: 42 }, 5000);
} catch (error) {
  console.error('The call failed:', error.message);
}
```

---

## ✅ Best Practices

1. **Always `await worker.init()`** before sending messages.
2. **Always call `destroy()`** in your framework's cleanup (e.g., `useEffect`, `onUnmounted`).
3. **Prefer `emitApi` over `emitMessage`** when you need confirmation.
4. **Never use the `ww:` prefix** in your own event names.
5. **Set realistic timeouts** for long-running tasks instead of relying on the default `10s`.

---

## 🩺 Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `init()` never resolves | Worker never posts `ww:EngineReady`. | Add the ready signal at the end of your worker. |
| `API request timeout` | The worker never responded. | Check the `correlationId` handling in the worker. |
| `The event type "..." is reserved` | You used the `ww:` prefix. | Rename your event. |
| `Worker is not initialized` | You called a method before `init()`. | `await worker.init()` first. |
