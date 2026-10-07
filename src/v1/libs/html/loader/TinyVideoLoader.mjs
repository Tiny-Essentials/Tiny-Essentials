/**
 * @fileoverview Concrete loader for videos. Mirrors the ImageLoader API so the
 * two are interchangeable inside a factory.
 */
import TinyMediaLoader from './TinyMediaLoader.mjs';

/**
 * @typedef {Object} VideoLoaderOptions
 * @property {string} [src] - The video source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the video.
 * @property {boolean} [autoplay] - Whether the video should autoplay.
 * @property {boolean} [loop] - Whether the video should loop.
 * @property {boolean} [muted] - Whether the video should be muted.
 * @property {'none'|'metadata'|'auto'} [preload] - The preload strategy.
 * @property {HTMLVideoElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the video through fetch for byte progress.
 * @property {import('./TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single video with full lifecycle control.
 * @augments TinyMediaLoader
 */
class TinyVideoLoader extends TinyMediaLoader {
  /**
   * @override
   * @returns {string} The uppercase tag name of the underlying media element.
   */
  static get tagName() {
    return 'VIDEO';
  }

  /** @type {HTMLVideoElement|null} */
  #video;
  /** @type {string|null} */
  #crossOrigin;
  /** @type {boolean} */
  #autoplay;
  /** @type {boolean} */
  #loop;
  /** @type {boolean} */
  #muted;
  /** @type {'none'|'metadata'|'auto'} */
  #preload;
  /** @type {boolean} */
  #stream;
  /** @type {string|null} */
  #objectUrl = null;
  /** @type {number} */
  #streamedSize = 0;

  /**
   * @param {VideoLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `preload` is not a string.
   */
  constructor(options = {}) {
    super(options);
    const {
      crossOrigin = null,
      autoplay = false,
      loop = false,
      muted = false,
      preload = 'metadata',
      stream = false,
    } = options;
    if (crossOrigin !== null && typeof crossOrigin !== 'string') {
      throw new TypeError('The "crossOrigin" option must be a string or null.');
    }
    if (typeof preload !== 'string') {
      throw new TypeError('The "preload" option must be a string.');
    }
    this.#crossOrigin = crossOrigin;
    this.#autoplay = Boolean(autoplay);
    this.#loop = Boolean(loop);
    this.#muted = Boolean(muted);
    this.#preload = preload;
    this.#stream = Boolean(stream);
    this.#video = null;
  }

  /**
   * The underlying `<video>` element.
   * @returns {HTMLVideoElement|null}
   */
  get video() {
    return this.#video;
  }

  /**
   * The object URL created for a streamed video, or `null` when the video is not streamed.
   * @returns {string|null} The object URL of the streamed blob, or `null` when no streamed blob exists.
   */
  get objectUrl() {
    return this.#objectUrl;
  }

  /**
   * The total size in bytes of the video downloaded through the streaming path.
   * @returns {number} The number of bytes streamed, or `0` when the video was not streamed.
   */
  get streamedSize() {
    return this.#streamedSize;
  }

  /**
   * Indicates whether the loader downloads the video through fetch for byte-level progress.
   * @returns {boolean} `true` when streaming is enabled, otherwise `false`.
   */
  get stream() {
    return this.#stream;
  }

