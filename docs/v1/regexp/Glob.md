# 🌟 GlobMaster Utility

Welcome to the **GlobMaster** documentation! 🚀 This utility is a professional-grade tool designed to bridge the gap between human-readable **GLOB patterns** (commonly used in file systems) and machine-executable **JavaScript Regular Expressions (RegExp)**.

Whether you are building a file explorer, a routing system, or a search filter, GlobMaster makes pattern matching intuitive and powerful.

---

## 📑 Table of Contents

- [✨ Core Features](#-core-features)
- [🛠 API Reference](#-api-reference)
  - [1. `compileGlob`](#1-compileglob)
  - [2. `compileGlobRegExp`](#2-compileglobregexp)
  - [3. `decompileGlob`](#3-decompileglob)
  - [4. `isValidGlob`](#4-isvalidglob)
- [💡 Daily Workflow Examples](#-daily-workflow-examples)
  - [Scenario A: Filtering Files in a Directory](#scenario-a-filtering-files-in-a-directory)
  - [Scenario B: Validating User Input](#scenario-b-validating-user-input)
  - [Scenario C: Converting Regex back to Human-Readable GLOB](#scenario-c-converting-regex-back-to-human-readable-glob)
- [⚠️ Error Handling Guide](#-error-handling-guide)

---

## ✨ Core Features

GlobMaster supports the most essential GLOB syntax used in modern development:

*   `*` : Matches any characters **except** path separators (`/`).
*   `**` : Matches any characters **including** path separators (useful for recursive directory matching).
*   `?` : Matches exactly one single character (excluding path separators).
*   `[...]` : Matches any one of the characters inside the brackets.
*   `[!...]` : Negated character class (matches any character **not** inside the brackets).
*   `{a,b}` : Alternation (matches `a`, `b`, or `c`).
*   `\` : Escape character to treat special symbols as literal characters.

---

## 🛠 API Reference

### 1. `compileGlob`
Converts a GLOB pattern into an array of regex-ready strings.

**Signature:**
```javascript
export const compileGlob(globData, strict = true);
```

**Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `globData` | `string \| string[]` | Required | The pattern to compile. Can be a single string or an array of strings. |
| `strict` | `boolean` | `true` | If `true`, throws a `SyntaxError` for unmatched brackets `[` or braces `{`. |

**Returns:**
*   `string[]`: An array of strings representing the components of the compiled Regular Expression.

**Errors:**
*   `TypeError`: If `globData` is not a string or array of strings, or if `strict` is not a boolean.
*   `SyntaxError`: If `strict` is enabled and the pattern has unbalanced syntax.

---

### 2. `compileGlobRegExp`
The most common method. Converts a GLOB pattern directly into a functional `RegExp` object.

**Signature:**
```javascript
export const compileGlobRegExp(globPattern, flags = '', strict = true);
```

**Parameters:**
| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `globPattern` | `string` | Required | The GLOB pattern to convert. |
| `flags` | `string` | `''` | Standard RegExp flags (e.g., `'i'` for case-insensitive). |
| `strict` | `boolean` | `true` | If `true`, performs strict syntax validation. |

**Returns:**
*   `RegExp`: A ready-to-use Regular Expression object.

---

### 3. `decompileGlob`
The inverse of the compiler. It takes a `RegExp` and reconstructs the original GLOB pattern.

**Signature:**
```javascript
export const decompileGlob(regexp);
```

**Parameters:**
| Parameter | Type | Description |
| :--- | :--- | :--- |
| `regexp` | `RegExp \| string \| string[]` | The pattern to decompile. |

**Returns:**
*   `string[]`: An array containing the reconstructed GLOB pattern components.

---

### 4. `isValidGlob`
A lightweight way to check if a pattern is syntactically correct without needing to handle errors manually.

**Signature:**
```javascript
export const isValidGlob(globPattern);
```

**Returns:**
*   `boolean`: `true` if the pattern is valid, `false` if there is a syntax error.

---

## 💡 Daily Workflow Examples

Here is how you will use this project in your day-to-day development.

### Scenario A: Filtering Files in a Directory
If you want to find all `.js` files in any subfolder:

```javascript
import { compileGlobRegExp } from 'tiny-essentials/regexp/Glob';

const pattern = compileGlobRegExp('**/*.js');
const files = ['src/index.js', 'README.md', 'lib/utils/math.js', 'config.json'];

const matches = files.filter(file => pattern.test(file));

console.log(matches); 
// Output: ['src/index.js', 'lib/utils/math.js']
```

### Scenario B: Validating User Input
When a user types a search pattern, you want to ensure they didn't break the syntax before processing it.

```javascript
import { isValidGlob } from 'tiny-essentials/regexp/Glob';

const userInput = "src/[a-z{"; // This is invalid due to the unclosed brace

if (isValidGlob(userInput)) {
  console.log("Pattern is valid! Proceeding...");
} else {
  console.error("Invalid pattern detected. Please check your brackets.");
}
```

### Scenario C: Converting Regex back to Human-Readable GLOB
If you have a complex Regex and want to display its "human" version in a UI:

```javascript
import { decompileGlob } from 'tiny-essentials/regexp/Glob';

const myRegex = /^src\/.*\.js$/;
const humanPattern = decompileGlob(myRegex);

console.log(humanPattern.join('')); 
// Output: "src/*.js"
```

---

## ⚠️ Error Handling Guide

To ensure your application doesn't crash, always wrap your compilation in a `try...catch` block if you are dealing with dynamic user input.

| Error Type | Cause |
| :--- | :--- |
| `TypeError` | You passed a number, object (not array), or null where a string was expected. |
| `SyntaxError` | (In strict mode) You have an opening `[` or `{` without a closing counterpart. |
