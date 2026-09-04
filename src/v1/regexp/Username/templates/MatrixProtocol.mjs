/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */

const azAz09Default = '[a-zA-Z0-9._=-]';
const domainNamePattern = '[a-zA-Z0-9.-]'
const domainPattern = `\\:${domainNamePattern}+\\.[a-zA-Z]{2,}`;

/**
 * Matrix Protocol (matrix.org)
 * Official Documentation: https://spec.matrix.org/latest/appendices/#identifier-grammar
 */
const MatrixProtocolRegex = Object.freeze({
  /**
   * User ID
   * Format: @localpart:domain
   * @type {UsernameRegexTemplate}
   */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]',
    length: [1, 255],
    domainPattern,
  },

  /**
   * Room Alias (Human-readable alias)
   * Format: #alias:domain
   * @type {UsernameRegexTemplate}
   */
  roomName: {
    prefix: '#',
    validValues: azAz09Default, // Some servers accept uppercase in aliases
    length: [1, 255],
    domainPattern,
  },

  /**
   * Room ID (Internal and immutable ID)
   * Format: !opaque_id:domain
   * @type {UsernameRegexTemplate}
   */
  roomId: {
    prefix: '!',
    validValues: '[a-zA-Z0-9_-]',
    length: [1, 255],
    domainPattern,
  },

  /**
   * Event ID (Event/message identifier)
   * Format v1/v2: $opaque_id:domain
   * Format v3+: $Base64String (without the domain at the end)
   * @type {UsernameRegexTemplate}
   */
  eventId: {
    prefix: '$',
    validValues: '[a-zA-Z0-9_+/=-]', // Supports Base64 and URL-Safe Base64 characters
    length: [1, 255],
    // We use (?:...)? here to make the domain group optional,
    // as Matrix updated the Event ID format in recent versions
    // to no longer require the ":domain" part at the end of the string.
    domainPattern: `(?:${domainPattern})?`,
  },

  /**
   * Group/Space ID (Legacy/Communities)
   * Format: +group_id:domain
   * @type {UsernameRegexTemplate}
   */
  groupId: {
    prefix: '+',
    validValues: '[a-z0-9._=-]',
    length: [1, 255],
    domainPattern,
  },

  /**
   * Matrix URI (matrix://)
   * Format: matrix://<server>/#!<user>:<domain>
   * @type {UsernameRegexTemplate}
   */
  matrixUri: {
    start: `matrix://${domainNamePattern}+/#!`,
    validValues: azAz09Default,
    domainPattern,
    length: [1, 255],
  },

  /**
   * MXC URI (mxc://)
   * Format: mxc://<server>/<user>
   * @type {UsernameRegexTemplate}
   */
  mxcUri: {
    start: `mxc://${domainNamePattern}+/`,
    validValues: azAz09Default,
    length: [1, 255],
  },

  /**
   * HTML Mention
   * Format: <a href="...">@user:domain.com</a>
   * @type {UsernameRegexTemplate}
   */
  htmlMention: {
    start: '<a[^>]*>@',
    validValues: azAz09Default,
    domainPattern: `${domainPattern}<\/a>`,
    length: [1, 255],
  },
});

export default MatrixProtocolRegex;
