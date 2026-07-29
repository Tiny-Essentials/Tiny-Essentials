# 🕒 TinyTimeout

`TinyTimeout` is a smart utility class designed to help manage dynamically scaled `setTimeout` calls based on how frequently a given ID is triggered. It also supports condition polling (`waitForTrue`) for asynchronous workflows. This is especially useful for cooldown systems, progressive delays, or throttling logic.

---

## ✨ Features

* ⏱️ **Dynamic Timeout Scaling** based on trigger frequency
* 🔁 **Auto-decrement cooldowns** over time
* ⚙️ Optional **value override support** per ID
* 🔍 **Polling Support** with `waitForTrue`
* 🧼 Easy cleanup with `destroy()`

---

## 🚀 Usage

```js
const timeout = new TinyTimeout();

// Schedule a timeout with ID tracking and increasing delay
timeout.set('example-id', () => {
  console.log('Triggered after dynamic delay!');
}, 200); // 200ms base multiplier

// Optional limit
timeout.set('example-id', () => {
  console.log('Max delay limited to 2000ms');
}, 500, 2000);

// Wait until some condition becomes true
await timeout.waitForTrue(() => document.readyState === 'complete');
```

---

## 🔧 Constructor

```ts
new TinyTimeout(options?: {
  cooldownWatcherTime?: number;
  allowAutoConfigChange?: boolean;
});
```

| Option                  | Type      | Default | Description                                              |
| ----------------------- | --------- | ------- | -------------------------------------------------------- |
| `cooldownWatcherTime`   | `number`  | `5000`  | Interval (ms) to decrease cooldown counters.             |
| `allowAutoConfigChange` | `boolean` | `false` | Whether to auto update the base value of an existing ID. |

---

## 📘 Methods

### 🧠 `set(id, callback, value, limit?)`

Schedules a timeout using a delay based on how frequently the ID has been triggered.

```ts
set(id: string, callback: Function, value: number, limit?: number | null): number;
```

| Parameter  | Type             | Required  | Description                                                                 |
| ---------- | ---------------- | --------- | --------------------------------------------------------------------------- |
| `id`       | `string`         | ✅        | Unique identifier for the timeout logic.                                    |
| `callback` | `Function`       | ✅        | Function to execute after the delay.                                        |
| `value`    | `number`         | ✅        | Base multiplier for delay in milliseconds.                                  |
| `limit`    | `number \| null` | ❌        | Optional maximum delay in milliseconds to cap the calculated timeout.       |

📌 **Returns:**  
A numeric ID returned by `setTimeout`, which can be manually canceled later using `clearTimeout(id)` if necessary.

🛠️ **Behavior:**  
- The more often an `id` is used consecutively, the longer the timeout becomes.
- This delay is calculated as `value * now`, where `now` increases each time the `id` is triggered.
- The delay will never exceed `limit` if it’s provided.

---

### 🧩 `waitForTrue(getValue, checkInterval?)`

Same as `waitForTrue`, but uses the instance's `cooldownWatcherTime` as the default if `checkInterval` is `null`.

```ts
waitForTrue(getValue: () => boolean, checkInterval?: number | null): Promise<void>
```

---

### 🛠️ `setCooldownWatcherTime(value)`

Updates the cooldown decrement interval. Automatically restarts the internal timer.

```ts
setCooldownWatcherTime(value: number): void
```

---

### ⚙️ `setAllowAutoConfigChange(value)`

Enables or disables automatic value reconfiguration for known IDs.

```ts
setAllowAutoConfigChange(value: boolean): void
```

---

### ❓ `getCooldownWatcherTime()`

Returns the current interval used for decrementing cooldowns.

```ts
getCooldownWatcherTime(): number
```

---

### ❓ `getAllowAutoConfigChange()`

Returns whether auto-config change is enabled.

```ts
getAllowAutoConfigChange(): boolean
```

---

### 🔥 `destroy()`

Cleans up all internals, clears intervals, and invalidates the instance.

```ts
destroy(): void
```

---

### ✅ `isDestroyed()`

Checks if the instance has already been destroyed.

```ts
isDestroyed(): boolean
```

---

## 🧼 Best Practices

* Use meaningful `id`s to separate timeout logic across components or users.
* Consider enabling `allowAutoConfigChange` if base delays change dynamically in your app.
* Always call `destroy()` when you're done to avoid memory leaks!

---

## 🧪 Example

```js
const t = new TinyTimeout({ cooldownWatcherTime: 3000 });

t.set('search', () => console.log('Search triggered'), 100);
t.set('search', () => console.log('Slower search due to spamming'), 100);
t.set('search', () => console.log('Even slower!'), 100, 500);

await t.waitForTrue(() => myAsyncCondition === true);

t.destroy();
```

---

## 🧠 Why use TinyTimeout?

Sometimes `setTimeout` isn't enough when you need backoff, throttling, or async condition checks. TinyTimeout handles usage frequency and time-based cooldown logic all in one place, and its polling function is perfect for complex reactive UIs.
