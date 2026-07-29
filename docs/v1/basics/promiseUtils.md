### 🔁 `waitForTrue(getValue, checkInterval = 100)`

Waits until a provided function returns `true`, polling periodically.

```ts
static waitForTrue(getValue: () => boolean, checkInterval?: number): Promise<void>
```

* `getValue`: Function that returns `true` when the wait should end.
* `checkInterval`: Polling interval in milliseconds.

---

### 🔒 `createSingletonTask(baseFunction)`

Creates a wrapper that ensures an asynchronous function is only executed once at a time. If the function is already in progress, subsequent calls will wait for the existing promise to resolve.

```ts
createSingletonTask<T, A extends any[]>(baseFunction: (...args: A) => Promise<T>): (...args: A) => Promise<T>
```

* `baseFunction`: The asynchronous function to be wrapped.

> **Note:** This utility is designed for **request collapsing** (all callers receive the same result). If you need to execute multiple independent tasks sequentially where each call returns its own unique result, please refer to the documentation for `TinyPromiseQueue.mjs`.
