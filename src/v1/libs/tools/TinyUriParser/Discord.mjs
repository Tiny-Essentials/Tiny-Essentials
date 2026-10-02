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
 * Represents a parsed Discord mention element.
 * @typedef {Object} DiscordMentionData
 * @property {'mention'} dataType - The discriminator for a mention element.
 * @property {DiscordMentionTarget} target - The kind of entity being mentioned.
 * @property {string} id - The snowflake identifier of the mentioned entity.
 * @property {boolean} isNickname - Whether the mention uses the nickname syntax (`<@!id>`).
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
 * Represents a parsed Discord slash command element.
 * @typedef {Object} DiscordCommandData
 * @property {'command'} dataType - The discriminator for a command element.
 * @property {string} name - The command name, without the leading slash.
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
 * @property {Record<string, string>} params - The decoded query string parameters.
 * @property {string} url - The canonical invite URL.
 */

/**
 * Represents a parsed Discord message link.
 * @typedef {Object} DiscordMessageLinkData
 * @property {'message_link'} dataType - The discriminator for a message link element.
 * @property {string} guildId - The guild snowflake, or '@me' for direct messages.
 * @property {string} channelId - The channel snowflake.
 * @property {string} messageId - The message snowflake.
 */

/**
 * Matches a Discord mention: `<@id>`, `<@!id>`, `<@&id>` or `<#id>`.
 * @type {RegExp}
 */
const mentionRegex = /^<(?<prefix>@!?|@&|#)(?<id>\d+)>$/;

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
 * Matches a Discord slash command: `</name:id>`.
 * @type {RegExp}
 */
const commandRegex = /^<\/(?<name>[\w-]+):(?<id>\d+)>$/;

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
 * Matches a Discord message URL.
 * @type {RegExp}
 */
const messageLinkRegex =
  /^https?:\/\/(?:www\.)?discord(?:app)?\.com\/channels\/(?<guildId>@me|\d+)\/(?<channelId>\d+)\/(?<messageId>\d+)\/?$/;

/**
 * Parses a raw query string into a plain object of key/value pairs.
 * @param {string | undefined} rawQuery - The raw query string, without the leading `?`.
 * @returns {Record<string, string>} The parsed query parameters.
 */
const parseQuery = (rawQuery) => {
  if (!rawQuery) return {};
  return Object.fromEntries(new URLSearchParams(rawQuery).entries());
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
 * Validates a parsed Discord command object.
 * @param {DiscordCommandData} data - The command data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateCommandData = (data) => {
  if (typeof data.name !== 'string' || data.name.length === 0) {
    throw new TypeError('DiscordCommandData: name must be a non-empty string.');
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
 * Parses a Discord slash command element.
 * @param {string} uri - The raw command string (e.g., `</play:123>`).
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
  /** @type {DiscordCommandData} */
  const data = { dataType: 'command', name: match.groups.name, id: match.groups.id };
  validateCommandData(data);
  return data;
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
 * @param {Record<string, string>} params - The query string parameters.
 * @returns {string} The canonical invite URL.
 */
const buildInviteUrl = (host, kind, code, params) => {
  const base = kind ? `https://${host}/${kind}/${code}` : `https://${host}/${code}`;
  const query = new URLSearchParams(params).toString();
  return query ? `${base}?${query}` : base;
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
  /** @type {DiscordMessageLinkData} */
  const data = {
    dataType: 'message_link',
    guildId: match.groups.guildId,
    channelId: match.groups.channelId,
    messageId: match.groups.messageId,
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
  return `https://discord.com/channels/${data.guildId}/${data.channelId}/${data.messageId}`;
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
  DiscordMentionParser,
  DiscordEmojiParser,
  DiscordTimestampParser,
  DiscordCommandParser,
]);
