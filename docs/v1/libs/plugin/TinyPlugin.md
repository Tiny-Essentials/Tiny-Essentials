# 📖 API REFERENCE: TINY PLUGIN SYSTEM

This section provides a detailed technical breakdown of all classes, functions, and types exported by the system.

## 🏛️ CORE CLASSES

### `TinyPluginCore`
The central engine and registry of the system. It manages the lifecycle of all plugins and enforces security boundaries.
- **Purpose:** Acts as the "Host" that installs, tracks, and communicates with plugins.
- **Key Responsibilities:**
    - Plugin registration and retrieval (`installPlugin`, `getPlugin`).
    - Enforcement of `PluginAccessControlMode`.
    - Management of the `sandboxBlacklist` (protecting engine properties).
    - Emitting lifecycle events (e.g., `pluginsDestroyed`).

### `TinyPlugin`
The object representing a registered plugin instance.
- **Purpose:** Provides the plugin with a controlled interface to interact with the engine and its own state.
- **Key Responsibilities:**
    - Provides access to the `engine` (via a security Proxy).
    - Provides access to the `layer` (via a security Proxy).
    - Manages plugin identity (`id`, `version`, `authors`, etc.).
    - Manages the plugin lifecycle state (`isReady`, `isDestroyed`).

### `TinyPluginLayer`
The isolated runtime environment for a specific plugin.
- **Purpose:** Provides a "sandbox" where the plugin performs its primary logic.
- **Key Responsibilities:**
    - Provides the `sandbox` object to the installer.
    - Manages layer-specific access control.
    - Ensures that the plugin cannot access the `TinyPluginCore` directly, only through the permitted `layer` interface.

---

## 🛠️ EXPORTED UTILITY FUNCTIONS

### `signPluginIdentity`
**Usage:** Used by plugin authors during the build/release process.
- **Description:** Signs the plugin's deterministic identity string using a provided RSA private key.
- **Parameters:**
    - `pluginId` (`string`): Unique ID.
    - `authors` (`string[]`): List of authors.
    - `categories` (`string[]`): List of categories.
    - `tags` (`string[]`): List of tags.
    - `privateKey` (`CryptoKey`): The RSA private key.
    - `algorithm` (`CryptoAlgorithm`, optional): The signing algorithm.
- **Returns:** `Promise<ArrayBuffer>` (The digital signature).

### `createPluginIdChecker`
**Usage:** Used by the engine to generate a deterministic string for verification.
- **Description:** Creates a standardized, sorted JSON string of the plugin's identity to ensure the signature matches exactly during verification.
- **Returns:** `string` (The JSON identity string).

### `verifyPluginSignature`
**Usage:** Used by the engine during the plugin initialization phase.
- **Description:** Asynchronously validates that a provided signature matches the plugin's identity using a public key.
- **Returns:** `Promise<boolean>` (True if valid, false otherwise).

---

## 🔐 SECURITY & ACCESS CONTROL TYPES

### `PluginAccessControlMode`
Defines how the engine filters access.
- `'none'`: Open access.
- `'whitelist'`: Only allowed identities can access.
- `'blacklist'`: Specific identities are blocked.
- `'cryptographic'`: Only signed identities are allowed.

### `BlackListValue`
- **Type:** `string | symbol`
- **Description:** The allowed types for keys used in blacklists or whitelists.

### `PluginAccessControl`
The configuration object defining the security posture of an engine or layer.
- `mode`: The current `PluginAccessControlMode`.
- `whitelist`: A `BwList` of allowed identities.
- `blacklist`: A `BwList` of blocked identities.
- `publicKey`: The PEM string used for cryptographic verification.
- `cryptoAlgorithm`: The algorithm used for verification.
- `importAlgorithm`: The algorithm used to import the key.
- `importKeyFormat`: The format of the key (e.g., `'raw'`, `'spki'`).

### `BwList`
A collection of sets used for identity matching.
- `ids`: `Set<string>`
- `authors`: `Set<string>`
- `categories`: `Set<string>`
- `tags`: `Set<string>`

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

#### ⚠️ MANDATORY TYPE DEFINITIONS (Required for Engine Developers)
To enable the **Static Layer** of validation, the engine developer **is strictly obligated** to define two custom `@typedef` aliases using the generic types from `tiny-essentials`. 

