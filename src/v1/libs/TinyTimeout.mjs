import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('TinyTimeout');

/**
 * A utility class to manage dynamically adjusted timeouts based on how often
 * each unique ID is triggered. Also provides polling support for asynchronous conditions.
 */
class TinyTimeout {
  /** @type {boolean} Whether this instance has been destroyed. */
  #isDestroyed = false;

  /** @type {boolean} Whether to allow auto-updating an ID's timeout config if `value` changes. */
  #allowAutoConfigChange;

  /** @type {number} The interval time (ms) used to decrement cooldown counters. */
  #cooldownWatcherTime;

  /** @type {NodeJS.Timeout|null} Reference to the internal cooldown interval. */
  #cooldownWatcher = null;

  /**
   * Internal map that keeps track of how many times each ID has been triggered,
   * along with the base multiplier used to calculate delays.
   *
   * @type {Map<string, { value: number, now: number }>}
   */
  #timeoutFixer = new Map();

  /**
   * Creates a new instance of TinyTimeout.
   *
   * @param {Object} [options={}] Optional configuration object.
   * @param {number} [options.cooldownWatcherTime=5000] Interval in milliseconds for reducing `now` counters.
   * @param {boolean} [options.allowAutoConfigChange=false] Whether to allow auto value changes for existing IDs.
   */
  constructor({ cooldownWatcherTime = 5000, allowAutoConfigChange = false } = {}) {
    if (!Number.isFinite(cooldownWatcherTime) || cooldownWatcherTime <= 0)
      throw new TypeError(`Expected 'cooldownWatcherTime' to be a positive number.`);
    if (typeof allowAutoConfigChange !== 'boolean')
      throw new TypeError(`Expected 'allowAutoConfigChange' to be a boolean.`);
    this.#cooldownWatcherTime = cooldownWatcherTime;
    this.#allowAutoConfigChange = allowAutoConfigChange;
    this.setCooldownWatcherTime(cooldownWatcherTime);
  }

  /**
   * Whether this instance has been destroyed and is no longer usable.
   *
   * @returns {boolean}
   */
  isDestroyed() {
    return this.#isDestroyed;
  }

