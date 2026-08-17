# 📦 `TinySmartScroller` Class

A utility class for managing smart scroll behavior in DOM containers or the window. Ideal for dynamic content like chat UIs or live feeds.

---

## 🧩 Typedefs

### 🧱 `NodeSizes`

```js
type NodeSizes = { height: number, width: number };
```

Represents the **dimensions of a DOM element** in pixels.

### 🔁 `NodeSizesEvent`

```js
type NodeSizesEvent = (elem, sizes, elemAmount) => NodeSizes | undefined;
```

A **callback function** used to compare previous and current element sizes, optionally returning custom size adjustments.

* `elem`: the DOM element.
* `sizes.old`: previous size.
* `sizes.now`: current size.
* `elemAmount.old` / `elemAmount.now`: number of matching elements before/after.

### 📡 `ScrollListenersFunc`

```js
type ScrollListenersFunc = (payload: any) => void;
```

A generic **scroll event callback function**.

---

## 🏗️ Constructor

### ✅ `new TinySmartScroller(target, options?)`

Initializes a new smart scroller instance.

```js
const scroller = new TinySmartScroller(document.querySelector('.chatbox'), {
  autoScrollBottom: true,
  observeMutations: true,
  preserveScrollOnLayoutShift: true,
  debounceTime: 100,
  querySelector: '.message',
});
```

### 🔧 Options:

| Option                        | Type                  | Default     | Description                                                          |                                           |
| ----------------------------- | --------------------- | ----------- | -------------------------------------------------------------------- | ----------------------------------------- |
| `extraScrollBoundary`         | `number`              | `0`         | Adds extra margin for scroll edge detection                          |                                           |
| `autoScrollBottom`            | `boolean`             | `true`      | Auto-scroll to bottom on updates                                     |                                           |
| `observeMutations`            | `boolean`             | `true`      | Uses MutationObserver to detect DOM changes                          |                                           |
| `preserveScrollOnLayoutShift` | `boolean`             | `true`      | Prevents jumps in scroll position due to layout shifts               |                                           |
| `debounceTime`                | `number`              | `100`       | Debounce time (ms) for scroll processing                             |                                           |
| `querySelector`               | \`string              | null\`      | `null`                                                               | Filters which children should be observed |
| `attributeFilter`             | `string[]\|Set\|null` | Default set | Which attributes to track for mutations (e.g., `src`, `style`, etc.) |                                           |

---

## 📐 Size Helpers

### 🔍 `getSimpleOnHeight(filter = [])`

Returns a size filter function that only compares height difference for allowed tags.

```js
const filter = scroller.getSimpleOnHeight(['IMG', 'VIDEO']);
```

#### ✅ Use when:

* You want to track layout shifts that affect only **vertical space**.
* You want to limit updates by tag name (like images or videos only).

### ➕ `addSimpleOnHeight(filter)`

Same as `getSimpleOnHeight()`, but **registers the filter** into the scroll system.

```js
scroller.addSimpleOnHeight(['IFRAME']);
```

---

## 🖼️ Load Tags Management

These are used to determine **which tags can trigger scroll corrections** when they load (e.g., images expanding).

### 📄 `getLoadTags()`

Returns a list of currently tracked **load-sensitive tag names**.

```js
const tags = scroller.getLoadTags(); // ['IMG', 'IFRAME', 'VIDEO']
```

### ➕ `addLoadTag(tag)`

Adds a tag to the **load tracking set**.

```js
scroller.addLoadTag('AUDIO');
```

### ➖ `removeLoadTag(tag)`

Removes a tag from the load tracking set.

```js
scroller.removeLoadTag('IFRAME');
```

### ❓ `hasLoadTag(tag)`

Checks if a tag is being tracked.

```js
scroller.hasLoadTag('IMG'); // true
```

### ♻️ `resetLoadTags(addDefault = false)`

Clears the load tags. If `addDefault` is true, resets to: `'IMG'`, `'IFRAME'`, `'VIDEO'`.

```js
scroller.resetLoadTags(true);
```

---

## 🧬 Attribute Filters Management

Used by the MutationObserver to watch **specific attribute changes**.

### 📋 `getAttributeFilters()`

Returns the current list of tracked attributes.

```js
scroller.getAttributeFilters(); // ['class', 'style', 'src', ...]
```

### ➕ `addAttributeFilter(attr)`

Adds an attribute to the filter set.

```js
scroller.addAttributeFilter('data-src');
```

### ➖ `removeAttributeFilter(attr)`

Removes an attribute from the filter set.

```js
scroller.removeAttributeFilter('style');
```

### ❓ `hasAttributeFilter(attr)`

Checks if an attribute is being watched.

```js
scroller.hasAttributeFilter('src'); // true
```

### ♻️ `resetAttributeFilters(addDefault = false)`

Clears attribute filters. If `addDefault` is true, resets to:

```js
['class', 'style', 'src', 'data-*', 'height', 'width']
```

---

## 🧠 Size Filter Handlers

### 🪝 `onSize(handler)`

Registers a custom handler to observe changes in element size.

```js
scroller.onSize((elem, sizes) => {
  if (sizes.now.height > sizes.old.height) {
    return { height: sizes.now.height - sizes.old.height, width: 0 };
  }
});
```

* 📌 **Throws** if `handler` is not a function.
* 🚫 Does nothing if the instance is destroyed.

---

### ❌ `offSize(handler)`

Removes a previously registered size change handler.

```js
scroller.offSize(mySizeHandler);
```

* 📌 **Throws** if `handler` is not a function.
* 🚫 Does nothing if the instance is destroyed.

---

## 🗣️ Scroll Event Listeners

### 🧷 `on(event, handler)`

Registers a scroll-related listener.

```js
scroller.on('onAutoScroll', (payload) => {
  console.log('Auto-scrolling triggered!', payload);
});
```

* 📌 **Valid events**:
  `onScrollBoundary`, `onAutoScroll`, `onScrollPause`, `onExtraScrollBoundary`
* 📌 **Throws** if `event` is not a string or `handler` is not a function.

---

### ❌ `off(event, handler)`

Removes a scroll event listener.

```js
scroller.off('onAutoScroll', myListener);
```

* 📌 **Throws** if `event` is not a string or `handler` is not a function.

---

## 👁️‍🗨️ Visibility Map Updater

### 🔍 `_scrollDataUpdater()`

Scans visible elements and tracks visibility changes internally.

```js
const result = scroller._scrollDataUpdater();
// Map<Element, { oldIsVisible: boolean, isVisible: boolean }>
```

* ✅ Returns a `Map` of visibility states for each target element.

---

## 🚀 Internal Event Emission

### 📣 `_emit(event, payload?)`

Calls all registered handlers for the specified scroll event.

```js
scroller._emit('onAutoScroll', { debug: true });
```

* 📌 **Throws** if `event` is not a string.
* 🚫 Does nothing if the instance is destroyed.

---

## 📜 Scroll Position Evaluation

### 🎢 `_onScroll()`

Handles scroll updates, boundary detection, and emits relevant events:

```js
// Emits:
'onScrollBoundary'
'onExtraScrollBoundary'
'onAutoScroll'
'onScrollPause'
```

* 🔄 Updates scroll direction states like `isAtBottom`, `isAtTop`.
* 🧠 Determines whether to pause or continue auto-scroll.

---

## 🔧 Scroll Correction on Layout Shifts

### 🪄 `_fixScroll(targets = [])`

Attempts to correct scroll position after layout changes (like image loading or content insertion).

```js
scroller._fixScroll([imgElement]);
```

* 🔍 Measures height & width delta using `ResizeObserver` entries.
* 🔄 Preserves scroll position intelligently unless scrolled to bottom.
* 📌 Throws if invalid return types are found in size handlers.

---

## 🧬 Mutation Observer Setup

### 👀 `_observeMutations()`

Initializes a `MutationObserver` to watch child mutations and trigger scroll adjustments.

* 🎯 Watches:

  * Element insertion/removal
  * Attribute changes (filtered)
* 📌 Automatically sets up `ResizeObserver` and load listeners on new elements.

---

## 📏 Resize Observer Setup

### 🧿 `_observeResizes(elements)`

Applies a `ResizeObserver` to elements for layout shift tracking.

```js
scroller._observeResizes(document.querySelectorAll('.message'));
```

* 🎯 Updates size maps (`#oldSizes`, `#newSizes`)
* 📌 Throws if `ResizeObserver` is missing or invalid.

