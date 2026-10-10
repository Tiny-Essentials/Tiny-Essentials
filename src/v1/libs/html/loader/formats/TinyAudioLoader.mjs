/**
 * @fileoverview Concrete loader for audio. Mirrors the VideoLoader API so the
 * two are interchangeable inside a factory. Audio has no intrinsic dimensions,
 * so width and height are always 0.
 */
import TinyContentLoader from './TinyContentLoader.mjs';

/**
 * Configuration options for {@link TinyAudioLoader}.
 * @typedef {Object} AudioLoaderOptions
 * @property {string} [src] - The audio source URL.
 * @property {number} [timeout] - Maximum time in milliseconds before the load is aborted.
 * @property {string|null} [crossOrigin] - The CORS mode applied to the audio.
 * @property {boolean} [autoplay] - Whether the audio should autoplay.
 * @property {boolean} [loop] - Whether the audio should loop.
 * @property {boolean} [muted] - Whether the audio should be muted.
 * @property {boolean} [controls] - Whether the audio should display controls (default true).
 * @property {'none'|'metadata'|'auto'} [preload] - The preload strategy.
 * @property {HTMLAudioElement|null} [element] - An existing DOM element to adopt.
 * @property {boolean} [progressive] - Whether to render progressively during fetch (default true).
 * @property {boolean} [autoReload] - Whether an external `src` change triggers a reload.
 * @property {boolean} [stream] - Whether to download the audio through fetch for byte progress.
 * @property {import('../utils/TinyMediaCache.mjs').default|null} [cache] - An optional shared memory cache.
 */

/**
 * Loads a single audio track with full lifecycle control.
 * @extends {TinyContentLoader<HTMLAudioElement, 'audio'>}
 */
class TinyAudioLoader extends TinyContentLoader {
  /**
   * The uppercase tag name of the element this loader creates.
   * @override
   * @returns {string} The literal string `'AUDIO'`.
   */
  static get tagName() {
    return 'AUDIO';
  }

  /**
   * @param {AudioLoaderOptions} [options] - The loader configuration.
   * @throws {TypeError} If `crossOrigin` is not a string or null.
   * @throws {TypeError} If `preload` is not a string.
   */
  constructor(options = {}) {
    if (
      options.element !== null &&
      options.element !== undefined &&
      !(options.element instanceof HTMLAudioElement)
    ) {
      throw new TypeError('The "element" option must be an HTMLAudioElement or null.');
    }
    /** @type {import('./TinyContentLoader.mjs').TypesToTry} */
    const mimeType = {
      mp4: ['audio/mp4; codecs="mp4a.40.2"'],
      webm: ['audio/webm; codecs="opus"', 'audio/webm; codecs="vorbis"'],
      mp3: ['audio/mpeg'],
    };
    mimeType.m4a = mimeType.mp4;
    mimeType.mpeg = mimeType.mp3;
    super('audio', mimeType, options);
  }

  /**
   * The underlying `<audio>` element.
   * @returns {HTMLAudioElement|null} The underlying `<audio>` element, or `null` before the load starts.
   */
  get audio() {
    return this.media;
  }
}

export default TinyAudioLoader;
