# 🌐 TinyBrowserMonitor Documentation

Welcome to the **TinyBrowserMonitor** documentation! 🚀 This lightweight, high-performance utility is designed to give developers real-time insights into a user's network environment and device performance.

Whether you are building a progressive web app (PWA) that needs to react to offline status, a data-heavy dashboard that needs to adjust quality based on bandwidth, or a high-performance application requiring deep web vitals tracking, `TinyBrowserMonitor` has you covered.

---

## 🌟 Overview

`TinyBrowserMonitor` is an event-driven monitor that tracks several critical pillars of environment health:
1.  **Connectivity Status:** Are we online or offline? 📶
2.  **Connection Quality:** Bandwidth, Latency, Connection Type, and API availability. ⚡
3.  **Battery Status:** Charge level and charging state. 🔋
4.  **Device Metrics:** Hardware constraints like device memory. 💻
5.  **Resource Performance:** Loading duration of assets (images, scripts, etc.). ⏱️
6.  **Web Vitals & Performance:** Deep insights into Paint timing, Navigation, Layout Shift (CLS), LCP, and Long Tasks. 🚀

---

## 📦 Getting Started

### Installation & Import
Since this module uses ES6 syntax, ensure your environment supports `import`.

```javascript
import TinyBrowserMonitor from 'tiny-essentials/libs/tools/TinyBrowserMonitor';
```

### Initialization
```javascript
/**
 * @param {NetworkCallback} [callback] - Optional callback function triggered on every update.
 * @param {MonitorOptions} [options={}] - Configuration options.
 * @param {number} [options.resourceLimit=1000] - Max number of resource metrics to store. Use -1 for infinite.
 * @param {string[]} [options.systems] - List of systems to enable (e.g., ['connectivity', 'battery']). If empty, all are enabled.
 */
const monitor = new TinyBrowserMonitor(callback, options);
```

---

## 🛠️ Core Features

### 1. Real-time Connectivity Tracking
Automatically detects when a user loses or regains internet access.

### 2. Network Quality Metrics
Leverages the **Network Information API** to provide:
* `downlink`: Effective bandwidth in Mbps.
* `rtt`: Estimated round-trip time (latency).
* `effectiveType`: The connection type (e.g., '4g', '3g').
* `saveData`: Detects if the user has "Data Saver" mode enabled.
* `enabled`: Indicates if the Network Information API is supported.

### 3. Battery & Device Monitoring
* **Battery:** Tracks `level`, `charging` state, and time to full/empty.
* **Device:** Provides approximate `memory` (GB) via the Device Memory API.

### 4. Comprehensive Performance & Web Vitals
Uses the `PerformanceObserver` API to track:
* **Resource Loading:** Detailed metrics for every fetched asset.
* **Paint Timing:** `first-paint` and `first-contentful-paint`.
* **Navigation Timing:** `ttfb`, `domContentLoaded`, and `loadEvent`.
* **Core Web Vitals:** `layoutShift` (CLS) and `lcp` (Largest Contentful Paint).
* **Responsiveness:** Tracks `longTasks` to monitor main thread blockage.

---

## 📖 Usage Guide

You can interact with the monitor in four different ways depending on your architectural needs.

### 🚀 Method 1: The Callback Approach
Best for simple implementations where you want a function to trigger whenever *anything* changes.

```javascript
const monitor = new TinyBrowserMonitor((data) => {
  // Note: data contains connectivity, quality, resources, and event directly
  if (!data.connectivity.isOnline) {
    console.warn('⚠️ You are currently offline!');
  }
});
```

### 📡 Method 2: The Event-Driven Approach (Recommended)
Since `TinyBrowserMonitor` extends `EventEmitter`, you can listen for specific events.

#### Network Updates
Listen for any change in any monitored system.
```javascript
const monitor = new TinyBrowserMonitor();

// Listen for network changes
monitor.on('NetworkUpdated', ({ connectivity, quality, resources, event }) => {
  console.log('📊 Current Connectivity:', connectivity.isOnline);
  console.log('⚡ Current Quality:', quality.downlink, 'Mbps');
  if (event) console.log('Triggered by event:', event.type);
});
```

#### Resource-Specific Events
The monitor emits specific events when the resource list changes:
* `ResourceAdded`: Emitted when a new resource is tracked.
* `ResourceDeleted`: Emitted when an old resource is removed (due to `resourceLimit`).
* `ResourceEdited`: Emitted if resource data is updated.

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
const monitor = new TinyBrowserMonitor();

// ... later in your code ...
const quality = monitor.quality;
console.log(`Current Bandwidth: ${quality.downlink} Mbps`);
```

---

## 🧹 Cleanup & Memory Management

To prevent **memory leaks**, especially in Single Page Applications (SPAs) like React, Vue, or Angular, you **must** call the `destroy()` method when the component or page is unmounted.

```javascript
// When the user leaves the page or the component unmounts:
monitor.destroy();
```

**What `destroy()` does:**
* ✅ Removes `online`/`offline` window listeners.
* ✅ Removes `connection` change listeners.
* ✅ Disconnects all `PerformanceObserver` instances.
* ✅ Clears all internal event emitters.
* ✅ Sets `isDestroyed` to `true`.

---

## ⚠️ Important Notes

*   **Immutability:** All returned reports are read-only. Attempting to change `monitor.connectivity.isOnline = false` will fail.
*   **Resource Limit:** If a `resourceLimit` is set, the monitor will automatically remove the oldest entries to make room for new ones once the limit is reached (FIFO).