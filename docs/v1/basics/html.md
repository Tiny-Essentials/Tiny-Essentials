### 📖 `readBase64Blob(file: File, isDataUrl?: boolean | string): Promise<string>`

Reads a file and returns its Base64 content using the FileReader API, with optional formatting as a full Data URL.

#### 📥 Parameters

* `file` *(File)*: The file object selected by the user (e.g., from an `<input type="file">` element).
* `isDataUrl` *(boolean | string, optional)*:

  * If `false` *(default)*: returns only the Base64 portion.
  * If `true`: returns the original Data URL string from `FileReader`.
  * If a string: treated as a custom MIME type for building a new Data URL.

#### 📤 Returns

* `Promise<string>`: Resolves with either the Base64 string or a complete Data URL, depending on `isDataUrl`.

#### ⚠️ Throws

* `TypeError` if:

  * The result is not a string.
  * The `isDataUrl` argument is not a boolean or a string.
* `Error` if:

  * The string is not a valid Base64 or Data URL format.
  * The MIME string format is invalid.
* `DOMException` if the file cannot be read by `FileReader`.

#### 🧪 Example

```js
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async () => {
  try {
    const base64 = await readBase64Blob(input.files[0], false);
    console.log(base64); // Logs only the Base64 string
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
});
```

---

### 📖 `readFileBlob(file: File, method: 'readAsArrayBuffer' | 'readAsDataURL' | 'readAsText' | 'readAsBinaryString'): Promise<any>`

Reads the contents of a file using a specified FileReader method.

#### 📥 Parameters

* `file` *(File)*: The file object selected by the user (e.g., from an `<input type="file">` element).
* `method` *(string)*: The FileReader method to use:

  * `'readAsArrayBuffer'` — for binary buffers
  * `'readAsDataURL'` — for Base64 encoded data URLs
  * `'readAsText'` — for plain text
  * `'readAsBinaryString'` — for legacy binary string output

#### 📤 Returns

* `Promise<any>`: Resolves with the file content, depending on the method used.

#### ⚠️ Throws

* `Error` if an unexpected error occurs while resolving the result.
* `DOMException` if `FileReader` encounters a failure during the read process.

#### 🧪 Example

```js
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async () => {
  try {
    const text = await readFileBlob(input.files[0], 'readAsText');
    console.log(text); // Logs the file content as plain text
  } catch (err) {
    console.error('Error reading file:', err.message);
  }
});
```

---

### 📖 `readJsonBlob(file: File): Promise<any>`

Reads and parses a JSON file using the FileReader API.

#### 📥 Parameters

* `file` *(File)*: The file object selected by the user (e.g., from an `<input type="file">` element).

#### 📤 Returns

* `Promise<any>`: Resolves with the parsed JSON object, or rejects with an error if the content is invalid.

#### ⚠️ Throws

* An error if the content is not valid JSON.
* An error if the file can't be read.

#### 🧪 Example

```js
const input = document.querySelector('input[type="file"]');
input.addEventListener('change', async () => {
  try {
    const result = await readJsonBlob(input.files[0]);
    console.log(result);
  } catch (err) {
    alert(err.message);
  }
});
```

---

### 💾 `saveJsonFile(filename: string, data: any, spaces: number = 2): void`

Converts a JavaScript object to JSON and triggers a download in the browser.

#### 📥 Parameters

* `filename` *(string)*: The name of the file to save (e.g., `"data.json"`).
* `data` *(any)*: The JavaScript object to convert to JSON.
* `spaces` *(number)* *(optional)*: Indentation level for formatting the JSON string. Default is `2`.

#### 📤 Returns

* `void`

#### 📂 Behavior

Creates a temporary `<a>` element, downloads the file, and cleans up the URL.

#### 🧪 Example

```js
const data = { name: 'Yasmin', type: 'dev' };
saveJsonFile('yasmin.json', data);
```

### 🌐 `fetchTemplate(...)`

Loads data from a remote URL using the Fetch API, with support for custom HTTP methods, retries, timeouts, headers, and even external abort controllers.

#### 📥 Parameters

