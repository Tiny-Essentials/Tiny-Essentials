import { EventEmitter } from 'events';
import TinyPromiseQueue from './TinyPromiseQueue.mjs';
import { waitForTrue } from '../../basics/promiseUtils.mjs';
import TinyTimeout from '../math/TinyTimeout.mjs';
import { createCheckDestroyed } from './tools.mjs';

const checkDestroy = createCheckDestroyed('TinyThrottledApi');

/**
 * @template T
 * @typedef {Promise<T>} QueueResult
 * Represents the eventual result of a queued operation.
 */

/**
 * Event map for {@link TinyThrottledApi}.
 * @typedef {Object} TinyThrottledApiEvents
 * @property {(id: string) => void} ExecTask - Emitted when a task starts executing.
 * @property {(id: string) => void} TaskEnded - Emitted when a task finishes executing.
 * @property {(id: string) => void} WaitingTask - Emitted when a task is queued and waiting for a slot.
 * @property {() => void} Destroyed - Emitted when the instance is destroyed.
 * @property {(value: number) => void} SetConcurrencyLimit - Emitted when the concurrency limit changes.
 * @property {(value: number) => void} SetTimeoutValue - Emitted when the timeout value changes.
 * @property {(value: number) => void} SetTimeoutLimit - Emitted when the timeout limit changes.
 */

/** @type {new () => import('../../jsdoc/EventEmitter.mjs').ICustomEventEmitter<TinyThrottledApiEvents>} */
const TypedEventEmitter = /** @type {any} */ (EventEmitter);

/**
 * A client that manages asynchronous requests with a concurrency limit.
 * It uses TinyPromiseQueue to manage waiting tasks and waitForTrue to poll for availability.
 * @template {(...args: any) => Promise<any>} API
 */
class TinyThrottledApi extends TypedEventEmitter {
  static TinyTimeout = TinyTimeout;
  /** @type {number} The current number of active asynchronous operations. */
  #activeCount = 0;
  /** @type {number} The maximum number of concurrent operations allowed. */
  #concurrencyLimit;
  /** @type {TinyPromiseQueue} The internal queue used to manage pending tasks. */
  #queue = new TinyPromiseQueue();
  /** @type {API} The target API function to be executed. */
  #api;
  /** @type {TinyTimeout|null} The optional timeout instance to regulate execution frequency. */
  #timeoutInstance;
  /** @type {number} - Base delay multiplier in milliseconds. */
  #timeoutValue = 100;
  /** @type {number|null} - Optional maximum delay cap. */
  #timeoutLimit = 5000;
  /** @type {boolean} Indicates whether the instance has been destroyed. */
  #isDestroyed = false;
  /** @type {boolean} Indicates whether the first execution should be delayed by the timeout. */
  #timeoutFirst = false;

  /**
   * Initializes a new instance of the TinyThrottledApi class.
   *
   * @param {number} concurrencyLimit - The maximum number of simultaneous requests.
   * @param {API} api - The API implementation.
   * @param {TinyTimeout|null} [timeoutInstance=null] - Optional TinyTimeout instance to regulate execution frequency.
   * @throws {TypeError} If concurrencyLimit is not a positive number.
   * @throws {TypeError} If API is not a function.
   */
  constructor(concurrencyLimit, api, timeoutInstance = null) {
    super();
    if (typeof concurrencyLimit !== 'number' || concurrencyLimit <= 0) {
      throw new TypeError('Concurrency limit must be a positive number.');
    }
    if (typeof api !== 'function') {
      throw new TypeError('API must be a function.');
    }
    if (
      typeof timeoutInstance !== 'undefined' &&
      timeoutInstance !== null &&
      !(timeoutInstance instanceof TinyTimeout)
    ) {
      throw new TypeError('timeoutInstance must be a TinyTimeout instance.');
    }

    this.#concurrencyLimit = concurrencyLimit;
    this.#api = api;
    this.#timeoutInstance = timeoutInstance ?? null;
  }

