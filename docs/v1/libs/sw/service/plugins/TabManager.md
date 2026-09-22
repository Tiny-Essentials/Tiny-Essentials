# 🚀 TabManager Plugin Documentation

The **TabManager Plugin** is a robust synchronization system designed for Progressive Web Apps (PWAs). It allows your application to maintain a "Single Source of Truth" regarding all open browser tabs. By leveraging a **Service Worker** as a central coordinator, it enables real-time communication, data persistence via **IndexedDB**, and advanced control over tab lifecycles.

---

## 🏗️ Architecture Overview

The system operates using a **Client-Server model** where the "Server" is the Service Worker.

1.  **The Brain (Service Worker Side):** 🧠
    *   Located in: `tiny-essentials/libs/sw/service/plugins/TabManager`
    *   **Responsibility:** Maintains the master registry of all tabs, persists data to `IndexedDB`, handles "ghost" tab reconciliation, and broadcasts updates to all connected clients.
2.  **The Controller (Client/Main Thread Side):** 🎮
    *   Located in: `tiny-essentials/libs/sw/browser/plugins/TabManager`
    *   **Responsibility:** Automatically reports the tab's status (URL, Title, Focus) to the SW, listens for lifecycle events (closing, navigating), and provides a clean API for the developer to interact with other tabs.

---

## 🛠️ Getting Started

### 1. Installation (Service Worker)
To enable the TabManager, you must install the plugin into your `TinyServiceWorkerEngine`.

```javascript
import TinyTabManagerPlugin from 'tiny-essentials/libs/sw/service/plugins/TabManager';

// Inside your Service Worker initialization
swManager.installPlugin(TinyTabManagerPlugin);
```

### 2. Initialization (Main Thread)
In your web application (the client side), you need to connect to the Service Worker using the `TinySwTabsLayer`.

```javascript
import TinyTabManagerPlugin from 'tiny-essentials/libs/sw/browser/plugins/TabManager';

// Assuming 'sw' is your TinyServiceWorker instance
const tabManager = swManager.installPlugin(TinyTabManagerPlugin);

// Now you can use the tabManager instance to control tabs!
```

---

## ⚙️ Technical Deep-Dive (For Developers)

### 🛡️ Permission System
To ensure user privacy and control, the plugin implements a granular permission system. When a tab registers itself, it can opt-out of certain management actions. These permissions are stored per `clientId`.

*   **`allowFocusTracking`**: If `false`, the Service Worker will not update the `isFocused` status for this tab.
*   **`allowTabClosing`**: If `false`, remote commands to close this tab (via `tab:close_single` or `tab:close_multiple`) will be rejected with a "Permission denied" reason.

### 🔄 Ghost Tab Reconciliation
One of the biggest challenges in PWA development is when a user closes a tab or the browser crashes, preventing the `unregister` message from being sent.

**How this plugin solves it:**
The Service Worker performs a **Reconciliation** every time a new tab registers or an unregistration occurs. It uses `sw.clients.matchAll()` to compare the "Master Registry" in `IndexedDB` against the *actual* active browser clients. If a tab exists in the registry but is no longer a valid browser client, it is automatically purged.

### 📦 Persistence Layer
The plugin uses **IndexedDB** (`TinySwTabsDB`) to ensure that the tab registry survives page reloads and browser restarts. This ensures that even if the Service Worker is woken up after a period of inactivity, it still knows which tabs were previously active.

### 🚦 Concurrency Management
To prevent race conditions (e.g., two tabs trying to update the registry at the exact same millisecond), the Service Worker uses a `TinyPromiseQueue`. All database operations are queued to ensure data integrity.
