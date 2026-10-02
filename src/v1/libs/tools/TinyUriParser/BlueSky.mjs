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
 * Represents a parsed BlueSky handle, decomposed into its DNS components.
 * @typedef {Object} BlueSkyHandleData
 * @property {'handle'} dataType - The discriminator for a handle element.
 * @property {string} handle - The full normalized handle, without the leading `@`.
 * @property {string[]} labels - The DNS labels, in order (e.g., `['alice', 'bsky', 'social']`).
 * @property {number} labelCount - The number of DNS labels.
 * @property {string} tld - The top-level domain (the last label).
 * @property {string} domain - The best-effort registrable domain (last two labels).
 * @property {string | null} subdomain - Everything before the registrable domain, or `null`.
 * @property {boolean} isBskyHosted - Whether the handle ends with `bsky.social`.
 * @property {boolean} isCustomDomain - The logical inverse of `isBskyHosted`.
 */

/**
 * Represents a parsed BlueSky Decentralized Identifier (DID).
 * @typedef {Object} BlueSkyDidData
 * @property {'did'} dataType - The discriminator for a DID element.
 * @property {string} did - The full DID string.
 * @property {'plc' | 'web'} method - The DID method.
 * @property {string} identifier - The raw, method-specific identifier.
 * @property {string | null} domain - The decoded domain (only for `did:web`).
 * @property {number | null} port - The decoded TCP port (only for `did:web`).
 * @property {string[]} pathSegments - The decoded path segments (only for `did:web`).
 */

/**
 * Represents a parsed AT URI.
 * @typedef {Object} BlueSkyAtUriData
 * @property {'at_uri'} dataType - The discriminator for an AT URI element.
 * @property {string} uri - The full AT URI.
 * @property {string} authority - The authority segment (a DID or a handle).
 * @property {'did' | 'handle'} authorityType - The kind of authority.
 * @property {string} collection - The collection NSID (e.g., `app.bsky.feed.post`).
 * @property {string[]} collectionParts - The NSID split by dots.
 * @property {string} rkey - The record key.
 */

/**
 * Represents a parsed BlueSky web URL, with its actor and AT URI fully resolved.
 * @typedef {Object} BlueSkyWebUrlData
 * @property {'web_url'} dataType - The discriminator for a web URL element.
 * @property {string} url - The original URL.
 * @property {BlueSkyWebUrlKind} kind - The resource kind, or an empty string for a profile.
 * @property {string} rkey - The record key, or an empty string for a profile.
 * @property {'did' | 'handle'} actorType - The kind of actor.
 * @property {BlueSkyHandleData | BlueSkyDidData} actor - The fully parsed actor.
 * @property {BlueSkyAtUriData | null} atUri - The equivalent AT URI, or `null` for a profile.
 */

/**
 * Represents a parsed BlueSky hashtag.
 * @typedef {Object} BlueSkyHashtagData
 * @property {'hashtag'} dataType - The discriminator for a hashtag element.
 * @property {string} tag - The tag, without the leading `#`.
 */

/**
 * Maps a BlueSky web URL kind to its canonical collection NSID.
 * @type {Readonly<Record<'post' | 'feed' | 'lists', string>>}
 */
const WEB_KIND_TO_COLLECTION = Object.freeze({
  post: 'app.bsky.feed.post',
  feed: 'app.bsky.feed.generator',
  lists: 'app.bsky.graph.list',
});

/**
 * The maximum length of a BlueSky handle, in characters.
 * @type {number}
 */
const HANDLE_MAX_LENGTH = 253;

/**
 * The maximum length of a single DNS label, in characters.
 * @type {number}
 */
const HANDLE_LABEL_MAX_LENGTH = 63;

/**
 * The suffix used by BlueSky-hosted accounts.
 * @type {string}
 */
const BSKY_HOSTED_SUFFIX = 'bsky.social';

/**
 * A single DNS label: alphanumeric, with internal hyphens, 1-63 characters.
 * @type {RegExp}
 */
const handleLabelRegex = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i;

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
 * Decomposes a validated, lowercase handle into its DNS components.
 * @param {string} handle - The normalized, lowercase handle.
 * @returns {BlueSkyHandleData} The decomposed handle data.
 */
const decomposeHandle = (handle) => {
  const labels = handle.split('.');
  const isBskyHosted = handle === BSKY_HOSTED_SUFFIX || handle.endsWith(`.${BSKY_HOSTED_SUFFIX}`);
  const subLabels = labels.slice(0, -2);
  return {
    dataType: 'handle',
    handle,
    labels,
    labelCount: labels.length,
    tld: labels[labels.length - 1],
    domain: labels.slice(-2).join('.'),
    subdomain: subLabels.length > 0 ? subLabels.join('.') : null,
    isBskyHosted,
    isCustomDomain: !isBskyHosted,
  };
};

