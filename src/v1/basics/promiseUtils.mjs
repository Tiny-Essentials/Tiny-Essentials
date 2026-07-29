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
 * Creates a wrapper function that ensures a provided asynchronous function
 * is only executed once at a time. If the function is already in progress,
 * subsequent calls will wait for the existing promise to resolve.
 *
 * @template {any} T
 * @template {any[]} A
 * @param {(...args: A) => Promise<T>} baseFunction - The asynchronous function to be wrapped.
 * @returns {(...args: A) => Promise<T>} A new function that manages the execution state.
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
  return async (...args) => {
    // If a request is already in progress, return the existing promise.
    if (activePromise !== null) {
      return activePromise;
    }

    // Create the execution wrapper
    return (async () => {
      try {
        const result = await baseFunction(...args);
        activePromise = null;
        return result;
      } catch (error) {
        // Reset the promise on error to allow subsequent retry attempts.
        activePromise = null;
        throw error;
      }
    })();
  };
};
