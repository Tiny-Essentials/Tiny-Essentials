/**
 * @typedef {Object} UsernameRegexOptions
 * @property {string} validValues The allowed characters for the username part.
 * @property {[number, number]} [length] The [min, max] length of the username part.
 * @property {string} prefix An prefix like '@' or '#'.
 * @property {string} domainPattern A regex pattern for a domain.
 */

/**
 * Matrix Protocol (matrix.org)
 */
export const matrixProtocol = Object.freeze({
  /** @type {UsernameRegexOptions} */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
  /** @type {UsernameRegexOptions} */
  roomName: {
    prefix: '#',
    validValues: '[a-z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
});

/**
 * Bluesky / AT Protocol
 */
export const blueSkyProtocol = Object.freeze({
  /** @type {UsernameRegexOptions} */
  handle: {
    prefix: '@',
    validValues: '[a-zA-Z0-9-]',
    length: [1, 63],
    domainPattern: '(?:\\.[a-zA-Z0-9-]+)+',
  },
});