  /**
   * @override
   * @protected
   * @returns {Promise<void>} A promise that resolves once the video is ready and playback can start.
   */
  async _startLoad() {
    const video = /** @type {HTMLVideoElement} */ (this._resolveElement());
    this.#video = video;

    this._forwardEvents(video, [
      'loadstart',
      'loadedmetadata',
      'canplay',
      'canplaythrough',
      'play',
      'playing',
      'pause',
      'seeking',
      'seeked',
      'waiting',
      'stalled',
      'suspend',
      'emptied',
      'ended',
      'durationchange',
      'ratechange',
      'volumechange',
      'timeupdate',
      'abort',
    ]);

    // Time-based progress only makes sense when we are not downloading the file ourselves.
    if (!this.#stream) {
      this._on(video, 'progress', () => this.#updateTimeProgress());
      this._on(video, 'loadedmetadata', () => this.#updateTimeProgress());
    }

    if (this.#crossOrigin) {
      video.crossOrigin = this.#crossOrigin;
    }
    video.preload = this.#preload;
    video.autoplay = this.#autoplay;
    video.loop = this.#loop;
    video.muted = this.#muted;
    video.playsInline = true;

    const ready = new Promise((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve(undefined);
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load video: ${this.src}`));
      };
      const cleanup = () => {
        video.removeEventListener('loadeddata', onLoaded);
        video.removeEventListener('error', onError);
      };
      video.addEventListener('loadeddata', onLoaded);
      video.addEventListener('error', onError);
    });

    if (this.#stream) {
      await this.#streamInto(video);
    } else {
      video.src = this.src;
      video.load();
    }

    await ready;
  }

  /**
   * Downloads the video through fetch, emitting byte-level progress.
   * Falls back to the shared cache when a matching entry exists.
   * @param {HTMLVideoElement} video - The target video element.
   * @returns {Promise<void>}
   * @throws {Error} If the network request fails.
   */
  async #streamInto(video) {
    const cache = this.cache;
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this.#streamedSize = cached.size;
      video.src = cached.objectUrl;
      video.load();
      return;
    }

    const response = await fetch(this.src, { signal: this.signal.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
    }
    if (!response.body) {
      throw new Error('The response body is not readable.');
    }

    const total = Number(response.headers.get('content-length')) || 0;
    const progress = this._createProgress(total);
    const reader = response.body.getReader();
    /** @type {Uint8Array[]} */
    const chunks = [];

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      progress.push(value.byteLength);
      this._emitProgress();
    }

    const parts = /** @type {BlobPart[]} */ (/** @type {unknown} */ (chunks));
    const blob = new Blob(parts, {
      type: response.headers.get('content-type') || 'video/*',
    });
    this.#streamedSize = blob.size;

    if (cache) {
      const entry = cache.set(this.src, blob);
      cache.acquire(this.src);
      this.emit('cachemiss', entry);
      video.src = entry.objectUrl;
      video.load();
      return;
    }

    this.#objectUrl = URL.createObjectURL(blob);
    video.src = this.#objectUrl;
    video.load();
  }

  /**
   * Reads the buffered TimeRanges and emits a normalized progress event.
   * @returns {void} This method does not return a value.
   */
  #updateTimeProgress() {
    const video = this.#video;
    if (!video || !Number.isFinite(video.duration) || video.duration === 0) {
      return;
    }
    const buffered = video.buffered;
    let loaded = 0;
    for (let i = 0; i < buffered.length; i += 1) {
      loaded += buffered.end(i) - buffered.start(i);
    }
    const tracker = this.progress;
    this.emit('progress', {
      loaded,
      total: video.duration,
      remaining: Math.max(0, video.duration - loaded),
      percent: Math.min(100, (loaded / video.duration) * 100),
      rate: 0,
      elapsed: tracker ? tracker.elapsed : 0,
      eta: 0,
      chunks: buffered.length,
    });
  }

  /**
   * Derives the MIME type from the source extension.
   * @returns {string} The MIME type derived from the source file extension.
   */
  #getMimeType() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    const extension = dot === -1 ? '*' : clean.slice(dot + 1).toLowerCase();
    return `video/${extension}`;
  }

  /**
   * @override
   * @protected
   * @returns {import('./TinyMediaLoader.mjs').MediaMetadataDetails} The resolved metadata for the video.
   */
  _getMetadataDetails() {
    const video = this.#video;
    const duration = video ? video.duration : 0;
    return {
      type: this.#getMimeType(),
      width: video?.videoWidth ?? 0,
      height: video?.videoHeight ?? 0,
      duration: Number.isFinite(duration) ? duration : 0,
      size: this._getResourceSize() || this.#streamedSize,
    };
  }

  /**
   * @override
   * @protected
   * @returns {HTMLVideoElement} A newly created `<video>` element.
   */
  _createElement() {
    return document.createElement('video');
  }

  /**
   * @override
   * @protected
   * @returns {void} This method does not return a value.
   */
  _abort() {
    if (this.#video) {
      this.#video.removeAttribute('src');
      this.#video.load();
      this._flushMutations();
    }
  }

  /**
   * @override
   * @protected
   * @returns {void} This method does not return a value.
   */
  _cleanup() {
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      this.#objectUrl = null;
    }
    if (this.#video) {
      this.#video.pause();
      this.#video.removeAttribute('src');
      this.#video.load();
      this._flushMutations();
    }
  }
}

export default TinyVideoLoader;
