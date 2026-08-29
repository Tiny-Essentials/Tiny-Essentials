# 🧩 TinyCloner Documentation

Welcome to the **TinyCloner** official documentation! 🚀 

`TinyCloner` is a highly modular, plugin-based deep cloning engine. Unlike standard `JSON.parse(JSON.stringify(obj))` hacks, TinyCloner is designed for professional environments where you need precision, extensibility, and total control over how specific data types are duplicated.

---

## ✨ Key Features

*   **🔌 Plugin-Based Architecture:** Easily extend the cloner to handle custom classes, Dates, Sets, Maps, or any complex object.
*   **🛡️ Strict Validation:** Built-in runtime checks ensure that plugins and options adhere to the required interfaces, preventing silent failures.
*   **⚖️ Global vs. Instance Control:** Manage cloning rules globally for your whole application, or create isolated instances for specific tasks.
*   **🔄 Deep & Shallow Modes:** Effortlessly switch between deep and shallow cloning.
*   **🔒 Isolation Mode:** Create "sandboxed" cloners that ignore global settings to prevent side effects in complex applications.

---

## 🚀 Getting Started

### 1. Basic Cloning (The Quick Way)
If you just need to clone something using the default settings, use the static `clone` method.

```javascript
import TinyCloner from 'tiny-essentials/libs/utils/TinyCloner';

const original = { name: 'Yasmin', skills: ['Coding', 'Logic'] };

// Perform a Deep Clone (Default)
const deepCopy = TinyCloner.clone(original);
deepCopy.skills.push('Architecture'); 

console.log(original.skills); // ['Coding', 'Logic'] -> Safe!
console.log(deepCopy.skills); // ['Coding', 'Logic', 'Architecture']
```

### 2. Shallow Cloning
If you want to copy the top-level properties but keep references to nested objects, pass `false` as the second argument.

```javascript
const shallowCopy = TinyCloner.clone(original, false);
```

---

## 🏗️ Advanced Usage: The Instance Pattern

In large applications, you might not want to change the global behavior of `TinyCloner`. For this, you should create an **Instance**.

### 🛡️ Using `isolationMode`
When you create an instance with `isolationMode: true`, it becomes a "sandbox." It will only use the plugins you explicitly give it, ignoring any changes made to the global `TinyCloner` settings.

```javascript
// This instance is "immune" to global plugin changes
const privateCloner = new TinyCloner({ isolationMode: true });

// This instance will follow the global rules (default behavior)
const standardCloner = new TinyCloner();
```

---

## 🛠️ Extending the Cloner (Custom Plugins)

This is where `TinyCloner` shines. You can teach it how to handle new types by creating a `CloningPlugin`.

### 📝 The Plugin Interface
Every plugin must follow this structure:
1.  `id`: A unique string.
2.  `canHandle(item)`: Returns `true` if the plugin should process the item.
3.  `clone(item, isDeep, cloner)`: The logic to duplicate the item.

### 💡 Example: Adding a `Date` Plugin
```javascript
import TinyCloner from './TinyCloner.mjs';

const datePlugin = {
  id: 'date-plugin',
  canHandle: (item) => item instanceof Date,
  clone: (item, isDeep, cloner) => {
    return new Date(item.getTime());
  }
};

// Add it to the global registry
TinyCloner.addPlugin(datePlugin);

const data = { timestamp: new Date() };
const clonedData = TinyCloner.clone(data);

console.log(clonedData.timestamp instanceof Date); // true
```

---

## 📖 API Reference

### 🌍 Static Methods (Global Management)
Use these to configure how `TinyCloner` behaves across your entire project.

| Method | Description |
| :--- | :--- |
| `TinyCloner.clone(item, isDeep)` | The primary method to clone any item. |
| `TinyCloner.addPlugin(plugin, pos, index)` | Adds a plugin to `start`, `end`, or a specific `index`. |
| `TinyCloner.removePlugin(id)` | Removes a plugin by its unique ID. |
| `TinyCloner.hasPlugin(id)` | Checks if a plugin exists globally. |
| `TinyCloner.plugins` (get/set) | Get/Replace the entire global plugin array. |
| `TinyCloner.set defaultIsDeep(bool)` | Sets the global default for deep cloning. |

### 👤 Instance Methods (Local Management)
Use these when working with a `new TinyCloner()` instance.

| Method | Description |
| :--- | :--- |
| `cloner.clone(item, isDeep)` | Clones an item using instance-specific rules. |
| `cloner.addPlugin(plugin, ...)` | Adds a plugin only to this specific instance. |
| `cloner.removePlugin(id)` | Removes a plugin only from this instance. |
| `cloner.plugins` (get/set) | Access the instance's specific plugin list. |

---

## ⚠️ Best Practices

1.  **Always Use `id`:** When creating plugins, ensure the `id` is unique to avoid confusion during debugging.
2.  **Prefer Instances for Libraries:** If you are building a library that uses `TinyCloner`, **always** create an instance (`new TinyCloner()`) instead of using the static methods. This prevents your library from accidentally changing the global settings of the user's project. 🛡️
3.  **Validate your Plugins:** Use `TinyCloner.validatePlugin(myPlugin)` during your unit tests to ensure your custom logic is compatible.