  /**
   * Whether auto config change is enabled.
   *
   * @returns {boolean}
   */
  getAllowAutoConfigChange() {
    checkDestroy(this.#isDestroyed);
    return this.#allowAutoConfigChange;
  }

  /**
   * Gets the interval time used for cooldown decrementing.
   *
   * @returns {number}
   */
  getCooldownWatcherTime() {
    checkDestroy(this.#isDestroyed);
    return this.#cooldownWatcherTime;
  }

  /**
   * Sets whether to allow auto-updating an ID's timeout config if `value` changes.
   *
   * @param {boolean} value
   */
  setAllowAutoConfigChange(value) {
    checkDestroy(this.#isDestroyed);
    if (typeof value !== 'boolean') throw new TypeError(`Expected 'value' to be a boolean.`);
    this.#allowAutoConfigChange = value;
  }

  /**
   * Sets the cooldown watcher interval time.
   * Automatically resets the interval if it was already running.
   *
   * @param {number} value
   */
  setCooldownWatcherTime(value) {
    checkDestroy(this.#isDestroyed);
    if (this.#isDestroyed) throw new Error('TinyTimeout has been destroyed.');
    if (!Number.isFinite(value) || value <= 0)
      throw new TypeError(`Expected 'value' to be a positive number.`);

    this.#cooldownWatcherTime = value;

    if (this.#cooldownWatcher) clearInterval(this.#cooldownWatcher);
    this.#cooldownWatcher = setInterval(() => {
      this.#timeoutFixer.forEach((data) => {
        if (data.now > 0) data.now--;
      });
    }, this.#cooldownWatcherTime);
  }

  /**
   * Schedules a callback using a dynamically adjusted timeout based on usage frequency.
   * The more often an ID is triggered, the longer the timeout becomes,
   * scaled by the provided `value`. Optionally, the delay can be limited by `limit`.
   *
   * @param {string} id - A unique identifier to track timeout usage.
   * @param {Function} callback - The function to execute after the delay.
   * @param {number} value - Base delay multiplier in milliseconds.
   * @param {number|null} [limit=null] - Optional maximum delay cap.
   * @returns {number} Handle to the scheduled timeout.
   * @throws {Error} Throws if the instance has been destroyed or arguments are invalid.
   */
  set(id, callback, value, limit = null) {
    checkDestroy(this.#isDestroyed);
    if (this.#isDestroyed) throw new Error('TinyTimeout has been destroyed.');
    if (typeof id !== 'string' || id.trim() === '')
      throw new TypeError(`Expected 'id' to be a non-empty string.`);
    if (typeof callback !== 'function')
      throw new TypeError(`Expected 'callback' to be a function.`);
    if (!Number.isFinite(value) || value < 0)
      throw new TypeError(`Expected 'value' to be a non-negative number.`);
    if (limit !== null && (!Number.isFinite(limit) || limit < 0))
      throw new TypeError(`Expected 'limit' to be null or a non-negative number.`);

    let entry = this.#timeoutFixer.get(id);
    if (!entry || (this.#allowAutoConfigChange && value !== entry.value)) {
      entry = { value, now: 0 };
      this.#timeoutFixer.set(id, entry);
    }

    const delay = entry.value * entry.now;
    entry.now++;

    return setTimeout(callback, typeof limit === 'number' ? Math.min(delay, limit) : delay);
  }

  /**
   * Waits until a provided function returns `true`, checking repeatedly at the defined interval.
   * Useful for polling asynchronous conditions.
   *
   * @param {() => boolean} getValue - A function that returns `true` when the condition is met.
   * @param {number} [checkInterval=100] - How often (in ms) to check the condition.
   * @returns {Promise<void>} Resolves when the condition is met.
   * @throws {TypeError} If arguments are invalid.
   */
  static waitForTrue(getValue, checkInterval = 100) {
    if (typeof getValue !== 'function')
      throw new TypeError(`Expected 'getValue' to be a function.`);
    if (!Number.isFinite(checkInterval) || checkInterval <= 0)
      throw new TypeError(`Expected 'checkInterval' to be a positive number.`);

    return new Promise((resolve) => {
      const interval = setInterval(() => {
        if (getValue()) {
          clearInterval(interval);
          resolve();
        }
      }, checkInterval);
    });
  }

  /**
   * Instance version of `waitForTrue`, which defaults to using the instance's
   * cooldownWatcherTime if not explicitly provided.
   *
   * @param {() => boolean} getValue - A function that returns `true` when the condition is met.
   * @param {number|null} [checkInterval=100] - How often (in ms) to check the condition.
   * @returns {Promise<void>} Resolves when the condition is met.
   * @throws {Error} If the instance is destroyed or arguments are invalid.
   */
  waitForTrue(getValue, checkInterval = 100) {
    checkDestroy(this.#isDestroyed);
    if (this.#isDestroyed) throw new Error('TinyTimeout has been destroyed.');
    if (typeof getValue !== 'function')
      throw new TypeError(`Expected 'getValue' to be a function.`);
    if (checkInterval !== null && (!Number.isFinite(checkInterval) || checkInterval <= 0))
      throw new TypeError(`Expected 'checkInterval' to be null or a positive number.`);
    return TinyTimeout.waitForTrue(getValue, checkInterval ?? this.#cooldownWatcherTime);
  }

  /**
   * Cleans up all internal references and stops the cooldown watcher.
   * After calling this, the instance becomes unusable.
   */
  destroy() {
    if (this.#isDestroyed) return;
    if (this.#cooldownWatcher) clearInterval(this.#cooldownWatcher);
    this.#cooldownWatcher = null;
    this.#timeoutFixer.clear();
    this.#isDestroyed = true;
  }
}

export default TinyTimeout;
