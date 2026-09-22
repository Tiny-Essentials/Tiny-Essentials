# 🚀 TinyTabManager: Tab Orchestration

Welcome to the **TinyTabManager** documentation! 🌐 This system provides a robust, persistent, and synchronized way to track, manage, and communicate with multiple browser tabs through a Service Worker.

Whether you are building a complex PWA (Progressive Web App) or a multi-window dashboard, `TinyTabManager` ensures your Service Worker always knows exactly which tabs are open, what they are doing, and allows you to control them remotely.

---

## 🏗️ Architecture Overview

The system is split into two distinct parts that communicate via the `TinyServiceWorker` bridge:

1.  **The Client Layer (`TinySwTabsLayer`)**: 🖥️ Runs in the **Main Thread** (your web page). It monitors the tab's focus, URL, and title, and reports this data to the Service Worker.
2.  **The SW Plugin (`TinyTabManagerPlugin`)**: 🧠 Runs in the **Service Worker**. It acts as the "Source of Truth," storing all tab data in **IndexedDB** for persistence and managing the registry of active clients.

### 🔄 The Workflow
`Tab Opens` ➡️ `Client Layer detects tab` ➡️ `Registers with SW` ➡️ `SW saves to IndexedDB` ➡️ `SW broadcasts update to all other tabs`.

---

## 🛠️ Installation & Setup

You must register the plugin within your `TinyServiceWorkerEngine` instance.

```javascript
import TinyTabManagerPlugin from 'tiny-essentials/libs/sw/browser/plugins/TabManager';

// Inside your Service Worker initialization
swManager.installPlugin(TinyTabManagerPlugin);
```

---

## 📖 API Reference

Use these layer methods within your web application to interact with the Service Worker.

### 🔍 Monitoring Tabs
| Method | Description | Returns |
| :--- | :--- | :--- |
| `getTabList()` | Gets a list of all currently registered tabs. | `Promise<TabList>` |
| `getTab(id)` | Gets detailed info for a specific tab by ID. | `Promise<TabInfo \| null>` |
| `onUpdate(cb)` | Subscribes to changes in the tab list. | `void` |
| `offUpdate(cb)` | Unsubscribes from tab list changes. | `void` |

### 🕹️ Controlling Tabs
| Method | Description | Returns |
| :--- | :--- | :--- |
| `closeTab(id)` | Requests to close a specific tab. | `Promise<{ closed: boolean }>` |
| `closeTabs(ids)` | Requests to close multiple tabs. | `Promise<{ closed: Array<number> }>` |
| `closeAllTabs()` | Requests to close every registered tab. | `Promise<void>` |

---

## 🧠 Advanced Features

### 💾 Data Persistence (IndexedDB)
Unlike standard in-memory tracking, `TinyTabManager` uses **IndexedDB** (`TinySwTabsDB`). 
- **Why?** If the Service Worker restarts or the user closes the browser and reopens it, the registry remains intact.
- **Reconciliation:** The plugin automatically performs a "reconciliation" check. If a tab was closed abruptly (e.g., a crash), the SW compares the IndexedDB registry with the actual active browser clients and removes "ghost" entries automatically. 👻

### 📦 Custom Data Synchronization
You can attach custom objects to a tab. This is extremely useful for keeping the Service Worker in sync with the application state without needing a backend database for every small change.

```javascript
const config = {
  getExtraData: () => {
    return {
      currentProject: 'Project_Alpha',
      isEditing: true
    };
  }
};
```

### 🔒 Security & Permissions
The system implements a "Permission-First" approach for closing tabs:
1.  **Client-Side Control:** When initializing, you can set `allowTabClosing: false`. If set to false, the Service Worker will receive a "Permission Denied" response if it tries to close that tab.
2.  **Runtime Updates:** You can change these permissions on the fly using `setPermissions()`.

The plugin respects privacy and user intent through two main permission flags:

3.  **`trackFocus`**: If `false`, the tab will not report whether it is currently the active window.
4.  **`allowTabClosing`**: If `false`, the Service Worker is forbidden from requesting that this tab be closed.

**Updating permissions at runtime:**
```javascript
await tabLayer.setPermissions({
  allowTabClosing: false // This tab becomes "protected"
});
```

---

## 🚀 Practical Example: The "Dashboard Controller"

Imagine you have a dashboard with 5 open tabs, and you want a "Global Reset" button that closes all tabs except the main one.

```javascript
// In your Main Dashboard Tab
async function globalCleanup() {
  const list = await tabLayer.getTabList();
  
  // Filter out all tabs except the current one
  const otherTabIds = list.tabs
    .filter(tab => tab.id !== currentTabId)
    .map(tab => tab.id);

  if (otherTabIds.length > 0) {
    await tabLayer.closeTabs(otherTabIds);
    console.log("✨ Cleaned up extra tabs!");
  }
}
```

---

## ⚠️ Summary Cheat Sheet

| If you want to... | Use this method | Where? |
| :--- | :--- | :--- |
| **See all open tabs** | `getTabList()` | Main Thread |
| **Close a specific tab** | `closeTab(id)` | Main Thread |
| **Sync custom state** | `getExtraData` (option) | Main Thread |
| **Handle tab changes** | `onUpdate(callback)` | Main Thread |

---

## 💡 Pro-Tips for Daily Use

*   **🔄 Use `onUpdate` for UI sync:** Instead of polling `getTabList()` every few seconds, always use `onUpdate`. It is much more efficient and provides a seamless user experience.
*   **💾 Syncing State:** Use the `getExtraData` option to save the "state" of your application. This allows a user to open a new tab and immediately see exactly where they left off in the previous one.
*   **🚫 Protecting Critical Tabs:** If you have a "Checkout" or "Payment" tab, always set `allowTabClosing: false` to prevent accidental closure via the Service Worker.
