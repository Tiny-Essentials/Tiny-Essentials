import TinyUriParser from '../TinyUriParser.mjs';

/**
 * Defines the valid types for Matrix resource identifiers.
 * @typedef {'roomId' | 'room' | 'user' | 'event'} IdTypes
 */

/**
 * Represents the data structure for parsed Matrix Content (MXC) URIs.
 * @typedef {Object} MXCData
 * @property {'mxc'} dataType - The category of the data.
 * @property {string} server - The Matrix server domain (e.g., 'matrix.org').
 * @property {string} dataId - The unique identifier for the data.
 */

/**
 * Represents the data structure for parsed Matrix scheme URIs.
 * @typedef {Object} MatrixSchemeData
 * @property {'matrix_scheme'} dataType - The category of the data.
 * @property {IdTypes} type - The type of the matrix resource.
 * @property {null|IdTypes} subType - The sub type of the matrix resource.
 * @property {string} resourceId - The primary identifier (room ID or user ID).
 * @property {string} [eventId] - The specific event ID (only if type is 'event').
 * @property {string|null} server - The matrix server domain.
 * @property {Record<string, string>} params - Key-value pairs of query parameters (e.g., { via: 'server.com' }).
 */

/**
 * Represents the data structure for parsed Matrix Web URLs.
 * @typedef {Object} MatrixWebData
 * @property {'matrix_web_url'} dataType - The category of the data.
 * @property {string} originalUrl - The full original input URL.
 * @property {string} decodedFragment - The decoded string from the URL fragment.
 * @property {MatrixSchemeData | MXCData} parsed - The result of the parsed resource.
 */

/**
 * Reconstructs an MXC URI from parsed data.
 * @param {MXCData} parsed
 * @returns {string}
 */
const reconstructMxc = (parsed) => {
  const { server, dataId } = parsed;
  return `mxc://${server}/${dataId}`;
};

/**
 * Reconstructs a Matrix Scheme URI from parsed data.
 * @param {MatrixSchemeData} parsed
 * @returns {string}
 */
const reconstructMatrixScheme = (parsed) => {
  const { type, subType, resourceId, eventId, server, params } = parsed;

  const typeToPrefix = { room: 'r', user: 'u', roomId: 'roomid', event: 'e' };
  const subTypeToPrefix = { room: 'r', user: 'u', roomId: 'roomid' };

  // Determine the prefix based on the type or the subType if it's an event
  // @ts-ignore
  let prefix = typeToPrefix[type];
  if (type === 'event' && subType) {
    // @ts-ignore
    prefix = subTypeToPrefix[subType];
  }

  let resource = resourceId;
  if (server) {
    resource += `:${server}`;
  }

  let result = `matrix:${prefix}/${resource}`;

  if (type === 'event' && eventId) {
    let eventPart = eventId;
    if (server) {
      eventPart += `:${server}`;
    }
    result += `/e/${eventPart}`;
  }

  if (params && Object.keys(params).length > 0) {
    const query = new URLSearchParams(params).toString();
    result += `?${query}`;
  }

  return result;
};

/**
 * Reconstructs a Matrix Web URL from parsed data.
 * @param {MatrixWebData} parsed
 * @returns {string}
 */
const reconstructMatrixWebUrl = (parsed) => {
  // We return the original URL stored in the data for maximum fidelity
  return parsed.originalUrl;
};

/**
 * Parses MXC (Matrix Content) URIs.
 *
 * @param {string} uri - The raw MXC URI string.
 * @returns {MXCData} The parsed MXC data object.
 * @throws {Error} If the URI does not match the expected MXC format.
 */
const parseMxc = (uri) => {
  const regex = /^mxc:\/\/([^/]+)\/(.+)$/;
  const match = uri.match(regex);

  if (!match) {
    throw new Error(`Invalid MXC URI format: ${uri}`);
  }

  const [_, server, dataId] = match;

  /** @type {MXCData} */
  const data = { server, dataId, dataType: 'mxc' };
  validateMXCData(data);
  return data;
};

/**
 * Parses Matrix Scheme URIs (e.g., matrix:r/..., matrix:u/..., matrix:e/..., etc).
 *
 * @param {string} uri - The Matrix scheme URI string.
 * @returns {MatrixSchemeData} The parsed Matrix scheme data object.
 * @throws {Error} If the URI does not match the expected Matrix scheme format.
 */
