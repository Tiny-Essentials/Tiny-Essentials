# 🧩 TinyUriParser Documentation

Welcome to the **TinyUriParser** documentation! 🚀

This project provides a lightweight, highly extensible engine designed to transform complex URI strings (like those used in the Matrix protocol) into structured JavaScript objects, and then reconstruct those objects back into their original URI strings.

## 📖 Overview

In modern messaging protocols, URIs are often used to identify users or rooms (e.g., `@user:example.com`). Manually parsing these using Regex every time can lead to repetitive and error-prone code. 

`TinyUriParser` solves this by allowing you to define "Parser Pairs"—a set of rules that tell the engine:
1. **How to recognize** a specific URI type.
2. **How to turn** that string into a data object.
3. **How to turn** that data object back into a string.

---

## 🏗️ The Building Block: `ParserPair`

Before using the parser, you must understand the `ParserPair`. This is a "tuple" (a fixed-length array) that acts as the blueprint for a specific URI type.

A `ParserPair` consists of exactly four elements:

| Index | Name | Type | Description |
| :--- | :--- | :--- | :--- |
| `0` | **Type** | `string` | A unique name for this URI category (e.g., `'user'`). |
| `1` | **Checker** | `function` | A function that returns `true` if the URI matches this type. |
| `2` | **Parser** | `function` | A function that takes the URI string and returns a data object. |
| `3` | **Stringifier**| `function` | A function that takes the data object and returns the original URI string. |

### 🛠️ How to create a Pair
Instead of creating the array manually, always use the `static buildParserPair` method.

```javascript
const myPair = TinyUriParser.buildParserPair(
  'user', 
  (uri) => uri.startsWith('@'), // Checker
  (uri) => ({ id: uri.split(':')[0] }), // Parser
  (data) => `@${data.id}:example.com` // Stringifier
);
```

---

## 🚀 Getting Started

Here is a step-by-step guide on how to implement `TinyUriParser` in your daily development.

### 1. Define your Parsing Logic
First, decide how you want to handle your specific URIs.

```javascript
// 1. The Checker: Does this string look like a user URI?
const isUserUri = (uri) => uri.startsWith('@');

// 2. The Parser: Convert "@alice:matrix.org" -> { username: "alice", domain: "matrix.org" }
const parseUser = (uri) => {
  const [user, domain] = uri.slice(1).split(':');
  return { username: user, domain: domain };
};

// 3. The Stringifier: Convert { username: "alice", domain: "matrix.org" } -> "@alice:matrix.org"
const stringifyUser = (data) => `@${data.username}:${data.domain}`;
```

### 2. Initialize the Engine
Create an instance of `TinyUriParser` and pass your pairs into the constructor.

```javascript
import TinyUriParser from 'tiny-essentials/libs/tools/TinyUriParser';

const parserEngine = new TinyUriParser(
  TinyUriParser.buildParserPair('user', isUserUri, parseUser, stringifyUser)
);
```

### 3. Parsing a URI (String ➡️ Object)
Use the `.parse()` method to turn a raw string into a usable object.

```javascript
try {
  const result = parserEngine.parse('@alice:matrix.org');
  console.log(result); 
  // Output: { type: 'user', data: { username: 'alice', domain: 'matrix.org' } }
} catch (error) {
  console.error("Parsing failed:", error.message);
}
```

### 4. Reconstructing a URI (Object ➡️ String)
Use the `.stringify()` method to turn your object back into a valid URI string.

```javascript
const userObject = { type: 'user', data: { username: 'bob', domain: 'example.com' } };

const originalUri = parserEngine.stringify(userObject);
console.log(originalUri); 
// Output: "@bob:example.com"
```

### 5. Resource Cleanup
To prevent memory leaks in long-running applications, use the `.destroy()` method to clean up the instance.

```javascript
// Destroys the instance and clears the memory of all stored URI parsers
parserEngine.destroy();
```

---

## ⚠️ Error Handling

The `TinyUriParser` is designed to be strict to ensure data integrity. You should always wrap your calls in `try...catch` blocks.

| Error Type | Cause |
| :--- | :--- |
| `TypeError` | You passed a non-string to `.parse()`, or the `ParserPair` was constructed incorrectly. |
| `Error` | The URI provided does not match any registered parser, or no reconstructor exists for the provided type. |

---

## 📊 Technical Specifications

* **Complexity (Time):** 
    * `parse()`: $O(N)$, where $N$ is the number of registered parsers.
    * `stringify()`: $O(N)$, where $N$ is the number of registered parsers.
* **Immutability:** All `ParserPair` objects are frozen using `Object.freeze()`.
* **Uniqueness:** Parsers are stored in a `Set` to prevent duplicate registration.
