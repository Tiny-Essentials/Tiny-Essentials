# Documentation Menu

Welcome to the documentation! This is the central hub for exploring all available resources.

Here, you can navigate through different sections of the project. Below are the main directories:

---

## 📚 Main Directories

### 1. **`basics/`** This folder contains the core scripts we have worked on so far. Each file is a module focused on specific functionality.

- 📦 **[Array](./basics/array.md)** — A tiny utility for shuffling arrays using the Fisher–Yates algorithm.
- ⏰ **[Clock](./basics/clock.md)** — A versatile time utility module for calculating and formatting time durations.
- 🧠 **[ObjFilter](./basics/objFilter.md)** — Type detection, extension, and analysis made easy with simple and extensible type validation.
- 🔍 **[jsonFilter](./basics/jsonFilter.md)** — High-precision utilities for filtering objects, arrays, and complex data structures like Maps and Sets.
- 🧮 **[objChecker](./basics/objChecker.md)** — Utilities for counting keys in objects or arrays and for safely detecting plain JSON-compatible objects.
- 🔢 **[SimpleMath](./basics/simpleMath.md)** — A collection of simple math utilities for calculations like the Rule of Three and percentages.
- ✍️ **[Text](./basics/text.md)** — A utility for transforming text into title case formats, with multiple options for capitalization.
- 🔄 **[AsyncReplace](./basics/asyncReplace.md)** — Asynchronously replaces matches in a string using a regex and an async function.
- 🖼️ **[Html](./basics/html.md)** — Utilities for handling DOM element interactions like collision detection and basic element manipulation.
- 📺 **[FullScreen](./basics/fullScreen.md)** — A complete fullscreen API manager with detection, event handling, and cross-browser compatibility.
- 🧱 **[Collision](./basics/collision.md)** — Full-featured rectangle collision detection system with directional analysis, depth calculation, and center offset metrics.
- 🎵 **[MediaContent](./basics/mediaContent.md)** — A comprehensive media processing module for downloading audio, extracting rich ID3 metadata, and managing image blobs for album art.
- 📦 **[BrowserDetector](./basics/browserDetector.md)** — A multi-layered JavaScript utility for identifying the user's web browser and rendering engine.
- 🔐 **[Crypto](./basics/crypto.md)** — A lightweight utility for generating cryptographic hashes (e.g., SHA-256) using the Web Crypto API.
- 🔁 **[PromiseUtils](./basics/promiseUtils.md)** — Promise helpers such as `waitForTrue` and `createSingletonTask` for polling and single-flight async tasks.

#### 1.1. **`basics/deprecated`**

- 🌐 **[Html (deprecated)](./basics/deprecated/html.md)** — Legacy HTML helpers, including `fetchTemplate` for remote data loading with retries, timeouts, and abort support.
- 🔍 **[ObjFilter (deprecated)](./basics/deprecated/objFilter.md)** — Legacy `objType` type detection and validation helper.

### 2. **`libs/`**

### 2.1. **`libs/storage`**

- 📦 **[TinyLocalStorage](./libs/storage/TinyLocalStorage.md)** — A tiny wrapper for `localStorage` with full support for objects, arrays, `Map`, `Set`, and typed value helpers like string, number, and boolean.
- 🗃️ **[TinyMapCache](./libs/storage/TinyMapCache.md)** — A lightweight, event-driven, in-memory cache manager with TTL expiration, deep cloning, and a familiar `Map`-like iteration API.
- 🗄️ **[TinySetMapDatabase](./libs/storage/TinySetMapDatabase.md)** — Persistent `Set` and `Map` collections backed by IndexedDB, with a tiny promise-based API and schema migrations.

### 2.2. **`libs/utils`**

