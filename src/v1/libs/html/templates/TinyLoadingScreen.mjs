/**
 * Represents the possible states of the loading screen.
 * - `'none'` → Not visible
 * - `'fadeIn'` → Appearing with fade-in animation
 * - `'active'` → Fully visible and active
 * - `'fadeOut'` → Disappearing with fade-out animation
 * @typedef {'none'|'active'|'fadeIn'|'fadeOut'} LoadingStatus
 */

/**
 * Configuration options for the loading screen.
 * @typedef {Object} LoadingSettings
 * @property {number|null} fadeIn - Duration of fade-in animation in milliseconds, or `null` to disable.
 * @property {number|null} fadeOut - Duration of fade-out animation in milliseconds, or `null` to disable.
 * @property {number} zIndex - CSS z-index of the overlay element.
 */

/**
 * TinyLoadingScreen
 *
 * A lightweight, fully-configurable loading overlay component that can be appended to any HTMLElement.
 *
 * Key features:
 * - Configurable fadeIn/fadeOut durations (milliseconds) and zIndex.
 * - Accepts string or HTMLElement messages.
 * - Optionally allows HTML inside string messages when `allowHtmlText` is enabled.
 * - Exposes `overlay`, `messageElement`, `status`, `options` and helpers for testing and integration.
 *
 * @class
 */
class TinyLoadingScreen {
  /** @type {HTMLDivElement|null} Overlay container element */
  #overlay = null;

  /** @returns {HTMLDivElement|null} The overlay element if active, otherwise `null`. */
  get overlay() {
    return this.#overlay;
  }

  /** @type {HTMLDivElement|null} Element containing the loading message */
  #messageElement = null;

  /** @returns {HTMLDivElement|null} The element used to render the message, or `null` if inactive. */
  get messageElement() {
    return this.#messageElement;
  }

  /** @type {HTMLElement} Container where the overlay will be attached */
  #container;

  /** @returns {HTMLElement} The container element that holds the overlay. */
  get container() {
    return this.#container;
  }

  /** @type {LoadingSettings} Internal configuration */
  #options = { fadeIn: null, fadeOut: null, zIndex: 9999 };

  /** @returns {LoadingSettings} A copy of the current configuration options. */
  get options() {
    return { ...this.#options };
  }

  /**
   * Updates the loading screen options.
   * @param {Partial<LoadingSettings>} value - New configuration values.
   * @throws {TypeError} If any option has an invalid type or value.
   */
  set options(value) {
    if (typeof value !== 'object' || value === null)
      throw new TypeError('options must be an object');
    if (
      typeof value.fadeIn !== 'undefined' &&
      value.fadeIn !== null &&
      (typeof value.fadeIn !== 'number' || value.fadeIn < 0)
    )
      throw new TypeError('fadeIn must be a non-negative number or null');
    if (
      typeof value.fadeOut !== 'undefined' &&
      value.fadeOut !== null &&
      (typeof value.fadeOut !== 'number' || value.fadeOut < 0)
    )
      throw new TypeError('fadeOut must be a non-negative number or null');
    if (
      typeof value.zIndex !== 'undefined' &&
      (typeof value.zIndex !== 'number' || !Number.isInteger(value.zIndex))
    )
      throw new TypeError('zIndex must be an integer number');

    this.#options = {
      fadeIn: value.fadeIn ?? null,
      fadeOut: value.fadeOut ?? null,
      zIndex: value.zIndex ?? 9999,
    };
  }

  /** @type {LoadingStatus} Current status of the loading screen */
  #status = 'none';

  /** @returns {LoadingStatus} The current loading screen status. */
  get status() {
    return this.#status;
  }

  /** @type {string|HTMLElement} Default message shown when no custom message is provided */
  #defaultMessage = '';

  /** @returns {string|HTMLElement} The default message. */
  get defaultMessage() {
    return this.#defaultMessage;
  }

