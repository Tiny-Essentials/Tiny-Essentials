# 🛎️ TinyNotifyCenter

## Overview

`TinyNotifyCenter` is a notification center component designed to display interactive alerts in the UI.

This class renders a notification overlay on the page, allowing dynamic management of notification items — adding, clearing, and interacting with them in real time.

---

## 🔔 NotifyData Type

A notification entry (`NotifyData`) can be either a simple string or an object with extra data:

```ts
type NotifyData = string | {
  title?: string;                   // Optional title shown above the message
  message: string;                  // Required message content (plain text or HTML)
  avatar?: string;                  // Optional avatar image URL (displayed on the left)
  onClick?: (e: MouseEvent) => void; // Optional click handler for the entire notification
}
```

---

## ✨ Features

* Dynamic rendering of notification UI via the `insertTemplate()` method
* Supports both plain text and HTML content in notifications
* Optional avatars shown alongside notifications
* Supports callback functions on notification click events
* Each notification includes a close button for dismissal
* Displays a badge with the count of active notifications

---

## 🏗️ Static Methods

### `static getTemplate() : string`

Returns the full HTML structure for the notification system as a **string**.

This template includes:

- A hidden `.notify-overlay` element containing the central notification panel (`#notifCenter`):
  - Header with a **"Notifications"** label
  - A **clear all** button (with checkmark icon)
  - A **close** button (×)
- A `.list` container to hold dynamically added notification items
- A bell button (`.notify-bell`) to toggle the notification center, featuring:
  - A bell SVG icon
  - A badge (`#notifBadge`) displaying the number of active notifications

> 💡 This HTML can be injected into the DOM using methods like `insertAdjacentHTML()` or parsed into elements with JavaScript or jQuery.

---

### `static insertTemplate(where = 'afterbegin') : void`

Injects the full notification center HTML template into the `document.body`.

- Uses `insertAdjacentHTML()` to insert the markup.
- The `where` parameter controls the insertion point relative to the `<body>` element.
  
Possible values for `where`:

| Value         | Description                              |
|---------------|------------------------------------------|
| `'afterbegin'` (default) | Insert right after the opening `<body>` tag |
| `'beforeend'`             | Insert right before the closing `</body>` tag |
| `'beforebegin'` or `'afterend'` | Other valid positions supported by `insertAdjacentHTML` |

---

### Example Usage

```js
// Insert notification center template at the start of <body>
TinyNotifyCenter.insertTemplate();

// Or insert at the end of <body>
TinyNotifyCenter.insertTemplate('beforeend');
```

---

### Visual Structure Preview

```html
<div class="notify-overlay hidden">
  <div class="notify-center" id="notifCenter">
    <div class="header">
      <div>Notifications</div>
      <div class="options">
        <button class="clear-all" type="button">✔️</button>
        <button class="close">×</button>
      </div>
    </div>
    <div class="list"></div>
  </div>
</div>

<button class="notify-bell" aria-label="Open notifications">
  🔔 <span class="badge" id="notifBadge">0</span>
</button>
```

---

## 🛠️ Instance Methods & Constructor

### `constructor(options = {})`

Creates a new instance of the Notification Center with configurable main elements.

| Option          | Default Selector                         | Description                                  |
|-----------------|----------------------------------------|----------------------------------------------|
| `center`        | `document.getElementById('notifCenter')` | Container element holding notification list |
| `badge`         | `document.getElementById('notifBadge')`  | Badge element showing the notification count |
| `button`        | `document.querySelector('.notify-bell')` | Button toggling the notification center     |
| `overlay`       | `document.querySelector('.notify-overlay')` | Overlay element shown when center is visible |

⚠️ Throws an error if any of the elements are not valid HTMLElements.

**Event Listeners added internally:**

- `button` click → toggles notification center
- `close` button inside center → closes notification center
- `clear-all` button inside center → clears all notifications
- Clicking the overlay outside center → closes notification center

---

### ⚙️ Configuration Methods

#### `setMarkAllAsReadOnClose(value: boolean)`

Enable or disable automatic marking of all notifications as read when the center closes.

Throws a `TypeError` if `value` is not a boolean.

