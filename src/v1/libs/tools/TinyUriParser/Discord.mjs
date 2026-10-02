import TinyUriParser from '../TinyUriParser.mjs';

/**
 * Discord Text Elements
 * Official Documentation: https://discord.com/developers/docs/reference#message-formatting
 */

/**
 * The category of entity targeted by a Discord mention.
 * @typedef {'user' | 'role' | 'channel'} DiscordMentionTarget
 */

/**
 * A plain key/value map of decoded query string parameters.
 * @typedef {Record<string, string>} DiscordQueryParams
 */

/**
 * Represents a parsed Discord mention element.
 * @typedef {Object} DiscordMentionData
 * @property {'mention'} dataType - The discriminator for a mention element.
 * @property {DiscordMentionTarget} target - The kind of entity being mentioned.
 * @property {string} id - The snowflake identifier of the mentioned entity.
 * @property {boolean} isNickname - Whether the mention uses the nickname syntax (`<@!id>`).
 */

/**
 * Represents a parsed Discord game profile element.
 * @typedef {Object} DiscordGameProfileData
 * @property {'game_profile'} dataType - The discriminator for a game profile element.
 * @property {string} id - The snowflake identifier of the game.
 */

/**
 * The in-application navigation tab targeted by a guild navigation element.
 * @typedef {'customize' | 'browse' | 'guide' | 'linked-roles'} DiscordGuildNavigationTarget
 */

/**
 * Represents a parsed Discord guild navigation element.
 * @typedef {Object} DiscordGuildNavigationData
 * @property {'guild_navigation'} dataType - The discriminator for a guild navigation element.
 * @property {DiscordGuildNavigationTarget} target - The navigation tab to open.
 * @property {string | null} roleId - The linked role snowflake, or `null` when the tab has no role.
 */

/**
 * Represents a parsed Discord custom emoji element.
 * @typedef {Object} DiscordEmojiData
 * @property {'emoji'} dataType - The discriminator for an emoji element.
 * @property {string} name - The name of the emoji.
 * @property {string} id - The snowflake identifier of the emoji.
 * @property {boolean} animated - Whether the emoji is animated.
 */

/**
 * Represents a parsed Discord timestamp element.
 * @typedef {Object} DiscordTimestampData
 * @property {'timestamp'} dataType - The discriminator for a timestamp element.
 * @property {number} timestamp - The Unix timestamp, in seconds.
 * @property {string} style - The formatting style flag, or an empty string when omitted.
 */

/**
 * The structural parts of a Discord slash command path.
 * @typedef {Object} DiscordCommandPath
 * @property {string} command - The root command name.
 * @property {string | null} subcommandGroup - The subcommand group, or `null` when absent.
 * @property {string | null} subcommand - The subcommand, or `null` when absent.
 */

/**
 * Represents a parsed Discord slash command element.
 * @typedef {Object} DiscordCommandData
 * @property {'command'} dataType - The discriminator for a command element.
 * @property {string} name - The full command path, without the leading slash (e.g., `play music`).
 * @property {string} command - The root command name.
 * @property {string | null} subcommandGroup - The subcommand group, or `null` when absent.
 * @property {string | null} subcommand - The subcommand, or `null` when absent.
 * @property {string} id - The snowflake identifier of the command.
 */

/**
 * Represents a parsed Discord invite link.
 * @typedef {Object} DiscordInviteData
 * @property {'invite'} dataType - The discriminator for an invite element.
 * @property {string} code - The invite code or server slug.
 * @property {'discord.gg' | 'discord.com' | 'discordapp.com'} host - The normalized host.
 * @property {'invite' | 'servers' | null} kind - The path kind, or `null` for short links.
 * @property {boolean} obfuscated - Whether the source used whitespace obfuscation.
 * @property {DiscordQueryParams} params - The decoded query string parameters.
 * @property {string} url - The canonical invite URL.
 */