- 🗂️ **[TinyPromiseQueue](./libs/utils/TinyPromiseQueue.md)** — A class that allows sequential execution of asynchronous tasks, supporting task delays, cancellation, and queue management.
- 🍮 **[UltraRandomMsgGen](./libs/utils/UltraRandomMsgGen.md)** — A whimsical random message generator using grammar templates, word sets, emojis, and chaotic modes to craft playful text outputs.
- 🧩 **[TinyCloner](./libs/utils/TinyCloner.md)** — A highly modular, plugin-based deep cloning engine with strict validation, global/instance control, and isolation mode.
- 🚦 **[TinyThrottledApi](./libs/utils/TinyThrottledApi.md)** — A professional-grade utility for concurrency control and rate throttling of asynchronous API calls.

### 2.3. **`libs/game`**

- 🏅 **[TinyLevelUp](./libs/game/TinyLevelUp.md)** — A class to manage user level-up logic based on experience points, providing methods for experience validation, addition, removal, and calculation.
- 🎮 **[TinyGamepad](./libs/game/TinyGamepad.md)** — A flexible, professional gamepad and input manager supporting keyboard, mouse, combos, haptics, and custom input mappings.
- 🌞 **[TinyDayNightCycle](./libs/game/TinyDayNightCycle.md)** — A comprehensive day-night cycle system managing seasons, moons, time, and weather with configurable durations, phases, and dynamic weather selection.
- 📦 **[TinyInventory](./libs/game/TinyInventory.md)** — A robust inventory management system with stack handling, slot management, special equipment slots, serialization, cloning, and item registry support.
- 🤝 **[TinyInventoryTrader](./libs/game/TinyInventoryTrader.md)** — A trading helper for safely transferring items between two inventories with support for strict mode, slot targeting, and batch operations.
- 🎮 **[TinyNeedBar](./libs/game/TinyNeedBar.md)** — A versatile "need bar" system for simulating decay over time with multiple configurable factors, serialization, cloning, and full control over clamped and infinite values.

### 2.4. **`libs/color`**

- 🎨 **[ColorSafeStringify](./libs/color/ColorSafeStringify.md)** — A utility for applying customizable ANSI colors to JSON strings in terminal outputs, supporting presets and fine-grained type-based highlighting.
- 🌈 **[TinyColorConverter](./libs/color/TinyColorConverter.md)** — A complete color conversion toolkit supporting hex, RGB(A), HSL(A), and integer formats, with smooth gradient generation, color parsing, and multi-format output conversion.
- 🎨 **[TinyColorValidator](./libs/color/TinyColorValidator.md)** — A comprehensive CSS color validation and parsing utility supporting HEX, HEXA, RGB, RGBA, HSL, HSLA, HWB, Lab, LCH, standard HTML color names, and special keywords, with automatic type detection and parsing.

### 2.5. **`libs/math`**

- 🚦 **[TinyRateLimiter](./libs/math/TinyRateLimiter.md)** — A flexible per-user rate limiter supporting time windows, hit caps, and automatic cleanup of inactive users.
- ⏳ **[TinyTimeout](./libs/math/TinyTimeout.md)** — A dynamic timeout and delay manager with support for usage-based throttling, delay scaling, configurable decay intervals, and asynchronous polling for conditions.
- 🎯 **[TinyAdvancedRaffle](./libs/math/TinyAdvancedRaffle.md)** — An advanced, seedable raffle system with weighted items, pity systems, exclusions, group management, modifiers, conditional rules, normalization modes, and JSON import/export.
- 🎲 **[TinySimpleDice](./libs/math/TinySimpleDice.md)** — A lightweight and flexible dice rolling utility with configurable maximum values, zero allowance, and array/Set index rolling support.
- 🧠 **[TinyMamdaniInferenceSystem](./libs/math/TinyMamdaniInferenceSystem.md)** — A implementation of a Mamdani Inference System, allowing you to model logic using trapezoidal membership functions.

### 2.6. **`libs/text`**

