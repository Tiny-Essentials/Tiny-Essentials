/**
 * @fileoverview Generic file loader for external resources.
 * Uses the native `fetch` API by default, but accepts any implementation
 * that follows the same contract: `(input, init) => Promise<Response>`.
 */
import TinyMediaLoader from '../TinyMediaLoader.mjs';

/**
 * The response body types supported by the loader.
 * @typedef {'blob'|'arraybuffer'|'text'|'json'} FetchResponseType
 */

/**
 * Describes the configuration accepted by the {@link TinyFetchLoader} constructor.
 * @typedef {Object} FetchLoaderOptions
 * @property {string} [src] - The file URL.
 * @property {RequestInit} [init] - The fetch options (method, headers, body, credentials, mode, cache, redirect, referrer, referrerPolicy, integrity, keepalive).
 * @property {typeof fetch} [fetch] - A custom fetch implementation.
 * @property {FetchResponseType} [responseType] - The response body type (default `'blob'`).
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {boolean} [useHeadRequest] - Whether to perform a HEAD request before downloading.
 * @property {boolean} [progressive] - Whether to emit progress events (default `true`).
 * @property {boolean} [mirror] - Whether concurrent loads of the same source share a single download (default `true`).
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * The signature of the function returned by {@link TinyFetchLoader#exportFetch}.
 * @typedef {(input: string|URL|Request, init?: RequestInit) => Promise<Response>} TinyFetch
 */

/**
 * Loads an arbitrary file through the native `fetch` API.
 *
 * The class does not create a DOM element. It reuses the state machine,
 * progress tracker, cache and mirror registry of {@link TinyMediaLoader},
 * and exposes the downloaded payload through {@link TinyFetchLoader#blob}
 * and {@link TinyFetchLoader#data}.
 * @extends {TinyMediaLoader<any>}
 */
class TinyFetchLoader extends TinyMediaLoader {
  /** @type {RequestInit} */
  #init;
  /** @type {FetchResponseType} */
  #responseType;
  /** @type {Blob|null} */
  #blob = null;
  /** @type {Blob|ArrayBuffer|string|unknown|null} */
  #data = null;
  /** @type {FetchLoaderOptions} */
  #options;

  /**
   * @param {FetchLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `fetch` is not a function.
   * @throws {TypeError} If `init` is not a plain object.
   * @throws {RangeError} If `responseType` is not supported.
   */
  constructor(options = {}) {
    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
      throw new TypeError('The "options" argument must be a plain object.');
    }
    super(options);

    const {
      fetch: fetcher = globalThis.fetch.bind(globalThis),
      init = {},
      responseType = 'blob',
    } = options;

    if (typeof fetcher !== 'function') {
      throw new TypeError('The "fetch" option must be a function.');
    }
    if (init === null || typeof init !== 'object' || Array.isArray(init)) {
      throw new TypeError('The "init" option must be a plain object.');
    }
    if (!['blob', 'arraybuffer', 'text', 'json'].includes(responseType)) {
      throw new RangeError(
        'The "responseType" option must be one of: blob, arraybuffer, text, json.',
      );
    }

    this._fetch = fetcher;
    this._requestInit = init;
    this.#init = init;
    this.#responseType = responseType;
    this.#options = { ...options, fetch: fetcher, init: { ...init }, responseType };
  }

  /**
   * The downloaded file, or null before the load finishes.
   * @returns {Blob|null} The raw payload.
   */
  get blob() {
    return this.#blob;
  }

  /**
   * The parsed payload, in the format requested by `responseType`.
   * @returns {Blob|ArrayBuffer|string|unknown|null} The parsed payload.
   */
  get data() {
    return this.#data;
  }

  /**
   * The response body type requested at construction time.
   * @returns {FetchResponseType} The response body type.
   */
  get responseType() {
    return this.#responseType;
  }

  /**
   * The fetch options forwarded to the transport.
   * @returns {RequestInit} A defensive copy of the fetch options.
   */
  get init() {
    return { ...this.#init };
  }

  /**
   * Creates a new loader with the same configuration.
   *
   * The clone is fully independent: it has its own state machine, its own
   * abort controller and its own `blob`/`data` slots. The shared `cache` and
   * the custom `fetch` implementation are reused by reference, which is what
   * makes {@link TinyFetchLoader#exportFetch} cheap.
   * @param {FetchLoaderOptions} [overrides] - Values that override the cloned configuration.
   * @returns {TinyFetchLoader} A new, independent loader.
   * @throws {TypeError} If `overrides` is not a plain object.
   */
  clone(overrides = {}) {
    if (overrides === null || typeof overrides !== 'object' || Array.isArray(overrides)) {
      throw new TypeError('The "overrides" argument must be a plain object.');
    }
    const init = { ...this.#options.init, ...(overrides.init ?? {}) };
    return new TinyFetchLoader({ ...this.#options, ...overrides, init });
  }

  /**
   * Returns a `fetch`-compatible function backed by this loader.
   * @returns {TinyFetch} A function with the same signature as `fetch`.
   */
  exportFetch() {
    const self = this;
    return async function tinyFetch(input, init) {
      return self._fetch(input, init);
    };
  }

  /**
   * Downloads the file, consulting the shared cache first.
   * @protected
   * @returns {Promise<void>} Resolves once the payload is ready.
   */
  async _startLoad() {
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this.#blob = cached.blob;
      await this.#parse(cached.blob);
      return;
    }

    const blob = await this._downloadStream(this.src);
    this.#blob = blob;
    this._setResourceSize(blob.size);

    if (this.cache) {
      this._cacheBlob(blob);
    }

    await this.#parse(blob);
  }

  /**
   * Converts the raw blob into the format requested by `responseType`.
   * @param {Blob} blob - The downloaded or cached payload.
   * @returns {Promise<void>} Resolves once `data` is populated.
   * @throws {SyntaxError} If `responseType` is `'json'` and the body is not valid JSON.
   */
  async #parse(blob) {
    if (this.#responseType === 'arraybuffer') {
      this.#data = await blob.arrayBuffer();
    } else if (this.#responseType === 'text') {
      this.#data = await blob.text();
    } else if (this.#responseType === 'json') {
      this.#data = JSON.parse(await blob.text());
    } else {
      this.#data = blob;
    }
  }

  /**
   * Builds the metadata descriptor for the loaded file.
   * @protected
   * @returns {import('../TinyMediaLoader.mjs').MediaMetadataDetails} The file metadata.
   */
  _getMetadataDetails() {
    return {
      type: this.#blob?.type || 'application/octet-stream',
      width: 0,
      height: 0,
      duration: 0,
      size: this.#blob?.size ?? 0,
    };
  }

  /**
   * `TinyFetchLoader` does not render anything, so this method always throws.
   * @protected
   * @returns {never} This method never returns.
   * @throws {Error} Always.
   */
  _createElement() {
    throw new Error('TinyFetchLoader does not create a DOM element.');
  }
}

export default TinyFetchLoader;