* `url` *(string)*: The full URL to fetch from (must start with `http://`, `https://`, `/`, `./`, or `../`).
* `options` *(object)* *(optional)*:

  * `signal` *(`AbortSignal` | `null`)*: Custom abort signal.
  * `method` *(string)*: The HTTP method to use (e.g., `GET`, `POST`, `PUT`, `DELETE`, etc.).
  * `timeout` *(number)*: Request timeout in milliseconds. Default is `0` (no timeout).
  * `retries` *(number)*: Number of retry attempts if the request fails. Default is `0`.
  * `headers` *(object)*: Additional headers to include in the request.
  * `body` *(object)*: Request body. If the value is a plain object, it will be automatically stringified as JSON.
  * `onProgress` *((loaded: number, total: number) => void)*: Track the load progress.

#### `fetchJson(url, options?)`

Loads and parses a remote JSON file.

* **Parameters**:

  * `url` *(string)*: URL to fetch the JSON from.
  * `options` *(object)* *(optional)*: Same structure as `fetchTemplate`.

* **Returns**:
  `Promise<any[] | Record<string | number | symbol, unknown>>` — The parsed JSON data.

* **Throws**:

  * `Error` if the fetch fails, times out, or returns invalid JSON.
  * `Error` if the `Content-Type` is not `application/json`.

---

#### `fetchBlob(url, allowedMimeTypes?, options?)`

Loads a remote file as a Blob object.

* **Parameters**:

  * `url` *(string)*: URL of the remote file.
  * `allowedMimeTypes` *(string\[])* *(optional)*: List of accepted MIME types.
  * `options` *(object)* *(optional)*: Same structure as `fetchTemplate`.

* **Returns**:
  `Promise<Blob>`

* **Throws**:

  * `Error` if fetch fails or the MIME type is not allowed.
  * `Error` if the response is not OK.

---

#### `fetchText(url, allowedMimeTypes?, options?)`

Loads a remote file as **plain text** using the Fetch API.

* **Parameters**:

  * `url` *(string)*: Full URL of the file to fetch.
  * `allowedMimeTypes` *(string\[])* *(optional)*: List of accepted MIME types (e.g., `['text/plain']`).
  * `options` *(object)* *(optional)*: Same structure as `fetchTemplate`.

* **Returns**:
  `Promise<string>` — The content of the file as a text string.

* **Throws**:

  * `Error` if the fetch fails or the response is not OK.
  * `Error` if the MIME type is not in the allowed list (when provided).

---

#### 📤 Returns (for all helpers)

* `Promise<any>` — Depends on the function:

  * `fetchJson`: Parsed JSON
  * `fetchBlob`: File as a Blob
  * `fetchText`: File as plain text

---

#### ⚠️ Throws

All functions may throw the following:

* `Error` if the request fails or the response times out.
* `Error` if `Content-Type` does not match expected type (JSON, Blob, Text, etc).
* `Error` if response is malformed or rejected by MIME type filter.

---

#### 🧠 Tip

Using a custom `signal` disables both `timeout` and `retries`. This is useful when you want to handle cancellation yourself, like in user interfaces or abortable workflows.

#### 🧪 Example

```js
const controller = new AbortController();

const data = await fetchJson('https://api.example.com/data', {
  method: 'POST',
  body: { name: 'Yasmin' },
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 5000,
  retries: 2,
  signal: controller.signal, // optional
});
```

```js
const text = await fetchText('/example.txt', ['text/plain'], {
  timeout: 3000,
});
```

```js
const blob = await fetchBlob('/image.jpg', ['image/jpeg']);
```

---

### 📦 `HtmlElBoxSides` Type

```ts
type HtmlElBoxSides = {
  x: number;      // Total horizontal size (left + right)
  y: number;      // Total vertical size (top + bottom)
  left: number;
  right: number;
  top: number;
  bottom: number;
}
```

A common return format used to describe the box model dimensions (borders, padding, margin) of an HTML element.

---

### 📄 `installWindowHiddenScript`

Automatically toggles CSS classes on a given element based on the browser window or tab **visibility** and **focus** state.

Perfect for UI states like dimming, pausing animations, or showing "away" statuses.

#### 🧠 Features

* ✅ Adds or removes custom CSS classes depending on page visibility or focus
* ✅ Supports modern and legacy browsers (including IE9)
* ✅ Automatically dispatches an initial state check on load
* ✅ Allows custom **callbacks** for visibility changes (`onVisible`, `onHidden`)
* ✅ Returns a cleanup function to remove all listeners