- 📋 **[TinyClipboard](./libs/text/TinyClipboard.md)** — A clipboard management utility with support for modern APIs, legacy fallbacks, and custom copy handlers for text and blobs, plus flexible read operations and clipboard item filtering.
- ✍️ **[TinyTextRangeEditor](./libs/text/TinyTextRangeEditor.md)** — An flexible text range manipulation utility for `input` and `textarea` elements. Supports selection, cursor control, tag insertion, attribute handling, inline editing, formatting, and advanced wrap/toggle logic with optional spacing auto-completion.
- ✨ **[TinyTextarea](./libs/text/TinyTextarea.md)** — A minimal auto-expanding `<textarea>` manager with configurable row limits, extra height padding, and real-time resize/input event hooks.
- 🌐 **[TinyI18](./libs/text/TinyI18.md)** — A flexible i18n manager supporting local and file modes, regex-based keys, function-based entries, string interpolation, and safe helper functions for advanced rendering.
- 📝 **[TinyTextDiffer](./libs/text/TinyTextDiffer.md)** — A granular text comparison utility using the LCS algorithm to detect additions, deletions, and unchanged segments between multiple history versions, returning a clean, parseable diff structure.

### 2.7. **`libs/html`**

- 👀 **[TinyElementObserver](./libs/html/TinyElementObserver.md)** — A DOM mutation tracking utility built on MutationObserver, with customizable detectors for handling changes, event dispatching, and lifecycle management. 
- 🕒 **[TinyDomReadyManager](./libs/html/TinyDomReadyManager.md)** — A readiness manager for DOM and async conditions, supporting prioritized callbacks, custom filters, and event-based or promise-based bootstrapping.
- 🧱 **[TinyHtml](./libs/html/TinyHtml.md)** — A minimalist DOM utility class that offers jQuery-like methods in pure JavaScript for querying, styling, traversing, event handling, collision detection, and visibility logic — all in a lightweight and chainable interface.

#### 2.7.1. **`libs/html/notification`**

- 🔔 **[TinyNotifyCenter](./libs/html/notification/TinyNotifyCenter.md)** — A dynamic notification center class to display, manage, and interact with notifications, supporting avatars, clickable items, HTML/text modes, and clean UI controls.
- 🍞 **[TinyToastNotify](./libs/html/notification/TinyToastNotify.md)** — A lightweight toast notification system supporting positioning, timing customization, avatars, click actions, and fade-out animations.
- 📣 **[TinyNotifications](./libs/html/notification/TinyNotifications.md)** — A browser notification utility with sound support, permission management, truncation logic, default icons, and enforced validation to ensure safe and predictable usage.

#### 2.7.2. **`libs/html/drag`**

- 📥 **[TinyDragDropDetector](./libs/html/drag/TinyDragDropDetector.md)** — A lightweight drag-and-drop detector for files, handling the full drag lifecycle (`enter`, `over`, `leave`, `drop`) with CSS hover management and safe event handling on any DOM element or the full page.
- 🧲 **[TinyDragger](./libs/html/drag/TinyDragger.md)** — A flexible drag-and-drop manager with collision detection, jail constraints, vibration feedback, visual proxies, revert-on-drop, and full custom event support.

#### 2.7.3. **`libs/html/upload`**

- 📂 **[TinyUploadClicker](./libs/html/upload/TinyUploadClicker.md)** — A minimal utility to bind any clickable element to a hidden file input, offering full control over styling, behavior, and upload event hooks.

#### 2.7.4. **`libs/html/scroll`**

- 🌀 **[TinySmartScroller](./libs/html/scroll/TinySmartScroller.md)** — A smart scroll monitor that detects user scroll behavior, visibility changes, element sizes, and automatically handles scroll preservation, bottom detection, debounce, and more.
- 📜 **[TinyAfterScrollWatcher](./libs/html/scroll/TinyAfterScrollWatcher.md)** —  A minimalistic scroll watcher that queues and executes functions **after scrolling has stopped** on a given element or the window.

