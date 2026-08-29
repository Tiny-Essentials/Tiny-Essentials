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
 * A class that performs deep cloning using a plugin-based architecture.
 */
class TinyCloner {
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
   * Performs the cloning operation on the provided item. It iterates through the instance's
   * plugins first, then the default plugins, until a matching plugin is found.
   *
   * @template {any} Value
   * @param {Value} item - The item to be cloned.
   * @param {boolean} [isDeep=true] - Whether to perform a deep clone (true) or a shallow clone (false).
   * @returns {Value} The cloned version of the input item.
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
}

// Plugins are pre-installed in the exact order
TinyCloner.defaultPlugins = order
  .filter((typeName) => registry[typeName]) // Ensures that the type exists in the record
  .map((typeName) => ({
    canHandle: registry[typeName].validator,
    clone: registry[typeName].cloner,
  }));

export default TinyCloner;
