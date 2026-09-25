import { TinyPluginCore, TinyPlugin, TinyPluginLayer } from '../../plugin/TinyPlugin.mjs';

/**
 * The data payload contained within the message.
 * @typedef {any} MessagePayload
 */

/**
 * A function that handles the actual postMessage call back to the main thread.
 * @callback MessageApiReply
 * @param {string} type - The type identifier for the api reply message.
 * @param {MessagePayload} [data] - The payload to be sent in the api reply.
 * @param {number} [timeout=10000] - Wait time.
 * @returns {Promise<any>}
 */

/**
 * @typedef {Object} ApiHandlerOptions
 * @property {MessagePayload} [data] - The payload received from the main thread.
 * @property {string} correlationId - The request ID.
 */

/**
 * @callback ApiHandlerCallback
 * @param {ApiHandlerOptions} options - Options for the API handler.
 * @returns {Promise<MessagePayload|undefined> | (MessagePayload|undefined)} The response payload.
 */

/**
 * An enriched message object containing the event and utility methods for responding.
 * @typedef {Object} MessageObj
 * @property {string} type - The identifier for the message type.
 * @property {MessageEvent} event - The original message event.
 * @property {MessagePayload} [data] - The payload sent within the message.
 */

/**
 * A callback function executed when a registered message type is received.
 * @callback MessageCallback
 * @param {MessageObj} msg - The enriched message data object.
 */

/** @type {DedicatedWorkerGlobalScope} */
// @ts-ignore
const workerScope = self;

/**
 * A function used to install a plugin into the engine.
 * @template {TinyPluginLayer} Layer
 * @template {string} IdString
 * @template {string} VersionString
 * @template {any[]} Options
 * @typedef {import('../../plugin/TinyPlugin.mjs').TinyPluginInstaller<TinyWebWorkerEngine, Layer, IdString, VersionString, Options>} SwPluginInstaller
 */

/**
 * Represents a plugin instance designed to be integrated into a TinyWebWorkerEngine.
 * @template {TinyPluginLayer} Layer
 * @template {string} IdString
 * @template {string} VersionString
 * @template {any[]} Options
 * @typedef {TinyPlugin<TinyWebWorkerEngine, Layer, IdString, VersionString, Options>} TinyServiceWorkerPlugin
 */

/**
 * Manages the lifecycle and execution of modules inside a Dedicated Web Worker.
 */
