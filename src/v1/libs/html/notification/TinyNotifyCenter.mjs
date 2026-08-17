import { createCheckDestroyed } from '../../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyNotifyCenter');

/**
 * Represents a single notification entry.
 *
 * A notification can be provided as a simple string (treated as a plain message),
 * or as an object with additional data such as a title, an avatar image, and a click handler.
 *
 * @typedef {string | {
 *   title?: string,              // Optional title displayed above the message
 *   message: string,             // Required message content
 *   avatar?: string,             // Optional avatar image URL (displayed on the left)
 *   onClick?: (e: MouseEvent) => void // Optional click handler for the entire notification
 * }} NotifyData
 */

/**
 * A notification center component for displaying interactive alerts in the UI.
 *
 * This class renders a notification overlay on the page and allows dynamically
 * adding, clearing, or interacting with notification items. Notifications can
 * contain plain text or HTML, and optionally support click events, titles, and avatars.
 *
 * Features:
 * - Dynamic rendering of notification UI with `insertTemplate()`
 * - Supports text and HTML content modes
 * - Optional avatars for each notification
 * - Callback support on notification click
 * - Per-notification close buttons
 * - Notification count badge
 *
 * @class
 */
class TinyNotifyCenter {
  /**
   * Returns the full HTML structure for the notification system as a string.
   *
   * This includes:
   * - A hidden `.notify-overlay` containing the central notification panel (`#notifCenter`),
   *   which has a header with a "Notifications" label, a "clear all" button, and a close button.
   * - A `.list` container for dynamically added notifications.
   * - A bell button (`.notify-bell`) to toggle the notification center, with an embedded badge.
   *
   * This template can be inserted into the DOM using `insertAdjacentHTML()` or parsed dynamically
   * into elements using JavaScript or jQuery, depending on the needs of the system.
   *
   * @returns {string} The complete HTML structure for the notification center.
   */
  static getTemplate() {
    return `
<div class="notify-overlay hidden">
  <div class="notify-center" id="notifCenter">
    <div class="header">
      <div>Notifications</div>
      <div class="options">
        <button class="clear-all" type="button">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="currentColor"
          >
            <path
              d="M21.6 2.4a1 1 0 0 0-1.4 0L13 9.6l-1.3-1.3a1 1 0 0 0-1.4 0L3 15.6a1 1 0 0 0 0 1.4l4 4a1 1 0 0 0 1.4 0l7.3-7.3a1 1 0 0 0 0-1.4l-1.3-1.3 7.2-7.2a1 1 0 0 0 0-1.4zM6 17l3.5-3.5 1.5 1.5L7.5 18.5 6 17z"
            />
          </svg>
        </button>
        <button class="close">×</button>
      </div>
    </div>
    <div class="list"></div>
  </div>
</div>

<button class="notify-bell" aria-label="Open notifications">
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    fill="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      d="M12 2C10.3 2 9 3.3 9 5v1.1C6.7 7.2 5 9.4 5 12v5l-1 1v1h16v-1l-1-1v-5c0-2.6-1.7-4.8-4-5.9V5c0-1.7-1.3-3-3-3zm0 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2z"
    />
  </svg>
  <span class="badge" id="notifBadge">0</span>
</button>
    `;
  }

  /**
   * Inserts the full notification center template into the document body.
   *
   * The structure is injected directly into the DOM using
   * `insertAdjacentHTML`.
   *
   * The `where` parameter allows control over where inside the `document.body`
   * the HTML is inserted:
   * - `'afterbegin'` (default): Inserts right after the opening <body> tag.
   * - `'beforeend'`: Inserts right before the closing </body> tag.
   * - Any valid position accepted by `insertAdjacentHTML`.
   *
   * @param {'beforebegin'|'afterbegin'|'beforeend'|'afterend'} [where='afterbegin']
   * The position relative to `document.body` where the HTML should be inserted.
   */
  static insertTemplate(where = 'afterbegin') {
    document.body.insertAdjacentHTML(where, TinyNotifyCenter.getTemplate());
  }

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

  /** @type {HTMLElement} */
  #center;
  /** @type {HTMLElement} */
  #list;
  /** @type {HTMLElement} */
  #badge;
  /** @type {HTMLElement} */
  #button;
  /** @type {HTMLElement} */
  #overlay;

  #count = 0;
  #maxCount = 99;
  #removeDelay = 300;
  #markAllAsReadOnClose = false;
  #modes = new WeakMap();

  /** @param {HTMLElement|ChildNode} item */
  #removeItem(item) {
    this.#modes.delete(item);
    if (item instanceof HTMLElement) {
      item.classList.add('removing');

      setTimeout(() => {
        this.markAsRead(item);
        item.remove();
      }, this.#removeDelay);
    } else throw new Error('Invalid HTMLElement to clear.');
  }

