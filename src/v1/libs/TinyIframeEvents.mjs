import { isJsonObject } from '../basics/objChecker.mjs';
import TinyEvents from './TinyEvents.mjs';

/** @type {WeakMap<Window, TinyIframeEvents>} */
const instances = new WeakMap();

/**
 * @callback handler
 * A function to handle incoming event payloads.
 * @param {any} payload - The data sent by the emitter.
 * @param {MessageEvent<any>} event - Metadata about the message.
 */

/**
 * A flexible event routing system for structured communication
 * between a parent window and its iframe using `postMessage`.
 *
 * This class abstracts the complexity of cross-origin and window-type handling,
 * allowing both the iframe and parent to:
 * - Send events with arbitrary payloads
 * - Listen to specific event names
 * - Filter events by origin and source
 * - Work symmetrically from both sides with automatic direction handling
 *
 * Use this class when building applications that require modular, event-driven
 * communication across embedded frames.
 */
class TinyIframeEvents {
  #events = new TinyEvents();

  /**
   * Enables or disables throwing an error when the maximum number of listeners is exceeded.
   *
   * @param {boolean} shouldThrow - If true, an error will be thrown when the max is exceeded.
   */
  setThrowOnMaxListeners(shouldThrow) {
    return this.#events.setThrowOnMaxListeners(shouldThrow);
  }

  /**
   * Checks whether an error will be thrown when the max listener limit is exceeded.
   *
   * @returns {boolean} True if an error will be thrown, false if only a warning is shown.
   */
  getThrowOnMaxListeners() {
    return this.#events.getThrowOnMaxListeners();
  }

  /////////////////////////////////////////////////////////////

  /**
   * Adds a listener to the beginning of the listeners array for the specified event.
   *
   * @param {string|string[]} event - Event name.
   * @param {handler} handler - The callback function.
   */
  prependListener(event, handler) {
    return this.#events.prependListener(event, handler);
  }

  /**
   * Adds a one-time listener to the beginning of the listeners array for the specified event.
   *
   * @param {string|string[]} event - Event name.
   * @param {handler} handler - The callback function.
   * @returns {handler[]} - The wrapped handler used internally.
   */
  prependListenerOnce(event, handler) {
    return this.#events.prependListenerOnce(event, handler);
  }

  //////////////////////////////////////////////////////////////////////