#### 2.7.5. **`libs/html/events`**

- 🖼️ **[TinyIframeEvents](./libs/html/events/TinyIframeEvents.md)** — A structured `postMessage`-based event router for secure and reliable communication between a parent window and its embedded iframe. Supports directional filtering, origin enforcement, payload transport, and listener lifecycle.
- 🪟 **[TinyNewWinEvents](./libs/html/events/TinyNewWinEvents.md)** — A smart, route-based `postMessage` system for structured communication between a main window and a popup (`window.open`). Includes queueing, origin enforcement, and lifecycle tracking.

#### 2.7.6. **`libs/html/templates`**

- ⏳ **[TinyLoadingScreen](./libs/html/templates/TinyLoadingScreen.md)** — A lightweight, fully-configurable loading overlay with fade-in/out animations, custom messages (string or HTMLElement), HTML rendering option, and status-change callbacks.
- 🕒 **[TinyAnalogClock](./libs/html/templates/TinyAnalogClock.md)** — A lightweight analog clock engine for managing time-based rotations, supporting custom offsets, smooth transitions, and easy binding to CSS variables rendering.
- 🍪 **[TinyCookieConsent](./libs/html/templates/TinyCookieConsent.md)** — A flexible and customizable cookie consent manager that displays a consent bar, supports multiple categories, saves preferences in localStorage, allows custom renderers, and provides smooth animations for showing and hiding elements. 

### 2.8. **`libs/array`**

- 📄 **[TinyArrayPaginator](./libs/array/TinyArrayPaginator.md)** — A secure and flexible array pagination wrapper that returns paginated results along with metadata, supports filtering via predicates or object-based matching, and prevents direct modification of the source data.  
- 🔍 **[TinyArrayComparator](./libs/array/TinyArrayComparator.md)** — A lightweight, highly optimized JavaScript utility class designed to compare two arrays and efficiently detect which items were **added** or **deleted**.

### 2.9. **`libs/media`**

- 📻 **[TinyRadioFm](./libs/media/TinyRadioFm.md)** — It is designed to handle complex playback sequences, including music and voice playlists, scheduled timeline mutations, and custom content injections, all while maintaining absolute reproducibility through a mathematical seed.
- ⏯️ **[TinyMediaPlayer](./libs/media/TinyMediaPlayer.md)** — A universal media player architecture utilizing an adapter pattern to orchestrate multiple platform APIs, featuring robust playlist management, playback controls, and weighted random selection.

### 2.10. **`libs/tools`**

- 🛠️ **[TinyDebugger](./libs/tools/TinyDebugger.md)** — A lightweight, event-driven debugging utility designed to wrap standard `console` methods. It provides enhanced features such as custom prefixes, color support, and the ability to emit events whenever a log occurs, making it perfect for complex applications where you might want to redirect logs to an external service or a UI component.
- 📦 **[TinyPkgExportValidator](./libs/tools/TinyPkgExportValidator.md)** — A utility to validate that all paths defined in the `"exports"` field of `package.json` exist physically within the project directory.
- 🌐 **[TinyBrowserMonitor](./libs/tools/TinyBrowserMonitor.md)** — A lightweight, high-performance utility that provides real-time insights into a user's network environment and device performance.
- 🛠️ **[TinyHtmlTagRegexBuilder](./libs/tools/TinyHtmlTagRegexBuilder.md)** — A utility that makes parsing specific HTML tags with Regular Expressions structured, predictable, and easy to manage.
- 🛡️ **[TinyPasswordValidator](./libs/tools/TinyPasswordValidator.md)** — A lightweight, robust, and highly customizable utility for validating password strength and security requirements with detailed feedback.
- 🧩 **[TinyUriParser](./libs/tools/TinyUriParser.md)** — A lightweight, highly extensible engine that transforms complex URI strings (like Matrix protocol URIs) into structured objects and back again.
- 📦 **[TinyHttpResponseRegistry](./libs/tools/TinyHttpResponseRegistry.md)** — A robust, immutable, and internationalized registry for managing HTTP status codes, names, summaries, and descriptions.
- 🗺️ **[TinySiteMap](./libs/tools/TinySiteMap.md)** — A robust, secure, and lightweight service to manage and generate XML sitemaps or sitemap indexes with automatic namespace and security handling.
- 🗺️ **[TinySiteMapStream](./libs/tools/TinySiteMapStream.md)** — A high-performance Node.js Transform stream designed for generating XML sitemaps incrementally.
- 🛡️ **[TinyURLSecurityVerifier](./libs/tools/TinyURLSecurityVerifier.md)** — A specialized tool designed to protect applications from malicious URL-based attacks such as XSS, phishing, and credential theft.

