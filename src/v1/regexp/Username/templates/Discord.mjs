/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
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

export default DiscordRegex;
