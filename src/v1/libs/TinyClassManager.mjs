/**
 * @template {new (...args: any[]) => any} TBase
 * @template {new (...args: any[]) => any} TExtended
 * @typedef {Object} PluginDefinition
 * @property {string} name - The unique identifier for the plugin.
 * @property {string[]} [dependencies] - Array of plugin names required before applying this one.
 * @property {function(TBase): TExtended} apply - Function that receives the base class and returns the extended class.
 */

/**
 * Manages the composition of a base class with multiple optional plugins (Mixins).
 * @template {new (...args: any[]) => any} T
 */
class TinyClassManager {
  /**
   * @type {Set<string>}
   * Tracks the names of successfully applied plugins to prevent duplication and check dependencies.
   */
  #appliedPlugins = new Set();

  /**
   * Gets the list of plugins currently applied to this instance.
   * @returns {string[]} Array of applied plugin names.
   */
  get appliedPlugins() {
    return [...this.#appliedPlugins];
  }

  /**
   * Gets the total size of the current class chain hierarchy.
   * @returns {number} The count of applied plugins plus the core base.
   */
  get size() {
    return this.#appliedPlugins.size + 1;
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
   * Applies a plugin to the class chain if all conditions are met.
   * @template {new (...args: any[]) => any} R
   * @param {PluginDefinition<T, R>} plugin - The plugin module to be integrated.
   * @returns {TinyClassManager<R>} A new manager instance holding the extended class chain.
   * @throws {Error} Throws if instance is already consumed, plugin is duplicate, or dependencies are missing.
   */
  use(plugin) {
    if (this.#used) throw new Error(`[TinyClassManager] Cannot reuse a consumed manager instance.`);
    if (this.#appliedPlugins.has(plugin.name))
      throw new Error(`[TinyClassManager] Plugin conflict: "${plugin.name}" is already installed.`);

    /**
     * @type {string[]}
     * Extracted dependencies array with fallback for undefined properties.
     */
    const deps = plugin.dependencies || [];

    for (const dep of deps) {
      if (!this.#appliedPlugins.has(dep)) {
        throw new Error(
          `[TinyClassManager] Missing Dependency: "${plugin.name}" requires "${dep}" to be installed first.`,
        );
      }
    }

    const newClassManager = new TinyClassManager(plugin.apply(this.#currentClass));
    this.#appliedPlugins.forEach((name) => newClassManager.#appliedPlugins.add(name));
    newClassManager.#appliedPlugins.add(plugin.name);

    this.#used = true;
    this.#appliedPlugins.clear();
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
    this.#appliedPlugins.clear();
    return this.#currentClass;
  }
}

export default TinyClassManager;