  /**
   * Executes an API request, respecting the concurrency limit and optional rate limiting.
   *
   * @param {Parameters<API>} args
   * @returns {QueueResult<ReturnType<API>>} A promise that resolves with the API result.
   * @throws {TypeError} If the internal state is corrupted.
   */
  async exec(...args) {
    checkDestroy(this.#isDestroyed);
    const id = crypto.randomUUID(); // Using UUID for better collision resistance

    // If we are under the limit, reserve the slot SYNCHRONOUSLY to prevent race conditions.
    if (this.#activeCount < this.#concurrencyLimit) {
      this.#activeCount++;
      this.emit('ExecTask', id);
      const final = await this.#performRequest(...args);
      this.emit('TaskEnded', id);
      return final;
    }

    // If we reached the limit, queue a task that waits for a slot.
    return this.#queue.enqueue(
      async () => {
        this.emit('WaitingTask', id);
        // The task in the queue waits until a slot is available via polling.
        const waitCounter = () => waitForTrue(() => this.#activeCount < this.#concurrencyLimit);

        // If a TinyTimeout instance is provided, we wait for its next scheduled "tick".
        // This introduces a dynamic delay that increases as more tasks are processed.
        const waitTimeout = async () => {
          if (this.#timeoutInstance) {
            await new Promise((resolve) => {
              // We use a constant ID so the frequency is tracked across all calls to this instance.
              if (this.#timeoutInstance)
                this.#timeoutInstance.set(
                  'api_throttle',
                  resolve,
                  this.#timeoutValue,
                  this.#timeoutLimit,
                );
              else resolve(undefined);
            });
          }
        };

        if (this.#timeoutFirst) {
          await waitTimeout();
          await waitCounter();
        } else {
          await waitCounter();
          await waitTimeout();
        }

        // Once available and the throttle allows, we reserve the slot.
        this.#activeCount++;
        this.emit('ExecTask', id);
        const final = await this.#performRequest(...args);
        this.emit('TaskEnded', id);
        return final;
      },
      undefined,
      id,
    );
  }

  /**
   * Cleans up the instance, removing all listeners and stopping pending tasks.
   * @returns {void}
   */
  destroy() {
    if (this.#isDestroyed) return;
    this.removeAllListeners();
    this.#isDestroyed = true;
    this.emit('Destroyed');
  }

  /**
   * Internal method to handle the actual execution and counter management.
   *
   * @param {Parameters<API>} args
   * @returns {QueueResult<ReturnType<API>>}
   */
  async #performRequest(...args) {
    try {
      const apiFunction = this.#api;
      return await apiFunction(...args);
    } finally {
      // The decrement happens here, ensuring the slot is released even on failure.
      this.#activeCount--;
    }
  }

  /**
   * Returns whether the instance has been destroyed.
   * @returns {boolean}
   */
  get isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Gets the internal task queue.
   * @returns {TinyPromiseQueue} The internal task queue.
   */
  get queue() {
    checkDestroy(this.#isDestroyed);
    return this.#queue;
  }

  /**
   * Gets the original API function.
   * @returns {API} The original API function.
   */
  get api() {
    checkDestroy(this.#isDestroyed);
    return this.#api;
  }

  /**
   * Gets the current concurrency limit.
   * @returns {number} The current concurrency limit.
   */
  get concurrencyLimit() {
    checkDestroy(this.#isDestroyed);
    return this.#concurrencyLimit;
  }

  /**
   * Sets a new concurrency limit.
   * @param {number} value - The new maximum number of simultaneous requests.
   * @throws {TypeError} If value is not a positive number.
   */
  set concurrencyLimit(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number' || value <= 0) {
      throw new TypeError('Concurrency limit must be a positive number.');
    }
    this.#concurrencyLimit = value;
    this.emit('SetConcurrencyLimit', value);
  }

  /**
   * Gets the current TinyTimeout instance used for rate limiting.
   * @returns {TinyTimeout|null}
   */
  get timeoutInstance() {
    checkDestroy(this.#isDestroyed);
    return this.#timeoutInstance;
  }

  /**
   * Gets the current base delay multiplier in milliseconds.
   * @returns {number}
   */
  get timeoutValue() {
    checkDestroy(this.#isDestroyed);
    return this.#timeoutValue;
  }

  /**
   * Sets a new base delay multiplier in milliseconds.
   * @param {number} value - The new base delay multiplier.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is a negative number.
   */
  set timeoutValue(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number') {
      throw new TypeError('Timeout value must be a number.');
    }
    if (value < 0) {
      throw new RangeError('Timeout value cannot be negative.');
    }
    this.#timeoutValue = value;
    this.emit('SetTimeoutValue', value);
  }

  /**
   * Gets the current maximum delay cap.
   * @returns {number|null}
   */
  get timeoutLimit() {
    checkDestroy(this.#isDestroyed);
    return this.#timeoutLimit;
  }

  /**
   * Gets whether the first execution should be delayed by the timeout.
   * @returns {boolean}
   */
  get timeoutFirst() {
    return this.#timeoutFirst;
  }

  /**
   * Sets whether the first execution should be delayed by the timeout.
   * @param {boolean} value - The new boolean value.
   * @throws {TypeError} If the value is not a boolean.
   */
  set timeoutFirst(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('timeoutFirst must be a boolean.');
    }
    this.#timeoutFirst = value;
  }

  /**
   * Sets a new maximum delay cap.
   * @param {number} value - The new maximum delay cap.
   * @throws {TypeError} If the value is not a number.
   * @throws {RangeError} If the value is a negative number.
   */
  set timeoutLimit(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'number') {
      throw new TypeError('Timeout limit must be a number.');
    }
    if (value < 0) {
      throw new RangeError('Timeout limit cannot be negative.');
    }
    this.#timeoutLimit = value;
    this.emit('SetTimeoutLimit', value);
  }

  /**
   * Returns the number of currently active requests.
   *
   * @returns {number}
   */
  get activeCount() {
    checkDestroy(this.#isDestroyed);
    return this.#activeCount;
  }

  /**
   * Returns the number of tasks waiting in the queue.
   *
   * @returns {number}
   */
  get queuedCount() {
    checkDestroy(this.#isDestroyed);
    return this.#queue.getQueuedIds().length;
  }
}

export default TinyThrottledApi;
