# 🚀 TinyRouter Documentation

`TinyRouter` is a lightweight, framework-agnostic JavaScript router designed for managing client-side navigation. It allows developers to map URL paths to specific functions, handle dynamic parameters, and manage browser history seamlessly.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Getting Started](#getting-started)
4. [API Reference](#api-reference)
    - [Constructor](#constructor)
    - [Route Management](#route-management)
    - [Navigation](#navigation)
    - [Lifecycle Management](#lifecycle-management)
5. [Advanced Configuration](#advanced-configuration)
6. [Error Handling](#error-handling)

---

## 🌟 Overview

When building Single Page Applications (SPAs), the URL needs to change when the user "moves" between views, even though the page doesn't actually reload. `TinyRouter` listens to the browser's `popstate` event and matches the current URL against a list of registered routes to execute the correct logic.

## ✨ Key Features

*   **🧩 Flexible Route Definition:** Define routes using simple strings (e.g., `'/user/:id'`) or complex regular expressions.
*   **🏎️ Lightweight:** No external dependencies.
*   **🛠️ Debugging Support:** Integrated with `TinyDebugger` for easy troubleshooting.
*   **🔄 History Management:** Full support for `pushState`, `back()`, `forward()`, and `go()`.
*   **📡 Lifecycle Hooks:** Hooks for route changes (`onRouteChanged`) and missing routes (`onRouteNotFound`).

---

## 🚀 Getting Started

To use the router, you need to instantiate it, define your routes, and then call the `.start()` method.

### Basic Example

```javascript
import TinyRouter from 'tiny-essentials/libs/router/TinyRouter';

// 1. Initialize the router
const router = new TinyRouter({
  debugMode: true,
  onRouteChanged: (match) => console.log('Navigated to:', match.path)
});

// 2. Register routes
router.add('/home', () => {
  console.log('Welcome to the Home Page!');
});

router.add('/user/:id', (match) => {
  console.log(`Viewing user with ID: ${match.params.id}`);
  console.log(`Query params:`, match.query);
});

// 3. Start the router (Crucial for deep-linking support)
router.start();

// 4. Navigate programmatically
router.navigate('/user/42?theme=dark');
```

---

## 📖 API Reference

### 🏗️ Constructor

`new TinyRouter(options)`

Initializes the router instance.

| Property | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `debugMode` | `boolean` | `false` | Enables internal debug logging. |
| `useLogColors` | `boolean` | `false` | Enables colored console output. |
| `detectHistoryChange` | `boolean` | `true` | If `true`, ensures the URL actually changed before resolving navigation. |
| `logger` | `Console` | `console` | A custom logger object. |
| `onRouteChanged` | `RouteCallback` | `() => {}` | Executed when a route matches successfully. |
| `onRouteNotFound` | `RouteNotFoundCallback` | `() => {}` | Executed when the current URL matches no registered routes. |

---

### 🛤️ Route Management

#### `.add(patternOrOptions, callback)`
Registers a new route.

*   **Option A: Simple String**
    `router.add('/profile/:username', callback);`
    Uses default segment extraction.
*   **Option B: Advanced Object**
    `router.add({ pattern: '/post/:id', searchValue: /:id/, replaceValue: ... }, callback);`
    Allows custom regex logic via `SegmentExtractor`.

**Throws:**
*   `TypeError`: If arguments are invalid.
*   `Error`: If the pattern is already registered.

#### `.remove(pathPattern)`
Removes a route by its string pattern.

#### `.has(pathPattern)`
Returns `true` if the pattern is already registered.

#### `.clear()`
Removes all registered routes from the router.

---

### 🧭 Navigation

#### `.navigate(path, state = {})`
Moves the browser to a new URL.
*   **`path`**: The target string (e.g., `'/settings'`).
*   **`state`**: An object to store in the browser history.

#### `.go(delta)`
Moves through the history stack.
*   **`delta`**: Integer (e.g., `-1` for back, `1` for forward).

#### `.back()` / `.forward()`
Convenience methods for `go(-1)` and `go(1)`.

---

### ⚙️ Lifecycle Management

#### `.start()`
**Important:** You must call this to activate the router. It resolves the current URL immediately so that if a user refreshes a page on a specific URL, the router can match the correct route.

#### `.stop()`
Stops the router and removes the `popstate` event listener to prevent memory leaks.

---

## 🛠️ Advanced Configuration

### Custom Regex Matching
If the standard `:param` syntax is not enough, you can use the object configuration in `.add()`:

```javascript
router.add({
  pattern: '/files/([0-9]+).pdf', // The path template
  searchValue: /([0-9]+)/,         // The regex to find the dynamic part
  replaceValue: (match) => match[1] // How to extract the value
}, (match) => {
  console.log('File ID:', match.params.id);
});
```

### Global Callbacks
You can define global logic that runs every time the URL changes:

```javascript
const router = new TinyRouter({
  onRouteChanged: (match) => {
    // Update the page title dynamically
    document.title = `App - ${match.path}`;
  },
  onRouteNotFound: ({ path }) => {
    // Redirect to 404 or show a custom error UI
    console.error(`404: ${path} not found`);
  }
});
```

---

## ⚠️ Error Handling

`TinyRouter` uses strict validation to ensure stability.

*   **`TypeError`**: Thrown when you pass the wrong data type (e.g., passing a number where a string is expected in `.add()`).
*   **`Error`**: Thrown when attempting to register a duplicate route or starting a router that is already running.
