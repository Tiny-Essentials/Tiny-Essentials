/**
 * @typedef {string} Protocol
 */

/**
 * Class representing a security verifier for URLs.
 * Supports global configuration via static methods and local configuration via instance methods.
 */
class TinyURLSecurityVerifier {
  /**
   * Private static storage for the default protocols to allow getter/setter usage.
   * @type {Set<Protocol>}
   */
  static #defaultProtocols = new Set(['javascript', 'data', 'vbscript', 'file', 'about']);

  /**
   * Private instance storage for protocols specific to this instance.
   * @type {Set<Protocol>}
   */
  #protocols;

  /**
   * Static getter to retrieve the current default protocols as an array.
   * @returns {Protocol[]} An array of default protocols.
   */
  static get defaultProtocols() {
    return Array.from(this.#defaultProtocols);
  }

  /**
   * Static setter to replace the entire list of default protocols.
   * @param {Protocol[]} protocols - An array of protocol strings.
   * @throws {TypeError} If the input is not an array or contains non-string elements.
   */
  static set defaultProtocols(protocols) {
    if (!Array.isArray(protocols)) {
      throw new TypeError('The default protocols must be an array.');
    }

    // Validate that every element in the array is a string
    for (const p of protocols) {
      if (typeof p !== 'string') {
        throw new TypeError('All elements in the protocols array must be strings.');
      }
    }

    this.#defaultProtocols = new Set(protocols.map((p) => p.toLowerCase()));
  }

  /**
   * Static method to add a protocol to the global default list.
   * @param {Protocol} protocol - The protocol to add.
   * @throws {TypeError} If the protocol is not a string.
   */
  static addProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new TypeError('The protocol must be a string.');
    }
    this.#defaultProtocols.add(protocol.toLowerCase());
  }

  /**
   * Static method to remove a protocol from the global default list.
   * @param {Protocol} protocol - The protocol to remove.
   * @throws {TypeError} If the protocol is not a string.
   */
  static removeProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new TypeError('The protocol must be a string.');
    }
    this.#defaultProtocols.delete(protocol.toLowerCase());
  }

  /**
   * Creates an instance of URLSecurityVerifier.
   * Initializes the instance protocols with a copy of the current static default protocols.
   */
  constructor() {
    this.#protocols = new Set(Array.from(TinyURLSecurityVerifier.#defaultProtocols));
  }

  /**
   * Returns the current list of protocols for this specific instance.
   * @returns {Protocol[]} An array of protocols.
   */
  get protocols() {
    return Array.from(this.#protocols);
  }

  /**
   * Adds a new protocol to this specific instance's list.
   * @param {Protocol} protocol - The protocol to add.
   * @throws {TypeError} If the protocol is not a string.
   */
  addProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new TypeError('The protocol must be a string.');
    }
    this.#protocols.add(protocol.toLowerCase());
  }

  /**
   * Removes a protocol from this specific instance's list.
   * @param {Protocol} protocol - The protocol to remove.
   * @throws {TypeError} If the protocol is not a string.
   */
  removeProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new TypeError('The protocol must be a string.');
    }
    this.#protocols.delete(protocol.toLowerCase());
  }

  /**
   * Checks if the URL's primary protocol is in the local dangerous list.
   * @param {URL} url - The URL instance to check.
   * @returns {boolean} True if the protocol is dangerous, false otherwise.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isProtocolDangerous(url) {
    if (!(url instanceof URL)) {
      throw new TypeError('The argument must be an instance of URL.');
    }

    // url.protocol returns format "scheme:" (e.g., "javascript:"), so we remove the colon.
    const protocol = url.protocol.replace(':', '');
    return this.#protocols.has(protocol);
  }

  /**
   * Checks if any of the local dangerous protocols are present within the URL's search parameters.
   * @param {URL} url - The URL instance to check.
   * @returns {boolean} True if a dangerous protocol is found in search params, false otherwise.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isSearchParamDangerous(url) {
    if (!(url instanceof URL)) {
      throw new TypeError('The argument must be an instance of URL.');
    }

    const params = url.searchParams;

    // Iterate through all values in the search parameters
    for (const value of params.values()) {
      for (const dangerousProtocol of this.#protocols) {
        // We check if the value contains the dangerous protocol followed by a colon
        // to avoid false positives (e.g., "myjavascript" vs "javascript:")
        if (value.includes(`${dangerousProtocol}:`)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * The main verification method.
   * @param {URL} url - The URL instance to check.
   * @returns {boolean} True if the URL is dangerous, false if it is safe.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isDangerous(url) {
    return this.isProtocolDangerous(url) || this.isSearchParamDangerous(url);
  }
}

export default TinyURLSecurityVerifier;