/**
 * Represents a parsed Discord message link.
 * @typedef {Object} DiscordMessageLinkData
 * @property {'message_link'} dataType - The discriminator for a message link element.
 * @property {string} guildId - The guild snowflake, or '@me' for direct messages.
 * @property {string} channelId - The channel snowflake.
 * @property {string} messageId - The message snowflake.
 * @property {DiscordQueryParams} params - The decoded query string parameters.
 * @property {string} url - The canonical message URL.
 */

/**
 * Matches a Discord mention: `<@id>`, `<@!id>`, `<@&id>` or `<#id>`.
 * @type {RegExp}
 */
const mentionRegex = /^<(?<prefix>@!?|@&|#)(?<id>\d+)>$/;

/**
 * Matches a Discord game profile: `<@$id>`.
 * @type {RegExp}
 */
const gameProfileRegex = /^<@\$(?<id>\d+)>$/;

/**
 * Matches a Discord guild navigation element: `<id:type>` or `<id:linked-roles:roleId>`.
 * @type {RegExp}
 */
const guildNavigationRegex = /^<id:(?<target>[a-z-]+)(?::(?<roleId>\d+))?>$/;

/**
 * Matches a Discord custom emoji: `<:name:id>` or `<a:name:id>`.
 * @type {RegExp}
 */
const emojiRegex = /^<(?<animated>a)?:(?<name>\w+):(?<id>\d+)>$/;

/**
 * Matches a Discord timestamp: `<t:unix>` or `<t:unix:style>`.
 * @type {RegExp}
 */
const timestampRegex = /^<t:(?<timestamp>\d+)(?::(?<style>[tTdDfFRsS]))?>$/;

/**
 * Matches a Discord slash command: `</name:id>`, `</name subcommand:id>` or
 * `</name group subcommand:id>`.
 * @type {RegExp}
 */
const commandRegex = /^<\/(?<name>[\w-]+(?: [\w-]+){0,2}):(?<id>\d+)>$/;

/**
 * Matches a standard Discord invite URL, with an optional query string.
 * @type {RegExp}
 */
const inviteRegex =
  /^(?:https?:\/\/)?(?:www\.)?(?:(?<shortHost>discord\.gg)\/(?<shortCode>[\w-]+)|(?<fullHost>discord(?:app)?\.com)\/(?<kind>invite|servers)\/(?<code>[\w-]+))\/?(?:\?(?<query>[^#\s]*))?$/i;

/**
 * Matches a whitespace-obfuscated Discord invite, with an optional query string.
 * @type {RegExp}
 */
const obfuscatedInviteRegex =
  /^\s*(?<host>discord(?:app)?\s*\.\s*(?:gg|co(?:m)?))(?:\s*\/\s*(?:(?<kind>invite|servers)\s*\/\s*)?)(?<code>[\w-]+)(?:\s*\?\s*(?<query>[^#\s]*))?\s*$/i;

/**
 * Matches a Discord message URL, with an optional query string.
 * @type {RegExp}
 */
const messageLinkRegex =
  /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(?<guildId>@me|\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)\/?(?:\?(?<query>[^#\s]*))?$/;

/**
 * The list of supported guild navigation targets.
 * @type {readonly DiscordGuildNavigationTarget[]}
 */
const GUILD_NAVIGATION_TARGETS = Object.freeze(['customize', 'browse', 'guide', 'linked-roles']);

/**
 * Parses a raw query string into a plain object of key/value pairs.
 * @param {string | undefined} rawQuery - The raw query string, without the leading `?`.
 * @returns {DiscordQueryParams} The parsed query parameters.
 */
const parseQuery = (rawQuery) => {
  if (!rawQuery) return {};
  return Object.fromEntries(new URLSearchParams(rawQuery).entries());
};

/**
 * Serializes a parameter map into a canonical query string.
 * @param {DiscordQueryParams} params - The parameters to serialize.
 * @returns {string} The serialized query string, including the leading `?`, or an empty string.
 */
const buildQuery = (params) => {
  const query = new URLSearchParams(params).toString();
  return query ? `?${query}` : '';
};

/**
 * Validates a parsed Discord mention object.
 * @param {DiscordMentionData} data - The mention data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateMentionData = (data) => {
  if (!['user', 'role', 'channel'].includes(data.target)) {
    throw new TypeError(`DiscordMentionData: invalid target "${data.target}".`);
  }
  if (typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
    throw new TypeError('DiscordMentionData: id must be a numeric string.');
  }
  if (typeof data.isNickname !== 'boolean') {
    throw new TypeError('DiscordMentionData: isNickname must be a boolean.');
  }
};

/**
 * Validates a parsed Discord game profile object.
 * @param {DiscordGameProfileData} data - The game profile data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateGameProfileData = (data) => {
  if (typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
    throw new TypeError('DiscordGameProfileData: id must be a numeric string.');
  }
};

/**
 * Validates a parsed Discord guild navigation object.
 * @param {DiscordGuildNavigationData} data - The guild navigation data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateGuildNavigationData = (data) => {
  if (!GUILD_NAVIGATION_TARGETS.includes(data.target)) {
    throw new TypeError(`DiscordGuildNavigationData: invalid target "${data.target}".`);
  }
  if (data.roleId !== null && (typeof data.roleId !== 'string' || !/^\d+$/.test(data.roleId))) {
    throw new TypeError('DiscordGuildNavigationData: roleId must be a numeric string or null.');
  }
  if (data.target !== 'linked-roles' && data.roleId !== null) {
    throw new TypeError('DiscordGuildNavigationData: roleId is only valid for "linked-roles".');
  }
};

/**
 * Validates a parsed Discord emoji object.
 * @param {DiscordEmojiData} data - The emoji data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateEmojiData = (data) => {
  if (typeof data.name !== 'string' || data.name.length === 0) {
    throw new TypeError('DiscordEmojiData: name must be a non-empty string.');
  }
  if (typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
    throw new TypeError('DiscordEmojiData: id must be a numeric string.');
  }
  if (typeof data.animated !== 'boolean') {
    throw new TypeError('DiscordEmojiData: animated must be a boolean.');
  }
};

/**
 * Validates a parsed Discord timestamp object.
 * @param {DiscordTimestampData} data - The timestamp data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateTimestampData = (data) => {
  if (!Number.isInteger(data.timestamp) || data.timestamp < 0) {
    throw new TypeError('DiscordTimestampData: timestamp must be a non-negative integer.');
  }
  if (typeof data.style !== 'string' || !/^[tTdDfFRsS]?$/.test(data.style)) {
    throw new TypeError(
      'DiscordTimestampData: style must be a valid style flag or an empty string.',
    );
  }
};

/**
* Splits a raw command path into its structural parts.
* @param {string} name - The raw command path (e.g., `play music`).
* @returns {DiscordCommandPath} The split command path.
* @throws {TypeError} If the name is not a valid command path.
*/
const splitCommandPath = (name) => {
  if (typeof name !== 'string' || !/^[\w-]+(?: [\w-]+){0,2}$/.test(name)) {
    throw new TypeError(
      'DiscordCommandData: name must contain one to three space-separated segments.',
    );
  }
  const [command, second, third] = name.split(' ');
  return {
    command,
    subcommandGroup: third === undefined ? null : second,
    subcommand: second === undefined ? null : (third ?? second),
  };
};

/**
 * Validates a parsed Discord command object.
 * @param {DiscordCommandData} data - The command data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateCommandData = (data) => {
  const expected = splitCommandPath(data.name);
  if (data.command !== expected.command) {
    throw new TypeError(`DiscordCommandData: command must be "${expected.command}".`);
  }
  if (data.subcommandGroup !== expected.subcommandGroup) {
    throw new TypeError(
      `DiscordCommandData: subcommandGroup must be ${JSON.stringify(expected.subcommandGroup)}.`,
    );
  }
  if (data.subcommand !== expected.subcommand) {
    throw new TypeError(
      `DiscordCommandData: subcommand must be ${JSON.stringify(expected.subcommand)}.`,
    );
  }
  if (typeof data.id !== 'string' || !/^\d+$/.test(data.id)) {
    throw new TypeError('DiscordCommandData: id must be a numeric string.');
  }
};

/**
 * Validates a parsed Discord invite object.
 * @param {DiscordInviteData} data - The invite data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateInviteData = (data) => {
  if (typeof data.code !== 'string' || data.code.length === 0) {
    throw new TypeError('DiscordInviteData: code must be a non-empty string.');
  }
  if (!['discord.gg', 'discord.com', 'discordapp.com'].includes(data.host)) {
    throw new TypeError(`DiscordInviteData: invalid host "${data.host}".`);
  }
  if (data.kind !== null && data.kind !== 'invite' && data.kind !== 'servers') {
    throw new TypeError(`DiscordInviteData: invalid kind "${data.kind}".`);
  }
  if (data.host === 'discord.gg' && data.kind !== null) {
    throw new TypeError('DiscordInviteData: discord.gg must not include a path kind.');
  }
  if (data.host !== 'discord.gg' && data.kind === null) {
    throw new TypeError('DiscordInviteData: this host requires a path kind.');
  }
  if (typeof data.obfuscated !== 'boolean') {
    throw new TypeError('DiscordInviteData: obfuscated must be a boolean.');
  }
  if (data.params === null || typeof data.params !== 'object' || Array.isArray(data.params)) {
    throw new TypeError('DiscordInviteData: params must be a plain object.');
  }
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new TypeError('DiscordInviteData: url must be a non-empty string.');
  }
};

/**
 * Validates a parsed Discord message link object.
 * @param {DiscordMessageLinkData} data - The message link data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateMessageLinkData = (data) => {
  if (typeof data.guildId !== 'string' || data.guildId.length === 0) {
    throw new TypeError('DiscordMessageLinkData: guildId must be a non-empty string.');
  }
  if (typeof data.channelId !== 'string' || !/^\d+$/.test(data.channelId)) {
    throw new TypeError('DiscordMessageLinkData: channelId must be a numeric string.');
  }
  if (typeof data.messageId !== 'string' || !/^\d+$/.test(data.messageId)) {
    throw new TypeError('DiscordMessageLinkData: messageId must be a numeric string.');
  }
  if (data.params === null || typeof data.params !== 'object' || Array.isArray(data.params)) {
    throw new TypeError('DiscordMessageLinkData: params must be a plain object.');
  }
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new TypeError('DiscordMessageLinkData: url must be a non-empty string.');
  }
};

/**
 * Parses a Discord mention element.
 * @param {string} uri - The raw mention string (e.g., `<@123>`, `<@&123>`, `<#123>`).
 * @returns {DiscordMentionData} The parsed mention data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the mention grammar.
 */
const parseMention = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordMentionData: uri must be a string.');
  }
  const match = mentionRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord mention: ${uri}`);
  }
  const { prefix, id } = match.groups;
  /** @type {DiscordMentionTarget} */
  let target = 'user';
  let isNickname = false;
  if (prefix === '#') {
    target = 'channel';
  } else if (prefix === '@&') {
    target = 'role';
  } else {
    target = 'user';
    isNickname = prefix === '@!';
  }
  /** @type {DiscordMentionData} */
  const data = { dataType: 'mention', target, id, isNickname };
  validateMentionData(data);
  return data;
};

/**
 * Parses a Discord game profile element.
 * @param {string} uri - The raw game profile string (e.g., `<@$1402418491272986635>`).
 * @returns {DiscordGameProfileData} The parsed game profile data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the game profile grammar.
 */
const parseGameProfile = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordGameProfileData: uri must be a string.');
  }
  const match = gameProfileRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord game profile: ${uri}`);
  }
  /** @type {DiscordGameProfileData} */
  const data = { dataType: 'game_profile', id: match.groups.id };
  validateGameProfileData(data);
  return data;
};

/**
 * Parses a Discord guild navigation element.
 * @param {string} uri - The raw guild navigation string (e.g., `<id:linked-roles:123>`).
 * @returns {DiscordGuildNavigationData} The parsed guild navigation data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the guild navigation grammar.
 */
const parseGuildNavigation = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordGuildNavigationData: uri must be a string.');
  }
  const match = guildNavigationRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord guild navigation: ${uri}`);
  }
  /** @type {DiscordGuildNavigationData} */
  const data = {
    dataType: 'guild_navigation',
    target: /** @type {DiscordGuildNavigationTarget} */ (match.groups.target),
    roleId: match.groups.roleId ?? null,
  };
  validateGuildNavigationData(data);
  return data;
};

/**
 * Parses a Discord custom emoji element.
 * @param {string} uri - The raw emoji string (e.g., `<:name:123>`).
 * @returns {DiscordEmojiData} The parsed emoji data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the emoji grammar.
 */
const parseEmoji = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordEmojiData: uri must be a string.');
  }
  const match = emojiRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord emoji: ${uri}`);
  }
  /** @type {DiscordEmojiData} */
  const data = {
    dataType: 'emoji',
    name: match.groups.name,
    id: match.groups.id,
    animated: Boolean(match.groups.animated),
  };
  validateEmojiData(data);
  return data;
};

/**
 * Parses a Discord timestamp element.
 * @param {string} uri - The raw timestamp string (e.g., `<t:1618953630:R>`).
 * @returns {DiscordTimestampData} The parsed timestamp data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the timestamp grammar.
 */
const parseTimestamp = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordTimestampData: uri must be a string.');
  }
  const match = timestampRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord timestamp: ${uri}`);
  }
  /** @type {DiscordTimestampData} */
  const data = {
    dataType: 'timestamp',
    timestamp: Number(match.groups.timestamp),
    style: match.groups.style ?? '',
  };
  validateTimestampData(data);
  return data;
};

/**
* Builds and validates a `DiscordCommandData` object from a raw command path.
* @param {string} name - The full command path (e.g., `play music`).
* @param {string} id - The snowflake identifier of the command.
* @returns {DiscordCommandData} The validated command data.
* @throws {TypeError} If the resulting object is invalid.
*/
const buildCommandData = (name, id) => {
  /** @type {DiscordCommandData} */
  const data = { dataType: 'command', name, ...splitCommandPath(name), id };
  validateCommandData(data);
  return data;
};

/**
 * Parses a Discord slash command element.
 * @param {string} uri - The raw command string (e.g., `</play music:123>`).
 * @returns {DiscordCommandData} The parsed command data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the command grammar.
 */
const parseCommand = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordCommandData: uri must be a string.');
  }
  const match = commandRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord command: ${uri}`);
  }
  return buildCommandData(match.groups.name, match.groups.id);
};

