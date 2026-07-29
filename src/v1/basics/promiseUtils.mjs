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
 * Creates a controller object that manages the execution state of an asynchronous function,
 * ensuring it only executes one instance at a time. If a task is already in progress,
 * subsequent calls to the callback will wait for the existing promise to resolve.
 *
 * @template {any} T
 * @template {any[]} A
 * @param {(...args: A) => Promise<T>} baseFunction - The asynchronous function to be wrapped.
 * @returns {{
 *   callback: (...args: A) => Promise<T>,
 *   getActivePromise: () => Promise<T> | null,
 *   resetActivePromise: () => void
 * }} An object containing the execution controller.
 * @throws {TypeError} If the provided baseFunction is not a function.
 */
export const createSingletonTask = (baseFunction) => {
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
   * The wrapped function returned to the user.
   *
   * @param {A} args - The arguments to pass to the base function.
   * @returns {Promise<T>} The result of the base function or the existing promise.
   */
  const callback = async (...args) => {
    // If a request is already in progress, return the existing promise.
    if (activePromise !== null) {
      return activePromise;
    }

    // Create the execution wrapper and ASSIGN it to activePromise
    activePromise = (async () => {
      try {
        const result = await baseFunction(...args);
        // Reset after success so the next call can start a new execution
        activePromise = null;
        return result;
      } catch (error) {
        // Reset on error to allow subsequent retry attempts.
        activePromise = null;
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
    activePromise = null;
  };

  return { callback, getActivePromise, resetActivePromise };
};
