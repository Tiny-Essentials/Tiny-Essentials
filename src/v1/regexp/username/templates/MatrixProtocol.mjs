/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */

/**
 * Matrix Protocol (matrix.org)
 * Official Documentation: https://spec.matrix.org/latest/appendices/#identifier-grammar
 */
 const MatrixProtocol = Object.freeze({
  /**
   * User ID
   * Format: @localpart:domain
   * @type {UsernameRegexTemplate}
   */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]',
    length: [1, 255],
    domainPattern: ':[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
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
    domainPattern: ':[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
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
    domainPattern: ':[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
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
    domainPattern: '(?:\\:[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})?',
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
    domainPattern: ':[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
  },
});

export default MatrixProtocol;