Without these definitions, plugin authors will lose IDE autocompletion and type safety for your specific engine. You must define:
1.  **An Installer Type:** A specialized version of `TinyPluginInstaller` that targets your specific engine class.
2.  **A Plugin Type:** A specialized version of `TinyPlugin` that targets your specific engine class.

```javascript
// Example: `./MyEngine.mjs`
import { TinyPluginCore, TinyPluginLayer, TinyPlugin } from 'tiny-essentials/libs/plugin/TinyPlugin';

/**
 * [MANDATORY] Custom Installer Type for MyEngine.
 * This allows plugin authors to have full type-safety for 'options' and 'engine'.
 * 
 * @template {TinyPluginLayer} Layer - The type of the plugin layer.
 * @template {string} Id - The type of the plugin ID.
 * @template {string} Version - The type of the plugin version.
 * @template {any[]} Options - The type of the configuration options.
 * @typedef {import('tiny-essentials/libs/plugin/TinyPlugin').TinyPluginInstaller<MyEngine, Layer, Id, Version, Options>} MyEngineInstaller
 */

/**
 * [MANDATORY] Custom Plugin Type for MyEngine.
 * This ensures the 'engine' property on the plugin instance is correctly typed as MyEngine.
 * 
 * @template {TinyPluginLayer} Layer - The type of the plugin layer.
 * @template {string} Id - The type of the plugin ID.
 * @template {string} Version - The type of the plugin version.
 * @template {any[]} Options - The type of the configuration options.
 * @typedef {TinyPlugin<MyEngine, Layer, Id, Version, Options>} MyEnginePlugin
 */

class MyEngine extends TinyPluginCore {
  /**
   * Initializes a new instance of the MyEngine with the provided configuration and logger settings.
   * @param {Object} [config] - Configuration options for the instance.
   * @param {boolean} [config.debugMode=false] - Whether to enable internal debug logging.
   * @param {boolean} [config.useLogColors=false] - Whether to enable log color support.
   * @param {Partial<Console>} [config.logger=console] - A custom logger object.
   */
  constructor(config = {}) {
    // Pass the TinyPluginConstructor object structure expected by TinyPluginCore
    super({
      logCfg: {
        id: '[My-Engine]',
        logger: config.logger ?? console,
        debugMode: config.debugMode ?? false,
        useLogColors: config.useLogColors ?? false,
      },
      // You can also pass accessControl and sandboxBlacklist here
      accessControl: { mode: 'none' } 
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

1. **Define Options:** Use `@typedef {Object}` for configuration options.
2. **Annotate Installer:** Use the generic `Installer` type from your specific Engine to annotate the function. This allows the IDE to validate the `options` object when you call `installPlugin`.
3. **Implement Identity Assignment:** Use the `sandbox` to assign `id`, `version`, `description`, `authors`, `contributors`, `categories`, and `tags`.
4. **Return the Layer:** The installer **MUST** return a `TinyPluginLayer` or a class extended from `TinyPluginLayer` instance.

**⚠️ TECHNICAL NUANCE: The Identity & Layer Contract**
The `Installer` function is a setup routine. It is not a simple `void` function.

1. **The Sandbox:** The first argument is a `sandbox` (a Proxy of the `TinyPlugin` instance). You must use this to set the plugin's identity.
2. **The Return Value:** The installer **MUST** return an instance of `TinyPluginLayer`. If nothing is returned, or if the return value is not a `TinyPluginLayer`, initialization will fail.

**The plugin is NOT considered "Ready" until the installer assigns ALL of the following to the `sandbox`:**

* `sandbox.id` (String, non-empty)
* `sandbox.version` (String, valid version)
* `sandbox.description` (String, non-empty)
* `sandbox.authors` (Array of non-empty strings)
* `sandbox.contributors` (Array of non-empty strings)
* `sandbox.categories` (Array of non-empty strings)
* `sandbox.tags` (Array of non-empty strings)

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
  sandbox.categories = ['Utility'];
  sandbox.tags = ['demo', 'example'];

  // 2. Runtime Validation of Options (CRITICAL)
  if (typeof options.apiKey !== 'string') throw new TypeError('apiKey must be a string');
  if (typeof options.debug !== 'boolean') throw new TypeError('debug must be a boolean');

  // 3. Implementation Logic
  const engine = sandbox.engine;
  if (!(engine instanceof MyEngine)) {
    throw new TypeError('Plugin requires a MyEngine instance to function.');
  }

  const layer = new MyTinyLayer();
  layer.userId = 'user123';

  if (options.debug) {
    console.log(`Plugin ${sandbox.id} is active.`);
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

The engine operates in one of the four access modes defined in `PluginAccessControlMode`. This mode determines how the `getPlugin()` method filters access between plugins, as well as engine access.

| Mode | Description | Behavior |
| --- | --- | --- |
| `none` | **Open Access** | All registered plugins can see and interact with all other plugins. |
| `whitelist` | **Explicit Permission** | Only plugins whose `id`, `authors`, `categories`, or `tags` match the whitelist can access the engine or other plugins. |
| `blacklist` | **Explicit Restriction** | All plugins have access, **except** those whose `id`, `authors`, `categories`, or `tags` match the blacklist. |
| `cryptographic` | **Zero-Trust** | **Only** plugins that have passed digital signature verification via the Web Crypto API can access the engine. |

### 2. THE DOUBLE-SIDED SECURITY MODEL

Security is not just about "who can enter," but about "what can be touched" once inside.

#### A. Outbound Protection: The Plugin Proxy (`plugin.engine`)

When a plugin accesses `this.engine`, it does **not** receive the actual `TinyPluginCore` instance. It receives a **Dynamic Proxy**.

* **Property Filtering:** The Proxy intercepts every access attempt. If a plugin attempts to access a property that has been added to the `sandboxBlacklist` by the engine, the Proxy will throw a `Security Error`.
* **Instance Protection:** The Proxy prevents the plugin from altering the engine's prototype (`setPrototypeOf`) or modifying protected properties.
* **Automatic Binding:** The Proxy ensures that engine methods maintain their correct execution context (`this`), preventing runtime errors.

#### B. Inbound Protection: The Engine Filter (`plugin.getPlugin`)

Whenever a plugin attempts to retrieve another plugin via `plugin.getPlugin(id)`, the engine intercepts the request.

* The engine verifies the current access mode (`whitelist`, `blacklist`, or `cryptographic`).
* If the requesting plugin does not have permission to "see" the target based on its identity profile, the engine throw a `Security Error`.

### 3. CRYPTOGRAPHIC VERIFICATION (High-Security Mode)

In `cryptographic` mode, plugin identity is mathematically validated.

1. **Signing:** The plugin author uses a private key and the `signPluginIdentity` function to sign a JSON object stringified from an object containing sorted `{id, authors, categories, tags}`.
2. **Verification:** The engine uses the public key (configured in `accessControl`) to verify the signature during the initialization phase or lifecycle.
3. **Trust Registration:** Only if the signature is valid is the `pluginId` added to the internal `#verifiedPlugins` set.

