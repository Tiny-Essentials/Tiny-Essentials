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
 * @param {MonitorOptions} [options={}] - Configuration options.
 * @param {number} [options.resourceLimit=1000] - Maximum number of resource metrics to store. Use -1 for infinite.
 * @param {SystemValue[]} [options.systems] - List of systems to enable. If empty, all are enabled.
 * @param {number} [options.memoryIntervalMs=100] - Interval in milliseconds for memory polling.
 */
const monitor = new TinyBrowserMonitor(options);
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

### 📡 Method 1: The Event-Driven Approach (Recommended)
Since `TinyBrowserMonitor` extends `EventEmitter`, you can listen for specific events.

#### Global Updates
Listen for any change in the monitored systems. The payload contains a comprehensive `NetworkEvent` report.
```javascript
monitor.on('NetworkUpdated', (data) => {
  console.log('📊 Full Report:', data);
  if (data.event) console.log('Triggered by event:', data.event.type);
});
```

#### Specific System Events
You can listen to granular updates to optimize performance:

* **Connectivity:** `monitor.on('ConnectivityUpdated', (status) => ...)`
* **Battery:** `monitor.on('BatteryUpdated', (battery) => ...)`
* **Memory:** `monitor.on('MemoryUsage', (memory) => ...)`
* **FPS:** `monitor.on('FPS', (fps) => ...)`
* **Window Resize:** `monitor.on('WindowResize', (metrics) => ...)`

#### Performance & Web Vitals Events
* **Paint:** `monitor.on('PaintUpdated', (paint) => ...)`
* **Navigation:** `monitor.on('NavigationUpdated', (nav) => ...)`
* **Layout Shift:** `monitor.on('LayoutShiftUpdated', ({ layoutShift }) => ...)`
* **LCP:** `monitor.on('LcpUpdated', ({ lcp }) => ...)`
* **Long Tasks:** `monitor.on('LongTaskUpdated', ({ lcp }) => ...)` 
  > *Note: Payload contains an array of task durations under the `lcp` key.*

#### Resource Lifecycle Events
Emitted when the resource history changes (useful for tracking asset loading):
* `ResourceAdded`: Emitted when a new resource is tracked. `(oldItem, newItem)`
* `ResourceDeleted`: Emitted when an old resource is removed (FIFO). `(oldItem, newItem)`
* `ResourceEdited`: Emitted if resource data is updated. `(oldItem, newItem)`

---

### 📸 Method 2: Snapshot Access & Helpers
Check metrics at any specific moment without waiting for an event.

#### Snapshot Getters
All getters return **read-only (frozen)** objects to ensure data integrity.
```javascript
const connectivity = monitor.connectivity;
const quality = monitor.quality;
const resources = monitor.resources;
const battery = monitor.battery;
const device = monitor.device;
const performance = monitor.performance;
const memoryUsage = monitor.memoryUsage;
const windowMetrics = monitor.windowMetrics;
const screenMetrics = monitor.screenMetrics;
const fps = monitor.fps;
```

#### Utility Methods
```javascript
// Check how many systems are currently active
console.log(monitor.size); 

// Check if a specific system is enabled
if (monitor.has('battery')) { ... }

// Get human-readable memory (e.g., '1.5 GB')
const memory = monitor.getFormattedMemoryUsage('GB'); 
// Returns: { used: 1.5, total: 8, limit: 16 }
```

---

## 🧹 Cleanup & Memory Management

To prevent **memory leaks**, especially in Single Page Applications (SPAs), you **must** call the `destroy()` method when the component or page is unmounted.

```javascript
// Cleanup
monitor.destroy();

// Listen for destruction
monitor.on('Destroyed', () => console.log('Monitor cleaned up.'));
```

**What `destroy()` does:**
* ✅ Removes `online`/`offline` window listeners.
* ✅ Removes `connection` change listeners.
* ✅ Disconnects all `PerformanceObserver` instances.
* ✅ Clears all internal event emitters.
* ✅ Sets `isDestroyed` to `true`.

---

## ⚠️ Important Notes

* **Immutability:** All returned reports are read-only. Attempting to change properties directly will fail.
* **Resource Limit:** If a `resourceLimit` is set, the monitor uses FIFO (First-In, First-Out) logic to remove the oldest entries.
