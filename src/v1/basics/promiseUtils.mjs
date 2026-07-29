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
