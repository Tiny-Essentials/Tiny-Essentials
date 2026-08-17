import TinyHtmlMedia from '../TinyHtmlMedia.mjs';

/**
 * TinyVideo is a helper class for managing <video> elements.
 * It allows configuring all standard attributes such as src, poster, controls,
 * autoplay, loop, muted, playsinline, controlslist, crossorigin, preload,
 * disablepictureinpicture, disableremoteplayback, width, height, and volume,
 * with validation.
 *
 * @example
 * const video = new TinyHtmlVideo({
 *   src: 'video.mp4',
 *   controls: true,
 *   autoplay: false,
 *   width: 640,
 *   height: 360
 * });
 *
 * @extends TinyHtmlMedia<HTMLVideoElement>
 */
class TinyHtmlVideo extends TinyHtmlMedia {
  /**
   * Creates a new TinyVideo instance.
   * @param {Object} config
   * @param {string} [config.src=''] - The video file URL.
   * @param {string} [config.poster=''] - Image URL shown before playback starts.
   * @param {boolean} [config.controls=false] - Whether to show default controls.
   * @param {boolean} [config.autoplay=false] - Start playback automatically (muted may be required).
   * @param {boolean} [config.loop=false] - Replay automatically when finished.
   * @param {boolean} [config.muted=false] - Start playback muted.
   * @param {boolean} [config.playsinline=false] - Play inline instead of fullscreen (mobile devices).
   * @param {'nodownload'|'nofullscreen'|'noremoteplayback'|string} [config.controlslist] - Restrict controls visibility.
   * @param {'anonymous'|'use-credentials'} [config.crossorigin] - CORS setting for the video request.
   * @param {boolean} [config.disablepictureinpicture=false] - Disable Picture-in-Picture mode.
   * @param {boolean} [config.disableremoteplayback=false] - Disable casting / remote playback.
   * @param {'auto'|'metadata'|'none'} [config.preload] - Preload behavior suggestion.
   * @param {number} [config.width] - CSS pixel width of the video display.
   * @param {number} [config.height] - CSS pixel height of the video display.
   * @param {number} [config.volume] - Initial volume (0.0–1.0).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class applied.
   */
  constructor({
    src = '',
    poster = '',
    controls = false,
    autoplay = false,
    loop = false,
    muted = false,
    playsinline = false,
    controlslist,
    crossorigin,
    disablepictureinpicture = false,
    disableremoteplayback = false,
    preload,
    width,
    height,
    volume,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('video'), tags, mainClass);

    if (src) this.src = src;
    if (poster) this.poster = poster;
    if (preload) this.preload = preload;

    this.controls = controls;
    this.autoplay = autoplay;
    this.loop = loop;
    this.muted = muted;
    this.playsinline = playsinline;
    this.disablepictureinpicture = disablepictureinpicture;
    this.disableremoteplayback = disableremoteplayback;

    if (controlslist) this.controlslist = controlslist;
    if (crossorigin) this.crossorigin = crossorigin;

    if (typeof volume === 'number') this.volume = volume;
    if (width !== undefined) this.width = width;
    if (height !== undefined) this.height = height;
  }

  // ------------------------
  // Attribute getters/setters
  // ------------------------

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string') throw new TypeError('TinyVideo: "src" must be a string.');
    this.setAttr('src', src);
  }
  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {string} poster */
  set poster(poster) {
    if (typeof poster !== 'string') throw new TypeError('TinyVideo: "poster" must be a string.');
    this.setAttr('poster', poster);
  }
  /** @returns {string|null} */
  get poster() {
    return this.attrString('poster');
  }

  /** @param {boolean} controls */
  set controls(controls) {
    if (typeof controls !== 'boolean') throw new TypeError('"controls" must be a boolean.');
    controls ? this.addProp('controls') : this.removeProp('controls');
  }
  /** @returns {boolean} */
  get controls() {
    return this.hasProp('controls');
  }

  /** @param {boolean} playsinline */
  set playsinline(playsinline) {
    if (typeof playsinline !== 'boolean') throw new TypeError('"playsinline" must be a boolean.');
    playsinline ? this.addProp('playsinline') : this.removeProp('playsinline');
  }
  /** @returns {boolean} */
  get playsinline() {
    return this.hasProp('playsinline');
  }

  /** @param {'nodownload'|'nofullscreen'|'noremoteplayback'|string} controlslist */
  set controlslist(controlslist) {
    if (typeof controlslist !== 'string')
      throw new TypeError('TinyVideo: "controlslist" must be a string.');
    this.setAttr('controlslist', controlslist);
  }
  /** @returns {string|null} */
  get controlslist() {
    return this.attrString('controlslist');
  }

  /** @param {'anonymous'|'use-credentials'} crossorigin */
  set crossorigin(crossorigin) {
    if (!['anonymous', 'use-credentials'].includes(crossorigin))
      throw new TypeError('TinyVideo: "crossorigin" must be "anonymous" or "use-credentials".');
    this.setAttr('crossorigin', crossorigin);
  }
  /** @returns {string|null} */
  get crossorigin() {
    return this.attrString('crossorigin');
  }

  /** @param {boolean} disable */
  set disablepictureinpicture(disable) {
    if (typeof disable !== 'boolean')
      throw new TypeError('"disablepictureinpicture" must be a boolean.');
    disable ? this.addProp('disablepictureinpicture') : this.removeProp('disablepictureinpicture');
  }
  /** @returns {boolean} */
  get disablepictureinpicture() {
    return this.hasProp('disablepictureinpicture');
  }

  /** @param {boolean} disable */
  set disableremoteplayback(disable) {
    if (typeof disable !== 'boolean')
      throw new TypeError('"disableremoteplayback" must be a boolean.');
    disable ? this.addProp('disableremoteplayback') : this.removeProp('disableremoteplayback');
  }
  /** @returns {boolean} */
  get disableremoteplayback() {
    return this.hasProp('disableremoteplayback');
  }

  // ------------------------
  // Fullscreen controls
  // ------------------------

  /** @returns {Promise<void>|undefined} */
  requestFullscreen() {
    return this.el.requestFullscreen();
  }

  /** @returns {Promise<boolean>} */
  async exitFullscreen() {
    if (document.fullscreenElement === this.el) {
      await document.exitFullscreen();
      return true;
    }
    return false;
  }
}

export default TinyHtmlVideo;
