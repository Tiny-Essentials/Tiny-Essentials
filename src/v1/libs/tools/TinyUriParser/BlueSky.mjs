import TinyUriParser from '../TinyUriParser.mjs';

/**
 * BlueSky (AT Protocol) Text Elements
 * Official Documentation: https://docs.bsky.app/docs/advanced-guides/api-directory
 */

/**
 * The kind of BlueSky resource referenced by a web URL.
 * @typedef {'' | 'post' | 'feed' | 'lists'} BlueSkyWebUrlKind
 */

/**
 * Represents a parsed BlueSky handle (e.g., `@alice.bsky.social`).
 * @typedef {Object} BlueSkyHandleData
 * @property {'handle'} dataType - The discriminator for a handle element.
 * @property {string} handle - The handle, without the leading `@`.
 */

/**
 * Represents a parsed BlueSky Decentralized Identifier (DID).
 * @typedef {Object} BlueSkyDidData
 * @property {'did'} dataType - The discriminator for a DID element.
 * @property {'plc' | 'web'} method - The DID method.
 * @property {string} identifier - The method-specific identifier.
 */

/**
 * Represents a parsed AT URI (e.g., `at://did:plc:x/app.bsky.feed.post/y`).
 * @typedef {Object} BlueSkyAtUriData
 * @property {'at_uri'} dataType - The discriminator for an AT URI element.
 * @property {string} authority - The authority segment (DID or handle).
 * @property {string} collection - The collection NSID (e.g., `app.bsky.feed.post`).
 * @property {string} rkey - The record key.
 */

/**
 * Represents a parsed BlueSky web URL (e.g., `https://bsky.app/...`).
 * @typedef {Object} BlueSkyWebUrlData
 * @property {'web_url'} dataType - The discriminator for a web URL element.
 * @property {string} actor - The handle or DID present in the URL.
 * @property {BlueSkyWebUrlKind} kind - The resource kind, or an empty string for a profile.
 * @property {string} rkey - The record key, or an empty string for a profile.
 * @property {string} url - The original URL.
 */

/**
 * Represents a parsed BlueSky hashtag.
 * @typedef {Object} BlueSkyHashtagData
 * @property {'hashtag'} dataType - The discriminator for a hashtag element.
 * @property {string} tag - The tag, without the leading `#`.
 */

/**
 * Matches a BlueSky handle, with an optional leading `@`.
 * @type {RegExp}
 */
const handleRegex =
  /^@?(?<handle>(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,})$/;

/**
 * Matches a BlueSky DID.
 * @type {RegExp}
 */
const didRegex = /^did:(?<method>plc|web):(?<identifier>[a-zA-Z0-9._:%-]+)$/;

/**
 * Matches an AT URI.
 * @type {RegExp}
 */
const atUriRegex = /^at:\/\/(?<authority>[^/]+)\/(?<collection>[^/]+)\/(?<rkey>[^/]+)$/;

/**
 * Matches a BlueSky web URL.
 * @type {RegExp}
 */
