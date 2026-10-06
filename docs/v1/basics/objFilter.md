# 🧠 objFilter.mjs

Type detection, extension, and analysis made easy — simple and extensible type validation in pure JavaScript.

## Overview

`objFilter.mjs` is a utility module that provides a structured and extensible way to validate, infer, and analyze types in JavaScript. It is designed to work in both Node.js and browser environments, making it ideal for libraries that require consistent, predictable, and highly customizable type-checking logic.

Whether you are building a schema validator, a data transformation pipeline, or debugging complex nested objects, `objFilter.mjs` provides the tools to "understand" your data precisely.

---

## Features

- ✅ **Precise Type Detection**: Detects primitives, built-in objects (`Map`, `Set`, `Date`, etc.), and even browser-specific types.
- ➕ **Extensible Architecture**: Easily add custom types with specific validation and cloning logic.
- 🔄 **Priority Control**: Reorder the evaluation sequence to ensure specific types (like `array`) are caught before generic ones (like `object`).
- 🔍 **Deep Cloning Support**: Integrated cloning logic within the type registry for seamless data duplication.
- 🚫 **Zero Dependencies**: Lightweight and pure JavaScript.

---

## Usage

### 🔍 `checkObj(obj)`

Evaluates an object against the registered validators and returns the first match found.

```javascript
checkObj('hello');
// { valid: true, type: "string" }

checkObj(new Map());
// { valid: Map(0) {}, type: "map" }

checkObj(undefined);
// { valid: null, type: null }
```

**Returns:**
- `{ valid: any, type: string }` if a match is found (`valid` contains the truthy result of the validator).
- `{ valid: null, type: null }` if no match is found.

---

### 🏷️ `objTypeName(val)`

Returns the detected type name of a given value as a string.

```javascript
objTypeName([]); // "array"
objTypeName(null); // "null"
objTypeName(new Set()); // "set"
objTypeName(123); // "number"
objTypeName(Symbol('foo')); // "symbol"
```

**Returns:**
- A string representing the type name (e.g., `"array"`, `"date"`, `"map"`).
- `"unknown"` if no match is found.

---

### ✅ `isObjType(obj, type)`

A strict boolean check to see if a value matches a specific type name. This check is case-insensitive.

```javascript
isObjType([], 'array'); // true
isObjType({}, 'object'); // true
isObjType('hello', 'string'); // true
isObjType(123, 'boolean'); // false
```

*Note: Throws a `TypeError` if the `type` argument is not a string.*

---

### ➕ `extendObjType(ni, [index])`

Add your own custom types to the registry. You can provide types as an object, an array of tuples, or a single tuple.

**Using an Object:**
```javascript
extendObjType({
  customType: val => typeof val === 'symbol'
});
```

**Using an Array of Tuples:**
```javascript
extendObjType([
  ['alpha', val => typeof val === 'string'],
  ['beta', val => Array.isArray(val), (val) => [...val]] // [key, validator, cloner]
]);
```

**Using a Single Tuple:**
```javascript
extendObjType(['gamma', val => typeof val === 'number']);
```

*Note: If no `index` is provided, the type is inserted before the 'object' type or at the end of the registry.*

---

### 🔁 `reorderObjTypeOrder(newOrder)`

Sets a custom priority for type detection. All provided names must already exist in the registry.

```javascript
reorderObjTypeOrder(['string', 'number', 'array', 'object']);
```

---

## Supported Types

By default, the following types are supported (order may vary if customized):

- **Primitives**: `undefined`, `null`, `boolean`, `number`, `nannumber`, `bigint`, `string`, `symbol`, `function`.
- **Built-in Objects**: `array`, `date`, `regexp`, `map`, `set`, `weakmap`, `weakset`, `promise`, `url`.
- **Browser Specific**: `file`, `htmlelement` (only available in browser environments).
- **Generic**: `object`.

---

## API Reference

| Function | Description |
| :--- | :--- |
| `checkObj(obj)` | Returns the first matching type and its validation result. |
| `objTypeName(val)` | Returns the type name as a string. |
| `isObjType(obj, type)` | Returns `true` if the value matches the type. |
| `extendObjType(ni, index)` | Adds new types to the registry. |
| `reorderObjTypeOrder(newOrder)` | Changes the priority of type checking. |
| `cloneObjTypeOrder()` | Returns a copy of the current evaluation order. |
| `getObjTypeOrder()` | Returns a copy of the current evaluation order. |
| `getObjTypeRegistry()` | Returns a clone of the entire type registry. |
