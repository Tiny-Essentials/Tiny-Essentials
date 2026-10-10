/**
 * @fileoverview Concrete loader for videos.
 */
import TinyContentLoader from './TinyContentLoader.mjs';

/**
 * @typedef {Object} VideoLoaderOptions
 * @property {string} [src] - The video source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the video.
 * @property {boolean} [autoplay] - Whether the video should autoplay.
 * @property {boolean} [loop] - Whether the video should loop.
 * @property {boolean} [muted] - Whether the video should be muted.
 * @property {boolean} [controls] - Whether the video should display controls (default true).
 * @property {'none'|'metadata'|'auto'} [preload] - The preload strategy.
 * @property {HTMLVideoElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [progressive] - Whether to render progressively during fetch (default true).
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the video through fetch for byte progress.
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single video with full lifecycle control.
 * @extends {TinyContentLoader<HTMLVideoElement, 'video'>}
 */
class TinyVideoLoader extends TinyContentLoader {
  /**
   * @override
   * @returns {string} The uppercase tag name of the underlying media element.
   */
  static get tagName() {
    return 'VIDEO';
  }

  /**
   * @param {VideoLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `preload` is not a string.
   */
  constructor(options = {}) {
    if (
      options.element !== null &&
      options.element !== undefined &&
      !(options.element instanceof HTMLVideoElement)
    ) {
      throw new TypeError('The "element" option must be an HTMLVideoElement or null.');
    }
    const mimeType = {
      mp4: ['{mime}; codecs="avc1.42E01E, mp4a.40.2"', '{mime}; codecs="avc1.640028, mp4a.40.2"'],
      webm: ['{mime}; codecs="vp9, opus"', '{mime}; codecs="vp8, vorbis"'],
    };
    super('video', mimeType, options);
  }

  /**
   * The underlying `<video>` element.
   * @returns {HTMLVideoElement|null}
   */
  get video() {
    return this.media;
  }
}

export default TinyVideoLoader;
