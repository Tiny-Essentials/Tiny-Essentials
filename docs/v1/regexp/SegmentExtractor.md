# 🛠️ Path Segment Extractor Utility

Welcome to the documentation for the **Path Segment Extractor**. This utility is a powerful, lightweight factory designed to transform string-based path patterns (like `/user/:id`) into highly efficient regular expressions capable of extracting dynamic parameters from URLs.

If you are building a custom router or a URL parser, this tool is your best friend! 🚀

---

## 📖 Overview

The core logic relies on a **Factory Pattern**. Instead of creating a regex manually every time, you use `makeSegmentExtractor` to define *how* a dynamic segment looks (e.g., is it prefixed with a colon `:` or wrapped in curly braces `{}`?). Once defined, you can generate multiple "extractors" for different route patterns.

### 🌟 Key Features
* ✅ **Highly Customizable**: Define your own syntax for dynamic segments.
* ✅ **Type Safe**: Strict runtime validation ensures you don't pass incorrect data types.
* ✅ **Performant**: Compiles patterns into optimized `RegExp` objects.
* ✅ **URL Decoded**: Automatically handles `decodeURIComponent` for extracted parameters.

---

## 🚀 Quick Start

The easiest way to use this library is via the pre-configured `segmentExtractorV1`, which supports the standard `:paramName` syntax used by frameworks like Express.js.

```javascript
import { segmentExtractorV1 } from 'tiny-essentials/regexp/SegmentExtractor';

// 1. Define your pattern
const userRoute = segmentExtractorV1('/user/:id/posts/:postId');

// 2. Test a real path
const result = userRoute.exec('/user/yasmin/posts/42');

if (result.match) {
  console.log('✅ Match found!');
  console.log('User ID:', result.params.id);       // "yasmin"
  console.log('Post ID:', result.params.postId);   // "42"
} else {
  console.log('❌ No match.');
}
```

---

## ⚙️ API Reference

### `makeSegmentExtractor(searchValue, replaceValue, errorConfig)`

This is the main factory function.

| Parameter | Type | Description |
| :--- | :--- | :--- |
| `searchValue` | `string \| RegExp` | The pattern used to find dynamic segments in your string. |
| `replaceValue` | `Function` | A callback that transforms the found segment into a Regex capture group. |
| `errorConfig` | `Object` | Configuration for custom error messages. |

#### ⚠️ Errors Thrown
* `TypeError`: If `searchValue` is not a string/RegExp.
* `TypeError`: If `replaceValue` is not a function.
* `TypeError`: If `errorConfig` is missing or invalid.

---

### `segmentExtractorV1(pathPattern)`

A specialized version of the factory pre-configured for the `:name` syntax.

**Returns:** A `SegExResult` object.

---

## 🛠️ Advanced: Creating Custom Extractors

What if your project uses `{id}` instead of `:id`? You can create a custom extractor using `makeSegmentExtractor`.

```javascript
import { makeSegmentExtractor } from 'tiny-essentials/regexp/SegmentExtractor';

// Define an extractor for {bracket} syntax
const bracketExtractor = makeSegmentExtractor(
  /\{([^}]+)\}/g, // 1. Look for anything inside { }
  (paramNames, _, paramName) => { // 2. Transform it
    paramNames.push(paramName);    // Store the name (e.g., "id")
    return '([^}]+)';              // Return regex group (match everything inside)
  },
  { pathPatternErrorMsg: 'Pattern must be a string!' }
);

const route = bracketExtractor('/files/{fileId}');
const data = route.exec('/files/document_01.pdf');

console.log(data.params.fileId); // "document_01.pdf"
```

---

## 📊 Data Structures

Understanding the returned objects is crucial for implementing the logic in your application.

### `SegExResult` (The Object returned by the extractor)
| Property | Type | Description |
| :--- | :--- | :--- |
| `regex` | `RegExp` | The compiled regular expression. |
| `paramNames` | `string[]` | An array of the names of the parameters found (in order). |
| `exec` | `Function` | The function used to perform the actual matching. |

### `SegExData` (The Object returned by `.exec()`)
| Property | Type | Description |
| :--- | :--- | :--- |
| `params` | `Record<string, string>` | A map where keys are parameter names and values are the extracted strings. |
| `match` | `boolean` | `true` if the path matched the pattern, `false` otherwise. |

---

## 💡 Pro-Tips for Developers

1.  **Reuse Extractors**: Do not call `segmentExtractorV1` inside a loop or a high-frequency function. Call it **once** at the top level to compile the regex, and then reuse the returned function. This is much faster! 🏎️
2.  **Decoding**: The `exec` function automatically runs `decodeURIComponent`. This means `%20` in a URL will correctly become a space `" "` in your `params` object.
3.  **Strictness**: The regex is wrapped in `^` and `$`. This means the path must match the pattern **exactly** from start to finish.
