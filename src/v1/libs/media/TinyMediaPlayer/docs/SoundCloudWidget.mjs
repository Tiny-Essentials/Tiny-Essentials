/**
 * https://developers.soundcloud.com/docs/api/html5-widget
 * @fileoverview JSDoc type definitions for the SoundCloud IFrame Player API.
 * This file provides full IntelliSense/autocomplete for the global `window.SC` object.
 * @module youtube-api-docs
 */

/**
 * @typedef {Object} SoundObject
 * @property {string} title - The title of the track.
 * @property {number} duration - Total duration of the track in milliseconds.
 * @property {string} artwork_url - The URL of the track's cover art image.
 * @property {string} caption - A short descriptive caption for the track.
 * @property {number} comment_count - The total number of comments on the track.
 * @property {boolean} commentable - Indicates if users are allowed to comment on this track.
 * @property {string} created_at - ISO 8601 timestamp of when the track was created.
 * @property {string} description - The full text description of the track.
 * @property {string} display_date - A human-readable string representing the date.
 * @property {number} download_count - The total number of times the track has been downloaded.
 * @property {boolean} downloadable - Indicates if the track is available for download.
 * @property {string} embeddable_by - Information regarding the permissions for embedding the track.
 * @property {number} full_duration - The complete duration of the track in milliseconds.
 * @property {string} genre - The musical genre assigned to the track.
 * @property {boolean} has_downloads_left - Indicates if the user has remaining download credits.
 * @property {number} id - The unique numerical identifier for the sound.
 * @property {string} kind - The type of resource (e.g., 'track').
 * @property {string} label_name - The name of the record label associated with the track.
 * @property {string} last_modified - ISO 8601 timestamp of the last time the track was modified.
 * @property {string} license - The licensing terms applied to the track.
 * @property {number} likes_count - The total number of likes the track has received.
 * @property {string} monetization_model - The specific model used for track monetization.
 * @property {string} permalink - The unique URL slug for the track.
 * @property {string} permalink_url - The full URL of the track's permalink.
 * @property {boolean} playable - Indicates if the track is currently playable.
 * @property {number} playback_count - The total number of times the track has been played.
 * @property {string} policy - The usage policy governing the track.
 * @property {boolean} public - Indicates if the track is accessible to the public.
 * @property {string} purchase_title - The title used when purchasing the track.
 * @property {string} purchase_url - The URL used to purchase the track.
 * @property {string} release_date - The official release date of the track.
 * @property {number} reposts_count - The total number of times the track has been reposted.
 * @property {string} resource_type - The category of the resource.
 * @property {string} secret_token - A token required to access private or restricted tracks.
 * @property {string} sharing - Information regarding the sharing status or permissions.
 * @property {string} state - The current playback or availability state of the track.
 * @property {string} station_permalink - The permalink for the associated station.
 * @property {string} station_urn - The Uniform Resource Name for the associated station.
 * @property {boolean} streamable - Indicates if the track can be streamed.
 * @property {string} tag_list - A list of tags associated with the track.
 * @property {string} track_authorization - Authorization details for accessing the track.
 * @property {string} uri - The Uniform Resource Identifier for the track.
 * @property {string} urn - The Uniform Resource Name for the track.
 * @property {number} user_id - The unique identifier of the user who uploaded the track.
 * @property {string} visuals - Configuration data for track visuals.
 * @property {string} waveform_url - The URL of the track's waveform image.
 * @property {MediaObject} media - Object containing media and transcoding information.
 * @property {PublisherObject} publisher_metadata - Metadata regarding the track's publisher.
 * @property {UserObject} user - Information about the user who owns the track.
 * @property {number} _resource_id - Internal identifier for the resource.
 * @property {string} _resource_type - Internal type identifier for the resource.
 */

/**
 * @typedef {Object} MediaObject
 * @property {TranscodingObject[]} transcodings - An array of available audio transcoding formats.
 */

/**
 * @typedef {Object} TranscodingObject
 * @property {{ mime_type: string, protocol: string }} format - The MIME type and protocol of the audio format.
 * @property {number} duration - The duration of this specific transcoding in milliseconds.
 * @property {boolean} is_legacy_transcoding - Indicates if this is an older, legacy transcoding format.
 * @property {string} preset - The preset used to generate this transcoding.
 * @property {string} quality - The audio quality level of this transcoding.
 * @property {boolean} snipped - Indicates if this is a short preview or snippet.
 * @property {string} url - The direct URL to the transcoded audio file.
 */

