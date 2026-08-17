import { createCheckDestroyed } from '../../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyToastNotify');

/**
 * A callback function used to manually close a notification.
 * Passed as a second argument to `onClick` handlers, allowing programmatic dismissal of the toast.
 *
 * @typedef {() => void} CloseToastFunc
 */

/**
 * Represents the data used to display a notification.
 * Can be a plain string (used as the message), or an object with more customization options.
 *
 * @typedef {string | {
 *   message: string, // The main message to display
 *   title?: string,  // Optional title to appear above the message
 *   onClick?: (event: MouseEvent, func: CloseToastFunc) => void, // Optional click handler for the notification
 *   html?: boolean,  // Whether the message should be interpreted as raw HTML
 *   avatar?: string  // Optional URL to an avatar image shown on the left
 * }} NotifyData
 */

/**
 * A lightweight notification system designed to display timed messages inside a container.
 * Supports positioning, timing customization, click actions, HTML content, and optional avatars.
 *
 * ## Features:
 * - Positioning via `x` (`left`, `center`, `right`) and `y` (`top`, `bottom`).
 * - Dynamic display time based on message length.
 * - Optional `title`, `avatar`, `onClick`, and `html` message rendering.
 * - Fade-out animation with customizable duration.
 * - Rigid validation of inputs and internal state.
 *
 * ## Customization via setters:
 * - `setX(position)` — horizontal alignment.
 * - `setY(position)` — vertical alignment.
 * - `setBaseDuration(ms)` — base visible time in milliseconds.
 * - `setExtraPerChar(ms)` — extra time added per character.
 * - `setFadeOutDuration(ms)` — fade-out animation duration in milliseconds.
 *
 * @class
 */
class TinyToastNotify {
  #y;
  #x;
  #baseDuration;
  #extraPerChar;
  #fadeOutDuration;

