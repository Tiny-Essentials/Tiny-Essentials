import { isJsonObject } from './objChecker.mjs';

/////////////////////////////////////////////////////////////////

/**
 * Reads the contents of a file using the specified FileReader method.
 *
 * @param {File} file - The file to be read.
 * @param {'readAsArrayBuffer'|'readAsDataURL'|'readAsText'|'readAsBinaryString'} method -
 *   The FileReader method to use for reading the file.
 * @returns {Promise<any>} - A promise that resolves with the file content, according to the chosen method.
 * @throws {Error} - If an unexpected error occurs while handling the result.
 * @throws {DOMException} - If the FileReader encounters an error while reading the file.
 */
export function readFileBlob(file, method) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(reader.result);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => {
      reject(reader.error);
    };
    reader[method](file);
  });
}

/**
 * Reads a file as a Base64 string using FileReader, and optionally formats it as a full data URL.
 *
 * Performs strict validation to ensure the result is a valid Base64 string or a proper data URL.
 *
 * @param {File} file - The file to be read.
 * @param {boolean|string} [isDataUrl=false] - If true, returns a full data URL; if false, returns only the Base64 string;
 *   if a string is passed, it is used as the MIME type in the data URL.
 * @returns {Promise<string>} - A promise that resolves with the Base64 string or data URL.
 *
 * @throws {TypeError} - If the result is not a string or if `isDataUrl` is not a valid type.
 * @throws {Error} - If the result does not match the expected data URL format or Base64 structure.
 * @throws {DOMException} - If the FileReader fails to read the file.
 */
export function readBase64Blob(file, isDataUrl = false) {
  return new Promise((resolve, reject) => {
    if (typeof isDataUrl !== 'string' && typeof isDataUrl !== 'boolean')
      reject(new TypeError('The isDataUrl parameter must be a boolean or a string.'));
    readFileBlob(file, 'readAsDataURL')
      .then(
        /**
         * Ensure that the URL format is correct in the required pattern
         * @param {string} base64Data
         */ (base64Data) => {
          if (typeof base64Data !== 'string')
            throw new TypeError('Expected file content to be a string.');

          const match = base64Data.match(/^data:(.+);base64,(.*)$/);
          if (!match || !match[2])
            throw new Error('Invalid data URL format or missing Base64 content.');
          const [, mimeType, base64] = match;
          if (!/^[\w/+]+=*$/.test(base64)) throw new Error('Base64 content is malformed.');

          if (typeof isDataUrl === 'boolean') return resolve(isDataUrl ? base64Data : base64);
          if (!/^[\w-]+\/[\w.+-]+$/.test(isDataUrl))
            throw new Error(`Invalid MIME type string: ${isDataUrl}`);

          return resolve(`data:${isDataUrl};base64,${base64}`);
        },
      )
      .catch(reject);
  });
}

/**
 * Reads a file and strictly validates its content as proper JSON using FileReader.
 *
 * Performs several checks to ensure the file contains valid, parsable JSON data.
 *
 * @param {File} file - The file to be read. It must contain valid JSON as plain text.
 * @returns {Promise<Record<string|number|symbol, any>|any[]>} - A promise that resolves with the parsed JSON object.
 *
 * @throws {SyntaxError} - If the file content is not valid JSON syntax.
 * @throws {TypeError} - If the result is not a string or does not represent a JSON value.
 * @throws {Error} - If the result is empty or structurally invalid as JSON.
 * @throws {DOMException} - If the FileReader fails to read the file.
 */
export function readJsonBlob(file) {
  return new Promise((resolve, reject) =>
    readFileBlob(file, 'readAsText')
      .then((data) => {
        if (typeof data !== 'string') throw new TypeError('Expected file content to be a string.');
        const trimmed = data.trim();
        if (trimmed.length === 0) throw new Error('File is empty or contains only whitespace.');
        const parsed = JSON.parse(trimmed);
        if (typeof parsed !== 'object' || parsed === null)
          throw new Error('Parsed content is not a valid JSON object or array.');
        resolve(parsed);
      })
      .catch(reject),
  );
}

/**
 * Saves a JSON object as a downloadable file.
 * @param {string} filename
 * @param {any} data
 * @param {number} [spaces=2]
 */
