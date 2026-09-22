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

---

## 🚀 Daily Usage

### 1. Installation

To use the plugin, you must have an active instance of `TinyServiceWorkerEngine`. You install the plugin using the engine's installation method.

```javascript
import TinyServiceWorkerEngine from 'tiny-essentials/libs/router/sw/service/TinyServiceWorkerEngine';
import ViteFileDetectorPlugin from 'tiny-essentials/libs/router/sw/service/plugins/ViteFileDetectorPlugin';

// 1. Initialize your engine
const engine = new TinyServiceWorkerEngine();

// 2. Install the Vite Detector Plugin
// You can pass custom paths if your project structure is non-standard
engine.installPlugin(ViteFileDetectorPlugin, {
  paths: ['/@vite', '/@my-custom-tool'],
  srcPath: '/app/src',
  manifestPath: '/public/manifest.json'
});
```

### 2. Typical Workflow

1.  **Development Mode:** The plugin only activates if `import.meta.env.DEV` is true. This means it will **not** add overhead to your production build.
2.  **Request Interception:** When the browser requests a file (e.g., `/@vite/client`), the plugin checks the URL against your `paths`.
3.  **Bypass Execution:** If a match is found, the plugin instructs the engine to:
    *   Stop further checks (`continueCheck = false`).
    *   Skip validation (`needValidation = false`).
    *   Return a successful status (`code = 200`).

---

## ⚠️ Important Notes

*   **Environment Specific:** This plugin is strictly for **Development environments**. It uses `import.meta.env.DEV` to ensure production performance is not affected.
*   **Path Matching:** It is recommended to use specific paths to avoid accidentally bypassing important application files.
