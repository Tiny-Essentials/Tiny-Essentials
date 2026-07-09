# 📦 array.mjs

A minimal and handy module offering a couple of focused utilities for working with arrays — from shuffling items randomly to generating smart sort functions for object arrays. Ideal for quick scripting or modular use in larger projects.

---

## `shuffleArray(items: any[]): any[]`

🔄 A tiny utility for shuffling arrays using the good old Fisher–Yates algorithm. Simple, efficient, and perfectly random (as far as JavaScript's `Math.random()` allows, anyway).

- **items** — An array to shuffle.
- **Returns** — The same array instance, but now shuffled.


### 🚀 Usage

```js
import { shuffleArray } from 'tiny-essentials/basics/array';

const fruits = ['apple', 'banana', 'cherry', 'date'];
shuffleArray(fruits);

console.log(fruits); // ['banana', 'cherry', 'apple', 'date'] (order will vary)
```

> Note: The original array is shuffled in place. If you want to preserve the original order, make a copy before shuffling.

You can find the original discussion here:  
🔗 https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array

---

## 📦 `arraySortPositions`

🔧 **Generates a comparator function** to sort an array of objects by a specified key, with optional reverse order.

### 📌 Function Signature

```js
arraySortPositions(item?: string, isReverse?: boolean): (a: Object<string|number, *>, b: Object<string|number, *>) => number
```

### 🧠 Parameters

| Name        | Type      | Default | Description                                                |
| ----------- | --------- | ------- | ---------------------------------------------------------- |
| `item`      | `string`  | —       | 🔑 The key to sort the objects by.                         |
| `isReverse` | `boolean` | `false` | 🔄 If `true`, the sorting will be in **descending** order. |

### 🎯 Returns

🧩 A **comparator function** compatible with `Array.prototype.sort()`:

```js
(a, b) => number
```

It compares two objects based on the specified `item` key.

### 💡 Examples

```js
const arr = [{ pos: 2 }, { pos: 1 }, { pos: 3 }];
arr.sort(arraySortPositions('pos'));
// 🔼 Ascending: [{ pos: 1 }, { pos: 2 }, { pos: 3 }]
```

```js
const arr = [{ pos: 2 }, { pos: 1 }, { pos: 3 }];
arr.sort(arraySortPositions('pos', true));
// 🔽 Descending: [{ pos: 3 }, { pos: 2 }, { pos: 1 }]
```

### 🛠️ Use Case

Great for situations where you need to **dynamically sort objects** by one of their keys, such as:

* Sorting users by age
* Ordering tasks by priority
* Displaying leaderboard scores

---

## 🔁 `multiplyArrayBlocks(phases, counts)`

Generates a flattened array with phases repeated according to the specified counts.

* **`phases`** 📝 — Array of phase names (e.g., `['Full', 'Half1', 'Half2', 'New']`).
* **`counts`** 🔢 — Array of integers specifying how many times each phase should be repeated (e.g., `[4, 5, 5, 4]`).
* **Returns** 📦 — A single array where each phase appears the given number of times, in order.

**Example:**

```js
multiplyArrayBlocks(['Full', 'Half1', 'Half2', 'New'], [4, 5, 5, 4]);
// ➡ ['Full','Full','Full','Full','Half1','Half1','Half1','Half1','Half1', ...]
```

---

## 🔀 `diffArrayList(oldItems, newItems)`

Compares two arrays and determines which items were **added** and which were **removed**.

* **`oldItems`** 📜 — Array of original class names.
* **`newItems`** 📜 — Array of updated class names.
* **Returns** 📦 — An object with two arrays:

  * `added` → classes that exist in `newItems` but not in `oldItems`.
  * `removed` → classes that exist in `oldItems` but not in `newItems`.

**Example:**

```js
diffArrayList(['btn', 'active'], ['btn', 'disabled']);
// ➡ { added: ['disabled'], removed: ['active'] }
```