export function saveJsonFile(filename, data, spaces = 2) {
  const json = JSON.stringify(data, null, spaces);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * @typedef {Object} FetchTemplateOptions
 * @property {string} [method="GET"] - HTTP method to use (GET, POST, etc.).
 * @property {any} [body] - Request body (only for methods like POST, PUT).
 * @property {number} [timeout=0] - Timeout in milliseconds (ignored if signal is provided).
 * @property {number} [retries=0] - Number of retry attempts (ignored if signal is provided).
 * @property {Headers|Record<string, *>} [headers={}] - Additional headers.
 * @property {AbortSignal|null} [signal] - External AbortSignal; disables timeout and retries.
 */

/**
 * @param {string} url - The full URL to fetch data from.
 * @param {FetchTemplateOptions} [options] - Optional settings.
 * @returns {Promise<Response>} Result data.
 * @throws {Error} Throws if fetch fails, times out.
 */
async function fetchTemplate(
  url,
  { method = 'GET', body, timeout = 0, retries = 0, headers = {}, signal = null } = {},
) {
  if (
    typeof url !== 'string' ||
    (!url.startsWith('../') &&
      !url.startsWith('./') &&
      !url.startsWith('/') &&
      !url.startsWith('https://') &&
      !url.startsWith('http://'))
  )
    throw new Error('Invalid URL: must be a valid http or https address.');

  if (typeof method !== 'string' || !method.trim())
    throw new Error('Invalid method: must be a non-empty string.');

  if (!signal) {
    if (
      typeof timeout !== 'number' ||
      !Number.isFinite(timeout) ||
      Number.isNaN(timeout) ||
      timeout < 0
    )
      throw new Error('Invalid timeout: must be a positive number.');

    if (
      typeof retries !== 'number' ||
      !Number.isFinite(retries) ||
      Number.isNaN(retries) ||
      retries < 0
    )
      throw new Error('Invalid retries: must be a positive number.');
  }

  const attempts = signal ? 1 : retries + 1;
  /** @type {Error|null} */
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const controller = signal ? null : new AbortController();
    const localSignal = signal || (controller?.signal ?? null);
    const timer =
      !signal && timeout && controller ? setTimeout(() => controller.abort(), timeout) : null;

    try {
      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers: {
          Accept: 'application/json',
          ...headers,
        },
        body: body !== undefined ? (isJsonObject(body) ? JSON.stringify(body) : body) : undefined,
        signal: localSignal,
      });

      if (timer) clearTimeout(timer);

      if (!response.ok) throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      return response;
    } catch (err) {
      lastError = /** @type {Error} */ (err);
      if (signal) break; // if an external signal came, it does not retry
      if (attempt < retries)
        await new Promise((resolve) => setTimeout(resolve, 300 * (attempt + 1)));
    }
  }

  throw new Error(
    `Failed to fetch JSON from "${url}"${lastError ? `: ${lastError.message}` : '.'}`,
  );
}

/**
 * Loads and parses a JSON from a remote URL using Fetch API.
 *
 * @param {string} url - The full URL to fetch JSON from.
 * @param {FetchTemplateOptions} [options] - Optional settings.
 * @returns {Promise<any[] | Record<string | number | symbol, unknown>>} Parsed JSON object.
 * @throws {Error} Throws if fetch fails, times out, or returns invalid JSON.
 */
export async function fetchJson(url, options) {
  return new Promise((resolve, reject) => {
    fetchTemplate(url, options)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json'))
          throw new Error(`Unexpected content-type: ${contentType}`);

        const data = await res.json();

        if (!Array.isArray(data) && !isJsonObject(data))
          throw new Error('Received invalid data instead of valid JSON.');

        return resolve(data);
      })
      .catch(reject);
  });
}

/**
 * Loads a remote file as a Blob using Fetch API.
 *
 * @param {string} url - The full URL to fetch the file from.
 * @param {FetchTemplateOptions} [options] - Optional fetch options.
 * @param {string[]} [allowedMimeTypes] - Optional list of accepted MIME types (e.g., ['image/jpeg']).
 * @returns {Promise<Blob>} - The fetched file as a Blob.
 * @throws {Error} Throws if fetch fails, response is not ok, or MIME type is not allowed.
 */