---

#### `setRemoveDelay(ms: number)`

Set the delay (in milliseconds) for the remove animation when notifications are removed.

Throws an error if `ms` is not a number.

---

### 📋 Notification Item Accessors

#### `getItemMode(index: number) : 'text' | 'html' | null`

Returns the rendering mode (`'text'` or `'html'`) of the notification at the given index, or `null` if not found.

---

#### `getItem(index: number) : HTMLElement`

Returns the notification element at the specified index.

Throws an error if the element is not an `HTMLElement`.

---

#### `hasItem(index: number) : boolean`

Returns `true` if a notification exists at the given index, `false` otherwise.

---

### ✅ Notification State Management

#### `markAsRead(index: number | HTMLElement)`

Marks the specified notification (by index or element) as read if it was unread, updating the unread count.

---

#### `remove(index: number)`

Removes the notification at the given index, triggering any removal animations or cleanup.

---

#### `clear()`

Safely clears all notifications from the list, removing them one by one, handling animations properly.

---

### 🔔 Notification Center Visibility Controls

#### `open()`

Opens the notification center by showing the overlay and adding the `open` class.

---

#### `close()`

Closes the notification center by hiding the overlay and removing the `open` class.

If `markAllAsReadOnClose` is enabled, marks all unread notifications as read on close.

---

#### `toggle()`

Toggles the notification center open or closed based on current state.

---

### 🔢 Count Management

#### `recount()`

Recalculates the number of unread notifications by counting `.item.unread` elements in the DOM list, updating the badge count.

---

#### `get count() : number`

Returns the current number of unread notifications tracked internally.

---

### ➕ `add(message, mode = 'text')`

Adds a new notification to the notification center. 🎉

**Parameters:**

* `message` (`NotifyData`):
  Can be either a simple string or an object containing:

  * `title` (optional): notification title 📝
  * `message`: main notification text or HTML content
  * `avatar` (optional): URL for an avatar image 🖼️
  * `onClick` (optional): callback function triggered when the notification is clicked 🎯

* `mode` (`'text' | 'html'`, default `'text'`):
  Determines if the message content should be treated as plain text or HTML.

---

**How it works:**

1. Creates a new `.item.unread` div to hold the notification.

2. If `message` is an object, it extracts the title, message, avatar URL, and click callback.
   Otherwise, treats `message` as plain text content.

3. If an avatar URL is provided, creates a `.avatar` div with the avatar image as background.

4. Creates a `.content` wrapper containing:

   * An optional `.title` element if a title exists
   * A `.message` element containing the message, rendered as text or HTML depending on `mode`

5. If `onClick` callback is provided, marks the item `.clickable` and adds a click event listener that triggers the callback — but **prevents clicks on the close button** from triggering it.

6. Adds a close button (`×`) `.notify-close` inside the notification:
   Clicking it removes the notification, stopping event propagation to avoid triggering the main click callback.

7. Prepends the notification to the top of the list, stores its mode, and updates the unread count.

---

**In short:**
You create a rich notification element dynamically, with optional avatar, title, content (text or HTML), clickable actions, and a close button — all neatly wired up! 🚀

---

## 🔥 `destroy()`

Destroys the current **TinyNotifyCenter** instance.
It **removes all event listeners**, **clears all notifications**, and **optionally removes the entire notification center template from the DOM**.

### Syntax

```js
tinyNotifyCenter.destroy();
```

### Behavior

* Removes all event listeners (`click`, `close`, `clear all`, overlay clicks).
* Clears all notifications from the list.
* Removes the UI (`.notify-overlay`, `.notify-bell`, etc.) from the DOM.
* Cleans internal references (`center`, `list`, `button`, `overlay`, `badge`, `modes`).

---

## 🎨 CSS Files Location

The CSS files for the TinyNotify project build can be found in the following folder:

```
dist/v1/css
```

Inside this folder, you'll find the main stylesheets:

- `TinyNotify.css` — the full, unminified CSS file
- `TinyNotify.min.css` — the minified, optimized CSS file for production 🚀

Use these files to style your notifications!  
Happy coding! ✨