  /** @type {HTMLElement|null} */
  #container;

  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /**
   * @param {'top'|'bottom'} y - 'top' or 'bottom'
   * @param {'right'|'left'|'center'} x - 'right', 'left', or 'center'
   * @param {number} baseDuration - Base display time in ms
   * @param {number} extraPerChar - Extra ms per character
   * @param {number} fadeOutDuration - Time in ms for fade-out effect
   * @param {string} [selector='.notify-container'] - Base selector for container
   */
  constructor(
    y = 'top',
    x = 'right',
    baseDuration = 3000,
    extraPerChar = 50,
    fadeOutDuration = 300,
    selector = '.notify-container',
  ) {
    this.#validateY(y);
    this.#validateX(x);
    this.#validateTiming(baseDuration, 'baseDuration');
    this.#validateTiming(extraPerChar, 'extraPerChar');
    this.#validateTiming(fadeOutDuration, 'fadeOutDuration');

    this.#y = y;
    this.#x = x;
    this.#baseDuration = baseDuration;
    this.#extraPerChar = extraPerChar;
    this.#fadeOutDuration = fadeOutDuration;
    const container = document.querySelector(`${selector}.${y}.${x}`);

    if (!(container instanceof HTMLElement)) {
      this.#container = document.createElement('div');
      this.#container.className = `notify-container ${y} ${x}`;
      document.body.appendChild(this.#container);
    } else this.#container = container;
  }

  /**
   * Returns the notification container element.
   * Ensures that the container is a valid HTMLElement.
   *
   * @returns {HTMLElement} The notification container.
   * @throws {Error} If the container is not a valid HTMLElement.
   */
  getContainer() {
    checkDestroy(this.#destroyed);
    if (!(this.#container instanceof HTMLElement))
      throw new Error('Container is not a valid HTMLElement.');
    return this.#container;
  }

  /**
   * Validates the vertical position value.
   * Must be either 'top' or 'bottom'.
   *
   * @param {string} value - The vertical position to validate.
   * @throws {Error} If the value is not 'top' or 'bottom'.
   */
  #validateY(value) {
    if (!['top', 'bottom'].includes(value)) {
      throw new Error(`Invalid vertical direction "${value}". Expected "top" or "bottom".`);
    }
  }

  /**
   * Validates the horizontal position value.
   * Must be 'left', 'right', or 'center'.
   *
   * @param {string} value - The horizontal position to validate.
   * @throws {Error} If the value is not one of the accepted directions.
   */
  #validateX(value) {
    if (!['left', 'right', 'center'].includes(value)) {
      throw new Error(
        `Invalid horizontal position "${value}". Expected "left", "right" or "center".`,
      );
    }
  }

  /**
   * Validates a numeric timing value.
   * Must be a non-negative finite number.
   *
   * @param {number} value - The number to validate.
   * @param {string} name - The name of the parameter (used for error messaging).
   * @throws {Error} If the number is invalid.
   */
  #validateTiming(value, name) {
    if (typeof value !== 'number' || value < 0 || !Number.isFinite(value)) {
      throw new Error(
        `Invalid value for "${name}": ${value}. Must be a non-negative finite number.`,
      );
    }
  }

  /**
   * Returns the current vertical position.
   *
   * @returns {'top'|'bottom'} The vertical direction of the notification container.
   */
  getY() {
    checkDestroy(this.#destroyed);
    return this.#y;
  }

  /**
   * Sets the vertical position of the notification container.
   * Updates the container's class to reflect the new position.
   *
   * @param {'top'|'bottom'} value - The vertical direction to set.
   * @throws {Error} If the value is invalid.
   */
  setY(value) {
    checkDestroy(this.#destroyed);
    this.#validateY(value);
    const container = this.getContainer();
    container.classList.remove(this.#y);
    container.classList.add(value);

    this.#y = value;
  }

  /**
   * Returns the current horizontal position.
   *
   * @returns {'left'|'right'|'center'} The horizontal direction of the notification container.
   */
  getX() {
    checkDestroy(this.#destroyed);
    return this.#x;
  }

  /**
   * Sets the horizontal position of the notification container.
   * Updates the container's class to reflect the new position.
   *
   * @param {'left'|'right'|'center'} value - The horizontal direction to set.
   * @throws {Error} If the value is invalid.
   */
  setX(value) {
    checkDestroy(this.#destroyed);
    this.#validateX(value);
    const container = this.getContainer();
    container.classList.remove(this.#x);
    container.classList.add(value);

    this.#x = value;
  }

  /**
   * Returns the base duration for displaying the notification.
   *
   * @returns {number} Base time (in milliseconds) that a notification stays on screen.
   */
  getBaseDuration() {
    checkDestroy(this.#destroyed);
    return this.#baseDuration;
  }

  /**
   * Sets the base duration for the notification display time.
   *
   * @param {number} value - Base display time in milliseconds.
   * @throws {Error} If the value is not a valid non-negative finite number.
   */
  setBaseDuration(value) {
    checkDestroy(this.#destroyed);
    this.#validateTiming(value, 'baseDuration');
    this.#baseDuration = value;
  }

  /**
   * Returns the extra display time added per character.
   *
   * @returns {number} Extra time (in milliseconds) per character in the notification.
   */
  getExtraPerChar() {
    checkDestroy(this.#destroyed);
    return this.#extraPerChar;
  }

  /**
   * Sets the additional display time per character.
   *
   * @param {number} value - Extra time in milliseconds per character.
   * @throws {Error} If the value is not a valid non-negative finite number.
   */
  setExtraPerChar(value) {
    checkDestroy(this.#destroyed);
    this.#validateTiming(value, 'extraPerChar');
    this.#extraPerChar = value;
  }

  /**
   * Returns the fade-out duration.
   *
   * @returns {number} Time (in milliseconds) used for fade-out transition.
   */
  getFadeOutDuration() {
    checkDestroy(this.#destroyed);
    return this.#fadeOutDuration;
  }

  /**
   * Sets the fade-out transition time for notifications.
   *
   * @param {number} value - Fade-out duration in milliseconds.
   * @throws {Error} If the value is not a valid non-negative finite number.
   */
  setFadeOutDuration(value) {
    checkDestroy(this.#destroyed);
    this.#validateTiming(value, 'fadeOutDuration');
    this.#fadeOutDuration = value;
  }

  /**
   * Displays a notification for a time based on message length.
   * Accepts a string or an object with:
   * {
   *   message: string,
   *   title?: string,
   *   onClick?: function(MouseEvent, CloseToastFunc): void,
   *   html?: boolean,
   *   avatar?: string // Optional avatar image URL
   * }
   *
   * @param {NotifyData} data
   */
  show(data) {
    checkDestroy(this.#destroyed);
    let message = '';
    let title = '';
    let onClick = null;
    let useHTML = false;
    let avatarUrl = null;

    const notify = document.createElement('div');
    notify.className = 'notify enter';

    if (typeof data === 'string') {
      message = data;
    } else if (typeof data === 'object' && data !== null && typeof data.message === 'string') {
      message = data.message;
      title = typeof data.title === 'string' ? data.title : '';
      useHTML = data.html === true;
      avatarUrl = typeof data.avatar === 'string' ? data.avatar : null;

      if (data.onClick !== undefined) {
        if (typeof data.onClick !== 'function') {
          throw new Error('onClick must be a function if defined');
        }
        onClick = data.onClick;
        notify.classList.add('clickable');
      }
    } else {
      throw new Error(
        `Invalid argument for show(): expected string or { message: string, title?: string, onClick?: function, html?: boolean, avatar?: string }`,
      );
    }

    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.className = 'close';
    closeBtn.setAttribute('aria-label', 'Close');

    // Optional hover effect
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = 'var(--notify-close-color-hover)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = 'var(--notify-close-color)';
    });

    // Avatar
    if (avatarUrl) {
      const avatar = document.createElement('img');
      avatar.src = avatarUrl;
      avatar.alt = 'avatar';
      avatar.className = 'avatar';
      notify.appendChild(avatar);
    }

    // Title
    if (title) {
      const titleElem = document.createElement('strong');
      titleElem.textContent = title;
      titleElem.style.display = 'block';
      notify.appendChild(titleElem);
    }

    // Message
    if (useHTML) {
      const msgWrapper = document.createElement('div');
      msgWrapper.innerHTML = message;
      notify.appendChild(msgWrapper);
    } else {
      notify.appendChild(document.createTextNode(message));
    }

    notify.appendChild(closeBtn);
    this.getContainer().appendChild(notify);

    const visibleTime = this.#baseDuration + message.length * this.#extraPerChar;
    const totalTime = visibleTime + this.#fadeOutDuration;

    // Close logic
    let removed = false;
    const close = () => {
      if (removed) return;
      removed = true;
      notify.classList.remove('enter', 'show');
      notify.classList.add('exit');
      setTimeout(() => notify.remove(), this.#fadeOutDuration);
    };

    // Click handler
    if (typeof onClick === 'function') {
      notify.addEventListener('click', (e) => {
        if (e.target === closeBtn) return;
        onClick(e, close);
      });
    }

    // Close button click
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      close();
    });

    // Transition activation force soon after the element is added
    setTimeout(() => {
      notify.classList.remove('enter');
      notify.classList.add('show');
    }, 1);

    setTimeout(() => close(), totalTime);
  }

  /**
   * Destroys the notification container and removes all active notifications.
   * This should be called when the notification system is no longer needed,
   * such as when unloading a page or switching views in a single-page app.
   *
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    if (!(this.#container instanceof HTMLElement)) return;

    // Remove all child notifications
    this.#container.querySelectorAll('.notify').forEach((el) => el.remove());

    // Remove the container itself from the DOM
    if (this.#container.parentNode) {
      this.#container.parentNode.removeChild(this.#container);
    }

    // Optional: Clean internal references (safe practice)
    this.#container = null;

    // Lock the instance
    this.#destroyed = true;
  }
}

export default TinyToastNotify;