  /**
   * Update notify count and badge.
   * @param {number} value
   */
  #updateCount(value) {
    this.#count = Math.max(0, value);
    this.#badge.setAttribute('data-value', String(this.#count));
    this.#badge.textContent =
      this.#count > this.#maxCount ? `${this.#maxCount}+` : String(this.#count);
  }

  /**
   * Options for configuring the NotificationCenter instance.
   *
   * Allows manual specification of the main elements used by the notification center.
   * If not provided, default elements will be selected from the DOM automatically.
   *
   * @param {Object} options - Configuration object.
   * @param {HTMLElement} [options.center=document.getElementById('notifCenter')] - The container element that holds the list of notifications.
   * @param {HTMLElement} [options.badge=document.getElementById('notifBadge')] - The badge element used to display the current notification count.
   * @param {HTMLElement} [options.button=document.querySelector('.notify-bell')] - The button element that toggles the notification center.
   * @param {HTMLElement} [options.overlay=document.querySelector('.notify-overlay')] - The overlay element that covers the screen when the center is visible.
   */
  constructor(options = {}) {
    const {
      center = document.getElementById('notifCenter'),
      badge = document.getElementById('notifBadge'),
      button = document.querySelector('.notify-bell'),
      overlay = document.querySelector('.notify-overlay'),
    } = options;

    // Element existence and type validation
    if (!(center instanceof HTMLElement))
      throw new Error(`NotificationCenter: "center" must be an HTMLElement. Got: ${center}`);
    if (!(overlay instanceof HTMLElement))
      throw new Error(`NotificationCenter: "overlay" must be an HTMLElement. Got: ${overlay}`);
    if (!(badge instanceof HTMLElement))
      throw new Error(`NotificationCenter: "badge" must be an HTMLElement. Got: ${badge}`);
    if (!(button instanceof HTMLElement))
      throw new Error(`NotificationCenter: "button" must be an HTMLElement. Got: ${button}`);

    const clearAllBtn = center?.querySelector('.clear-all');
    const list = center?.querySelector('.list') ?? null;
    if (!(list instanceof HTMLElement))
      throw new Error(
        `NotificationCenter: ".list" inside center must be an HTMLElement. Got: ${list}`,
      );

    this.#center = center;
    this.#list = list;
    this.#badge = badge;
    this.#button = button;
    this.#overlay = overlay;

    this.#button.addEventListener('click', () => this.toggle());
    this.#center.querySelector('.close')?.addEventListener('click', () => this.close());
    if (clearAllBtn) clearAllBtn.addEventListener('click', () => this.clear());
    this.#overlay.addEventListener('click', (e) => {
      if (e.target === this.#overlay) this.close();
    });
  }

  /**
   * Enable or disable automatic mark-as-read on close.
   * @param {boolean} value
   */
  setMarkAllAsReadOnClose(value) {
    checkDestroy(this.#destroyed);
    if (typeof value !== 'boolean')
      throw new TypeError(`Expected boolean for markAllAsReadOnClose, got ${typeof value}`);
    this.#markAllAsReadOnClose = value;
  }

  /**
   * Define how long the remove animation takes (in ms).
   * @param {number} ms
   */
  setRemoveDelay(ms) {
    checkDestroy(this.#destroyed);
    if (typeof ms !== 'number') throw new Error(`NotificationCenter: "ms" must be an number.`);
    this.#removeDelay = ms;
  }

  /**
   * Get rendering mode ('text' or 'html') by index.
   * @param {number} index
   * @returns {'text' | 'html' | null}
   */
  getItemMode(index) {
    checkDestroy(this.#destroyed);
    const item = this.getItem(index);
    return item ? this.#modes.get(item) : null;
  }

  /**
   * Get a notify element by index.
   * @param {number} index
   * @returns {HTMLElement}
   */
  getItem(index) {
    checkDestroy(this.#destroyed);
    const element = this.#list.children.item(index);
    if (!(element instanceof HTMLElement))
      throw new Error(`NotificationCenter: "item" must be an HTMLElement. Got: ${element}`);
    return element;
  }

  /**
   * Check if a notify exists at the given index.
   * @param {number} index
   * @returns {boolean}
   */
  hasItem(index) {
    checkDestroy(this.#destroyed);
    return index >= 0 && index < this.#list.children.length;
  }

  /**
   * Mark a notification index as read.
   * @param {number|HTMLElement} index
   */
  markAsRead(index) {
    checkDestroy(this.#destroyed);
    const item = index instanceof HTMLElement ? index : this.getItem(index);
    if (item.classList.contains('unread')) {
      item.classList.remove('unread');
      this.#updateCount(this.#count - 1);
    }
  }

  /**
   * Add a new notify to the center.
   *
   * @param {NotifyData} message - Notification content or a full object with title, avatar, and callback.
   * @param {'text'|'html'} [mode='text'] - How to treat the message content.
   */
  add(message, mode = 'text') {
    checkDestroy(this.#destroyed);
    const item = document.createElement('div');
    item.className = 'item unread';

    let titleText = null;
    let messageText = null;
    let avatarUrl = null;
    let onClick = null;

    if (typeof message === 'object' && message !== null) {
      titleText = message.title;
      messageText = message.message;
      avatarUrl = message.avatar;
      onClick = message.onClick;
    } else {
      messageText = message;
    }

    // Optional avatar
    if (avatarUrl) {
      const avatarElem = document.createElement('div');
      avatarElem.className = 'avatar';
      avatarElem.style.backgroundImage = `url("${avatarUrl}")`;
      item.appendChild(avatarElem);
    }

    // Content wrapper
    const contentWrapper = document.createElement('div');
    contentWrapper.className = 'content';

    // Optional title
    if (titleText) {
      const titleElem = document.createElement('div');
      titleElem.className = 'title';
      titleElem.textContent = titleText;
      contentWrapper.appendChild(titleElem);
    }

    // Message
    const messageElem = document.createElement('div');
    messageElem.className = 'message';

    if (mode === 'html') {
      messageElem.innerHTML = messageText;
    } else {
      messageElem.textContent = messageText;
    }

    contentWrapper.appendChild(messageElem);

    // Action by clicking (if provided)
    if (typeof onClick === 'function') {
      item.classList.add('clickable');
      item.addEventListener('click', (e) => {
        // Prevents the close button from clicking
        if (e.target instanceof HTMLElement && !e.target.closest('.notify-close')) {
          onClick(e);
        }
      });
    }

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'notify-close';
    closeBtn.setAttribute('type', 'button');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // prevents propagation for the main onClick
      this.#removeItem(item);
    });

    item.append(contentWrapper, closeBtn);
    this.#list.prepend(item);
    this.#modes.set(item, mode);
    this.#updateCount(this.#count + 1);
  }

  /**
   * Remove a notify by index.
   * @param {number} index
   */
  remove(index) {
    checkDestroy(this.#destroyed);
    const item = this.getItem(index);
    this.#removeItem(item);
  }

  /**
   * Clear all notifications safely.
   */
  clear() {
    checkDestroy(this.#destroyed);
    let needAgain = true;
    while (needAgain) {
      needAgain = false;
      const items = Array.from(this.#list.children);
      for (const item of items) {
        if (item instanceof HTMLElement && !item.classList.contains('removing')) {
          this.#removeItem(item);
          needAgain = true;
        }
      }
    }
  }

  /**
   * Open the notify center.
   */
  open() {
    checkDestroy(this.#destroyed);
    this.#overlay.classList.remove('hidden');
    this.#center.classList.add('open');
  }

  /**
   * Close the notify center.
   */
  close() {
    checkDestroy(this.#destroyed);
    this.#overlay.classList.add('hidden');
    this.#center.classList.remove('open');
    if (this.#markAllAsReadOnClose) {
      const items = this.#list.querySelectorAll('.item.unread');
      for (const item of items) {
        if (item instanceof HTMLElement) this.markAsRead(item);
      }
    }
  }

  /**
   * Toggle open/close state.
   */
  toggle() {
    checkDestroy(this.#destroyed);
    if (this.#center.classList.contains('open')) this.close();
    else this.open();
  }

  /**
   * Recalculate the number of notifications based on the actual DOM list.
   */
  recount() {
    checkDestroy(this.#destroyed);
    const count = this.#list.querySelectorAll('.item.unread').length;
    this.#updateCount(count);
  }

  /**
   * Get current count.
   * @returns {number}
   */
  get count() {
    return this.#count;
  }

  /**
   * Destroys the notification center instance, removing all event listeners,
   * clearing notifications, and optionally removing DOM elements.
   *
   * Call this when the notification center is no longer needed to prevent memory leaks.
   *
   * @returns {void}
   */
  destroy() {
    if (this.#destroyed) return;
    // Remove event listeners
    this.#button?.removeEventListener('click', this.toggle);
    this.#center?.querySelector('.close')?.removeEventListener('click', this.close);
    this.#center?.querySelector('.clear-all')?.removeEventListener('click', this.clear);
    this.#overlay?.removeEventListener('click', this.close);

    // Clear all notifications
    this.clear();

    this.#center?.remove();
    this.#overlay?.remove();
    this.#button?.remove();

    // Clean internal references
    // this.#center = null;
    // this.#list = null;
    // this.#badge = null;
    // this.#button = null;
    // this.#overlay = null;
    this.#count = 0;
    this.#modes = new WeakMap();

    // Lock the instance
    this.#destroyed = true;
  }
}

export default TinyNotifyCenter;