  /**
   * Adds a event listener.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - Callback function to be called when event fires.
   */
  appendListener(event, handler) {
    return this.#events.appendListener(event, handler);
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - The callback function to run on event.
   * @returns {handler[]} - The wrapped version of the handler.
   */
  appendListenerOnce(event, handler) {
    return this.#events.appendListenerOnce(event, handler);
  }

  /**
   * Adds a event listener.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - Callback function to be called when event fires.
   */
  on(event, handler) {
    return this.#events.on(event, handler);
  }

  /**
   * Registers an event listener that runs only once, then is removed.
   *
   * @param {string|string[]} event - Event name, such as 'onScrollBoundary' or 'onAutoScroll'.
   * @param {handler} handler - The callback function to run on event.
   * @returns {handler[]} - The wrapped version of the handler.
   */
  once(event, handler) {
    return this.#events.once(event, handler);
  }

  ////////////////////////////////////////////////////////////////////

  /**
   * Removes a previously registered event listener.
   *
   * @param {string|string[]} event - The name of the event to remove the handler from.
   * @param {handler} handler - The specific callback function to remove.
   */
  off(event, handler) {
    return this.#events.off(event, handler);
  }

  /**
   * Removes all event listeners of a specific type from the element.
   *
   * @param {string|string[]} event - The event type to remove (e.g. 'onScrollBoundary').
   */
  offAll(event) {
    return this.#events.offAll(event);
  }

  /**
   * Removes all event listeners of all types from the element.
   */
  offAllTypes() {
    return this.#events.offAllTypes();
  }

  ////////////////////////////////////////////////////////////

  /**
   * Returns the number of listeners for a given event.
   *
   * @param {string} event - The name of the event.
   * @returns {number} Number of listeners for the event.
   */
  listenerCount(event) {
    return this.#events.listenerCount(event);
  }

  /**
   * Returns a copy of the array of listeners for the specified event.
   *
   * @param {string} event - The name of the event.
   * @returns {handler[]} Array of listener functions.
   */
  listeners(event) {
    return this.#events.listeners(event);
  }

  /**
   * Returns a copy of the array of listeners for the specified event.
   *
   * @param {string} event - The name of the event.
   * @returns {handler[]} Array of listener functions.
   */
  onceListeners(event) {
    return this.#events.onceListeners(event);
  }

  /**
   * Returns a copy of the internal listeners array for the specified event,
   * including wrapper functions like those used by `.once()`.
   * @param {string | symbol} event - The event name.
   * @returns {handler[]} An array of raw listener functions.
   */
  allListeners(event) {
    return this.#events.allListeners(event);
  }

  /**
   * Returns an array of event names for which there are registered listeners.
   *
   * @returns {string[]} Array of registered event names.
   */
  eventNames() {
    return this.#events.eventNames();
  }

  //////////////////////////////////////////////////////

  /**
   * Sets the maximum number of listeners per event before a warning is shown.
   *
   * @param {number} n - The maximum number of listeners.
   */
  setMaxListeners(n) {
    return this.#events.setMaxListeners(n);
  }

  /**
   * Gets the maximum number of listeners allowed per event.
   *
   * @returns {number} The maximum number of listeners.
   */
  getMaxListeners() {
    return this.#events.getMaxListeners();
  }

  ///////////////////////////////////////////////////

  /** @type {Window} */
  #targetWindow;

  /** @type {string} */
  #targetOrigin;

  /** @type {string} */
  #selfType;

  /** @type {boolean} */
  #isDestroyed = false;

  /** @type {boolean} */
  #ready = false;

  /**
   * @typedef {object} IframeEventBase
   * @property {string} eventName - The name of the custom event route.
   * @property {any} payload - The data being sent (can be any type).
   * @property {'iframe' | 'parent'} direction - Indicates the sender: 'iframe' or 'parent'.
   */

  /**
   * Queue of messages emitted before connection is ready
   * @type {IframeEventBase[]}
   */
  #pendingQueue = [];

  /** @type {string} Internal message type for routed communication */
  #secretEventName = '__tinyIframeEvent__';

  /**
   * Gets the internal secret iframe event name.
   * @returns {string}
   */
  get secretEventName() {
    return this.#secretEventName;
  }

  /**
   * Sets the internal secret iframe event name.
   * @param {string} name
   * @throws {TypeError} If the value is not a string.
   */
  set secretEventName(name) {
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: secretEventName must be a string.');
    this.#secretEventName = name;
  }

  /**
   * Creates a new TinyIframeEvents instance to manage communication between iframe and parent.
   * Automatically determines the current context (`iframe` or `parent`) based on the `targetWindow`.
   *
   * @param {Object} config - Configuration object.
   * @param {HTMLIFrameElement} [config.targetIframe] - The target window to post messages to. Defaults to `window.parent` (assumes this is inside an iframe).
   * @param {string} [config.targetOrigin] - The target origin to restrict messages to. Defaults to `window.location.origin`.
   */
  constructor({ targetIframe, targetOrigin } = {}) {
    if (
      typeof targetIframe !== 'undefined' &&
      (!(targetIframe instanceof HTMLIFrameElement) || !targetIframe.contentWindow)
    )
      throw new TypeError(
        `[TinyIframeEvents] Invalid "targetIframe" provided: expected a HTML Iframe Element, received ${typeof targetIframe}`,
      );
    if (typeof targetOrigin !== 'undefined' && typeof targetOrigin !== 'string')
      throw new TypeError(
        `[TinyIframeEvents] Invalid "targetOrigin" provided: expected a string, received ${typeof targetOrigin}`,
      );

    this.#targetWindow = targetIframe?.contentWindow ?? window.parent;
    this.#targetOrigin = targetOrigin ?? window.location.origin;
    this.#selfType = !targetIframe ? 'iframe' : 'parent';
    if (instances.has(this.#targetWindow)) throw new Error('Duplicate window reference.');

    this._boundOnMessage = this.#onMessage.bind(this);
    this._boundOnceMessage = this.#onceMessage.bind(this);

    if (
      this.#targetWindow.document.readyState === 'complete' ||
      this.#targetWindow.document.readyState === 'interactive'
    )
      this.#onceMessage();
    else {
      this.#targetWindow.addEventListener('load', this._boundOnceMessage, false);
      this.#targetWindow.addEventListener('DOMContentLoaded', this._boundOnceMessage, false);
    }

    window.addEventListener('message', this._boundOnMessage, false);
    instances.set(this.#targetWindow, this);
  }

  /**
   * Marks the communication as ready and flushes any queued messages.
   */
  #onceMessage() {
    if (this.#ready) return;
    this.#ready = true;
    this.#flushQueue();
  }

  /**
   * Internal handler for the message event. Filters and dispatches incoming messages.
   *
   * @param {MessageEvent<any>} event - The message event received via `postMessage`.
   */
  #onMessage(event) {
    const { data, source } = event;

    // Reject non-object or unrelated messages
    if (!isJsonObject(data) || !data[this.#secretEventName]) return;

    const { eventName, payload, direction } = data;

    // Reject if not from the expected window (for security)
    if (source !== this.#targetWindow) return;

    // Reject if direction is not meant for this side
    if (
      (this.#selfType === 'iframe' && direction !== 'iframe') ||
      (this.#selfType === 'parent' && direction !== 'parent')
    )
      return;

    this.#events.emit(/** @type {string} */ (eventName), payload, event);
  }

  /**
   * Sends an event to the target window.
   *
   * @param {string} eventName - A unique name identifying the event.
   * @param {*} payload - The data to send with the event. Can be any serializable value.
   * @throws {Error} If `eventName` is not a string.
   */
  emit(eventName, payload) {
    if (typeof eventName !== 'string') throw new TypeError('Event name must be a string.');
    if (this.#isDestroyed) throw new Error('Cannot emit: instance has been destroyed.');

    /** @type {IframeEventBase} */
    const message = {
      [this.#secretEventName]: true,
      eventName,
      payload,
      direction: this.#selfType === 'parent' ? 'iframe' : 'parent',
    };

    if (!this.#ready) {
      this.#pendingQueue.push(message);
      return;
    }

    this.#targetWindow.postMessage(message, this.#targetOrigin);
  }

  /**
   * Sends all pending messages queued before handshake completion.
   *
   * @returns {void}
   */
  #flushQueue() {
    while (this.#pendingQueue.length) {
      const data = this.#pendingQueue.shift();
      if (data) this.#targetWindow.postMessage(data, this.#targetOrigin);
    }
  }

  /**
   * Checks if the communication instance has been destroyed.
   *
   * @returns {boolean}
   */
  isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Unsubscribes all registered event listeners and removes the message handler.
   * Call this when the instance is no longer needed to prevent memory leaks.
   */
  destroy() {
    this.#isDestroyed = true;
    window.removeEventListener('message', this._boundOnMessage);
    this.#targetWindow.removeEventListener('load', this._boundOnceMessage, false);
    this.#targetWindow.removeEventListener('DOMContentLoaded', this._boundOnceMessage, false);
    this.#events.offAllTypes();
    this.#pendingQueue = [];
    instances.delete(this.#targetWindow);
  }
}

export default TinyIframeEvents;
