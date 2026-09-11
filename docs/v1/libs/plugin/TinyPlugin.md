# 🛠️ TINY PLUGIN SYSTEM: ARCHITECTURAL SPECIFICATION & DEVELOPER PROMPT

> **IMPORTANT:** This document serves as the authoritative source of truth for the Tiny Plugin System. All developers (human and AI) must adhere to these architectural constraints to ensure system integrity and type safety.

---

## 🎯 SYSTEM OVERVIEW
The Tiny Plugin System is a highly structured, type-safe framework designed for managing plugin lifecycles. It operates on a **"Double-Layer Validation"** principle:
1.  **Static Layer:** Using advanced JSDoc Generics to provide IDE-level type safety.
2.  **Runtime Layer:** Using strict manual validation within plugin installers to prevent invalid states.

---

## 🛡️ THE GOLDEN RULES (CRITICAL CONSTRAINTS)

### 🚫 RULE 01: NO MUTATION (Architectural Integrity)
**NEVER** attempt to manually inject, add, or modify properties or methods directly onto the `pluginInstance` (`TinyPlugin`) or the `engine` (`TinyPluginCore`) inside an installer function. 
- **Incorrect:** `pluginInstance.myNewMethod = () => {};`
- **Correct:** Use the **Extension Pattern** (see Section 3).

### 🛡️ RULE 02: THE EXTENSION PATTERN (@extended)
If a plugin requires custom methods or properties on the engine, you **MUST** use inheritance.
1.  Create a new class that `extends TinyPluginCore`.
2.  Define your custom logic within this subclass.
3.  Use this subclass as the `Engine` type reference in your plugin's JSDoc.
**Rule:** *Expand the core via inheritance BEFORE implementing the plugin logic.*

### 🛡️ RULE 03: MANDATORY RUNTIME VALIDATION
Every plugin installer **MUST** perform a deep validation of its `options` object.
- Use `throw new TypeError(...)` for every property defined in your `@typedef`.
- A plugin must fail fast during the `installPlugin` phase if its configuration is invalid.

---

## 🚀 WORKFLOW & IMPLEMENTATION GUIDE

### 1. HOST SETUP (The Engine)
The host application must extend `TinyPluginCore` to gain registry capabilities.

```javascript
// Example: `./MyEngine.mjs`
import { TinyPluginCore, TinyPluginLayer, TinyPlugin } from 'tiny-essentials/libs/plugin/TinyPlugin';

/**
 * A function used to install a plugin into the engine.
 * @template {TinyPluginLayer} Layer
 * @template {string} IdString
 * @template {string} VersionString
 * @template {any[]} Options
 * @typedef {import('tiny-essentials/libs/plugin/TinyPlugin').TinyPluginInstaller<MyEngine, Layer, IdString, VersionString, Options>} MyEngineInstaller
 */

/**
 * Represents a plugin instance designed to be integrated into a MyEngine.
 * @template {TinyPluginLayer} Layer
 * @template {string} IdString
 * @template {string} VersionString
 * @template {any[]} Options
 * @typedef {TinyPlugin<MyEngine, Layer, IdString, VersionString, Options>} MyEnginePlugin
 */

class MyEngine extends TinyPluginCore {
  /**
   * Initializes a new instance of the MyEngine with the provided configuration and logger settings.
   * @param {Object} [lgConfig] - Configuration options for the instance.
   * @param {boolean} [lgConfig.debugMode=false] - Whether to enable internal debug logging.
   * @param {boolean} [lgConfig.useLogColors=false] - Whether to enable log color support.
   * @param {Partial<Console>} [lgConfig.logger=console] - A custom logger object..
   */
  constructor(config = {}, lgConfig = {}) {
    super({
      id: '[My-Engine]',
      logger: lgConfig.logger ?? console,
      debugMode: lgConfig.debugMode ?? false,
      useLogColors: lgConfig.useLogColors ?? false,
    });
  }

  // Add custom engine-level methods here
  customMethod() { console.log("Engine logic"); }
}

export default MyEngine;
```

### 2. PLUGIN CREATION (The Guest)
Plugins must be isolated files exporting an installer function.

