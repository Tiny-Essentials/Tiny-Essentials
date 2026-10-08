/**
 * @fileoverview Concrete loader for audio. Mirrors the VideoLoader API so the
 * two are interchangeable inside a factory. Audio has no intrinsic dimensions,
 * so width and height are always 0.
 */
import TinyMediaLoader from './TinyMediaLoader.mjs';

/**
 * Configuration options for {@link TinyAudioLoader}.
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
   * The uppercase tag name of the element this loader creates.
   * @override
   * @returns {string} The literal string `'AUDIO'`.
   */
  static get tagName() {
    return 'AUDIO';
  }

  /** @type {HTMLAudioElement|null} The underlying audio element, or `null` before creation. */
  #audio;
  /** @type {string|null} The CORS mode applied to the audio, or `null` for none. */
  #crossOrigin;
  /** @type {boolean} Whether the audio should autoplay. */
  #autoplay;
  /** @type {boolean} Whether the audio should loop. */
  #loop;
  /** @type {boolean} Whether the audio should be muted. */
  #muted;
  /** @type {'none'|'metadata'|'auto'} The preload strategy. */
  #preload;
  /** @type {boolean} Whether to download the audio through fetch for byte progress. */
  #stream;

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
   * @returns {HTMLAudioElement|null} The underlying `<audio>` element, or `null` before the load starts.
   */
  get audio() {
    return this.#audio;
  }

  /**
   * Whether the audio is downloaded through fetch for byte-level progress.
   * @returns {boolean} `true` when the streaming path is enabled.
   */
  get stream() {
    return this.#stream;
  }

  /**
   * Creates the audio element, wires its events, and starts the load.
   * @override
   * @protected
   * @returns {Promise<void>} Resolves once the audio metadata is loaded.
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
      this._on(audio, 'progress', () => this.#updateTimeProgress());
      this._on(audio, 'loadedmetadata', () => this.#updateTimeProgress());
    }

    if (this.#crossOrigin) {
      audio.crossOrigin = this.#crossOrigin;
    }
    audio.preload = this.#preload;
    audio.autoplay = this.#autoplay;
    audio.loop = this.#loop;
    audio.muted = this.#muted;

    const ready = this._waitForMedia(audio, 'loadeddata');

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
   * @returns {Promise<void>} Resolves once the audio source is assigned and loading has started.
   * @throws {Error} If the network request fails.
   */
  async #streamInto(audio) {
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this._setInternalSrc(cached.objectUrl);
      audio.src = cached.objectUrl;
      audio.load();
      return;
    }
    const blob = await this._downloadStream(this.src);
    const url = this._cacheBlob(blob);
    this._setInternalSrc(url);
    audio.src = url;
    audio.load();
  }

  /**
   * Reads the buffered TimeRanges and emits a normalized progress event.
   * @returns {void} Nothing. The method emits a `progress` event as a side effect.
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
    const tracker = this.progress;
    this.emit('progress', {
      loaded,
      total: audio.duration,
      remaining: Math.max(0, audio.duration - loaded),
      percent: Math.min(100, (loaded / audio.duration) * 100),
      rate: 0,
      elapsed: tracker ? tracker.elapsed : 0,
      eta: 0,
      chunks: buffered.length,
    });
  }

  /**
   * Derives the MIME type from the source extension.
   * @returns {string} The derived MIME type, for example `audio/mp3`.
   */
  #getMimeType() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    const extension = dot === -1 ? '*' : clean.slice(dot + 1).toLowerCase();
    return `audio/${extension}`;
  }

  /**
   * Builds the metadata descriptor for the loaded audio.
   * @override
   * @protected
   * @returns {import('./TinyMediaLoader.mjs').MediaMetadataDetails} The audio metadata with zeroed dimensions.
   */
  _getMetadataDetails() {
    const audio = this.#audio;
    const duration = audio ? audio.duration : 0;
    return {
      type: this.#getMimeType(),
      width: 0,
      height: 0,
      duration: Number.isFinite(duration) ? duration : 0,
      size: this._getResourceSize(),
    };
  }

  /**
   * Creates the underlying `<audio>` element.
   * @override
   * @protected
   * @returns {HTMLAudioElement} A new detached audio element.
   */
  _createElement() {
    return document.createElement('audio');
  }

  /**
   * Releases the object URL and detaches the audio element.
   * @override
   * @protected
   * @returns {void} Nothing.
   */
  _cleanup() {
    this._revokeObjectUrl();
    if (this.#audio) {
      this.#audio.pause();
      this.#audio.removeAttribute('src');
      this.#audio.load();
      this._flushMutations();
    }
  }
}

export default TinyAudioLoader;
