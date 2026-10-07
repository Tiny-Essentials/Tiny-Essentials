/**
 * @fileoverview Base class for controllable media loading (images and videos).
 * Provides a state machine, lifecycle events, cache detection and metadata
 * extraction shared by every concrete media loader.
 */

import { EventEmitter } from 'events';
import TinyMediaProgress from './TinyMediaProgress.mjs';
import TinyMediaCache from './TinyMediaCache.mjs';

/**
 * @typedef {Object} MediaLoaderOptions
 * @property {string} [src] - The media source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {HTMLElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {TinyMediaCache|null} [cache] - An optional shared memory cache.
 */

/**
 * @typedef {Object} MediaSrcChangePayload
 * @property {string} src - The new source URL.
 * @property {string} previousSrc - The previous source URL.
 */

/**
 * @typedef {Object} MediaMetadata
 * @property {string} src - The resolved source URL.
 * @property {string} type - The media MIME type (e.g., "image/png").
 * @property {number} width - The intrinsic width in pixels.
 * @property {number} height - The intrinsic height in pixels.
 * @property {number} duration - The duration in seconds (0 for images).
 * @property {number} size - The decoded size in bytes (0 when unknown).
 * @property {boolean} fromCache - Whether the media was served from the cache.
 * @property {number} loadTime - The total load time in milliseconds.
 * @property {number} timestamp - The epoch timestamp when the load finished.
 */

/**
 * @typedef {Object} MediaMetadataDetails
 * @property {string} type - The media MIME type.
 * @property {number} width - The intrinsic width in pixels.
 * @property {number} height - The intrinsic height in pixels.
 * @property {number} duration - The duration in seconds.
 * @property {number} size - The decoded size in bytes.
 */

/**
 * @typedef {(metadata: MediaMetadata) => void} MediaLoadHandler
 */

/**
 * @typedef {(error: Error) => void} MediaErrorHandler
 */

/**
 * @typedef {(payload: { src: string }) => void} MediaStartHandler
 */

/**
 * @typedef {(payload: MediaSrcChangePayload) => void} MediaSrcChangeHandler
 */

/**
 * @typedef {() => void} MediaVoidHandler
 */

/**
 * Base class that orchestrates the full lifecycle of a media element.
 * It must be extended. Concrete subclasses implement `_createElement`,
 * `_startLoad`, `_getMetadataDetails`, `_abort` and `_cleanup`.
 * @abstract
 */