/**
 * Normalizes a raw host by removing whitespace and lowercasing it.
 * @param {string} rawHost - The raw host captured by a regular expression.
 * @returns {string} The normalized host.
 */
const normalizeHost = (rawHost) => {
  const compact = rawHost.replace(/\s+/g, '').toLowerCase();
  return compact === 'discord.co' ? 'discord.com' : compact;
};

/**
 * Builds the canonical invite URL for a normalized host, kind, code and query.
 * @param {string} host - The normalized host.
 * @param {string | null} kind - The path kind, or `null` for short links.
 * @param {string} code - The invite code or server slug.
 * @param {DiscordQueryParams} params - The query string parameters.
 * @returns {string} The canonical invite URL.
 */
const buildInviteUrl = (host, kind, code, params) => {
  const base = kind ? `https://${host}/${kind}/${code}` : `https://${host}/${code}`;
  return `${base}${buildQuery(params)}`;
};

/**
 * Builds the canonical message URL for a guild, channel, message and query.
 * @param {string} guildId - The guild snowflake, or '@me' for direct messages.
 * @param {string} channelId - The channel snowflake.
 * @param {string} messageId - The message snowflake.
 * @param {DiscordQueryParams} params - The query string parameters.
 * @returns {string} The canonical message URL.
 */
