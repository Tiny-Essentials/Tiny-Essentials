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

---

### 🛠️ `isClass(target)`

Determines whether the provided value is a class constructor.

```js
isClass(class MyClass {}) // true
isClass(function MyFunc() {}) // false
isClass(123) // Throws TypeError
```

🔒 This function ensures:

* The target is a function.
* The function is a class constructor (cannot be called without `new`).

---

### 🛠️ `isClassInstance(value)` and `isAnyClassInstance(value)`

Determines whether a given value is an instance of a class.

```js
class MyClass {}
isClassInstance(new MyClass()) // true
isClassInstance({}) // false
isClassInstance(null) // false
```

```js
class PlayerData {}

const player = new PlayerData();
const nativeMap = new Map();
const nativeUrl = new URL('https://example.com');
const plainObject = { name: "Yasmin" };
const nullObject = Object.create(null);

console.log(isAnyClassInstance(player));       // true (Custom class)
console.log(isAnyClassInstance(nativeMap));    // true (Native class)
console.log(isAnyClassInstance(nativeUrl));    // true (Native class)
console.log(isAnyClassInstance(new Date()));   // true (Native class)

console.log(isAnyClassInstance(plainObject));  // false
console.log(isAnyClassInstance(nullObject));   // false
console.log(isAnyClassInstance("Yasmin"));     // false (Primitive string)
```

🔒 This function ensures:

* The value is a non-null object.
* The object has a custom prototype (it is not a plain object and does not have a null prototype).
* The object's constructor is defined using the ES6 `class` syntax.
