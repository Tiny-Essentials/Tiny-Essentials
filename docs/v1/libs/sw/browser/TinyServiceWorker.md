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
import TinyServiceWorker from 'tiny-essentials/libs/sw/browser/TinyServiceWorker';
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

#### **C. Receiving API Requests (Service Worker ➡️ Main Thread)**
Unlike standard events, an API request is a command that expects a response. The Service Worker sends a request, and `TinyServiceWorker` processes it in the Main Thread and automatically sends the result back.

**Implementation:**
Use `onApi` to register a handler. The callback must return the data you wish to send back to the Service Worker.

```javascript
// 1. Register a handler for a specific request type
swManager.onApi('FETCH_USER_SETTINGS', async ({ data, correlationId }) => {
  // 'data' contains the payload sent by the Service Worker
  // 'correlationId' is the unique identifier for this request
  
  console.log(`Received request for: ${data.userId}`);

  // You can return a plain object or a Promise
  const settings = await database.getSettings(data.userId);
  return settings; 
});

// 2. Remove the handler when it is no longer needed
swManager.offApi('FETCH_USER_SETTINGS');
```

### 📱 PWA Lifecycle & Installation
The manager handles the "tricky" parts of being a Progressive Web App.

* **Installation Prompt:** You can trigger the native browser installation UI by calling `promptInstallation()`. *Note: This must be triggered by a user gesture (like a button click) and only works if the `beforeinstallprompt` event has fired.*
* **Display Mode:** Automatically detects if your app is running in `standalone` (installed), `twa` (Android Trusted Web Activity), or a standard `browser` tab.

#### **Background Sync**
Schedule tasks to run once the user has a stable internet connection.

```javascript
// Register a sync tag to trigger the 'sync' event in the Service Worker
await swManager.registerSync('sync-data-update');
```

#### **Notification Permission**
Request the browser's notification permission. The method is idempotent: it returns the cached status without prompting again if the user has already decided.

```javascript
const permission = await swManager.requestNotificationPermission();

if (permission === 'granted') {
  console.log('Notifications are enabled.');
}

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
| `sw:NotificationPermissionChanged` | `{ permission: NotificationPermission }` | Fired after `requestNotificationPermission()` resolves with the user's decision. |
| `sw:RegistrationFailed` | `Error` | Fired when registration fails while a `waitForReady()` call is pending. |
| `sw:PushReceived` | `{ data: any, event: MessageEvent }` | Fired when a push event is received. If in 'browser' mode and `autoNotifyPush` is enabled, a native browser notification is automatically displayed. |
| `{CUSTOM EVENT}` | `{ event: Event, data: Record<string, any> }` | Fired when a message from `sw.js` is sent. |

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
| `useLogColors` | `boolean` | Enables color support in the console logs. | No |

### Methods

| Method | Return | Description |
| :--- | :--- | :--- |
| `register(options)` | `Promise<void>` | Attempts to register the Service Worker. |
| `unregister()` | `Promise<boolean>` | Unregisters the worker and destroys the instance. |
| `waitForReady()` | `Promise<void>` | Resolves when the Service Worker is registered, active, and controlling the page. |
| `promptInstallation()` | `Promise<void>` | Triggers the native browser installation prompt. |
| `requestNotificationPermission()` | `Promise<'granted' \| 'denied' \| 'default'>` | Requests notification permission from the user. |
| `postMessage(payload)` | `void` | Sends a structured payload to the worker. |
| `emit(type, data)` | `boolean` | Sends a simplified message to the worker. |
| `emitApi(type, data, timeout)` | `Promise<any>` | Sends a message and returns a Promise that resolves with the response from the Service Worker. |
| `onApi(type, callback)` | `void` | Registers a handler to respond to specific API requests sent from the Service Worker. |
| `offApi(type)` | `boolean` | Removes a previously registered API handler. |
| `addEventListener(cb)` | `void` | Listens for messages coming **from** the worker. |
| `removeEventListener(cb)` | `boolean` | Removes a previously added listener. |
| `registerSync(tag)` | `Promise<void>` | Registers a sync tag to trigger the 'sync' event in the Service Worker. |
| `destroy()` | `void` | Performs full cleanup of all resources. |

### Static Methods

| Method | Return | Description |
| :--- | :--- | :--- |
| `TinyServiceWorker.waitForReady()` | `Promise<ServiceWorkerRegistration>` | Resolves with the active registration once the Service Worker is ready. |
| `TinyServiceWorker.postMessage(message, transfer?)` | `void` | Sends a raw message to the active Service Worker controller. |

```javascript
// Wait for the worker before sending a message
await TinyServiceWorker.waitForReady();

// Send a raw message with an optional transferable list
TinyServiceWorker.postMessage({ type: 'PING' }, []);
```

### Properties (Getters)
* `isReady`: `boolean` - Returns `true` if registration was successful.
* `isFailed`: `boolean` - Returns `true` if registration encountered an error.
* `isDestroyed`: `boolean` - Returns `true` if the instance has been destroyed.
* `isSwAvailable`: `boolean` - Returns `true` if the Service Worker API is supported **and** an active controller exists.
* `displayMode`: `'twa' | 'standalone' | 'browser'` - The current UI mode.
* `id`: `string` - The instance ID.
* `swUrl`: `string \| URL` - The URL of the service worker file.
* `version`: `string` - The current application version.
* `registration`: `ServiceWorkerRegistration` - The current registration object.
* `eventListeners`: `EventListener[]` - An array of all registered event listeners.
* `autoNotifyPush`: `boolean` - Indicates if the browser should automatically show a notification when a push is received in browser mode.

---

## 🧩 Architecture Note: The Dual-Module System

The `TinyServiceWorker` module is only one half of a complete Progressive Web App (PWA) solution. To function correctly, it must be paired with the **`TinyServiceWorkerEngine`**.

### 🏗️ How it works
The system is architected using a **Client-Server model** within the browser:

1.  **`TinyServiceWorker` (This Module):** Runs in the **Main Thread** (your web page). It acts as the interface, allowing your application code to send messages and listen for events.
2.  **`TinyServiceWorkerEngine` (The Core):** Runs in the **Service Worker context** (the background). It performs the heavy lifting: intercepting network requests, managing the HTTP router, and processing background logic.

### 🚀 Complete your implementation
To set up the background engine and enable full feature sets like **Fetch Interception** and **Automatic Error Routing**, you must implement the engine in your Service Worker file.

**Learn how to configure the engine here:**
👉 [TinyServiceWorkerEngine](./pwa/TinyServiceWorkerEngine.md)

> **Pro Tip:** The true power of this system is realized when both modules are active, enabling real-time, bidirectional communication between your UI and the background process via the **Messaging System**.

---

## 🧩 TinyPlugin Ecosystem Integration

`TinyServiceWorker` is not a standalone utility; it is a first-class citizen of the **[TinyPlugin](../plugin/TinyPlugin.md)** architecture.
