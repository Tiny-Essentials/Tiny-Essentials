/**
 * @template {new (...args: any[]) => any} TBase
 * @template {new (...args: any[]) => any} TExtended
 * @typedef {Object} ModuleDefinition
 * @property {string} name - The unique identifier for the module (DLC).
 * @property {string[]} [dependencies] - Array of module names required before applying this one.
 * @property {function(TBase): TExtended} apply - Function that receives the base class and returns the extended class.
 */

/**
 * Manages the composition of a base class with multiple optional modules (Mixins).
 * @template {new (...args: any[]) => any} T
 */
class TinyClassManager {
  /**
   * @type {Set<string>}
   * Tracks the names of successfully applied modules to prevent duplication and check dependencies.
   */
  #appliedModules = new Set();

  /**
   * Gets the list of modules currently applied to this instance.
   * @returns {string[]} Array of applied module names.
   */
  get appliedModules() {
    return [...this.#appliedModules];
  }

  /**
   * Gets the total size of the current class chain hierarchy.
   * @returns {number} The count of applied modules plus the core base.
   */
  get size() {
    return this.#appliedModules.size + 1;
  }

  /**
   * @type {T}
   * Holds the current state of the class chain.
   */
  #currentClass;

  /**
   * Holds the current state of the class chain.
   */
  get currentClass() {
    return this.#currentClass;
  }

  /**
   * Protects the instance from being consumed or reused after transition.
   */
  #used = false;

  /**
   * Protects the instance from being consumed or reused after transition.
   */
  get used() {
    return this.#used;
  }

  /**
   * Initializes the manager with a core class.
   * @param {T} coreClass - The foundational class to be extended.
   */
  constructor(coreClass) {
    this.#currentClass = coreClass;
  }

  /**
   * Applies a module to the class chain if all conditions are met.
   * @template {new (...args: any[]) => any} R
   * @param {ModuleDefinition<T, R>} module - The DLC module to be integrated.
   * @returns {TinyClassManager<R>} A new manager instance holding the extended class chain.
   * @throws {Error} Throws if instance is already consumed, module is duplicate, or dependencies are missing.
   */
  use(module) {
    if (this.#used) throw new Error(`[TinyClassManager] Cannot reuse a consumed manager instance.`);
    if (this.#appliedModules.has(module.name))
      throw new Error(`[TinyClassManager] Module conflict: "${module.name}" is already installed.`);

    /**
     * @type {string[]}
     * Extracted dependencies array with fallback for undefined properties.
     */
    const deps = module.dependencies || [];

    for (const dep of deps) {
      if (!this.#appliedModules.has(dep)) {
        throw new Error(
          `[TinyClassManager] Missing Dependency: "${module.name}" requires "${dep}" to be installed first.`,
        );
      }
    }

    const newClassManager = new TinyClassManager(module.apply(this.#currentClass));
    this.#appliedModules.forEach((name) => newClassManager.#appliedModules.add(name));
    newClassManager.#appliedModules.add(module.name);

    this.#used = true;
    return newClassManager;
  }

  /**
   * Finalizes the composition and returns the fully built class.
   * @returns {T} The final class representing the last extended version in the chain.
   * @throws {Error} Throws if the manager instance has already been used or finalized.
   */
  build() {
    if (this.#used)
      throw new Error(`[TinyClassManager] Cannot build from an already finalized manager.`);
    this.#used = true;
    return this.#currentClass;
  }
}

export default TinyClassManager;