const buildMessageLinkUrl = (guildId, channelId, messageId, params) => {
  const base = `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
  return `${base}${buildQuery(params)}`;
};

/**
 * Builds and validates a `DiscordInviteData` object.
 * @param {string} rawHost - The raw host captured by a regular expression.
 * @param {string | null} rawKind - The raw path kind, or `null`.
 * @param {string} code - The invite code or server slug.
 * @param {string | undefined} rawQuery - The raw query string, without the leading `?`.
 * @param {boolean} obfuscated - Whether the source used whitespace obfuscation.
 * @returns {DiscordInviteData} The validated invite data.
 * @throws {TypeError} If the resulting object is invalid.
 */
const buildInviteData = (rawHost, rawKind, code, rawQuery, obfuscated) => {
  const host = normalizeHost(rawHost);
  const kind = rawKind ? rawKind.toLowerCase() : null;
  const params = parseQuery(rawQuery);
  /** @type {DiscordInviteData} */
  const data = {
    dataType: 'invite',
    code,
    host: /** @type {DiscordInviteData['host']} */ (host),
    kind: /** @type {DiscordInviteData['kind']} */ (kind),
    obfuscated,
    params,
    url: buildInviteUrl(host, kind, code, params),
  };
  validateInviteData(data);
  return data;
};

/**
 * Parses a Discord invite link.
 * @param {string} uri - The raw invite URL.
 * @returns {DiscordInviteData} The parsed invite data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the invite grammar.
 */
const parseInvite = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordInviteData: uri must be a string.');
  }

  const cleanMatch = inviteRegex.exec(uri);
  if (cleanMatch?.groups) {
    const { shortHost, shortCode, fullHost, kind, code, query } = cleanMatch.groups;
    return buildInviteData(shortHost ?? fullHost, kind ?? null, shortCode ?? code, query, false);
  }

  const obfuscatedMatch = obfuscatedInviteRegex.exec(uri);
  if (obfuscatedMatch?.groups) {
    const { host, kind, code, query } = obfuscatedMatch.groups;
    return buildInviteData(host, kind ?? null, code, query, true);
  }

  throw new SyntaxError(`Invalid Discord invite: ${uri}`);
};

/**
 * Parses a Discord message link.
 * @param {string} uri - The raw message URL.
 * @returns {DiscordMessageLinkData} The parsed message link data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the message link grammar.
 */
const parseMessageLink = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('DiscordMessageLinkData: uri must be a string.');
  }
  const match = messageLinkRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid Discord message link: ${uri}`);
  }
  const { guildId, channelId, messageId } = match.groups;
  const params = parseQuery(match.groups.query);
  /** @type {DiscordMessageLinkData} */
  const data = {
    dataType: 'message_link',
    guildId,
    channelId,
    messageId,
    params,
    url: buildMessageLinkUrl(guildId, channelId, messageId, params),
  };
  validateMessageLinkData(data);
  return data;
};

