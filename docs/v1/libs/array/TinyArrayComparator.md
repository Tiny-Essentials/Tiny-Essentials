# 🔍 TinyArrayComparator

A lightweight, highly optimized JavaScript utility class designed to compare two arrays and efficiently detect which items were **added** or **deleted**. 

## ✨ Features

- **Fast Comparison:** Uses a Map and hash-based lookups for $O(N)$ performance.
- **Stateful Design:** Store your base array once and compare it multiple times.
- **Zero Dependencies:** Pure Vanilla JavaScript.
- **Deep Compatibility:** Safely hashes strings, numbers, arrays, and deep objects.
- **Clean Architecture:** Built as an ES6 Module with strict JSDoc typing and input validation.

---

## 🚀 Quick Start

### 1. Import the Class
Since this project uses modern ES6 modules, simply import it into your working file.

```javascript
import TinyArrayComparator from 'tiny-essentials/libs/array/TinyArrayComparator';
```

### 2. Prepare Your Arrays
Set up the initial state (`oldArray`) and the modified state (`newArray`) that you want to compare.

```javascript
const oldList = [
  { id: 1, role: 'admin' },
  { id: 2, role: 'user' },
  { id: 3, role: 'moderator' }
];

const newList = [
  { id: 1, role: 'admin' },       // Unchanged
  { id: 3, role: 'moderator' },   // Unchanged
  { id: 4, role: 'guest' }        // Added
  // User ID 2 was deleted
];
```

### 3. Initialize and Compare
Instantiate the class passing the initial array. Then, call the `compare` method with your new array.

```javascript
const comparator = new TinyArrayComparator(oldList);
const results = comparator.compare(newList);

console.log(results);
```

**Output:**
```json
[
  {
    "item": { "id": 4, "role": "guest" },
    "status": "added"
  },
  {
    "item": { "id": 2, "role": "user" },
    "status": "deleted"
  }
]
```

---

## 🛠️ API Reference

### `constructor([oldArray])`
Creates a new comparator instance.
* **`oldArray`** `(Array<any>)` *(Optional)*: The initial state of the array to be stored. Throws a `TypeError` if the provided value is not an Array.

### `compare(newArray)`
Evaluates differences between the internally stored `oldArray` and the provided `newArray`. Throws a `TypeError` if the provided value is not an Array.
* **`newArray`** `(Array<any>)`: The new array containing current modifications.
* **Returns:** An array of objects. Each object contains the original `item` and a `status` string (either `'added'` or `'deleted'`).

### `get oldArray` / `set oldArray(value)`
Allows you to retrieve or update the base array stored inside the instance.
* **Throws:** `TypeError` if attempting to set a non-array value.

### `static generateHash(item)`
A static helper method if you ever need to generate a unique base36 hash string for an item outside the comparison flow.
* **`item`** `(any)`: The target object, string, or number to hash.
* **Returns:** A `string` representing the unique hash.

```javascript
const myHash = TinyArrayComparator.generateHash({ pony: 'Pudding' });
console.log(myHash); // Returns a base36 string like "1b4x9z"
```

---

## 💡 Best Practices

* **Order Doesn't Matter:** Because this utility relies on value-hashing, the index order of items inside the arrays does not affect the comparison. It strictly checks for the existence of the values.
* **Object References:** The returned array preserves the exact references to the items passed in the parameters, allowing you to seamlessly integrate the output back into your application logic.
* **Reusability:** You can easily update the base state by assigning a new array to `comparator.oldArray = [...]` without creating a new instance.

Happy coding! 💻✨