# 🗺️ TinySiteMapStream Documentation

`TinySiteMapStream` is a high-performance Node.js **Transform stream** designed for generating XML sitemaps incrementally. 

Instead of building a massive XML string in your computer's memory (which can cause crashes if your website has millions of pages), this class processes one entry at a time and "streams" it to its destination (like a file or an HTTP response).

---

## 🚀 Core Concepts

### 🛠️ What is a Transform Stream?
Think of a Transform stream as a "processing station" on a factory conveyor belt:
1. **Input:** It receives raw data objects (like a list of URLs from a database).
2. **Transformation:** It converts those objects into formatted XML text.
3. **Output:** It pushes that XML text out to the next station.

### 🧬 Configuration Inheritance
The `TinySiteMapStream` does not work alone. It requires an existing `TinySiteMap` instance. This allows the stream to "inherit" (copy) the settings you already defined, such as your `baseUrl`, `namespaces`, and `type`.

---

## ⚙️ Configuration Options

When you create a new stream, you can pass a `TinySiteMapStreamOptions` object.

| Property | Type | Description |
| :--- | :--- | :--- |
| `level` | `'silent' \| 'warn' \| 'error'` | Controls how the stream reacts when it encounters a bad URL or invalid data. |
| `xmlns` | `SitemapNamespace[]` | Custom XML namespaces to include in the header. |

### ⚠️ Error Handling Levels
Choosing the right `level` is crucial for your workflow:

*   ❌ **`error`**: The stream will stop immediately and emit an error if a single entry is invalid. Use this during **development** to catch bugs.
*   ⚠️ **`warn`**: The stream will log a warning to the console but will **continue** processing the rest of the entries. Use this in **production** to prevent one bad URL from breaking your entire sitemap.
*   🤫 **`silent`**: The stream will skip invalid entries without saying anything. Use this if you want a completely clean log and don't care about missing specific URLs.

---

## 🛠️ Implementation Guide (Step-by-Step)

To use this in your project, follow these three logical steps.

### 1. Setup the Main Instance
First, you must have your primary `TinySiteMap` configuration ready.

```javascript
import TinySiteMap from 'tiny-essentials/libs/tools/TinySiteMap';
import TinySiteMapStream from 'tiny-essentials/libs/tools/TinySiteMapStream';
import { createWriteStream } from 'node:fs';

// 1. Initialize the main configuration
const sitemapManager = new TinySiteMap({
  baseUrl: 'https://example.com',
  type: 'normal' // or 'index'
});
```

### 2. Initialize the Stream
Create the stream and pass the manager into it.

```javascript
// 2. Create the transform stream
const stream = new TinySiteMapStream(sitemapManager, {
  level: 'warn' // We want to know if something is wrong, but keep going
});
```

### 3. The Data Pipeline (The "Daily Workflow")
In a real-world scenario, you will likely pull data from a database and "pipe" it through the stream into a file.

```javascript
// 3. Create a destination (a file on your Linux system)
const fileDestination = createWriteStream('./sitemap.xml');

// 4. Start the pipeline
// We pipe: [Your Data] -> [The Transformer] -> [The File]
myDatabaseQueryStream
  .pipe(stream)
  .pipe(fileDestination)
  .on('finish', () => console.log('✅ Sitemap generated successfully!'));
```

---

## 📝 Developer Cheat Sheet

### 💡 Pro-Tips for Daily Use

* **Memory Efficiency:** Always use `.pipe()` instead of collecting all results in an array. This keeps your RAM usage low, even if you have 1,000,000 URLs. 📉
* **Debugging:** If your sitemap is missing pages, change your `level` to `'warn'` temporarily. Check your terminal for `[TinySiteMapStream Warn]` messages. 🔍
* **Validation:** The stream automatically calls `TinySiteMap.resolveAndValidate`. This means you don't need to manually check if your URLs are valid before sending them to the stream; the stream handles the heavy lifting for you. ✅

### 🛠️ Summary of Internal Logic
1. **First Entry:** The stream automatically injects the `<?xml...?>` declaration and the `<urlset>` header.
2. **Middle Entries:** Each object is converted to an `<url>` or `<sitemap>` XML fragment.
3. **End of Stream:** When the data ends, the stream automatically injects the `</urlset>` footer.