**Required Pattern:**
1.  **Define Options:** Use `@typedef {Object}` for configuration options.
2.  **Annotate Installer:** Use the generic `Installer` type from your specific Engine to annotate the function. This allows the IDE to validate the `options` object when you call `installPlugin`.
3.  **Implement Identity Assignment:** Use the `sandbox` to assign `id`, `version`, `description`, `authors`, and `contributors`.
4.  **Return the Layer:** The installer **MUST** return a `TinyPluginLayer` or a class extended from `TinyPluginLayer` instance.

**⚠️ TECHNICAL NUANCE: The Identity & Layer Contract**
The `Installer` function is a setup routine. It is not a simple `void` function.
1.  **The Sandbox:** The first argument is a `sandbox` (a Proxy of the `TinyPlugin` instance). You must use this to set the plugin's identity.
2.  **The Return Value:** The installer **MUST** return an instance of `TinyPluginLayer`. If nothing is returned, or if the return value is not a `TinyPluginLayer`, initialization will fail.

**The plugin is NOT considered "Ready" until the installer assigns the following to the `sandbox`:**
- `sandbox.id` (String, non-empty)
- `sandbox.version` (String, valid version)
- `sandbox.description` (String, non-empty)
- `sandbox.authors` (Array of non-empty strings)
- `sandbox.contributors` (Array of non-empty strings)

**If any of these are missing, the `installPlugin` process will throw an error and the plugin will fail to initialize.**

```javascript
// Example: `./plugins/MyPlugin.mjs`
import { TinyPluginLayer } from 'tiny-essentials/libs/plugin/TinyPlugin';
import MyEngine from '../MyEngine.mjs';

/**
 * @typedef {Object} MyPluginOptions
 * @property {string} apiKey - The API key for the service.
 * @property {boolean} [debug=false] - Enable debug mode.
 */

class MyTinyLayer extends TinyPluginLayer {
  #userId = '';

  constructor() {
    super();
  }

  get userId() {
    return this.#userId;
  }

  set userId(value) {
    this.#userId = value;
  }
}

/**
 * @type {import('../MyEngine.mjs').MyEngineInstaller<MyTinyLayer, 'MyPluginId', '1.0.0', [MyPluginOptions]>}
 */
const MyPluginInstaller = (sandbox, options) => {
  // 1. MANDATORY IDENTITY SETUP (Crucial!)
  sandbox.id = 'MyPluginId';
  sandbox.version = '1.0.0';
  sandbox.description = 'A plugin that performs amazing things.';
  sandbox.authors = ['DeveloperName'];
  sandbox.contributors = ['ContributorName'];

  // 2. Runtime Validation of Options (CRITICAL)
  if (typeof options.apiKey !== 'string') throw new TypeError('apiKey must be a string');
  if (typeof options.debug !== 'boolean') throw new TypeError('debug must be a boolean');

  // 3. Implementation Logic
  const engine = sandbox.engine;
  if (!(engine instanceof MyEngine)) {
    throw new TypeError('Plugin requires a MyEngine instance to function.');
  }

  const layer = new TinyPluginLayer();
  layer.userId = 'user123';

  if (options.debug) {
    console.log(`Plugin ${pluginInstance.id} is active.`);
  }

  // 4. RETURN THE LAYER (Mandatory!)
  return layer;
};

export default MyPluginInstaller;
```

### 3. INTEGRATION & INITIALIZATION
The engine performs the actual instantiation.

```javascript
import MyEngine from './MyEngine.mjs';
import MyPluginInstaller from './plugins/MyPlugin.mjs';

// Instantiate the Engine
const engine = new MyEngine();

// The engine handles the lifecycle: 
// 1. Creates the TinyPlugin instance -> 2. Calls installer -> 3. Validates Identity -> 4. Returns instance.
const pluginInstance = engine.installPlugin(MyPluginInstaller, { 
  apiKey: 'abc-123', 
  debug: true 
});

console.log('Plugin Status:', pluginInstance.isReady); // pluginInstance is the TinyPlugin object.
```

---

## 🔐 ACCESS CONTROL & PERMISSION MANAGEMENT (Engine Security)

The `TinyPluginCore` implements a **Zero-Trust** security model. The objective is to ensure the engine maintains absolute control over which plugins can interact with it and which engine properties are visible to each specific plugin.

