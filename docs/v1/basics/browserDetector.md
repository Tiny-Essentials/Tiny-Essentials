# 🌐 Browser Detection Toolkit

A multi-layered JavaScript utility for identifying the user's web browser and rendering engine.

## 📋 Table of Contents
1. [Data Types](#📋-data-types)
2. [Core Functions](#🛠️-core-functions)
   - [isBrowserAgent](#1-isbrowseragent)
   - [getBrowserCssPrefix](#2-getbrowsercssprefix)
   - [getDuckTyping](#3-getducktyping)
3. [Advanced Detection](#🎯-advanced-detection)
   - [getBrowserPings](#4-getbrowserpings)
   - [browserIs](#5-browseris)

---

## 📋 Data Types

To ensure type safety and clarity, the toolkit utilizes the following definitions:

### `BrowserDetected`
A union type representing the supported browser names:
`'chrome' | 'firefox' | 'ie' | 'edge' | 'safari' | 'opera' | 'yandex' | 'other'`

### `DuckTypingResult`
An object returned by feature detection, containing boolean flags:
| Property | Description |
| :--- | :--- |
| `isOpera` | `true` if Opera is detected |
| `isFirefox` | `true` if Firefox is detected |
| `isSafari` | `true` if Safari is detected |
| `isIE` | `true` if Internet Explorer is detected |
| `isEdge` | `true` if Microsoft Edge is detected |
| `isChrome` | `true` if Google Chrome is detected |
| `isBlink` | `true` if the Blink rendering engine is detected |

---

## 🛠️ Core Functions

### 1. `isBrowserAgent()`
Parses the `navigator.userAgent` string to provide a quick identification of the browser.

* **Returns:** `BrowserDetected`
* **Best use case:** Quick, lightweight checks where absolute precision is not critical.

```javascript
import { isBrowserAgent } from 'tiny-essentials/basics/browserDetector';

const browser = isBrowserAgent();
console.log(`You are using: ${browser}`); 
// Output example: "chrome"
```

### 2. `getBrowserCssPrefix()`
Inspects the computed styles of the document to determine the CSS rendering engine.

* **Returns:** `'gecko' | 'webkit' | 'trident' | 'other'`
* **Best use case:** When you need to apply CSS vendor prefixes or handle engine-specific rendering quirks.

```javascript
import { getBrowserCssPrefix } from 'tiny-essentials/basics/browserDetector';

const engine = getBrowserCssPrefix();
if (engine === 'webkit') {
  console.log("Applying WebKit specific styles... 🎨");
}
```

### 3. `getDuckTyping()`
Performs deep feature detection by checking for the existence of specific global objects and APIs.

* **Returns:** `DuckTypingResult`
* **Best use case:** When you need to know exactly which features are available in the current environment.

```javascript
import { getDuckTyping } from './browserDetector.js';

const features = getDuckTyping();

if (features.isChrome) {
  console.log("Chrome-specific API available! ✅");
}

if (features.isBlink) {
  console.log("Blink engine detected. ⚡");
}
```

---

## 🎯 Advanced Detection

These functions aggregate the results from the core functions to provide the highest possible accuracy.

### 4. `getBrowserPings(disable = [])`
Aggregates detection results from all three methods (User Agent, CSS Prefix, and Duck Typing) to provide a "ping count" for each browser.

* **Parameters:** 
  * `disable` (Array): An optional array of `BrowserDetected` names to exclude from the results.
* **Returns:** `Object<BrowserDetected, number>` (An object where keys are browsers and values are the number of times they were detected).
* **Throws:** `TypeError` if `disable` is not an array or contains invalid browser names.

```javascript
import { getBrowserPings } from 'tiny-essentials/basics/browserDetector';

// Get detection counts for all browsers
const counts = getBrowserPings();
console.log(counts);

// Get counts while ignoring Internet Explorer
const filteredCounts = getBrowserPings(['ie']);
console.log(filteredCounts);
```

### 5. `browserIs(disable = [])`
The most reliable method. It runs all detection strategies and returns the browser that received the highest number of "pings."

* **Parameters:** 
  * `disable` (Array): An optional array of `BrowserDetected` names to exclude.
* **Returns:** `BrowserDetected` (The most likely browser name).
* **Throws:** `TypeError` if `disable` is not an array or contains invalid browser names.

```javascript
import { browserIs } from 'tiny-essentials/basics/browserDetector';

// Get the most accurate browser identification
const currentBrowser = browserIs();

if (currentBrowser === 'firefox') {
  console.log("Welcome, Firefox user! 🦊");
} else {
  console.log(`Detected: ${currentBrowser}`);
}
```
