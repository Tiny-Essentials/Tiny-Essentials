# 🖱️ TinyUserActivationDetector Documentation

`TinyUserActivationDetector` queues callbacks until the browser reports a **user activation**.

Browsers only allow a few APIs to start without a previous interaction — media playback, fullscreen, clipboard writes, sensors, and so on. When the action is triggered by something other than the visitor (a scroll position, a timer, a route change), the call is silently rejected. This class holds those requests and runs them **in order** as soon as the document is activated.

---

## 📑 Table of Contents

- [🧠 How it works](#-how-it-works)
- [🚀 Getting Started](#-getting-started)
- [🏗️ Constructor](#️-constructor)
- [📖 API Reference](#-api-reference)
  - [Static](#static)
  - [Methods](#methods)
  - [Getters](#getters)
- [💡 Practical Examples](#-practical-examples)
  - [Deduplicating requests with a key](#deduplicating-requests-with-a-key)
  - [Cancelling a request](#cancelling-a-request)
  - [Server-side rendering](#server-side-rendering)
- [⚠️ Best Practices](#️-best-practices)

---

## 🧠 How it works

The activation is read from `navigator.userActivation.hasBeenActive` instead of the gesture events because it is **sticky**: a single interaction is enough for the whole session, and an interaction that happens _before_ the first request is not lost.

```
locked ──whenReady()──▶ queue ──(activation detected)──▶ flush()
   │                       ▲
   └──── unlock() ─────────┘
```

While the queue is not empty, the instance polls `navigator.userActivation` every `100ms`. The polling stops as soon as the queue is flushed.

---

## 🚀 Getting Started

```javascript
import TinyUserActivationDetector from 'tiny-essentials/libs/utils/TinyUserActivationDetector';

const detector = new TinyUserActivationDetector({ debugMode: false });

// Runs immediately when the page is already active, or as soon as the
// visitor interacts with it.
detector.whenReady(() => audio.play(), 'main-audio');
```

---

## 🏗️ Constructor

```javascript
new TinyUserActivationDetector(options);
```

| Option         | Type               | Default   | Description                                              |
| :------------- | :----------------- | :-------- | :------------------------------------------------------- |
| `debugMode`    | `boolean`          | `false`   | Enables the internal debug logging (via `TinyDebugger`). |
| `useLogColors` | `boolean`          | `false`   | Enables ANSI colors in the debug logs.                   |
| `logger`       | `Partial<Console>` | `console` | A custom logger that implements the `Console` interface. |

Every option is validated. The constructor throws a `TypeError` when `options` is not a plain object, when `debugMode`/`useLogColors` are not booleans, or when `logger` is not a `Console`-compatible object.

---

## 📖 API Reference

### Static

| Member                                           | Description                                                                                                                                                                                                                                                              |
| :----------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TinyUserActivationDetector.hasUserActivation()` | Returns `true` when the browser reports a previous activation (`navigator.userActivation.hasBeenActive`). Always `false` when the API is unavailable.                                                                                                                    |
| `TinyUserActivationDetector.isUnlocked()`        | Returns `true` when a queued callback can run without waiting for an activation. It is the negation of `hasUserActivation()`, except that a missing `navigator` (server-side rendering) is treated as already unlocked.                                                  |
| `TinyUserActivationDetector.pollInterval`        | Getter/setter for the polling interval in milliseconds (default `100`). The setter throws `TypeError` for non-finite values and `RangeError` for values `<= 0`.                                                                                                          |

```javascript
TinyUserActivationDetector.pollInterval = 250; // check every 250ms
```

### Methods

| Method                      | Description                                                                                                                                                                                                               |
| :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `whenReady(callback, key?)` | Runs `callback` as soon as the page is activated. Returns the request key, or an empty string when the callback ran immediately. Throws `TypeError` when `callback` is not a function or `key` is not a non-empty string. |
| `cancel(key)`               | Discards a single pending request. Throws `TypeError` when `key` is not a string.                                                                                                                                         |
| `unlock()`                  | Marks the page as unlocked and flushes the queue. Calling it more than once has no effect.                                                                                                                                |
| `flush()`                   | Runs every pending callback and empties the queue. Every callback runs even if a previous one throws; the errors are rethrown at the end (`AggregateError` when there is more than one).                                  |
| `clear()`                   | Discards every pending request and stops watching the activation.                                                                                                                                                         |
| `reset()`                   | Restores the instance to its initial state (the `unlocked` state is intentionally preserved).                                                                                                                             |

### Getters

| Getter       | Type      | Description                                            |
| :----------- | :-------- | :----------------------------------------------------- |
| `size`       | `number`  | Number of callbacks waiting for the activation.        |
| `autoKey`    | `number`  | Number of automatic keys already generated.            |
| `unlocked`   | `boolean` | Whether the browser already allows the protected APIs. |
| `existsTime` | `boolean` | Whether the polling timer is currently scheduled.      |

---

## 💡 Practical Examples

### Deduplicating requests with a key

A new request **replaces** a pending one with the same key, so scrolling around before the first interaction does not queue the same playback twice.

```javascript
const detector = new TinyUserActivationDetector();

window.addEventListener('scroll', () => {
  detector.whenReady(() => player.play(), 'hero-video');
});
```

### Cancelling a request

```javascript
const key = detector.whenReady(() => player.play(), 'trailer');

// Later, when the visitor leaves the section:
detector.cancel(key);
```

### Server-side rendering

When `navigator` is not available the instance starts **unlocked**, so every callback runs immediately and no timer is created.

```javascript
// On the server this is a no-op that runs the callback right away.
new TinyUserActivationDetector().whenReady(() => start());
```

---

## ⚠️ Best Practices

1. **Use a key for anything the visitor can trigger repeatedly.** Without a key, every call creates a new entry in the queue.
2. **Do not call `unlock()` manually** unless you are sure the page was activated — the class already detects it automatically.
3. **`reset()` does not revoke the activation**, because a user activation cannot be revoked by the page.
