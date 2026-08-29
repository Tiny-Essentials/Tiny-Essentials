import { getObjTypeRegistry, getObjTypeOrder } from '../../basics/objFilter.mjs';

const registry = getObjTypeRegistry();
const order = getObjTypeOrder();

/**
 * Represents a plugin used by the TinyCloner to identify and clone specific data types.
 *
 * @template {any} Value
 * @typedef {Object} CloningPlugin
 * @property {(value: Value) => boolean} canHandle - A function that accepts an item and returns true if the plugin is responsible for that type.
 * @property {(value: Value, isDeep: boolean, cloner: TinyCloner) => Value} clone - A function that accepts the item and the cloner instance, returning the cloned version.
 */

/**
 * @typedef {Object} TinyClonerOptions
 * @property {boolean} [useDefaultPlugins=false] - If true, the instance will be initialized with a copy of the default plugins and will ignore global defaults during the cloning process.
 */

/**
 * A class that performs deep cloning using a plugin-based architecture with advanced management capabilities.
 */
class TinyCloner {
  /** @type {boolean} */
  #useDefaultPlugins = false;

  /**
   * Creates an instance of TinyCloner.
   *
   * @param {TinyClonerOptions} [options={ useDefaultPlugins: false }] - Configuration options for the cloner instance.
   */
  constructor(options = { useDefaultPlugins: false }) {
    if (typeof options !== 'object' || options === null) {
      throw new TypeError('Options must be a non-null object.');
    }

    if (
      typeof options.useDefaultPlugins !== 'undefined' &&
      typeof options.useDefaultPlugins !== 'boolean'
    ) {
      throw new TypeError('The property "useDefaultPlugins" must be a boolean.');
    }

    this.#useDefaultPlugins = !!options.useDefaultPlugins;

    if (this.#useDefaultPlugins) {
      // Initialize instance with a copy of default plugins
      this.#plugins = TinyCloner.#defaultPlugins.map((p) => ({ ...p }));
    }
  }