/**
 * Reconstructs a Discord mention string from parsed data.
 * @param {DiscordMentionData} data - The mention data.
 * @returns {string} The reconstructed mention string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyMention = (data) => {
  validateMentionData(data);
  if (data.target === 'channel') return `<#${data.id}>`;
  if (data.target === 'role') return `<@&${data.id}>`;
  return data.isNickname ? `<@!${data.id}>` : `<@${data.id}>`;
};

/**
 * Reconstructs a Discord game profile string from parsed data.
 * @param {DiscordGameProfileData} data - The game profile data.
 * @returns {string} The reconstructed game profile string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyGameProfile = (data) => {
  validateGameProfileData(data);
  return `<@$${data.id}>`;
};

/**
 * Reconstructs a Discord guild navigation string from parsed data.
 * @param {DiscordGuildNavigationData} data - The guild navigation data.
 * @returns {string} The reconstructed guild navigation string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyGuildNavigation = (data) => {
  validateGuildNavigationData(data);
  return data.roleId ? `<id:${data.target}:${data.roleId}>` : `<id:${data.target}>`;
};

/**
 * Reconstructs a Discord custom emoji string from parsed data.
 * @param {DiscordEmojiData} data - The emoji data.
 * @returns {string} The reconstructed emoji string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyEmoji = (data) => {
  validateEmojiData(data);
  return `<${data.animated ? 'a' : ''}:${data.name}:${data.id}>`;
};

/**
 * Reconstructs a Discord timestamp string from parsed data.
 * @param {DiscordTimestampData} data - The timestamp data.
 * @returns {string} The reconstructed timestamp string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyTimestamp = (data) => {
  validateTimestampData(data);
  return data.style ? `<t:${data.timestamp}:${data.style}>` : `<t:${data.timestamp}>`;
};

/**
 * Reconstructs a Discord slash command string from parsed data.
 * @param {DiscordCommandData} data - The command data.
 * @returns {string} The reconstructed command string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyCommand = (data) => {
  validateCommandData(data);
  return `</${data.name}:${data.id}>`;
};

/**
 * Reconstructs a Discord invite URL from parsed data.
 * @param {DiscordInviteData} data - The invite data.
 * @returns {string} The canonical invite URL.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyInvite = (data) => {
  validateInviteData(data);
  return buildInviteUrl(data.host, data.kind, data.code, data.params);
};

/**
 * Reconstructs a Discord message URL from parsed data.
 * @param {DiscordMessageLinkData} data - The message link data.
 * @returns {string} The reconstructed message URL.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyMessageLink = (data) => {
  validateMessageLinkData(data);
  return buildMessageLinkUrl(data.guildId, data.channelId, data.messageId, data.params);
};

/**
 * A parser pair for Discord mentions (`<@id>`, `<@!id>`, `<@&id>`, `<#id>`).
 */