const webUrlRegex =
  /^https?:\/\/bsky\.app\/profile\/(?<actor>[^/]+)(?:\/(?<kind>post|feed|lists)\/(?<rkey>[^/?#]+))?\/?$/;

/**
 * Matches a BlueSky hashtag.
 * @type {RegExp}
 */
const hashtagRegex = /^#(?<tag>\p{L}[\p{L}\p{N}_]*)$/u;

/**
 * Validates a parsed BlueSky handle object.
 * @param {BlueSkyHandleData} data - The handle data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateHandleData = (data) => {
  if (typeof data.handle !== 'string' || data.handle.length === 0) {
    throw new TypeError('BlueSkyHandleData: handle must be a non-empty string.');
  }
};

/**
 * Validates a parsed BlueSky DID object.
 * @param {BlueSkyDidData} data - The DID data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateDidData = (data) => {
  if (data.method !== 'plc' && data.method !== 'web') {
    throw new TypeError(`BlueSkyDidData: invalid method "${data.method}".`);
  }
  if (typeof data.identifier !== 'string' || data.identifier.length === 0) {
    throw new TypeError('BlueSkyDidData: identifier must be a non-empty string.');
  }
};

/**
 * Validates a parsed AT URI object.
 * @param {BlueSkyAtUriData} data - The AT URI data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateAtUriData = (data) => {
  if (typeof data.authority !== 'string' || data.authority.length === 0) {
    throw new TypeError('BlueSkyAtUriData: authority must be a non-empty string.');
  }
  if (typeof data.collection !== 'string' || data.collection.length === 0) {
    throw new TypeError('BlueSkyAtUriData: collection must be a non-empty string.');
  }
  if (typeof data.rkey !== 'string' || data.rkey.length === 0) {
    throw new TypeError('BlueSkyAtUriData: rkey must be a non-empty string.');
  }
};

/**
 * Validates a parsed BlueSky web URL object.
 * @param {BlueSkyWebUrlData} data - The web URL data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateWebUrlData = (data) => {
  if (typeof data.actor !== 'string' || data.actor.length === 0) {
    throw new TypeError('BlueSkyWebUrlData: actor must be a non-empty string.');
  }
  if (!['', 'post', 'feed', 'lists'].includes(data.kind)) {
    throw new TypeError(`BlueSkyWebUrlData: invalid kind "${data.kind}".`);
  }
  if (typeof data.rkey !== 'string') {
    throw new TypeError('BlueSkyWebUrlData: rkey must be a string.');
  }
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new TypeError('BlueSkyWebUrlData: url must be a non-empty string.');
  }
};

/**
 * Validates a parsed BlueSky hashtag object.
 * @param {BlueSkyHashtagData} data - The hashtag data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateHashtagData = (data) => {
  if (typeof data.tag !== 'string' || data.tag.length === 0) {
    throw new TypeError('BlueSkyHashtagData: tag must be a non-empty string.');
  }
};

/**
 * Parses a BlueSky handle element.
 * @param {string} uri - The raw handle string (e.g., `@alice.bsky.social`).
 * @returns {BlueSkyHandleData} The parsed handle data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the handle grammar.
 */
const parseHandle = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('BlueSkyHandleData: uri must be a string.');
  }
  const match = handleRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid BlueSky handle: ${uri}`);
  }
  /** @type {BlueSkyHandleData} */
  const data = { dataType: 'handle', handle: match.groups.handle };
  validateHandleData(data);
  return data;
};

/**
 * Parses a BlueSky DID element.
 * @param {string} uri - The raw DID string (e.g., `did:plc:abc123`).
 * @returns {BlueSkyDidData} The parsed DID data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the DID grammar.
 */
const parseDid = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('BlueSkyDidData: uri must be a string.');
  }
  const match = didRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid BlueSky DID: ${uri}`);
  }
  /** @type {BlueSkyDidData} */
  const data = {
    dataType: 'did',
    method: /** @type {'plc' | 'web'} */ (match.groups.method),
    identifier: match.groups.identifier,
  };
  validateDidData(data);
  return data;
};

/**
 * Parses a BlueSky AT URI element.
 * @param {string} uri - The raw AT URI string.
 * @returns {BlueSkyAtUriData} The parsed AT URI data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the AT URI grammar.
 */
const parseAtUri = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('BlueSkyAtUriData: uri must be a string.');
  }
  const match = atUriRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid BlueSky AT URI: ${uri}`);
  }
  /** @type {BlueSkyAtUriData} */
  const data = {
    dataType: 'at_uri',
    authority: match.groups.authority,
    collection: match.groups.collection,
    rkey: match.groups.rkey,
  };
  validateAtUriData(data);
  return data;
};

/**
 * Parses a BlueSky web URL element.
 * @param {string} uri - The raw web URL string.
 * @returns {BlueSkyWebUrlData} The parsed web URL data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the web URL grammar.
 */
const parseWebUrl = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('BlueSkyWebUrlData: uri must be a string.');
  }
  const match = webUrlRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid BlueSky web URL: ${uri}`);
  }
  /** @type {BlueSkyWebUrlData} */
  const data = {
    dataType: 'web_url',
    actor: match.groups.actor,
    kind: /** @type {BlueSkyWebUrlKind} */ (match.groups.kind ?? ''),
    rkey: match.groups.rkey ?? '',
    url: uri,
  };
  validateWebUrlData(data);
  return data;
};

