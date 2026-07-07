# Documentation Menu

Welcome to the documentation! This is the central hub for exploring all available resources.

Here, you can navigate through different sections of the project. Below are the main directories:

---

## 📚 Main Directories

### 1. **`basics/`** This folder contains the core scripts we have worked on so far. Each file is a module focused on specific functionality.

- 📦 **[Array](./basics/array.md)** — A tiny utility for shuffling arrays using the Fisher–Yates algorithm.
- ⏰ **[Clock](./basics/clock.md)** — A versatile time utility module for calculating and formatting time durations.
- 🧠 **[ObjFilter](./basics/objFilter.md)** — Type detection, extension, and analysis made easy with simple and extensible type validation.
* 🧮 **[objChecker](./basics/objChecker.md)** — Utilities for counting keys in objects or arrays and for safely detecting plain JSON-compatible objects.
- 🔢 **[SimpleMath](./basics/simpleMath.md)** — A collection of simple math utilities for calculations like the Rule of Three and percentages.
- ✍️ **[Text](./basics/text.md)** — A utility for transforming text into title case formats, with multiple options for capitalization.
- 🔄 **[AsyncReplace](./basics/asyncReplace.md)** — Asynchronously replaces matches in a string using a regex and an async function.
- 🖼️ **[Html](./basics/html.md)** — Utilities for handling DOM element interactions like collision detection and basic element manipulation.
- 📺 **[FullScreen](./basics/fullScreen.md)** — A complete fullscreen API manager with detection, event handling, and cross-browser compatibility.
- 🧱 **[Collision](./basics/collision.md)** — Full-featured rectangle collision detection system with directional analysis, depth calculation, and center offset metrics.
- 🎵 **[MediaContent](./basics/mediaContent.md)** — A comprehensive media processing module for downloading audio, extracting rich ID3 metadata, and managing image blobs for album art.