  /**
   * Creates a default plugin specifically designed to handle plain JavaScript objects.
   *
   * @returns {CloningPlugin<Object.<string, any>>} A plugin object configured for object cloning.
   */
  static _createObjectPlugin() {
    return {
      canHandle: (item) => item !== null && typeof item === 'object',
      clone: (item, isDeep, cloner) => {
        /** @type {Record<string, any>} */
        const result = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            result[key] = isDeep ? cloner.clone(item[key], isDeep) : item[key];
          }
        }
        return result;
      },
    };
  }

  /**
   * @type {CloningPlugin<any>[]}
   */
  static #defaultPlugins = [];

  /**
   * Validates that a plugin object adheres to the required CloningPlugin interface.
   *
   * @template {any} T
   * @param {CloningPlugin<T>} plugin - The plugin object to validate.
   * @throws {TypeError} If the plugin does not implement the required 'canHandle' and 'clone' methods.
   */
  static validatePlugin(plugin) {
    if (typeof plugin?.canHandle !== 'function' || typeof plugin?.clone !== 'function') {
      throw new TypeError(
        'Each plugin must implement the required interface: canHandle(item) and clone(item, cloner).',
      );
    }
  }

  // --- Static Management (Global Defaults) ---

  /**
   * @returns {CloningPlugin<any>[]} A deep copy of the current default plugins array.
   */
  static get defaultPlugins() {
    return TinyCloner.#defaultPlugins.map((plugin) => ({ ...plugin }));
  }

  /**
   * @param {CloningPlugin<any>[]} newPlugins - An array of plugins to replace the current ones.
   * @throws {TypeError} If the input is not an array or if plugins do not implement the required interface.
   */
  static set defaultPlugins(newPlugins) {
    if (!Array.isArray(newPlugins)) {
      throw new TypeError('The defaultPlugins property must be an array.');
    }

    // Deep validation of the plugin structure to ensure runtime safety
    TinyCloner.#defaultPlugins = newPlugins.map((plugin) => {
      TinyCloner.validatePlugin(plugin);
      return { ...plugin };
    });
  }

  /**
   * Adds a new plugin to the default plugins registry.
   * @param {CloningPlugin<any>} plugin - The plugin to add.
   * @throws {TypeError} If the plugin is invalid.
   */
  static addDefaultPlugin(plugin) {
    TinyCloner.validatePlugin(plugin);
    TinyCloner.#defaultPlugins.push({ ...plugin });
  }

  /**
   * Removes default plugins that satisfy the provided predicate.
   * @param {(plugin: CloningPlugin<any>) => boolean} predicate - A function that returns true for plugins to be removed.
   */
  static filterDefaultPlugins(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('Predicate must be a function.');
    TinyCloner.#defaultPlugins = TinyCloner.#defaultPlugins.filter((p) => !predicate({ ...p }));
  }

  /**
   * Updates a default plugin at a specific index.
   * @param {number} index - The index of the plugin to update.
   * @param {CloningPlugin<any>} plugin - The new plugin configuration.
   * @throws {RangeError} If the index is out of bounds.
   */
  static updateDefaultPlugin(index, plugin) {
    if (index < 0 || index >= TinyCloner.#defaultPlugins.length) {
      throw new RangeError('Index out of bounds.');
    }
    TinyCloner.validatePlugin(plugin);
    TinyCloner.#defaultPlugins[index] = { ...plugin };
  }

  // --- Instance Management ---

  /**
   * @type {CloningPlugin<any>[]}
   */
  #plugins = [];

  /**
   * @returns {CloningPlugin<any>[]} A deep copy of the instance's plugins.
   */
  get plugins() {
    return this.#plugins.map((plugin) => ({ ...plugin }));
  }

  /**
   * @param {CloningPlugin<any>[]} newPlugins - An array of plugins to replace the current ones.
   * @throws {TypeError} If the input is not an array or if plugins do not implement the required interface.
   */
  set plugins(newPlugins) {
    if (!Array.isArray(newPlugins)) {
      throw new TypeError('The plugins property must be an array.');
    }

    // Deep validation of the plugin structure to ensure runtime safety
    this.#plugins = newPlugins.map((plugin) => {
      TinyCloner.validatePlugin(plugin);
      return { ...plugin };
    });
  }

  /**
   * Adds a new plugin to the instance.
   * @param {CloningPlugin<any>} plugin - The plugin to add.
   * @throws {TypeError} If the plugin is invalid.
   */
  addPlugin(plugin) {
    TinyCloner.validatePlugin(plugin);
    this.#plugins.push({ ...plugin });
  }

  /**
   * Removes instance plugins that satisfy the provided predicate.
   * @param {(plugin: CloningPlugin<any>) => boolean} predicate - A function that returns true for plugins to be removed.
   */
  filterPlugins(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('Predicate must be a function.');
    this.#plugins = this.#plugins.filter((p) => !predicate({ ...p }));
  }

  /**
   * Updates an instance plugin at a specific index.
   * @param {number} index - The index of the plugin to update.
   * @param {CloningPlugin<any>} plugin - The new plugin configuration.
   * @throws {RangeError} If the index is out of bounds.
   */
  updatePlugin(index, plugin) {
    if (index < 0 || index >= this.#plugins.length) {
      throw new RangeError('Index out of bounds.');
    }
    TinyCloner.validatePlugin(plugin);
    this.#plugins[index] = { ...plugin };
  }

  /**
   * Performs the cloning operation on the provided item.
   *
   * @template {any} Value
   * @param {Value} item - The item to be cloned.
   * @param {boolean} [isDeep=true] - Whether to perform a deep clone (true) or a shallow clone (false).
   * @returns {Value} The cloned version of the input item.
   */
  clone(item, isDeep = true) {
    // 1. Check instance plugins first
    for (const plugin of this.#plugins) {
      if (plugin.canHandle(item)) {
        return plugin.clone(item, isDeep, this);
      }
    }

    // 2. If useDefaultPlugins is false, check global defaults
    if (!this.#useDefaultPlugins) {
      for (const plugin of TinyCloner.#defaultPlugins) {
        if (plugin.canHandle(item)) {
          return plugin.clone(item, isDeep, this);
        }
      }
    }

    // Fallback for primitives and null
    return item;
  }
}

// Initializing default plugins
TinyCloner.defaultPlugins = order
  .filter((typeName) => registry[typeName]) // Ensures that the type exists in the record
  .map((typeName) => ({
    canHandle: registry[typeName].validator,
    clone: registry[typeName].cloner,
  }));

export default TinyCloner;
