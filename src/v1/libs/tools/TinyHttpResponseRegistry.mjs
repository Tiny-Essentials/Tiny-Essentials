import { isJsonObject } from '../../basics/objChecker.mjs';
import TinyI18 from '../text/TinyI18.mjs';
import RequestCodes from './TinyHttpResponseRegistry/RequestCodes.mjs';

/**
 * @typedef {import('./TinyHttpResponseRegistry/RequestCodes.mjs').HttpResponse} HttpResponse
 * @typedef {import('./TinyHttpResponseRegistry/RequestCodes.mjs').HttpResponses} HttpResponses
 */

/**
 * Manages a collection of HTTP response codes.
 * The registry is immutable regarding existing entries and ensures data integrity through strict validation.
 */
class TinyHttpResponseRegistry {
  /** @type {HttpResponses} */
  static #DefaultRequestCodes = RequestCodes;

  /**
   * Getter for the default request codes.
   * Returns a deep clone to prevent external mutation of the private state.
   *
   * @returns {HttpResponses} A deep copy of the current status codes.
   */
  static get defaultRequestCodes() {
    return structuredClone(TinyHttpResponseRegistry.#DefaultRequestCodes);
  }

  /**
   * Setter for the default request codes.
   * Performs deep validation and stores a deep clone to prevent external mutation.
   *
   * @param {HttpResponses} newCodes - The new mapping of HTTP responses.
   * @throws {TypeError} If the input is not a valid HttpResponses object.
   */
  static set defaultRequestCodes(newCodes) {
    // 1. Validate that the input is a non-null object
    if (typeof newCodes !== 'object' || newCodes === null || Array.isArray(newCodes)) {
      throw new TypeError('The value must be a non-null object.');
    }

    // 2. Deep validation of the object structure
    for (const [key, response] of Object.entries(newCodes)) {
      // Validate that the key represents a valid number
      if (Number.isNaN(Number(key))) {
        throw new TypeError(`Invalid key: "${key}". Status code keys must be numeric.`);
      }

      // Validate that the value is a valid object
      if (typeof response !== 'object' || response === null || Array.isArray(response)) {
        throw new TypeError(`The value for status code ${key} must be an object.`);
      }

      // Validate internal properties of the HttpResponse object
      if (typeof response.name !== 'string') {
        throw new TypeError(`Property 'name' in status ${key} must be a string.`);
      }
      if (typeof response.summary !== 'string') {
        throw new TypeError(`Property 'summary' in status ${key} must be a string.`);
      }
      if (typeof response.description !== 'string') {
        throw new TypeError(`Property 'description' in status ${key} must be a string.`);
      }
    }

    // 3. Store a deep clone to ensure the class owns the data entirely
    TinyHttpResponseRegistry.#DefaultRequestCodes = structuredClone(newCodes);
  }

  /** @type {Set<number>} The set of all registered HTTP status codes. */
  #reqCodes = new Set();

  /** @type {TinyI18} The internationalization instance used for managing localized response data. */
  #i18 = new TinyI18({
    defaultLocale: 'en',
    mode: 'local',
    strict: false,
    acceptNullResults: true,
  });

  /** @type {string} The current active locale for the registry. */
  #locale = 'en';

  /**
   * Initializes a new instance of the TinyHttpResponseRegistry.
   * @param {HttpResponses} [initialResponses] - An object of initial response objects to populate the registry.
   * @throws {TypeError} If the input is not an object.
   */
  constructor(initialResponses = {}) {
    if (!isJsonObject(initialResponses)) {
      throw new TypeError('Initial responses must be an object.');
    }

    this.#i18.loadLocaleLocal(this.#locale, {});
    for (const id in TinyHttpResponseRegistry.#DefaultRequestCodes) {
      const response = TinyHttpResponseRegistry.#DefaultRequestCodes[id];
      this.addResponse(Number(id), response);
    }
    for (const id in initialResponses) {
      const response = initialResponses[id];
      this.addResponse(Number(id), response);
    }
  }

  /**
   * Validates the structure and types of a response object.
   * @param {number} id - The HTTP status code (e.g., 404).
   * @param {any} data - The data to validate.
   * @throws {TypeError} If the data structure or types are incorrect.
   * @throws {RangeError} If the ID is not a valid HTTP status code range.
   * @throws {Error} If the ID already exists in the registry.
   */
  #validateResponse(id, data) {
    if (typeof data !== 'object' || data === null) {
      throw new TypeError('Response must be a non-null object.');
    }

    if (typeof data.name !== 'string') {
      throw new TypeError('The "name" property must be a string.');
    }

    if (typeof data.summary !== 'string') {
      throw new TypeError('The "summary" property must be a string.');
    }

    if (typeof data.description !== 'string') {
      throw new TypeError('The "description" property must be a string.');
    }

    if (this.#i18.get(String(id))) {
      throw new Error(`Response with ID ${id} already exists in the registry.`);
    }
  }

  /**
   * Adds a new response to the registry.
   * The object is frozen to prevent any modifications to its properties.
   * @param {number} id - The HTTP status code (e.g., 404).
   * @param {HttpResponse} response - The response object to be added.
   * @param {string} [locale] - The locale to use for storing the response.
   */
  addResponse(id, response, locale = this.#locale) {
    this.#validateResponse(id, response);
    this.#reqCodes.add(id);

    // Create a frozen copy to ensure immutability of the stored object
    this.#i18.loadLocaleLocal(locale, {
      [id]: {
        name: response.name,
        summary: response.summary,
        description: response.description,
      },
    });
  }

  /**
   * Retrieves a response by its ID.
   * @param {number} id - The HTTP status code.
   * @returns {HttpResponse | null} The response object or null if not found.
   * @param {string} [locale] - The locale to use for retrieval.
   */
  get(id, locale = this.#locale) {
    const name = this.#i18.get(`${id}.name`, {}, { locale });
    const summary = this.#i18.get(`${id}.summary`, {}, { locale });
    const description = this.#i18.get(`${id}.description`, {}, { locale });

    if (typeof name !== 'string' || typeof summary !== 'string' || typeof description !== 'string')
      return null;

    return { name, summary, description };
  }

  /**
   * Checks if a response ID exists in the registry.
   * @param {number} id - The HTTP status code.
   * @returns {boolean} True if the ID exists, false otherwise.
   */
  has(id) {
    return !!this.#i18.get(String(id));
  }

  /**
   * Returns all registered responses as an object.
   * @returns {HttpResponses} An object containing all registered response objects.
   */
  getAll() {
    /** @type {HttpResponses} */
    const result = {};
    this.#reqCodes.forEach((code) => {
      const data = this.get(code);
      if (data) result[code] = data;
    });
    return result;
  }
}

export default TinyHttpResponseRegistry;
