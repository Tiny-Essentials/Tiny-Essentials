/**
 * Waits until a provided function returns `true`, checking repeatedly at the defined interval.
 * Useful for polling asynchronous conditions.
 *
 * @param {() => boolean} getValue - A function that returns `true` when the condition is met.
 * @param {number} [checkInterval=100] - How often (in ms) to check the condition.
 * @returns {Promise<void>} Resolves when the condition is met.
 * @throws {TypeError} If arguments are invalid.
 */
export const waitForTrue = (getValue, checkInterval = 100) => {
  if (typeof getValue !== 'function') throw new TypeError(`Expected 'getValue' to be a function.`);
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
};

/**
 * @template {any} T
 * @template {any[]} A
 * @typedef {Object} SingletonTaskResult
 * @property {(...args: A) => Promise<T>} callback - The wrapped function that manages single execution.
 * @property {() => Promise<T> | null} getActivePromise - Returns the promise currently being executed or null if none is active.
 * @property {() => void} resetActivePromise - Forces a reset of the active promise, allowing an immediate new execution.
 * @property {() => boolean} isEnded - Returns true if the last execution (success or failure) has finished.
 * @property {() => boolean} isFailed - Returns true if the last execution resulted in an error.
 * @property {() => boolean} isLoading - Returns true if an execution is currently in progress.
 */

/**
 * Creates a controller object that manages the execution state of an asynchronous function,
 * ensuring it only executes one instance at a time.
 *
 * If a task is already in progress, subsequent calls to the callback will return
 * the exact same promise as the first call, preventing redundant operations.
 *
 * @template {any} T
 * @template {any[]} A
 * @param {(...args: A) => Promise<T>} baseFunction - The asynchronous function to be wrapped.
 * @param {boolean} [autoReset=true] - If true, the controller clears the active promise automatically
 * once the base function resolves or rejects. If false, the lock remains until `resetActivePromise` is called.
 * @returns {SingletonTaskResult<T, A>} An object containing the execution controller and state monitors.
 * @throws {TypeError} If the provided baseFunction is not a function.
 */
export const createSingletonTask = (baseFunction, autoReset = true) => {
  // Validation: Ensure the input is a function before proceeding.
  if (typeof baseFunction !== 'function') {
    throw new TypeError('The argument "baseFunction" must be a function.');
  }

  /**
   * @type {Promise<T> | null}
   * Stores the current active promise to prevent multiple simultaneous executions.
   */
  let activePromise = null;

  /**
   * Internal state tracking the lifecycle of the task.
   * @type {{ended: boolean, failed: boolean, loading: boolean}}
   */
  const status = {
    ended: false,
    failed: false,
    loading: false,
  };

  /**
   * The wrapped function returned to the user.
   *
   * @param {A} args - The arguments to pass to the base function.
   * @returns {Promise<T>} The result of the base function or the existing promise if already running.
   */
  const callback = async (...args) => {
    // If a request is already in progress, return the existing promise.
    if (activePromise !== null) {
      return activePromise;
    }

    status.loading = true;
    // Create the execution wrapper and ASSIGN it to activePromise
    activePromise = (async () => {
      try {
        const result = await baseFunction(...args);
        status.ended = true;
        status.failed = false;
        status.loading = false;
        // Reset after success so the next call can start a new execution
        if (autoReset) activePromise = null;
        return result;
      } catch (error) {
        status.ended = true;
        status.failed = true;
        status.loading = false;
        // Reset on error to allow subsequent retry attempts.
        if (autoReset) activePromise = null;
        throw error;
      }
    })();

    return activePromise;
  };

  /**
   * Returns the current active promise, or null if no task is running.
   * @returns {Promise<T> | null}
   */
  const getActivePromise = () => activePromise;

  /**
   * Resets the active promise state, allowing the next call to the callback to start a new execution.
   * @returns {void}
   */
  const resetActivePromise = () => {
    status.ended = false;
    status.failed = false;
    status.loading = false;
    activePromise = null;
  };

  const isEnded = () => status.ended;
  const isFailed = () => status.failed;
  const isLoading = () => status.loading;

  return { callback, getActivePromise, resetActivePromise, isEnded, isFailed, isLoading };
};
