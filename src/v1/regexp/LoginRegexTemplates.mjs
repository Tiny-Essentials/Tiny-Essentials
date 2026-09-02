/**
 * Represents the type for transformations applied to extracted usernames.
 * @typedef {import('./Login.mjs').UsernameTransform} UsernameTransform
 */

/**
 * Configuration options for constructing username regular expressions.
 * @typedef {Object} UsernameRegexTemplate
 * @property {string} validValues The allowed characters for the username part.
 * @property {[number, number]} [length] The [min, max] length of the username part.
 * @property {string} prefix An prefix like '@' or '#'.
 * @property {string} [domainPattern] A regex pattern for a domain.
 * @property {string} [domain] A literal domain string (e.g., '@matrix.org'). Will be escaped automatically.
 * @property {UsernameTransform} [transform=null] Optional transformation applied to the extracted usernames.
 */

/**
 * Matrix Protocol (matrix.org)
 * Official Documentation: https://spec.matrix.org/latest/appendices/#identifier-grammar
 */
export const matrixProtocol = Object.freeze({
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

/**
 * Bluesky / AT Protocol
 */
export const blueSkyProtocol = Object.freeze({
  /**
   * User Identifier (Handle)
   * Format: @user.bsky.social (or custom domains)
   * @type {UsernameRegexTemplate}
   */
  handle: {
    prefix: '@',
    validValues: '[a-zA-Z0-9-]',
    length: [1, 63],
    domainPattern: '(?:\\.[a-zA-Z0-9-]+)+',
  },
  /**
   * Decentralized Identifier (DID) - The actual identity in the database
   * Format: did:plc:1234567890abcdefghi or did:web:domain.com
   * @type {UsernameRegexTemplate}
   */
  did: {
    prefix: 'did:',
    validValues: '[a-z]', // Captures the method (e.g., "plc" or "web")
    length: [3, 4],
    domainPattern: ':[a-zA-Z0-9.-]+', // Captures the rest of the unique identifier
  },
  /**
   * AT URI (Points to specific records such as posts, profiles, feeds)
   * Format: at://did:plc:1234567890abcdefghi/app.bsky.feed.post/3jklmn56pqr2
   * @type {UsernameRegexTemplate}
   */
  atUri: {
    prefix: 'at://',
    validValues: '[a-zA-Z0-9.:-]', // Captures the authority (can be the DID or a Handle)
    length: [1, 253],
    domainPattern: '\\/[a-zA-Z0-9.-]+\\/[a-zA-Z0-9.-]+', // Captures the collection and the record ID (rkey)
  },
  /**
   * Standard Hashtags
   * Format: #hashtag
   * @type {UsernameRegexTemplate}
   */
  hashtag: {
    prefix: '#',
    validValues: '[a-zA-Z0-9_]',
    length: [1, 64],
  }
});

/**
 * Discord Protocol
 */
export const discordProtocol = Object.freeze({
  /**
   * Modern Discord Usernames (Handles)
   * Format: username
   * @type {UsernameRegexTemplate}
   */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9_.]',
    length: [2, 32],
  },
  /**
   * Standard User Mention Code
   * Format: <@USER_ID>
   * @type {UsernameRegexTemplate}
   */
  userMention: {
    prefix: '<@',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * User Mention Code (Nickname/Server Nickname)
   * Format: <@!USER_ID>
   * @type {UsernameRegexTemplate}
   */
  nicknameMention: {
    prefix: '<@!',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Role Mention Code
   * Format: <@&ROLE_ID>
   * @type {UsernameRegexTemplate}
   */
  roleMention: {
    prefix: '<@&',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Channel Mention Code (Covers all types: Text, Voice, Forum, Stage, etc.)
   * Format: <#CHANNEL_ID>
   * @type {UsernameRegexTemplate}
   */
  channelMention: {
    prefix: '<#',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },
  /**
   * Standard Custom Emoji Code
   * Format: <:name:ID>
   * @type {UsernameRegexTemplate}
   */
  customEmoji: {
    prefix: '<:',
    validValues: '[a-zA-Z0-9_]',
    length: [2, 32],
    domainPattern: ':[0-9]{17,22}>',
  },
  /**
   * Animated Custom Emoji Code
   * Format: <a:name:ID>
   * @type {UsernameRegexTemplate}
   */
  animatedEmoji: {
    prefix: '<a:',
    validValues: '[a-zA-Z0-9_]',
    length: [2, 32],
    domainPattern: ':[0-9]{17,22}>',
  },
  /**
   * Slash Command Mention Code
   * Format: </name:ID> or </name subcommand:ID>
   * @type {UsernameRegexTemplate}
   */
  slashCommand: {
    prefix: '</',
    validValues: '[a-zA-Z0-9_ -]',
    length: [1, 100],
    domainPattern: ':[0-9]{17,22}>',
  },
});