export async function fetchBlob(url, allowedMimeTypes, options) {
  return new Promise((resolve, reject) => {
    fetchTemplate(url, options)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';

        if (
          Array.isArray(allowedMimeTypes) &&
          allowedMimeTypes.length > 0 &&
          !allowedMimeTypes.some((type) => contentType.includes(type))
        ) {
          throw new Error(`Blocked MIME type: ${contentType}`);
        }

        const data = await res.blob();
        return resolve(data);
      })
      .catch(reject);
  });
}

/**
 * Loads a remote file as a text using Fetch API.
 *
 * @param {string} url - The full URL to fetch the file from.
 * @param {FetchTemplateOptions} [options] - Optional fetch options.
 * @param {string[]} [allowedMimeTypes] - Optional list of accepted MIME types (e.g., ['image/jpeg']).
 * @returns {Promise<string>} - The fetched file as a text.
 * @throws {Error} Throws if fetch fails, response is not ok, or MIME type is not allowed.
 */
export async function fetchText(url, allowedMimeTypes, options) {
  return new Promise((resolve, reject) => {
    fetchTemplate(url, options)
      .then(async (res) => {
        const contentType = res.headers.get('content-type') || '';

        if (
          Array.isArray(allowedMimeTypes) &&
          allowedMimeTypes.length > 0 &&
          !allowedMimeTypes.some((type) => contentType.includes(type))
        ) {
          throw new Error(`Blocked MIME type: ${contentType}`);
        }

        const data = await res.text();
        return resolve(data);
      })
      .catch(reject);
  });
}

///////////////////////////////////////////////////////////////////////////////

/**
 * @typedef {Object} ImageLoadResult
 * @property {HTMLImageElement} element
 * @property {Event} event
 * @property {string} status
 * @property {boolean} isSuccess
 * @property {number} loadTimeMs
 * @property {Object} dimensions
 * @property {number} dimensions.width
 * @property {number} dimensions.height
 * @property {number} dimensions.naturalWidth
 * @property {number} dimensions.naturalHeight
 */

/**
 * Loads an image asynchronously, capturing critical lifecycle events.
 * It normalizes errors and success states into a consistent result structure.
 *
 * @param {Object} options
 * @param {string} options.url
 * @param {string} [options.crossOrigin="anonymous"]
 * @param {(event: Event, startTime: number) => void} [options.onLoading]
 * @returns {Promise<ImageLoadResult>}
 */
export async function loadImage({ url, onLoading, crossOrigin = 'anonymous' }) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let startTime = performance.now();

    img.crossOrigin = crossOrigin;

    /**
     * Cleans up event listeners to avoid memory leaks.
     */
    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      img.onabort = null;
      img.onloadstart = null;
    };

    /**
     * Centralized handler to generate the result object.
     * @param {Event} event
     * @param {string} status
     * @param {boolean} isSuccess
     */
    const handleResult = (event, status, isSuccess) => {
      const endTime = performance.now();
      cleanup();

      const result = {
        element: img,
        isSuccess,
        event,
        status,
        loadTimeMs: endTime - startTime,
        dimensions: {
          width: img.width,
          height: img.height,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
        },
      };

      resolve(result);
    };

    // Fired when the browser starts looking for the image data.
    // Crucial for resetting the timer to network start, not just script start.
    img.onloadstart = (ev) => {
      startTime = performance.now();
      if (typeof onLoading === 'function') onLoading(ev, startTime);
    };

    img.onload = (ev) => handleResult(ev, 'loaded', true);
    img.onabort = (ev) => handleResult(ev, 'aborted', false);
    img.onerror = (ev) => reject(ev);

    // Trigger the load
    img.src = url;
  });
}

///////////////////////////////////////////////////////////////////////////////