#### 2.10.1. **`libs/tools/TinyClassManager`**

- ⚙️ **[TinyClassManager](./libs/tools/TinyClassManager.md)** — A lightweight, immutable manager designed to linearly compose a base class with multiple modular plugins, featuring automatic dependency verification and duplicate conflict protection.
- 🛠️ **[TinyPluginInliner](./libs/tools/TinyClassManager/TinyPluginInliner.md)** — A powerful build-time utility that inlines plugin code into a single bundle, automatically rewriting import paths and hoisting dependencies for seamless deployment.

#### 2.10.2. **`libs/tools/TinyUriParser`**

- 🧩 **[MatrixProtocol](./libs/tools/TinyUriParser/MatrixProtocol.md)** — Matrix protocol URI parsing support for `TinyUriParser`.
- 🎮 **[Discord](./libs/tools/TinyUriParser/Discord.md)** — Discord URI parsing support for `TinyUriParser`.

### 2.11. **`libs/fs`**

- 🗄️ **[TinyFS](./libs/fs/TinyFS.md)** — A tiny, dependency-free, `node:fs/promises`-compatible file system core written in pure ESM JavaScript.
- 🗂️ **[TinyOPFSFileSystem](./libs/fs/TinyOPFSFileSystem.md)** — An Origin Private File System (OPFS) backend for `TinyFSCore`, running in the browser.
- 🪣 **[TinyStorageBucketFileSystem](./libs/fs/TinyStorageBucketFileSystem.md)** — A `TinyFSCore` backend that scopes the entire file system to a single Storage Bucket.

### 2.12. **`libs/plugin`**

- 🔌 **[TinyPlugin](./libs/plugin/TinyPlugin.md)** — A complete plugin system providing the core classes and types for building extensible applications.
- 📦 **[TinyVersion](./libs/plugin/TinyVersion.md)** — A lightweight, precise utility to parse and compare Semantic Versioning (SemVer) strings with strict validation.

### 2.13. **`libs/router`**

- 🚀 **[TinyRouter](./libs/router/TinyRouter.md)** — A lightweight, framework-agnostic client-side router that maps URL paths to functions, handles dynamic parameters, and manages browser history.

### 2.14. **`libs/sw`**

#### 2.14.1. **`libs/sw/service`**

- 🚀 **[TinyServiceWorkerEngine](./libs/sw/service/TinyServiceWorkerEngine.md)** — A professional-grade engine that manages fetch interception, messaging communication, and lifecycle for Service Workers.
- 📬 **[TinyPushRouter](./libs/sw/service/TinyPushRouter.md)** — A tiny, transport-agnostic router that sends normalized push messages to the right handler.

##### Plugins