/**
 * Parses a BlueSky hashtag element.
 * @param {string} uri - The raw hashtag string (e.g., `#javascript`).
 * @returns {BlueSkyHashtagData} The parsed hashtag data.
 * @throws {TypeError} If the input is not a string or fails validation.
 * @throws {SyntaxError} If the input does not match the hashtag grammar.
 */
const parseHashtag = (uri) => {
  if (typeof uri !== 'string') {
    throw new TypeError('BlueSkyHashtagData: uri must be a string.');
  }
  const match = hashtagRegex.exec(uri);
  if (!match || !match.groups) {
    throw new SyntaxError(`Invalid BlueSky hashtag: ${uri}`);
  }
  /** @type {BlueSkyHashtagData} */
  const data = { dataType: 'hashtag', tag: match.groups.tag };
  validateHashtagData(data);
  return data;
};

/**
 * Reconstructs a BlueSky handle string from parsed data.
 * @param {BlueSkyHandleData} data - The handle data.
 * @returns {string} The reconstructed handle string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyHandle = (data) => {
  validateHandleData(data);
  return `@${data.handle}`;
};

/**
 * Reconstructs a BlueSky DID string from parsed data.
 * @param {BlueSkyDidData} data - The DID data.
 * @returns {string} The reconstructed DID string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyDid = (data) => {
  validateDidData(data);
  return `did:${data.method}:${data.identifier}`;
};

/**
 * Reconstructs a BlueSky AT URI string from parsed data.
 * @param {BlueSkyAtUriData} data - The AT URI data.
 * @returns {string} The reconstructed AT URI string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyAtUri = (data) => {
  validateAtUriData(data);
  return `at://${data.authority}/${data.collection}/${data.rkey}`;
};

/**
 * Reconstructs a BlueSky web URL string from parsed data.
 * @param {BlueSkyWebUrlData} data - The web URL data.
 * @returns {string} The reconstructed web URL string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyWebUrl = (data) => {
  validateWebUrlData(data);
  if (!data.kind) return `https://bsky.app/profile/${data.actor}`;
  return `https://bsky.app/profile/${data.actor}/${data.kind}/${data.rkey}`;
};

/**
 * Reconstructs a BlueSky hashtag string from parsed data.
 * @param {BlueSkyHashtagData} data - The hashtag data.
 * @returns {string} The reconstructed hashtag string.
 * @throws {TypeError} If the data is invalid.
 */
const stringifyHashtag = (data) => {
  validateHashtagData(data);
  return `#${data.tag}`;
};

/**
 * A parser pair for BlueSky handles (`@alice.bsky.social`).
 */
export const BlueSkyHandleParser = TinyUriParser.buildParserPair(
  'handle',
  (uriString) => handleRegex.test(uriString),
  parseHandle,
  stringifyHandle,
);

/**
 * A parser pair for BlueSky DIDs (`did:plc:...`, `did:web:...`).
 */
export const BlueSkyDidParser = TinyUriParser.buildParserPair(
  'did',
  (uriString) => didRegex.test(uriString),
  parseDid,
  stringifyDid,
);

/**
 * A parser pair for BlueSky AT URIs (`at://...`).
 */
export const BlueSkyAtUriParser = TinyUriParser.buildParserPair(
  'at_uri',
  (uriString) => atUriRegex.test(uriString),
  parseAtUri,
  stringifyAtUri,
);

/**
 * A parser pair for BlueSky web URLs (`https://bsky.app/...`).
 */
export const BlueSkyWebUrlParser = TinyUriParser.buildParserPair(
  'web_url',
  (uriString) => webUrlRegex.test(uriString),
  parseWebUrl,
  stringifyWebUrl,
);

/**
 * A parser pair for BlueSky hashtags (`#javascript`).
 */
export const BlueSkyHashtagParser = TinyUriParser.buildParserPair(
  'hashtag',
  (uriString) => hashtagRegex.test(uriString),
  parseHashtag,
  stringifyHashtag,
);

/**
 * An array of BlueSky parser pairs, ordered from the most specific to the most permissive.
 */
export const BlueSkyProtocolParsers = Object.freeze([
  BlueSkyWebUrlParser,
  BlueSkyAtUriParser,
  BlueSkyDidParser,
  BlueSkyHashtagParser,
  BlueSkyHandleParser,
]);
