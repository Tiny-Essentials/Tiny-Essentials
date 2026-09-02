import { isValidIPv4 } from '../../regexp/Ipv4.mjs';
import { isValidIPv6 } from '../../regexp/Ipv6.mjs';

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
   * Instance whitelist mode.
   * @type {boolean}
   */
  #isWhitelistMode = false;

  /**
   * Retrieves the current global default protocols as an array.
   * @returns {Protocol[]} An array of default protocols.
   */
  static get defaultProtocols() {
    return Array.from(this.#defaultProtocols);
  }

  /**
   * Replaces the global default protocols with a new array of protocols.
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
   * Adds a new protocol to the global default list.
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
   * Removes a protocol from the global default list.
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
   * Converts a string or URL instance into a standard URL object.
   * @param {Href} href - The href address or URL instance.
   * @returns {URL} A URL instance.
   * @throws {TypeError} If the argument is neither a string nor a URL instance.
   */
  static #hrefToUrl(href) {
    if (href instanceof URL) return href;
    if (typeof href !== 'string')
      throw new TypeError('Argument must be a URL instance or href address.');
    return new URL(href);
  }

  /**
   * Creates an instance of TinyURLSecurityVerifier.
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
   * Returns the total count of protocols configured in this instance.
   * @returns {number} The number of protocols.
   */
  get protocolsSize() {
    return this.#protocols.size;
  }

  /**
   * Indicates if the protocols list should act as a whitelist.
   * If true, only protocols in the list are considered safe.
   * If false, protocols in the list are considered dangerous (blacklist mode).
   * @returns {boolean}
   */
  get isWhitelistMode() {
    return this.#isWhitelistMode;
  }

  /**
   * Sets the mode of the protocol list.
   * @param {boolean} value - True for whitelist mode, false for blacklist mode.
   * @throws {TypeError} If the value is not a boolean.
   */
  set isWhitelistMode(value) {
    if (typeof value !== 'boolean') {
      throw new TypeError('isWhitelistMode must be a boolean.');
    }
    this.#isWhitelistMode = value;
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
   * @returns {boolean} Returns `true` if the protocol existed and was successfully removed, or `false` if the protocol did not exist.
   */
  removeProtocol(protocol) {
    if (typeof protocol !== 'string') {
      throw new TypeError('The protocol must be a string.');
    }
    return this.#protocols.delete(protocol.toLowerCase());
  }

  // --- Instance Domain Management ---

  /**
   * Returns the current list of allowed domains for this specific instance.
   * @returns {Domain[]} An array of domains.
   */
  get allowedDomains() {
    return Array.from(this.#allowedDomains);
  }

  /**
   * Returns the total count of allowed domains in this instance.
   * @returns {number} The number of allowed domains.
   */
  get allowedDomainsSize() {
    return this.#allowedDomains.size;
  }

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
   * Removes a domain from the instance-specific blacklist.
   * @param {Domain} domain - The domain to remove.
   * @throws {TypeError} If domain is not a string.
   * @returns {boolean} Returns `true` if the domain existed and was successfully removed, or `false` if the domain did not exist.
   */
  removeBlacklistedDomain(domain) {
    if (typeof domain !== 'string') throw new TypeError('Domain must be a string.');
    return this.#blacklistedDomains.delete(domain.toLowerCase());
  }

  /**
   * Returns the current list of blacklisted domains for this specific instance.
   * @returns {Domain[]} An array of blacklisted domains.
   */
  get blacklistedDomains() {
    return Array.from(this.#blacklistedDomains);
  }

  /**
   * Returns the total count of blacklisted domains in this instance.
   * @returns {number} The number of blacklisted domains.
   */
  get blacklistedDomainsSize() {
    return this.#blacklistedDomains.size;
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

  /**
   * Removes a domain from the instance-specific whitelist.
   * @param {Domain} domain - The domain to remove.
   * @throws {TypeError} If domain is not a string.
   * @returns {boolean} Returns `true` if the domain existed and was successfully removed, or `false` if the domain did not exist.
   */
  removeAllowedDomain(domain) {
    if (typeof domain !== 'string') throw new TypeError('Domain must be a string.');
    return this.#allowedDomains.delete(domain.toLowerCase());
  }

  // --- Security Check Methods ---

  /**
   * Checks if the URL contains user credentials in the authority component.
   * (e.g., https://user:pass@example.com)
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if credentials are present.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  hasCredentials(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return url.username !== '' || url.password !== '';
  }

  /**
   * Checks if the hostname is an IPv4 address.
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if the hostname is an IPv4 address.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  isIPv4Address(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return isValidIPv4(url.hostname);
  }

  /**
   * Checks if the hostname is an IPv6 address.
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if the hostname is an IPv6 address.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  isIPv6Address(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return isValidIPv6(url.hostname);
  }

  /**
   * Checks if the hostname is either an IPv4 or an IPv6 address.
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if the hostname is an IP address.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  isIPAddress(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.isIPv4Address(url) || this.isIPv6Address(url);
  }

  /**
   * Checks if the domain is present in the instance's blacklist.
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if the domain is blacklisted.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  isBlacklisted(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.#blacklistedDomains.has(url.hostname.toLowerCase());
  }

  /**
   * Checks if the domain is present in the instance's whitelist.
   * @param {Href} href - The href address or URL instance.
   * @returns {boolean} True if the domain is whitelisted.
   * @throws {TypeError} If the argument is not a URL instance or valid href.
   */
  isWhitelisted(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    return this.#allowedDomains.has(url.hostname.toLowerCase());
  }

  /**
   * Checks if the URL's primary protocol is in the local dangerous list.
   * @param {Href} href - The href address or URL instance to check.
   * @returns {boolean} True if the protocol is considered dangerous, false otherwise.
   * @throws {TypeError} If the provided argument is not a valid URL.
   */
  isProtocolDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);

    // url.protocol returns format "scheme:" (e.g., "javascript:"), so we remove the colon.
    const protocol = url.protocol.replace(':', '').toLowerCase();
    const isMatch = this.#protocols.has(protocol);

    // If whitelist mode: it is dangerous if the protocol is NOT in the set.
    // If blacklist mode: it is dangerous if the protocol IS in the set.
    return this.#isWhitelistMode ? !isMatch : isMatch;
  }

  /**
   * Checks if any protocol present within the URL's search parameters is considered dangerous.
   * @param {Href} href - The href address or URL instance to check.
   * @returns {boolean} True if a dangerous protocol is found in search params, false otherwise.
   * @throws {TypeError} If the provided argument is not a valid URL.
   */
  isSearchParamDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
    const params = url.searchParams;

    // Iterate through all values in the search parameters
    for (const value of params.values()) {
      // Regex to find a protocol pattern (e.g., "javascript:" or "https:")
      const match = value.match(/([a-z0-9+.-]+):/gi);
      let isDangerous = false;

      if (match) {
        for (const foundProtocol of match) {
          const inSet = this.#protocols.has(foundProtocol.toLowerCase());
          isDangerous = this.#isWhitelistMode ? !inSet : inSet;
          if (isDangerous) break;
        }
      }

      // If whitelist mode: dangerous if the found protocol is NOT in the set.
      // If blacklist mode: dangerous if the found protocol IS in the set.
      return isDangerous;
    }
    return false;
  }

  /**
   * Performs a comprehensive security scan on the provided href.
   * @param {Href} href - The href address or URL instance to check.
   * @returns {boolean} True if the URL is considered dangerous, false if it is safe.
   * @throws {TypeError} If the provided argument is not a valid URL.
   */
  isDangerous(href) {
    const url = TinyURLSecurityVerifier.#hrefToUrl(href);
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
