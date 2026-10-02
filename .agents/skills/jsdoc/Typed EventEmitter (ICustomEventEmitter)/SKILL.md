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

`ICustomEventEmitter` is a **generic type alias** (it declares `@template {Record<...>} MyEvents`). You have three supported ways to reference it in your code without losing its generic type parameter.

### 2.1. `@import` tag (TypeScript 5.5+)

The cleanest approach for modern environments.

```javascript
/** @import { ICustomEventEmitter } from '../jsdoc/EventEmitter.mjs' */

```

> **Note:** adjust the relative path so it points to `src/v1/jsdoc/EventEmitter.mjs`.

### 2.2. Inline `import()` (works everywhere)

If you don't want to declare a type alias, you can type it inline when needed:

```javascript
/** @type {new () => import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter<DownloaderEvents>} */

```

### 2.3. `@typedef` with `@template` (Traditional)

If you use `@typedef`, you **must** include `@template T` so the generic parameter is not lost:

```javascript
/**
 * @template T
 * @typedef {import('../jsdoc/EventEmitter.mjs').ICustomEventEmitter<T>} ICustomEventEmitter
 */

```

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

**Never use `@implements` for this.** `@implements` does not override inherited methods from the base class, so your `this.emit()` would remain untyped. Furthermore, TypeScript rejects type aliases with mapped types inside `@implements`.

Instead, use the **Typed Base Class trick**. Cast `EventEmitter` to your custom type before extending it.

```javascript
import { EventEmitter } from 'events';

/** @import { ICustomEventEmitter } from '../jsdoc/EventEmitter.mjs' */

/**
 * @typedef {Object} DownloaderEvents
 * @property {(url: string) => void} start
 * @property {(url: string, received: number, total: number) => void} progress
 */

// 1. We cast EventEmitter to our generic type to inherit the correct signatures
/** @type {new () => ICustomEventEmitter<DownloaderEvents>} */
const TypedEmitter = /** @type {any} */ (EventEmitter);

/**
 * @class
 * @augments TypedEmitter
 */
export class Downloader extends TypedEmitter {
  /**
   * @param {string} url
   * @returns {void}
   */
  download(url) {
    this.emit('start', url); // Autocomplete is now 100% working here!
    this.emit('progress', url, 0, 100);
  }
}

```

### 5.2. On a standalone `EventEmitter`

When you do not need a subclass, type the variable directly with `@type`.

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
| --- | --- | --- |
| `on` | `(event, listener) => this` | Registers a listener. |
| `once` | `(event, listener) => this` | Registers a listener that runs only once. |
| `off` | `(event, listener) => this` | Alias of `removeListener`. |
| `addListener` | `(event, listener) => this` | Alias of `on`. |
| `removeListener` | `(event, listener) => this` | Removes a listener. |
| `removeAllListeners` | `(event?: string | symbol) => this` |
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
7. **Preserve generic arguments.** If you alias `ICustomEventEmitter` with `@typedef`, always use `@template T` so the generic argument evaluates correctly.
7. **Never use `@implements`.** Always use the typed base class trick `const TypedEmitter = EventEmitter` to inherit method signatures properly.

---

## 8. Common errors

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `A class can only implement an object type...` | You tried to use `@implements` with a generic type alias containing mapped types. | Remove `@implements` and use the typed base class trick (`extends TypedEmitter`). |
| `emit` accepts any argument | You extended `EventEmitter` directly instead of your `TypedEmitter` reference. | Create `const TypedEmitter` casted to your custom type, and `extend` it. |
| `Type 'ICustomEventEmitter' is not generic` | The type was aliased with `@typedef` without declaring `@template T`. | Use `@import`, inline `import()`, or add `@template T` to the typedef. |
| No autocomplete on `on` | The event typedef is out of scope. | Move the typedef to the same file or import it with `@import`. |
| `listenerCount` complains about `undefined` | The second parameter is required by the typedef. | Pass `undefined` explicitly: `emitter.listenerCount('x', undefined)`. |
| `Record<string, ...>` erases autocomplete for known events | The index signature accepts any string. | Use the object typedef when you need a closed set of names. |

---

## 9. Quick checklist

- [ ] Did I import `EventEmitter` from `events`?
- [ ] Did I pass the generic argument properly using `@import`, inline `import()`, or a `@template` typedef?
- [ ] Did I choose between the object typedef and `Record<string, ...>`?
- [ ] Did I create the `TypedEmitter` intermediate class correctly and `extend` it?
- [ ] Do all `emit` calls use names that exist in the map?
- [ ] Do the `emit` arguments match the listener signature?