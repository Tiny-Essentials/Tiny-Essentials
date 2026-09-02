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
 */
export const matrixProtocol = Object.freeze({
  /** @type {UsernameRegexTemplate} */
  userName: {
    prefix: '@',
    validValues: '[a-z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
  /** @type {UsernameRegexTemplate} */
  roomName: {
    prefix: '#',
    validValues: '[a-zA-Z0-9._=-]',
    domainPattern: ':[a-z0-9.-]+\\.[a-z]{2,}',
  },
});

/**
 * Bluesky / AT Protocol
 */
export const blueSkyProtocol = Object.freeze({
  /** @type {UsernameRegexTemplate} */
  handle: {
    prefix: '@',
    validValues: '[a-zA-Z0-9-]',
    length: [1, 63],
    domainPattern: '(?:\\.[a-zA-Z0-9-]+)+',
  },
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