class TinyMediaLoader extends EventEmitter {
  /**
   * Immutable state machine values used by every media loader.
   */
  static MediaState = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    LOADED: 'loaded',
    ERROR: 'error',
    DESTROYED: 'destroyed',
  });

  /**
   * The uppercase tag name of the element this loader manages.
   * Subclasses must override it so the constructor can validate adopted elements.
   * @returns {string}
   */
  static get tagName() {
    return '';
  }

  /** @type {string} */
  #src;
  /** @type {string} */
  #state = TinyMediaLoader.MediaState.IDLE;
  /** @type {HTMLElement|null} */
  #element = null;
  /** @type {number} */
  #timeout;
  /** @type {number} */
  #startTime = 0;
  /** @type {number} */
  #endTime = 0;
  /** @type {boolean} */
  #cacheHint = false;
  /** @type {boolean} */
  #autoReload = false;
  /** @type {MutationObserver|null} */
  #observer = null;
  /** @type {TinyMediaProgress|null} */
  #progress = null;
  /** @type {AbortController|null} */
  #controller = null;
  /** @type {Array<() => void>} */
  #detachers = [];
  /** @type {TinyMediaCache|null} */
  #cache = null;

  /** @type {MediaMetadata} */
  #metadata = {
    src: '',
    type: '',
    width: 0,
    height: 0,
    duration: 0,
    size: 0,
    fromCache: false,
    loadTime: 0,
    timestamp: 0,
  };

  /**
   * @param {MediaLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `options` is not a plain object.
   * @throws {TypeError} If `options.src` is not a string.
   * @throws {RangeError} If `options.timeout` is not a positive number.
   * @throws {TypeError} If `options.element` is neither null nor an HTMLElement.
   * @throws {TypeError} If `options.element` does not match the loader tag name.
   */
  constructor(options = {}) {
    if (options === null || typeof options !== 'object') {
      throw new TypeError('The "options" argument must be an object.');
    }
    const { src, timeout = 30000, element = null, autoReload = false } = options;
    if (src !== undefined && typeof src !== 'string') {
      throw new TypeError('The "src" option must be a string.');
    }
    if (typeof timeout !== 'number' || Number.isNaN(timeout) || timeout < 0) {
      throw new RangeError('The "timeout" option must be a positive number.');
    }
    if (element !== null && !(element instanceof HTMLElement)) {
      throw new TypeError('The "element" option must be an HTMLElement or null.');
    }
    super();
    const expectedTag = /** @type {typeof TinyMediaLoader} */ (this.constructor).tagName;
    if (element && expectedTag && element.tagName !== expectedTag) {
      throw new TypeError(`The "element" option must be a <${expectedTag.toLowerCase()}> element.`);
    }
    this.#src = src ?? element?.getAttribute('src') ?? '';
    this.#timeout = timeout;
    this.#autoReload = Boolean(autoReload);
    this.#cache = options.cache ?? null;
    this.#metadata.src = this.#src;
    if (element) {
      this.#element = element;
      this.#startObserver();
    }
  }

  /**
   * The current source URL.
   * @returns {string}
   */
  get src() {
    return this.#src;
  }

  /**
   * Updates the source URL and mirrors it into the DOM element.
   * @param {string} value - The new source URL.
   * @throws {TypeError} If `value` is not a string.
   */
  set src(value) {
    if (typeof value !== 'string') {
      throw new TypeError('The "src" value must be a string.');
    }
    if (!this.#applySrc(value)) {
      return;
    }
    if (this.#element && this.#element.getAttribute('src') !== value) {
      if (value) {
        this.#element.setAttribute('src', value);
      } else {
        this.#element.removeAttribute('src');
      }
      this._flushMutations();
    }
  }

  /**
   * The current lifecycle state.
   * @returns {string}
   */
  get state() {
    return this.#state;
  }

  /**
   * The underlying DOM element (available after construction of the subclass).
   * @returns {HTMLElement|null}
   */
  get element() {
    return this.#element;
  }

  /**
   * A defensive copy of the last known metadata.
   * @returns {MediaMetadata}
   */
  get metadata() {
    return { ...this.#metadata };
  }

  /**
   * @returns {boolean} True while the media is loading.
   */
  get isLoading() {
    return this.#state === TinyMediaLoader.MediaState.LOADING;
  }

  /**
   * @returns {boolean} True when the media has finished loading.
   */
  get isLoaded() {
    return this.#state === TinyMediaLoader.MediaState.LOADED;
  }

  /**
   * @returns {boolean} True when the last load failed.
   */
  get hasError() {
    return this.#state === TinyMediaLoader.MediaState.ERROR;
  }

  /**
   * The active progress tracker, or null when the load has not started.
   * @returns {TinyMediaProgress|null}
   */
  get progress() {
    return this.#progress;
  }

  /**
   * The shared memory cache, or null when disabled.
   * @returns {TinyMediaCache|null}
   */
  get cache() {
    return this.#cache;
  }

  /**
   * @param {TinyMediaCache|null} value - The new cache instance.
   * @throws {TypeError} If `value` is neither a TinyMediaCache nor null.
   */
  set cache(value) {
    if (value !== null && !(value instanceof TinyMediaCache)) {
      throw new TypeError('The "cache" value must be a TinyMediaCache or null.');
    }
    this.#cache = value;
  }

  /**
   * The AbortController bound to the current load.
   * @returns {AbortController}
   */
  get signal() {
    if (!this.#controller) {
      this.#controller = new AbortController();
    }
    return this.#controller;
  }

  /**
   * Creates a fresh progress tracker and resets the AbortController.
   * @protected
   * @param {number} [total] - The total number of bytes (0 when unknown).
   * @returns {TinyMediaProgress}
   */
  _createProgress(total = 0) {
    this.#controller = new AbortController();
    this.#progress = new TinyMediaProgress(total).start();
    return this.#progress;
  }

  /**
   * Emits a progress snapshot when a tracker is active.
   * @protected
   * @returns {void}
   */
  _emitProgress() {
    if (this.#progress) {
      this.emit('progress', this.#progress.snapshot());
    }
  }

  /**
   * Forwards DOM events from an element to this emitter.
   * @protected
   * @param {HTMLElement} element - The source element.
   * @param {string[]} events - The DOM event names to forward.
   * @returns {void}
   */
  _forwardEvents(element, events) {
    for (const name of events) {
      const handler = (/** @type {Event} */ event) => this.emit(name, event);
      element.addEventListener(name, handler);
      this.#detachers.push(() => element.removeEventListener(name, handler));
    }
  }

  /**
   * Removes every forwarded DOM listener.
   * @protected
   * @returns {void}
   */
  _detachEvents() {
    for (const off of this.#detachers) {
      off();
    }
    this.#detachers = [];
  }

  /**
   * Starts loading the media and resolves with the final metadata.
   * @returns {Promise<MediaMetadata>}
   * @throws {Error} If the loader was destroyed or has no source.
   */
  async load() {
    if (this.#state === TinyMediaLoader.MediaState.DESTROYED) {
      throw new Error('Cannot load a destroyed media loader.');
    }
    if (this.#state === TinyMediaLoader.MediaState.LOADING) {
      throw new Error('The media is already loading.');
    }
    if (!this.#src) {
      throw new Error('Cannot load media without a source.');
    }

    this.#startTime = performance.now();
    this._createProgress(0);
    this.#state = TinyMediaLoader.MediaState.LOADING;
    this.emit('loadstart', { src: this.#src });

    try {
      await this.#withTimeout(this._startLoad());
      this.#endTime = performance.now();
      this.#metadata = this.#buildMetadata();
      this.#state = TinyMediaLoader.MediaState.LOADED;
      this.emit('load', this.metadata);
      return this.metadata;
    } catch (error) {
      this.#endTime = performance.now();
      this.#state = TinyMediaLoader.MediaState.ERROR;
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Resets the state machine and loads the current source again.
   * @returns {Promise<MediaMetadata>}
   * @throws {Error} If the loader is loading or was destroyed.
   */
  async reload() {
    if (this.#state === TinyMediaLoader.MediaState.LOADING) {
      throw new Error('Cannot reload while the media is loading.');
    }
    if (this.#state === TinyMediaLoader.MediaState.DESTROYED) {
      throw new Error('Cannot reload a destroyed media loader.');
    }
    this.#state = TinyMediaLoader.MediaState.IDLE;
    return this.load();
  }

  /**
   * Appends the media element to a container.
   * @param {HTMLElement} container - The parent element.
   * @returns {TinyMediaLoader} The current instance for chaining.
   * @throws {TypeError} If `container` is not an HTMLElement.
   * @throws {Error} If the element has not been created yet.
   */
  mount(container) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError('The "container" argument must be an HTMLElement.');
    }
    if (!this.#element) {
      throw new Error('Cannot mount before the media element is created.');
    }
    container.appendChild(this.#element);
    return this;
  }

  /**
   * Releases every resource and detaches all listeners.
   * @returns {void}
   */
  destroy() {
    if (this.#state === TinyMediaLoader.MediaState.DESTROYED) {
      return;
    }
    this._cleanup();
    this._detachEvents();
    this.#stopObserver();
    if (this.#controller) {
      this.#controller.abort();
    }
    if (this.#cache && this.#src) {
      this.#cache.release(this.#src);
    }
    this.#state = TinyMediaLoader.MediaState.DESTROYED;
    this.emit('destroy', undefined);
    this.removeAllListeners();
    this.#element = null;
  }

  /**
   * Returns the adopted element, creating a new one when none was provided.
   * Subclasses must call this inside `_startLoad`.
   * @protected
   * @returns {HTMLElement}
   */
  _resolveElement() {
    if (!this.#element) {
      this.#element = this._createElement();
    }
    this.#startObserver();
    return this.#element;
  }

  /**
   * Registers a concrete DOM element. Kept for advanced subclasses.
   * @protected
   * @param {HTMLElement} element - The element to expose through `element`.
   * @returns {void}
   */
  _setElement(element) {
    this.#element = element;
    this.#startObserver();
  }

  /**
   * Flags that the media was served from the cache before the network layer ran.
   * @protected
   * @param {boolean} value - The cache hint.
   * @returns {void}
   */
  _setCacheHint(value) {
    this.#cacheHint = Boolean(value);
  }

  /**
   * The total time spent loading, in milliseconds.
   * @protected
   * @returns {number}
   */
  _getLoadTime() {
    return this.#endTime - this.#startTime;
  }

  /**
   * Uses the Resource Timing API to detect a cache hit.
   * @protected
   * @returns {boolean}
   */
  _detectCache() {
    if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') {
      return false;
    }
    const entries = performance.getEntriesByName(this.#src);
    if (entries.length === 0) {
      return false;
    }
    const entry = /** @type {PerformanceResourceTiming} */ (entries[entries.length - 1]);
    return entry.transferSize === 0 && entry.decodedBodySize > 0;
  }

  /**
   * Reads the decoded size of the resource from the Resource Timing API.
   * @protected
   * @returns {number} The size in bytes, or 0 when unavailable.
   */
  _getResourceSize() {
    if (typeof performance === 'undefined' || typeof performance.getEntriesByName !== 'function') {
      return 0;
    }
    const entries = performance.getEntriesByName(this.#src);
    if (entries.length === 0) {
      return 0;
    }
    const entry = /** @type {PerformanceResourceTiming} */ (entries[entries.length - 1]);
    return entry.decodedBodySize || entry.transferSize || 0;
  }

  /**
   * Discards every pending mutation record.
   * Subclasses must call this right after mutating the element internally,
   * otherwise the observer reports a false external change.
   * @protected
   * @returns {void}
   */
  _flushMutations() {
    if (this.#observer) {
      this.#observer.takeRecords();
    }
  }

  /**
   * Applies a new source value and emits `srcchange` when it differs.
   * @param {string} value - The candidate source URL.
   * @returns {boolean} True when the value actually changed.
   */
  #applySrc(value) {
    if (value === this.#src) {
      return false;
    }
    const previousSrc = this.#src;
    this.#src = value;
    this.#metadata.src = value;
    this.emit('srcchange', { src: value, previousSrc });
    return true;
  }

  /**
   * Starts observing the element for external `src` mutations.
   * @returns {void}
   */
  #startObserver() {
    if (this.#observer || typeof MutationObserver === 'undefined' || !this.#element) {
      return;
    }
    this.#observer = new MutationObserver(() => this.#handleExternalSrcChange());
    this.#observer.observe(this.#element, {
      attributes: true,
      attributeFilter: ['src'],
    });
  }

  /**
   * Stops observing the element and drops every queued mutation.
   * @returns {void}
   */
  #stopObserver() {
    if (this.#observer) {
      this.#observer.disconnect();
      this.#observer = null;
    }
  }

  /**
   * Reacts to a `src` attribute change that did not come from this class.
   * @returns {void}
   */
  #handleExternalSrcChange() {
    const element = this.#element;
    if (!element) {
      return;
    }
    const next = element.getAttribute('src') ?? '';
    if (next === this.#src) {
      return;
    }
    this.#applySrc(next);
    if (this.#autoReload) {
      this.reload().catch((error) => {
        if (this.listenerCount('error') > 0) {
          this.emit('error', error);
        }
      });
    }
  }

  /**
   * Builds the final metadata object.
   * @returns {MediaMetadata}
   */
  #buildMetadata() {
    return {
      src: this.#src,
      fromCache: this.#cacheHint || this._detectCache(),
      loadTime: this.#endTime - this.#startTime,
      timestamp: Date.now(),
      ...this._getMetadataDetails(),
    };
  }

  /**
   * @param {Promise<*>} promise - The promise to guard.
   * @returns {Promise<*>}
   */
  #withTimeout(promise) {
    if (this.#timeout <= 0) {
      return promise;
    }
    return new Promise((resolve, reject) => {
      const id = setTimeout(() => {
        this._abort();
        reject(new Error(`Media load timed out after ${this.#timeout}ms.`));
      }, this.#timeout);
      promise.then(
        (value) => {
          clearTimeout(id);
          resolve(value);
        },
        (error) => {
          clearTimeout(id);
          reject(error);
        },
      );
    });
  }

  /**
   * Creates a brand new element. Must be implemented by subclasses.
   * @abstract
   * @protected
   * @returns {HTMLElement}
   */
  _createElement() {
    throw new Error('The "_createElement" method must be implemented by a subclass.');
  }

  /**
   * Performs the actual load. Must be implemented by subclasses.
   * @abstract
   * @protected
   * @returns {Promise<void>}
   */
  _startLoad() {
    throw new Error('The "_startLoad" method must be implemented by a subclass.');
  }

  /**
   * Returns the media-specific metadata. Must be implemented by subclasses.
   * @abstract
   * @protected
   * @returns {MediaMetadataDetails}
   */
  _getMetadataDetails() {
    return { type: '', width: 0, height: 0, duration: 0, size: 0 };
  }

  /**
   * Aborts an in-flight load. Subclasses should override when the media supports it.
   * @abstract
   * @protected
   * @returns {void}
   */
  _abort() {}

  /**
   * Releases any listener or timer created by the subclass.
   * @abstract
   * @protected
   * @returns {void}
   */
  _cleanup() {}
}

export default TinyMediaLoader;
