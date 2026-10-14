/**
 * @fileoverview Base class for controllable media loading (images and videos).
 * Provides a state machine, lifecycle events, cache detection and metadata
 * extraction shared by every concrete media loader.
 */

import { EventEmitter } from 'events';
/** @import { ICustomEventEmitter } from '../../../jsdoc/EventEmitter.mjs' */
import TinyMediaProgress from './utils/TinyMediaProgress.mjs';
import TinyMediaCache from './utils/TinyMediaCache.mjs';
import TinyMediaMirror from './utils/TinyMediaMirror.mjs';

/**
 * @template {string} Name
 * @template {unknown[]} Args
 * @typedef {import('./utils/TinyMediaMirror.mjs').MediaMirrorEntry<Name, Args>} MediaMirrorEntry
 */

/**
 * @template {string} Name
 * @template {unknown[]} Args
 * @typedef {import('./utils/TinyMediaMirror.mjs').MediaMirrorEvent<Name, Args>} MediaMirrorEvent
 */

/**
 * Describes the configuration object accepted by the {@link TinyMediaLoader} constructor.
 * Every property is optional, so a loader can be created empty and configured later.
 * @template {HTMLImageElement|HTMLVideoElement|HTMLAudioElement} HTMLMainElement
 * @typedef {Object} MediaLoaderOptions
 * @property {string} [src] - The media source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {HTMLMainElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [originalSrc] - Whether the original URL is mirrored into the `original-src` attribute.
 * @property {boolean} [earlyDecode] - Whether to decode image dimensions from the response headers using WebCodecs.
 * @property {boolean} [progressive] - Whether to render progressively during fetch (default true).
 * @property {boolean} [useHeadRequest] - Whether to perform a HEAD request to fetch HTTP headers before downloading.
 * @property {boolean} [mirror] - Whether concurrent loads of the same source share a single download (default true).
 * @property {TinyMediaCache|null} [cache] - An optional shared memory cache.
 */

/**
 * Describes the payload emitted whenever the source URL changes, whether the change
 * originated inside the loader or from an external DOM mutation.
 * @typedef {Object} MediaSrcChangePayload
 * @property {string} src - The new source URL.
 * @property {string} previousSrc - The previous source URL.
 */

/**
 * Describes the payload emitted when the element swaps the network source for
 * an internal object URL (or the reverse) during a streamed load.
 * @typedef {Object} MediaSrcTransitionPayload
 * @property {string} src - The original network source URL.
 * @property {string|null} internalSrc - The internal object URL, or null when it is cleared.
 */

/**
 * Describes the immutable snapshot of everything known about a finished load.
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
 * @property {import('./probe/TinyImageProbe.mjs').AnimationProbeData | null} animation - The animation data.
 * @property {Record<string, string>} [httpHeaders] - All HTTP response headers captured during the fetch.
 */

/**
 * Describes the payload emitted when a new chunk is downloaded.
 * @typedef {Object} MediaChunkPayload
 * @property {Uint8Array} chunk - The binary chunk.
 * @property {number} loaded - The total bytes downloaded so far.
 * @property {number} total - The total bytes of the media (0 when unknown).
 */

/**
 * Describes the payload emitted when a loader attaches to an in-flight download.
 * @typedef {Object} MediaMirrorPayload
 * @property {string} src - The source URL shared by both loaders.
 * @property {string} key - The normalized registry key.
 * @property {number} size - The size of the shared payload in bytes.
 * @property {number} mirrors - The number of loaders attached to the download.
 * @property {number} replayed - The number of historical events caught up on attach.
 */

/**
 * Describes the media specific values returned by the abstract `_getMetadataDetails` hook
 * and merged into the final {@link MediaMetadata} object.
 * @typedef {Object} MediaMetadataDetails
 * @property {string} type - The media MIME type.
 * @property {number} width - The intrinsic width in pixels.
 * @property {number} height - The intrinsic height in pixels.
 * @property {number} duration - The duration in seconds.
 * @property {number} size - The decoded size in bytes.
 */

/**
 * @callback DecoderCreator
 * Builds a decoder backed by the container header parser.
 * @param {string} mime - The video MIME type.
 * @returns {MediaEarlyDecoder} The decoder.
 */

/**
 * Handles a successful media load.
 * @typedef {(metadata: MediaMetadata) => void} MediaLoadHandler
 */

/**
 * Handles a failed media load.
 * @typedef {(error: Error) => void} MediaErrorHandler
 */

/**
 * Handles the start of a media load.
 * @typedef {(payload: { src: string }) => void} MediaStartHandler
 */

/**
 * Handles a source URL change.
 * @typedef {(payload: MediaSrcChangePayload) => void} MediaSrcChangeHandler
 */

/**
 * Handles an event that carries no payload.
 * @typedef {() => void} MediaVoidHandler
 */

/**
 * Describes the payload emitted on every state machine transition.
 * @typedef {Object} MediaStateChangePayload
 * @property {string} state - The new state.
 * @property {string} previous - The previous state.
 * @property {string} src - The source URL the transition belongs to.
 */

/**
 * Describes the payload emitted when a load exceeds the configured timeout.
 * @typedef {Object} MediaTimeoutPayload
 * @property {string} src - The source URL that timed out.
 * @property {number} timeout - The configured timeout in milliseconds.
 */

/**
 * Handle returned by the early decoder factory. It is a thin wrapper around the
 * WebCodecs `ImageDecoder` so the loader can push chunks and release the
 * decoder without knowing whether the API is available.
 * @typedef {Object} MediaEarlyDecoder
 * @property {(chunk: Uint8Array) => void} write - Pushes a chunk into the decoder.
 * @property {() => void} close - Closes the decoder and releases its resources.
 * @property {() => Partial<MediaMetadata>|null} [finalize] - Flushes the metadata that is only known at the end of the stream.
 */

/**
 * @typedef {'HEAD'|'GET'|'PROBE'|'DECODE'|'CACHE'|'LOADED_METADATA'|'DURATION_CHANGE'|'PROBE_ANIMATION'|'MIRROR'} MediaMetadataType
 */

