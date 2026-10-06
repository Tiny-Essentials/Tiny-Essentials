# 🔍 TinyArrayComparator

A lightweight, highly optimized JavaScript utility class designed to compare two arrays and efficiently detect which items were **added**, **deleted**, or **edited**.

## ✨ Features

- **Smart Identity Tracking:** Uses an `idKey` to distinguish between a new item and an edited version of an existing item.
- **Deep Diffing:** Provides detailed, property-level differences (`added`, `deleted`, `modified`, `nested`) when `deepComparison` is enabled.
- **Fast Comparison:** Uses a Map and hash-based lookups for $O(N)$ performance.
- **Stateful Design:** Store your base array once and compare it multiple times.
- **Zero Dependencies:** Pure Vanilla JavaScript.
- **Clean Architecture:** Built as an ES6 Module with strict JSDoc typing and robust input validation.

---

## 🚀 Quick Start

### 1. Import the Class
Since this project uses modern ES6 modules, simply import it into your working file.

```javascript
import TinyArrayComparator from 'tiny-essentials/libs/array/TinyArrayComparator';
```

### 2. Prepare Your Arrays
To detect **edits** instead of just additions/deletions, ensure your objects have a unique identifier (like `id`).

```javascript
const oldList = [
  { id: 1, name: 'Alice', meta: { role: 'admin' } },
  { id: 2, name: 'Bob', meta: { role: 'user' } },
];

const newList = [
  { id: 1, name: 'Alice', meta: { role: 'admin' } }, // Unchanged
  { id: 2, name: 'Bob', meta: { role: 'editor' } },   // Edited (role changed)
];
```

### 3. Initialize and Compare
Pass the `idKey` in the options so the comparator knows how to identify the same object.

```javascript
const comparator = new TinyArrayComparator(oldList, { 
  idKey: 'id', 
  deepComparison: true 
});

const results = comparator.compare(newList);

console.log(results);
```

**Output:**
```json
[
  {
    "item": { "id": 2, "name": "Bob", "meta": { "role": "editor" } },
    "oldItem": { "id": 2, "name": "Bob", "meta": { "role": "user" } },
    "status": "edited",
    "details": {
      "modified": {
        "meta": {
          "oldValue": { "role": "user" },
          "newValue": { "role": "editor" }
        }
      }
    }
  }
]
```

---

## 🛠️ API Reference

### `constructor(oldArray, options)`
Creates a new comparator instance.
* **`oldArray`** `(Array<any>)` *(Optional)*: The initial state to be stored.
* **`options`** `(Object)` *(Optional)*:
    * **`idKey`** `(string|null)`: The property used to identify unique objects. Defaults to `null` (if `null`, comparison relies purely on value hashing).
    * **`deepComparison`** `(boolean)`: If `true`, the `compare` method returns detailed property changes for edited items. Defaults to `true`.

### `compare(newArray)`
Evaluates differences between the stored `oldArray` and the provided `newArray`.
* **`newArray`** `(Array<any>)`: The new array state.
* **Returns:** `Array<DiffResult>`. Each result contains:
    * `item`: The current version of the item.
    * `status`: `'added' | 'deleted' | 'edited'`.
    * `oldItem`: (Only if `status` is `'edited'`) The original version of the item.
    * `details`: (Only if `status` is `'edited'` and `deepComparison` is `true`) A structured object showing `added`, `deleted`, `modified`, and `nested` changes.

### Properties (Getters/Setters)
* **`idKey`**: Gets or sets the property name used as a unique identifier. Must be a `string` or `null`.
* **`deepComparison`**: Gets or sets whether detailed diffing is enabled. Must be a `boolean`.
* **`oldArray`**: Gets or sets the base array used for comparison. Must be an `Array`.

### `static generateHash(item)`
Generates a unique base36 hash string for any value.
* **`item`** `(any)`: The value to hash.
* **Returns:** `string`.
* **@throws** `TypeError` if the item contains circular references.

---

## 💡 Best Practices

* **Identity vs. Value:** If you do **not** provide an `idKey`, an object that changes even a single property will be reported as one `deleted` item and one `added` item. Always use `idKey` when working with collections of objects to enable the `edited` status.
* **Immutability:** For best results, treat the arrays passed to the comparator as immutable.
* **Performance:** The complexity is $O(N)$, making it suitable for large arrays.

Happy coding! 💻✨