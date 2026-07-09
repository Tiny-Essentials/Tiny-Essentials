# 📝 TinyTextDiffer — Text Comparison Tool

Welcome to **TinyTextDiffer**! This is a lightweight, history-based utility designed to compute granular differences between text versions, mimicking the logic used by modern version control systems like GitHub.

It uses the **Longest Common Subsequence (LCS)** algorithm to ensure that changes are detected accurately at the character level, providing a clean "Added/Deleted/Normal" parse for your UI.

---

## ✨ Features

* 📜 **Version History**: Store and manage multiple versions of a string.
* 🔍 **Granular Diff**: Detects specific changes (additions, removals, or unchanged text).
* 🛡️ **Type Safety**: Robust internal validations for indices and data types.
* 🧹 **Memory Management**: Includes `clear()` and `destroy()` methods to prevent memory leaks.
* 📦 **ESM Ready**: Built with modern JavaScript using `import/export`.

---

## 🚀 Installation & Setup

Since this is an ES Module, you can simply import it into your project:

```javascript
import TinyTextDiffer from 'tiny-essentials/libs/TinyTextDiffer';

const differ = new TinyTextDiffer(["Initial text", "Updated text!"]);

```

---

## 📚 API Reference

### 🏗️ Constructor

`new TinyTextDiffer(history)`

* **history** (`string[]`): Optional. Initial array of text versions.

---

### 🛠️ Methods

| Method | Parameters | Returns | Description |
| --- | --- | --- | --- |
| `add` | `text: string` | `void` | Appends a new version to the end of the history. |
| `addAt` | `index: number, text: string` | `void` | Inserts a version at a specific position. |
| `compare` | `...indexes: number` | `DiffResult[][]` | Compares pairs of indices and returns the differences. |
| `get` | `index: number` | `string` | Retrieves the text at the specified index. |
| `has` | `index: number` | `boolean` | Checks if a version exists at the specified index. |
| `remove` | `none` | `string` | Removes and returns the last version in history. |
| `removeAt` | `index: number` | `boolean` | Removes a specific version and returns `true` if successful. |
| `clear` | `none` | `void` | Wipes the entire history. |
| `destroy` | `none` | `void` | Marks the instance as destroyed and frees memory. |

---

### 📊 Data Types

#### `DiffResult`

The `compare` method returns an array of these objects:

```javascript
/**
 * @typedef {Object} DiffResult
 * @property {string} value - The actual string content.
 * @property {"normal"|"added"|"deleted"} type - The status of the segment.
 */
```

---

## 💡 Usage Example

Comparing two versions to see what changed:

```javascript
const differ = new TinyTextDiffer(["Hello World", "Hello World!"]);

// Comparing index 0 with index 1
const [result] = differ.compare(0, 1);

console.log(result);
/*
Output:
[
  { value: "Hello World", type: "normal" },
  { value: "!", type: "added" }
]
*/
```

---

## ⚙️ Technical Details

### The Algorithm

The core of this tool is the `_computeDiff` private method. It implements a dynamic programming approach to find the **Longest Common Subsequence**.

1. It builds a comparison matrix between two strings.
2. It traces back the path to identify where characters were added or removed.
3. It optimizes the output by grouping consecutive characters of the same type (e.g., merging "H", "e", "l", "l", "o" into "Hello").

---

## 🛡️ Error Handling

This class is designed to be "loud" about misuse to help you debug faster:

* Throws `TypeError` if you try to add non-string values.
* Throws `Error` if you try to access indices out of bounds.
* Throws `Error` if you attempt to use the instance after calling `destroy()`.
