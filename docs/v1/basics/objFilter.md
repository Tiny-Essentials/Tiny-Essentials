# 🧠 objFilter.mjs

Type detection, extension, and analysis made easy — simple and extensible type validation in pure JavaScript.

## Overview

`objFilter.mjs` is a utility module that provides a structured and extensible way to validate, infer, and count object types in JavaScript. It’s designed to work in both Node.js and browser environments and is perfect for libraries that need consistent, extensible type-checking logic.

Whether you’re validating inputs, writing schema validators, or building tools that need to "understand" JavaScript data — this module has your back!

---

## Features

- ✅ Precise type detection (`undefined`, `null`, `array`, `date`, etc.)
- ➕ Custom type extensions with ordering
- 🔄 Reorder type checking priority
- 🔍 Safe and predictable type checks
- 🧮 Count values in arrays and objects
- 🚫 No dependencies

---

## Usage

### 🔍 `checkObj(obj)`

Checks the type of a given object and returns the validation result if a known type is detected.

```js
checkObj('hello');
// { valid: true, type: "string" }

checkObj(123);
// { valid: true, type: "number" }

checkObj(undefined);
// { valid: true, type: "undefined" }

checkObj(Symbol('sym'));
// { valid: true, type: "symbol" }

checkObj(() => {});
// { valid: true, type: "function" }

checkObj(null);
// { valid: true, type: "null" }

checkObj(Object.create(null));
// { valid: true, type: "object" }
```

Returns:
- `{ valid: true, type: "<type>" }` if the type is recognized
- `{ valid: null, type: null }` if no matching type is found

---

### 🏷️ `objTypeName(val)`

Returns the detected type name of a given value as a string.

```js
objTypeName([]); // "array"
objTypeName(null); // "null"
objTypeName(new Set()); // "set"
```

Returns:
- A string representing the type name (e.g., `"array"`, `"date"`, `"map"`).
- `"unknown"` if no matching type is found.

---

### ✅ `isObjType(obj, type)`

Checks whether a given object matches a specific type. This check is case-insensitive.

```js
isObjType([], 'array'); // true
isObjType({}, 'object'); // true
isObjType('hello', 'string'); // true
isObjType(123, 'boolean'); // false
```

*Note: Throws a `TypeError` if the `type` argument is not a string.*

---

### ➕ `extendObjType(newTypes, [index])`

Add your own custom types. You can optionally define where in the check order they go.

```js
extendObjType({
  customElement: val => val && val.tagName === 'MY-ELEMENT'
});
```

```js
extendObjType([
  [ 'alpha', val => typeof val === 'string' ],
  [ 'beta', val => Array.isArray(val) ]
]);
```

This will insert `customElement` before the built-in `object` type unless a position is specified.

---

### 🔁 `reorderObjTypeOrder(newOrder)`

Set a custom priority order for how types are checked (must include only known types).

```js
reorderObjTypeOrder([
  'string',
  'number',
  'array',
  'object'
]);
```

Returns `true` if successful, or `false` if the order includes unknown types.

---

### 📋 `cloneObjTypeOrder()`

Safely get a copy of the current type evaluation order.

```js
const currentOrder = cloneObjTypeOrder();
```

---

## Supported Types

Here’s a full list of supported type names (in their default order):

- `undefined`
- `null`
- `boolean`
- `number`
- `bigint`
- `string`
- `symbol`
- `function`
- `array`
- `buffer`
- `date`
- `regexp`
- `map`
- `set`
- `weakmap`
- `weakset`
- `promise`
- `htmlElement`
- `object`

You can change this order or insert your own types with `extendObjType`.

---

### 🛠️ `getCheckObj()`

This function creates a clone of the functions from the `typeValidator` object. It returns a new object where the keys are the same and the values are the cloned functions.
