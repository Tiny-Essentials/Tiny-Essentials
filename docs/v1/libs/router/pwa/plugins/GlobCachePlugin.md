# 🚀 GlobCachePlugin Documentation

Welcome to the official documentation for the **GlobCachePlugin**. This plugin is designed for the `TinyServiceWorkerEngine` ecosystem. It provides an easy and efficient way to manage runtime caching by using **glob patterns** (like `**/*.js`) instead of writing complex Regular Expressions manually.

## 📝 Overview

The `GlobCachePlugin` intercepts network requests that match your specified patterns. It checks if a valid response is already stored in the `CacheStorage`.
- If a match is found in the cache, the plugin serves the cached response immediately.
- If no match is found, it fetches the resource from the network and automatically saves it to the cache for future use.

---

## ✨ Key Features

*   🔍 **Glob Pattern Matching**: Use simple patterns to include or exclude specific files.
*   🛡️ **Exclusion Rules**: Easily prevent specific files (like `sw.js` or API calls) from being cached.
*   🌐 **Origin Control**: Option to restrict caching strictly to the same origin to improve security.
*   ⚡ **Automated Caching**: Automatically handles `cache.put()` for successful `GET` requests (Status 200).
*   🛠️ **Non-Blocking**: If a caching error occurs, the plugin logs the error but allows the engine to continue operating to prevent site breakage.

---

## 📦 Configuration (Options)

When initializing the plugin, you must provide a configuration object. Below is the detailed breakdown of the `GlobCacheOptions` type.

| Property | Type | Required | Default | Description |
| :--- | :--- | :---: | :---: | :--- |
| `patterns` | `string[]` | **Yes** | N/A | An array of glob patterns to include (e.g., `['**/*.png']`). |
| `cacheName` | `string` | **Yes** | N/A | The unique name for the `CacheStorage` bucket. |
| `exclude` | `string[]` | No | `[]` | An array of glob patterns to ignore (e.g., `['**/api/**']`). |
| `sameOriginOnly` | `boolean` | No | `true` | If `true`, only requests from the same origin will be cached. |

---

## 🚀 Daily Usage Guide

### 1. Basic Implementation
To use the plugin, pass your `TinyServiceWorkerEngine` instance and the configuration object into the plugin function.

```javascript
import GlobCachePlugin from 'tiny-essentials/libs/router/pwa/plugins/GlobCachePlugin';

// Example configuration
const cacheOptions = {
  patterns: ['**/*.{js,css,png,jpg}'], // Cache scripts, styles, and images
  cacheName: 'static-assets-v1',
  exclude: ['**/vendor/**'], // Do not cache anything in the vendor folder
  sameOriginOnly: true       // Only cache files from our own domain
};

// Registering the plugin within your engine setup
engineInstance.installPlugin(GlobCachePlugin, cacheOptions);
```

### 2. Advanced Filtering Example
If you want to cache everything except for specific configuration files and ensure you are only caching assets from your own domain:

```javascript
import GlobCachePlugin from 'tiny-essentials/libs/router/pwa/plugins/GlobCachePlugin';

const advancedOptions = {
  patterns: ['**/*'], 
  exclude: ['**/config.json', '**/auth/**'],
  cacheName: 'app-cache',
  sameOriginOnly: true
};

engineInstance.installPlugin(GlobCachePlugin, advancedOptions);
```

---

## ⚠️ Technical Constraints & Logic

To ensure the stability of your application, please keep the following technical behaviors in mind:

1.  **Method Restriction**: The plugin only caches `GET` requests. It will not attempt to cache `POST`, `PUT`, or `DELETE` requests.
2.  **Status Requirement**: Only responses with a `status === 200` are stored in the cache.
3.  **Response Cloning**: The plugin uses `.clone()` when saving to the cache. This is necessary because a response body can only be read once.
4.  **Error Handling**: If `caches.open` or `cache.match` fails, an error is logged to the console: `[GlobCachePlugin] Error during cache operation...`. The request will then proceed to the network normally.

---

## 🛠 Troubleshooting

| Issue | Possible Cause | Solution |
| :--- | :--- | :--- |
| **Files not caching** | Patterns might be incorrect. | Verify your glob syntax (e.g., use `**/*` for recursive matching). |
| **TypeError on startup** | Missing `cacheName` or `patterns`. | Ensure all required properties are present in your options object. |
| **CORS Errors** | `sameOriginOnly` is `true`. | If you need to cache external assets (like Google Fonts), set `sameOriginOnly: false`. |
