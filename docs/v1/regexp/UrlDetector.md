# 🌐 URL Regex Utility Module

A robust and highly customizable JavaScript utility for building, validating, and extracting URLs using precise Regular Expressions. This module is designed for developers who need strict control over what constitutes a "valid" URL in their specific application context. 🚀

## 📋 Table of Contents
1. [Overview](#overview)
2. [Configuration (`UrlRegexOptions`)](#configuration-urlregexoptions)
3. [API Reference](#api-reference)
4. [Practical Examples](#practical-examples)
5. [Error Handling](#error-handling)

---

## 🚀 Overview

The `URL Regex Utility` allows you to define exactly how a URL should look. Instead of using a "one-size-fits-all" regex, you can specify protocols, subdomains, and even the character length of the domain and TLD (Top-Level Domain). This is extremely useful for security-sensitive applications where you only want to allow specific types of links.

---

## ⚙️ Configuration (`UrlRegexOptions`)

When using any function in this module, you can pass an optional `options` object to customize the behavior.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `protocol` | `string` | `'https?'` | The scheme to match (e.g., `'http'`, `'https'`, or a custom pattern like `'ftp'`). |
| `subDomain` | `string` | `''` | The specific subdomain string to look for (e.g., `'www'` or `'api'`). |
| `subDomainOptional` | `boolean` | `true` | If `true`, the URL doesn't *need* the subdomain. If `false`, it is mandatory. |
| `nameMaxLength` | `[number, number]` | `[1, 256]` | An array defining the `[min, max]` length of the domain name. |
| `topLevelDomainLength` | `[number, number]` | `[1, 6]` | An array defining the `[min, max]` length of the TLD (e.g., `.com`, `.org`). |

---

## 📖 API Reference

### 🛠 `urlStringRegexBuilder(options)`
**Description:** The engine of the module. It generates a raw regex pattern string based on your configuration.
* **Returns:** `{string}` A string representing the regex pattern.

### 🔒 `urlRegex(options)`
**Description:** Creates a `RegExp` object that is **anchored**. This means the URL must match the pattern from the very start (`^`) to the very end (`$`) of the string.
* **Returns:** `{RegExp}` An anchored RegExp object.

### ✅ `isValidUrl(s, options)`
**Description:** The most common function for validation. It checks if a single string is a valid URL according to your rules.
* **Parameters:** 
    * `s` `{string}`: The string to validate.
    * `options` `{UrlRegexOptions}`: Your custom configuration.
* **Returns:** `{boolean}` `true` if valid, `false` otherwise.

### 🔍 `findUrlRegex(options)`
**Description:** Generates a **global** `RegExp` object. This is used when you want to find multiple URLs within a larger block of text.
* **Returns:** `{RegExp}` A global (`g`) RegExp object.

### 📥 `extractUrls(text, options)`
**Description:** Scans a block of text and pulls out every URL that matches your configuration.
* **Parameters:**
    * `text` `{string}`: The text content to search through.
    * `options` `{UrlRegexOptions}`: Your custom configuration.
* **Returns:** `{string[]}` An array of matching URL strings. Returns an empty array `[]` if no matches are found.

---

## 🛠 Practical Examples

### 1. Simple Validation ✅
Checking if a standard URL is valid.

```javascript
import { isValidUrl } from 'tiny-essentials/regexp/UrlDetector';

const url = "https://google.com";
const isValid = isValidUrl(url); 

console.log(isValid); // true
```

### 2. Strict Subdomain Requirement 🔒
Ensuring a URL *must* start with `api.`.

```javascript
import { isValidUrl } from 'tiny-essentials/regexp/UrlDetector';

const options = {
  subDomain: 'api',
  subDomainOptional: false
};

console.log(isValidUrl("https://api.example.com", options)); // true
console.log(isValidUrl("https://example.com", options));     // false
```

### 3. Extracting Links from Text 📥
Finding all links inside a paragraph.

```javascript
import { extractUrls } from 'tiny-essentials/regexp/UrlDetector';

const blogPost = "Check our site at https://mysite.com or follow us at http://social.com/user";
const links = extractUrls(blogPost);

console.log(links); 
// Output: ["https://mysite.com", "http://social.com/user"]
```

---

## ⚠️ Error Handling

To ensure your code doesn't fail silently, this module uses **strict runtime validation**. If you provide the wrong data type, the module will throw a `TypeError`.

**Common Errors:**
* `TypeError: Options must be an object.` — Occurs if `options` is a string, number, or null.
* `TypeError: The "protocol" property must be a string.` — Occurs if you pass a non-string to `protocol`.
* `TypeError: The input must be a string.` — Occurs if you pass something other than a string to `isValidUrl` or `extractUrls`.

> **💡 Pro-Tip:** Always wrap your calls in a `try...catch` block if you are handling user-provided input to prevent your application from crashing!
