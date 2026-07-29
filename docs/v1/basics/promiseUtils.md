### 🔁 `waitForTrue(getValue, checkInterval = 100)`

Waits until a provided function returns `true`, polling periodically.

```ts
static waitForTrue(getValue: () => boolean, checkInterval?: number): Promise<void>
```

* `getValue`: Function that returns `true` when the wait should end.
* `checkInterval`: Polling interval in milliseconds.
