/**
 * @fileoverview Concrete loader for medias.
 */
import TinyMediaLoader from '../TinyMediaLoader.mjs';

/**
 * Configuration options for {@link TinyContentLoader}.
 * @template {HTMLVideoElement|HTMLAudioElement} HTMLContentElement
 * @typedef {Object} VideoLoaderOptions
 * @property {string} [src] - The media source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the media.
 * @property {boolean} [autoplay] - Whether the media should autoplay.
 * @property {boolean} [loop] - Whether the media should loop.
 * @property {boolean} [muted] - Whether the media should be muted.
 * @property {boolean} [controls] - Whether the media should display controls (default true).
 * @property {'none'|'metadata'|'auto'} [preload] - The preload strategy.
 * @property {HTMLContentElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [progressive] - Whether to render progressively during fetch (default true).
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the media through fetch for byte progress.
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * @typedef {Record<string, string[]>} TypesToTry
 */

/**
 * @param {HTMLVideoElement|HTMLAudioElement} media
 */
const getMetadata = (media) => {
  /** @type {Partial<import('../TinyMediaLoader.mjs').MediaMetadata>} */
  const patch = {};
  if (Number.isFinite(media.duration)) patch.duration = media.duration;
  if (media instanceof HTMLVideoElement) {
    if (Number.isFinite(media.videoWidth)) patch.width = media.videoWidth;
    if (Number.isFinite(media.videoHeight)) patch.height = media.videoHeight;
  }
  return patch;
};

/**
 * Loads a single media with full lifecycle control.
 * @extends {TinyMediaLoader<HTMLContentElement>}
 * @template {HTMLVideoElement|HTMLAudioElement} HTMLContentElement
 * @template {'video'|'audio'} Tag
 */
class TinyContentLoader extends TinyMediaLoader {
  /** @type {HTMLContentElement|null} The underlying media element, or `null` before creation. */
  #media;
  /** @type {string|null} The CORS mode applied to the audio, or `null` for none. */
  #crossOrigin;
  /** @type {boolean} Whether the audio should autoplay. */
  #autoplay;
  /** @type {boolean} Whether the audio should loop. */
  #loop;
  /** @type {boolean} Whether the audio should be muted. */
  #muted;
  /** @type {boolean} Whether the audio should display controls. */
  #controls;
  /** @type {'none'|'metadata'|'auto'} The preload strategy. */
  #preload;
  /** @type {boolean} Whether to download the audio through fetch for byte progress. */
  #stream;
  /** @type {string|null} */
  #mseUrl = null;
  /** @type {Tag} */
  #tag;
  /** @type {TypesToTry} */
  #typesToTry = {};

  /**
   * @param {Tag} tag
   * @param {TypesToTry} typesToTry
   * @param {VideoLoaderOptions<HTMLContentElement>} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `preload` is not a string.
   */
  constructor(tag, typesToTry, options = {}) {
    super(options);
    const {
      crossOrigin = null,
      autoplay = false,
      loop = false,
      muted = false,
      controls = true,
      preload = 'metadata',
      stream = false,
    } = options;
    if (crossOrigin !== null && typeof crossOrigin !== 'string') {
      throw new TypeError('The "crossOrigin" option must be a string or null.');
    }
    if (typeof preload !== 'string') {
      throw new TypeError('The "preload" option must be a string.');
    }
    if (typeof controls !== 'boolean') {
      throw new TypeError('The "controls" option must be a boolean.');
    }
    this.#tag = tag;
    this.#crossOrigin = crossOrigin;
    this.#autoplay = Boolean(autoplay);
    this.#loop = Boolean(loop);
    this.#muted = Boolean(muted);
    this.#preload = preload;
    this.#stream = Boolean(stream);
    this.#controls = Boolean(controls);
    this.#media = null;
    this.#typesToTry = typesToTry;
  }

  /**
   * The underlying the element.
   * @returns {HTMLContentElement|null}
   */
  get media() {
    return this.#media;
  }

  /**
   * Indicates whether the loader downloads the media through fetch for byte-level progress.
   * @returns {boolean} `true` when streaming is enabled, otherwise `false`.
   */
  get stream() {
    return this.#stream;
  }

