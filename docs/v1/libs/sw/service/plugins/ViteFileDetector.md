# 🚀 Vite File Detector Plugin

A specialized plugin for the `TinyServiceWorkerEngine` designed to identify and bypass Vite-specific network requests. This ensures that during development, Vite's internal processes (like Hot Module Replacement) are not interrupted by the Service Worker.

## 📝 Overview

When developing with **Vite**, the development server uses specific URL patterns to handle module loading and Hot Module Replacement (HMR). If a Service Worker attempts to intercept and validate these requests, it can break the development experience.

The `ViteFileDetectorPlugin` solves this by listening to all fetch events and telling the engine to "bypass" any URL that matches Vite's internal patterns.

---

## 🛠 Configuration

When you install the plugin, you can pass an optional configuration object. If no options are provided, it uses the `DEFAULT_OPTIONS`.

### `ViteFileDetectorOptions`

| Property | Type | Description | Default Value |
| :--- | :--- | :--- | :--- |
| `paths` | `(string \| RegExp)[]` | An array of strings or Regular Expressions. Any URL matching these patterns will be bypassed. | `['/@vite', '/@react', '/node_modules']` |
| `srcPath` | `string` | The base path for your source directory. | `'/src'` |
| `manifestPath` | `string` | The path to your application's manifest file. | `'/manifest.json'` |
| `maxCachedUrls` | `number` | Maximum amount of detected URLs kept in the persistent cache. When the limit is reached, the oldest entries are evicted before the new one is written. Use `Infinity` to keep every URL forever. | `1000` |

> **Note:** `srcPath` and `manifestPath` are appended to `paths` internally. The final matching list is always `[...paths, srcPath, manifestPath]`.

### Validation

The configuration is validated while the plugin is installed. Invalid values throw immediately instead of failing silently during a fetch event.

| Thrown Error | Condition |
| :--- | :--- |
| `TypeError` | The plugin was installed without a valid `TinyServiceWorkerEngine` instance. |
| `TypeError` | `paths` is not an array. |
| `TypeError` | An item inside `paths` (or `srcPath` / `manifestPath`) is neither a `string` nor a `RegExp`. |
| `TypeError` | `maxCachedUrls` is not a number. |
| `RangeError` | `maxCachedUrls` is not a positive integer and is not `Infinity`. |

### 🗃️ Persistent Cache

Every detected URL is stored in a `TinySetMapDatabase` set named `logged-urls`. This keeps the "File detected" log at one entry per URL, even after the Service Worker restarts.

*   **Deduplication:** a URL that is already cached is skipped and produces no new log.
*   **Eviction:** before a new URL is written, the oldest entries are removed until the cache has room for it, so the cache never holds more than `maxCachedUrls` entries.
*   **Serialized writes:** all cache mutations run through an internal promise queue. This prevents two detections that resolve in the same tick from reading the same `size` and pushing the cache above `maxCachedUrls`.
*   **Isolation:** the whole detector, including the cache, only runs in development mode (`import.meta.env.DEV`).

---

## 🚀 Daily Usage

### 1. Installation

To use the plugin, you must have an active instance of `TinyServiceWorkerEngine`. You install the plugin using the engine's installation method.

```javascript
import TinyServiceWorkerEngine from 'tiny-essentials/libs/sw/service/TinyServiceWorkerEngine';
import ViteFileDetectorPlugin from 'tiny-essentials/libs/sw/service/plugins/ViteFileDetectorPlugin';

// 1. Initialize your engine
const engine = new TinyServiceWorkerEngine();

// 2. Install the Vite Detector Plugin
// You can pass custom paths if your project structure is non-standard
engine.installPlugin(ViteFileDetectorPlugin, {
  paths: ['/@vite', '/@my-custom-tool'],
  srcPath: '/app/src',
  manifestPath: '/public/manifest.json',
  maxCachedUrls: 500
});
```

### 2. Typical Workflow

1.  **Development Mode:** The plugin only activates if `import.meta.env.DEV` is true. This means it will **not** add overhead to your production build.
2.  **Request Interception:** When the browser requests a file (e.g., `/@vite/client`), the plugin checks the URL against your `paths`.
3.  **Bypass Execution:** If a match is found, the plugin instructs the engine to:
    *   Stop further checks (`continueCheck = false`).
    *   Skip validation (`needValidation = false`).
    *   Return a successful status (`code = 200`).
4.  **Cache Lookup:** The URL is compared against the persistent cache. If it was already detected before, the workflow stops here.
5.  **Cache Write:** The oldest entries are evicted when the limit is reached, the URL is stored, and the message `File detected: <url>` is logged with the `warn` level. Failures inside this step are logged with the `error` level and never break the response.

---

## ⚠️ Important Notes

*   **Environment Specific:** This plugin is strictly for **Development environments**. It uses `import.meta.env.DEV` to ensure production performance is not affected.
*   **Path Matching:** It is recommended to use specific paths to avoid accidentally bypassing important application files.
*   **Cache Size:** `maxCachedUrls` only controls how many URLs are remembered for logging. A low value means the same URL can be logged again after it is evicted. Use `Infinity` if the log must never repeat.
*   **Log Levels:** Successful detections use the `warn` level, while cache failures use the `error` level. Filter by these levels if the console becomes noisy.