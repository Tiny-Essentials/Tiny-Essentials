import TinyHtmlTemplate from './TinyHtmlTemplate.mjs';

/** @typedef {import('./TinyHtmlTemplate.mjs').ClassSetter} ClassSetter */

/**
 * TinyHtmlMedia is a base helper for <audio> and <video> elements.
 * It provides a consistent API to control media playback and access
 * standard {@link HTMLMediaElement} properties and methods.
 *
 * @template {HTMLMediaElement} TinyHtmlT
 * @extends TinyHtmlTemplate<TinyHtmlT>
 */
class TinyHtmlMedia extends TinyHtmlTemplate {
  /**
   * Creates a new TinyHtmlMedia instance.
   * @param {TinyHtmlT} tag - The HTML tag name (e.g., 'audio', 'video').
   * @param {ClassSetter} [tags=[]] - Initial CSS classes to apply.
   * @param {ClassSetter} [mainClass=[]] - Main CSS classes to apply.
   */
  constructor(tag, tags = [], mainClass = []) {
    super(tag, tags, mainClass);
  }

  // ------------------------
  // Core playback controls
  // ------------------------

  /**
   * Plays all attached media elements.
   * @returns {Promise<void>} Resolves when all play calls complete.
   */
  playMedia() {
    return this.el.play();
  }

  /**
   * Pauses all attached media elements.
   * @returns {this}
   */
  pauseMedia() {
    this.el.pause();
    return this;
  }

  /**
   * Toggles play/pause state for all attached media elements.
   * @returns {this}
   */
  togglePlayMedia() {
    const el = this.el;
    el.paused ? el.play() : el.pause();
    return this;
  }

  /**
   * Stops all media by pausing and resetting the current time to `0`.
   * @returns {this}
   */
  stopMedia() {
    this.pauseMedia();
    this.currentTime = 0;
    return this;
  }

  /**
   * Reloads all attached media elements.
   * @returns {this}
   */
  loadMedia() {
    this.el.load();
    return this;
  }

  // ------------------------
  // Methods
  // ------------------------

  /**
   * Adds a new text track to the first media element.
   * @param {TextTrackKind} kind - A string representing the TextTrack.kind property (subtitles, captions, descriptions, chapters, or metadata).
   * @param {string} [label] - A string representing the TextTrack.label property.
   * @param {string} [language] - A string representing the TextTrack.language property.
   * @returns {TextTrack}
   */
  addTextTrack(kind, label, language) {
    return this.el.addTextTrack(kind, label, language);
  }

  /**
   * Checks if a given MIME type can be played.
   * @param {string} type - MIME type (e.g., 'video/mp4').
   * @returns {CanPlayTypeResult} Either "", "probably", or "maybe".
   */
  canPlayType(type) {
    return this.el.canPlayType(type);
  }

  /**
   * Seeks quickly to a given time if supported.
   * @param {number} time - Target time in seconds.
   * @returns {this}
   */
  fastSeek(time) {
    this.el.fastSeek(time);
    return this;
  }

  /**
   * Sets custom MediaKeys on the first media element.
   * @param {MediaKeys|null} keys - Media keys to set.
   * @returns {Promise<void>}
   */
  setMediaKeys(keys) {
    return this.el.setMediaKeys(keys);
  }

  /**
   * Assigns a sink ID (output device) to the first media element.
   * @param {string} id - The sink ID (device ID).
   * @returns {Promise<void>}
   */
  setSinkId(id) {
    return this.el.setSinkId(id);
  }

  // ------------------------
  // Properties (wrappers)
  // ------------------------

  /** @type {boolean} Autoplay state of the media. */
  get autoplay() {
    return this.el.autoplay;
  }
  set autoplay(v) {
    this.setProp('autoplay', v);
  }

  /** @returns {TimeRanges} The buffered time ranges. */
  get buffered() {
    return this.el.buffered;
  }

  /** @type {boolean} Whether default controls are visible. */
  get controls() {
    return this.el.controls;
  }
  set controls(v) {
    this.setProp('controls', v);
  }

  /** @type {string|null} The list of controls available. */
  get controlsList() {
    return this.attr('controlsList');
  }
  set controlsList(v) {
    this.setAttr('controlsList', v);
  }

  /** @type {string|null} CORS setting for the media. */
  get crossOrigin() {
    return this.attr('crossOrigin');
  }
  set crossOrigin(v) {
    this.setAttr('crossOrigin', v);
  }

  /** @returns {string} The resolved source URL currently playing. */
  get currentSrc() {
    return this.el.currentSrc;
  }