---

## 📡 Load Event Listener for Media

### 🎬 `_listenLoadEvents(elements)`

Tracks loading of elements like `IMG`, `IFRAME`, and `VIDEO`.

```js
scroller._listenLoadEvents(imgElement);
```

* ⏳ Listens for the `load` event.
* ✅ Triggers scroll updates and auto-scroll when media finishes loading.
* ✅ Honors load tags set by `addLoadTag()`.

---

## 🧱 DOM and Element Accessors

### 🎯 `targetElement`

Returns the internal scroll container element being monitored.

```js
const container = scroller.targetElement;
```

* 🔙 Returns the target DOM element.

### 🕵️‍♀️ `getOldSize(el)`

Gets the previous recorded size of an element.

```js
scroller.getOldSize(myDiv); // → { height: 120, width: 300 }
```

* ❓ Returns `null` if the element wasn't tracked.

### 📐 `getNewSize(el)`

Gets the most recent measured size of an element.

```js
scroller.getNewSize(myDiv); // → { height: 150, width: 300 }
```

* ❓ Returns `null` if the element wasn't tracked.

---

## 👁️ Visibility Status Checkers

### 👀 `wasVisible(el)`

Returns `true` if the element was visible during the last scroll update.

### 🔎 `isVisible(el)`

Returns `true` if the element is currently visible in the scroll view.

### ⏱️ `wasTimedVisible(el)`

Returns visibility based on the previous **timed** visibility update.

### ⌚ `isTimedVisible(el)`

Returns visibility based on the current **timed** visibility update.

---

## 📏 Scroll Configuration and Info

### ➕ `setExtraScrollBoundary(pixels)`

Defines a custom pixel margin for top/bottom boundary detection.

```js
scroller.setExtraScrollBoundary(50);
```

* 🔒 Throws if not a valid number.

### 📊 `getExtraScrollBoundary()`

Returns the currently defined extra scroll boundary in pixels.

### 📉 `getLastKnownScrollBottomOffset()`

Gets the last recorded scroll distance from the bottom (in pixels).

### ⬇️ `scrollToBottom()`

Scrolls the target all the way to the bottom immediately.

### ⬆️ `scrollToTop()`

Scrolls the target all the way to the top immediately.

---

## 🧭 Scroll Position Status

### 🔚 `isAtCustomBottom()`

Returns `true` if the user is within the custom boundary of the bottom.

### 🔝 `isAtCustomTop()`

Returns `true` if the user is within the custom boundary of the top.

### 🧨 `isAtBottom()`

Returns `true` if user is currently scrolled to the actual bottom.

### 🧷 `isAtTop()`

Returns `true` if user is currently scrolled to the actual top.

### ⏸️ `isScrollPaused()`

Returns `true` if auto-scroll is currently paused.

---

## 💻 Internal Engine Status

### 🌍 `isWindow()`

Returns `true` if the scroll target is the `window` object.

### 💀 `isDestroyed()`

Returns `true` if the instance has already been destroyed.

### 🔁 `getAutoScrollBottom()`

Returns whether auto-scroll-to-bottom is active.

### 🧬 `getObserveMutations()`

Returns whether `MutationObserver` is currently enabled.

### 🧷 `getPreserveScrollOnLayoutShift()`

Returns whether scroll preservation is enabled when layout shifts.

### ⌛ `getDebounceTime()`

Returns the debounce delay (ms) for scroll-based events.

---

## 🧮 Tracked Element Info

### 📏 `getElemAmount()`

Returns the current number of matching observed elements.

### 🧾 `getPrevElemAmount()`

Returns the previous number of matching elements.

### 🧵 `getQuerySelector()`

Returns the CSS selector used to filter tracked elements.

---

## 💣 Cleanup and Destruction

### ☠️ `destroy()`

Disconnects all internal listeners and observers and clears memory.

```js
scroller.destroy();
```

* 🧹 Removes `scroll`, `resize`, and `load` listeners.
* 🧼 Clears WeakMaps and listener registries.
* ❌ Once destroyed, the instance should not be reused.
