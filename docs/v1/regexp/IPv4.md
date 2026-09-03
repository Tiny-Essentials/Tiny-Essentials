# 🌐 IPv4 Utility Library

A lightweight, high-performance JavaScript module designed to validate and extract IPv4 addresses. This library is ideal for form validation, log parsing, and network security filtering.

## 🚀 Overview

This project provides tools to handle IPv4 addresses using highly optimized Regular Expressions. It distinguishes between **exact validation** (checking if a string is strictly an IP) and **extraction** (finding IPs within a large block of text).

---

## 🛠️ API Reference

### `isValidIPv4(s)`
Validates if a string is a correctly formatted IPv4 address.

* **Parameters:**
    * `s` (`string`): The input string to be validated.
* **Returns:** 
    * `boolean`: `true` if the string is a valid IPv4 address, `false` otherwise.
* **Throws:** 
    * `TypeError`: If the input `s` is not a string.

**Example Usage:**
```javascript
import { isValidIPv4 } from 'tiny-essentials/regexp/Ipv4';

console.log(isValidIPv4('192.168.1.1')); // 🟢 true
console.log(isValidIPv4('256.0.0.1'));   // 🔴 false (256 is out of range)
console.log(isValidIPv4('192.168.1'));   // 🔴 false (missing octet)
```

---

### `extractIPsV4(text)`
Scans a block of text and retrieves all IPv4 addresses found within it.

* **Parameters:**
    * `text` (`string`): The text content to search.
* **Returns:** 
    * `string[]`: An array of all matched IP addresses. Returns an empty array `[]` if no matches are found.
* **Throws:** 
    * `TypeError`: If the input `text` is not a string.

**Example Usage:**
```javascript
import { extractIPsV4 } from 'tiny-essentials/regexp/Ipv4';

const logData = "Error from 10.0.0.1 and connection lost at 192.168.0.100";
const ips = extractIPsV4(logData);

console.log(ips); // 📋 ["10.0.0.1", "192.168.0.100"]
```

---

### `ipv4Regex()`
Returns a `RegExp` object for exact matching.

* **Returns:** 
    * `RegExp`: A regex pattern that matches exactly four octets (0-255) separated by dots.

---

### `findIPv4Regex()`
Returns a global `RegExp` object for finding multiple matches.

* **Returns:** 
    * `RegExp`: A global (`g`) regex pattern using word boundaries (`\b`) to ensure it only matches complete IP addresses.

---

## 💡 Practical Use Cases

### 1. 📝 Frontend: Form Validation
When a user enters their IP address in a configuration field, you want to ensure it is valid before sending it to the server.

```javascript
const userInput = document.querySelector('#ip-input').value;

if (isValidIPv4(userInput)) {
  // Proceed with API call
  submitConfig(userInput);
} else {
  // Show error to user
  showError("Please enter a valid IPv4 address (e.g., 192.168.1.1)");
}
```

### 2. 🔍 Backend/DevOps: Log Analysis
If you are processing server logs to find which IP addresses are causing errors.

```javascript
import { extractIPsV4 } from 'tiny-essentials/regexp/Ipv4';

const serverLogs = `
  [2023-10-01 10:00] INFO: User 172.16.254.1 logged in.
  [2023-10-01 10:05] WARN: Failed attempt from 10.5.5.5.
  [2023-10-01 10:10] ERROR: Connection dropped by 192.168.1.1.
`;

const maliciousIPs = extractIPsV4(serverLogs);
console.log(`Found ${maliciousIPs.length} IP addresses in logs.`);
```