Security is applied on two fronts: **Identity Control** (Who are you?) and **Scope Control** (What can you touch?).

### 1. OPERATION MODES (Identity Control)
The engine operates in one of the four access modes defined in `PluginAccessControlMode`. This mode determines how the `getPlugin()` method filters access between plugins.

| Mode | Description | Behavior |
| :--- | :--- | :--- |
| `none` | **Open Access** | All registered plugins can see and interact with all other plugins. |
| `whitelist` | **Explicit Permission** | Only plugins whose `id` or `authors` are in the whitelist can access the engine or other plugins. |
| `blacklist` | **Explicit Restriction** | All plugins have access, **except** those whose `id` or `authors` are in the blacklist. |
| `cryptographic`| **Zero-Trust** | **Only** plugins that have passed digital signature verification via the Web Crypto API can access the engine. |

### 2. THE DOUBLE-SIDED SECURITY MODEL

Security is not just about "who can enter," but about "what can be touched" once inside.

#### A. Outbound Protection: The Plugin Proxy (`plugin.engine`)
When a plugin accesses `this.engine`, it does **not** receive the actual `TinyPluginCore` instance. It receives a **Dynamic Proxy**.
- **Property Filtering:** The Proxy intercepts every access attempt. If a plugin attempts to access a property that has been added to the `sandboxBlacklist` by the engine, the Proxy will throw a `Security Error`.
- **Instance Protection:** The Proxy prevents the plugin from altering the engine's prototype (`setPrototypeOf`) or modifying protected properties.
- **Automatic Binding:** The Proxy ensures that engine methods maintain their correct execution context (`this`), preventing runtime errors.

#### B. Inbound Protection: The Engine Filter (`engine._getPlugin`)
Whenever a plugin attempts to retrieve another plugin via `plugin.getPlugin(id)`, the engine intercepts the request.
- The engine verifies the current access mode (`whitelist`, `blacklist`, or `cryptographic`).
- If the requesting plugin does not have permission to "see" the target, the engine returns `undefined`, even if the target plugin exists and is active.

### 3. CRYPTOGRAPHIC VERIFICATION (High-Security Mode)
In `cryptographic` mode, plugin identity is mathematically validated.

1.  **Signing:** The plugin author uses a private key to sign a JSON object containing `{id, authors}`.
2.  **Verification:** The engine uses the public key (configured in `accessControl`) to verify the signature during the initialization phase.
3.  **Trust Registration:** Only if the signature is valid is the `pluginId` added to the internal `#verifiedPlugins` set.

### ⚠️ DEVELOPER WARNING (AI & HUMAN)
- **Never attempt to bypass the Proxy:** Attempting to access the engine through unofficial methods to evade the Proxy will result in a runtime error.

---

## 🤖 AI AGENT INSTRUCTIONS (PROMPT)
When assisting with this codebase:
1.  **Distinguish between Installer and Instance:** Always clarify that the `Installer` function **must return a `TinyPluginLayer` instance**, while `engine.installPlugin()` is the method that returns the `TinyPlugin` instance.
2.  **Enforce the Identity Contract:** When writing or reviewing a plugin installer, **ALWAYS** ensure the developer assigns `id`, `version`, `description`, `authors`, and `contributors` to the `sandbox` provided. If they are missing, flag it as a critical error that will prevent `isReady` from becoming `true`.
3.  **The Sandbox Argument:** Always refer to the first argument of the installer as the `sandbox`.
4.  **Always check the `@typedef`** of the options before suggesting implementation.
5.  **Enforce the use of Generics** in any new plugin or engine extension to maintain IDE type-safety.
6.  **If the user attempts to modify an object property directly** (e.g., `engine.newProp = ...`), immediately flag it as a violation of **RULE 01** and suggest the **Extension Pattern**.
7.  **Ensure all `throw` statements** in installers are specific (e.g., `TypeError`, `RangeError`) and provide descriptive error messages.
8.  **Enforce Security Context:** Whenever the user asks about "security" or "permissions," explain the distinction between the **Access Mode** (Whitelist/Blacklist/Crypto) and the **Sandbox Proxy**. Remind the user that `plugin.engine` is a Proxy and not the actual instance, and that attempting to modify protected properties will trigger a security error.
