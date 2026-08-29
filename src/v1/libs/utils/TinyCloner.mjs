import { getObjTypeRegistry, getObjTypeOrder } from '../../basics/objFilter.mjs';

const registry = getObjTypeRegistry();
const order = getObjTypeOrder();

/**
 * Represents a plugin used by the TinyCloner to identify and clone specific data types.
 *
 * @template {any} Value
 * @typedef {Object} CloningPlugin
 * @property {string} id - The function id.
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

  get useDefaultPlugins() {
    return this.#useDefaultPlugins;
  }

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
   * @param {string} id - The function id.
   * @returns {CloningPlugin<Object.<string, any>>} A plugin object configured for object cloning.
   */
  static _createObjectPlugin(id) {
    if (typeof id !== 'string') throw new TypeError('Id must be a string.');
    return {
      id,
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
    if (typeof plugin?.id !== 'string')
      throw new TypeError(
        'Each plugin must implement the required interface: the plugin id string.',
      );
  }

  // --- Static Management (Global Defaults) ---

  /**
   * @returns {CloningPlugin<any>[]} A deep copy of the current default plugins array.
   */
  static get plugins() {
    return TinyCloner.#defaultPlugins.map((plugin) => ({ ...plugin }));
  }

  /**
   * @returns {number} The total number of default plugins registered.
   */
  static get pluginsLength() {
    return TinyCloner.#defaultPlugins.length;
  }

  /**
   * @returns {string[]} An array containing the unique IDs of all default plugins.
   */
  static get pluginsIds() {
    return TinyCloner.#defaultPlugins.map((p) => p.id);
  }

  /**
   * @param {CloningPlugin<any>[]} newPlugins - An array of plugins to replace the current ones.
   * @throws {TypeError} If the input is not an array or if plugins do not implement the required interface.
   */
  static set plugins(newPlugins) {
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
   * Adds a new plugin to the default plugins registry at a specified position.
   *
   * @param {CloningPlugin<any>} plugin - The plugin to add.
   * @param {'start' | 'end' | 'index'} [position='start'] - The position where the plugin should be inserted.
   * @param {number} [index=0] - The specific index to use if position is set to 'index'.
   * @throws {TypeError} If the plugin is invalid, the position is unrecognized, or index is not a valid integer.
   */
  static addPlugin(plugin, position = 'start', index = 0) {
    TinyCloner.validatePlugin(plugin);
    const pluginCopy = { ...plugin };

    if (position === 'start') {
      TinyCloner.#defaultPlugins.unshift(pluginCopy);
    } else if (position === 'end') {
      TinyCloner.#defaultPlugins.push(pluginCopy);
    } else if (position === 'index') {
      if (!Number.isInteger(index) || index < 0) {
        throw new TypeError('When position is "index", the index must be a non-negative integer.');
      }
      TinyCloner.#defaultPlugins.splice(index, 0, pluginCopy);
    } else {
      throw new TypeError('Position must be "start", "end", or "index".');
    }
  }

  /**
   * Removes default plugins that satisfy the provided predicate.
   * @param {(plugin: CloningPlugin<any>) => boolean} predicate - A function that returns true for plugins to be removed.
   */
  static filterPlugins(predicate) {
    if (typeof predicate !== 'function') throw new TypeError('Predicate must be a function.');
    TinyCloner.#defaultPlugins = TinyCloner.#defaultPlugins.filter((p) => !predicate({ ...p }));
  }

  /**
   * Updates a default plugin at a specific index.
   * @param {number} index - The index of the plugin to update.
   * @param {CloningPlugin<any>} plugin - The new plugin configuration.
   * @throws {RangeError} If the index is out of bounds.
   */
  static updatePlugin(index, plugin) {
    if (index < 0 || index >= TinyCloner.#defaultPlugins.length) {
      throw new RangeError('Index out of bounds.');
    }
    TinyCloner.validatePlugin(plugin);
    TinyCloner.#defaultPlugins[index] = { ...plugin };
  }

  /**
   * Reorders the default plugins array.
   * @param {((a: CloningPlugin<any>, b: CloningPlugin<any>) => number)} [compareFn] - The function to make the new order of plugins.
   */
  static reorderPlugins(compareFn) {
    TinyCloner.#defaultPlugins = TinyCloner.#defaultPlugins.sort(
      compareFn ? (a, b) => compareFn({ ...a }, { ...b }) : undefined,
    );
  }

  // --- Instance Management ---

  /**
   * @type {CloningPlugin<any>[]}
   */
  #plugins = [];

  /**
   * @returns {number} The total number of plugins registered in this specific instance.
   */
  get pluginsLength() {
    return this.#plugins.length;
  }

  /**
   * @returns {string[]} An array containing the unique IDs of all plugins in this instance.
   */
  get pluginIds() {
    return this.#plugins.map((p) => p.id);
  }

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
   * Adds a new plugin to the instance at a specified position.
   *
   * @param {CloningPlugin<any>} plugin - The plugin to add.
   * @param {'start' | 'end' | 'index'} [position='start'] - The position where the plugin should be inserted.
   * @param {number} [index=0] - The specific index to use if position is set to 'index'.
   * @throws {TypeError} If the plugin is invalid, the position is unrecognized, or index is not a valid integer.
   */
  addPlugin(plugin, position = 'start', index = 0) {
    TinyCloner.validatePlugin(plugin);
    const pluginCopy = { ...plugin };

    if (position === 'start') {
      this.#plugins.unshift(pluginCopy);
    } else if (position === 'end') {
      this.#plugins.push(pluginCopy);
    } else if (position === 'index') {
      if (!Number.isInteger(index) || index < 0) {
        throw new TypeError('When position is "index", the index must be a non-negative integer.');
      }
      this.#plugins.splice(index, 0, pluginCopy);
    } else {
      throw new TypeError('Position must be "start", "end", or "index".');
    }
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
   * Reorders the instance's plugins array.
   * @param {((a: CloningPlugin<any>, b: CloningPlugin<any>) => number)} [compareFn] - The function to make the new order of plugins.
   */
  reorderPlugins(compareFn) {
    this.#plugins = this.#plugins.sort(
      compareFn ? (a, b) => compareFn({ ...a }, { ...b }) : undefined,
    );
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
TinyCloner.plugins = order
  .filter((typeName) => registry[typeName]) // Ensures that the type exists in the record
  .map((typeName) => ({
    id: typeName,
    canHandle: registry[typeName].validator,
    clone: registry[typeName].cloner,
  }));

export default TinyCloner;
