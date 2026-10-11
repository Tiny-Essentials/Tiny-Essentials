/**
 * @fileoverview Concrete loader for medias.
 */
import TinyMediaLoader from '../../TinyMediaLoader.mjs';
import TinyMediaProbe from '../probe/TinyMediaProbe.mjs';

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
 * @property {boolean} [useHeadRequest] - Whether to perform a HEAD request to fetch HTTP headers before downloading.
 * @property {import('../../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * @typedef {import('../../TinyMediaLoader.mjs').MediaEarlyDecoder} MediaEarlyDecoder
 */

/**
 * @typedef {Record<string, string[]>} TypesToTry
 */

/**
 * @param {HTMLVideoElement|HTMLAudioElement} media
 */
const getMetadata = (media) => {
  /** @type {Partial<import('../../TinyMediaLoader.mjs').MediaMetadata>} */
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
    super({ useHeadRequest: false, ...options });
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

    this._insertDecoder('video', (mime) => {
      const probe = new TinyMediaProbe(mime);
      return {
        write: (chunk) => {
          const size = probe.push(chunk);
          if (size) {
            this._emitMetadata(size, 'PROBE');
          }
        },
        close: () => probe.close(),
      };
    });
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

    const onMetadata = () => {
      const patch = getMetadata(media);
      if (Object.keys(patch).length > 0) this._emitMetadata(patch, 'LOADED_METADATA');
    };

    this._on(media, 'loadedmetadata', onMetadata);

    this._on(media, 'durationchange', () => {
      if (Number.isFinite(media.duration)) {
        this._emitMetadata({ duration: media.duration }, 'DURATION_CHANGE');
      }
    });

    // Time-based progress only makes sense when we are not downloading the file ourselves.
    if (!this.#stream) {
      this._on(media, 'progress', () => this.#updateTimeProgress());
      this._on(media, 'loadedmetadata', () => this.#updateTimeProgress());
    }

    if (media.readyState >= 1) {
      onMetadata();
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

      await this.#streamInto(media, 0);

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
   * Downloads the media through fetch, supporting byte-level progress and seeking.
   * @param {HTMLContentElement} media - The target media element.
   * @param {number} startByte - The byte offset to start from.
   * @returns {Promise<void>}
   */
  async #streamInto(media, startByte) {
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
    let appendedBytes = 0;

    const infinityCheck = () => {
      if (media.duration === Infinity && !fallbackTriggered) {
        triggerFallback();
      }
    };
    media.addEventListener('durationchange', infinityCheck);
    media.addEventListener('loadedmetadata', infinityCheck);

    // Isolated controller for the stream.
    let fetchController = new AbortController();
    const onLoaderAbort = () => fetchController.abort();
    this.signal.signal.addEventListener('abort', onLoaderAbort);

    const triggerFallback = () => {
      if (fallbackTriggered) return;
      fallbackTriggered = true;

      media.removeEventListener('durationchange', infinityCheck);
      media.removeEventListener('loadedmetadata', infinityCheck);

      // Immediately release the network socket by aborting the fetch!
      // This prevents the browser from freezing the network by queuing duplicate requests.
      fetchController.abort();

      const isMseUrl = this.#mseUrl && media.src === this.#mseUrl;

      // Saves the current playback state to restore after fallback
      const currentTime = media.currentTime;
      const wasPlaying = !media.paused && media.readyState >= 2;

      if (this.#mseUrl) {
        URL.revokeObjectURL(this.#mseUrl);
        this.#mseUrl = null;
      }

      if (isMseUrl || !media.hasAttribute('src')) {
        this._setInternalSrc(null);
        media.src = this.src;
        this._flushMutations();

        // Restaura o tempo em caso de seek fallback
        if (currentTime > 0) {
          const onLoadedMetadata = () => {
            media.currentTime = currentTime;
            if (wasPlaying) media.play().catch(() => {});
            media.removeEventListener('loadedmetadata', onLoadedMetadata);
          };
          media.addEventListener('loadedmetadata', onLoadedMetadata);
        }
      }
    };

    // Buffer cleanup function (Item 2: Eviction)
    const evictOldBuffer = () => {
      if (!sourceBuffer || sourceBuffer.updating || fallbackTriggered) return;
      const currentTime = media.currentTime;
      if (sourceBuffer.buffered.length > 0) {
        const bufferStart = sourceBuffer.buffered.start(0);
        // If there are more than 30 seconds behind, delete up to 10 seconds before the current moment
        if (currentTime - bufferStart > 30) {
          try {
            sourceBuffer.remove(bufferStart, currentTime - 10);
          } catch (e) {}
        }
      }
    };

    // ITEM 3: New seek listener outside of the isolated buffer (Avoids duplicate listeners)
    if (!media.hasAttribute('data-seek-bound')) {
      media.setAttribute('data-seek-bound', 'true');
      this._on(media, 'seeking', () => {
        if (fallbackTriggered || !mseStarted || !sourceBuffer) return;
        const time = media.currentTime;
        let isBuffered = false;
        const b = sourceBuffer.buffered;

        for (let i = 0; i < b.length; i++) {
          // Allows a small margin of error (0.1s)
          if (time >= b.start(i) && time <= b.end(i) + 0.1) {
            isBuffered = true;
            break;
          }
        }

        if (!isBuffered) {
          // Abort current fetch to jump to the new time
          fetchController.abort();
          if (sourceBuffer.updating) sourceBuffer.abort();
          queue = [];
          isAppending = false;

          // Heuristic byte-range calculation (Ideally requires Sidx/moov atom demuxing, but solves 90% of CBR cases)
          const totalBytes = this.metadata.size || this._getResourceSize();
          const duration = this.metadata.duration || media.duration;

          if (totalBytes > 0 && duration > 0) {
            const estimatedByte = Math.floor((time / duration) * totalBytes);
            // Generate new controller for the next request
            fetchController = new AbortController();
            startStream(estimatedByte); // Restarts the stream from the new byte
          } else {
            triggerFallback();
          }
        }
      });
    }

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
        appendedBytes += blob.byteLength;
        sourceBuffer.appendBuffer(blob);
      } catch (e) {
        isAppending = false;
        triggerFallback();
      }
    };

    /** @param {number} byteOffset */
    const startStream = async (byteOffset) => {
      try {
        const blob = await this._downloadStream(
          this.src,
          (chunk) => {
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

                  if (selectedType && mse) {
                    try {
                      sourceBuffer = mse.addSourceBuffer(selectedType);
                      sourceBuffer.addEventListener('updateend', () => {
                        isAppending = false;
                        evictOldBuffer(); // Executes the GC after each append

                        if (
                          !fallbackTriggered &&
                          sourceBuffer?.buffered.length === 0 &&
                          appendedBytes > 256 * 1024
                        ) {
                          triggerFallback();
                          return;
                        }
                        appendNext();
                      });
                      sourceBuffer.addEventListener('error', triggerFallback);
                      appendNext();
                    } catch {
                      triggerFallback();
                    }
                  } else {
                    triggerFallback();
                  }

                  if (sourceBuffer && byteOffset > 0) sourceBuffer.abort();
                });
              }

              if (!fallbackTriggered) {
                queue.push(chunk);
                if (mse && mse.readyState === 'open' && sourceBuffer) appendNext();
              }
            }
          },
          byteOffset,
          fetchController.signal,
        );

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

          if (byteOffset === 0 && blob.size > 0) this._cacheBlob(blob);
        } else if (byteOffset === 0 && blob.size > 0) {
          const url = this._cacheBlob(blob);
          if (!fallbackTriggered || (media.paused && media.currentTime === 0)) {
            this._setInternalSrc(url);
            media.src = url;
            this._flushMutations();
            media.load();
          }
        }
      } catch (err) {
        if (err instanceof Error) {
          if (
            err.name === 'AbortError' &&
            (fallbackTriggered || media.hasAttribute('data-seek-bound'))
          )
            return;
          throw err;
        }
      }
    };

    try {
      await startStream(startByte);
    } finally {
      this.signal.signal.removeEventListener('abort', onLoaderAbort);
      media.removeEventListener('durationchange', infinityCheck);
      media.removeEventListener('loadedmetadata', infinityCheck);
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
   * @returns {import('../../TinyMediaLoader.mjs').MediaMetadataDetails} The resolved metadata for the media.
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
