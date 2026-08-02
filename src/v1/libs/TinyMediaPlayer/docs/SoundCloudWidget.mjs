/**
 * https://developers.soundcloud.com/docs/api/html5-widget
 * @fileoverview JSDoc type definitions for the SoundCloud IFrame Player API.
 * This file provides full IntelliSense/autocomplete for the global `window.SC` object.
 * @module youtube-api-docs
 */

/**
 * @typedef {Object} SoundObject
 * @property {string} title - The title of the sound.
 * @property {number} duration - Duration in milliseconds.
 */

/**
 * Class representing a SoundCloud Widget instance.
 */
class SoundCloudWidget {
  // Private fields for encapsulation
  #volume = 50;
  #position = 0;
  #duration = 180000; // Default 3 minutes
  #isPaused = true;
  #currentSoundIndex = 0;
  #sounds = [
    { title: 'Mock Track 1', duration: 180000 },
    { title: 'Mock Track 2', duration: 210000 },
  ];
  #listeners = new Map();

  /**
   * Creates an instance of SoundCloudWidget.
   * @param {HTMLElement|string} elementOrId - The iframe element or its ID.
   * @throws {TypeError} If the argument is not a string or an HTMLElement.
   */
  constructor(elementOrId) {
    if (typeof elementOrId !== 'string' && !(elementOrId instanceof HTMLElement)) {
      throw new TypeError('The argument must be an HTML element or a string ID.');
    }
    console.log('[Mock] SoundCloud Widget initialized.');
  }

  // --- Getters and Setters with Validation ---

  /** @returns {number} The current volume level. */
  get volume() {
    return this.#volume;
  }

  /**
   * Sets the widget volume.
   * @param {number} value - Volume value between 0 and 100.
   * @throws {TypeError} If value is not a number.
   * @throws {RangeError} If value is outside the 0-100 range.
   */
  set volume(value) {
    if (typeof value !== 'number') {
      throw new TypeError('Volume must be a number.');
    }
    if (value < 0 || value > 100) {
      throw new RangeError('Volume must be between 0 and 100.');
    }
    this.#volume = value;
  }

  // --- Public Methods ---

  /**
   * Adds a listener function for a specific event.
   * @param {string} eventName - The name of the event.
   * @param {Function} listener - The callback function.
   * @throws {TypeError} If listener is not a function.
   */
  bind(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('Listener must be a function.');
    }
    if (!this.#listeners.has(eventName)) {
      this.#listeners.set(eventName, []);
    }
    this.#listeners.get(eventName).push(listener);
  }

  /**
   * Removes all listeners for a specific event.
   * @param {string} eventName - The name of the event.
   */
  unbind(eventName) {
    this.#listeners.delete(eventName);
  }

  /**
   * Simulates loading a new widget.
   * @param {string} url - The URL of the new widget.
   * @param {Record<string, Function>} [options] - Configuration options.
   */
  load(url, options = {}) {
    console.log(`[Mock] Loading new widget from: ${url}`);
    // Simulate async loading
    setTimeout(() => {
      this._triggerEvent('READY', {});
    }, 500);
  }

  /** Plays the sound. */
  play() {
    this.#isPaused = false;
    this._triggerEvent('PLAY', { currentPosition: this.#position });
  }

  /** Pauses the sound. */
  pause() {
    this.#isPaused = true;
    this._triggerEvent('PAUSE', { currentPosition: this.#position });
  }

  /** Toggles the sound state. */
  toggle() {
    if (this.#isPaused) {
      this.play();
    } else {
      this.pause();
    }
  }

  /**
   * Jumps to a specific position.
   * @param {number} milliseconds - Position in milliseconds.
   * @throws {TypeError} If milliseconds is not a number.
   */
  seekTo(milliseconds) {
    if (typeof milliseconds !== 'number') {
      throw new TypeError('Position must be a number.');
    }
    this.#position = milliseconds;
    this._triggerEvent('SEEK', { currentPosition: this.#position });
  }

  /**
   * Sets the volume via method.
   * @param {number} volume - Value between 0 and 100.
   */
  setVolume(volume) {
    this.volume = volume;
  }

  /** Skips to the next sound. */
  next() {
    if (this.#currentSoundIndex < this.#sounds.length - 1) {
      this.#currentSoundIndex++;
      this._triggerEvent('PLAY', { currentPosition: 0 });
    }
  }

  /** Skips to the previous sound. */
  prev() {
    if (this.#currentSoundIndex > 0) {
      this.#currentSoundIndex--;
      this._triggerEvent('PLAY', { currentPosition: 0 });
    }
  }

  /**
   * Jumps to a specific sound index.
   * @param {number} soundIndex - Index starting from 0.
   * @throws {RangeError} If index is out of bounds.
   */
  skip(soundIndex) {
    if (soundIndex < 0 || soundIndex >= this.#sounds.length) {
      throw new RangeError('Sound index out of bounds.');
    }
    this.#currentSoundIndex = soundIndex;
    this._triggerEvent('PLAY', { currentPosition: 0 });
  }

  // --- Getters (Async/Callback-based) ---

  /**
   * @param {(volume: number) => void} callback - Receives the volume.
   */
  getVolume(callback) {
    callback(this.#volume);
  }

  /**
   * @param {(volume: number) => void} callback - Receives the duration.
   */
  getDuration(callback) {
    callback(this.#duration);
  }

  /**
   * @param {(position: number) => void} callback - Receives the current position.
   */
  getPosition(callback) {
    callback(this.#position);
  }

  /**
   * @param {(soundsData: SoundObject[]) => void} callback - Receives the list of sounds.
   */
  getSounds(callback) {
    callback(this.#sounds);
  }

  /**
   * @param {(soundData: SoundObject) => void} callback - Receives the current sound object.
   */
  getCurrentSound(callback) {
    callback(this.#sounds[this.#currentSoundIndex]);
  }

  /**
   * @param {(index: number) => void} callback - Receives the current sound index.
   */
  getCurrentSoundIndex(callback) {
    callback(this.#currentSoundIndex);
  }

  /**
   * @param {(paused: boolean) => void} callback - Receives the paused status.
   */
  isPaused(callback) {
    callback(true);
  }

  // --- Internal Helpers ---

  /**
   * Triggers an event and notifies listeners.
   * @param {string} eventName
   * @param {Object} data
   * @private
   */
  _triggerEvent(eventName, data) {
    const eventListeners = this.#listeners.get(eventName);
    if (eventListeners) {
      eventListeners.forEach((/** @type {(arg0: any) => any} */ listener) => listener(data));
    }
  }
}

export default SoundCloudWidget;