/**
 * Describes the events emitted by the {@link TinyMediaLoader}.
 * @typedef {Object} MediaLoaderEvents
 * @property {(payload: { src: string }) => void} loadstart - Emitted when a media load process begins.
 * @property {(metadata: MediaMetadata) => void} loaded - Emitted when the media has been fully loaded and decoded.
 * @property {(payload: { src: string, state: string }) => void} loadend - Emitted when the loading process finishes, regardless of success or failure.
 * @property {(payload: { src: string }) => void} abort - Emitted when the current load operation is cancelled.
 * @property {(error: Error) => void} error - Emitted when an unrecoverable error occurs during loading.
 * @property {(payload: { src: string, timeout: number }) => void} timeout - Emitted when the load operation exceeds the configured timeout.
 * @property {(payload: import('./utils/TinyMediaProgress.mjs').MediaProgressSnapshot) => void} progress - Emitted periodically to provide download progress updates.
 * @property {(metadata: MediaMetadata, type: MediaMetadataType) => void} metadata - Emitted whenever media metadata is partially or fully resolved.
 * @property {(response: Response) => void} response - Emitted when the main HTTP response for the media resource is received.
 * @property {(response: Response) => void} headResponse - Emitted when the HTTP HEAD response is received.
 * @property {(payload: MediaSrcChangePayload) => void} srcchange - Emitted when the source URL of the loader is changed.
 * @property {(payload: MediaSrcTransitionPayload) => void} srctransition - Emitted when the element's source swaps between a network URL and an internal object URL.
 * @property {(entry: import('./utils/TinyMediaCache.mjs').MediaCacheEntry) => void} cachemiss - Emitted when the resource is not found in the cache.
 * @property {(entry: import('./utils/TinyMediaCache.mjs').MediaCacheEntry) => void} cachehit - Emitted when the resource is successfully retrieved from the cache.
 * @property {(payload: { state: string, previous: string, src: string }) => void} statechange - Emitted when the loader transitions from one state to another.
 * @property {(payload: { chunk: Uint8Array, loaded: number, total: number }) => void} chunk - Emitted every time a binary data chunk is received during streaming.
 * @property {(payload: MediaMirrorPayload) => void} mirror - Emitted when the download is shared with another loader.
 * @property {() => void} destroy - Emitted when the loader is destroyed and its resources are released.
 */

/** @type {new () => ICustomEventEmitter<MediaLoaderEvents>} */
const TypedEmitter = /** @type {any} */ (EventEmitter);

/**
 * Base class that orchestrates the full lifecycle of a media element.
 * It must be extended. Concrete subclasses implement `_createElement`,
 * `_startLoad`, `_getMetadataDetails`, `_abort` and `_cleanup`.
 * @abstract
 * @template {HTMLImageElement|HTMLVideoElement|HTMLAudioElement} HTMLMainElement
 * @augments TypedEmitter
 */
class TinyMediaLoader extends TypedEmitter {
  /**
   * The registry that deduplicates concurrent downloads.
   * @returns {typeof TinyMediaMirror} The shared mirror registry.
   */
  static get TinyMediaMirror() {
    return TinyMediaMirror;
  }

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
   * @returns {string} The uppercase tag name, or an empty string when the subclass does not override it.
   */
  static get tagName() {
    return '';
  }

  /** @type {string} */
  #src;
  /** @type {string} */
  #state = TinyMediaLoader.MediaState.IDLE;
  /** @type {HTMLMainElement|null} */
  #element = null;
  /** @type {number} */
  #timeout;
  /** @type {number} */
  #startTime = 0;
  /** @type {number} */
  #endTime = 0;
  /** @type {boolean} */
  #useHeadRequest = false;
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
  /** @type {boolean} */
  #cacheAcquired = false;
  /** @type {boolean} */
  #aborted = false;
  /** @type {string|null} */
  #internalSrc = null;
  /** @type {ReturnType<typeof setTimeout>|null} */
  #timeoutId = null;
  /** @type {string|null} */
  #objectUrl = null;
  /** @type {boolean} */
  #originalSrc = false;
  /** @type {number} */
  #resourceSize = 0;
  /** @type {boolean} */
  #earlyDecode = false;
  /** @type {MediaEarlyDecoder|null} */
  #decoder = null;
  /** @type {boolean} */
  #progressive = true;
  /** @type {Response|null} */
  #response = null;
  /** @type {Response|null} */
  #headResponse = null;
  /** @type {Map<string, DecoderCreator>} */
  #decoders = new Map();
  /** @type {boolean} */
  #mirror = true;
  /** @type {boolean} */
  #mirrored = false;
  /** @type {boolean} */
  #replaying = false;
  /** @type {((name: string, args: unknown[]) => void)|null} */
  #publish = null;

