import { safeTextTrim } from '../../../basics/text.mjs';

/**
 * A utility class to manage browser notifications with sound and custom behavior.
 * Useful for triggering system notifications with optional sound, avatar icon, body truncation, and click actions.
 *
 * @class
 */
class TinyNotifications {
  /** @type {boolean} Whether notifications are currently allowed by the user. */
  #allowed = false;

  /** @type {boolean} Indicates whether the user has already requested permission at least once. */
  #permissionRequested = false;

  /** @type {HTMLAudioElement|null} Audio element to play when a notification is triggered. */
  #audio = null;

  /** @type {number} Maximum number of characters in the notification body. */
  #bodyLimit = 100;

  /** @type {string|null} Default avatar icon URL for notifications. */
  #defaultIcon = null;

  /** @type {(this: Notification, evt: Event) => any} Default handler when a notification is clicked. */
  #defaultOnClick;

  /**
   * Constructs a new instance of TinyNotifications.
   *
   * @param {Object} [settings={}] - Optional settings to initialize the notification manager.
   * @param {string|HTMLAudioElement|null} [settings.audio] - Path or URL to the audio file for notification sounds.
   * @param {string|null} [settings.defaultIcon] - Default icon URL to be used in notifications.
   * @param {number} [settings.bodyLimit=100] - Maximum number of characters allowed in the notification body.
   * @param {(this: Notification, evt: Event) => any} [settings.defaultOnClick] - Default function to execute when a notification is clicked.
   * @throws {TypeError} If any of the parameters are of an invalid type.
   */
  constructor({
    audio = null,
    defaultIcon = null,
    bodyLimit = 100,
    defaultOnClick = function (event) {
      event.preventDefault();
      if (window.focus) window.focus();
      this.close();
    },
  } = {}) {
    if (!(audio instanceof HTMLAudioElement) && typeof audio !== 'string' && audio !== null)
      throw new TypeError('audio must be an instance of HTMLAudioElement or null.');
    if (defaultIcon !== null && typeof defaultIcon !== 'string')
      throw new TypeError('defaultIcon must be a string or null.');
    if (!Number.isFinite(bodyLimit) || bodyLimit < 0)
      throw new TypeError('bodyLimit must be a non-negative number.');
    if (typeof defaultOnClick !== 'function')
      throw new TypeError('defaultOnClick must be a function.');

    this.#audio = typeof audio !== 'string' ? audio : new Audio(audio);
    this.#defaultIcon = defaultIcon;
    this.#bodyLimit = bodyLimit;
    this.#defaultOnClick = defaultOnClick;
  }