- 🚀 **[GlobCachePlugin](./libs/sw/service/plugins/GlobCachePlugin.md)** — Manages runtime caching using glob patterns instead of complex Regular Expressions.
- 🧩 **[GlobBypassPlugin](./libs/sw/service/plugins/GlobBypassPlugin.md)** — Skips router validation for requests whose pathname matches a set of glob patterns.
- 🗂️ **[TabManager](./libs/sw/service/plugins/TabManager.md)** — A robust synchronization system that maintains a single source of truth for all open browser tabs.
- 📡 **[Ping](./libs/sw/service/plugins/Ping.md)** — A lightweight utility to verify that the `TinyServiceWorkerEngine` is communicating correctly.
- ⚡ **[ViteFileDetector](./libs/sw/service/plugins/ViteFileDetector.md)** — Identifies and bypasses Vite-specific network requests so HMR is not interrupted by the Service Worker.

##### Shared

- 📬 **[TinyPushPayload](./libs/sw/service/shared/TinyPushPayload.md)** — A tiny, isomorphic contract for Web Push messages shared between the Service Worker and the page.

#### 2.14.2. **`libs/sw/browser`**

- 🚀 **[TinyServiceWorker](./libs/sw/browser/TinyServiceWorker.md)** — A professional-grade utility that simplifies Service Worker registration, PWA lifecycle management, and bidirectional messaging.
- 📬 **[TinyPushManager](./libs/sw/browser/TinyPushManager.md)** — A framework-agnostic, zero-dependency wrapper around the browser Push API that owns the full `PushSubscription` lifecycle.
- 🔔 **[TinyNotificationAdapter](./libs/sw/browser/TinyNotificationAdapter.md)** — A single adapter that normalizes notification options between the Service Worker and the page.
- 🗂️ **[TabManager](./libs/sw/browser/plugins/TabManager.md)** — A robust, persistent, and synchronized way to track, manage, and communicate with multiple browser tabs through a Service Worker.

### 2.15. **`libs/worker`**

- 🚀 **[TinyWebWorkerEngine](./libs/worker/engine/TinyWebWorkerEngine.md)** — A robust, lightweight engine that manages communication between the main thread and a Web Worker with structured messaging and a request-response API.
- 🧵 **[TinyWebWorker](./libs/worker/browser/TinyWebWorker.md)** — A tiny, strictly-typed wrapper around the native `Worker` API with a built-in request/response (RPC) layer, lifecycle management, and a plugin system.

### 3. **`regexp/`**

- 📧 **[Email](./regexp/Email.md)** — A robust, highly configurable utility for validating email addresses and extracting them from text.
- 🌟 **[Glob](./regexp/Glob.md)** — A professional-grade utility that bridges human-readable GLOB patterns and JavaScript Regular Expressions.
- 🌐 **[IPv4](./regexp/IPv4.md)** — A lightweight, high-performance module to validate and extract IPv4 addresses.
- 🌐 **[IPv6](./regexp/IPv6.md)** — A lightweight utility for validating and extracting IPv6 addresses using optimized Regular Expressions.
- 🛠️ **[SegmentExtractor](./regexp/SegmentExtractor.md)** — Transforms string-based path patterns (like `/user/:id`) into efficient regular expressions for extracting dynamic parameters.
- 🌐 **[UrlDetector](./regexp/UrlDetector.md)** — A robust and highly customizable utility for building, validating, and extracting URLs using precise Regular Expressions.

#### 3.1. **`regexp/Username`**

- 🛠️ **[Base](./regexp/Username/Base.md)** — A robust, highly configurable utility to generate regular expressions for validating, finding, and extracting usernames.
- 🎮 **[Discord](./regexp/Username/Discord.md)** — A declarative catalog of 35 regular-expression templates that describe Discord's markup, mentions, links, and CDN assets.
- 🧩 **[MatrixProtocol](./regexp/Username/MatrixProtocol.md)** — A battle-tested collection of Regular Expression templates for parsing Matrix identifiers: users, rooms, events, and groups.

### 4. **`webTemplates/`**

#### 4.1. **`webTemplates/bootstrap/`**

- 🖼️ **[BootstrapDialogs](./webTemplates/bootstrap/5.3/html/BootstrapDialogs.md)** — An asynchronous JavaScript utility designed to replace native browser dialogs with customizable Bootstrap 5 Modals.

