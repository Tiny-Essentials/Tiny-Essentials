# 🌐 IPv6 Utility Library

A lightweight JavaScript utility for validating and extracting IPv6 addresses using optimized Regular Expressions.

## 📖 Overview

This library provides essential tools for developers working with networking data. It allows you to:
1.  **Validate** if a specific string is a correctly formatted IPv6 address.
2.  **Extract** all IPv6 addresses found within a larger block of text (such as log files or network reports).
3.  **Access** the underlying Regular Expressions for custom implementations.

---

## 🚀 Getting Started

### Installation
Since this library uses **ES6 Modules**, ensure your project is configured to support them. You can import the functions directly into your JavaScript files:

```javascript
import { isValidIPv6, extractIPsV6, ipv6Regex, findIPv6Regex } from 'tiny-essentials/regexp/Ipv6';
```

---

## 🛠 API Reference

### `isValidIPv6(s)`
Checks if the provided string is a valid IPv6 address.

*   **Parameters:**
    *   `s` (`string`): The input string to be validated.
*   **Returns:** 
    *   `boolean`: Returns `true` if the string is a valid IPv6 address, otherwise `false`.
*   **Throws:** 
    *   `TypeError`: If the input `s` is not a string.

### `extractIPsV6(text)`
Scans a string and returns all IPv6 addresses found within it.

*   **Parameters:**
    *   `text` (`string`): The text content to search through.
*   **Returns:** 
    *   `string[]`: An array containing all matched IPv6 addresses. Returns an empty array `[]` if no matches are found.
*   **Throws:** 
    *   `TypeError`: If the input `text` is not a string.

### `ipv6Regex()`
Generates a strict Regular Expression for IPv6 validation.

*   **Returns:** 
    *   `RegExp`: A regex object anchored with `^` and `$` to ensure the entire string is checked.

### `findIPv6Regex()`
Generates a global Regular Expression for searching.

*   **Returns:** 
    *   `RegExp`: A regex object with the `g` (global) flag, useful for finding multiple occurrences in a text.

---

## 💡 Practical Examples

### 1. Validating User Input
Use `isValidIPv6` to verify data entered by a user in a network configuration form.

```javascript
import { isValidIPv6 } from 'tiny-essentials/regexp/Ipv6';

const userInput = "2001:0db8:85a3:0000:0000:8a2e:0370:7334";

if (isValidIPv6(userInput)) {
  console.log("✅ Valid IPv6 address.");
} else {
  console.log("❌ Invalid IPv6 address.");
}
```

### 2. Parsing Log Files
Use `extractIPsV6` to quickly grab all IP addresses from a server log file.

```javascript
import { extractIPsV6 } from 'tiny-essentials/regexp/Ipv6';

const logData = `
  [2025-01-01 10:00] Connection from 2001:db8::1
  [2025-01-01 10:05] Connection from fe80::ff00:43:ff:fe12:3456
  [2025-01-01 10:10] Unknown error from 192.168.1.1
`;

const foundIPs = extractIPsV6(logData);

console.log("Detected IPv6 addresses:", foundIPs);
// Output: ["2001:db8::1", "fe80::ff00:43:ff:fe12:3456"]
```

---

## ⚠️ Error Handling

The library implements strict type checking to prevent bugs in your application. If you pass a non-string value (like `null`, `undefined`, or a `number`) to the primary functions, the library will throw a `TypeError`.

**Example of error handling:**

```javascript
import { isValidIPv6 } from 'tiny-essentials/regexp/Ipv6';

try {
  isValidIPv6(12345); // This will trigger the error
} catch (error) {
  if (error instanceof TypeError) {
    console.error("⚠️ Error: " + error.message); 
    // Output: "⚠️ Error: The input must be a string."
  }
}
```

---

## ⚙️ Technical Implementation Details

*   **Regex Logic:** The library uses a specialized pattern that accounts for standard IPv6 formats and **zero compression** (the `::` notation).
*   **Complexity Note:** While IPv4 validation is straightforward, this implementation handles the hexadecimal complexity and variable group lengths required for IPv6.
