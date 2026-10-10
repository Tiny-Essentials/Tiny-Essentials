/**
 * @fileoverview Concrete loader for images. Exposes cache detection, aspect
 * ratio helpers and full control over the decode step.
 */
import TinyMediaLoader from '../TinyMediaLoader.mjs';

/**
 * @typedef {Object} ImageLoaderOptions
 * @property {string} [src] - The image source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the image.
 * @property {'sync'|'async'|'auto'} [decoding] - The decoding hint passed to the browser.
 * @property {HTMLImageElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [earlyDecode] - Whether to decode the dimensions from the response headers using WebCodecs.
 * @property {boolean} [progressive] - Whether to show the image progressively while streaming (default true).
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the image through fetch for byte progress.
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single image with full lifecycle control.
 * @extends {TinyMediaLoader<HTMLImageElement>}
 */
class TinyImageLoader extends TinyMediaLoader {
  /**
   * Retrieves the tag name used to create the underlying element.
   * @override
   * @returns {string} The uppercase tag name, always `'IMG'`.
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

  /**
   * Creates a new image loader and validates the provided options.
   * @param {ImageLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `decoding` is not a string.
   */
  constructor(options = {}) {
    if (
      options.element !== null &&
      options.element !== undefined &&
      !(options.element instanceof HTMLImageElement)
    ) {
      throw new TypeError('The "element" option must be an HTMLImageElement or null.');
    }
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
   * @returns {HTMLImageElement|null} The current image element, or `null` before the load starts.
   */
  get image() {
    return this.#image;
  }

  /**
   * Indicates whether the image is downloaded through fetch for byte-level progress.
   * @returns {boolean} `true` when streaming is enabled, otherwise `false`.
   */
  get stream() {
    return this.#stream;
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
   * Resolves the target element, wires the load listeners and decodes the image.
   * @override
   * @protected
   * @returns {Promise<void>} A promise that resolves once the image is decoded and ready.
   */
  async _startLoad() {
    const image = /** @type {HTMLImageElement} */ (this._resolveElement());
    this.#image = image;
    if (this.#crossOrigin) {
      image.crossOrigin = this.#crossOrigin;
    }
    image.decoding = this.#decoding;

    if (this.#stream) {
      const ready = this._waitForMedia(image, 'load');
      ready.catch(() => {});

      await this.#streamInto(image);

      if (!image.complete || image.naturalWidth === 0) {
        await this._waitForMedia(image, 'load');
      }
    } else {
      const ready = this._waitForMedia(image, 'load');
      image.src = this.src;
      await ready;
    }

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
   * Updates the image source progressively during the stream.
   * @param {HTMLImageElement} image - The target image element.
   * @returns {Promise<void>} A promise that resolves once the image element points to the blob URL.
   * @throws {Error} If the network request fails.
   */
  async #streamInto(image) {
    const cached = this._acquireFromCache();
    if (cached) {
      this.emit('cachehit', cached);
      this._setInternalSrc(cached.objectUrl);
      image.src = cached.objectUrl;
      return;
    }

    let lastUpdate = performance.now();
    /** @type {string|null} */
    let previousUrl = null;

    try {
      const blob = await this._downloadStream(this.src, (_, chunks) => {
        if (this.progressive) {
          const now = performance.now();
          // Update visual image every 500ms to avoid thrashing CPU
          if (now - lastUpdate > 500) {
            lastUpdate = now;
            const currentBlob = new Blob(chunks, { type: this.metadata.type || 'image/jpeg' });
            const tempUrl = URL.createObjectURL(currentBlob);
            if (previousUrl) URL.revokeObjectURL(previousUrl);
            previousUrl = tempUrl;
            image.src = tempUrl;
          }
        }
      });

      const url = this._cacheBlob(blob);
      this._setInternalSrc(url);
      image.src = url;
    } finally {
      if (previousUrl) URL.revokeObjectURL(previousUrl);
    }
  }

  /**
   * Builds the metadata descriptor for the loaded image.
   * @override
   * @protected
   * @returns {import('../TinyMediaLoader.mjs').MediaMetadataDetails} The image metadata details.
   */
  _getMetadataDetails() {
    const image = this.#image;
    return {
      type: image?.naturalWidth ? `image/${this.#getExtension()}` : 'image/*',
      width: image?.naturalWidth ?? 0,
      height: image?.naturalHeight ?? 0,
      duration: NaN,
      size: this._getResourceSize(),
    };
  }

  /**
   * Detaches the load handlers, revokes the object URL and clears the source of the image element.
   * @override
   * @protected
   * @returns {void} This method does not return a value.
   */
  _cleanup() {
    this._revokeObjectUrl();
    if (this.#image) {
      this.#image.onload = null;
      this.#image.onerror = null;
      this.#image.removeAttribute('src');
      this._flushMutations();
    }
  }

  /**
   * Creates the `<img>` element used by the loader.
   * @override
   * @protected
   * @returns {HTMLImageElement} A new, detached image element.
   */
  _createElement() {
    return document.createElement('img');
  }

  /**
   * Extracts the lowercase file extension from the image source.
   * @returns {string} The file extension without a dot, or `'png'` when none is found.
   */
  #getExtension() {
    const clean = this.src.split('?')[0].split('#')[0];
    const dot = clean.lastIndexOf('.');
    return dot === -1 ? 'png' : clean.slice(dot + 1).toLowerCase();
  }
}

export default TinyImageLoader;
