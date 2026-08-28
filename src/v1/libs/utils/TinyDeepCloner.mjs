/**
 * @template {any} Value
 * @typedef {Object} CloningPlugin
 * @property {(value: Value) => boolean} canHandle - A function that accepts an item and returns true if the plugin is responsible for that type.
 * @property {(value: Value, instance: TinyDeepCloner) => Value} clone - A function that accepts the item and the cloner instance, returning the cloned version.
 */

/**
 * A class that performs deep cloning using a plugin-based architecture.
 */
class TinyDeepCloner {
  /**
   * @type {CloningPlugin<any>[]}
   */
  #plugins = [];

  constructor() {
    // Plugins are pre-installed in the exact order of the original function
    this.#plugins = [
      this.#createMapPlugin(),
      this.#createArrayPlugin(),
      this.#createObjectPlugin(),
    ];
  }

  /**
   * @template {any} T
   * @param {CloningPlugin<T>} plugin
   */
  validatePlugin(plugin) {
    if (typeof plugin?.canHandle !== 'function' || typeof plugin?.clone !== 'function') {
      throw new TypeError(
        'Each plugin must implement the required interface: canHandle(item) and clone(item, cloner).',
      );
    }
  }

  /**
   * @returns {CloningPlugin<any>[]} A shallow copy of the current plugins array.
   */
  get plugins() {
    return [...this.#plugins];
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
    newPlugins.forEach((plugin) => this.validatePlugin(plugin));

    this.#plugins = [...newPlugins];
  }

  /**
   * @template {any} Value
   * Performs the deep clone operation.
   * @param {Value} item - The item to be cloned.
   * @returns {Value} The deep cloned item.
   */
  clone(item) {
    // Iterate through plugins; the first one that returns true for canHandle wins.
    // This preserves the original if/else priority.
    for (const plugin of this.#plugins) {
      if (plugin.canHandle(item)) {
        return plugin.clone(item, this);
      }
    }

    // Fallback for primitives and null (the original "Step 4")
    return item;
  }

  /**
   * @returns {CloningPlugin<Map<any, any>>}
   */
  #createMapPlugin() {
    return {
      canHandle: (item) => item instanceof Map,
      clone: (item, cloner) => {
        const result = new Map();
        for (const [key, value] of item.entries()) {
          // Recursively call the cloner via the passed reference
          result.set(key, cloner.clone(value));
        }
        return result;
      },
    };
  }

  /**
   * @returns {CloningPlugin<any[]>}
   */
  #createArrayPlugin() {
    return {
      canHandle: (item) => Array.isArray(item),
      clone: (item, cloner) => item.map((element) => cloner.clone(element)),
    };
  }

  /**
   * @returns {CloningPlugin<Record<string, any>>}
   */
  #createObjectPlugin() {
    return {
      canHandle: (item) => item !== null && typeof item === 'object',
      clone: (item, cloner) => {
        /** @type {Record<string, any>} */
        const result = {};
        for (const key in item) {
          if (Object.prototype.hasOwnProperty.call(item, key)) {
            result[key] = cloner.clone(item[key]);
          }
        }
        return result;
      },
    };
  }
}

export default TinyDeepCloner;
