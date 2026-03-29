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
 * @typedef {object} TinyIframeEventsConfig
 * Configuration object for initializing TinyIframeEvents.
 * @property {HTMLIFrameElement} [targetIframe] - The target iframe element to post messages to. Required if instantiated in the parent window.
 * @property {string} [targetOrigin] - The target origin to restrict messages to. Defaults to `window.location.origin`.
 * @property {string} [secretEventName] - Custom internal name used to validate standard routing messages.
 * @property {string} [handshakeEventName] - Custom internal name used for the initial MessageChannel handshake.
 */

/**
 * @typedef {object} IframeEventBase
 * Internal message structure for routed communication.
 * @property {boolean} [secretIndicator] - Dynamic key based on secretEventName to validate the message.
 * @property {string} eventName - The name of the custom event route.
 * @property {any} payload - The data being sent (can be any type).
 * @property {'iframe' | 'parent'} direction - Indicates the sender: 'iframe' or 'parent'.
 */

/**
 * A highly secure and flexible event routing system for structured communication
 * between a parent window and its iframe using `MessageChannel`.
 *
 * This class abstracts the complexity of cross-origin communication by establishing
 * a direct, un-interceptable port connection after a secure initial handshake.
 *
 * Features:
 * - Secure direct pipeline via `MessageChannel`.
 * - Customizable internal event names to avoid collisions.
 * - Symmetrical usage for both parent and iframe.
 * - Queue management for messages sent before the connection is established.
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

  /** @type {HTMLIFrameElement | undefined} */
  #targetIframeElement;

  /** @type {string} */
  #targetOrigin;

  /** @type {'iframe' | 'parent'} */
  #selfType;

  /** @type {boolean} */
  #isDestroyed = false;

  /** @type {boolean} */
  #ready = false;

  /** @type {MessagePort | null} */
  #port = null;

  /** @type {IframeEventBase[]} */
  #pendingQueue = [];

  /** @type {string} */
  #secretEventName;

  /** @type {string} */
  #handshakeEventName;

  /** @type {(() => void) | null} */
  #boundSendPort = null;

  /**
   * Creates a new TinyIframeEvents instance to manage secure communication.
   * Automatically establishes a MessageChannel connection between contexts.
   *
   * @param {TinyIframeEventsConfig} config - Configuration object.
   */
  constructor({
    targetIframe,
    targetOrigin = window.location.origin,
    secretEventName = '__tinyIframeEvent__',
    handshakeEventName = '__tinyIframeHandshake__',
  } = {}) {
    if (
      targetIframe !== undefined &&
      (!(targetIframe instanceof HTMLIFrameElement) || !targetIframe.contentWindow)
    ) {
      throw new TypeError(
        `[TinyIframeEvents] Invalid "targetIframe": expected HTMLIFrameElement, received ${typeof targetIframe}`,
      );
    }

    if (typeof targetOrigin !== 'string') {
      throw new TypeError(
        `[TinyIframeEvents] Invalid "targetOrigin": expected string, received ${typeof targetOrigin}`,
      );
    }

    this.#targetIframeElement = targetIframe;
    this.#targetWindow = targetIframe?.contentWindow ?? window.parent;
    this.#targetOrigin = targetOrigin;
    this.#selfType = !targetIframe ? 'iframe' : 'parent';
    this.#secretEventName = secretEventName;
    this.#handshakeEventName = handshakeEventName;

    if (instances.has(this.#targetWindow)) throw new Error('Duplicate window reference.');

    this._boundWindowMessage = this.#onWindowMessage.bind(this);
    this._boundPortMessage = this.#onPortMessage.bind(this);

    this.#initializeConnection();
    instances.set(this.#targetWindow, this);
  }

  /**
   * Gets the internal secret iframe event name used for validation.
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
   * Gets the internal handshake event name used for establishing the MessageChannel.
   * @returns {string}
   */
  get handshakeEventName() {
    return this.#handshakeEventName;
  }

  /**
   * Sets the internal handshake event name.
   * @param {string} name
   * @throws {TypeError} If the value is not a string.
   */
  set handshakeEventName(name) {
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: handshakeEventName must be a string.');
    this.#handshakeEventName = name;
  }

  /**
   * Initializes the correct connection strategy based on the current context (parent or iframe).
   */
  #initializeConnection() {
    if (this.#selfType === 'parent') {
      /** @type {MessageChannel} */
      const channel = new MessageChannel();
      this.#port = channel.port1;
      this.#port.onmessage = this._boundPortMessage;

      this.#boundSendPort = () => {
        if (this.#isDestroyed) return;
        this.#targetWindow.postMessage({ type: this.#handshakeEventName }, this.#targetOrigin, [
          channel.port2,
        ]);
      };

      if (this.#targetIframeElement) {
        this.#targetIframeElement.addEventListener('load', this.#boundSendPort);
        this.#boundSendPort();
      }
    } else {
      window.addEventListener('message', this._boundWindowMessage, false);
    }
  }

  /**
   * Internal handler for the initial window message event (used by iframe to receive the port).
   *
   * @param {MessageEvent<any>} event - The message event received via `postMessage`.
   */
  #onWindowMessage(event) {
    const data = event.data;
    const ports = event.ports;

    if (!isJsonObject(data) || data.type !== this.#handshakeEventName || ports.length === 0) return;

    this.#port = ports[0];
    this.#port.onmessage = this._boundPortMessage;
    window.removeEventListener('message', this._boundWindowMessage);

    this.#port.postMessage({ type: `${this.#handshakeEventName}_ACK` });
    this.#markReady();
  }

  /**
   * Internal handler for messages received through the secure MessageChannel port.
   *
   * @param {MessageEvent<any>} event - The message event received via `MessagePort`.
   */
  #onPortMessage(event) {
    /** @type {any} */
    const data = event.data;

    if (isJsonObject(data) && data.type === `${this.#handshakeEventName}_ACK`) {
      this.#markReady();
      return;
    }

    if (!isJsonObject(data) || !data[this.#secretEventName]) return;

    const eventName = data.eventName;
    const payload = data.payload;
    const direction = data.direction;

    if (
      typeof eventName !== 'string' ||
      (this.#selfType === 'iframe' && direction !== 'iframe') ||
      (this.#selfType === 'parent' && direction !== 'parent')
    ) {
      return;
    }

    this.#events.emit(eventName, payload, event);
  }

  /**
   * Marks the communication as ready and flushes any queued messages.
   */
  #markReady() {
    if (this.#ready) return;
    this.#ready = true;
    this.#flushQueue();
  }

  /**
   * Sends all pending messages queued before the secure port was established.
   */
  #flushQueue() {
    while (this.#pendingQueue.length > 0) {
      /** @type {IframeEventBase | undefined} */
      const data = this.#pendingQueue.shift();

      if (data && this.#port) {
        this.#port.postMessage(data);
      }
    }
  }

  /**
   * Sends an event to the target window through the secure MessageChannel.
   *
   * @param {string} eventName - A unique name identifying the event.
   * @param {*} payload - The data to send with the event. Can be any serializable value.
   * @throws {TypeError} If `eventName` is not a string.
   * @throws {Error} If instance has been destroyed.
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

    if (!this.#ready || !this.#port) {
      this.#pendingQueue.push(message);
      return;
    }

    this.#port.postMessage(message);
  }

  /**
   * Checks if the communication instance has been destroyed.
   *
   * @returns {boolean} True if destroyed, false otherwise.
   */
  isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Unsubscribes all registered event listeners, closes the message port, and cleans up references.
   * Call this when the instance is no longer needed to prevent memory leaks.
   */
  destroy() {
    this.#isDestroyed = true;
    this.#ready = false;

    window.removeEventListener('message', this._boundWindowMessage);

    if (this.#targetIframeElement && this.#boundSendPort) {
      this.#targetIframeElement.removeEventListener('load', this.#boundSendPort);
    }

    if (this.#port) {
      this.#port.close();
      this.#port = null;
    }

    this.#events.offAllTypes();
    this.#pendingQueue = [];
    instances.delete(this.#targetWindow);
  }
}

export default TinyIframeEvents;