/**
 * Validates a parsed BlueSky handle object.
 * @param {BlueSkyHandleData} data - The handle data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 * @throws {RangeError} If any length constraint is violated.
 * @throws {SyntaxError} If any DNS label is malformed.
 */
const validateHandleData = (data) => {
  if (typeof data.handle !== 'string' || data.handle.length === 0) {
    throw new TypeError('BlueSkyHandleData: handle must be a non-empty string.');
  }
  if (data.handle.length > HANDLE_MAX_LENGTH) {
    throw new RangeError(
      `BlueSkyHandleData: handle must not exceed ${HANDLE_MAX_LENGTH} characters.`,
    );
  }
  if (!Array.isArray(data.labels) || data.labels.length < 2) {
    throw new TypeError('BlueSkyHandleData: labels must contain at least two entries.');
  }
  for (const label of data.labels) {
    if (typeof label !== 'string' || label.length === 0 || label.length > HANDLE_LABEL_MAX_LENGTH) {
      throw new RangeError('BlueSkyHandleData: each label must be between 1 and 63 characters.');
    }
    if (!handleLabelRegex.test(label)) {
      throw new SyntaxError(`BlueSkyHandleData: invalid DNS label "${label}".`);
    }
  }
  if (data.labelCount !== data.labels.length) {
    throw new TypeError('BlueSkyHandleData: labelCount must match the number of labels.');
  }
  if (data.tld !== data.labels[data.labels.length - 1]) {
    throw new TypeError('BlueSkyHandleData: tld must match the last label.');
  }
  if (typeof data.domain !== 'string' || !data.domain.includes('.')) {
    throw new TypeError('BlueSkyHandleData: domain must be a dotted string.');
  }
  if (data.subdomain !== null && typeof data.subdomain !== 'string') {
    throw new TypeError('BlueSkyHandleData: subdomain must be a string or null.');
  }
  if (typeof data.isBskyHosted !== 'boolean' || typeof data.isCustomDomain !== 'boolean') {
    throw new TypeError('BlueSkyHandleData: hosting flags must be booleans.');
  }
  if (data.isBskyHosted === data.isCustomDomain) {
    throw new TypeError('BlueSkyHandleData: hosting flags must be complementary.');
  }
};

/**
 * Decodes the method-specific identifier of a `did:web` DID.
 * @param {string} identifier - The raw identifier (e.g., `example.com%3A3000:user:alice`).
 * @returns {{ domain: string, port: number | null, pathSegments: string[] }} The decoded parts.
 */
const decodeDidWeb = (identifier) => {
  const [hostPart, ...pathSegments] = identifier.split(':');
  const decodedHost = decodeURIComponent(hostPart);
  const separatorIndex = decodedHost.indexOf(':');
  if (separatorIndex === -1) {
    return { domain: decodedHost, port: null, pathSegments };
  }
  return {
    domain: decodedHost.slice(0, separatorIndex),
    port: Number(decodedHost.slice(separatorIndex + 1)),
    pathSegments,
  };
};

/**
 * Validates a parsed BlueSky DID object.
 * @param {BlueSkyDidData} data - The DID data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 * @throws {RangeError} If the port is out of range.
 */
const validateDidData = (data) => {
  if (data.method !== 'plc' && data.method !== 'web') {
    throw new TypeError(`BlueSkyDidData: invalid method "${data.method}".`);
  }
  if (typeof data.identifier !== 'string' || data.identifier.length === 0) {
    throw new TypeError('BlueSkyDidData: identifier must be a non-empty string.');
  }
  if (data.did !== `did:${data.method}:${data.identifier}`) {
    throw new TypeError('BlueSkyDidData: did must match the method and identifier.');
  }
  if (!Array.isArray(data.pathSegments)) {
    throw new TypeError('BlueSkyDidData: pathSegments must be an array.');
  }
  if (data.method === 'web') {
    if (typeof data.domain !== 'string' || data.domain.length === 0) {
      throw new TypeError('BlueSkyDidData: domain is required for did:web.');
    }
    if (
      data.port !== null &&
      (!Number.isInteger(data.port) || data.port < 1 || data.port > 65535)
    ) {
      throw new RangeError('BlueSkyDidData: port must be a valid TCP port or null.');
    }
    return;
  }
  if (data.domain !== null || data.port !== null) {
    throw new TypeError('BlueSkyDidData: only did:web supports domain and port.');
  }
};