### 2. **`libs/`**
- 🗂️ **[TinyPromiseQueue](./libs/TinyPromiseQueue.md)** — A class that allows sequential execution of asynchronous tasks, supporting task delays, cancellation, and queue management.
- 🏅 **[TinyLevelUp](./libs/TinyLevelUp.md)** — A class to manage user level-up logic based on experience points, providing methods for experience validation, addition, removal, and calculation.
- 🎨 **[ColorSafeStringify](./libs/ColorSafeStringify.md)** — A utility for applying customizable ANSI colors to JSON strings in terminal outputs, supporting presets and fine-grained type-based highlighting.
- 🚦 **[TinyRateLimiter](./libs/TinyRateLimiter.md)** — A flexible per-user rate limiter supporting time windows, hit caps, and automatic cleanup of inactive users.
- 🔔 **[TinyNotifyCenter](./libs/TinyNotifyCenter.md)** — A dynamic notification center class to display, manage, and interact with notifications, supporting avatars, clickable items, HTML/text modes, and clean UI controls.
- 🍞 **[TinyToastNotify](./libs/TinyToastNotify.md)** — A lightweight toast notification system supporting positioning, timing customization, avatars, click actions, and fade-out animations.
- 📥 **[TinyDragDropDetector](./libs/TinyDragDropDetector.md)** — A lightweight drag-and-drop detector for files, handling the full drag lifecycle (`enter`, `over`, `leave`, `drop`) with CSS hover management and safe event handling on any DOM element or the full page.
- 📂 **[TinyUploadClicker](./libs/TinyUploadClicker.md)** — A minimal utility to bind any clickable element to a hidden file input, offering full control over styling, behavior, and upload event hooks.
- 🧲 **[TinyDragger](./libs/TinyDragger.md)** — A flexible drag-and-drop manager with collision detection, jail constraints, vibration feedback, visual proxies, revert-on-drop, and full custom event support.
- 🕒 **[TinyDomReadyManager](./libs/TinyDomReadyManager.md)** — A readiness manager for DOM and async conditions, supporting prioritized callbacks, custom filters, and event-based or promise-based bootstrapping.
- 📣 **[TinyNotifications](./libs/TinyNotifications.md)** — A browser notification utility with sound support, permission management, truncation logic, default icons, and enforced validation to ensure safe and predictable usage.
- 🧱 **[TinyHtml](./libs/TinyHtml.md)** — A minimalist DOM utility class that offers jQuery-like methods in pure JavaScript for querying, styling, traversing, event handling, collision detection, and visibility logic — all in a lightweight and chainable interface.
- 🌀 **[TinySmartScroller](./libs/TinySmartScroller.md)** — A smart scroll monitor that detects user scroll behavior, visibility changes, element sizes, and automatically handles scroll preservation, bottom detection, debounce, and more.
- 📋 **[TinyClipboard](./libs/TinyClipboard.md)** — A clipboard management utility with support for modern APIs, legacy fallbacks, and custom copy handlers for text and blobs, plus flexible read operations and clipboard item filtering.
- 🍮 **[UltraRandomMsgGen](./libs/UltraRandomMsgGen.md)** — A whimsical random message generator using grammar templates, word sets, emojis, and chaotic modes to craft playful text outputs.
- ✍️ **[TinyTextRangeEditor](./libs/TinyTextRangeEditor.md)** — An flexible text range manipulation utility for `input` and `textarea` elements. Supports selection, cursor control, tag insertion, attribute handling, inline editing, formatting, and advanced wrap/toggle logic with optional spacing auto-completion.
- ⏳ **[TinyTimeout](./libs/TinyTimeout.md)** — A dynamic timeout and delay manager with support for usage-based throttling, delay scaling, configurable decay intervals, and asynchronous polling for conditions.
- 🌈 **[TinyColorConverter](./libs/TinyColorConverter.md)** — A complete color conversion toolkit supporting hex, RGB(A), HSL(A), and integer formats, with smooth gradient generation, color parsing, and multi-format output conversion.
- 📡 **[TinyEvents](./libs/TinyEvents.md)** — A lightweight and dependency-free event emitter inspired by Node.js, supporting persistent and one-time listeners, listener inspection, and max listener limits.
- 📦 **[TinyLocalStorage](./libs/TinyLocalStorage.md)** — A tiny wrapper for `localStorage` with full support for objects, arrays, `Map`, `Set`, and typed value helpers like string, number, and boolean.
- 🖼️ **[TinyIframeEvents](./libs/TinyIframeEvents.md)** — A structured `postMessage`-based event router for secure and reliable communication between a parent window and its embedded iframe. Supports directional filtering, origin enforcement, payload transport, and listener lifecycle.
- 🪟 **[TinyNewWinEvents](./libs/TinyNewWinEvents.md)** — A smart, route-based `postMessage` system for structured communication between a main window and a popup (`window.open`). Includes queueing, origin enforcement, and lifecycle tracking.
- 🎮 **[TinyGamepad](./libs/TinyGamepad.md)** — A flexible, professional gamepad and input manager supporting keyboard, mouse, combos, haptics, and custom input mappings.
- ✨ **[TinyTextarea](./libs/TinyTextarea.md)** — A minimal auto-expanding `<textarea>` manager with configurable row limits, extra height padding, and real-time resize/input event hooks.
- 🌞 **[TinyDayNightCycle](./libs/TinyDayNightCycle.md)** — A comprehensive day-night cycle system managing seasons, moons, time, and weather with configurable durations, phases, and dynamic weather selection.
- 🎯 **[TinyAdvancedRaffle](./libs/TinyAdvancedRaffle.md)** — An advanced, seedable raffle system with weighted items, pity systems, exclusions, group management, modifiers, conditional rules, normalization modes, and JSON import/export.
- 📄 **[TinyArrayPaginator](./libs/TinyArrayPaginator.md)** — A secure and flexible array pagination wrapper that returns paginated results along with metadata, supports filtering via predicates or object-based matching, and prevents direct modification of the source data. 
- 🍪 **[TinyCookieConsent](./libs/TinyCookieConsent.md)** — A flexible and customizable cookie consent manager that displays a consent bar, supports multiple categories, saves preferences in localStorage, allows custom renderers, and provides smooth animations for showing and hiding elements. 
- 📦 **[TinyInventory](./libs/TinyInventory.md)** — A robust inventory management system with stack handling, slot management, special equipment slots, serialization, cloning, and item registry support.
- 🤝 **[TinyInventoryTrader](./libs/TinyInventoryTrader.md)** — A trading helper for safely transferring items between two inventories with support for strict mode, slot targeting, and batch operations.
- 🌐 **[TinyI18](./libs/TinyI18.md)** — A flexible i18n manager supporting local and file modes, regex-based keys, function-based entries, string interpolation, and safe helper functions for advanced rendering.
- 🎮 **[TinyNeedBar](./libs/TinyNeedBar.md)** — A versatile "need bar" system for simulating decay over time with multiple configurable factors, serialization, cloning, and full control over clamped and infinite values.
- 🎲 **[TinySimpleDice](./libs/TinySimpleDice.md)** — A lightweight and flexible dice rolling utility with configurable maximum values, zero allowance, and array/Set index rolling support.
- 👀 **[TinyElementObserver](./libs/TinyElementObserver.md)** — A DOM mutation tracking utility built on MutationObserver, with customizable detectors for handling changes, event dispatching, and lifecycle management.  
- ⏳ **[TinyLoadingScreen](./libs/TinyLoadingScreen.md)** — A lightweight, fully-configurable loading overlay with fade-in/out animations, custom messages (string or HTMLElement), HTML rendering option, and status-change callbacks.
- 🎨 **[TinyColorValidator](./libs/TinyColorValidator.md)** — A comprehensive CSS color validation and parsing utility supporting HEX, HEXA, RGB, RGBA, HSL, HSLA, HWB, Lab, LCH, standard HTML color names, and special keywords, with automatic type detection and parsing.
* 📝 **[TinyTextDiffer](./libs/TinyTextDiffer.md)** — A granular text comparison utility using the LCS algorithm to detect additions, deletions, and unchanged segments between multiple history versions, returning a clean, parseable diff structure.
* 🕒 **[TinyAnalogClock](./libs/TinyAnalogClock.md)** — A lightweight analog clock engine for managing time-based rotations, supporting custom offsets, smooth transitions, and easy binding to CSS variables rendering.
* 🔍 **[TinyArrayComparator](./libs/TinyArrayComparator.md)** — A lightweight, highly optimized JavaScript utility class designed to compare two arrays and efficiently detect which items were **added** or **deleted**.
* 🧠 **[TinyMamdaniInferenceSystem](./libs/TinyMamdaniInferenceSystem.md)** — A implementation of a Mamdani Inference System, allowing you to model logic using trapezoidal membership functions.
* 🛠️ **[TinyPluginInliner](./libs/TinyPluginInliner.md)** — A powerful build-time utility that inlines plugin code into a single bundle, automatically rewriting import paths and hoisting dependencies for seamless deployment.
* ⚙️ **[TinyClassManager](./libs/TinyClassManager.md)** — A lightweight, immutable manager designed to linearly compose a base class with multiple modular plugins, featuring automatic dependency verification and duplicate conflict protection.

### 3. **`fileManager/`**
* 📁 **[Main](./fileManager/main.md)** — A Node.js file/directory utility module with support for JSON, backups, renaming, size analysis, and more.

---

## 📚 Tip Directories

### 1. **`libs/`** - 🧱 **[TinyHtml](./libs/TinyHtmlTips.md)** — Usage examples and practical tips.

---

## 🔌 Want to Extend These Libraries?

Did you find a class in our `libs/` that *almost* perfectly fits your needs, but you want to add your own custom features, modules, or plugins to it? 

We highly recommend using **[⚙️ TinyClassManager](./libs/TinyClassManager.md)**! It was specifically built for this purpose. It allows you to safely and cleanly inject your own plugins into our existing classes using a linear mixin architecture, automatically handling dependencies and preventing conflicts without you ever having to touch the original source code.

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

👉 [https://github.com/Tiny-Essentials/.github/tree/main/docs](https://github.com/Tiny-Essentials/.github/tree/main/docs)