  /**
   * @param {string|HTMLElement} value - New default message.
   * @throws {TypeError} If the value is neither a string nor an HTMLElement.
   */
  set defaultMessage(value) {
    if (typeof value !== 'string' && !(value instanceof HTMLElement))
      throw new TypeError('defaultMessage must be a string or an HTMLElement');
    this.#defaultMessage = value;
  }

  /** @type {string|HTMLElement|null} Current active message */
  #message = null;

  /** @returns {string|HTMLElement|null} The currently displayed message. */
  get message() {
    return this.#message;
  }

  /** @type {boolean} Whether HTML is allowed in string messages */
  #allowHtmlText = false;

  /** @returns {boolean} True if HTML is allowed inside string messages. */
  get allowHtmlText() {
    return this.#allowHtmlText;
  }

  /**
   * Enables or disables HTML rendering in string messages.
   * @param {boolean} value - Whether to allow HTML.
   * @throws {TypeError} If value is not a boolean.
   */
  set allowHtmlText(value) {
    if (typeof value !== 'boolean') throw new TypeError('allowHtmlText must be a boolean');
    this.#allowHtmlText = value;
  }

  /** @type {NodeJS.Timeout|null} Timeout handler for fadeIn */
  #fadeInTimeout = null;

  /** @returns {boolean} Whether a fadeIn timeout is currently pending. */
  get fadeInTimeout() {
    return this.#fadeInTimeout !== null;
  }

  /** @type {NodeJS.Timeout|null} Timeout handler for fadeOut */
  #fadeOutTimeout = null;

  /** @returns {boolean} Whether a fadeOut timeout is currently pending. */
  get fadeOutTimeout() {
    return this.#fadeOutTimeout !== null;
  }

  /** @returns {boolean} True if the overlay is currently visible. */
  get visible() {
    return !!this.#overlay;
  }

  /**
   * Optional callback fired whenever the loading screen status changes.
   * @type {((status: LoadingStatus) => void) | null}
   */
  #onChange = null;

  /**
   * Returns the current status-change callback.
   * @returns {((status: LoadingStatus) => void) | null}
   */
  get onChange() {
    return this.#onChange;
  }

  /**
   * Sets the status-change callback.
   * @param {((status: LoadingStatus) => void) | null} value
   * @throws {TypeError} If value is neither a function nor null.
   */
  set onChange(value) {
    if (value !== null && typeof value !== 'function') {
      throw new TypeError('onChange must be a function or null');
    }
    this.#onChange = value;
  }