/**
 * Validates a parsed AT URI object.
 * @param {BlueSkyAtUriData} data - The AT URI data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateAtUriData = (data) => {
  if (typeof data.uri !== 'string' || !data.uri.startsWith('at://')) {
    throw new TypeError('BlueSkyAtUriData: uri must start with "at://".');
  }
  if (typeof data.authority !== 'string' || data.authority.length === 0) {
    throw new TypeError('BlueSkyAtUriData: authority must be a non-empty string.');
  }
  if (data.authorityType !== 'did' && data.authorityType !== 'handle') {
    throw new TypeError(`BlueSkyAtUriData: invalid authorityType "${data.authorityType}".`);
  }
  if (typeof data.collection !== 'string' || !data.collection.includes('.')) {
    throw new TypeError('BlueSkyAtUriData: collection must be a dotted NSID.');
  }
  if (!Array.isArray(data.collectionParts) || data.collectionParts.join('.') !== data.collection) {
    throw new TypeError('BlueSkyAtUriData: collectionParts must match the collection.');
  }
  if (typeof data.rkey !== 'string' || data.rkey.length === 0) {
    throw new TypeError('BlueSkyAtUriData: rkey must be a non-empty string.');
  }
};

/**
 * Validates a parsed BlueSky web URL object.
 * @param {BlueSkyWebUrlData} data - The web URL data to validate.
 * @returns {void}
 * @throws {TypeError} If any property is missing, of an invalid type, or inconsistent.
 */
const validateWebUrlData = (data) => {
  if (typeof data.url !== 'string' || data.url.length === 0) {
    throw new TypeError('BlueSkyWebUrlData: url must be a non-empty string.');
  }
  if (!['', 'post', 'feed', 'lists'].includes(data.kind)) {
    throw new TypeError(`BlueSkyWebUrlData: invalid kind "${data.kind}".`);
  }
  if (data.actorType !== 'did' && data.actorType !== 'handle') {
    throw new TypeError(`BlueSkyWebUrlData: invalid actorType "${data.actorType}".`);
  }
  if (data.actor === null || typeof data.actor !== 'object') {
    throw new TypeError('BlueSkyWebUrlData: actor must be a parsed object.');
  }
  if (data.actor.dataType !== data.actorType) {
    throw new TypeError('BlueSkyWebUrlData: actorType must match the parsed actor.');
  }
  if (typeof data.rkey !== 'string') {
    throw new TypeError('BlueSkyWebUrlData: rkey must be a string.');
  }
  if (data.atUri !== null && data.atUri.dataType !== 'at_uri') {
    throw new TypeError('BlueSkyWebUrlData: atUri must be a parsed AT URI or null.');
  }
  if (data.kind !== '' && data.atUri === null) {
    throw new TypeError('BlueSkyWebUrlData: atUri is required when kind is set.');
  }
  if (data.kind === '' && data.atUri !== null) {
    throw new TypeError('BlueSkyWebUrlData: atUri must be null for a profile URL.');
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
 * Parses a BlueSky handle element into its DNS components.
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
  const data = decomposeHandle(match.groups.handle.toLowerCase());
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
  const method = /** @type {'plc' | 'web'} */ (match.groups.method);
  const decoded =
    method === 'web'
      ? decodeDidWeb(match.groups.identifier)
      : { domain: null, port: null, pathSegments: [] };
  /** @type {BlueSkyDidData} */
  const data = {
    dataType: 'did',
    did: uri,
    method,
    identifier: match.groups.identifier,
    ...decoded,
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
  const { authority, collection, rkey } = match.groups;
  /** @type {BlueSkyAtUriData} */
  const data = {
    dataType: 'at_uri',
    uri,
    authority,
    authorityType: authority.startsWith('did:') ? 'did' : 'handle',
    collection,
    collectionParts: collection.split('.'),
    rkey,
  };
  validateAtUriData(data);
  return data;
};

/**
 * Extracts the canonical string form from a parsed BlueSky actor.
 * Narrows the union via the `dataType` discriminant.
 * @param {BlueSkyHandleData | BlueSkyDidData} actor - The parsed actor.
 * @returns {string} The canonical actor string (a handle or a DID).
 */
const getActorString = (actor) => (actor.dataType === 'did' ? actor.did : actor.handle);

/**
 * Parses a BlueSky web URL element by delegating to the handle, DID and AT URI parsers.
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

  const { actor: rawActor } = match.groups;
  const kind = /** @type {BlueSkyWebUrlKind} */ (match.groups.kind ?? '');
  const rkey = match.groups.rkey ?? '';

  // Delegate to the existing parsers instead of duplicating their logic.
  const actor = rawActor.startsWith('did:') ? parseDid(rawActor) : parseHandle(rawActor);
  const actorType = actor.dataType;
  const actorString = getActorString(actor);
  const collection = kind === '' ? null : WEB_KIND_TO_COLLECTION[kind];
  const atUri =
    collection && rkey ? parseAtUri(`at://${actorString}/${collection}/${rkey}`) : null;

  /** @type {BlueSkyWebUrlData} */
  const data = {
    dataType: 'web_url',
    url: uri,
    kind,
    rkey,
    actorType,
    actor,
    atUri,
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
  return data.did;
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
  const actorString = getActorString(data.actor);
  if (!data.kind) return `https://bsky.app/profile/${actorString}`;
  return `https://bsky.app/profile/${actorString}/${data.kind}/${data.rkey}`;
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
