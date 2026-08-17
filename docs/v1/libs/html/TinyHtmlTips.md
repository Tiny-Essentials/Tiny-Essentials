# 🔧 TinyHtml Shortcuts & Aliases

One of the coolest things about **TinyHtml** is that you can give its static methods **custom names (aliases)** 🎉.
This allows you to mimic the style of jQuery, native browser functions, or even create your own conventions for working with the DOM.

---

## 🎭 Mimic jQuery Style

If you’re a fan of jQuery’s `$` syntax, you can directly alias TinyHtml methods:

```js
// Select multiple elements (like jQuery's $)
const $ = TinyHtml.queryAll;

// Usage
$('.my-class').forEach(el => console.log(el));
```

---

## 💎 Super jQuery-like Style

If you want TinyHtml to feel **almost exactly like jQuery**, you can define `$` as a **function wrapper** that automatically instantiates a `TinyHtml` object from a CSS selector.

```js
// jQuery-style $ function
const $ = (queryString) => new TinyHtml(queryString);

// Usage
$('#my-id').addClass('highlight');
$('.btn').on('click', () => alert('Clicked!'));
```

---

## 🌐 Mimic Native Browser Querying

If you prefer the style of the **native browser query** functions (`querySelector` and `querySelectorAll`), you can do:

```js
// Select single element (like document.querySelector)
const $ = TinyHtml.query;

// Select multiple elements (like document.querySelectorAll)
const $$ = TinyHtml.queryAll;

// Usage
const button = $('#my-button');
const divs = $$('.container');
```

---

## 🛠️ Extra: Element Creation Shortcut

TinyHtml also supports element creation. You can alias this too for faster coding:

```js
// Create elements from plain strings
const $$$ = TinyHtml.createFrom;

// OR, if you want it more explicit:
const $$$ = TinyHtml.createFromHtml;

// Usage
const newDiv = $$$('<div class="box">Hello!</div>');
```

---

## ⚙️ Controlling Whitespace in Class Names

TinyHtml includes a static flag called `classCanWhitespace`.
This allows you to decide whether **class names with whitespace** should be considered valid or not.

```js
// Enable or disable whitespace in class names
TinyHtml.classCanWhitespace = true;   // ✅ allows whitespace
console.log(TinyHtml.classCanWhitespace); // true

TinyHtml.classCanWhitespace = false;  // 🚫 disallows whitespace
console.log(TinyHtml.classCanWhitespace); // false
```

⚠️ If you try to assign a non-boolean value, TinyHtml will throw an error:

```js
// ❌ Throws TypeError
TinyHtml.classCanWhitespace = "yes"; 
// -> Uncaught TypeError: classCanWhitespace must be a boolean
```

---

## 🚀 Why Aliases?

Aliases are especially handy when:

* You want **shorter code** ✨
* You’re working on **personal projects** with a custom coding style
* You want to **simulate familiar APIs** like jQuery or browser query functions

---

👉 In summary, **TinyHtml is flexible**: you can stick to its original method names for clarity, or create **shortcuts** to match your own workflow.

---

# 📦 Creating a TinyHtml Shortcuts Module

Instead of redefining your shortcuts (`$`, `$$`, `$$$`) in every file, you can create a **dedicated module** that exports them.
This makes your setup **cleaner, reusable, and consistent** across the whole project.

---

## 🛠️ Example: shortcuts.js

```js
// Enable debugging mode
TinyHtml.elemDebug = true;

// Allow whitespace in class names
TinyHtml.classCanWhitespace = true;

// jQuery-style single element selector
export const $ = (queryString) => new TinyHtml(queryString);

// Create elements from HTML objects
export const $$ = TinyHtml.createFrom;

// Create elements from HTML strings
export const $$$ = TinyHtml.createFromHTML;

// Export TinyHtml’s observer utility
export const mainObserver = TinyHtml.tinyObserver;

// Set TinyHtml’s default display css
TinyHtml.defaultDisplay = 'block';
```

---

## 🚀 Usage in Your Project

Now you can simply import the shortcuts wherever you need them:

```js
import { $, $$, $$$ } from './shortcuts.js';

// Select a button
const btn = $('#submit');

// Create and append an element
const newBox = $$('div', { class: 'box' });

// Set element's default display css
newBox.mainDisplay = 'block';

// Create an element
const newBox2 = $$$('<div class="box">Hello!</div>');
$('body').append(newBox);

// Control class whitespace support
console.log(TinyHtml.classCanWhitespace); // true
TinyHtml.classCanWhitespace = false;      // disable whitespace
```

---

👉 With this setup, you end up with your own **personalized DOM toolkit**, powered by TinyHtml but feeling **as smooth as jQuery**.
