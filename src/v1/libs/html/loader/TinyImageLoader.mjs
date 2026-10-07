/**
 * @fileoverview Concrete loader for images. Exposes cache detection, aspect
 * ratio helpers and full control over the decode step.
 */
import TinyMediaLoader from './TinyMediaLoader.mjs';

/**
 * @typedef {Object} ImageLoaderOptions
 * @property {string} [src] - The image source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the image.
 * @property {'sync'|'async'|'auto'} [decoding] - The decoding hint passed to the browser.
 * @property {HTMLImageElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the image through fetch for byte progress.
 * @property {import('./TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single image with full lifecycle control.
 * @augments TinyMediaLoader
 */
class TinyImageLoader extends TinyMediaLoader {
  /**
   * @override
   * @returns {string}
   */
  static get tagName() {
    return 'IMG';
  }

  /** @type {HTMLImageElement|null} */
  #image;
  /** @type {string|null} */
  #crossOrigin;
  /** @type {'sync'|'async'|'auto'} */
  #decoding;
  /** @type {boolean} */
  #stream;
  /** @type {string|null} */
  #objectUrl = null;

  /**
   * @param {ImageLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `decoding` is not a string.
   */
  constructor(options = {}) {
    super(options);
    const { crossOrigin = null, decoding = 'async', stream = false } = options;
    if (crossOrigin !== null && typeof crossOrigin !== 'string') {
      throw new TypeError('The "crossOrigin" option must be a string or null.');
    }
    if (typeof decoding !== 'string') {
      throw new TypeError('The "decoding" option must be a string.');
    }
    this.#stream = Boolean(stream);
    this.#crossOrigin = crossOrigin;
    this.#decoding = decoding;
    this.#image = null;
  }

  /**
   * The underlying `<img>` element.
   * @returns {HTMLImageElement|null}
   */
  get image() {
    return this.#image;
  }

  /**
   * @returns {number} The intrinsic width in pixels.
   */
  get naturalWidth() {
    return this.#image?.naturalWidth ?? 0;
  }

  /**
   * @returns {number} The intrinsic height in pixels.
   */
  get naturalHeight() {
    return this.#image?.naturalHeight ?? 0;
  }

  /**
   * @returns {number} The width divided by the height, or 0 when unknown.
   */
  get aspectRatio() {
    const height = this.naturalHeight;
    return height === 0 ? 0 : this.naturalWidth / height;
  }

  /**
   * @override
   * @protected
   * @returns {Promise<void>}
   */
  async _startLoad() {
    const image = /** @type {HTMLImageElement} */ (this._resolveElement());
    this.#image = image;
    if (this.#crossOrigin) {
      image.crossOrigin = this.#crossOrigin;
    }
    image.decoding = this.#decoding;

    const ready = new Promise((resolve, reject) => {
      const onLoad = () => {
        cleanup();
        resolve(undefined);
      };
      const onError = () => {
        cleanup();
        reject(new Error(`Failed to load image: ${this.src}`));
      };
      const cleanup = () => {
        image.removeEventListener('load', onLoad);
        image.removeEventListener('error', onError);
      };
      image.addEventListener('load', onLoad);
      image.addEventListener('error', onError);
    });

    if (this.#stream) {
      await this.#streamInto(image);
    } else {
      image.src = this.src;
    }

    await ready;

    if (typeof image.decode === 'function') {
      try {
        await image.decode();
      } catch {
        // A decode failure is non-fatal: the image is still renderable.
      }
    }
  }

  /**
   * Downloads the image through fetch, emitting byte-level progress.
   * @param {HTMLImageElement} image - The target image element.
   * @returns {Promise<void>}
   * @throws {Error} If the network request fails.
   */
  async #streamInto(image) {
    const cache = this.cache;
    const cached = cache?.acquire(this.src);
    if (cached) {
      this.emit('cachehit', cached);
      image.src = cached.objectUrl;
      return;
    }
    const response = await fetch(this.src, { signal: this.signal.signal });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
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
      type: response.headers.get('content-type') || 'image/*',
    });
    if (cache) {
      const entry = cache.set(this.src, blob);
      cache.acquire(this.src);
      this.emit('cachemiss', entry);
      image.src = entry.objectUrl;
      return;
    }
    this.#objectUrl = URL.createObjectURL(blob);
    image.src = this.#objectUrl;
  }

  /**
   * @override
   * @protected
   * @returns {import('./TinyMediaLoader.mjs').MediaMetadataDetails}
   */
  _getMetadataDetails() {
    const image = this.#image;
    return {
      type: image?.naturalWidth ? `image/${this.#getExtension()}` : 'image/*',
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
      duration: 0,
      size: this._getResourceSize(),
    };
  }

  /**
   * @override
   * @protected
   * @returns {void}
   */
  _abort() {
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      this.#objectUrl = null;
    }
    if (this.#image) {
      this.#image.removeAttribute('src');
      this._flushMutations();
    }
  }

  /**
   * @override
   * @protected
   * @returns {void}
   */
  _cleanup() {
    if (this.#objectUrl) {
      URL.revokeObjectURL(this.#objectUrl);
      this.#objectUrl = null;
    }
    if (this.#image) {
      this.#image.onload = null;
      this.#image.onerror = null;
      this.#image.removeAttribute('src');
      this._flushMutations();
    }
  }

  /**
   * @override
   * @protected
   * @returns {HTMLImageElement}
   */
  _createElement() {
    return document.createElement('img');
  }

  /**
   * @returns {string}
   */
  #getExtension() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    return dot === -1 ? 'png' : clean.slice(dot + 1).toLowerCase();
  }
}

export default TinyImageLoader;