### ⚠️ DEVELOPER WARNING (AI & HUMAN)

* **Never attempt to bypass the Proxy:** Attempting to access the engine through unofficial methods to evade the Proxy will result in a runtime error.

---

## 🤖 AI AGENT INSTRUCTIONS (PROMPT)

When assisting with this codebase:

1. **Distinguish between Installer and Instance:** Always clarify that the `Installer` function **must return a `TinyPluginLayer` instance**, while `engine.installPlugin()` is the method that returns the `TinyPlugin` instance.
2. **Enforce the Identity Contract:** When writing or reviewing a plugin installer, **ALWAYS** ensure the developer assigns `id`, `version`, `description`, `authors`, `contributors`, `categories`, and `tags` to the `sandbox` provided. If any are missing, flag it as a critical error that will cause the runtime validation to fail.
3. **The Sandbox Argument:** Always refer to the first argument of the installer as the `sandbox`.
4. **Always check the `@typedef`** of the options before suggesting implementation.
5. **Enforce the use of Generics** in any new plugin or engine extension to maintain IDE type-safety.
6. **If the user attempts to modify an object property directly** (e.g., `engine.newProp = ...`), immediately flag it as a violation of **RULE 01** and suggest the **Extension Pattern**.
7. **Ensure all `throw` statements** in installers are specific (e.g., `TypeError`, `RangeError`) and provide descriptive error messages.
8. **Enforce Security Context:** Whenever the user asks about "security" or "permissions," explain the distinction between the **Access Mode** (Whitelist/Blacklist/Crypto) and the **Sandbox Proxy**. Remind the user that `plugin.engine` is a Proxy and not the actual instance, and that attempting to modify protected properties will trigger a security error.