  /**
   * @override
   * @protected
   * @returns {Promise<void>} A promise that resolves once the media is ready and playback can start.
   */
  async _startLoad() {
    const media = /** @type {HTMLContentElement} */ (this._resolveElement());
    this.#media = media;

    this._forwardEvents(media, [
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

    this._on(media, 'loadedmetadata', () => {
      const patch = getMetadata(media);
      if (Object.keys(patch).length > 0) this._emitMetadata(patch);
    });

    this._on(media, 'durationchange', () => {
      if (Number.isFinite(media.duration)) {
        this._emitMetadata({ duration: media.duration });
      }
    });

    // Time-based progress only makes sense when we are not downloading the file ourselves.
    if (!this.#stream) {
      this._on(media, 'progress', () => this.#updateTimeProgress());
      this._on(media, 'loadedmetadata', () => this.#updateTimeProgress());
    }

    if (this.#crossOrigin) {
      media.crossOrigin = this.#crossOrigin;
    }
    media.preload = this.#preload;
    media.autoplay = this.#autoplay;
    media.loop = this.#loop;
    media.muted = this.#muted;
    if (media instanceof HTMLVideoElement) media.playsInline = true;
    media.controls = this.#controls;

    if (this.#stream) {
      const ready = this._waitForMedia(media, 'loadeddata');
      ready.catch(() => {});

      await this.#streamInto(media);

      if (media.readyState < 2) {
        await ready;
      }
    } else {
      const ready = this._waitForMedia(media, 'loadeddata');
      media.src = this.src;
      this._flushMutations();
      media.load();
      await ready;
    }
  }

  /**
   * Downloads the media through fetch, emitting byte-level progress.
   * It optionally supports Media Source Extensions (MSE) allowing sequential partial stream parsing (YouTube-style buffering).
   * @param {HTMLContentElement} media - The target media element.
   * @returns {Promise<void>}
   * @throws {Error} If the network request fails.
   */
  async #streamInto(media) {
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this._setInternalSrc(cached.objectUrl);
      media.src = cached.objectUrl;
      this._flushMutations();
      media.load();
      return;
    }

    /** @type {MediaSource|null} */
    let mse = null;
    /** @type {SourceBuffer|null} */
    let sourceBuffer = null;
    /** @type {BlobPart[]} */
    let queue = [];
    let isAppending = false;
    let mseStarted = false;
    let fallbackTriggered = false;

    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;

      const isMseUrl = this.#mseUrl && media.src === this.#mseUrl;

      if (this.#mseUrl) {
        URL.revokeObjectURL(this.#mseUrl);
        this.#mseUrl = null;
      }

      if (isMseUrl || !media.hasAttribute('src')) {
        this._setInternalSrc(null);
        media.src = this.src;
        this._flushMutations();
      }
    };

    const appendNext = () => {
      if (mseStarted && media.error) triggerFallback();
      if (
        isAppending ||
        queue.length === 0 ||
        !sourceBuffer ||
        sourceBuffer.updating ||
        fallbackTriggered
      )
        return;
      isAppending = true;
      try {
        const blob = /** @type {BufferSource} */ (queue.shift());
        sourceBuffer.appendBuffer(blob);
      } catch (e) {
        isAppending = false;
        triggerFallback();
      }
    };

    const blob = await this._downloadStream(this.src, (chunk) => {
      if (mseStarted && media.error) triggerFallback();

      if (this.progressive && typeof MediaSource !== 'undefined' && !fallbackTriggered) {
        if (!mseStarted) {
          mseStarted = true;
          mse = new MediaSource();
          this.#mseUrl = URL.createObjectURL(mse);
          this._setInternalSrc(this.#mseUrl);
          media.src = this.#mseUrl;
          this._flushMutations();

          mse.addEventListener('sourceopen', () => {
            const mime = this.metadata.type || this.#getMimeType();
            let typesToTry = [mime];
            // Suggest standard codecs for fragmented streams
            for (const mimeName in this.#typesToTry) {
              if (mime.includes(mimeName)) {
                for (const type of this.#typesToTry[mimeName]) {
                  typesToTry.unshift(type.replace('{mime}', mime));
                }
              }
            }

            let selectedType = null;
            for (const t of typesToTry) {
              if (MediaSource.isTypeSupported(t)) {
                selectedType = t;
                break;
              }
            }

            if (selectedType) {
              if (!mse) {
                triggerFallback();
                return;
              }
              try {
                sourceBuffer = mse.addSourceBuffer(selectedType);
                sourceBuffer.addEventListener('updateend', () => {
                  isAppending = false;
                  appendNext();
                });
                sourceBuffer.addEventListener('error', () => {
                  triggerFallback();
                });
                appendNext();
              } catch {
                triggerFallback();
              }
            } else {
              triggerFallback();
            }
          });
        }

        if (!fallbackTriggered) {
          queue.push(chunk);
          if (mse && mse.readyState === 'open' && sourceBuffer) {
            appendNext();
          }
        }
      }
    });

    if (mse && !fallbackTriggered) {
      const endStream = () => {
        if (mse?.readyState === 'open' && !media.error) {
          if (sourceBuffer && (sourceBuffer.updating || queue.length > 0)) {
            setTimeout(endStream, 50);
          } else {
            try {
              mse.endOfStream();
            } catch (e) {}
          }
        }
      };
      endStream();

      // Cache the completely downloaded blob into TinyMediaCache,
      // but we DO NOT swap the media.src here to prevent playback restarts.
      this._cacheBlob(blob);
    } else {
      // Fallback to assigning the blob URL all at once (standard path or on MSE failure)
      const url = this._cacheBlob(blob);

      // If we already fell back to the native network URL, we might be currently playing it!
      // To avoid restarting the user's video, we only swap if playback hasn't advanced.
      if (!fallbackTriggered || (media.paused && media.currentTime === 0)) {
        this._setInternalSrc(url);
        media.src = url;
        this._flushMutations();
        media.load();
      }
    }
  }

  /**
   * Reads the buffered TimeRanges and emits a normalized progress event.
   * @returns {void} This method does not return a value.
   */
  #updateTimeProgress() {
    const media = this.#media;
    const { duration = 0, height = 0, width = 0 } = media ? getMetadata(media) : {};
    if (!media || !Number.isFinite(duration) || duration === 0) {
      return;
    }
    const buffered = media.buffered;
    let loaded = 0;
    for (let i = 0; i < buffered.length; i += 1) {
      loaded += buffered.end(i) - buffered.start(i);
    }
    const tracker = this.progress;
    this.emit('progress', {
      loaded,
      total: duration,
      height,
      width,
      remaining: Math.max(0, duration - loaded),
      percent: Math.min(100, (loaded / duration) * 100),
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
    return `${this.#tag}/${extension}`;
  }

  /**
   * @override
   * @protected
   * @returns {import('../TinyMediaLoader.mjs').MediaMetadataDetails} The resolved metadata for the media.
   */
  _getMetadataDetails() {
    const media = this.#media;
    const patch = media ? getMetadata(media) : {};
    const { duration = 0, width = 0, height = 0 } = patch;
    return {
      type: this.#getMimeType(),
      width,
      height,
      duration: Number.isFinite(duration) ? duration : 0,
      size: this._getResourceSize(),
    };
  }

  /**
   * @override
   * @protected
   * @returns {HTMLContentElement} A newly created element.
   */
  _createElement() {
    // @ts-ignore
    return document.createElement(this.#tag);
  }

  /**
   * @override
   * @protected
   * @returns {void}
   */
  _abort() {
    if (this.#mseUrl) {
      URL.revokeObjectURL(this.#mseUrl);
      this.#mseUrl = null;
    }
    super._abort();
  }

  /**
   * @override
   * @protected
   * @returns {void} This method does not return a value.
   */
  _cleanup() {
    if (this.#mseUrl) {
      URL.revokeObjectURL(this.#mseUrl);
      this.#mseUrl = null;
    }
    this._revokeObjectUrl();
    if (this.#media) {
      this.#media.pause();
      this.#media.removeAttribute('src');
      this.#media.load();
      this._flushMutations();
    }
  }
}

export default TinyContentLoader;