#### 🧪 Usage

```js
import { installWindowHiddenScript } from 'tiny-essentials';

const uninstall = installWindowHiddenScript({
  element: document.getElementById('app'),
  hiddenClass: 'is-hidden',
  visibleClass: 'is-visible',
  onVisible: () => console.log('Window is now visible'),
  onHidden: () => console.log('Window is now hidden'),
});

// To remove all listeners later
uninstall();
```

#### ⚙️ Options

| Option         | Type          | Default           | Description                                                       |
| -------------- | ------------- | ----------------- | ----------------------------------------------------------------- |
| `element`      | `HTMLElement` | `document.body`   | The element to which the visibility classes will be applied       |
| `hiddenClass`  | `string`      | `'windowHidden'`  | Class name to apply when the window is **not visible or blurred** |
| `visibleClass` | `string`      | `'windowVisible'` | Class name to apply when the window is **visible or focused**     |
| `onVisible`    | `() => void`  | `undefined`       | Optional callback fired when the window becomes visible           |
| `onHidden`     | `() => void`  | `undefined`       | Optional callback fired when the window becomes hidden            |

#### 🔄 Return Value

```ts
() => void
```

Returns a function that, when called, will:

* 🧹 Remove all attached event listeners
* ❌ Remove both visibility classes from the target element

#### 🚦 Events Supported

The script handles multiple events depending on browser support:

* `visibilitychange`, `webkitvisibilitychange`, `mozvisibilitychange`, `msvisibilitychange`
* `focus`, `blur`, `focusin`, `focusout`
* `pageshow`, `pagehide`
* IE fallback: `onfocusin`, `onfocusout`

#### 🔍 Initial Trigger

Immediately after installation, the script simulates a `focus` or `blur` event based on the current visibility state to **ensure the classes and callbacks are applied from the start**.

#### 🧯 Uninstalling

Don’t forget to call the returned function if you dynamically load/unload components or scripts:

```js
const stopWatching = installWindowHiddenScript(...);
stopWatching(); // later
```

#### 🎨 CSS Example

```css
.windowVisible {
  opacity: 1;
  pointer-events: auto;
  transition: opacity 0.3s ease;
}

.windowHidden {
  opacity: 0.4;
  pointer-events: none;
  transition: opacity 0.3s ease;
}
```

---

### 📖 `loadImage(options): Promise<object>`

A robust, asynchronous utility for loading images in the browser. It captures critical lifecycle events and provides a normalized result object, making it much easier to handle image loading states and performance metrics.

#### ✨ Features

* **Asynchronous:** Returns a clean `Promise`.
* **Performance Tracking:** Automatically calculates the time taken to load the image.
* **Memory Safe:** Includes a cleanup mechanism for event listeners.
* **Normalized Output:** Returns consistent data structures for both success and edge cases.

#### 📥 Parameters

| Parameter | Type | Default | Description |
| --- | --- | --- | --- |
| `url` | `string` | **Required** | The source URL of the image. |
| `crossOrigin` | `string` | `'anonymous'` | The CORS policy for the request. |
| `onLoading` | `function` | `undefined` | Callback fired when the browser starts the network request. |

#### 📤 Returns

The promise resolves to an object containing:

* **`element`**: `HTMLImageElement` - The actual image object.
* **`isSuccess`**: `boolean` - True if the image loaded correctly.
* **`event`**: `Event` - The raw event captured from the browser.
* **`status`**: `string` - `'loaded'` or `'aborted'`.
* **`loadTimeMs`**: `number` - Total duration of the request in milliseconds.
* **`dimensions`**: `Object` - Contains `width`, `height`, `naturalWidth`, and `naturalHeight`.

#### 🧪 Example

```javascript
import { loadImage } from './html.mjs';

const handleLoading = (event, startTime) => {
  console.log('Started loading at:', startTime);
};

const result = await loadImage({
  url: 'https://example.com/image.png',
  onLoading: handleLoading,
  crossOrigin: 'anonymous'
});

if (result.isSuccess) {
  console.log(`Image loaded in ${result.loadTimeMs.toFixed(2)}ms`);
  document.body.appendChild(result.element);
}
```
> **Note:** The utility uses `performance.now()` for high-resolution timestamps, ensuring accurate performance monitoring of your assets.
