/** @typedef {new (...args: any[]) => any} NewTinyClass */

/**
 * @template {NewTinyClass} TBase
 * @template {NewTinyClass} TExtended
 * @template {NewTinyClass[]} AppliedPluginClasses
 * @typedef {Object} PluginDefinition
 * @property {string} name - The unique identifier for the plugin.
 * @property {string[]} [dependencies] - Array of plugin names required before applying this one.
 * @property {(Base: TBase, classes: AppliedPluginClasses) => TExtended} apply - Function that receives the base class and returns the extended class.
 */

/**
 * Manages the composition of a base class with multiple optional plugins (Mixins).
 * @template {NewTinyClass} T
 * @template {T|NewTinyClass} oldT
 */
class TinyClassManager {
  /** @typedef {[...oldT[], T]} AppliedPluginClasses */

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
    if (this.#used) throw new Error(`[TinyClassManager] Cannot get a consumed manager instance.`);
    return [...this.#appliedPlugins];
  }

  /**
   * @type {AppliedPluginClasses}
   * Tracks the classes of successfully applied plugins to prevent duplication and check dependencies.
   */
  // @ts-ignore
  #appliedPluginClasses = [];

  /**
   * Gets the list of plugin classes currently applied to this instance.
   * @returns {AppliedPluginClasses} Array of applied plugin classes.
   */
  get appliedPluginClasses() {
    if (this.#used) throw new Error(`[TinyClassManager] Cannot get a consumed manager instance.`);
    return [...this.#appliedPluginClasses];
  }

  /**
   * Gets the total size of the current class chain hierarchy.
   * @returns {number} The count of applied plugins plus the core base.
   */
  get size() {
    if (this.#used) throw new Error(`[TinyClassManager] Cannot get a consumed manager instance.`);
    return this.#appliedPluginClasses.length;
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
    if (this.#used) throw new Error(`[TinyClassManager] Cannot get a consumed manager instance.`);
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
   * @param {oldT[]} [oldClasses=[]]
   */
  constructor(
    coreClass,
    // @ts-ignore
    oldClasses = [],
  ) {
    this.#currentClass = coreClass;
    this.#appliedPluginClasses = [...oldClasses, coreClass];
  }

  /**
   * Internal helper to validate dependencies, check conflicts, and transition state.
   * @template {NewTinyClass} R
   * @param {string} name - The plugin name.
   * @param {string[]} deps - The plugin dependencies.
   * @param {R} ExtendedClass - The newly extended class returned by the apply function.
   * @returns {TinyClassManager<R, T | oldT>} A new manager instance.
   */
  #validateAndTransition(name, deps, ExtendedClass) {
    // Verifies if the current manager has already been consumed to prevent branching.
    if (this.#used) throw new Error(`[TinyClassManager] Cannot reuse a consumed manager instance.`);

    // Checks if the plugin being inserted is already in the applied list.
    if (this.#appliedPlugins.has(name))
      throw new Error(`[TinyClassManager] Plugin conflict: "${name}" is already installed.`);

    for (const dep of deps) {
      if (!this.#appliedPlugins.has(dep)) {
        throw new Error(
          `[TinyClassManager] Missing Dependency: "${name}" requires "${dep}" to be installed first.`,
        );
      }
    }

    const newClassManager = new TinyClassManager(ExtendedClass, this.#appliedPluginClasses);
    this.#appliedPlugins.forEach((appliedName) => newClassManager.#appliedPlugins.add(appliedName));
    newClassManager.#appliedPlugins.add(name);

    this.#used = true;
    this.#appliedPlugins.clear();
    // @ts-ignore
    this.#appliedPluginClasses = [];

    return newClassManager;
  }

  /**
   * Applies a plugin to the class chain using a definition object.
   * @deprecated Use {@link insert} instead.
   * @template {NewTinyClass} R
   * @param {PluginDefinition<T, R, AppliedPluginClasses>} plugin - The plugin module to be integrated.
   * @returns {TinyClassManager<R, T | oldT>} A new manager instance holding the extended class chain.
   * @throws {Error} Throws if instance is already consumed, plugin is duplicate, or dependencies are missing.
   */
  use(plugin) {
    /**
     * @type {string[]}
     * Extracted dependencies array with fallback for undefined properties.
     */
    const deps = plugin.dependencies || [];

    /**
     * @type {R}
     * The new class generated by the old object-style apply wrapper.
     */
    const ExtendedClass = plugin.apply(this.#currentClass, this.appliedPluginClasses);

    return this.#validateAndTransition(plugin.name, deps, ExtendedClass);
  }

  /**
   * Inserts a plugin directly by passing its apply function.
   * It reads `_tinyDepName` and `_tinyDeps` statically from the returned class.
   * @template {NewTinyClass} R
   * @param {(ClassItem: T, classes: AppliedPluginClasses) => R} applyFn - Function that receives the base class and returns the extended class.
   * @returns {TinyClassManager<R, T | oldT>} A new manager instance holding the extended class chain.
   * @throws {Error} Throws if static properties are missing, instance is consumed, or validation fails.
   */
  insert(applyFn) {
    /** * @type {R}
     * The extended class returned directly from the provided function.
     */
    const ExtendedClass = applyFn(this.#currentClass, this.appliedPluginClasses);

    /**
     * @type {string}
     * The plugin name extracted from the static property.
     */
    // @ts-ignore
    const pluginName = ExtendedClass._tinyDepName;

    if (!pluginName) {
      throw new Error(
        `[TinyClassManager] Plugin class must define a static '_tinyDepName' property.`,
      );
    }

    /**
     * @type {string[]}
     * The dependencies extracted from the static property, defaulting to an empty array.
     */
    // @ts-ignore
    const deps = ExtendedClass._tinyDeps ?? [];

    if (!Array.isArray(deps) || !deps.every((name) => typeof name === 'string')) {
      throw new Error(
        `[TinyClassManager] Plugin class must define a static array of strings in '_tinyDepName' property.`,
      );
    }

    return this.#validateAndTransition(pluginName, deps, ExtendedClass);
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
    // @ts-ignore
    this.#appliedPluginClasses = [];
    return this.#currentClass;
  }
}

export default TinyClassManager;
