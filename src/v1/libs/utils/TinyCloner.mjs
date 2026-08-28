/**
 * @template {any} Value
 * @typedef {Object} CloningPlugin
 * @property {(value: Value) => boolean} canHandle - A function that accepts an item and returns true if the plugin is responsible for that type.
 * @property {(value: Value, isDeep: boolean, instance: TinyCloner) => Value} clone - A function that accepts the item and the cloner instance, returning the cloned version.
 */

/**
 * A class that performs deep cloning using a plugin-based architecture.
 */
class TinyCloner {
  /**
   * @type {CloningPlugin<any>[]}
   */
  static #defaultPlugins = [];

  /**
   * @template {any} T
   * @param {CloningPlugin<T>} plugin
   */
  static validatePlugin(plugin) {
    if (typeof plugin?.canHandle !== 'function' || typeof plugin?.clone !== 'function') {
      throw new TypeError(
        'Each plugin must implement the required interface: canHandle(item) and clone(item, cloner).',
      );
    }
  }

  /**
   * @returns {CloningPlugin<any>[]} A shallow copy of the current plugins array.
   */
  static get defaultPlugins() {
    return [...TinyCloner.#defaultPlugins.map((plugin) => ({ ...plugin }))];
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
    TinyCloner.#defaultPlugins = [
      ...newPlugins.map((plugin) => {
        TinyCloner.validatePlugin(plugin);
        return { ...plugin };
      }),
    ];
  }

  /**
   * @type {CloningPlugin<any>[]}
   */
  #plugins = [];

  /**
   * @returns {CloningPlugin<any>[]} A shallow copy of the current plugins array.
   */
  get plugins() {
    return [...this.#plugins.map((plugin) => ({ ...plugin }))];
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
    this.#plugins = [
      ...newPlugins.map((plugin) => {
        TinyCloner.validatePlugin(plugin);
        return { ...plugin };
      }),
    ];
  }

  /**
   * @template {any} Value
   * Performs the deep clone operation.
   * @param {Value} item - The item to be cloned.
   * @param {boolean} isDeep
   * @returns {Value} The deep cloned item.
   */
  clone(item, isDeep = true) {
    // Iterate through plugins; the first one that returns true for canHandle wins.
    // This preserves the original if/else priority.
    for (const plugin of this.#plugins) {
      if (plugin.canHandle(item)) {
        return plugin.clone(item, isDeep, this);
      }
    }

    for (const plugin of TinyCloner.#defaultPlugins) {
      if (plugin.canHandle(item)) {
        return plugin.clone(item, isDeep, this);
      }
    }

    // Fallback for primitives and null
    return item;
  }

  ///////////////////////////////////////////////////////////////////////

  /**
   * @private
   * @returns {CloningPlugin<Map<any, any>>}
   */
  static _createMapPlugin() {
    return {
      canHandle: (item) => item instanceof Map,
      clone: (item, isDeep, cloner) => {
        const result = new Map();
        for (const [key, value] of item.entries()) {
          result.set(key, isDeep ? cloner.clone(value, isDeep) : value);
        }
        return result;
      },
    };
  }

  /**
   * @private
   * @returns {CloningPlugin<any[]>}
   */
  static _createArrayPlugin() {
    return {
      canHandle: (item) => Array.isArray(item),
      clone: (item, isDeep, cloner) =>
        item.map((element) => (isDeep ? cloner.clone(element, isDeep) : element)),
    };
  }

  /**
   * @private
   * @returns {CloningPlugin<Record<string, any>>}
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
   * @private
   * @returns {CloningPlugin<Date>}
   */
  static _createDatePlugin() {
    return {
      canHandle: (item) => item instanceof Date,
      clone: (item) => new Date(item.getTime()),
    };
  }

  /**
   * @private
   * @returns {CloningPlugin<RegExp>}
   */
  static _createRegExpPlugin() {
    return {
      canHandle: (item) => item instanceof RegExp,
      clone: (item) => new RegExp(item.source, item.flags),
    };
  }

  /**
   * @private
   * @returns {CloningPlugin<Set<any>>}
   */
  static _createSetPlugin() {
    return {
      canHandle: (item) => item instanceof Set,
      clone: (item, isDeep, cloner) => {
        const result = new Set();
        for (const value of item) {
          result.add(isDeep ? cloner.clone(value, isDeep) : value);
        }
        return result;
      },
    };
  }

  /**
   * @private
   * @returns {CloningPlugin<URL>}
   */
  static _createUrlPlugin() {
    return {
      canHandle: (item) => item instanceof URL,
      clone: (item) => new URL(item.href),
    };
  }
}

// Plugins are pre-installed in the exact order
TinyCloner.defaultPlugins = [
  // @ts-ignore
  TinyCloner._createDatePlugin(),
  // @ts-ignore
  TinyCloner._createRegExpPlugin(),
  // @ts-ignore
  TinyCloner._createSetPlugin(),
  // @ts-ignore
  TinyCloner._createMapPlugin(),
  // @ts-ignore
  TinyCloner._createUrlPlugin(),
  // @ts-ignore
  TinyCloner._createArrayPlugin(),
  // @ts-ignore
  TinyCloner._createObjectPlugin(),
];

export default TinyCloner;
