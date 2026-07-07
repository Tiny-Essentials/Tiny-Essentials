# 🛠️ TinyPluginInliner

`TinyPluginInliner` is a powerful **build-time utility** designed specifically to complement the `TinyClassManager`. 

When using `TinyClassManager`, you compose classes using a mixin pattern via the `.insert()` method. While this is incredibly flexible for development, it creates a challenge for deployment: you end up with many small, interconnected files and complex import paths. 

**`TinyPluginInliner` solves this by "inlining" your plugins directly into a single, self-contained bundle.** It automates the process of fetching plugin code, rewriting their internal import paths, and hoisting dependencies to the top of your final file. 🚀

---

## ✨ Key Features

* **📦 Automatic Inlining:** It scans your entry file for `.insert(PluginName)` calls and replaces them with the actual source code of the plugin.
* **🔗 Smart Path Rewriting:** It automatically corrects `import` statements inside your plugins so they point to the correct relative locations in your `dist` folder.
* **📚 JSDoc Support:** It doesn't just fix code; it also rewrites `import()` calls and `@typedef` paths inside JSDoc comments, ensuring your IDE (like VS Code) keeps providing perfect autocomplete in the bundled version.
* **🌐 NPM Integration:** It can reach into your `node_modules`, grab an NPM package used by a plugin, and inline it into your bundle, even fixing that package's internal relative paths!
* **🔄 Root Remapping:** Through `rootReplacement`, you can tell the inliner to automatically swap directory names (e.g., changing all `src/` imports to `dist/` imports).
* **🔝 Dependency Hoisting:** It collects all necessary imports and type definitions from all plugins and moves them to the very top of the generated file for a clean, valid structure.

---

## ⚙️ Configuration

When creating an instance of `TinyPluginInliner`, you provide an `InlinerConfig` object:

| Property | Type | Description |
| :--- | :--- | :--- |
| `entryPoint` | `string` | The absolute or relative path to your main file (where you call `.insert()`). |
| `outDir` | `string` | The directory where the final bundle will be saved. |
| `outFileName` | `string` | The name of the generated bundle file (e.g., `bundle.mjs`). |
| `rootReplacement` | `Object` | *(Optional)* An object `{ from: string, to: string }` to remap project roots. |

---

## 🚀 How to Use

### 1. Develop your Plugins
Your plugins must follow the `TinyClassManager` requirement of having static properties for identification.

```javascript
// src/plugins/LoggerPlugin.mjs
export class LoggerPlugin {
  static _tinyDepName = 'Logger';
  static _tinyDeps = [];

  constructor(Base) {
    super();
    this.log = (msg) => console.log(`[LOG]: ${msg}`);
  }
}
```

### 2. Create your Entry Point
This is the file that uses the `TinyClassManager` to compose your final class.

```javascript
// src/main.mjs
import TinyClassManager from './libs/TinyClassManager.mjs';
import { LoggerPlugin } from './plugins/LoggerPlugin.mjs';

class BaseUser {}

// The Inliner will look for this specific pattern!
const User = new TinyClassManager(BaseUser)
  .insert(LoggerPlugin) 
  .build();

export default User;
```

### 3. Run the Inliner
Create a build script (e.g., `build.mjs`) to trigger the process.

```javascript
import TinyPluginInliner from './libs/TinyClassManager/TinyPluginInliner.mjs';

const builder = new TinyPluginInliner({
  entryPoint: 'src/main.mjs',
  outDir: 'dist',
  outFileName: 'app.bundle.mjs',
  // This ensures that if a plugin imports from 'src/utils', 
  // it will be rewritten to 'dist/utils' in the bundle.
  rootReplacement: {
    from: 'src',
    to: 'dist',
  },
});

builder.build();
```

---

## 🔄 Before vs. After

### 📝 Before (Development)
Your project is a web of files:
* `src/main.mjs` $\rightarrow$ imports `LoggerPlugin`
* `src/plugins/LoggerPlugin.mjs` $\rightarrow$ imports `src/utils/helper.mjs`

### 📦 After (Production Bundle)
The `dist/app.bundle.mjs` is a single, massive, but perfectly valid file:
1. **Top:** All imports from `main.mjs`, `LoggerPlugin.mjs`, and `helper.mjs` are hoisted here.
2. **Middle:** All `@typedef` definitions are gathered here.
3. **Bottom:** The logic of `main.mjs` runs, but the `.insert(LoggerPlugin)` call has been replaced by the actual code of the `LoggerPlugin` class, which now correctly references the hoisted helper functions.

**Everything is ready to be shipped!** 🚢💨