const parseMatrixScheme = (uri) => {
  // Regex handles: matrix:<type>/<resource>[/e/<event>][<query>]
  // Types supported: r (room), u (user), roomid (room), e (event)
  const regex =
    /^matrix:(?<prefix>r|u|roomid|e)\/(?<resource>[^?/\s]+)(?:\/e\/(?<event>[^?/\s]+))?(?<query>\?.*)?$/;
  const match = uri.match(regex);

  if (!match) {
    throw new Error(`Invalid Matrix Scheme URI: ${uri}`);
  }

  const { prefix, resource, event, query } = match.groups ?? {};
  const prefixType = prefix === 'r' ? '#' : prefix === 'e' ? '$' : prefix === 'roomid' ? '!' : '@';

  /** @param {string} p */
  const genType = (p) =>
    p === 'r' ? 'room' : p === 'e' ? 'event' : p === 'roomid' ? 'roomId' : 'user';

  // Capture the original type (room, user, etc.) before checking if it is an event
  const baseType = genType(prefix);

  /** @type {MatrixSchemeData} */
  const data = {
    dataType: 'matrix_scheme',
    subType: null,
    type: baseType,
    resourceId: resource,
    server: null,
    params: {},
  };

  // Transforms the query string into a key/value object
  if (query) {
    const searchParams = new URLSearchParams(query);
    data.params = Object.fromEntries(searchParams.entries());
  }

  // Always remove the identifier symbol if it is present, regardless of the server
  let actualResource = resource;
  if (actualResource.startsWith(prefixType)) {
    actualResource = actualResource.substring(1);
  }

  // Handles the extraction of resourceId, server and all types
  const lastColonIndex = actualResource.lastIndexOf(':');
  if (lastColonIndex !== -1) {
    data.server = actualResource.substring(lastColonIndex + 1);
    data.resourceId = actualResource.substring(0, lastColonIndex);
  } else {
    data.resourceId = actualResource;
  }

  if (prefix === 'e') {
    // Since the resourceId has already been cleaned in the block above, simply reference it
    data.eventId = data.resourceId;
    data.type = 'event';
    data.subType = null;
  }

  // If the URI contains a nested event (matrix:r/room/e/event)
  if (event) {
    let actualEvent = event;
    if (actualEvent.startsWith('$')) {
      actualEvent = actualEvent.substring(1);
    }

    // Ensures that the nested eventId is also cleaned, in case it has an associated server
    const eventColonIndex = actualEvent.lastIndexOf(':');
    if (eventColonIndex !== -1) {
      data.eventId = actualEvent.substring(0, eventColonIndex);
    } else {
      data.eventId = actualEvent;
    }

    data.type = 'event';
    data.subType = baseType;
  }

  validateMatrixSchemeData(data);
  return data;
};

/**
 * Parses Matrix Web URLs by decoding the URL fragment.
 *
 * @param {string} url - The full web URL (e.g., https://matrix.to/#/...).
 * @returns {MatrixWebData} The parsed web URL data object.
 * @throws {Error} If the URL is invalid or the fragment cannot be parsed.
 */
const parseWebUrl = (url) => {
  const urlObj = new URL(url);
  const fragment = urlObj.hash.substring(2); // Remove '#/'
  const decodedFragment = decodeURIComponent(fragment);

  // Split into parts to support events contained within the matrix.to URL
  // Ex: !room:server.com/$event_id -> mainPart: "!room:server.com", eventPart: "$event_id"
  const parts = decodedFragment.split('/');
  const mainPart = parts[0];
  const eventPart = parts.length > 1 ? parts[1] : null;

  let parsedResource;

  if (mainPart.startsWith('#') || mainPart.startsWith('!')) {
    const isId = mainPart.startsWith('!');
    const type = !isId ? 'r' : 'roomid';

    // Always construct by removing the initial symbol (!) or (#)
    let normalizedResource = `matrix:${type}/${mainPart.substring(1)}`;

    if (eventPart) {
      // Remove the '$' if it exists to properly construct the scheme route
      const safeEventPart = eventPart.startsWith('$') ? eventPart.substring(1) : eventPart;
      normalizedResource += `/e/${safeEventPart}`;
    }

    parsedResource = parseMatrixScheme(normalizedResource);
  } else if (mainPart.startsWith('@')) {
    // It's a user
    const normalizedResource = `matrix:u/${mainPart.substring(1)}`;
    parsedResource = parseMatrixScheme(normalizedResource);
  } else {
    // Fallback: treat decoded fragment as a direct matrix scheme
    parsedResource = parseMatrixScheme(`matrix:${decodedFragment}`);
  }

  return {
    dataType: 'matrix_web_url',
    originalUrl: url,
    decodedFragment,
    parsed: parsedResource,
  };
};

