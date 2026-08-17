# 📌 TinyElementObserver

A utility class for tracking **DOM element mutations** 🧬.
It leverages the native `MutationObserver` API, providing a higher-level abstraction with a configurable **detector system** ⚙️ that can dispatch custom events or run custom logic.

---

## 🔹 Callback Type

### `ElementDetectorsFn`

```ts
type ElementDetectorsFn = (
  mutation: MutationRecord,        // Single mutation being processed
  index: number,                   // Index of the mutation in the batch
  mutations: MutationRecord[]      // Full list of mutation records
) => void;
```

---

## 🔹 Constructor

```ts
new TinyElementObserver(el, {
  initDetectors?: Array<[string, ElementDetectorsFn]>,
  initCfg?: MutationObserverInit
})
```

* **`el`** → Initial element to observe 🏷️
* **`initDetectors`** *(optional)* → Array of detectors to register on creation 🎛️
* **`initCfg`** *(optional)* → Initial `MutationObserverInit` configuration ⚙️

---

## 🔹 Properties

| Property    | Type                                  | Description                                               |
| ----------- | ------------------------------------- | --------------------------------------------------------- |
| `settings`  | `MutationObserverInit`                | Observer configuration object. 🔧                         |
| `observer`  | `MutationObserver \| null`            | Internal observer instance.                               |
| `detectors` | `Array<[string, ElementDetectorsFn]>` | List of registered detectors.                             |
| `isActive`  | `boolean`                             | `true` if the observer is running. 🚦                     |
| `size`      | `number`                              | Total number of registered detectors. 📊                  |

---

## 🔹 Methods

### 🎛️ Detector Management

* **`add(name, handler)`** → Add detector at the end of the list.
* **`insertAtStart(name, handler)`** → Add detector at the start of the list.
* **`insertAt(index, name, handler, position = "after")`** → Insert detector before or after a given index.
* **`removeAt(index)`** → Remove detector at index.
* **`removeAround(index, before = 0, after = 0)`** → Remove detectors around an index.
* **`isIndexUsed(index)`** → Check if an index has a detector.
* **`hasHandler(handler)`** → Check if a handler already exists.
* **`clear()`** → Remove all detectors.

---

### 📡 Observation Control

* **`start()`** → Begin tracking mutations on the defined element.
  ⚠️ Throws if no element is set.

* **`stop()`** → Stop tracking mutations.

* **`destroy()`** → Stop observer and clear all detectors. Leaves the instance unusable until reconfigured. 💀

---

## 🔹 Example Usage

```js
import TinyElementObserver from 'tiny-essentials/libs/html/TinyElementObserver';

// Define a detector
const logDetector = (mutation, index, mutations) => {
  console.log(`🔍 Mutation detected [${index + 1}/${mutations.length}]:`, mutation);
};

// Create instance
const observer = new TinyElementObserver(document.querySelector('#target'), {
  initDetectors: [['logger', logDetector]],
  initCfg: { childList: true, subtree: true }
});

// Start observing
observer.start();

// Add another detector
observer.add('attrChange', (mutation) => {
  if (mutation.type === 'attributes') {
    console.log(`⚡ Attribute changed: ${mutation.attributeName}`);
  }
});
```

---

✨ With **TinyElementObserver**, you can easily manage multiple detectors, control observation lifecycle, and create powerful mutation-driven logic with minimal boilerplate.