  /**
   * Requests permission from the user to show notifications.
   * Updates the internal `#allowed` flag.
   *
   * @returns {Promise<boolean>} Resolves to `true` if permission is granted, otherwise `false`.
   */
  requestPerm() {
    const tinyThis = this;
    return new Promise((resolve, reject) => {
      if (tinyThis.isCompatible()) {
        if (Notification.permission === 'default') {
          Notification.requestPermission()
            .then((permission) => {
              this.#permissionRequested = true;
              tinyThis.#allowed = permission === 'granted';
              resolve(tinyThis.#allowed);
            })
            .catch(reject);
        } else {
          this.#permissionRequested = true;
          tinyThis.#allowed = Notification.permission === 'granted';
          resolve(tinyThis.#allowed);
        }
      } else {
        this.#permissionRequested = true;
        tinyThis.#allowed = false;
        resolve(false);
      }
    });
  }

  /**
   * Checks if the Notification API is supported by the current browser.
   *
   * @returns {boolean} Returns `true` if notifications are supported, otherwise `false`.
   */
  isCompatible() {
    return 'Notification' in window;
  }

  /**
   * Sends a browser notification with the provided title and configuration.
   * Truncates the body if necessary and plays a sound if configured.
   *
   * @param {string} title - The title of the notification.
   * @param {NotificationOptions & { vibrate?: number[] }} [config={}] - Optional configuration for the notification.
   * @returns {Notification|null} The created `Notification` instance, or `null` if permission is not granted.
   * @throws {TypeError} If the title is not a string or config is not a valid object.
   */
  send(title, config = {}) {
    if (!this.#permissionRequested)
      throw new Error('You must call requestPerm() before sending a notification.');
    if (typeof title !== 'string') throw new TypeError('title must be a string.');
    if (typeof config !== 'object' || config === null)
      throw new TypeError('config must be a non-null object.');

    if (!this.#allowed) return null;

    const { icon = this.#defaultIcon || undefined, vibrate = [200, 100, 200] } = config;
    const options = { ...config };
    if (typeof icon === 'string') options.icon = icon;
    if (Array.isArray(vibrate)) options.vibrate = vibrate;

    if (typeof options.body === 'string')
      options.body = safeTextTrim(options.body, this.#bodyLimit);

    const notification = new Notification(title, options);
    notification.addEventListener('show', () => {
      if (!(this.#audio instanceof HTMLAudioElement)) return;
      this.#audio.currentTime = 0;
      this.#audio.play().catch((err) => console.error(err));
    });

    if (typeof this.#defaultOnClick === 'function')
      notification.addEventListener('click', this.#defaultOnClick);

    return notification;
  }

  // === Getters and Setters ===

  /**
   * Whether the requestPerm() method was already called.
   * @returns {boolean}
   */
  wasPermissionRequested() {
    return this.#permissionRequested;
  }

  /**
   * Returns the current permission status.
   * @returns {boolean} `true` if permission was granted, otherwise `false`.
   */
  isAllowed() {
    return this.#allowed;
  }

  /**
   * Gets the current notification audio.
   * @returns {HTMLAudioElement|null} The sound element, or `null` if not set.
   */
  getAudio() {
    return this.#audio;
  }

  /**
   * Sets the audio element used for notification sounds.
   * @param {HTMLAudioElement|string|null} value - A valid `HTMLAudioElement` or `null` to disable sound.
   * @throws {TypeError} If the value is not an `HTMLAudioElement` or `null`.
   */
  setAudio(value) {
    if (!(value instanceof HTMLAudioElement) && typeof value !== 'string' && value !== null)
      throw new TypeError('sound must be an instance of HTMLAudioElement or null.');
    this.#audio = typeof value !== 'string' ? value : new Audio(value);
  }

  /**
   * Gets the maximum length of the notification body text.
   * @returns {number} Number of characters allowed.
   */
  getBodyLimit() {
    return this.#bodyLimit;
  }

  /**
   * Sets the maximum number of characters allowed in the notification body.
   * @param {number} value - A non-negative integer.
   * @throws {TypeError} If the value is not a valid non-negative number.
   */
  setBodyLimit(value) {
    if (!Number.isFinite(value) || value < 0)
      throw new TypeError('bodyLimit must be a non-negative number.');
    this.#bodyLimit = value;
  }

  /**
   * Gets the default avatar icon URL.
   * @returns {string|null} The URL string or `null`.
   */
  getDefaultAvatar() {
    return this.#defaultIcon;
  }

  /**
   * Sets the default avatar icon URL.
   * @param {string|null} value - A string URL or `null` to disable default icon.
   * @throws {TypeError} If the value is not a string or `null`.
   */
  setDefaultAvatar(value) {
    if (!(typeof value === 'string' || value === null))
      throw new TypeError('defaultIcon must be a string or null.');
    this.#defaultIcon = value;
  }

  /**
   * Gets the default click event handler for notifications.
   * @returns {(this: Notification, evt: Event) => any} The current click handler function.
   */
  getDefaultOnClick() {
    return this.#defaultOnClick;
  }

  /**
   * Sets the default click event handler for notifications.
   * @param {(this: Notification, evt: Event) => any} value - A function to handle the notification click event.
   * @throws {TypeError} If the value is not a function.
   */
  setDefaultOnClick(value) {
    if (typeof value !== 'function') throw new TypeError('defaultOnClick must be a function.');
    this.#defaultOnClick = value;
  }
}

export default TinyNotifications;
