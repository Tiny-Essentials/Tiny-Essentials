# 🚀 TinyServiceWorker Documentation

Welcome to the official documentation for `TinyServiceWorker`. This module is a professional-grade utility designed to simplify the complexities of **Service Worker registration**, **PWA (Progressive Web App) lifecycle management**, and **bidirectional messaging**.

Instead of dealing with the verbose and often confusing native Service Worker API, `TinyServiceWorker` provides a clean, event-driven interface that handles versioning and memory management automatically.

---

## 📋 Table of Contents
1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Core Features](#core-features)
    - [Registration & Automatic Versioning](#registration--automatic-versioning)
    - [Bidirectional Messaging](#bidirectional-messaging)
    - [PWA Lifecycle & Installation](#pwa-lifecycle--installation)
4. [Event Reference](#event-reference)
    - [Internal Lifecycle Events](#internal-lifecycle-events)
    - [Custom Worker Messages](#custom-worker-messages)
5. [Memory Management](#memory-management)
6. [API Reference](#api-reference)

---

## 🔍 Overview

`TinyServiceWorker` acts as a bridge between your main application thread and the Service Worker. It is built upon `TinyDebugger` to provide excellent debugging capabilities and ensures that your application stays up-to-date without requiring manual user intervention for every small change.

**Key Benefits:**
* ✅ **Version Control:** Automatically detects when a new version of your app is available.
* ✅ **PWA Ready:** Built-in support for installation prompts and display mode detection.
* ✅ **Memory Safe:** Strict cleanup protocols to prevent memory leaks in long-running applications.
* ✅ **Type Safe:** Implements rigorous runtime validation to catch errors early.

---

## 🚀 Getting Started

### 1. Installation & Import
Ensure that `TinyDebugger` and your utility functions are correctly mapped in your project structure.

```javascript
import TinyServiceWorker from 'tiny-essentials/libs/router/TinyServiceWorker';
```

### 2. Initialization
To use the service, create a new instance by providing a unique ID, the path to your worker file, and the current application version.

```javascript
const swManager = new TinyServiceWorker({
  id: 'app_main_worker',
  swUrl: '/sw.js',
  version: '1.0.2', // Increment this when you deploy updates
  debugMode: true,
  useLogColors: true
});
```

### 3. Activation
The service worker will not start until you explicitly call the `.register()` method.

```javascript
await swManager.register();
```

---

## ✨ Core Features

### 🔄 Registration & Automatic Versioning
One of the most powerful features is the **Version Mismatch Detection**. 

**How it works:**
1. The manager compares the `version` provided in the constructor with the version stored in `localStorage`.
2. If they differ, it emits the `sw:VersionUpdateAvailable` event.
3. It signals the current Service Worker to begin preparing for an update via `sw:PrepareUpdate`.
4. It registers the new worker with a cache-busting timestamp if `debugMode` is enabled.

### 📩 Bidirectional Messaging
Communicating with a Service Worker can be tricky. `TinyServiceWorker` makes it feel like standard event emitting.

#### **A. Sending messages (Main Thread ➡️ Service Worker)**
You can send data using a `type` and a `data` object.

```javascript
// Using postMessage (Full payload)
swManager.postMessage({
  type: 'SYNC_DATA',
  data: { userId: 123, status: 'active' }
});

// Using "emit" (Simplified)
swManager.emit('LOG_EVENT', { message: 'User clicked button' });
```

#### **B. Receiving messages (Service Worker ➡️ Main Thread)**
Listen for messages sent from the worker using the `addEventListener` method.

```javascript
// Using addEventListener (Full payload)
swManager.addEventListener((event) => {
  console.log('Message received from SW:', event.data.type, event.data.data);
});

// Using "on" (Simplified)
swManager.on('PONG', ({ data, event }) => console.log(data));
```

### 📱 PWA Lifecycle & Installation
The manager handles the "tricky" parts of being a Progressive Web App.

* **Installation Prompt:** You can trigger the native browser installation UI by calling `promptInstallation()`. *Note: This must be triggered by a user gesture (like a button click) and only works if the `beforeinstallprompt` event has fired.*
* **Display Mode:** Automatically detects if your app is running in `standalone` (installed), `twa` (Android Trusted Web Activity), or a standard `browser` tab.

---

## 📡 Event Reference

The `TinyServiceWorker` instance uses a unified `addEventListener` method. This method captures both **Internal Lifecycle Events** (emitted by the class itself) and **Custom Messages** forwarded from the Service Worker.

### 🛠 Internal Lifecycle Events
These events are emitted by the `TinyServiceWorker` class to inform your application about its internal state changes.

| Event Name | Payload | Description |
| :--- | :--- | :--- |
| `sw:DisplayModeChanged` | `{ displayMode: string }` | Fired when the app switches between `browser`, `standalone`, or `twa`. |
| `sw:BeforeInstallPrompt` | `{ event: BeforeInstallPromptEvent }` | Fired when the browser is ready to show the installation prompt. |
| `sw:AppInstalled` | `void` | Fired when the PWA is successfully installed on the device. |
| `sw:VersionUpdateAvailable` | `void` | Fired when a version mismatch is detected in `localStorage`. |
| `sw:PrepareUpdate` | `void` | Fired to signal the Service Worker to begin downloading new assets. |
| `sw:NewVersionReady` | `{ event: Event }` | Fired when the new Service Worker successfully takes control of the page. |
| `sw:NoSwControllerWarn` | `void` | Fired when a message is attempted but no active Service Worker controller exists. |
| `{CUSTOM EVENT}` | `{ event: Event, data: Record<string, any>  }` | Fired when a message from `sw.js`is sent. |

### 📨 Custom Worker Messages
When your Service Worker sends a message using `postMessage`, the class intercepts it and re-emits it as a standard event.

**Service Worker side:**
```javascript
// Inside sw.js
self.postMessage({ type: 'DATA_UPDATED', data: { items: [1, 2, 3] } });
```

**Main Thread side:**
```javascript
swManager.addEventListener((event) => {
  const type = event.data.type;
  const data = event.data.data;
  if (type === 'DATA_UPDATED') {
    console.log('New items:', data.items);
  }
});
```

---

## 🧹 Memory Management

To prevent memory leaks—especially in Single Page Applications (SPAs)—always clean up your instance when it is no longer needed (e.g., when the user logs out or the app component unmounts).

```javascript
// This will:
// 1. Unregister the Service Worker.
// 2. Remove all Window and Service Worker event listeners.
// 3. Clear all internal references.
await swManager.unregister(); 
// OR simply:
swManager.destroy();
```

---

## 📖 API Reference

### `constructor(options)`
| Property | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `id` | `string` | Unique identifier for the instance. | Yes |
| `swUrl` | `string \| URL` | Path to the `.js` service worker file. | Yes |
| `version` | `string` | Current application version string. | Yes |
| `logger` | `Console` | Custom logger (defaults to `console`). | No |
| `debugMode` | `boolean` | Enables extra logging and cache busting. | No |

### Methods

| Method | Return | Description |
| :--- | :--- | :--- |
| `register(options)` | `Promise<void>` | Attempts to register the Service Worker. |
| `unregister()` | `Promise<boolean>` | Unregisters the worker and destroys the instance. |
| `promptInstallation()` | `Promise<void>` | Triggers the native browser installation prompt. |
| `postMessage(payload)` | `void` | Sends a structured payload to the worker. |
| `emit(type, data)` | `boolean` | Sends a simplified message to the worker. |
| `addEventListener(cb)` | `void` | Listens for messages coming **from** the worker. |
| `removeEventListener(cb)` | `boolean` | Removes a previously added listener. |
| `destroy()` | `void` | Performs full cleanup of all resources. |

### Properties (Getters)
* `isReady`: `boolean` - Returns `true` if registration was successful.
* `isFailed`: `boolean` - Returns `true` if registration encountered an error.
* `displayMode`: `'twa' | 'standalone' | 'browser'` - The current UI mode.
* `id`: `string` - The instance ID.
