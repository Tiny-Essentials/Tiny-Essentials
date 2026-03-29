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
 * A secure and flexible event routing system for structured communication
 * between a parent window and its iframe using `MessageChannel`.
 *
 * This class establishes a secure handshake via `postMessage` and then transfers
 * a MessagePort to establish a direct, closed communication channel. It allows
 * both the iframe and parent to:
 * - Send events with arbitrary payloads securely.
 * - Listen to specific custom event names.
 * - Work symmetrically from both sides with automatic handshake handling.
 * - Prevent eavesdropping on the global window object.
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

  /** * The target window to communicate with (iframe's contentWindow or window.parent).
   * @type {Window}
   */
  #targetWindow;

  /**
   * The target window to communicate with (iframe's contentWindow or window.parent).
   */
  get targetWindow() {
    return this.#targetWindow;
  }

  /** * The allowed origin for secure communication.
   * @type {string}
   */
  #targetOrigin;

  get targetOrigin() {
    return this.#targetOrigin;
  }

  /** * Indicates whether this instance acts as the 'iframe' or the 'parent'.
   * @type {string}
   */
  #selfType;

  /**
   * Indicates whether this instance acts as the 'iframe' or the 'parent'.
   */
  get selfType() {
    return this.#selfType;
  }

  /** * Flag tracking whether the instance has been destroyed.
   * @type {boolean}
   */
  #isDestroyed = false;

  /** * Flag tracking whether the MessageChannel handshake is fully established.
   * @type {boolean}
   */
  #ready = false;

  /**
   * Flag tracking whether the MessageChannel handshake is fully established.
   */
  get ready() {
    return this.#ready;
  }

  /** * The dedicated MessagePort for direct communication.
   * @type {MessagePort | null}
   */
  #port = null;

  /** * Interval reference for the handshake retry loop.
   * @type {NodeJS.Timeout | null}
   */
  #handshakeInterval = null;

  /**
   * @typedef {object} IframeEventBase
   * @property {string} eventName - The name of the custom event route.
   * @property {any} payload - The data being sent (can be any type).
   * @property {'iframe' | 'parent'} direction - Indicates the sender: 'iframe' or 'parent'.
   */

  /**
   * Queue of messages emitted before the connection is completely ready.
   * @type {IframeEventBase[]}
   */
  #pendingQueue = [];

  /** * Internal message identifier used to distinguish handshake and routing signals.
   * @type {string}
   */
  #secretEventName;

  /** * The string payload sent to indicate the iframe is ready to connect.
   * @type {string}
   */
  #handshakeReadyEvent;

  /**
   * The string payload sent to indicate the iframe is ready to connect.
   */
  get handshakeReadyEvent() {
    return this.#handshakeReadyEvent;
  }

  /** * The string payload sent to confirm the connection and transfer the port.
   * @type {string}
   */
  #handshakeConfirmEvent;

  /**
   * The string payload sent to confirm the connection and transfer the port.
   */
  get handshakeConfirmEvent() {
    return this.#handshakeConfirmEvent;
  }

  /**
   * Gets the internal secret iframe event name used for validation.
   * @returns {string} The secret event name.
   */
  get secretEventName() {
    return this.#secretEventName;
  }

  /**
   * Sets the internal secret iframe event name.
   * @param {string} name - The new secret identifier.
   * @throws {TypeError} If the value is not a string.
   */
  set secretEventName(name) {
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: secretEventName must be a string.');
    this.#secretEventName = name;
  }

  /**
   * Creates a new TinyIframeEvents instance to manage secure communication.
   * Automatically determines the current context (`iframe` or `parent`) based on the `targetWindow`.
   *
   * @param {Object} [config] - Configuration options.
   * @param {HTMLIFrameElement} [config.targetIframe] - The target iframe to communicate with. If omitted, assumes context is the iframe aiming at `window.parent`.
   * @param {string} [config.targetOrigin] - The target origin to restrict messages to. Defaults to `window.location.origin`.
   * @param {string} [config.secretEventName] - Custom identifier for internal message routing.
   * @param {string} [config.handshakeReadyEvent] - Custom string for the ready signal.
   * @param {string} [config.handshakeConfirmEvent] - Custom string for the confirmation signal.
   * @throws {TypeError} If provided arguments are of the wrong type.
   * @throws {Error} If an instance is already managing the provided window.
   */
  constructor({
    targetIframe,
    targetOrigin,
    secretEventName = '__tinyIframeEvent__',
    handshakeReadyEvent = 'iframe-ready',
    handshakeConfirmEvent = 'handshake',
  } = {}) {
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

    this.#secretEventName = secretEventName;
    this.#handshakeReadyEvent = handshakeReadyEvent;
    this.#handshakeConfirmEvent = handshakeConfirmEvent;

    if (instances.has(this.#targetWindow)) throw new Error('Duplicate window reference.');

    this._boundOnMessage = this.#onMessage.bind(this);
    this._boundHandshake = this.#handleHandshake.bind(this);

    window.addEventListener('message', this._boundHandshake, false);

    if (this.#selfType === 'iframe') {
      this.#requestHandshake();
    }

    instances.set(this.#targetWindow, this);
  }

  /**
   * Initiates the handshake process from the iframe side.
   * It sends a periodic ping to the parent window until the parent responds
   * with a MessageChannel port.
   *
   * @returns {void}
   */
  #requestHandshake() {
    if (this.#ready) return;

    /** @type {() => void} */
    const sendReadySignal = () => {
      this.#targetWindow.postMessage(
        { [this.#secretEventName]: this.#handshakeReadyEvent },
        this.#targetOrigin,
      );
    };

    sendReadySignal();

    this.#handshakeInterval = setInterval(() => {
      if (!this.#ready) {
        sendReadySignal();
      } else if (this.#handshakeInterval) {
        clearInterval(this.#handshakeInterval);
        this.#handshakeInterval = null;
      }
    }, 100);
  }

  /**
   * Handles the global message event during the initial handshake phase.
   * Responsible for creating the MessageChannel in the parent and connecting
   * the ports on both sides.
   *
   * @param {MessageEvent<any>} event - The raw postMessage event.
   * @returns {void}
   */
  #handleHandshake(event) {
    /** @type {any} */
    const data = event.data;
    /** @type {MessageEventSource | null} */
    const source = event.source;
    /** @type {ReadonlyArray<MessagePort>} */
    const ports = event.ports;

    if (!isJsonObject(data) || source !== this.#targetWindow) return;

    if (this.#selfType === 'parent' && data[this.#secretEventName] === this.#handshakeReadyEvent) {
      if (this.#ready) return;

      /** @type {MessageChannel} */
      const channel = new MessageChannel();
      this.#port = channel.port1;
      this.#port.onmessage = this._boundOnMessage;

      this.#targetWindow.postMessage(
        { [this.#secretEventName]: this.#handshakeConfirmEvent },
        this.#targetOrigin,
        [channel.port2],
      );

      this.#ready = true;
      window.removeEventListener('message', this._boundHandshake);
      this.#flushQueue();
    }

    if (
      this.#selfType === 'iframe' &&
      data[this.#secretEventName] === this.#handshakeConfirmEvent
    ) {
      if (!ports || ports.length === 0) return;

      this.#port = ports[0];
      this.#port.onmessage = this._boundOnMessage;

      this.#ready = true;
      if (this.#handshakeInterval) {
        clearInterval(this.#handshakeInterval);
        this.#handshakeInterval = null;
      }

      window.removeEventListener('message', this._boundHandshake);
      this.#flushQueue();
    }
  }

  /**
   * Internal handler for messages received through the dedicated MessagePort.
   * Filters by origin, validates data structure, and dispatches to listeners.
   *
   * @param {MessageEvent<any>} event - The message event received via the port.
   * @returns {void}
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
      typeof eventName !== 'string' ||
      (this.#selfType === 'iframe' && direction !== 'iframe') ||
      (this.#selfType === 'parent' && direction !== 'parent')
    )
      return;

    this.#events.emit(eventName, payload, event);
  }

  /**
   * Sends an event with a payload to the connected window over the secure port.
   *
   * @param {string} eventName - A unique name identifying the event.
   * @param {*} payload - The data to send with the event. Must be structured-cloneable.
   * @throws {TypeError} If `eventName` is not a string.
   * @throws {Error} If the instance has been destroyed.
   * @returns {void}
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
   * Empties the pending queue and sends all stored messages through the active port.
   * Executed automatically once the handshake is successful.
   *
   * @returns {void}
   */
  #flushQueue() {
    while (this.#pendingQueue.length) {
      const data = this.#pendingQueue.shift();
      if (data && this.#port) this.#port.postMessage(data);
    }
  }

  /**
   * Checks if the communication instance has been destroyed.
   *
   * @returns {boolean} True if the instance is destroyed and unusable.
   */
  isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Destroys the communication channel, closes the MessagePort, stops intervals,
   * removes event listeners, and clears pending queues.
   * Call this to prevent memory leaks when the connection is no longer needed.
   *
   * @returns {void}
   */
  destroy() {
    this.#isDestroyed = true;

    if (this.#handshakeInterval) {
      clearInterval(this.#handshakeInterval);
      this.#handshakeInterval = null;
    }

    window.removeEventListener('message', this._boundHandshake);

    if (this.#port) {
      this.#port.close();
      this.#port.onmessage = null;
    }

    this.#events.offAllTypes();
    this.#pendingQueue = [];
    instances.delete(this.#targetWindow);
  }
}

export default TinyIframeEvents;
