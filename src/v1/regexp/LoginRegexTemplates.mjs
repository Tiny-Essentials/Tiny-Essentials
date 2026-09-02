/**
 * @typedef {Object} UsernameRegexOptions
 * @property {string} validValues The allowed characters for the username part.
 * @property {string} prefix An prefix like '@' or '#'.
 * @property {string} domainPattern A regex pattern for a domain.
 */

export const matrixProtocol = Object.freeze({
  /** @type {UsernameRegexOptions} */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]+',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
  /** @type {UsernameRegexOptions} */
  roomName: {
    prefix: '#',
    validValues: '[a-z0-9._=-]+',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
});