export const DiscordMentionParser = TinyUriParser.buildParserPair(
  'mention',
  (uriString) => mentionRegex.test(uriString),
  parseMention,
  stringifyMention,
);

/**
 * A parser pair for Discord game profiles (`<@$id>`).
 */
export const DiscordGameProfileParser = TinyUriParser.buildParserPair(
  'game_profile',
  (uriString) => gameProfileRegex.test(uriString),
  parseGameProfile,
  stringifyGameProfile,
);

/**
 * A parser pair for Discord guild navigation (`<id:type>`, `<id:linked-roles:id>`).
 */
export const DiscordGuildNavigationParser = TinyUriParser.buildParserPair(
  'guild_navigation',
  (uriString) => guildNavigationRegex.test(uriString),
  parseGuildNavigation,
  stringifyGuildNavigation,
);

/**
 * A parser pair for Discord custom emojis (`<:name:id>`, `<a:name:id>`).
 */
export const DiscordEmojiParser = TinyUriParser.buildParserPair(
  'emoji',
  (uriString) => emojiRegex.test(uriString),
  parseEmoji,
  stringifyEmoji,
);

/**
 * A parser pair for Discord timestamps (`<t:unix>`, `<t:unix:style>`).
 */
export const DiscordTimestampParser = TinyUriParser.buildParserPair(
  'timestamp',
  (uriString) => timestampRegex.test(uriString),
  parseTimestamp,
  stringifyTimestamp,
);

