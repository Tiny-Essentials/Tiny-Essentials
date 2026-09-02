/**
 * @typedef {import('../../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */

/**
 * Discord Protocol
 */
const DiscordRegex = Object.freeze({
  /**
   * Modern Discord Usernames (Handles)
   * Format: username
   * @type {UsernameRegexTemplate}
   */
  userName: {
    start: '(?<!<)',
    prefix: '@',
    validValues: '[a-z0-9_.]',
    length: [2, 32],
  },
});

export default DiscordRegex;
