---
name: Typed EventEmitter (ICustomEventEmitter)
description: Standard workflow for documenting Node.js EventEmitter classes with strongly typed JSDoc. Use this when you need autocomplete and type checking for event names and for the arguments of emit/on/once/off, without migrating to TypeScript.
---

# Skill: Typed EventEmitter with `ICustomEventEmitter`

## 1. When to use this skill

Use this skill whenever you need to:

- Document a class that extends the Node.js `EventEmitter` using JSDoc.
- Get autocomplete for event names and type checking for the arguments of `emit`.
- Standardize how events are declared across the whole project.

Do **not** use this skill for classes that do not extend `EventEmitter`, or for projects that already use native TypeScript (in that case, declare an `interface` directly).

---

## 2. Where the typedef lives

The `ICustomEventEmitter` typedef is already mapped in:

```
src/v1/jsdoc/EventEmitter.mjs
```

`ICustomEventEmitter` is a **generic type alias** (it declares `@template {Record<...>} MyEvents`). Because of that, you must **never** alias it with `@typedef`. Doing so erases the type parameter:

```javascript
// WRONG — the type parameter is lost
/**
 * @typedef {import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter} ICustomEventEmitter
 */

// Now this line fails: "Type 'ICustomEventEmitter' is not generic."
/** @type {ICustomEventEmitter<ServerEvents>} */
```

Instead, reference it in one of the two supported ways below.

### 2.1. Inline `import()` (works everywhere)

```javascript
/**
 * @implements {import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter<DownloaderEvents>}
 */
```

### 2.2. `@import` tag (TypeScript 5.5+)

```javascript
/** @import { ICustomEventEmitter } from '../jsdoc/EventEmitter.mjs' */

/**
 * @implements {ICustomEventEmitter<DownloaderEvents>}
 */
```

> **Note:** adjust the relative path so it points to `src/v1/jsdoc/EventEmitter.mjs`.

---

## 3. The problem we are solving

A plain `EventEmitter` accepts **any string** as an event name and **any argument** in `emit`. JSDoc cannot warn you when you:

- Misspell the event name (`'mesage'` instead of `'message'`).
- Pass the arguments in the wrong order.
- Forget to handle an event.

The `ICustomEventEmitter<MyEvents>` typedef fixes this: it rebuilds `on`, `emit`, `once`, `off`, and friends using the types **you** define.

---

## 4. Two ways to declare the event map

The generic parameter `MyEvents` is a `Record` where the **key** is the event name and the **value** is the listener signature. You can build it in two ways.

### 4.1. Object typedef (explicit events)

Use this when every event has a **distinct name and signature**.

```javascript
/**
 * @typedef {Object} DownloaderEvents
 * @property {(url: string) => void} start
 * @property {(url: string, received: number, total: number) => void} progress
 * @property {(url: string, error: Error) => void} error
 * @property {(url: string) => void} complete
 */
```

### 4.2. `Record<string, ...>` (repeating pattern)

Use this when **any event name** follows the same shape. Common cases: dynamic channels, namespaced events, or a single payload contract shared by many events.

```javascript
/**
 * Every event name is a string, and every listener receives the same payload.
 *
 * @typedef {Record<string, (payload: { id: number; at: number }) => void>} ChannelEvents
 */
```

You can also combine a fixed prefix with a template literal type:

```javascript
/**
 * @typedef {Record<`user:${string}`, (id: number) => void>} UserChannelEvents
 */
```

---

## 5. Two ways to apply the typedef

### 5.1. On a class that extends `EventEmitter`

Use `@implements` together with `@augments`. Reference `ICustomEventEmitter` **inline** so the type parameter survives.

```javascript
import { EventEmitter } from 'events';

/**
 * @typedef {Object} DownloaderEvents
 * @property {(url: string) => void} start
 * @property {(url: string, received: number, total: number) => void} progress
 * @property {(url: string, error: Error) => void} error
 * @property {(url: string) => void} complete
 */

/**
 * @class
 * @augments {EventEmitter}
 * @implements {import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter<DownloaderEvents>}
 */
export class Downloader extends EventEmitter {
  /**
   * @param {string} url
   * @returns {void}
   */
  download(url) {
    this.emit('start', url);
    this.emit('progress', url, 0, 100);
    this.emit('complete', url);
  }
}
```

If you prefer the `@import` tag, put it at the top of the file and use the short name:

