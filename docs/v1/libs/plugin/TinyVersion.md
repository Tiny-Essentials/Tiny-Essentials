# 📦 TinyVersion Documentation

`TinyVersion` is a lightweight, precise JavaScript utility designed to parse and compare **Semantic Versioning (SemVer)** strings. It provides strict validation to ensure your versioning logic remains error-free.

## 📖 Table of Contents
1. [Overview](#-overview)
2. [Installation & Setup](#-installation--setup)
3. [Core Concepts](#-core-concepts)
4. [API Reference](#-api-reference)
    - [Constructor](#-constructor)
    - [Properties (Getters)](#-properties-getters)
    - [Methods](#-methods)
5. [Practical Examples](#-practical-examples)
6. [Error Handling](#-error-handling)

---

## 🔍 Overview

In software development, versioning tells us if a new release contains breaking changes, new features, or just bug fixes. `TinyVersion` automates the parsing of these strings and allows you to perform logical comparisons (is version A newer than version B?) without manual string manipulation.

**Supported Formats:**
- `major` (e.g., `1`)
- `major.minor` (e.g., `1.12`)
- `major.minor.patch` (e.g., `1.25.0`)
- `major.minor.patch-tag` (e.g., `2.0.1-beta`)

---

## 🚀 Installation & Setup

`TinyVersion` is an ES6 module. To use it in your project, ensure your environment supports `import` statements and import the class directly into your file.

```javascript
import TinyVersion from 'tiny-essentials/libs/plugin/TinyVersion';
```

---

## 💡 Core Concepts

### Semantic Versioning Logic
The class follows these priority rules for comparison:
1. **Major** version takes highest priority.
2. **Minor** version is checked if Major is equal.
3. **Patch** version is checked if Major and Minor are equal.
4. **Tags (Pre-release):** 
   - A version **without** a tag is considered **greater** than a version **with** a tag (e.g., `1.0.0` > `1.0.0-alpha`).
   - If both have tags, they are compared lexicographically (alphabetically).

---

## 🛠 API Reference

### 🏗 Constructor

#### `new TinyVersion(versionString)`
Initializes a new instance of the class.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `versionString` | `string` | The version string to be parsed. |

**Throws:**
- `TypeError`: If the input is not a string.
- `Error`: If the string does not follow the `X.Y.Z` or `X.Y.Z-tag` format.

---

### 🔑 Properties (Getters)

These properties allow you to access the individual components of the version.

| Getter | Type | Description |
| :--- | :--- | :--- |
| `.major` | `number` | The major version (indicates breaking changes). |
| `.minor` | `number` | The minor version (indicates new features). |
| `.patch` | `number` | The patch version (indicates bug fixes). |
| `.tag` | `string \| null` | The pre-release tag (e.g., `"beta"`), or `null`. |

---

### ⚙️ Methods

#### `.isGreaterThan(version)`
Compares the current instance to another `TinyVersion` instance.
- **Returns:** `boolean` (True if `this` > `version`).
- **Throws:** `TypeError` if the argument is not a `TinyVersion` instance.

#### `.isEqualTo(version)`
Checks if two versions are identical in all components.
- **Returns:** `boolean`.
- **Throws:** `TypeError` if the argument is not a `TinyVersion` instance.

#### `.isLessThan(version)`
Checks if the current instance is older than another version.
- **Returns:** `boolean`.
- **Throws:** `TypeError` if the argument is not a `TinyVersion` instance.

#### `.toString()`
Returns the reconstructed version string.
- **Returns:** `string` (e.g., `"1.2.3-beta"`).

---

## 🧪 Practical Examples

### 1. Basic Comparison
```javascript
import TinyVersion from 'tiny-essentials/libs/plugin/TinyVersion';

const v1 = new TinyVersion('1.2.0');
const v2 = new TinyVersion('1.1.5');

console.log(v1.isGreaterThan(v2)); // true ✅
console.log(v1.isEqualTo(v2));    // false ❌
```

### 2. Handling Pre-release Tags
```javascript
const release = new TinyVersion('2.0.0');
const beta = new TinyVersion('2.0.0-beta');

// A formal release is always greater than a beta tag
console.log(release.isGreaterThan(beta)); // true ✅
console.log(beta.isLessThan(release));    // true ✅
```

### 3. String Reconstruction
```javascript
const version = new TinyVersion('3.4.5-rc.1');
console.log(version.toString()); // "3.4.5-rc.1"
```

---

## ⚠️ Error Handling

The class is designed to fail fast. This prevents your application from proceeding with corrupted or invalid version data.

| Error Type | Cause | Example |
| :--- | :--- | :--- |
| `TypeError` | Passing a non-string to the constructor. | `new TinyVersion(1.0)` |
| `Error` | Passing a string that doesn't match the format. | `new TinyVersion('v1.0')` |
| `TypeError` | Passing a non-TinyVersion object to comparison methods. | `v1.isGreaterThan('1.0.0')` |