#### 4.2. **`webTemplates/vite/`**

- 🚀 **[TinyVitePwaPlugin](./webTemplates/vite/7.3/plugins/TinyVitePwaPlugin.md)** — A plugin that makes Progressive Web App integration seamless within a Vite-based project.
- 🚀 **[githubUtils](./webTemplates/vite/7.3/plugins/githubUtils.md)** — A lightweight Vite plugin for deploying Single Page Applications (SPAs) to GitHub Pages.

#### 4.3. **`webTemplates/media/`**

- 🛡️ **[MediaValidator (Node)](./webTemplates/media/MediaValidator/v1/Node.md)** — A multi-layered validation toolkit that ensures file integrity and prevents MIME-spoofing exploits.
- 🛡️ **[MediaValidator (Browser)](./webTemplates/media/MediaValidator/v1/Browser.md)** — MediaShield: a robust, multi-layered media validation library for images, audio, and video.

#### 4.4. **`webTemplates/multiformats/`**

- 🧬 **[IPFSHasher](./webTemplates/multiformats/14.0/IPFSHasher.md)** — Generate IPFS Content Identifiers (CIDs) locally, in pure JavaScript, without running an IPFS node.

#### 4.5. **`webTemplates/ag-psd/`**

- 🎨 **[ProcessSolidFilters](./webTemplates/ag-psd/31.0/ProcessSolidFilters.md)** — Extract solid colors from PSD layers, generate separated images per filter, and get pixel statistics in Node.js and the browser.

### 5. **`fileManager/`**

- 📁 **[Main](./fileManager/main.md)** — A Node.js file/directory utility module with support for JSON, backups, renaming, size analysis, and more.

---

## 📚 Tip Directories

### 1. **`libs/`** - 🧱 **[TinyHtml](./libs/html/TinyHtmlTips.md)** — Usage examples and practical tips.

---

## 🔌 Want to Extend These Libraries?

Did you find a class in our `libs/` that *almost* perfectly fits your needs, but you want to add your own custom features, modules, or plugins to it? 

We highly recommend using **[⚙️ TinyClassManager](./libs/tools/TinyClassManager.md)**! It was specifically built for this purpose. It allows you to safely and cleanly inject your own plugins into our existing classes using a linear mixin architecture, automatically handling dependencies and preventing conflicts without you ever having to touch the original source code.

---

## 🚀 Usage

To get started, navigate to the appropriate directory and explore the files listed. Each script includes detailed documentation on how to use the respective functionality.

👉 For a complete overview of all available entry points and modules, please check out the [**exports**](./Exports.md) file. It provides a detailed map of the package’s `exports` and helps you import exactly what you need.

---

## 🍴 TinyFork CLI

Want to extract only specific modules, classes, or functions into your project without carrying the whole library? We built a powerful AST-based CLI specifically for this!

👉 Discover how to use our smart tree-shaking tool by visiting the [**TinyFork CLI Documentation**](../TinyFork.md) for important usage information and commands.

---

## 📖 More Regex Goodies

Looking for practical regex examples and migration helpers?

👉 Check out the **[`Regex-Helpers`](Regex-Helpers.md)** file for a full collection of ready-to-use regex transformations!

---

## 📑 Contributing

Feel free to suggest changes, improvements, or additional features. You can fork the repository and submit a pull request!

---

## 📘 Want to Know How I Use AI in My Projects?

If you're curious about how I integrate AI into my development workflow — including how I manage prompts, avoid context drift, and keep full control over logic and documentation — all related guides have been moved to a dedicated documentation space.

✨ **Visit the Tiny-Essentials documentation hub here:**

👉 [https://github.com/Tiny-Essentials/Tiny-AI-Workflow](https://github.com/Tiny-Essentials/Tiny-AI-Workflow)