```javascript
import { EventEmitter } from 'events';

/** @import { ICustomEventEmitter } from '../jsdoc/EventEmitter.mjs' */

/**
 * @typedef {Object} DownloaderEvents
 * @property {(url: string) => void} start
 * @property {(url: string, received: number, total: number) => void} progress
 * @property {(url: string, error: Error) => void} error
 * @property {(url: string) => void} complete
 */

/**
 * @class
 * @augments {EventEmitter}
 * @implements {ICustomEventEmitter<DownloaderEvents>}
 */
export class Downloader extends EventEmitter {}
```

### 5.2. On a standalone `EventEmitter`

When you do not need a subclass, type the variable directly with `@type`. The `import()` form is required here because there is no `@implements` slot.

```javascript
import { EventEmitter } from 'events';

/**
 * @typedef {Object} ServerEvents
 * @property {(port: number) => void} listening
 * @property {(error: Error) => void} error
 */

/** @type {import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter<ServerEvents>} */
export const server = new EventEmitter();
```

Both forms give you the same autocomplete and type checking.

---

## 6. API reference

| Method | Signature | Description |
|--------|-----------|-------------|
| `on` | `(event, listener) => this` | Registers a listener. |
| `once` | `(event, listener) => this` | Registers a listener that runs only once. |
| `off` | `(event, listener) => this` | Removes a listener. |
| `addListener` | `(event, listener) => this` | Alias of `on`. |
| `removeListener` | `(event, listener) => this` | Alias of `off`. |
| `removeAllListeners` | `(event?) => this` | Removes all listeners (from one event or from all). |
| `prependListener` | `(event, listener) => this` | Adds the listener to the front of the queue. |
| `prependOnceListener` | `(event, listener) => this` | Adds a one-shot listener to the front of the queue. |
| `emit` | `(event, ...args) => boolean` | Emits the event. `args` are typed by `Parameters<MyEvents[K]>`. |
| `listeners` | `(event) => Function[]` | Returns a copy of the listeners. |
| `rawListeners` | `(event) => Function[]` | Returns a copy including wrappers. |
| `listenerCount` | `(event, listener) => number` | Counts how many identical listeners exist. |

---

## 7. Best practices

1. **One event map per class or per module.** Name it in the plural: `ServerEvents`, `DownloaderEvents`.
2. **Always import `EventEmitter` from `events`** to make it explicit that it is a native module.
3. **Document `@returns {void}`** on listeners that return nothing. It improves IntelliSense.
4. **Never pass a raw string to `emit`.** If the name is not in the map, the type breaks. That is the point.
5. **Keep the event typedef close** to the class that uses it.
6. **Prefer the object typedef** when events have distinct signatures. **Prefer `Record<string, ...>`** when the shape repeats.
7. **Never alias `ICustomEventEmitter` with `@typedef`.** Always use inline `import()` or the `@import` tag so the `@template` parameter is preserved.

---

## 8. Common errors

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| `Type 'ICustomEventEmitter' is not generic` | The type was aliased with `@typedef {import(...)}`. | Use inline `import()` or the `@import` tag. |
| `emit` accepts any argument | The editor did not resolve the `@implements`. | Restart the TypeScript Server (`Ctrl+Shift+P` → *Restart TS Server*). |
| No autocomplete on `on` | The event typedef is out of scope. | Move the typedef to the same file or import it with `@import`. |
| `@implements` shows an error | The class does not extend `EventEmitter`. | Add `@augments {EventEmitter}` and `extends EventEmitter`. |
| `listenerCount` complains about `undefined` | The second parameter is required by the typedef. | Pass `undefined` explicitly: `emitter.listenerCount('x', undefined)`. |
| `Record<string, ...>` erases autocomplete for known events | The index signature accepts any string. | Use the object typedef when you need a closed set of names. |

---

## 9. Quick checklist

- [ ] Did I import `EventEmitter` from `events`?
- [ ] Did I reference `ICustomEventEmitter` **inline** with `import()` or via the `@import` tag (never with `@typedef`)?
- [ ] Did I choose between the object typedef and `Record<string, ...>`?
- [ ] Does the class have both `@augments {EventEmitter}` and `@implements {ICustomEventEmitter<...>}` (or a `@type` on a standalone emitter)?
- [ ] Do all `emit` calls use names that exist in the map?
- [ ] Do the `emit` arguments match the listener signature?