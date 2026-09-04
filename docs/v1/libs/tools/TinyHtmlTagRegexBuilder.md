# 🛠️ TinyHtmlTagRegexBuilder

Welcome to the official documentation for `TinyHtmlTagRegexBuilder`. This utility is designed to make parsing specific HTML tags using Regular Expressions much more structured, predictable, and easy to manage in your daily development workflow.

## 📝 Overview

Parsing HTML with Regular Expressions can be complex and error-prone. The `TinyHtmlTagRegexBuilder` solves this by providing a high-level configuration interface to build specialized Regex patterns. 

Instead of writing long, confusing regex strings manually, you define the **rules** (the tag name, the attributes you want, and how to handle content), and this class generates the engine for you.

---

## 🚀 Getting Started

Since this project uses ES6 modules, you can import it into your JavaScript files like this:

```javascript
import TinyHtmlTagRegexBuilder from 'tiny-essentials/libs/tools/TinyHtmlTagRegexBuilder';
```

---

## ⚙️ Configuration Guide

When you create a new instance using `new TinyHtmlTagRegexBuilder(config)`, you must provide a configuration object. Here is a breakdown of every property available:

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tagName` | `string` | **Yes** | N/A | The name of the HTML tag you want to target (e.g., `'a'`, `'img'`, `'div'`). |
| `attributes` | `string[]` | No | `[]` | An array of specific attribute names you want to extract individually. |
| `captureAllAttributes` | `boolean` | **Yes** | N/A | Determines if you want to grab *every* attribute or only the ones listed in `attributes`. |
| `freeMode` | `boolean` | No | `false` | If `true`, the regex will match content even if it spans multiple lines. |
| `contentPattern` | `string` | No | `'[\s\S]*?'` | A custom regex pattern to define what constitutes the "inner content" of the tag. |

---

## 🛠️ Usage Modes

This is the most important part of the tool. You must choose one of two "modes" based on your goal.

### 🎯 Mode 1: The "Precision Sniper" (Specific Attributes)
**Use this when:** You only care about a few specific attributes (like `href` in an `<a>` tag or `src` in an `<img>` tag) and want to ignore everything else.

*   **Requirement:** `captureAllAttributes` must be `false`.
*   **How it works:** It uses "Lookaheads" to find exactly the attributes you requested in the `attributes` array.

### 📦 Mode 2: The "Grab Everything" (All Attributes)
**Use this when:** You don't know which attributes will be present, but you want to capture every single one of them.

*   **Requirement:** `captureAllAttributes` must be `true`.
*   **How it works:** It captures the entire attribute string and then uses an internal parser to turn it into a clean JavaScript object.

---

## 🧪 Practical Examples

Here are two real-world scenarios to help you implement this in your projects.

### Example 1: Extracting Links (`<a>` tags) 🔗
In this example, we only care about the `href` attribute.

```javascript
const linkBuilder = new TinyHtmlTagRegexBuilder({
  tagName: 'a',
  attributes: ['href'],
  captureAllAttributes: false
});

const html = '<a href="https://google.com" class="link">Click Me</a>';
const results = linkBuilder.parse(html);

console.log(results);
/* 
Output:
[{
  attributes: { href: 'https://google.com' },
  child: 'Click Me'
}]
*/
```

### Example 2: Extracting All Attributes and Multi-line Content 📄
In this example, we want everything inside a `div`, including newlines, and we want all attributes.

```javascript
const divBuilder = new TinyHtmlTagRegexBuilder({
  tagName: 'div',
  captureAllAttributes: true,
  freeMode: true
});

const html = `
<div id="main" class="container" data-role="wrapper">
  <h1>Hello World</h1>
</div>`;

const results = divBuilder.parse(html);

console.log(results);
/* 
Output:
[{
  attributes: { 
    id: 'main', 
    class: 'container', 
    'data-role': 'wrapper' 
  },
  child: '\n  <h1>Hello World</h1>\n'
}]
*/
```

---

## 📖 API Reference

### `constructor(config)`
Initializes the builder. 
*   **Throws:** `TypeError` if `tagName` is not a string, if it contains invalid characters (`<`, `>`, or spaces), or if `captureAllAttributes` is not a boolean.

### `toRegExp(flag = 'g')`
Returns the compiled `RegExp` object.
*   **Parameter:** `flag` (string) - Standard regex flags (default is `'g'`).

### `parse(htmlString)`
The primary method. It executes the regex against your string and returns an array of objects.
*   **Returns:** `ParsedHtmlTag[]` (An array of objects containing `attributes` and `child`).

### `toString()`
Returns the raw regex string used for matching. Useful for debugging!

---

## ⚠️ Error Handling

To ensure your code is robust, this class implements **Strict Runtime Validation**. If you pass the wrong data type, the code will "fail fast" by throwing a `TypeError`.

**Common Errors to Watch For:**
1.  `TypeError: The tagName must be a single word...` — You tried to use a tag like `<div >` (with a space) or `<p>`.
2.  `TypeError: captureAllAttributes must be a boolean.` — You forgot to define this required property.
3.  `TypeError: freeMode must be a boolean.` — You provided a string or number instead of `true`/`false`.
