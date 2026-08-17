# 🛠️ TinyNeedBar Documentation

`TinyNeedBar` is a utility class for simulating a **"need bar" system**.
It allows tracking of values that decrease over time, with configurable decay factors.

---

## 📦 Types

### `TickResult` 🔄

Represents the result of one tick of decay.

| Property            | Type     | Description                               |
| ------------------- | -------- | ----------------------------------------- |
| `prevValue`         | `number` | Infinite value before applying decay.     |
| `removedTotal`      | `number` | Total amount removed this tick.           |
| `removedPercent`    | `number` | Percentage of max removed this tick.      |
| `currentPercent`    | `number` | Current percentage relative to max.       |
| `remainingValue`    | `number` | Current clamped value (≥ 0).              |
| `infiniteRemaining` | `number` | Current infinite value (can be negative). |

---

### `BarFactor` ⚡

Represents a decay factor applied to the need bar.

| Property     | Type     | Description                       |
| ------------ | -------- | --------------------------------- |
| `amount`     | `number` | Base reduction value per tick.    |
| `multiplier` | `number` | Multiplier applied to the amount. |

---

### `SerializedData` 💾

Represents the serialized state of a `TinyNeedBar` instance.
Can be used to export/import or clone bars.

| Property        | Type                        | Description                                 |
| --------------- | --------------------------- | ------------------------------------------- |
| `maxValue`      | `number`                    | Maximum value of the bar at serialization.  |
| `currentValue`  | `number`                    | Current clamped value (≥ 0).                |
| `infiniteValue` | `number`                    | Infinite value (can be negative).           |
| `factors`       | `Record<string, BarFactor>` | Active decay factors indexed by their keys. |

---

## 🏗️ Class: `TinyNeedBar`

### Overview

* The bar decreases over time according to **defined factors**.
* Each factor has an `amount` and a `multiplier`.
* Tracks two values:

  * `currentValue` → cannot go below zero.
  * `infiniteValue` → can decrease infinitely into negative numbers.

---

### Constructor

```ts
constructor(maxValue = 100, baseDecay = 1, baseDecayMulti = 1)
```

* `maxValue` – Maximum bar value (default `100`)
* `baseDecay` – Base decay per tick (default `1`)
* `baseDecayMulti` – Multiplier for base decay (default `1`)

**Example:**

```js
const bar = new TinyNeedBar(100, 2, 1.5);
```

---

### Getters

| Getter           | Returns                     | Description                               |
| ---------------- | --------------------------- | ----------------------------------------- |
| `factors`        | `Record<string, BarFactor>` | Snapshot of all active factors.           |
| `currentPercent` | `number`                    | Current percentage relative to max.       |
| `maxValue`       | `number`                    | Maximum possible value of the bar.        |
| `currentValue`   | `number`                    | Current clamped value (≥ 0).              |
| `infiniteValue`  | `number`                    | Current infinite value (can go negative). |

---

### Setters

| Setter          | Parameters      | Description                                        |
| --------------- | --------------- | -------------------------------------------------- |
| `maxValue`      | `value: number` | Update max value, clamps `currentValue` if needed. |
| `infiniteValue` | `value: number` | Update infinite value, auto-adjust `currentValue`. |

---

### Methods

#### `getFactor(key: string): BarFactor` 🔑

Get a specific factor by key.
Throws an error if the factor does not exist.

```js
bar.getFactor("main");
```

---

#### `hasFactor(key: string): boolean` ✅

Check if a factor exists by key.

```js
bar.hasFactor("main"); // true or false
```

---

#### `setFactor(key: string, amount: number, multiplier = 1)` ⚡

Add or update a decay factor.

```js
bar.setFactor("hunger", 2, 1.2);
```

---

#### `removeFactor(key: string) : boolean` ❌

Remove a factor by key.

```js
bar.removeFactor("hunger");
```

---

#### `tick(): TickResult` ⏱️

Execute one tick of decay using all active factors.

```js
const result = bar.tick();
console.log(result.remainingValue);
```
---

#### `tickWithTempFactor(tempFactor): TickResult` ⏱️

Executes one tick using a **temporary factor** applied only for this tick, in addition to the regular factors.

**Use case:** Useful for testing temporary boosts or penalties without modifying the permanent factors.

---

#### `tickSingleFactor(factor): TickResult` ⏱️

Executes one tick using **only the specified factor**, ignoring all other factors.

**Use case:** Perfect for controlled testing of a single effect or for one-off calculations.

---

#### `toJSON(): SerializedData` 💾

Serialize the current state to a JSON-compatible object.

```js
const data = bar.toJSON();
```

---

#### `static fromJSON(data: SerializedData): TinyNeedBar` 📤

Restore a `TinyNeedBar` from serialized data.

```js
const newBar = TinyNeedBar.fromJSON(data);
```

---

#### `clone(): TinyNeedBar` 🧬

Deep clone the bar.

```js
const cloned = bar.clone();
```

---

#### `clearFactors()` 🧹

Remove all factors.

```js
bar.clearFactors();
```

---

### ✅ Example Usage

```js
const bar = new TinyNeedBar(100, 2, 1.5);

// Add extra factors
bar.setFactor("energy", 1, 1.2);
bar.setFactor("fun", 0.5, 1);

// Tick simulation
setInterval(() => {
  const result = bar.tick();
  console.log(`Value: ${result.remainingValue} (${result.currentPercent}%)`);
}, 1000);

// Export / Import
const json = bar.toJSON();
const restored = TinyNeedBar.fromJSON(json);

// Clone
const clone = bar.clone();
```

---

### 🎨 Notes

* Designed for simulation & testing.
* Can handle multiple independent decay factors.
* `infiniteValue` is useful for simulations that allow negative overflow.
* Fully serializable for state saving/loading.
