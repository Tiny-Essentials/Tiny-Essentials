# 🌐 TinyNetworkMonitor Documentation

Welcome to the **TinyNetworkMonitor** documentation! 🚀 This lightweight, high-performance utility is designed to give developers real-time insights into a user's network environment. 

Whether you are building a progressive web app (PWA) that needs to react to offline status, or a data-heavy dashboard that needs to adjust quality based on bandwidth, `TinyNetworkMonitor` has you covered.

---

## 🌟 Overview

`TinyNetworkMonitor` is an event-driven monitor that tracks three critical pillars of network health:
1.  **Connectivity Status:** Are we online or offline? 📶
2.  **Connection Quality:** How fast is the connection? (Bandwidth, Latency, Connection Type, and API availability). ⚡
3.  **Resource Performance:** How long are assets (images, scripts, etc.) taking to load? ⏱️

---

## 📦 Getting Started

### Installation & Import
Since this module uses ES6 syntax, ensure your environment supports `import`.

```javascript
import TinyNetworkMonitor from 'tiny-essentials/libs/tools/TinyNetworkMonitor';
```

### Initialization
```javascript
/**
 * @param {NetworkCallback} [callback] - Optional callback function triggered on every update.
 * @param {number} [resourceLimit=1000] - Max number of resource metrics to store. Use -1 for infinite.
 */
const monitor = new TinyNetworkMonitor(callback, resourceLimit);
```

---

## 🛠️ Core Features

### 1. Real-time Connectivity Tracking
Automatically detects when a user loses or regains internet access.

### 2. Network Quality Metrics
Leverages the **Network Information API** to provide:
*   `downlink`: Effective bandwidth in Mbps.
*   `rtt`: Estimated round-trip time (latency).
*   `effectiveType`: The connection type (e.g., '4g', '3g').
*   `saveData`: Detects if the user has "Data Saver" mode enabled.
*   `enabled`: Indicates if the Network Information API is supported by the browser.

### 3. Resource Monitoring
Uses the `PerformanceObserver` API to track the loading duration of every resource fetched by the browser. It maintains a history of these metrics up to the defined `resourceLimit` using a FIFO (First-In, First-Out) approach.

---

## 📖 Usage Guide

You can interact with the monitor in four different ways depending on your architectural needs.

### 🚀 Method 1: The Callback Approach
Best for simple implementations where you just want a function to trigger whenever *anything* changes.

```javascript
const monitor = new TinyNetworkMonitor((data) => {
  // Note: data contains connectivity, quality, resources, and event directly
  if (!data.connectivity.isOnline) {
    console.warn('⚠️ You are currently offline!');
  }
});
```

### 📡 Method 2: The Event-Driven Approach (Recommended)
Since `TinyNetworkMonitor` extends `EventEmitter`, you can listen for specific events. This is the cleanest way to separate concerns in large applications.

#### Network Updates
Listen for any change in connectivity, quality, or resources.
```javascript
const monitor = new TinyNetworkMonitor();

// Listen for network changes
monitor.on('NetworkUpdate', ({ connectivity, quality, resources, event }) => {
  console.log('📊 Current Connectivity:', connectivity.isOnline);
  console.log('⚡ Current Quality:', quality.downlink, 'Mbps');
  if (event) console.log('Triggered by event:', event.type);
});
```

#### Resource-Specific Events
The monitor emits specific events when the resource list changes:
*   `ResourceAdded`: Emitted when a new resource is tracked.
*   `ResourceDeleted`: Emitted when an old resource is removed (due to `resourceLimit`).
*   `ResourceEdited`: Emitted if resource data is updated.

```javascript
// Payload: (oldItem, newItem)
monitor.on('ResourceAdded', (oldItem, newItem) => {
  console.log('🆕 New resource loaded:', newItem.name);
});

monitor.on('ResourceDeleted', (oldItem, newItem) => {
  console.log('🧹 Old resource removed from history:', oldItem.name);
});
```

#### Lifecycle Events
```javascript
monitor.on('Destroyed', () => {
  console.log('🧹 Monitor has been cleaned up.');
});
```

### 📸 Method 3: Snapshot Access
If you don't need real-time updates but simply want to check the current status at a specific moment.

```javascript
const monitor = new TinyNetworkMonitor();

// ... later in your code ...
const currentStatus = monitor.report;
console.log(`Current Bandwidth: ${currentStatus.quality.downlink} Mbps`);
```

---

## 📊 Understanding the `NetworkReport`

The `report` returned by the `.report` getter is **deeply frozen**. This means you cannot accidentally modify the data provided by the monitor. 🛡️

| Property | Type | Description |
| :--- | :--- | :--- |
| `connectivity.isOnline` | `boolean` | `true` if connected, `false` if offline. |
| `quality.downlink` | `number` | Bandwidth in Mbps. |
| `quality.rtt` | `number` | Latency in milliseconds. |
| `quality.effectiveType` | `string` | Connection type (e.g., '4g', '2g'). |
| `quality.saveData` | `boolean` | `true` if user has data saving enabled. |
| `quality.enabled` | `boolean` | `true` if the Network Information API is available. |
| `resources` | `Array<Object>` | A list of recent resource loading metrics. |

**Example Report Object:**
```json
{
  "connectivity": { "isOnline": true },
  "quality": {
    "downlink": 10,
    "rtt": 50,
    "effectiveType": "4g",
    "saveData": false,
    "enabled": true
  },
  "resources": [
    { "name": "https://example.com/image.png", "duration": 120, "entryType": "resource" }
  ]
}
```

---

## 🧹 Cleanup & Memory Management

To prevent **memory leaks**, especially in Single Page Applications (SPAs) like React, Vue, or Angular, you **must** call the `destroy()` method when the component or page is unmounted.

```javascript
// When the user leaves the page or the component unmounts:
monitor.destroy();
```

**What `destroy()` does:**
*   ✅ Removes `online`/`offline` window listeners.
*   ✅ Removes `connection` change listeners.
*   ✅ Disconnects the `PerformanceObserver`.
*   ✅ Clears all internal event emitters.
*   ✅ Sets `isDestroyed` to `true`.

---

## ⚠️ Important Notes

*   **Browser Support:** The `quality` metrics rely on the `navigator.connection` API, which may not be available in all browsers (e.g., Safari). The monitor handles this gracefully by setting `enabled: false`.
*   **Immutability:** All returned reports are read-only. Attempting to change `monitor.report.connectivity.isOnline = false` will fail.
*   **Resource Limit:** If a `resourceLimit` is set, the monitor will automatically remove the oldest entries to make room for new ones once the limit is reached (FIFO).