  /** @type {number} The current playback position in seconds. */
  get currentTime() {
    return this.el.currentTime;
  }
  set currentTime(t) {
    this.el.currentTime = t;
  }

  /** @type {boolean} Whether media is muted by default. */
  get defaultMuted() {
    return this.el.defaultMuted;
  }
  set defaultMuted(v) {
    this.setProp('defaultMuted', v);
  }

  /** @type {number} Default playback rate (1 = normal speed). */
  get defaultPlaybackRate() {
    return this.el.defaultPlaybackRate;
  }
  set defaultPlaybackRate(v) {
    this.el.defaultPlaybackRate = v;
  }

  /** @type {boolean} Whether remote playback is disabled. */
  get disableRemotePlayback() {
    return this.el.disableRemotePlayback;
  }
  set disableRemotePlayback(v) {
    this.setProp('disableRemotePlayback', v);
  }

  /** @returns {number} The duration of the media in seconds. */
  get duration() {
    return this.el.duration;
  }

  /** @returns {boolean} Whether the media has ended. */
  get ended() {
    return this.el.ended;
  }

  /** @returns {MediaError|null} Error state if media failed to load. */
  get error() {
    return this.el.error;
  }

  /** @type {boolean} Whether the media should loop. */
  get loop() {
    return this.el.loop;
  }
  set loop(v) {
    this.setProp('loop', v);
  }

  /** @type {string|null} Media group name for synchronization. */
  get mediaGroup() {
    return this.attr('mediaGroup');
  }
  set mediaGroup(v) {
    this.setAttr('mediaGroup', v);
  }

  /** @returns {MediaKeys|null} The associated MediaKeys object. */
  get mediaKeys() {
    return this.el.mediaKeys;
  }

  /** @type {boolean} Whether the media is muted. */
  get muted() {
    return this.el.muted;
  }
  set muted(state) {
    this.el.muted = state;
  }

  /** @returns {number} Network state (see `HTMLMediaElement.networkState`). */
  get networkState() {
    return this.el.networkState;
  }

  /** @returns {boolean} Whether the media is currently paused. */
  get paused() {
    return this.el.paused;
  }

  /** @type {number} Current playback rate (1 = normal speed). */
  get playbackRate() {
    return this.el.playbackRate;
  }
  set playbackRate(rate) {
    this.el.playbackRate = rate;
  }

  /** @returns {TimeRanges} Played time ranges. */
  get played() {
    return this.el.played;
  }

  /** @type {"" | "metadata" | "none" | "auto"} Preload strategy ('none', 'metadata', 'auto'). */
  get preload() {
    return this.el.preload;
  }
  set preload(v) {
    const valid = ['auto', 'metadata', 'none'];
    if (!valid.includes(v))
      throw new TypeError(`TinyVideo: "preload" must be one of ${valid.join(', ')}.`);
    this.setAttr('preload', v);
  }

  /** @type {boolean} Whether pitch is preserved when rate changes. */
  get preservesPitch() {
    return this.el.preservesPitch;
  }
  set preservesPitch(v) {
    this.setProp('preservesPitch', v);
  }

  /** @returns {number} Ready state of the media. */
  get readyState() {
    return this.el.readyState;
  }

  /** @returns {RemotePlayback|null} Remote playback interface. */
  get remote() {
    return this.el.remote;
  }

  /** @returns {TimeRanges} Seekable time ranges. */
  get seekable() {
    return this.el.seekable;
  }

  /** @returns {boolean} Whether the media is currently seeking. */
  get seeking() {
    return this.el.seeking;
  }

  /** @returns {string} Current sink ID (output device). */
  get sinkId() {
    return this.el.sinkId;
  }

  /** @type {string|null} Source URL of the media. */
  get src() {
    return this.attr('src');
  }
  set src(v) {
    this.setAttr('src', v);
  }

  /** @type {MediaProvider|null} Current `srcObject` (e.g., MediaStream). */
  get srcObject() {
    return this.el.srcObject;
  }
  set srcObject(v) {
    this.el.srcObject = v;
  }

  /** @returns {TextTrackList} Available text tracks. */
  get textTracks() {
    return this.el.textTracks;
  }

  /**
   * Gets the current volume.
   * @returns {number} Value between 0.0 and 1.0.
   */
  get volume() {
    return this.el.volume;
  }
  /**
   * Sets the volume level.
   * @param {number} level - Value between 0.0 and 1.0.
   * @throws {TypeError} If not a number.
   */
  set volume(level) {
    if (typeof level !== 'number' || level < 0 || level > 1) {
      throw new TypeError('TinyVideo: "volume" must be a number between 0.0 and 1.0.');
    }
    this.el.volume = level;
  }
}

export default TinyHtmlMedia;