/**
 * Installs a script that toggles CSS classes on a given element
 * based on the page's visibility or focus state, and optionally
 * triggers callbacks on visibility changes.
 *
 * @param {Object} [settings={}]
 * @param {Element} [settings.element=document.body] - The element to receive visibility classes.
 * @param {string} [settings.hiddenClass='windowHidden'] - CSS class applied when the page is hidden.
 * @param {string} [settings.visibleClass='windowVisible'] - CSS class applied when the page is visible.
 * @param {(data: { type: string; oldType: string; oldClass: string; }) => void} [settings.onVisible] - Callback called when page becomes visible.
 * @param {(data: { type: string; oldType: string; oldClass: string; }) => void} [settings.onHidden] - Callback called when page becomes hidden.
 * @returns {() => void} Function that removes all installed event listeners.
 * @throws {TypeError} If any provided setting is invalid.
 */
export function installWindowHiddenScript({
  element = document.body,
  hiddenClass = 'windowHidden',
  visibleClass = 'windowVisible',
  onVisible,
  onHidden,
} = {}) {
  if (!(element instanceof Element))
    throw new TypeError(`"element" must be an instance of Element.`);
  if (typeof hiddenClass !== 'string') throw new TypeError(`"hiddenClass" must be a string.`);
  if (typeof visibleClass !== 'string') throw new TypeError(`"visibleClass" must be a string.`);
  if (onVisible !== undefined && typeof onVisible !== 'function')
    throw new TypeError(`"onVisible" must be a function if provided.`);
  if (onHidden !== undefined && typeof onHidden !== 'function')
    throw new TypeError(`"onHidden" must be a function if provided.`);

  let oldType = '';
  let oldClass = '';
  const removeClass = () => {
    element.classList.remove(hiddenClass);
    element.classList.remove(visibleClass);
  };

  /** @type {string|null} */
  let hiddenProp = null;

  const visibilityEvents = [
    'visibilitychange',
    'mozvisibilitychange',
    'webkitvisibilitychange',
    'msvisibilitychange',
  ];

  const visibilityProps = ['hidden', 'mozHidden', 'webkitHidden', 'msHidden'];

  for (let i = 0; i < visibilityProps.length; i++) {
    if (visibilityProps[i] in document) {
      hiddenProp = visibilityProps[i];
      break;
    }
  }

  /** @type {(this: any, evt: Event) => void} */
  const handler = function (evt) {
    removeClass();

    const type = evt?.type;
    // @ts-ignore
    const isHidden = hiddenProp && document[hiddenProp];

    const visibleEvents = ['focus', 'focusin', 'pageshow'];
    const hiddenEvents = ['blur', 'focusout', 'pagehide'];

    if (visibleEvents.includes(type)) {
      element.classList.add(visibleClass);
      onVisible?.({ type, oldClass, oldType });
      oldClass = visibleClass;
    } else if (hiddenEvents.includes(type)) {
      element.classList.add(hiddenClass);
      onHidden?.({ type, oldClass, oldType });
      oldClass = hiddenClass;
    } else {
      if (isHidden) {
        element.classList.add(hiddenClass);
        onHidden?.({ type, oldClass, oldType });
        oldClass = hiddenClass;
      } else {
        element.classList.add(visibleClass);
        onVisible?.({ type, oldClass, oldType });
        oldClass = visibleClass;
      }
    }
    oldType = type;
  };

  /** @type {() => void} */
  let uninstall = () => {};

  if (hiddenProp) {
    const eventType = visibilityEvents[visibilityProps.indexOf(hiddenProp)];
    document.addEventListener(eventType, handler);
    window.addEventListener('focus', handler);
    window.addEventListener('blur', handler);

    uninstall = () => {
      document.removeEventListener(eventType, handler);
      window.removeEventListener('focus', handler);
      window.removeEventListener('blur', handler);
      removeClass();
    };
  } else if ('onfocusin' in document) {
    // Fallback for IE9 and older
    // @ts-ignore
    document.onfocusin = document.onfocusout = handler;
    uninstall = () => {
      // @ts-ignore
      document.onfocusin = document.onfocusout = null;
      removeClass();
    };
  } else {
    // Last resort fallback
    window.onpageshow = window.onpagehide = window.onfocus = window.onblur = handler;
    uninstall = () => {
      window.onpageshow = window.onpagehide = window.onfocus = window.onblur = null;
      removeClass();
    };
  }

  // Trigger initial state
  // @ts-ignore
  const simulatedEvent = new Event(hiddenProp && document[hiddenProp] ? 'blur' : 'focus');
  handler(simulatedEvent);

  return uninstall;
}
