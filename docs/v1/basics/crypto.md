# 🔐 Crypto Utils Documentation

Welcome to the **Crypto Utils** documentation! This module provides a simple way to generate cryptographic hashes using the built-in Web Crypto API. It is designed to be lightweight and easy to integrate into any modern JavaScript project. 🚀

## 📖 Overview

The primary purpose of this library is to take a string of text and convert it into a unique "fingerprint" (a hexadecimal hash) using a specified cryptographic algorithm (like SHA-256).

## 🚀 Getting Started

### Installation

Since this is a native ES6 module, you do not need to install any external packages. Simply import the function into your file:

```javascript
import { hashText } from 'tiny-essentials/basics/crypto';
```

---

## 🛠 API Reference

### `hashText(text, algorithm)` 🔑

Asynchronously generates a cryptographic hash of the provided text and returns the result as a hexadecimal string.

#### **Parameters**

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `text` | `string` | The input string you want to hash. |
| `algorithm` | `AlgorithmIdentifier` | The cryptographic algorithm to use (e.g., `'SHA-256'`). |

#### **Return Value**

* **Type:** `Promise<string>`
* **Description:** A promise that resolves to a string representing the hash in **hexadecimal** format (e.g., `"e3b0c442..."`).

#### **Type Definitions**

To ensure type safety, use the following definition for the algorithm parameter:

```javascript
/**
 * @typedef {'SHA-1' | 'SHA-256' | 'SHA-384' | 'SHA-512'} AlgorithmIdentifier
 * Supported algorithms depend on your environment's Web Crypto API implementation.
 */
```

#### **Errors Thrown**

* `TypeError`: Thrown if the `text` parameter is not a string.

---

## 💻 Practical Examples

### 1. Basic Usage (SHA-256) ✅
This is the most common way to use the function. SHA-256 is widely used for data integrity checks.

```javascript
import { hashText } from 'tiny-essentials/basics/crypto';

async function performHashing() {
  try {
    const myText = "Hello, Yasmin!";
    const hash = await hashText(myText, 'SHA-256');
    
    console.log(`Original Text: ${myText}`);
    console.log(`SHA-256 Hash: ${hash}`);
  } catch (error) {
    console.error(`An error occurred: ${error.message}`);
  }
}

performHashing();
```

---

## 💡 Developer Tips for Daily Use

* **Always use `await`:** Since `hashText` is an `async` function, it returns a `Promise`. If you forget to use `await` or `.then()`, you will receive a `Promise` object instead of the actual hash string. ⏳
* **Algorithm Support:** Most modern browsers and Node.js environments support `SHA-256`, `SHA-384`, and `SHA-512`. Always check the [Web Crypto API documentation](https://developer.mozilla.org/en-US/docs/Web/API/SubtleCrypto/digest) if you are unsure. 🔍
* **Hexadecimal Output:** The output is a "hex string" (numbers 0-9 and letters a-f). This is perfect for storing in databases or comparing file integrity. 💾
