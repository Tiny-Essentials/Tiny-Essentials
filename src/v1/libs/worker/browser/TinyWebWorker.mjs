import { TinyPluginCore } from '../../plugin/TinyPlugin.mjs';
import { createCheckDestroyed } from '../../utils/tools.mjs';

const checkDestroy = createCheckDestroyed('TinyWebWorker');

/**
 * The data payload contained within the message.
 * @typedef {any} MessagePayload
 */

/**
 * @typedef {Object} ApiHandlerOptions
 * @property {MessagePayload} [data] - The payload received from the worker.
 * @property {string} correlationId - The request ID.
 */

/**
 * @callback ApiHandlerCallback
 * @param {ApiHandlerOptions} options - Options for the API handler.
 * @returns {Promise<MessagePayload|undefined> | (MessagePayload|undefined)} The response payload.
 */

/**
 * Manages Web Worker initialization, lifecycle, and strictly typed messaging.
 */
class TinyWebWorker extends TinyPluginCore {
  /**
   * Validates if an event type is a reserved name for the internal lifecycle.
   * @param {string} type - The name of the event to validate.
   * @throws {TypeError} If the event name starts with the reserved prefix 'ww:'.
   */
  static #validateEventType(type) {
    if (type.startsWith('ww:')) {
      throw new TypeError(
        `The event type "${type}" is reserved for internal Web Worker lifecycle management.`,
      );
    }
  }

  /** @type {Worker | null} The active Web Worker instance. */
  #worker = null;
  /** @type {string} The unique identifier for this instance. */
  #id;
  /** @type {string | URL} The URL of the web worker file. */
  #workerUrl;
  /** @type {WorkerOptions} Options for the worker initialization. */
  #workerOptions;

  /** @type {boolean} Indicates if the worker is fully initialized and ready. */
  #isReady = false;
  /** @type {boolean} Internal flag to track if the instance has been destroyed. */
  #isDestroyed = false;

  /** @type {Map<string, {resolve: (value: any) => void, reject: (reason: Error) => void, timer: NodeJS.Timeout}>} */
  #pendingRequests = new Map();
  /** @type {Map<string, ApiHandlerCallback>} A map of registered API handlers. */
  #apiHandlers = new Map();

  /** @type {((event: MessageEvent) => void) | null} */
  #messageHandler = null;
  /** @type {((event: ErrorEvent) => void) | null} */
  #errorHandler = null;

  /** @returns {boolean} True if the worker is ready. */
  get isReady() {
    return this.#isReady;
  }

  /** @returns {boolean} True if the instance has been destroyed. */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /** @returns {Worker | null} The native worker instance. */
  get worker() {
    checkDestroy(this.#isDestroyed);
    return this.#worker;
  }

  /**
   * @param {Object} options - Configuration options for the instance.
   * @param {string} options.id - The unique identifier for this manager instance.
   * @param {string | URL} options.workerUrl - The path to the web worker file.
   * @param {WorkerOptions} [options.workerOptions={}] - Native worker options.
   * @param {boolean} [options.debugMode=false] - Whether to enable internal debug logging.
   * @param {boolean} [options.useLogColors=false] - Whether to enable log color support.
   * @param {Partial<Console>} [options.logger=console] - A custom logger object.
   * @throws {TypeError} If parameters are not the correct types.
   */
  constructor({ id, workerUrl, workerOptions = {}, logger, debugMode, useLogColors }) {
    super({
      logCfg: {
        id: '[_sub_class_TinyWebWorker_reset_]',
        logger: logger ?? console,
        debugMode: debugMode ?? false,
        useLogColors: useLogColors ?? false,
      },
    });

    if (typeof id !== 'string' || id.trim() === '') {
      throw new TypeError('The "id" parameter must be a non-empty string.');
    }
    if (typeof workerUrl !== 'string' && !(workerUrl instanceof URL)) {
      throw new TypeError('The "workerUrl" parameter must be a string or URL.');
    }

    this.#id = id;
    this.#workerUrl = workerUrl;
    this.#workerOptions = workerOptions;
  }

  /**
   * Initializes the Web Worker and sets up the message bridges.
   * @returns {Promise<void>} Resolves when the engine inside the worker signals readiness.
   */
  async init() {
    checkDestroy(this.#isDestroyed);
    if (this.#worker) throw new Error('Worker is already initialized.');

    return new Promise((resolve, reject) => {
      try {
        this.#worker = new Worker(this.#workerUrl, this.#workerOptions);
      } catch (error) {
        this.log('error', 'Failed to instantiate Worker:', error);
        return reject(error);
      }

      this.#messageHandler = (event) => {
        const payload = event.data;
        if (Array.isArray(payload) || typeof payload !== 'object' || payload === null) return;
        if (typeof payload.type !== 'string') return;

        // Engine Ready signal
        if (payload.type === 'ww:EngineReady') {
          this.#isReady = true;
          super.emit('ww:Started');
          resolve();
          return;
        }

        const type = payload.type;
        const data = payload.data;
        const correlationId = payload.correlationId;
        const isApi = payload.isApi;

        // 1. API responses coming from the Worker
        if (type === 'ww:ApiResponse') {
          if (typeof correlationId !== 'string') return;
          const pending = this.#pendingRequests.get(correlationId);
          if (pending) {
            clearTimeout(pending.timer);
            this.#pendingRequests.delete(correlationId);
            if (payload.error) {
              pending.reject(new Error(payload.error));
            } else {
              pending.resolve(data);
            }
          }
          return;
        }

        // 2. API requests coming from the Worker
        if (isApi === true) {
          if (typeof correlationId !== 'string') return;
          const handler = this.#apiHandlers.get(type);
          if (!handler) {
            this.#worker?.postMessage({
              correlationId,
              type: 'ww:ApiResponse',
              error: `No API handler registered in Main Thread for type: ${type}`,
            });
            return;
          }

          try {
            /** @param {MessagePayload} [r] */
            const sendResult = (r) =>
              this.#worker?.postMessage({
                correlationId,
                type: 'ww:ApiResponse',
                data: r,
              });

            const result = handler({ data, correlationId });
            if (result instanceof Promise)
              result.then(sendResult).catch((err) => {
                this.#worker?.postMessage({
                  correlationId,
                  type: 'ww:ApiResponse',
                  error: err instanceof Error ? err.message : String(err),
                });
              });
            else sendResult(result);
          } catch (error) {
            this.#worker?.postMessage({
              correlationId,
              type: 'ww:ApiResponse',
              error: error instanceof Error ? error.message : String(error),
            });
          }
          return;
        }

        // 3. Emit standard event to plugins/listeners
        super.emit(type, { data, event });
      };

      this.#errorHandler = (errorEvent) => {
        this.log('error', `Worker Error [${this.#id}]:`, errorEvent.message);
        super.emit('ww:Error', { error: errorEvent });
      };

      this.#worker.addEventListener('message', this.#messageHandler);
      this.#worker.addEventListener('error', this.#errorHandler);
    });
  }

  /**
   * Internal sender method.
   * @param {string} type
   * @param {MessagePayload} [data]
   * @param {boolean} strictMode
   */
  #emit(type, data, strictMode = false) {
    checkDestroy(this.#isDestroyed);
    if (!this.#worker) throw new Error('Worker is not initialized.');
    if (typeof type !== 'string') throw new TypeError('Payload.type must be a string.');
    if (
      typeof data !== 'undefined' &&
      (Array.isArray(data) || typeof data !== 'object' || data === null)
    ) {
      throw new TypeError('Payload.data must be a non-null object.');
    }

    if (strictMode) TinyWebWorker.#validateEventType(type);

    this.#worker.postMessage({ type, data });
  }

  /**
   * Sends a message to the active Web Worker.
   * @param {string} type
   * @param {MessagePayload} [data]
   */
  emitMessage(type, data) {
    this.#emit(type, data, true);
  }

  /**
   * Registers a handler for API calls coming from the Worker.
   * @param {string} type
   * @param {ApiHandlerCallback} callback
   */
  onApi(type, callback) {
    if (typeof callback !== 'function') throw new TypeError('Callback must be a function.');
    this.#apiHandlers.set(type, callback);
  }

  /**
   * Removes a registered API handler.
   * @param {string} type
   */
  offApi(type) {
    return this.#apiHandlers.delete(type);
  }

  /**
   * Sends an API request to the Web Worker and waits for the response.
   * @param {string} type - The API call identifier.
   * @param {MessagePayload} [data] - The request payload.
   * @param {number} [timeout=10000] - Maximum waiting time in milliseconds.
   * @returns {Promise<any>}
   */
  async emitApi(type, data, timeout = 10000) {
    checkDestroy(this.#isDestroyed);
    if (!this.#worker) throw new Error('Worker is not initialized.');

    const correlationId = crypto.randomUUID();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.#pendingRequests.has(correlationId)) {
          this.#pendingRequests.delete(correlationId);
          reject(new Error(`API request timeout: ${type} (ID: ${correlationId})`));
        }
      }, timeout);

      this.#pendingRequests.set(correlationId, { resolve, reject, timer });

      this.#worker?.postMessage({
        type,
        data,
        correlationId,
        isApi: true,
      });
    });
  }

  /**
   * Terminates the Web Worker immediately and cleans up listeners.
   */
  terminate() {
    if (this.#isDestroyed) return;

    if (this.#worker) {
      if (this.#messageHandler) this.#worker.removeEventListener('message', this.#messageHandler);
      if (this.#errorHandler) this.#worker.removeEventListener('error', this.#errorHandler);
      this.#worker.terminate();
      this.log('info', `Web Worker [${this.#id}] terminated.`);
    }

    this.#worker = null;
    this.#messageHandler = null;
    this.#errorHandler = null;
    this.#isReady = false;

    super.emit('ww:Terminated');
  }

  /**
   * Hard destroys the instance, clearing all references to avoid memory leaks.
   */
  destroy() {
    if (this.#isDestroyed) return;
    this.terminate();
    this.removeAllListeners();
    this.destroyPlugins();
    this.#isDestroyed = true;
    this.log('info', `[${this.#id}] Destroyed successfully.`);
  }
}

export default TinyWebWorker;
