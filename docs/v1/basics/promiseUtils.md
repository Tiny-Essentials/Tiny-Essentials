### 🔁 `waitForTrue(getValue, checkInterval = 100)`

Waits until a provided function returns `true`, polling periodically.

```ts
static waitForTrue(getValue: () => boolean, checkInterval?: number): Promise<void>
```

* `getValue`: Function that returns `true` when the wait should end.
* `checkInterval`: Polling interval in milliseconds.

---

### 🔒 `createSingletonTask(baseFunction)`

Creates a controller object that ensures an asynchronous function is only executed once at a time. If a task is already in progress, subsequent calls to `callback` will wait for the existing promise to resolve.

```ts
createSingletonTask<T, A extends any[]>(
  baseFunction: (...args: A) => Promise<T>
): {
  callback: (...args: A) => Promise<T>;
  getActivePromise: () => Promise<T> | null;
  resetActivePromise: () => void;
}
```

* `callback`: The wrapped function that manages execution state.
* `getActivePromise`: Returns the current active promise, or `null` if no task is running.
* `resetActivePromise`: Forces the state to reset, allowing the next call to start a new execution.

> **Note:** This utility is designed for **request collapsing** (all callers receive the same result). If you need to execute multiple independent tasks sequentially where each call returns its own unique result, please refer to the documentation for `TinyPromiseQueue.mjs`.
