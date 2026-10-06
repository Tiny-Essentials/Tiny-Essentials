# 🛠️ TinyDebugger Documentation

`TinyDebugger` is a lightweight, event-driven debugging utility designed to wrap standard `console` methods. It provides enhanced features such as custom prefixes, color support, and the ability to emit events whenever a log occurs, making it perfect for complex applications where you might want to redirect logs to an external service or a UI component.

## 🚀 Quick Start

To use `TinyDebugger`, import it into your project and initialize it with a configuration object.

```javascript
import TinyDebugger from 'tiny-essentials/libs/tools/TinyDebugger';

const debuggerInstance = new TinyDebugger({
  logger: console, // You can use standard console or a custom object
  id: 'APP_CORE',
  debugMode: true,
  autoHideId: false,
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
| `logger` | `Partial<Console>` | **Yes** | N/A | An object implementing the `Console` interface. |
| `autoHideId` | `boolean` | No | `false` | Whether to hide the instance id whenever a sub id is set. |
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

## 🧩 Instance Properties

These properties are accessed directly on the instance (not as methods).

| Property | Type | Access | Description |
| :--- | :--- | :--- | :--- |
| `logId` | `string` | read-only | The instance debug id. |
| `logSubId` | `string` | read / write | A sub-identifier. **Can only be assigned once.** Reading it before assignment throws an `Error`. |
| `debugMode` | `boolean` | read / write | Enables or disables all logging. |
| `canEmitLogs` | `boolean` | read-only | Whether event emission is enabled. |
| `useLogColors` | `boolean` | read / write | Enables or disables ANSI colors. |

> ⚠️ **Note:** Setting `debugMode` or `useLogColors` emits the `setDebugMode` event.

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
| `_applyLogFormatting(text)` | Applies all prefix and color replacements to a string and returns the result. |

### Default Colors

`black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`, `gray`.

### Default Prefixes

| Shortcut | Output |
| :--- | :--- |
| `:log:` | `[_log_LOG_reset_]` |
| `:info:` | `[_info_INFO_reset_]` |
| `:warn:` | `[_warn_WARN_reset_]` |
| `:error:` | `[_error_ERROR_reset_]` |
| `:debug:` | `[_debug_DEBUG_reset_]` |

### Example: Adding a Custom Color
```javascript
debuggerInstance._addLogColor('gold', '\x1b[33m');
debuggerInstance.log('info', 'This message is _gold_!');
```

---

## 🎨 Color Convention

`TinyDebugger` follows a visual convention for color usage. Following it keeps logs predictable: a reader can identify the role of each element by its color alone, without reading the full message.

| Color | Applies to | Meaning |
| :--- | :--- | :--- |
| 🔵 Blue | Main class | The **primary class** of the current context. |
| 🟢 Green | Sub-class | A **sub-class** that belongs to something connected to the main class. |

### How to read it

*   **Blue = the main class.** This is the entry point of the context you are looking at.
*   **Green = the sub-class.** This is a class that is connected to (owned by, instantiated by, or dependent on) the main class. It is not the entry point itself.

### Example

```javascript
// The main class is blue, the sub-class is green.
debugger.log('info', '[_main_class_Server_reset_] started [_sub_class_Router_reset_]');
```

In the example above:

*   `[Server]` is the **main class** (blue).
*   `[Router]` is a **sub-class** connected to `Server` (green).

> 💡 **Tip:** Use `_addLogColor(id, code)` to register these shortcuts once and reuse them across your project instead of repeating raw ANSI codes.

---

## 📡 Events

When `canEmitLogs` is `true`, the instance emits the following events:

| Event | Payload | Emitted when |
| :--- | :--- | :--- |
| `setDebugMode` | `boolean` | `debugMode` or `useLogColors` is changed. |
| `debug:log` | `(prefix, message, ...args)` | `log()` is called. |
| `debug:clear` | — | `logClear()` is called. |
| `debug:groupEnd` | — | `logGroupEnd()` is called. |
| `debug:logLabel` | `(logType, label)` | `logLabel()` is called. |
| `debug:timeLog` | `(label, ...args)` | `logTimeLabel()` is called. |
| `debug:assert` | `(condition, ...args)` | `logAssert()` is called. |
| `debug:dir` | `(item, options)` | `logDir()` is called. |
| `debug:table` | `(tabularData, properties)` | `logTable()` is called. |

---

## 🖥️ Console Facade

The `toConsole()` method returns a `console`-compatible object. Every call is
routed through the instance's logging methods, so formatting, debug mode, and
event emission keep working automatically.

```javascript
const debug = new TinyDebugger({
  logger: console,
  id: 'APP_CORE',
  debugMode: true,
});

const log = debug.toConsole();

log.log('Hello, %s!', 'world'); // Routed through debug.log('log', ...)
log.warn('Careful!');
log.table([{ a: 1 }, { a: 2 }]);
```

### Supported methods

| Group | Methods |
| :--- | :--- |
| Standard | `log`, `info`, `warn`, `error`, `debug` |
| Grouping | `group`, `groupCollapsed`, `groupEnd` |
| Inspection | `dir`, `dirxml`, `table`, `trace` |
| Assertion | `assert` |
| Timers | `time`, `timeEnd`, `timeLog`, `timeStamp` |
| Counters | `count`, `countReset` |
| Profiler | `profile`, `profileEnd` |
| Utility | `clear` |

---

## ⚠️ Error Handling

It will throw `TypeError` if:
1.  The `logger` provided is not a valid object.
2.  The `id` is not a string.
3.  Configuration booleans are provided as other types.
4.  An invalid `logType` is passed to the logging methods.