class TinyWebWorkerEngine extends TinyPluginCore {
  /**
   * Validates if an event type is a reserved name for the internal lifecycle.
   * @param {string} type - The name of the event to validate.
   * @throws {TypeError} If the event name is in the reserved list.
   */
  static #validateEventType(type) {
    if (type.startsWith('ww:')) {
      throw new TypeError(
        `The event type "${type}" is reserved for internal Web Worker lifecycle management.`,
      );
    }
  }

  /** @type {Map<string, ApiHandlerCallback>} */
  #apiHandlers = new Map();

  /** @type {Map<string, MessageCallback>} */
  #messages = new Map();

  /** @type {Map<string, {resolve: (value: any) => void, reject: (reason: Error) => void, timer: NodeJS.Timeout}>} */
  #pendingRequests = new Map();

  /** @type {boolean} */
  #started = false;

  /**
   * Indicates if the engine has been initialized.
   * @returns {boolean} True if started, false otherwise.
   */
  get started() {
    return this.#started;
  }

  /**
   * Initializes a new instance of the TinyWebWorkerEngine.
   * @param {Object} [lgConfig] - Configuration options for the instance.
   * @param {boolean} [lgConfig.debugMode=false] - Whether to enable internal debug logging.
   * @param {boolean} [lgConfig.useLogColors=false] - Whether to enable log color support.
   * @param {Partial<Console>} [lgConfig.logger=console] - A custom logger object.
   */
  constructor(lgConfig = {}) {
    super({
      logCfg: {
        id: '[_main_class_TinyWW-Engine_reset_]',
        logger: lgConfig.logger ?? console,
        debugMode: lgConfig.debugMode ?? false,
        useLogColors: lgConfig.useLogColors ?? false,
      },
    });
  }

  /**
   * Registers a handler for API calls coming from the main thread.
   * @param {string} type - The identifier for the call.
   * @param {ApiHandlerCallback} callback - Function that processes the request and returns a payload.
   * @throws {TypeError} If callback is not a function.
   */
  onApi(type, callback) {
    if (typeof callback !== 'function') throw new TypeError('Callback must be a function.');
    this.#apiHandlers.set(type, callback);
  }

  /**
   * Removes a registered API handler.
   * @param {string} type - The identifier for the call.
   * @returns {boolean} True if the handler was removed.
   */
  offApi(type) {
    return this.#apiHandlers.delete(type);
  }

  /**
   * Adds a message listener for unidirectional messages.
   * @param {string} type - The identifier for the message type.
   * @param {MessageCallback} callback - The callback to execute.
   * @throws {TypeError} If callback is not a function.
   */
  addMessageListener(type, callback) {
    if (typeof callback !== 'function') throw new TypeError('Callback must be a function.');
    this.#messages.set(type, callback);
  }

  /**
   * Removes a message listener.
   * @param {string} type - The identifier for the message type.
   * @returns {boolean} True if the listener was removed.
   */
  removeMessageListener(type) {
    return this.#messages.delete(type);
  }

  /**
   * Sends a unidirectional message to the main thread.
   * @param {string} type - The identifier for the message type.
   * @param {MessagePayload} [data] - The actual data content.
   * @returns {boolean} True if the message was sent, false otherwise.
   * @throws {TypeError} If type is not a string or data is invalid.
   */
  emit(type, data) {
    if (typeof type !== 'string') throw new TypeError('type must be a string.');
    if (
      typeof data !== 'undefined' &&
      (Array.isArray(data) || typeof data !== 'object' || data === null)
    ) {
      throw new TypeError('data must be a non-null object.');
    }

    TinyWebWorkerEngine.#validateEventType(type);
    workerScope.postMessage({ type, data });
    return true;
  }

  /**
   * Sends a request to the main thread and waits for a response.
   * @param {string} type - The identifier for the call.
   * @param {MessagePayload} [data] - The request payload.
   * @param {number} [timeout=10000] - Maximum waiting time in milliseconds.
   * @returns {Promise<any>} A promise that resolves with the result object.
   * @throws {Error} If the timeout is reached.
   */
  async emitApi(type, data, timeout = 10000) {
    const correlationId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.#pendingRequests.has(correlationId)) {
          this.#pendingRequests.delete(correlationId);
          reject(new Error(`API timeout: ${type}`));
        }
      }, timeout);

      this.#pendingRequests.set(correlationId, { resolve, reject, timer });

      workerScope.postMessage({
        type,
        data,
        correlationId,
        isApi: true,
      });
    });
  }

  /**
   * Initializes the Web Worker event listeners.
   * @returns {void}
   * @throws {Error} If the engine has already been started.
   */
  init() {
    if (this.#started) throw new Error('TinyWebWorkerEngine is already initialized.');

    workerScope.addEventListener('message', (event) => {
      const payload = event.data;

      // Strict validation
      if (Array.isArray(payload) || typeof payload !== 'object' || payload === null) return;
      if (typeof payload.type !== 'string') return;
      if (
        typeof payload.data !== 'undefined' &&
        (Array.isArray(payload.data) || typeof payload.data !== 'object' || payload.data === null)
      )
        return;

      const { type, data, correlationId, isApi, error } = payload;

      // 1. Handle API responses coming from the Main Thread
      if (type === 'ww:ApiResponse') {
        if (typeof correlationId !== 'string') {
          this.log('error', 'Received API response with missing or invalid "correlationId".');
          return;
        }
        const pending = this.#pendingRequests.get(correlationId);
        if (pending) {
          clearTimeout(pending.timer);
          this.#pendingRequests.delete(correlationId);
          if (error) {
            pending.reject(new Error(error));
          } else {
            pending.resolve(data);
          }
        }
        return;
      }

      // 2. Handle API calls coming from the Main Thread
      if (isApi === true) {
        if (typeof correlationId !== 'string') {
          this.log('error', 'Received API request with missing or invalid "correlationId".');
          return;
        }

        const handler = this.#apiHandlers.get(type);
        if (!handler) {
          workerScope.postMessage({
            correlationId,
            type: 'ww:ApiResponse',
            error: `No API handler registered in worker for type: ${type}`,
          });
          return;
        }

        try {
          /** @param {MessagePayload} [r] */
          const sendResult = (r) =>
            workerScope.postMessage({
              correlationId,
              type: 'ww:ApiResponse',
              data: r,
            });

          const result = handler({
            data,
            correlationId,
          });

          if (result instanceof Promise) {
            result.then(sendResult).catch((err) => {
              workerScope.postMessage({
                correlationId,
                type: 'ww:ApiResponse',
                error: err instanceof Error ? err.message : String(err),
              });
            });
          } else {
            sendResult(result);
          }
        } catch (err) {
          workerScope.postMessage({
            correlationId,
            type: 'ww:ApiResponse',
            error: err instanceof Error ? err.message : String(err),
          });
        }
        return;
      }

      // 3. Handle standard unidirectional messages
      const messageHandler = this.#messages.get(type);

      /** @type {MessageObj} */
      const msgData = { type, event, data };
      this.emit('beforeMessage', msgData);

      if (messageHandler) {
        try {
          messageHandler(msgData);
        } catch (err) {
          this.log('error', `Error executing handler for message type "${type}":`, err);
          this.emit('messageError', { type, error: err, data: msgData });
        }
      }
      this.emit('afterMessage', msgData);
    });

    this.#started = true;
    this.log('info', 'Web Worker Engine initialized.');
  }
}

export default TinyWebWorkerEngine;