  /**
   * Internal helper to emit the onChange callback.
   * @private
   */
  _emitChange() {
    if (typeof this.#onChange === 'function') this.#onChange(this.#status);
  }

  /**
   * Creates a new TinyLoadingScreen instance.
   * @param {HTMLElement} [container=document.body] - The container element where the overlay should be appended.
   * @throws {TypeError} If container is not an HTMLElement.
   */
  constructor(container = document.body) {
    if (!(container instanceof HTMLElement))
      throw new TypeError('container must be an HTMLElement');
    this.#container = container;
  }

  /**
   * Internal helper to update the displayed message.
   * @param {string|HTMLElement} [message=this.#defaultMessage] - The new message.
   * @throws {TypeError} If the message is not a string or HTMLElement.
   * @throws {Error} If trying to use HTMLElement without allowHtmlText enabled.
   * @private
   */
  _updateMessage(message = this.#defaultMessage) {
    if (!this.#messageElement) throw new Error('messageElement is not initialized');
    if (typeof message !== 'string' && !(message instanceof HTMLElement))
      throw new TypeError('message must be a string or an HTMLElement');

    this.#message = message;

    if (typeof message === 'string') {
      if (!this.#allowHtmlText) this.#messageElement.textContent = message;
      else this.#messageElement.innerHTML = message;
    } else {
      if (!this.#allowHtmlText)
        throw new Error('HTMLElement messages require allowHtmlText = true');
      this.#messageElement.textContent = '';
      this.#messageElement.appendChild(message);
    }
  }

  /**
   * Removes all status-related CSS classes (`active`, `fadeIn`, `fadeOut`)
   * from the overlay element, if it exists.
   *
   * @private
   * @returns {void}
   */
  _removeOldClasses() {
    this.#overlay?.classList.remove('active');
    this.#overlay?.classList.remove('fadeIn');
    this.#overlay?.classList.remove('fadeOut');
  }

  /**
   * Starts the loading screen or updates its message if already active.
   * @param {string|HTMLElement} [message=this.#defaultMessage] - Message to display.
   * @returns {boolean} `true` if the overlay was created, `false` if only the message was updated.
   * @throws {TypeError} If message is not a string or HTMLElement.
   */
  start(message = this.#defaultMessage) {
    if (typeof message !== 'string' && !(message instanceof HTMLElement))
      throw new TypeError('message must be a string or an HTMLElement');

    if (!this.#overlay) {
      this.#overlay = document.createElement('div');
      this.#overlay.classList.add('loading-overlay');
      this.#overlay.style.zIndex = String(this.#options.zIndex);

      const contentBase = document.createElement('div');
      contentBase.classList.add('loading-container');

      const content = document.createElement('div');
      content.classList.add('loading-content');

      const spinner = document.createElement('div');
      spinner.classList.add('loading-spinner');

      this.#messageElement = document.createElement('div');
      this.#messageElement.classList.add('loading-message');

      content.appendChild(spinner);
      content.appendChild(this.#messageElement);
      contentBase.appendChild(content);
      this.#overlay.appendChild(contentBase);
      this.#container.appendChild(this.#overlay);

      // trigger fade in
      this._removeOldClasses();
      this.#status = 'fadeIn';
      this.#overlay.classList.add('fadeIn');
      this._emitChange();
      const fadeIn = () => {
        this._removeOldClasses();
        this.#fadeInTimeout = null;
        this.#status = 'active';
        this.#overlay?.classList.add('active');
        this._emitChange();
      };

      if (typeof this.#options.fadeIn === 'number') {
        if (this.#fadeInTimeout) clearTimeout(this.#fadeInTimeout);
        this.#fadeInTimeout = setTimeout(fadeIn, this.#options.fadeIn);
      } else fadeIn();

      this._updateMessage(message);
      return true;
    }

    if (this.#messageElement) this._updateMessage(message);
    return false;
  }

  /**
   * Updates the loading screen with a new message.
   * @param {string|HTMLElement} [message=this.#defaultMessage] - The new message.
   * @returns {boolean} `true` if the message was updated, `false` if overlay is not active.
   * @throws {TypeError} If message is not a string or HTMLElement.
   */
  update(message = this.#defaultMessage) {
    if (typeof message !== 'string' && !(message instanceof HTMLElement))
      throw new TypeError('message must be a string or an HTMLElement');

    if (this.#messageElement) {
      this._updateMessage(message);
      return true;
    }
    return false;
  }

  /**
   * Stops and removes the loading screen.
   * @returns {boolean} `true` if the overlay was removed, `false` if not active.
   */
  stop() {
    if (this.#overlay) {
      this._removeOldClasses();
      this.#status = 'fadeOut';
      this.#overlay.classList.add('fadeOut');
      this._emitChange();

      // trigger fade out
      const fadeOut = () => {
        this._removeOldClasses();
        this.#fadeOutTimeout = null;
        this.#status = 'none';
        this.#overlay?.remove();
        this.#overlay = null;
        this.#messageElement = null;
        this.#message = null;
        this._emitChange();
      };

      if (typeof this.#options.fadeOut === 'number') {
        if (this.#fadeOutTimeout) clearTimeout(this.#fadeOutTimeout);
        this.#fadeOutTimeout = setTimeout(fadeOut, this.#options.fadeOut);
      } else fadeOut();

      return true;
    }
    return false;
  }
}

export default TinyLoadingScreen;
