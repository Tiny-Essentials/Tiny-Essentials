/**
 * Creates a internal method to verify if the instance was been destroyed.
 * @param {string} name
 */
export const createCheckDestroyed =
  (name) =>
  /**
   * Internal method to verify if the instance has been destroyed.
   * Throws an error if any operation is attempted after destruction.
   * @param {boolean} isDestroyed
   * @throws {Error}
   * @returns {void}
   */
  (isDestroyed) => {
    if (isDestroyed)
      throw new Error(`This ${name} instance has been destroyed and can no longer be used.`);
  };
