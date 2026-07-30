# 🧠 objChecker.mjs

## 📘 Object & Type Utilities

This document introduces utility functions designed to help you safely and efficiently work with JavaScript objects and types. These helpers are particularly useful when dealing with dynamic values — especially in situations where data might be coming from APIs, user input, or JSON files.

These tools are built to reduce boilerplate code and prevent common mistakes when handling unknown or loosely-typed values in JavaScript.

---

### 🧮 `countObj(obj)`

Returns the number of elements in an array or the number of keys in an object.

```js
countObj([1, 2, 3]);       // 3
countObj({ a: 1, b: 2 });  // 2
countObj('hi');            // Throws TypeError
```

---

### 🧼 `isValidObj(value)`

Check if a value is a **JSON-compatible object** — meaning it's **not** a Array.

🔒 This function ensures the object:

* is not `null`
* has `typeof === 'object'`

Use this when you need to strictly validate a JSON object.

---

### 🧼 `isJsonObject(value)`

Check if a value is a **plain JSON-compatible object** — meaning it's created via `{}` or `new Object()`, with a prototype of `Object.prototype`, and **not** a special object like `Date`, `Map`, `Array`, etc.

```js
isJsonObject({}); // true
isJsonObject(Object.create({})); // true
isJsonObject(Object.create(Object.prototype)); // true
isJsonObject(Object.assign({}, { a: 1 })); // true
```

```js
isJsonObject([]); // false
isJsonObject(new Date()); // false
isJsonObject(new Map()); // false
isJsonObject(Object.create(null)); // false
```

🔒 This function ensures the object:

* is not `null`
* has `typeof === 'object'`
* is **directly** inherited from `Object.prototype`

Use this when you need to strictly validate a raw JSON object (like the output of `JSON.parse()` or manual object literals).
