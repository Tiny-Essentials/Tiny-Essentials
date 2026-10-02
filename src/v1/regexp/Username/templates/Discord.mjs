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
 * A Discord CDN host, matching both the primary and the media subdomain.
 * @type {string}
 */
const CDN_HOST = 'https?://(?:cdn\\.discordapp\\.com|media\\.discordapp\\.net)';

/**
 * A Discord CDN image extension.
 * @type {string}
 */
const CDN_EXT = '\\.(?:jpg|jpeg|png|webp|gif|avif)';

/**
 * A Discord CDN asset hash (hex or base64url, optionally animated).
 * @type {string}
 */
const CDN_HASH = '[A-Za-z0-9_-]+';

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

  /**
   * CDN: Custom Emoji
   * Format: https://cdn.discordapp.com/emojis/EMOJI_ID.png
   * @type {UsernameRegexTemplate}
   */
  cdnEmoji: {
    start: `${CDN_HOST}/emojis/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: CDN_EXT,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Icon
   * Format: https://cdn.discordapp.com/icons/GUILD_ID/HASH.png
   * @type {UsernameRegexTemplate}
   */
  cdnGuildIcon: {
    start: `${CDN_HOST}/icons/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Splash
   * @type {UsernameRegexTemplate}
   */
  cdnGuildSplash: {
    start: `${CDN_HOST}/splashes/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Discovery Splash
   * @type {UsernameRegexTemplate}
   */
  cdnGuildDiscoverySplash: {
    start: `${CDN_HOST}/discovery-splashes/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Banner (shared by Guild Banner and User Banner).
   * @type {UsernameRegexTemplate}
   */
  cdnBanner: {
    start: `${CDN_HOST}/banners/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Default User Avatar
   * @type {UsernameRegexTemplate}
   */
  cdnDefaultUserAvatar: {
    start: `${CDN_HOST}/embed/avatars/`,
    validValues: '[0-9]',
    length: [1, 2],
    domainPattern: CDN_EXT,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: User Avatar
   * @type {UsernameRegexTemplate}
   */
  cdnUserAvatar: {
    start: `${CDN_HOST}/avatars/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Member Avatar
   * @type {UsernameRegexTemplate}
   */
  cdnGuildMemberAvatar: {
    start: `${CDN_HOST}/guilds/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/users/[0-9]{17,22}/avatars/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Member Banner
   * @type {UsernameRegexTemplate}
   */
  cdnGuildMemberBanner: {
    start: `${CDN_HOST}/guilds/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/users/[0-9]{17,22}/banners/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Avatar Decoration Preset
   * @type {UsernameRegexTemplate}
   */
  cdnAvatarDecoration: {
    start: `${CDN_HOST}/avatar-decoration-presets/`,
    validValues: '[A-Za-z0-9_-]',
    length: [1, 64],
    domainPattern: CDN_EXT,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Application Icon or Cover (shared path).
   * @type {UsernameRegexTemplate}
   */
  cdnApplicationIcon: {
    start: `${CDN_HOST}/app-icons/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Application Asset
   * @type {UsernameRegexTemplate}
   */
  cdnApplicationAsset: {
    start: `${CDN_HOST}/app-assets/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Achievement Icon
   * @type {UsernameRegexTemplate}
   */
  cdnAchievementIcon: {
    start: `${CDN_HOST}/app-assets/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/achievements/[0-9]{17,22}/icons/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Store Page Asset
   * @type {UsernameRegexTemplate}
   */
  cdnStorePageAsset: {
    start: `${CDN_HOST}/app-assets/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/store/${CDN_HASH}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Sticker Pack Banner
   * Format: https://cdn.discordapp.com/app-assets/APP_ID/store/HASH.png
   * @type {UsernameRegexTemplate}
   */
  cdnStickerPackBanner: {
    start: `${CDN_HOST}/app-assets/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/store/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Team Icon
   * @type {UsernameRegexTemplate}
   */
  cdnTeamIcon: {
    start: `${CDN_HOST}/team-icons/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Sticker
   * @type {UsernameRegexTemplate}
   */
  cdnSticker: {
    start: `${CDN_HOST}/stickers/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: CDN_EXT,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Role Icon
   * @type {UsernameRegexTemplate}
   */
  cdnRoleIcon: {
    start: `${CDN_HOST}/role-icons/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Scheduled Event Cover
   * @type {UsernameRegexTemplate}
   */
  cdnGuildScheduledEventCover: {
    start: `${CDN_HOST}/guild-events/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },

  /**
   * CDN: Guild Tag Badge
   * @type {UsernameRegexTemplate}
   */
  cdnGuildTagBadge: {
    start: `${CDN_HOST}/guild-tag-badges/`,
    validValues: '[0-9]',
    length: [17, 22],
    domainPattern: `/${CDN_HASH}${CDN_EXT}`,
    end: OPTIONAL_QUERY_STRING,
  },
});

export default DiscordRegex;
