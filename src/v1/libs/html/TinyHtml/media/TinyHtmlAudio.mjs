import TinyHtmlMedia from '../TinyHtmlMedia.mjs';

/**
 * TinyHtmlAudio is a helper class for managing <audio> elements.
 * It provides full support for standard audio attributes such as
 * `src`, `preload`, `controls`, `autoplay`, `loop`, `muted`, and `volume`,
 * using validated getters and setters for consistency.
 *
 * @example
 * const audio = new TinyHtmlAudio({
 *   src: 'music.mp3',
 *   controls: true,
 *   autoplay: false,
 *   loop: true,
 *   volume: 0.8
 * });
 *
 * @extends TinyHtmlMedia<HTMLAudioElement>
 */
class TinyHtmlAudio extends TinyHtmlMedia {
  /**
   * Creates a new TinyHtmlAudio instance.
   * @param {Object} config - Configuration object.
   * @param {string} [config.src=""] - Audio source URL.
   * @param {'auto'|'metadata'|'none'} [config.preload] - Preload behavior.
   * @param {boolean} [config.controls=false] - Whether playback controls are displayed.
   * @param {boolean} [config.autoplay=false] - Whether playback starts automatically.
   * @param {boolean} [config.loop=false] - Whether playback should loop.
   * @param {boolean} [config.muted=false] - Whether the audio starts muted.
   * @param {number} [config.volume] - Initial playback volume (0.0 to 1.0).
   * @param {string|string[]|Set<string>} [config.tags=[]] - Initial CSS classes.
   * @param {string} [config.mainClass=""] - Main CSS class.
   * @throws {TypeError} If any attribute is of the wrong type.
   */
  constructor({
    src = '',
    preload,
    controls = false,
    autoplay = false,
    loop = false,
    muted = false,
    volume,
    tags = [],
    mainClass = '',
  } = {}) {
    super(document.createElement('audio'), tags, mainClass);

    this.src = src;
    if (preload !== undefined) this.preload = preload;
    this.controls = controls;
    this.autoplay = autoplay;
    this.loop = loop;
    this.muted = muted;
    if (volume !== undefined) this.volume = volume;
  }

  /** @param {string} src */
  set src(src) {
    if (typeof src !== 'string') throw new TypeError('TinyHtmlAudio: "src" must be a string.');
    if (src) this.setAttr('src', src);
    else this.removeAttr('src');
  }

  /** @returns {string|null} */
  get src() {
    return this.attrString('src');
  }

  /** @param {boolean} controls */
  set controls(controls) {
    if (typeof controls !== 'boolean')
      throw new TypeError('TinyHtmlAudio: "controls" must be a boolean.');
    if (controls) this.addProp('controls');
    else this.removeProp('controls');
  }

  /** @returns {boolean} */
  get controls() {
    return this.hasProp('controls');
  }

  /** @param {boolean} autoplay */
  set autoplay(autoplay) {
    if (typeof autoplay !== 'boolean')
      throw new TypeError('TinyHtmlAudio: "autoplay" must be a boolean.');
    if (autoplay) this.addProp('autoplay');
    else this.removeProp('autoplay');
  }

  /** @returns {boolean} */
  get autoplay() {
    return this.hasProp('autoplay');
  }

  /** @param {boolean} loop */
  set loop(loop) {
    if (typeof loop !== 'boolean') throw new TypeError('TinyHtmlAudio: "loop" must be a boolean.');
    if (loop) this.addProp('loop');
    else this.removeProp('loop');
  }

  /** @returns {boolean} */
  get loop() {
    return this.hasProp('loop');
  }

  /** @param {boolean} muted */
  set muted(muted) {
    if (typeof muted !== 'boolean')
      throw new TypeError('TinyHtmlAudio: "muted" must be a boolean.');
    if (muted) this.addProp('muted');
    else this.removeProp('muted');
  }

  /** @returns {boolean} */
  get muted() {
    return this.hasProp('muted');
  }

  /** @param {number} volume */
  set volume(volume) {
    if (typeof volume !== 'number' || volume < 0 || volume > 1)
      throw new TypeError('TinyHtmlAudio: "volume" must be a number between 0.0 and 1.0.');
    this.el.volume = volume; // direct property on <audio>
  }

  /** @returns {number} */
  get volume() {
    return this.el.volume;
  }
}

export default TinyHtmlAudio;