/**
 * Validates the MXC data object for required properties and correct types.
 *
 * @param {MXCData} data - The MXC data object to validate.
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateMXCData = (data) => {
  if (typeof data.server !== 'string' || data.server.length === 0) {
    throw new TypeError('MXCData: server must be a non-empty string.');
  }
  if (typeof data.dataId !== 'string' || data.dataId.length === 0) {
    throw new TypeError('MXCData: dataId must be a non-empty string.');
  }
};

/**
 * Validates the Matrix Scheme data object for required properties and correct types.
 *
 * @param {MatrixSchemeData} data - The Matrix scheme data object to validate.
 * @throws {TypeError} If any property is missing or of an invalid type.
 */
const validateMatrixSchemeData = (data) => {
  const validTypes = ['roomId', 'room', 'user', 'event'];
  if (!validTypes.includes(data.type)) {
    throw new TypeError(`MatrixSchemeData: Invalid type "${data.type}".`);
  }
  if (typeof data.resourceId !== 'string' || data.resourceId.length === 0) {
    throw new TypeError('MatrixSchemeData: resourceId must be a non-empty string.');
  }
  if (data.server !== null && (typeof data.server !== 'string' || data.server.length === 0)) {
    throw new TypeError('MatrixSchemeData: server must be a non-empty string.');
  }
  if (data.type === 'event' && (typeof data.eventId !== 'string' || data.eventId.length === 0)) {
    throw new TypeError(
      'MatrixSchemeData: eventId must be a non-empty string when type is "event".',
    );
  }
  if (data.params && typeof data.params !== 'object') {
    throw new TypeError('MatrixSchemeData: params must be an object.');
  }
};

export const MatrixMcxParser = TinyUriParser.buildParserPair(
  'mxc',
  (uriString) => uriString.startsWith('mxc://'),
  parseMxc,
  reconstructMxc,
);

export const MatrixSchemeParser = TinyUriParser.buildParserPair(
  'matrix_scheme',
  (uriString) => uriString.startsWith('matrix:'),
  parseMatrixScheme,
  reconstructMatrixScheme,
);

/**
 * Handle Matrix ID shorthands (#room, !event, $event, @user)
 */
export const MatrixSchemeParser2 = TinyUriParser.buildParserPair(
  'matrix_scheme',
  (uriString) =>
    uriString.startsWith('#') ||
    uriString.startsWith('!') ||
    uriString.startsWith('$') ||
    uriString.startsWith('@'),
  (uriString) => {
    const prefixMap = { '#': 'r/', '!': 'roomid/', $: 'e/', '@': 'u/' };
    // @ts-ignore
    const prefix = prefixMap[uriString[0]];
    if (!prefix)
      throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
    return parseMatrixScheme(`matrix:${prefix}${uriString.substring(1)}`);
  },
  reconstructMatrixScheme,
);

/**
 * Check for Web URLs (e.g., https://matrix.to/#/...)
 */
export const MatrixWebUrlParser = TinyUriParser.buildParserPair(
  'matrix_web_url',
  (uriString) => uriString.includes('://') && uriString.includes('#/'),
  parseWebUrl,
  reconstructMatrixWebUrl,
);

/**
 * An array of Matrix Protocol parser pairs, where each pair contains a matching predicate and a parsing callback.
 */
export const MatrixProtocolParsers = Object.freeze([
  MatrixMcxParser,
  MatrixSchemeParser,
  MatrixSchemeParser2,
  MatrixWebUrlParser,
]);
