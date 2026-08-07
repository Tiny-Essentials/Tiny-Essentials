# 🛠️ TinyDebugger Documentation

`TinyDebugger` is a lightweight, event-driven debugging utility designed to wrap standard `console` methods. It provides enhanced features such as custom prefixes, color support, and the ability to emit events whenever a log occurs, making it perfect for complex applications where you might want to redirect logs to an external service or a UI component.

## 🚀 Quick Start

To use `TinyDebugger`, import it into your project and initialize it with a configuration object.

```javascript
import TinyDebugger from 'tiny-essentials/libs/TinyDebugger';

const debuggerInstance = new TinyDebugger({
  logger: console, // You can use standard console or a custom object
  id: 'APP_CORE',
  debugMode: true,
  canEmitLogs: true,
  useLogColors: true
});

debuggerInstance.log('info', 'Hello, Yasmin! The debugger is ready. 🌟');
```

---

## ⚙️ Configuration

When creating a new instance via the `constructor`, you can pass a configuration object with the following properties:

| Property | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `logger` | `Object` | **Yes** | N/A | An object implementing the `Console` interface. |
| `id` | `string` | **Yes** | N/A | A unique identifier for this debugger instance. |
| `debugMode` | `boolean` | **Yes** | N/A | If `false`, all logging methods will return immediately. |
| `canEmitLogs` | `boolean` | No | `false` | If `true`, the instance will emit events for every log action. |
| `useLogColors` | `boolean` | No | `false` | Enables ANSI color codes. *Note: Automatically disabled in Firefox.* |

---

## ✨ Key Features

### 🎨 Custom Colors
You can inject colors into your log messages using the `_colorName_` syntax.
*   **Syntax:** `_color_`
*   **Example:** `debugger.log('info', 'This is _red_ critical error!');`

### 🏷️ Custom Prefixes
You can use placeholders to insert specific prefix text into your logs.
*   **Syntax:** `:id:`
*   **Example:** `debugger.log('info', ':info: System initialized.');`

### 📡 Event Emission
If `canEmitLogs` is set to `true`, `TinyDebugger` acts as an `EventEmitter`, allowing you to listen to specific debugging events. This is incredibly useful for building custom developer consoles in web applications.

---

## 📖 API Reference

### `log(logType, message, ...args)`
The primary method for logging.
*   **logType:** `'log' | 'info' | 'warn' | 'error' | 'debug' | 'dirxml' | 'group' | 'groupCollapsed' | 'trace'`
*   **message:** `string` (The text to display)
*   **args:** `...any` (Additional data to inspect)

### `logLabel(logType, label)`
Logs a specific console type associated with a label.
*   **logType:** `'count' | 'countReset' | 'time' | 'timeEnd' | 'profile' | 'profileEnd' | 'timeStamp'`
*   **label:** `string`

### `logTimeLabel(label, ...args)`
Starts a timer with a specific label.
*   **label:** `string`

### `logAssert(condition, ...args)`
Logs a message only if the provided condition evaluates to `false`.
*   **condition:** `boolean`

### `logDir(item, options)`
Displays an element as a JavaScript object (similar to `console.dir`).
*   **item:** `any`
*   **options:** `InspectOptions`

### `logTable(tabularData, properties)`
Displays data in a clean, readable table.
*   **tabularData:** `any`
*   **properties:** `string[]` (Optional array of column properties)

### `logClear()`
Clears the console.
### `logGroupEnd()`
Ends the current console group.

---

## 🛠️ Advanced Customization

You can dynamically modify the behavior of your debugger instance using these internal methods:

| Method | Description |
| :--- | :--- |
| `_addLogColor(id, code)` | Adds a new color shortcut (e.g., `_mycolor_`). |
| `_removeLogColor(id)` | Removes a color shortcut. |
| `_addLogPrefix(id, text)` | Adds a new prefix shortcut (e.g., `:status:`). |
| `_removeLogPrefix(id)` | Removes a prefix shortcut. |

### Example: Adding a Custom Color
```javascript
debuggerInstance._addLogColor('gold', '\x1b[33m');
debuggerInstance.log('info', 'This message is _gold_!');
```

---

## ⚠️ Error Handling

It will throw `TypeError` if:
1.  The `logger` provided is not a valid object.
2.  The `id` is not a string.
3.  Configuration booleans are provided as other types.
4.  An invalid `logType` is passed to the logging methods.