/**
 * @typedef {Object} PublisherObject
 * @property {number} id - The unique identifier for the publisher.
 * @property {string} urn - The Uniform Resource Name for the publisher.
 * @property {string} artist - The name of the artist.
 * @property {string} publisher - The name of the publishing entity.
 * @property {string} writer_composer - The name of the writer or composer.
 */

/**
 * @typedef {Object} UserBadgesObject
 * @property {boolean} creator_mid_tier - Indicates if the user has mid-tier creator status.
 * @property {boolean} pro - Indicates if the user has a Pro subscription.
 * @property {boolean} pro_unlimited - Indicates if the user has an Unlimited subscription.
 * @property {boolean} verified - Indicates if the user's account is verified.
 */

/**
 * @typedef {Object} CreatorSubscriptionObject
 * @property {{ id: string }} product - An object containing the ID of the subscription product.
 */

/**
 * @typedef {Object} VisualsObject
 * @property {boolean} enabled - Indicates if the visualizer is enabled.
 * @property {boolean} tracking - Indicates if visualizer tracking is enabled.
 * @property {string} urn - The Uniform Resource Name for the visualizer.
 * @property {VisualsObjectData} visuals - The specific data for the visualizer.
 */

/**
 * @typedef {Object} VisualsObjectData
 * @property {number} entry_time - The timestamp when the visual element starts.
 * @property {string} urn - The Uniform Resource Name for the visual data.
 * @property {string} visual_url - The URL of the visual asset.
 */

/**
 * @typedef {Object} UserObject
 * @property {VisualsObject} visuals - Visualizer configuration for the user.
 * @property {CreatorSubscriptionObject} creator_subscription - The user's current subscription product.
 * @property {CreatorSubscriptionObject[]} creator_subscriptions - A list of all subscriptions held by the user.
 * @property {UserBadgesObject} badges - The badges and status indicators assigned to the user.
 * @property {string} avatar_url - The URL of the user's profile picture.
 * @property {string} city - The city where the user is located.
 * @property {number} comments_count - The total number of comments made by the user.
 * @property {string} country_code - The ISO country code of the user.
 * @property {string} created_at - ISO 8601 timestamp of when the user account was created.
 * @property {string} date_of_birth - The user's date of birth.
 * @property {string} description - The user's profile description.
 * @property {string} first_name - The user's first name.
 * @property {number} followers_count - The total number of followers the user has.
 * @property {number} followings_count - The total number of accounts the user follows.
 * @property {string} full_name - The user's complete name.
 * @property {number} groups_count - The total number of groups the user belongs to.
 * @property {number} id - The unique numerical identifier for the user.
 * @property {string} kind - The type of resource (e.g., 'user').
 * @property {string} last_modified - ISO 8601 timestamp of the last profile update.
 * @property {string} last_name - The user's last name.
 * @property {number} likes_count - The total number of likes the user has given.
 * @property {string} permalink - The unique profile slug for the user.
 * @property {string} permalink_url - The full URL of the user's profile.
 * @property {number} playlist_count - The total number of playlists created by the user.
 * @property {number} playlist_likes_count - The total number of playlists liked by the user.
 * @property {number} reposts_count - The total number of reposts made by the user.
 * @property {string} station_permalink - The permalink for the user's station.
 * @property {string} station_urn - The Uniform Resource Name for the user's station.
 * @property {number} track_count - The total number of tracks uploaded by the user.
 * @property {string} uri - The Uniform Resource Identifier for the user.
 * @property {string} urn - The Uniform Resource Name for the user.
 * @property {string} username - The user's unique username.
 * @property {boolean} verified - Indicates if the user's account is verified.
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
  /** @type {SoundObject[]} */
  #sounds = [];
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
   * @param {(soundsData: Partial<SoundObject>[]) => void} callback - Receives the list of sounds.
   */
  getSounds(callback) {
    callback(this.#sounds);
  }

  /**
   * @param {(soundData: Partial<SoundObject>) => void} callback - Receives the current sound object.
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
   * @param {any} data
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