  /** @type {Partial<MediaMetadata>} */
  #partial = {};

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
    animation: null,
  };

  /**
   * @param {MediaLoaderOptions<HTMLMainElement>} [options] - The loader configuration.
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
    const {
      src,
      timeout = 30000,
      element = null,
      autoReload = false,
      originalSrc = false,
      earlyDecode = true,
      progressive = true,
      useHeadRequest = false,
      mirror = true,
    } = options;

    if (src !== undefined && typeof src !== 'string') {
      throw new TypeError('The "src" option must be a string.');
    }
    if (typeof timeout !== 'number' || Number.isNaN(timeout) || timeout < 0) {
      throw new RangeError('The "timeout" option must be a positive number.');
    }
    if (element !== null && !(element instanceof HTMLElement)) {
      throw new TypeError('The "element" option must be an HTMLElement or null.');
    }
    if (typeof originalSrc !== 'boolean') {
      throw new TypeError('The "originalSrc" option must be a boolean.');
    }
    if (typeof earlyDecode !== 'boolean') {
      throw new TypeError('The "earlyDecode" option must be a boolean.');
    }
    if (typeof progressive !== 'boolean') {
      throw new TypeError('The "progressive" option must be a boolean.');
    }
    if (typeof mirror !== 'boolean') {
      throw new TypeError('The "mirror" option must be a boolean.');
    }

    super();
    const expectedTag = /** @type {typeof TinyMediaLoader} */ (this.constructor).tagName;
    if (element && expectedTag && element.tagName !== expectedTag) {
      throw new TypeError(`The "element" option must be a <${expectedTag.toLowerCase()}> element.`);
    }
    this.#src = src ?? element?.getAttribute('src') ?? '';
    this.#timeout = timeout;
    this.#autoReload = Boolean(autoReload);
    this.#originalSrc = originalSrc;
    this.#cache = options.cache ?? null;
    this.#resetLoadState();
    this.#useHeadRequest = useHeadRequest;
    this.#earlyDecode = earlyDecode;
    this.#progressive = progressive;
    this.#mirror = mirror;
    if (element) {
      this.#element = element;
      this.#startObserver();
    }
  }

  /**
   * Events that are never broadcast to the mirror registry.
   *
   * - `mirror` would recurse forever.
   * - `destroy` is scoped to a single instance and tears down the emitter.
   * - `error` is excluded because a failed leader makes its mirrors fall back
   *   to their own request, which owns the error path from that point on.
   * @type {ReadonlySet<string|symbol>}
   */
  static #UNMIRRORED = new Set(['mirror', 'destroy', 'error', 'metadata']);

  /**
   * Emits an event and, when this loader leads a mirrored download, broadcasts
   * it to every attached mirror. The local listeners always run first so a slow
   * mirror can never delay the loader that owns the network request.
   * @template {keyof MediaLoaderEvents} K
   * @param {K} name - The event name.
   * @param {Parameters<MediaLoaderEvents[K]>} args - The event arguments.
   * @returns {boolean} True when the event had listeners.
   */
  emit(name, ...args) {
    const result = super.emit(name, ...args);
    if (this.#publish && !this.#replaying && !TinyMediaLoader.#UNMIRRORED.has(name)) {
      this.#publish(name, args);
    }
    return result;
  }

  /**
   * Whether concurrent loads of the same source share a single download.
   * @returns {boolean} True when mirroring is enabled.
   */
  get mirror() {
    return this.#mirror;
  }

  /**
   * Whether the last download was served by another loader.
   * @returns {boolean} True when the payload was shared by a mirrored download.
   */
  get mirrored() {
    return this.#mirrored;
  }

  /**
   * The HTTP response received from the media resource.
   * @returns {Response|null} The response object, or null if no response has been received yet.
   */
  get response() {
    return this.#response;
  }

  /**
   * The HTTP response received from the preliminary HEAD request.
   * @returns {Response|null} The response object, or null if no HEAD request was performed or received.
   */
  get headResponse() {
    return this.#headResponse;
  }

  /**
   * Whether to perform a HEAD request to fetch HTTP headers before downloading.
   * @returns {boolean}
   */
  get useHeadRequest() {
    return this.#useHeadRequest;
  }

  /**
   * The object URL created for a streamed blob, when one exists.
   * @returns {string|null} The active object URL, or null when none was created.
   */
  get objectUrl() {
    return this.#objectUrl;
  }

  /**
   * The current source URL.
   * @returns {string} The current source URL, or an empty string when unset.
   */
  get src() {
    return this.#src;
  }

  /**
   * The internal object URL currently assigned to the element.
   * @returns {string|null} The object URL assigned internally, or null when the element uses the network source.
   */
  get internalSrc() {
    return this.#internalSrc;
  }

  /**
   * Whether the loader mirrors the original URL into the `original-src` attribute.
   * @returns {boolean} True when the attribute is managed by this loader.
   */
  get originalSrc() {
    return this.#originalSrc;
  }

  /**
   * Whether the loader decodes the image dimensions from the response headers
   * through the WebCodecs `ImageDecoder`.
   * @returns {boolean} True when early decoding is enabled.
   */
  get earlyDecode() {
    return this.#earlyDecode;
  }

  /**
   * Whether the loader progressively updates the media element while downloading.
   * @returns {boolean} True when progressive loading is enabled.
   */
  get progressive() {
    return this.#progressive;
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
   * Indicates whether the last load was cancelled through {@link TinyMediaLoader#abort}.
   * @returns {boolean} True when the in-flight load was aborted.
   */
  get aborted() {
    return this.#aborted;
  }

  /**
   * Indicates whether this loader currently holds a reference on a shared cache entry.
   * @returns {boolean} True while a cache reference is held.
   */
  get cacheAcquired() {
    return this.#cacheAcquired;
  }

  /**
   * Indicates whether an external `src` change triggers an automatic reload.
   * @returns {boolean} True when automatic reloading is enabled.
   */
  get autoReload() {
    return this.#autoReload;
  }

  /**
   * Indicates whether the last load was served from the cache.
   * @returns {boolean} True when the last load was a cache hit.
   */
  get cacheHint() {
    return this.#cacheHint;
  }

  /**
   * The epoch timestamp, in milliseconds, captured when the last load finished.
   * @returns {number} The end timestamp, or 0 when no load has finished yet.
   */
  get endTime() {
    return this.#endTime;
  }

  /**
   * The high resolution timestamp captured when the last load started.
   * @returns {number} The start timestamp, or 0 when no load has started yet.
   */
  get startTime() {
    return this.#startTime;
  }

  /**
   * The current lifecycle state.
   * @returns {string} One of the {@link TinyMediaLoader.MediaState} values.
   */
  get state() {
    return this.#state;
  }

  /**
   * The underlying DOM element (available after construction of the subclass).
   * @returns {HTMLMainElement|null} The managed element, or null before it is created.
   */
  get element() {
    return this.#element;
  }

  /**
   * A defensive copy of the last known metadata.
   * @returns {MediaMetadata} A shallow copy that is safe for the caller to mutate.
   */
  get metadata() {
    return { ...this.#metadata, httpHeaders: { ...this.#metadata.httpHeaders } };
  }

  /**
   * The total size in bytes of the media downloaded through the streaming path.
   * @returns {number} The number of bytes streamed, or `0` when the media was not streamed.
   */
  get resourceSize() {
    return this.#resourceSize;
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
      throw new Error('Signal does not exist.');
    }
    return this.#controller;
  }

  /**
   * Registers a decoder factory for a specific MIME type.
   * This allows the loader to instantiate the correct decoder for different media formats.
   * @protected
   * @param {string} mime - The MIME type (or prefix) that this decoder handles.
   * @param {DecoderCreator} callback - The factory function used to create the decoder.
   * @returns {void}
   */
  _insertDecoder(mime, callback) {
    this.#decoders.set(mime, callback);
  }

  /**
   * Creates a fresh progress tracker for the current load.
   * @protected
   * @param {number} [total] - The total number of bytes (0 when unknown).
   * @returns {TinyMediaProgress} The freshly created and already started progress tracker.
   */
  _createProgress(total = 0) {
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
   * Merges a partial metadata patch into the current snapshot and notifies the
   * listeners. It is called as soon as the response headers arrive, so a
   * consumer can render the file type and size before the download finishes.
   * Keys whose value is `undefined` are ignored, so a decoder that cannot
   * resolve a dimension never clobbers a value that was already known.
   * @protected
   * @param {Partial<MediaMetadata>} patch - The values to merge.
   * @param {MediaMetadataType} type - The action type.
   * @returns {void}
   * @throws {TypeError} If `patch` is not a plain object.
   */
  _emitMetadata(patch, type) {
    if (patch === null || typeof patch !== 'object') {
      throw new TypeError('The "patch" argument must be an object.');
    }
    const clean = /** @type {Partial<MediaMetadata>} */ (
      Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined))
    );
    this.#partial = { ...this.#partial, ...clean };
    this.#metadata = { ...this.#metadata, ...clean };
    this.#publish?.('metadata', [clean, type]);
    this.emit('metadata', this.metadata, type);
  }

  /**
   * Registers a DOM listener that is removed on the next load or on destroy.
   * @protected
   * @param {HTMLMainElement} element - The source element.
   * @param {string} type - The DOM event name.
   * @param {EventListener} handler - The listener to register.
   * @returns {void}
   */
  _on(element, type, handler) {
    element.addEventListener(type, handler);
    this.#detachers.push(() => element.removeEventListener(type, handler));
  }

  /**
   * Forwards DOM events from an element to this emitter.
   * @protected
   * @param {HTMLMainElement} element - The source element.
   * @param {string[]} events - The DOM event names to forward.
   * @returns {void}
   */
  _forwardEvents(element, events) {
    for (const name of events) {
      this._on(element, name, (event) => {
        /** @type {any} */
        // @ts-ignore
        this.emit(name, event);
      });
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
   * @returns {Promise<MediaMetadata>} A promise that resolves with the final metadata of the loaded media.
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

    this._detachEvents();
    this._releaseFromCache();
    this.#resetLoadState();
    this.#closeDecoder();
    this.#createController();
    this._createProgress(0);
    this.#setState(TinyMediaLoader.MediaState.LOADING);
    this.emit('loadstart', { src: this.#src });

    try {
      await this.#withTimeout(this._startLoad());
      this.#endTime = performance.now();
      this.#metadata = this.#buildMetadata();
      this.#setState(TinyMediaLoader.MediaState.LOADED);
      this.emit('loaded', this.#metadata);
      return this.#metadata;
    } catch (error) {
      this.#endTime = performance.now();
      if (this.#aborted) {
        this.#aborted = false;
        this.#setState(TinyMediaLoader.MediaState.IDLE);
        this.emit('abort', { src: this.#src });
      } else {
        this.#setState(TinyMediaLoader.MediaState.ERROR);
        this.#emitError(/** @type {Error} */ (error));
      }
      throw error;
    } finally {
      this.emit('loadend', { src: this.#src, state: this.#state });
    }
  }

  /**
   * Resets the state machine and loads the current source again.
   * @returns {Promise<MediaMetadata>} A promise that resolves with the metadata of the new load.
   * @throws {Error} If the loader is loading or was destroyed.
   */
  async reload() {
    if (this.#state === TinyMediaLoader.MediaState.LOADING) {
      throw new Error('Cannot reload while the media is loading.');
    }
    if (this.#state === TinyMediaLoader.MediaState.DESTROYED) {
      throw new Error('Cannot reload a destroyed media loader.');
    }
    this.#progress?.reset();
    this.#state = TinyMediaLoader.MediaState.IDLE;
    return this.load();
  }

  /**
   * Cancels the in-flight load, if any.
   * @returns {boolean} True when a load was cancelled.
   */
  abort() {
    if (this.#state !== TinyMediaLoader.MediaState.LOADING) {
      return false;
    }
    this.#aborted = true;
    if (this.#controller) {
      this.#controller.abort();
    }
    return true;
  }

  /**
   * Appends the media element to a container.
   * @param {HTMLMainElement} container - The parent element.
   * @returns {TinyMediaLoader<HTMLMainElement>} The current instance for chaining.
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
    this.#state = TinyMediaLoader.MediaState.DESTROYED;
    if (this.#controller) {
      this.#controller.abort();
    }
    this._cleanup();
    this._detachEvents();
    this.#stopObserver();
    if (this.#timeoutId !== null) {
      clearTimeout(this.#timeoutId);
      this.#timeoutId = null;
    }
    this.#closeDecoder();
    this._releaseFromCache();
    this.#decoders.clear();
    this.emit('destroy');
    this.removeAllListeners();
    this.#element = null;
  }

  /**
   * Returns the adopted element, creating a new one when none was provided.
   * Subclasses must call this inside `_startLoad`.
   * @protected
   * @returns {HTMLMainElement}
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
   * @param {HTMLMainElement} element - The element to expose through `element`.
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
   * Records the internal object URL assigned to the element so the mutation
   * observer treats the swap as an internal transition instead of an external
   * source change. It also mirrors the network URL into the `original-src`
   * attribute while an object URL is active.
   * @protected
   * @param {string|null} url - The object URL assigned internally, or null to clear it.
   * @returns {void}
   * @throws {TypeError} If `url` is neither a string nor null.
   */
  _setInternalSrc(url) {
    if (url !== null && typeof url !== 'string') {
      throw new TypeError('The "url" argument must be a string or null.');
    }
    this.#internalSrc = url;
    this.#syncOriginalSrc();
    this._flushMutations();
    this.emit('srctransition', { src: this.#src, internalSrc: url });
  }

  /**
   * Mirrors the original network URL into the `original-src` attribute while an
   * object URL is active, and removes it otherwise. The attribute is skipped
   * when the loader was created with `originalSrc: false`.
   * @returns {void}
   */
  #syncOriginalSrc() {
    const element = this.#element;
    if (!element || !this.#originalSrc) {
      return;
    }
    if (this.#internalSrc) {
      element.setAttribute('original-src', this.#src);
    } else {
      element.removeAttribute('original-src');
    }
  }

  /**
   * Waits for a media element to become ready while staying bound to the
   * current abort signal. The returned promise rejects as soon as the loader is
   * aborted, which prevents the caller from awaiting a download that will never
   * finish.
   * @protected
   * @param {HTMLMainElement} element - The media element being loaded.
   * @param {string} [readyEvent] - The DOM event that signals a successful load.
   * @returns {Promise<void>} Resolves once the media is ready.
   * @throws {TypeError} If `element` is not an HTMLElement.
   * @throws {TypeError} If `readyEvent` is not a string.
   */
  _waitForMedia(element, readyEvent = 'loadeddata') {
    if (!(element instanceof HTMLElement)) {
      throw new TypeError('The "element" argument must be an HTMLElement.');
    }
    if (typeof readyEvent !== 'string') {
      throw new TypeError('The "readyEvent" argument must be a string.');
    }
    if (!this.#controller) {
      throw new Error('Signal does not exist to wait for media.');
    }
    const { signal } = this.#controller;
    return new Promise((resolve, reject) => {
      const onReady = () => {
        cleanup();
        resolve(undefined);
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load media: ${this.#src}`));
      };
      const onAbort = () => {
        cleanup();
        reject(new DOMException('The media load was aborted.', 'AbortError'));
      };
      const cleanup = () => {
        element.removeEventListener(readyEvent, onReady);
        element.removeEventListener('error', onError);
        signal.removeEventListener('abort', onAbort);
      };
      element.addEventListener(readyEvent, onReady);
      element.addEventListener('error', onError);
      signal.addEventListener('abort', onAbort, { once: true });
    });
  }

  /**
   * Stores a downloaded blob in the shared cache when one is configured and
   * returns the URL the element must render. When no cache is present the blob
   * is exposed through a private object URL instead.
   * @protected
   * @param {Blob} blob - The downloaded blob.
   * @returns {string} The URL the element must use as its source.
   * @throws {TypeError} If `blob` is not a Blob.
   */
  _cacheBlob(blob) {
    if (!(blob instanceof Blob)) {
      throw new TypeError('The "blob" argument must be a Blob.');
    }
    this._setResourceSize(blob.size);
    if (this.#cache) {
      const entry = this.#cache.set(this.#src, blob, false, this.#partial);
      this.#cache.acquire(this.#src);
      this.emit('cachemiss', entry);
      return entry.objectUrl;
    }
    return this._createObjectUrl(blob);
  }

  /**
   * Downloads a media resource through fetch. When another loader is already
   * downloading the same URL, the request is not repeated: the promise resolves
   * with the very same {@link Blob} instance that the leading loader receives.
   * @protected
   * @template {keyof MediaLoaderEvents} K
   * @param {string} url - The resource to download.
   * @param {(chunk: BlobPart, chunks: BlobPart[]) => void} [onChunk] - Optional chunk callback.
   * @param {number} [startByte=0] - The byte offset to start downloading from.
   * @param {AbortSignal|null} [customSignal=null] - Signal to abort only the fetch without aborting the loader.
   * @returns {Promise<Blob>} The fully downloaded blob.
   * @throws {TypeError} If `url` is not a string.
   */
  async _downloadStream(url, onChunk, startByte = 0, customSignal = null) {
    if (typeof url !== 'string') {
      throw new TypeError('The "url" argument must be a string.');
    }
    const key = this.#mirrorKey(url);
    const shareable = this.#mirror && startByte === 0;
    /** @type {MediaMirrorEntry<keyof MediaLoaderEvents, Parameters<MediaLoaderEvents[K]>>|null} */
    // @ts-ignore
    const shared = shareable ? TinyMediaMirror.attach(key) : null;
    if (shared) {
      return this.#mirrorStream(shared, url, onChunk, startByte, customSignal);
    }
    const entry = shareable ? TinyMediaMirror.open(key, url) : null;
    this.#publish = entry ? (name, args) => TinyMediaMirror.publish(key, name, args) : null;
    try {
      const blob = await this.#download(url, onChunk, startByte, customSignal);
      entry?.resolve(blob);
      return blob;
    } catch (error) {
      entry?.reject(/** @type {Error} */ (error));
      throw error;
    } finally {
      this.#publish = null;
      if (entry) {
        TinyMediaMirror.close(key);
      }
    }
  }

  /**
   * Performs the actual network download.
   * @param {string} url - The resource to download.
   * @param {(chunk: BlobPart, chunks: BlobPart[]) => void} [onChunk] - Optional chunk callback.
   * @param {number} [startByte=0] - The byte offset to start downloading from.
   * @param {AbortSignal|null} [customSignal=null] - Signal to abort only the fetch without aborting the loader.
   * @returns {Promise<Blob>} The fully downloaded blob.
   * @throws {Error} If the request fails or the body is not readable.
   */
  async #download(url, onChunk, startByte = 0, customSignal = null) {
    if (typeof url !== 'string') {
      throw new TypeError('The "url" argument must be a string.');
    }

    let type = '';
    let actualTotal = 0;
    let headSuccess = false;

    // 1. Optional: HEAD Fetch before GET to capture metadata quickly
    if (this.#useHeadRequest && startByte === 0) {
      try {
        const headResponse = await fetch(url, {
          method: 'HEAD',
          signal: customSignal || this.signal.signal,
        });
        this.#headResponse = headResponse;
        this.emit('headResponse', headResponse);
        if (headResponse.ok) {
          type = headResponse.headers.get('content-type') || '';
          const cl = headResponse.headers.get('content-length');
          if (cl) actualTotal = Number(cl);

          // Capture all headers
          /** @type {Record<string, string>} */
          const headHeaders = {};
          headResponse.headers.forEach((val, key) => {
            headHeaders[key] = val;
          });

          const patch = {};
          if (type) patch.type = type;
          if (actualTotal > 0) patch.size = actualTotal;
          if (Object.keys(headHeaders).length > 0) patch.httpHeaders = headHeaders;
          if (Object.keys(patch).length > 0) {
            this._emitMetadata(patch, 'HEAD');
          }
          headSuccess = true;
        }
      } catch (e) {
        // Silent Head Failure (may be CORS restricted to HEAD only). Go to the GET.
      }
    }

    const headers = new Headers();
    if (startByte > 0) {
      headers.set('Range', `bytes=${startByte}-`);
    }

    // 2. Fetch real (GET)
    const response = await fetch(url, {
      signal: customSignal || this.signal.signal,
      headers: headers,
    });

    this.#response = response;
    this.emit('response', response);
    if (!response.ok) {
      // If the server returns 416, the range is invalid
      if (response.status === 416) throw new Error('Requested range not satisfiable.');
      throw new Error(`Failed to fetch media: ${response.status} ${response.statusText}`);
    }
    if (!response.body) throw new Error('The response body is not readable.');

    const getType = response.headers.get('content-type') || type;
    const total = Number(response.headers.get('content-length') || 0);

    // Calculation adjustment for Status 206
    if (response.status === 206) {
      const contentRange = response.headers.get('content-range');
      if (contentRange) {
        const match = contentRange.match(/\/(\d+)$/);
        if (match) actualTotal = Number(match[1]);
      }
    } else {
      actualTotal = total > 0 ? total + startByte : actualTotal;
    }

    // Capture all headers
    /** @type {Record<string, string>} */
    const getHeaders = {};
    response.headers.forEach((val, key) => {
      getHeaders[key] = val;
    });

    /** @type {Partial<MediaMetadata>} */
    const patch = {};
    if (getType && getType !== type) {
      patch.type = getType;
      type = getType;
    }
    // If the HEAD request didn't run or if the GET request is a Range, we re-emit the size
    if (actualTotal > 0 && (!headSuccess || response.status === 206)) patch.size = actualTotal;
    if (Object.keys(getHeaders).length > 0) patch.httpHeaders = getHeaders;
    if (Object.keys(patch).length > 0) this._emitMetadata(patch, 'GET');

    this.#openDecoder(type); // The earlyDecode (Probe) still respects its flag separately!
    const progress = this._createProgress(actualTotal);
    const reader = response.body.getReader();
    /** @type {BlobPart[]} */
    const chunks = [];

    // For the calculation of progress and the final Blob, we need to know what we already had here
    let currentTotalLoaded = startByte;

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        chunks.push(value);
        this.#decoder?.write(value);

        currentTotalLoaded += value.byteLength;
        progress.push(value.byteLength);

        // Emit the raw chunk for external libraries
        this.emit('chunk', {
          chunk: value,
          loaded: currentTotalLoaded,
          total: actualTotal,
        });

        this._emitProgress();
        if (onChunk) onChunk(value, chunks);
      }
    } finally {
      this.#closeDecoder();
    }

    // The final Blob should contain the bytes we already had (if any) + the new ones
    // But to simplify the cache, here we treat the blob like the new piece.
    // In production, you would concatenate the Blobs or use a File object.
    return new Blob(chunks, { type: type || 'application/octet-stream' });
  }

  /**
   * Builds the registry key used to deduplicate concurrent downloads. It mirrors
   * the normalization applied by the shared cache so both layers agree on what
   * "the same resource" means.
   * @param {string} url - The media URL.
   * @returns {string} The normalized registry key.
   */
  #mirrorKey(url) {
    if (!this.#cache?.ignoreSearch) {
      return url;
    }
    const clean = url.split('#')[0];
    const query = clean.indexOf('?');
    return query === -1 ? clean : clean.slice(0, query);
  }

  /**
   * Resolves a download that is already in flight on another loader. The full
   * event history is replayed before the first live event arrives, so a mirror
   * that attaches halfway through observes exactly the same sequence as a
   * listener attached to the leader from the very first byte.
   * @template {keyof MediaLoaderEvents} K
   * @param {MediaMirrorEntry<keyof MediaLoaderEvents, Parameters<MediaLoaderEvents[K]>>} entry - The shared download.
   * @param {string} url - The resource being downloaded.
   * @param {((chunk: BlobPart, chunks: BlobPart[]) => void)|undefined} onChunk - The chunk callback.
   * @param {number} startByte - The byte offset of the request.
   * @param {AbortSignal|null} customSignal - The signal that aborts the request.
   * @returns {Promise<Blob>} The blob downloaded by the leading loader.
   */
  async #mirrorStream(entry, url, onChunk, startByte, customSignal) {
    /** @type {BlobPart[]} */
    const chunks = [];
    const progress = this._createProgress(0);
    const replayed = TinyMediaMirror.history(entry.key).length;

    const unsubscribe = TinyMediaMirror.subscribe(entry.key, (event) => {
      this.#applyEvent(event, chunks, progress, onChunk);
    });

    let blob;
    try {
      blob = await entry.promise;
    } catch {
      if (unsubscribe) {
        unsubscribe();
      }
      return this.#download(url, onChunk, startByte, customSignal);
    }
    if (unsubscribe) {
      unsubscribe();
    }

    this.#mirrored = true;
    this._setResourceSize(blob.size);
    if (blob.type) {
      this._emitMetadata({ type: blob.type }, 'MIRROR');
    }
    await this.#probeBlob(blob);

    this.emit('mirror', {
      src: this.#src,
      key: entry.key,
      size: blob.size,
      mirrors: entry.mirrors,
      replayed,
    });
    return blob;
  }

  /**
   * Applies a single mirrored event to this instance. Every event is applied in
   * the exact order it was published, whether it comes from the historical
   * catch-up or from the live stream. The event is type-erased because the
   * mirror registry stores the name and the arguments as plain data.
   * @param {MediaMirrorEvent<string, unknown[]>} event - The event to apply.
   * @param {BlobPart[]} chunks - The accumulator that rebuilds the payload.
   * @param {TinyMediaProgress} progress - The tracker advanced by every replayed chunk.
   * @param {((chunk: BlobPart, chunks: BlobPart[]) => void)|undefined} onChunk - The chunk callback.
   * @returns {void}
   */
  #applyEvent(event, chunks, progress, onChunk) {
    if (event.name === 'metadata') {
      const [patch, type] = /** @type {[Partial<MediaMetadata>, MediaMetadataType]} */ (event.args);
      this._emitMetadata(patch, type);
      return;
    }
    if (event.name === 'chunk') {
      const [payload] = /** @type {[MediaChunkPayload]} */ (event.args);
      const chunk = /** @type {BlobPart} */ (payload.chunk);
      if (progress.total === 0 && payload.total > 0) {
        progress.total = payload.total;
      }
      chunks.push(chunk);
      progress.push(payload.chunk.byteLength);
      if (onChunk) {
        onChunk(chunk, chunks);
      }
    }
    this.#replay(event.name, event.args);
  }

  /**
   * Re-emits a mirrored event without broadcasting it again. `Reflect.apply` is
   * used because the event name is only known at runtime: the generic `emit`
   * signature cannot be recovered from a `string`, so the call is dispatched
   * dynamically while `#replaying` keeps the event out of the mirror registry.
   * @param {string} name - The event name.
   * @param {unknown[]} args - The original event arguments.
   * @returns {void}
   */
  #replay(name, args) {
    this.#replaying = true;
    try {
      Reflect.apply(this.emit, this, [name, ...args]);
    } finally {
      this.#replaying = false;
    }
  }

  /**
   * Replays a shared blob through the early decoder so a mirrored download
   * exposes exactly the same metadata as a local one.
   * @param {Blob} blob - The shared payload.
   * @returns {Promise<void>} Resolves once the probe consumed the header.
   */
  async #probeBlob(blob) {
    this.#openDecoder(blob.type);
    if (!this.#decoder) {
      return;
    }
    this.#decoder.write(new Uint8Array(await blob.arrayBuffer()));
    this.#closeDecoder();
  }

  /**
   * Creates the header decoder used to read the intrinsic dimensions before the
   * download finishes. Images go through the WebCodecs `ImageDecoder`; videos
   * are parsed from the container header by {@link TinyMediaProbe}. It is a
   * no-op when early decoding is disabled or the MIME type is not supported.
   * Failures are swallowed on purpose: early decoding is best-effort.
   * @param {string} type - The MIME type from the response headers.
   * @returns {void}
   */
  #openDecoder(type) {
    if (!this.#earlyDecode) return;
    const mime = type.split(';')[0].trim().toLowerCase();
    this.#decoders.forEach((decoder, key) => {
      if (!this.#decoder && mime.startsWith(`${key}/`)) {
        this.#decoder = decoder(mime);
      }
    });
  }

  /**
   * Releases the early decoder, if one was created. When the decoder exposes a
   * `finalize` hook, it runs first so the metadata that is only known at the
   * end of the stream (for example the frame count of an animated GIF) is
   * emitted before the decoder is torn down.
   * @returns {void}
   */
  #closeDecoder() {
    if (!this.#decoder) {
      return;
    }
    if (typeof this.#decoder.finalize === 'function') {
      const final = this.#decoder.finalize();
      if (final) {
        this._emitMetadata(final, 'DECODE');
      }
    }
    this.#decoder.close();
    this.#decoder = null;
  }

  /**
   * Acquires the current source from the shared cache and remembers the
   * reference. A successful acquisition flags the metadata so the final
   * snapshot reports `fromCache: true` and restores the values that the
   * download path would have recorded, since no network request runs here.
   * @protected
   * @returns {import('./utils/TinyMediaCache.mjs').MediaCacheEntry|null}
   */
  _acquireFromCache() {
    if (!this.#cache) {
      return null;
    }
    const entry = this.#cache.acquire(this.#src);
    if (entry) {
      this.#cacheAcquired = true;
      this._setCacheHint(true);
      this._setResourceSize(entry.size);
      if (entry.type) {
        this._emitMetadata({ type: entry.type }, 'CACHE');
      }
      if (entry.metadata) {
        this._emitMetadata(entry.metadata, 'CACHE');
      }
    }
    return entry;
  }

  /**
   * Releases the reference held on the shared cache entry, when present.
   * @protected
   * @returns {void}
   */
  _releaseFromCache() {
    if (this.#cache && this.#cacheAcquired) {
      this.#cache.release(this.#src);
      this.#cacheAcquired = false;
    }
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
   * Records the exact byte size of the media when it is known without the
   * Resource Timing API, for example right after a streamed download.
   * @protected
   * @param {number} size - The size in bytes.
   * @returns {void}
   * @throws {RangeError} If `size` is not a positive number.
   */
  _setResourceSize(size) {
    if (typeof size !== 'number' || Number.isNaN(size) || size < 0) {
      throw new RangeError('The "size" argument must be a positive number.');
    }
    this.#resourceSize = size;
  }

  /**
   * Reads the decoded size of the resource. It prefers the size captured from a
   * streamed blob and falls back to the Resource Timing API, whose entries are
   * keyed by absolute URL.
   * @protected
   * @returns {number} The size in bytes, or 0 when unavailable.
   */
  _getResourceSize() {
    if (this.#resourceSize > 0) {
      return this.#resourceSize;
    }
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
   * Creates an object URL for a blob and revokes the previous one.
   * @protected
   * @param {Blob} blob - The blob to expose through an object URL.
   * @returns {string} The newly created object URL.
   * @throws {TypeError} If `blob` is not a Blob.
   */
  _createObjectUrl(blob) {
    if (!(blob instanceof Blob)) {
      throw new TypeError('The "blob" argument must be a Blob.');
    }
    this._revokeObjectUrl();
    this.#objectUrl = URL.createObjectURL(blob);
    return this.#objectUrl;
  }

  /**
   * Revokes the current object URL, if any.
   * @protected
   * @returns {void}
   */
  _revokeObjectUrl() {
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      this.#objectUrl = null;
    }
  }

  /**
   * Creates a fresh AbortController for the current load and links its signal to
   * the coupled element, so aborting the signal stops the native download.
   * @returns {void}
   */
  #createController() {
    this.#controller = new AbortController();
    this.#controller.signal.addEventListener('abort', () => this._abort(), { once: true });
  }

  /**
   * Builds a fresh metadata object for the current source. Every field is
   * explicit so a new property can never be forgotten here.
   * @returns {MediaMetadata} A zeroed metadata snapshot.
   */
  #createMetadata() {
    return {
      src: this.#src,
      type: '',
      width: 0,
      height: 0,
      duration: 0,
      size: 0,
      fromCache: false,
      loadTime: 0,
      timestamp: 0,
      animation: null,
      httpHeaders: {},
    };
  }

  /**
   * Resets every field that is scoped to a single load. It is called at the
   * very beginning of {@link TinyMediaLoader#load} so that a failed, aborted or
   * cached load can never leak its state into the next one.
   * @returns {void}
   */
  #resetLoadState() {
    this.#aborted = false;
    this.#internalSrc = null;
    this.#resourceSize = 0;
    this.#cacheHint = false;
    this.#mirrored = false;
    this.#replaying = false;
    this.#publish = null;
    this.#partial = {};
    this.#startTime = performance.now();
    this.#endTime = 0;
    this.#metadata = this.#createMetadata();
  }

  /**
   * Applies a state transition and notifies the listeners.
   * @param {string} next - The next state.
   * @returns {void}
   */
  #setState(next) {
    if (this.#state === next) {
      return;
    }
    const previous = this.#state;
    this.#state = next;
    this.emit('statechange', { state: next, previous, src: this.#src });
  }

  /**
   * Emits an `error` event without crashing when nobody is listening.
   * @param {Error} error - The error to report.
   * @returns {void}
   */
  #emitError(error) {
    if (this.listenerCount('error') > 0) {
      this.emit('error', error);
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
   * Starts observing the element for external `src` and `original-src`
   * mutations. The `original-src` attribute is only observed when the loader
   * was created with `originalSrc: true`, so a page that never opts into the
   * feature pays no cost for it.
   * @returns {void}
   */
  #startObserver() {
    if (this.#observer || typeof MutationObserver === 'undefined' || !this.#element) {
      return;
    }
    this.#observer = new MutationObserver((records) => this.#handleExternalSrcChange(records));
    this.#observer.observe(this.#element, {
      attributes: true,
      attributeFilter: this.#originalSrc ? ['src', 'original-src'] : ['src'],
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
   * Reacts to a `src` or `original-src` attribute change that did not come
   * from this class. When both attributes change in the same batch,
   * `original-src` wins because it carries the network URL, while `src` may
   * hold an object URL that this class created itself.
   * @param {MutationRecord[]} records - The records delivered by the observer.
   * @returns {void}
   */
  #handleExternalSrcChange(records) {
    const element = this.#element;
    if (!element) {
      return;
    }
    let next = null;
    for (const { attributeName } of records) {
      if (attributeName === 'original-src') {
        next = element.getAttribute('original-src') ?? '';
      } else if (attributeName === 'src' && next === null) {
        next = element.getAttribute('src') ?? '';
      }
    }
    if (next === null || next === this.#src || next === this.#internalSrc) {
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
      animation: null,
      ...this._getMetadataDetails(),
      ...this.#partial,
    };
  }

  /**
   * Wraps a promise with a timeout. If the promise does not resolve within the
   * configured timeout, the current load operation is aborted and the promise rejects.
   * @param {Promise<*>} promise - The asynchronous operation to be guarded by the timeout.
   * @returns {Promise<*>} A promise that resolves with the original result or rejects on timeout.
   */
  #withTimeout(promise) {
    if (this.#timeout <= 0) {
      return promise;
    }
    return new Promise((resolve, reject) => {
      this.#timeoutId = setTimeout(() => {
        this.#timeoutId = null;
        if (this.#controller) {
          this.#controller.abort();
        }
        this.emit('timeout', { src: this.#src, timeout: this.#timeout });
        reject(new Error(`Media load timed out after ${this.#timeout}ms.`));
      }, this.#timeout);
      promise.then(
        (value) => {
          if (this.#timeoutId !== null) clearTimeout(this.#timeoutId);
          this.#timeoutId = null;
          resolve(value);
        },
        (error) => {
          if (this.#timeoutId !== null) clearTimeout(this.#timeoutId);
          this.#timeoutId = null;
          reject(error);
        },
      );
    });
  }

  /**
   * Creates a brand new element. Must be implemented by subclasses.
   * @abstract
   * @protected
   * @returns {HTMLMainElement}
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
   * @returns {MediaMetadataDetails} The media specific metadata details.
   */
  _getMetadataDetails() {
    return { type: '', width: 0, height: 0, duration: 0, size: 0 };
  }

  /**
   * Aborts the network activity of the coupled element. It works for `<img>`,
   * `<audio>` and `<video>`: all three expose `removeAttribute`, while only the
   * media elements expose `pause` and `load`. Subclasses that hold extra
   * resources must override this method and call `super._abort()`.
   * @protected
   * @returns {void}
   */
  _abort() {
    this._revokeObjectUrl();
    const element = this.#element;
    if (!element) {
      return;
    }
    const media = /** @type {Partial<HTMLMediaElement>} */ (element);
    if (typeof media.pause === 'function') {
      media.pause();
    }
    element.removeAttribute('src');
    if (typeof media.load === 'function') {
      media.load();
    }
    this._setInternalSrc(null);
  }

  /**
   * Releases any listener or timer created by the subclass.
   * @abstract
   * @protected
   * @returns {void}
   */
  _cleanup() {}
}

export default TinyMediaLoader;
