/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */

const domainNamePattern = '[a-zA-Z0-9.-]';
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
    validValues: '[a-zA-Z0-9._=-]', // Some servers accept uppercase in aliases
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
   * Matrix.to Permalink
   * Format: https://matrix.to/#/@user:domain or matrix.to/#/!room:domain
   * Supports optional event IDs and query parameters (like ?via=server.org)
   * @type {UsernameRegexTemplate}
   */
  matrixToLink: {
    start: '(?:https?://)?(?:www\\.)?matrix\\.to/#/[@#!$+]?',
    validValues: '[a-zA-Z0-9._=/%+-]',
    length: [1, 255],
    domainPattern: `${domainPattern}(?:/[\\w=/$+.-]+)?(?:\\?[\\w=&%.$+-]+)?`,
  },

  /**
   * Matrix URI Scheme (RFC 8922)
   * Format: matrix:u/user:domain or matrix:roomid/room:domain
   * @type {UsernameRegexTemplate}
   */
  matrixUri: {
    start: 'matrix:(?:u/|r/|roomid/|e/)?[@#!$+]?',
    validValues: '[a-zA-Z0-9._=/%+-]',
    length: [1, 255],
    domainPattern: `${domainPattern}(?:/[\\w=/$+.-]+)?(?:\\?[\\w=&%.$+-]+)?`,
  },

  /**
   * HTML Mention
   * Format: <a href="https://matrix.to/#/@user:domain">User Name</a>
   * Matches standard formatted mentions sent by Matrix clients inside HTML bodies.
   * @type {UsernameRegexTemplate}
   */
  htmlMention: {
    start:
      '<a\\s+(?:[^>]*?\\s+)?href=["\'](?:(?:https?://)?(?:www\\.)?matrix\\.to/#/|matrix:)(?:u/|r/|roomid/|e/)?[@#!$+]?',
    validValues: '[a-zA-Z0-9._=/%+-]',
    length: [1, 255],
    domainPattern: `${domainPattern}(?:/[\\w=/$+.-]+)?(?:\\?[\\w=&%.$+-]+)?["\'][^>]*>.*?</a>`,
  },

  /**
   * Matrix Content URI (Media)
   * Format: mxc://server-name/media-id
   * Used for avatars, images, and file attachments in the Matrix network.
   * @type {UsernameRegexTemplate}
   */
  mxcUri: {
    start: 'mxc://',
    validValues: '[a-zA-Z0-9.:-]',
    length: [1, 255],
    domainPattern: '/[a-zA-Z0-9_=-]+',
  },
});

export default MatrixProtocolRegex;
