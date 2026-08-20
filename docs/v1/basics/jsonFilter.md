# 🛠️ Object Filtering Utilities Documentation

A collection of powerful, high-precision JavaScript utilities designed to filter objects based on keys, values, or complex nested conditions.

## 📋 Table of Contents
1. [`jsonFilter`](#jsonfilter) — Shallow filtering.
2. [`jsonFilterRecursive`](#jsonfilterrecursive) — Deep/Recursive filtering.
3. [`jsonFilterByKeys`](#jsonfilterbykeys) — Selective key/value extraction.

---

## 🔍 `jsonFilter`

`jsonFilter` is a shallow filtering function. It creates a new object containing only the entries that satisfy a specific predicate function.

### ⚙️ Syntax
```javascript
jsonFilter(value, filterContent);
```

### 📥 Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `value` | `Object` | The source object to be filtered. |
| `filterContent` | `Function` | A callback: `(entry, index, array) => boolean`. |

### 🚀 Example
Filtering an object to only keep entries where the value is a number greater than 10.

```javascript
import { jsonFilter } from 'tiny-essentials/basics/jsonFilter';

const data = { a: 5, b: 15, c: 20, d: 'hello' };

const result = jsonFilter(data, ([key, value]) => typeof value === 'number' && value > 10);

console.log(result); 
// Output: { b: 15, c: 20 }
```

---

## 🌳 `jsonFilterRecursive`

`jsonFilterRecursive` performs a deep traversal of a data structure. It allows you to apply specific filtering rules depending on whether the current item is a **primitive**, an **array**, or a **complex container** (Object, Map, or Set).

### ⚙️ Syntax
```javascript
jsonFilterRecursive(value, filter);
```

### 📥 Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `value` | `Object \| Map \| Set` | The source structure to be filtered. |
| `filter` | `Object` | An object containing predicate functions: |
| `filter.value` | `Function` | Applied to **primitive** values. |
| `filter.obj` | `Function` | Applied to **nested objects, Maps, or Sets** (used for pruning). |
| `filter.array` | `Function` | Applied to **arrays**. |

> **Note:** `WeakMap` and `WeakSet` are supported but, due to their non-iterable nature, will return a new empty instance of the same type when processed.

### 🚀 Example
Filtering a complex structure containing `Map` and `Set` objects.

```javascript
import { jsonFilterRecursive } from 'tiny-essentials/basics/jsonFilter';

const complexData = {
  id: 'Yasmin',
  food: ['pudding'],
  tags: new Set(['premium', 'beta-tester']),
  empty: new Set(),
  metadata: new Map([
    ['last_login', '2023-10-27'],
    ['login_count', 42]
  ]),
  settings: {
    theme: 'dark',
    notifications: true
  }
};

const filterConfig = {
  value: ([key, val]) => typeof val === 'string', // Keep strings
  
  // Prune Maps or Sets if they become empty after filtering
  obj: (container) => {
    if (container instanceof Map || container instanceof Set) {
      return container.size > 0;
    }
    return container.id !== undefined; // Prune objects that don't have an 'id'
  },
  
  array: () => true                               // Keep all arrays
};

const result = jsonFilterRecursive(complexData, filterConfig);

console.log(result);
/*
Output:
{
  food: ['pudding'],
  id: 'Yasmin',
  tags: Set { 'premium', 'beta-tester' },
  metadata: Map { 'last_login' => '2023-10-27' }
}
*/
```

---

## 🔑 `jsonFilterByKeys`

`jsonFilterByKeys` is a highly specialized selector. It allows you to extract specific keys or key-value pairs using simple strings, tuples, or validation functions.

### ⚙️ Syntax
```javascript
jsonFilterByKeys(item, keys, values);
```

### 📥 Parameters
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `item` | `Object` | The source object. |
| `keys` | `Array` | An array of `string` keys OR `[key, validator/value]` tuples. |
| `values` | `Array` (opt) | A list of allowed values or validators to apply to the keys. |

### 💡 Usage Modes

#### 1. Using Simple Keys + Value Whitelist
If you provide a list of keys and a list of allowed values.

```javascript
import { jsonFilterByKeys } from 'tiny-essentials/basics/jsonFilter';

const data = { status: 'active', type: 'user', age: 25 };
// Keep only 'status' if it is 'active'
const result = jsonFilterByKeys(data, ['status'], ['active']); 
// Output: { status: 'active' }
```

#### 2. Using Key-Value Tuples (Highly Precise)
You can pass a tuple `[key, condition]` where the condition is a value or a function.

```javascript
import { jsonFilterByKeys } from 'tiny-essentials/basics/jsonFilter';

const data = {
  id: 101,
  role: 'admin',
  score: 95
};

// Keep 'id' and keep 'role' only if it is 'admin'
const result = jsonFilterByKeys(data, [
  'id', 
  ['role', 'admin']
]);

console.log(result); 
// Output: { id: 101, role: 'admin' }
```

#### 3. Using Validators
You can pass functions to perform complex validation during selection.

```javascript
import { jsonFilterByKeys } from 'tiny-essentials/basics/jsonFilter';

const data = {
  name: 'Isabela',
  age: 30,
  score: 9.5
};

// Keep keys where the value is a number greater than 10
const result = jsonFilterByKeys(data, ['age', 'score'], [(v) => typeof v === 'number' && v > 10]);

console.log(result);
// Output: { age: 30 }
```

---

## ⚠️ Error Handling

All functions implement strict runtime validation and will throw a `TypeError` if:
- The input `value` is not a valid object.
- The `filterContent` or `filter` predicates are not functions.
- The `keys` or `values` arguments are not arrays when required.
