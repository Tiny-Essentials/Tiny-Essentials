# 🗺️ TinySiteMap Documentation

`TinySiteMap` is a robust, secure, and lightweight JavaScript service designed to manage and generate XML sitemaps or sitemap indexes. It is built to handle the complexities of XML namespaces, URL resolution, and security validation automatically.

## 🚀 Overview

When building websites, sitemaps are essential for SEO (Search Engine Optimization). They tell search engines which pages are available for crawling. `TinySiteMap` automates the creation of these files while ensuring they are valid and safe from common web vulnerabilities.

### 🛡️ Security First (The "Why")
This project implements two critical security layers:
1.  **XML Injection Prevention:** The `#escapeXml` method ensures that special characters (like `<` or `&`) are converted into XML entities. This prevents malicious users from injecting unauthorized XML tags into your sitemap.
2.  **URL Origin Validation:** The `#resolveAndValidate` method checks that every URL added to the sitemap belongs to the same origin as your `baseUrl`. This prevents "Open Redirect" style vulnerabilities where a sitemap might accidentally point to a malicious third-party domain.

---

## 🛠️ Getting Started

### 1. Installation & Import
Since this project uses ES6 modules, you must import it using the `import` syntax.

```javascript
import TinySiteMap from 'tiny-essentials/libs/tools/TinySiteMap';
```

### 2. Basic Configuration
To start, you need to create an instance of `TinySiteMap` by providing a configuration object.

```javascript
const config = {
  baseUrl: 'https://www.yourwebsite.com',
  type: 'normal', // Use 'index' if you are creating a sitemap index
  lastmodDateOnly: true // Formats dates as YYYY-MM-DD
};

const sitemap = new TinySiteMap(config);
```

---

## 📝 Managing Entries

An "entry" is a single URL or a single sitemap file within an index.

### Adding a Standard URL Entry
You can add URLs using absolute paths or relative paths. The class will automatically convert relative paths into absolute URLs based on your `baseUrl`.

```javascript
sitemap.addEntry({
  loc: '/products/awesome-item', // Will become https://www.yourwebsite.com/products/awesome-item
  lastmod: '2023-10-27T10:00:00Z',
  changefreq: 'daily',
  priority: 0.8
});
```

### Adding Custom XML Tags
If you need to include non-standard XML tags (for specific SEO requirements), use the `customTags` property.

```javascript
sitemap.addEntry({
  loc: '/special-page',
  customTags: {
    'example:data': 'some-value'
  }
});
```

### CRUD Operations (Create, Read, Update, Delete)
*   **Update:** `sitemap.updateEntry(index, { priority: 0.9 });`
*   **Move:** `sitemap.moveEntry(fromIndex, toIndex);`
*   **Remove:** `sitemap.removeEntry(index);`
*   **Clear All:** `sitemap.clearAll();`

---

## 🧬 Advanced: Namespaces & Strategies

XML namespaces allow you to include different types of data (like images or video) within your sitemap.

### 1. Manual Namespaces
You can manually add namespaces if you have specific requirements.

```javascript
sitemap.addNamespace({
  type: 'xmlns',
  prefix: 'myprefix',
  uri: 'http://www.example.com/schema'
});
```

### 2. Namespace Strategies (The Easy Way)
Instead of manually adding every namespace, you can use built-in strategies:

*   **`TinySiteMap.simpleStrategy()`**: Only includes the standard ROOT namespace.
*   **`TinySiteMap.kaliStrategy()`**: Includes standard Google namespaces (news, image, video, xhtml).
*   **`TinySiteMap.protocolStrategy(instance)`**: A comprehensive strategy that handles `xsi:schemaLocation` and custom tags automatically.

**Example using a strategy:**
```javascript
const sitemap = new TinySiteMap({
  baseUrl: 'https://www.example.com',
  namespaceStrategy: TinySiteMap.kaliStrategy
});
```

---

## 📤 Generating the Output

Once you have finished adding your entries, you can generate the final XML string.

```javascript
const xmlOutput = sitemap.generateXml();
console.log(xmlOutput);
```

### 🎨 Adding Styles (XSL)
To make the XML file readable in a web browser, you can provide an XSL stylesheet URL in the config:

```javascript
const sitemap = new TinySiteMap({
  baseUrl: 'https://www.example.com',
  xslUrl: '/styles/sitemap.xsl'
});
```

---

## ⚠️ Error Handling

The class uses strict validation. If you provide invalid data, it will throw specific errors:
*   `TypeError`: If data types are incorrect (e.g., passing a string where a number is expected).
*   `RangeError`: If a value is out of bounds (e.g., a `priority` higher than `1.0` or more than `50,000` entries).
*   `Error`: If security checks fail (e.g., a URL belongs to a different domain).
