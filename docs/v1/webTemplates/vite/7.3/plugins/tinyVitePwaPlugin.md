# 🚀 Tiny Vite PWA: Developer Documentation

Welcome to the official guide for **`tiny-vite-pwa`**! This plugin is designed to make Progressive Web App integration seamless within a Vite-based project. It handles the "heavy lifting" of PWA requirements so you can focus on building your application.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Configuration Guide](#configuration-guide)
4. [Step-by-Step Implementation](#step-by-step-implementation)
5. [Developer Experience (Dev vs. Prod)](#developer-experience-dev-vs-prod)
6. [TypeScript Integration](#typescript-integration)

---

## 🌟 Overview
`tiny-vite-pwa` is a lightweight Vite plugin that automates three critical PWA pillars:
1.  **Manifest Management:** Automatically serves and bundles your `manifest.json`.
2.  **Service Worker Lifecycle:** Bundles your Service Worker (SW) for production and provides Hot Module Replacement (HMR) during development.
3.  **Automated Injection:** Injects the necessary `<link>` and `<script>` tags into your `index.html` automatically.

---

## ✨ Key Features

*   📦 **Automatic Bundling:** Uses Vite's internal build engine to bundle your Service Worker as an IIFE (Immediately Invoked Function Expression), ensuring compatibility.
*   ⚡ **Hot Module Replacement (HMR):** When you save changes to your Service Worker file, the plugin detects it and notifies the frontend via a custom event.
*   🌐 **Global Manifest Access:** Optionally injects your manifest object into the global scope via `define`, making it accessible as `window.__TINY_PWA_MANIFEST__`.
*   🛡️ **Cache Busting:** Automatically appends version timestamps (`?v=...`) to your manifest and SW in production to prevent stale files.
*   🎨 **Clear Feedback:** Provides beautiful, color-coded terminal logs to track the plugin's status.

---

## ⚙️ Configuration Guide

When using the plugin, you will pass an options object to `tinyVitePwaPlugin()`. Below are the available properties:

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `manifest` | `Object` | **Required** | The complete Web App Manifest object. |
| `manifestPath` | `string` | **Required** | The URL path where the manifest should be served (e.g., `'/manifest.json'`). |
| `srcDir` | `string` | **Required** | The directory where your Service Worker source file is located. |
| `filename` | `string` | **Required** | The name of your Service Worker file (e.g., `'sw.js'`). |
| `injectRegister` | `boolean` | `true` | If `true`, the plugin injects the SW registration script into your `<head>`. |
| `injectManifestToGlobal` | `boolean` | `true` | If `true`, the manifest is available globally via `window.__TINY_PWA_MANIFEST__`. |
| `swRegistrationOptions` | `Object` | `undefined` | Standard `RegistrationOptions` passed to `navigator.serviceWorker.register`. |

---

## 🛠️ Step-by-Step Implementation

Follow these steps to integrate the plugin into your project.

### 1. Prepare your Manifest
Create your manifest object. You can keep this in a separate file or define it directly in your config.

### 2. Create your Service Worker
Place your Service Worker file (e.g., `src/sw.js`) in your source directory.

### 3. Configure Vite
Update your `vite.config.js` as follows:

```javascript
import { defineConfig } from 'vite';
import tinyVitePwaPlugin from 'tiny-essentials/webTemplates/vite/7.3/plugins/tinyVitePwaPlugin';

export default defineConfig({
  plugins: [
    tinyVitePwaPlugin({
      // 1. The Manifest Object
      manifest: {
        name: 'My Awesome App',
        short_name: 'App',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#000000',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      // 2. Paths and Filenames
      manifestPath: '/manifest.json',
      srcDir: 'src',
      filename: 'sw.js',
      // 3. Optional: Registration settings
      swRegistrationOptions: {
        scope: '/'
      }
    })
  ]
});
```

---

## 🔄 Developer Experience (Dev vs. Prod)

The plugin behaves differently depending on whether you are running a development server or building for production.

### 🛠️ In Development (`npm run dev`)
*   **Manifest:** Served dynamically via a middleware.
*   **Service Worker:** Served via Vite's transformer, allowing you to use ES6 imports inside your SW.
*   **HMR:** If you modify your SW file, the plugin sends a `pwa:sw-updated` event to the browser.
*   **Console:** You will see `[tiny-vite-pwa] [INFO]` logs in your terminal.

### 🚀 In Production (`npm run build`)
*   **Manifest:** Emitted as a static `.json` file in your `dist` folder.
*   **Service Worker:** Bundled into a single, optimized IIFE file in your `dist` folder.
*   **Cache Busting:** The plugin adds `?v=[timestamp]` to the URLs in the HTML to ensure users always get the latest version.

---

## 📘 TypeScript Integration

If you are using TypeScript, you need to tell the compiler that `__TINY_PWA_MANIFEST__` exists on the `window` object. 

Add this to your `env.d.ts` file:

```typescript
declare global {
  interface Window {
    /** 
     * The Web App Manifest object injected by tiny-vite-pwa 
     */
    __TINY_PWA_MANIFEST__: Record<string, any>;
  }
}

export {};
```
