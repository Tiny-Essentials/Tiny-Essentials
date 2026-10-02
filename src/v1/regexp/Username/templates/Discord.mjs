/**
 * @typedef {import('../jsDoc.mjs').UsernameRegexTemplate} UsernameRegexTemplate
 */

/**
 * A Discord snowflake identifier (17 to 22 digits).
 * @type {string}
 */
const SNOWFLAKE = '[0-9]{17,22}';

/**
 * An optional URL query string, including the leading "?".
 * Keeps tracking parameters (e.g. "?utm_source=discord") inside the match.
 * @type {string}
 */
const OPTIONAL_QUERY_STRING = '(?:\\?[^\\s#]*)?';

/**
 * Discord Protocol
 */
const DiscordRegex = Object.freeze({
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
   * Timestamp Code
   * Format: <t:TIMESTAMP:STYLE> or <t:TIMESTAMP>
   * Styles: t, T, d, D, f, F, R, s, S
   * @type {UsernameRegexTemplate}
   */
  timestamp: {
    prefix: '<t:',
    validValues: '[0-9]',
    length: [1, 15],
    domainPattern: '(?::[tTdDfFRsS])?>',
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

  /**
   * Message Link
   * Format: https://discord.com/channels/GUILD_ID/CHANNEL_ID/MESSAGE_ID
   * The guild segment accepts a snowflake or the literal "@me" for direct messages.
   * @type {UsernameRegexTemplate}
   */
  messageLink: {
    start: `https?://(?:www\\.)?discord(?:app)?\\.com/channels/(?:@me|${SNOWFLAKE})/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${SNOWFLAKE}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * Server Invite Link
   * Format: discord.gg/code or https://discord.gg/code
   * Supports both discord.gg and discord.com/invite/ formats.
   * @type {UsernameRegexTemplate}
   */
  inviteLink: {
    // Used by moderation bots to detect scammers and invite spammers.
    pure: [
      '((discordapp|discord)\\s?\\.\\s?co(m)?\\s?\\W\\s?(invite|servers)\\s?\\W)',
      '(discord\\s?\\.\\s?gg\\s?\\W)',
    ],
    // Standard URL detectors.
    start: '(?:https?://)?(?:discord\\.gg/|(discord|discordapp)\\.com/(invite|servers)/)',
    validValues: '[a-zA-Z0-9_-]',
    length: [2, 300],
    // Keeps "?utm_source=..." and friends attached to the invite code.
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * Game Profile Mention Code
   * Format: <@$GAME_ID>
   * @type {UsernameRegexTemplate}
   */
  gameProfile: {
    prefix: '<@$',
    validValues: '[0-9]',
    length: [17, 22],
    domain: '>',
  },

  /**
   * Guild Navigation Code
   * Format: <id:TYPE> or <id:linked-roles:ROLE_ID>
   * Types: customize, browse, guide, linked-roles
   * @type {UsernameRegexTemplate}
   */
  guildNavigation: {
    prefix: '<id:',
    validValues: '[a-z-]',
    length: [1, 12],
    domainPattern: '(?::[0-9]{17,22})?>',
  },
});

export default DiscordRegex;
