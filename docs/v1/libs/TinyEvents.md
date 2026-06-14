# 📢 TinyEvents Documentation

TinyEvents is a lightweight, dependency-free **event emitter system**, inspired by Node.js’s `EventEmitter`.
It allows components to **subscribe**, **emit**, and **manage** events and their listeners in a clean and modular way.

---

## ✨ Features

* ➕ Add/remove event listeners (`on`, `off`, `offAll`, `offAllTypes`)
* 🔂 One-time listeners (`once`, `prependListenerOnce`)
* 📢 Emit events (`emit`)
* 🔍 Inspect listeners (`listenerCount`, `listeners`, `onceListeners`, `allListeners`, `eventNames`)
* ⚖️ Control maximum listeners (`setMaxListeners`, `getMaxListeners`)
* 🚨 Configurable error/warning when max listeners exceeded (`setThrowOnMaxListeners`)

---

## 📚 API Reference

### 🔹 Event Handler Callback

```ts
/**
 * A generic event listener callback function.
 *
 * @callback handler
 * @param {...any} payload - The data payload passed when the event is triggered.
 * @returns {void}
 */
```

---

### 🏗️ Class: `TinyEvents`

#### 🔒 Private Properties

* `#listeners: Map<string, { handler: handler, config: { once: boolean } }[]>` – Stores registered listeners
* `#maxListeners: number` – Maximum allowed listeners per event (default: `10`)
* `#throwMaxListeners: boolean` – Whether to throw error or only warn when max is exceeded

---

### ⚙️ Configuration

#### `setThrowOnMaxListeners(shouldThrow: boolean): void`

Enable/disable throwing an error when max listeners is exceeded.

* ✅ `true`: throws error
* ⚠️ `false`: logs warning

---

#### `getThrowOnMaxListeners(): boolean`

Check if exceeding the listener limit will throw an error or just warn.

---

#### `setMaxListeners(n: number): void`

Set the maximum number of listeners per event.

* Must be a non-negative integer.

---

#### `getMaxListeners(): number`

Get the maximum number of listeners allowed per event.

---

### ➕ Adding Listeners

#### `on(event: string|string[], handler: handler): void`

Registers an event listener.

#### `once(event: string|string[], handler: handler): handler[]`

Registers a one-time event listener that is removed after being triggered once.

#### `appendListener(event: string|string[], handler: handler): void`

Alias for `.on()`.

#### `appendListenerOnce(event: string|string[], handler: handler): handler[]`

Alias for `.once()`.

#### `prependListener(event: string|string[], handler: handler): void`

Registers a listener at the **beginning** of the listeners array.

#### `prependListenerOnce(event: string|string[], handler: handler): handler[]`

Registers a one-time listener at the **beginning** of the listeners array.

---

### ❌ Removing Listeners

#### `off(event: string|string[], handler: handler): void`

Removes a specific listener from an event.

#### `offAll(event: string|string[]): void`

Removes all listeners for one or more events.

#### `offAllTypes(): void` and `removeAllListeners(): void`

Removes **all listeners** for **all events**.

---

### 📢 Emitting Events

#### `emit(event: string|string[], ...payload: any[]): boolean[]`

Emits one or more events with optional payload.

* Returns an array of booleans:

  * `true` if listeners were called
  * `false` if no listeners were registered

---

### 🔍 Inspecting Listeners

#### `listenerCount(event: string): number`

Get the number of listeners for a given event.

#### `listeners(event: string): handler[]`

Get all listeners registered for an event (excluding `once`).

#### `onceListeners(event: string): handler[]`

Get only listeners registered with `.once()`.

#### `allListeners(event: string): handler[]`

Get all listeners, including internal wrappers (e.g. from `.once()`).

#### `eventNames(): string[]`

Get a list of all registered event names.

---

## 📝 Example Usage

```js
import TinyEvents from './TinyEvents.js';

const events = new TinyEvents();

// Add listener
events.on('data', (msg) => console.log('Received:', msg));

// Add once listener
events.once(['ready', 'init'], () => console.log('Initialized!'));

// Emit events
events.emit('data', 'Hello World');
events.emit(['ready', 'init']);

// Check listeners
console.log(events.listenerCount('data')); // 1

// Remove all listeners
events.offAll('data');
```

---

## ⚡ Notes

* Supports both **single string events** (`"data"`) and **arrays of events** (`["ready", "init"]`) 🚀
* Helps prevent memory leaks with `setMaxListeners` and warning/error system 🛑
* Perfect for **frontend components**, **Node.js scripts**, and **custom event-driven modules** 🧩
