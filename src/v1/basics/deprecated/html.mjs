import { trackFetchProgress } from '../html.mjs';
import { isJsonObject } from '../objChecker.mjs';

/**
 * @typedef {Object} FetchTemplateOptions
 * @property {string} [method="GET"] - HTTP method to use (GET, POST, etc.).
 * @property {any} [body] - Request body (only for methods like POST, PUT).
 * @property {number} [timeout=0] - Timeout in milliseconds (ignored if signal is provided).
 * @property {number} [retries=0] - Number of retry attempts (ignored if signal is provided).
 * @property {Headers|Record<string, *>} [headers={}] - Additional headers.
 * @property {AbortSignal|null} [signal] - External AbortSignal; disables timeout and retries.
 * @property {import('../html.mjs').FetchOnProgressResult} [onProgress] - Track the load progress.
 * @deprecated
 */

/**
 * @param {string} url - The full URL to fetch data from.
 * @param {FetchTemplateOptions} [options] - Optional settings.
 * @returns {Promise<Response>} Result data.
 * @throws {Error} Throws if fetch fails, times out.
 */
async function fetchTemplate(url, options = {}) {
  if (options !== null && typeof options !== 'object') {
    throw new TypeError('The "options" argument must be an object.');
  }

  const {
    method = 'GET',
    body,
    timeout = 0,
    retries = 0,
    headers = {},
    signal = null,
    onProgress,
  } = options;

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

  if (headers !== null && typeof headers !== 'object') {
    throw new TypeError('The "headers" option must be an object.');
  }

  if (signal !== null && !(signal instanceof AbortSignal)) {
    throw new TypeError('The "signal" option must be an instance of AbortSignal.');
  }

  if (onProgress !== undefined && typeof onProgress !== 'function') {
    throw new TypeError('The "onProgress" option must be a function.');
  }

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

      // If onProgress is not provided or body is null, return original response
      if (!onProgress) return response;
      return trackFetchProgress(response, onProgress);
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
 * @deprecated
 */
export async function fetchJson(url, options) {
  if (typeof url !== 'string') {
    return Promise.reject(new TypeError('The "url" argument must be a string.'));
  }
  if (options !== undefined && (options === null || typeof options !== 'object')) {
    return Promise.reject(new TypeError('The "options" argument must be an object.'));
  }

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
 * @param {string[]} [allowedMimeTypes] - Optional list of accepted MIME types (e.g., ['image/jpeg']).
 * @param {FetchTemplateOptions} [options] - Optional fetch options.
 * @returns {Promise<Blob>} - The fetched file as a Blob.
 * @throws {Error} Throws if fetch fails, response is not ok, or MIME type is not allowed.
 * @deprecated
 */
export async function fetchBlob(url, allowedMimeTypes, options) {
  if (typeof url !== 'string') {
    return Promise.reject(new TypeError('The "url" argument must be a string.'));
  }
  if (allowedMimeTypes !== undefined && !Array.isArray(allowedMimeTypes)) {
    return Promise.reject(
      new TypeError('The "allowedMimeTypes" argument must be an array of strings.'),
    );
  }
  if (options !== undefined && (options === null || typeof options !== 'object')) {
    return Promise.reject(new TypeError('The "options" argument must be an object.'));
  }

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
 * @param {string[]} [allowedMimeTypes] - Optional list of accepted MIME types (e.g., ['image/jpeg']).
 * @param {FetchTemplateOptions} [options] - Optional fetch options.
 * @returns {Promise<string>} - The fetched file as a text.
 * @throws {Error} Throws if fetch fails, response is not ok, or MIME type is not allowed.
 * @deprecated
 */
export async function fetchText(url, allowedMimeTypes, options) {
  if (typeof url !== 'string') {
    return Promise.reject(new TypeError('The "url" argument must be a string.'));
  }
  if (allowedMimeTypes !== undefined && !Array.isArray(allowedMimeTypes)) {
    return Promise.reject(
      new TypeError('The "allowedMimeTypes" argument must be an array of strings.'),
    );
  }
  if (options !== undefined && (options === null || typeof options !== 'object')) {
    return Promise.reject(new TypeError('The "options" argument must be an object.'));
  }

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
