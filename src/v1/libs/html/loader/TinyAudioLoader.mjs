/**
 * @fileoverview Concrete loader for audio. Mirrors the VideoLoader API so the
 * two are interchangeable inside a factory. Audio has no intrinsic dimensions,
 * so width and height are always 0.
 */
import TinyMediaLoader from './TinyMediaLoader.mjs';

/**
 * @typedef {Object} AudioLoaderOptions
 * @property {string} [src] - The audio source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the audio.
 * @property {boolean} [autoplay] - Whether the audio should autoplay.
 * @property {boolean} [loop] - Whether the audio should loop.
 * @property {boolean} [muted] - Whether the audio should be muted.
 * @property {'none'|'metadata'|'auto'} [preload] - The preload strategy.
 * @property {HTMLAudioElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the audio through fetch for byte progress.
 * @property {import('./TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single audio track with full lifecycle control.
 * @augments TinyMediaLoader
 */
class TinyAudioLoader extends TinyMediaLoader {
  /**
   * @override
   * @returns {string}
   */
  static get tagName() {
    return 'AUDIO';
  }

  /** @type {HTMLAudioElement|null} */
  #audio;
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
   * @param {AudioLoaderOptions} [options] - The loader configuration.
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
    this.#audio = null;
  }

  /**
   * The underlying `<audio>` element.
   * @returns {HTMLAudioElement|null}
   */
  get audio() {
    return this.#audio;
  }

  /**
   * @override
   * @protected
   * @returns {Promise<void>}
   */
  async _startLoad() {
    const audio = /** @type {HTMLAudioElement} */ (this._resolveElement());
    this.#audio = audio;

    this._forwardEvents(audio, [
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
      audio.addEventListener('progress', () => this.#updateTimeProgress());
      audio.addEventListener('loadedmetadata', () => this.#updateTimeProgress());
    }

    if (this.#crossOrigin) {
      audio.crossOrigin = this.#crossOrigin;
    }
    audio.preload = this.#preload;
    audio.autoplay = this.#autoplay;
    audio.loop = this.#loop;
    audio.muted = this.#muted;
    audio.playsInline = true;

    const ready = new Promise((resolve, reject) => {
      const onLoaded = () => {
        cleanup();
        resolve(undefined);
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load audio: ${this.src}`));
      };
      const cleanup = () => {
        audio.removeEventListener('loadeddata', onLoaded);
        audio.removeEventListener('error', onError);
      };
      audio.addEventListener('loadeddata', onLoaded);
      audio.addEventListener('error', onError);
    });

    if (this.#stream) {
      await this.#streamInto(audio);
    } else {
      audio.src = this.src;
      audio.load();
    }

    await ready;
  }

  /**
   * Downloads the audio through fetch, emitting byte-level progress.
   * Falls back to the shared cache when a matching entry exists.
   * @param {HTMLAudioElement} audio - The target audio element.
   * @returns {Promise<void>}
   * @throws {Error} If the network request fails.
   */
  async #streamInto(audio) {
    const cache = this.cache;
    const cached = cache?.acquire(this.src);
    if (cached) {
      this.emit('cachehit', cached);
      this.#streamedSize = cached.size;
      audio.src = cached.objectUrl;
      audio.load();
      return;
    }

    const response = await fetch(this.src, { signal: this.signal.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
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

    const blob = new Blob(chunks, {
      type: response.headers.get('content-type') || 'audio/*',
    });
    this.#streamedSize = blob.size;

    if (cache) {
      const entry = cache.set(this.src, blob);
      cache.acquire(this.src);
      this.emit('cachemiss', entry);
      audio.src = entry.objectUrl;
      audio.load();
      return;
    }

    this.#objectUrl = URL.createObjectURL(blob);
    audio.src = this.#objectUrl;
    audio.load();
  }

  /**
   * Reads the buffered TimeRanges and emits a normalized progress event.
   * @returns {void}
   */
  #updateTimeProgress() {
    const audio = this.#audio;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration === 0) {
      return;
    }
    const buffered = audio.buffered;
    let loaded = 0;
    for (let i = 0; i < buffered.length; i += 1) {
      loaded += buffered.end(i) - buffered.start(i);
    }
    this.emit('progress', {
      loaded,
      total: audio.duration,
      remaining: Math.max(0, audio.duration - loaded),
      percent: Math.min(100, (loaded / audio.duration) * 100),
      rate: 0,
      elapsed: 0,
      eta: 0,
      chunks: buffered.length,
    });
  }

  /**
   * Derives the MIME type from the source extension.
   * @returns {string}
   */
  #getMimeType() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    const extension = dot === -1 ? '*' : clean.slice(dot + 1).toLowerCase();
    return `audio/${extension}`;
  }

  /**
   * @override
   * @protected
   * @returns {import('./TinyMediaLoader.mjs').MediaMetadataDetails}
   */
  _getMetadataDetails() {
    const audio = this.#audio;
    const duration = audio ? audio.duration : 0;
    return {
      type: this.#getMimeType(),
      width: 0,
      height: 0,
      duration: Number.isFinite(duration) ? duration : 0,
      size: this._getResourceSize() || this.#streamedSize,
    };
  }

  /**
   * @override
   * @protected
   * @returns {HTMLAudioElement}
   */
  _createElement() {
    return document.createElement('audio');
  }

  /**
   * @override
   * @protected
   * @returns {void}
   */
  _abort() {
    if (this.#audio) {
      this.#audio.removeAttribute('src');
      this.#audio.load();
      this._flushMutations();
    }
  }

  /**
   * @override
   * @protected
   * @returns {void}
   */
  _cleanup() {
    if (this.cache && this.src) {
      this.cache.release(this.src);
    }
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      this.#objectUrl = null;
    }
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.removeAttribute('src');
      this.#audio.load();
      this._flushMutations();
    }
  }
}

export default TinyAudioLoader;
