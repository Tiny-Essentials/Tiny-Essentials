/**
 * @typedef {string|URL} Href
 * @typedef {string} Protocol
 * @typedef {string} Domain
 */

/**
 * Class representing an advanced security verifier for URLs.
 * Provides multi-layered protection including protocol, parameters,
 * credentials, IP addresses, and domain reputation (blacklist/whitelist).
 */
class TinyURLSecurityVerifier {
  /**
   * Private static storage for the default protocols.
   * @type {Set<Protocol>}
   */
  static #defaultProtocols = new Set(['javascript', 'data', 'vbscript', 'file', 'about']);

  /**
   * Private instance storage for protocols specific to this instance.
   * @type {Set<Protocol>}
   */
  #protocols;

  /**
   * Private instance storage for blacklisted domains.
   * @type {Set<Domain>}
   */
  #blacklistedDomains;

  /**
   * Private instance storage for whitelisted domains.
   * @type {Set<Domain>}
   */
  #allowedDomains;

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
   * @param {Href} href
   * @returns {URL}
   */
  static #hrefToUrl(href) {
    if (href instanceof URL) return href;
    if (typeof href !== 'string')
      throw new TypeError('Argument must be a URL instance or href address.');
    return new URL(href);
  }

  /**
   * Creates an instance of URLSecurityVerifier.
   * Initializes the instance protocols with a copy of the current static default protocols.
   */
  constructor() {
    this.#protocols = new Set(Array.from(TinyURLSecurityVerifier.#defaultProtocols));
    this.#blacklistedDomains = new Set();
    this.#allowedDomains = new Set();
  }

  // --- Instance Protocol Management ---

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

  // --- Instance Domain Management ---

  /**
   * Adds a domain to the instance-specific blacklist.
   * @param {Domain} domain - The domain to block.
   * @throws {TypeError} If domain is not a string.
   */
  addBlacklistedDomain(domain) {
    if (typeof domain !== 'string') throw new TypeError('Domain must be a string.');
    this.#blacklistedDomains.add(domain.toLowerCase());
  }

  /**
   * Adds a domain to the instance-specific whitelist.
   * @param {Domain} domain - The domain to allow.
   * @throws {TypeError} If domain is not a string.
   */
  addAllowedDomain(domain) {
    if (typeof domain !== 'string') throw new TypeError('Domain must be a string.');
    this.#allowedDomains.add(domain.toLowerCase());
  }

  // --- Security Check Methods ---

  /**
   * Checks if the URL contains user credentials in the authority component.
   * (e.g., https://user:pass@example.com)
   * @param {Href} href - The href address.
   * @returns {boolean} True if credentials are present.
   * @throws {TypeError} If argument is not a URL instance.
   */
  hasCredentials(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return url.username !== '' || url.password !== '';
  }

  /**
   * Checks if the hostname is an IPv4 address.
   * @param {Href} href - The href address.
   * @returns {boolean} True if the hostname is an IPv4 address.
   * @throws {TypeError} If argument is not a URL instance.
   */
  isIPv4Address(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    // Regex for IPv4
    return /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(url.hostname);
  }

  /**
   * Checks if the hostname is an IPv6 address.
   * @param {Href} href - The href address.
   * @returns {boolean} True if the hostname is an IPv6 address.
   * @throws {TypeError} If argument is not a URL instance.
   */
  isIPv6Address(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    // Simplified Regex for IPv6
    return /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/.test(
      url.hostname,
    );
  }

  /**
   * Checks if the hostname is an IPv4 or IPv6 address.
   * @param {Href} href - The href address.
   * @returns {boolean} True if the hostname is an IP address.
   * @throws {TypeError} If argument is not a URL instance.
   */
  isIPAddress(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.isIPv4Address(url) || this.isIPv6Address(url);
  }

  /**
   * @param {Href} href - The href address.
   * @returns {boolean}
   * @throws {TypeError} If argument is not a URL instance.
   */
  isBlacklisted(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.#blacklistedDomains.has(url.hostname.toLowerCase());
  }

  /**
   * @param {Href} href - The href address.
   * @returns {boolean}
   * @throws {TypeError} If argument is not a URL instance.
   */
  isWhitelisted(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.#allowedDomains.has(url.hostname.toLowerCase());
  }

  /**
   * Checks if the URL's primary protocol is in the local dangerous list.
   * @param {Href} href - The href address to check.
   * @returns {boolean} True if the protocol is dangerous, false otherwise.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isProtocolDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);

    // url.protocol returns format "scheme:" (e.g., "javascript:"), so we remove the colon.
    const protocol = url.protocol.replace(':', '');
    return this.#protocols.has(protocol);
  }

  /**
   * Checks if any of the local dangerous protocols are present within the URL's search parameters.
   * @param {Href} href - The href address to check.
   * @returns {boolean} True if a dangerous protocol is found in search params, false otherwise.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isSearchParamDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);

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
   * @param {Href} href - The href address to check.
   * @returns {boolean} True if the URL is dangerous, false if it is safe.
   * @throws {TypeError} If the provided argument is not an instance of URL.
   */
  isDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    // If a whitelist is configured, any domain not in the whitelist is considered dangerous
    if (this.#allowedDomains.size > 0 && !this.isWhitelisted(url)) {
      return true;
    }

    return (
      this.isProtocolDangerous(url) ||
      this.isSearchParamDangerous(url) ||
      this.hasCredentials(url) ||
      this.isBlacklisted(url) ||
      this.isIPAddress(url)
    );
  }
}

export default TinyURLSecurityVerifier;