/**
 * A parser pair for Discord slash commands (`</name:id>`).
 */
export const DiscordCommandParser = TinyUriParser.buildParserPair(
  'command',
  (uriString) => commandRegex.test(uriString),
  parseCommand,
  stringifyCommand,
);

/**
 * A parser pair for Discord invite links (`discord.gg/...`, `discord.com/invite/...`,
 * `discord.com/servers/...`), including whitespace-obfuscated variants.
 */
export const DiscordInviteParser = TinyUriParser.buildParserPair(
  'invite',
  (uriString) => inviteRegex.test(uriString) || obfuscatedInviteRegex.test(uriString),
  parseInvite,
  stringifyInvite,
);

/**
 * A parser pair for Discord message links (`https://discord.com/channels/...`).
 */
export const DiscordMessageLinkParser = TinyUriParser.buildParserPair(
  'message_link',
  (uriString) => messageLinkRegex.test(uriString),
  parseMessageLink,
  stringifyMessageLink,
);

/**
 * An array of Discord parser pairs, ordered from the most specific to the most permissive.
 */
export const DiscordProtocolParsers = Object.freeze([
  DiscordMessageLinkParser,
  DiscordInviteParser,
  DiscordGameProfileParser,
  DiscordGuildNavigationParser,
  DiscordMentionParser,
  DiscordEmojiParser,
  DiscordTimestampParser,
  DiscordCommandParser,
]);
