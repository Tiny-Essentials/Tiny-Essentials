import { EventEmitter } from 'events';
import { isJsonObject } from '../basics/objChecker.mjs';
import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyIframeEvents');

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
 * @property {string} [readyEventName] - Custom internal name used for the ready event trigger.
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
 * - Auto-reconnects and resets ports if the target iframe is reloaded.
 */
class TinyIframeEvents extends EventEmitter {
  /** @type {Window} */
  #targetWindow;

  get targetWindow() {
    checkDestroy(this.#isDestroyed);
    return this.#targetWindow;
  }

  /** @type {HTMLIFrameElement | undefined} */
  #targetIframeElement;

  get targetIframeElement() {
    checkDestroy(this.#isDestroyed);
    return this.#targetIframeElement;
  }

  /** @type {string} */
  #targetOrigin;

  get targetOrigin() {
    checkDestroy(this.#isDestroyed);
    return this.#targetOrigin;
  }

  /** @type {'iframe' | 'parent'} */
  #selfType;

  get selfType() {
    checkDestroy(this.#isDestroyed);
    return this.#selfType;
  }

  /** @type {boolean} */
  #isDestroyed = false;

  /** @type {boolean} */
  #ready = false;

  get ready() {
    checkDestroy(this.#isDestroyed);
    return this.#ready;
  }

  /**
   * Executes the provided callback when the secure MessageChannel connection is fully established.
   * If the connection is already ready, the callback is executed immediately.
   *
   * @param {() => void} handler - The callback function to execute.
   */
  onReady(handler) {
    checkDestroy(this.#isDestroyed);
    if (this.#ready) {
      handler();
    } else {
      this.once(this.#readyEventName, handler);
    }
  }

  /** @type {MessagePort | null} */
  #port = null;

  /** @type {IframeEventBase[]} */
  #pendingQueue = [];

  /** @type {string} */
  #secretEventName;

  /** @type {string} */
  #handshakeEventName;

  /** @type {string} */
  #readyEventName;

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
    readyEventName = '__tinyIframeReady__',
  } = {}) {
    super();
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
    this.#readyEventName = readyEventName;

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
    checkDestroy(this.#isDestroyed);
    return this.#secretEventName;
  }

  /**
   * Sets the internal secret iframe event name.
   * @param {string} name
   * @throws {TypeError} If the value is not a string.
   */
  set secretEventName(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: secretEventName must be a string.');
    this.#secretEventName = name;
  }

  /**
   * Gets the internal handshake event name used for establishing the MessageChannel.
   * @returns {string}
   */
  get handshakeEventName() {
    checkDestroy(this.#isDestroyed);
    return this.#handshakeEventName;
  }

  /**
   * Sets the internal handshake event name.
   * @param {string} name
   * @throws {TypeError} If the value is not a string.
   */
  set handshakeEventName(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: handshakeEventName must be a string.');
    this.#handshakeEventName = name;
  }

  /**
   * Gets the internal ready event name used when the connection is fully established.
   * @returns {string}
   */
  get readyEventName() {
    checkDestroy(this.#isDestroyed);
    return this.#readyEventName;
  }

  /**
   * Sets the internal ready event name.
   * @param {string} name
   * @throws {TypeError} If the value is not a string.
   */
  set readyEventName(name) {
    checkDestroy(this.#isDestroyed);
    if (typeof name !== 'string')
      throw new TypeError('TinyIframeEvents: readyEventName must be a string.');
    this.#readyEventName = name;
  }

  /**
   * Initializes the correct connection strategy based on the current context (parent or iframe).
   */
  #initializeConnection() {
    if (this.#selfType === 'parent') {
      this.#boundSendPort = () => {
        if (this.#isDestroyed) return;

        // Closes any existing port to prevent memory leaks during iframe reloads
        if (this.#port) {
          this.#port.close();
        }

        // Creates a fresh channel for every attempt to prevent clone errors
        const channel = new MessageChannel();
        this.#port = channel.port1;
        this.#port.onmessage = this._boundPortMessage;

        // Resets ready state to require a new ACK
        this.#ready = false;

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

    this.emit(`win:${eventName}`, payload, event);
  }

  /**
   * Marks the communication as ready, flushes any queued messages,
   * and triggers the internal ready event for any waiting listeners.
   */
  #markReady() {
    if (this.#ready) return;
    this.#ready = true;
    this.#flushQueue();
    this.emit(this.#readyEventName);
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
  winEmit(eventName, payload) {
    checkDestroy(this.#isDestroyed);
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
    if (this.#isDestroyed) return;
    this.#ready = false;

    window.removeEventListener('message', this._boundWindowMessage);

    if (this.#targetIframeElement && this.#boundSendPort) {
      this.#targetIframeElement.removeEventListener('load', this.#boundSendPort);
    }

    if (this.#port) {
      this.#port.close();
      this.#port = null;
    }

    this.removeAllListeners();
    this.#pendingQueue = [];
    instances.delete(this.#targetWindow);
    this.#isDestroyed = true;
  }
}

export default TinyIframeEvents;
