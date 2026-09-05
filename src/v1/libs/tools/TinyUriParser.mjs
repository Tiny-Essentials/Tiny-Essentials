/**
 * @template {string} Type
 * @template {Record<any, any>} Data
 * @typedef {Object} ParsedTemplate
 * @property {Type} type - The category of the URI.
 * @property {Data} data - The parsed content.
 */

/**
 * @typedef {Object} MXCData
 * @property {'mxc'} dataType - The category of the data.
 * @property {string} server - The Matrix server domain (e.g., 'matrix.org').
 * @property {string} dataId - The unique identifier for the data.
 */

/**
 * @typedef {'roomId' | 'room' | 'user' | 'event'} IdTypes
 */

/**
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
 * @typedef {Object} MatrixWebData
 * @property {'matrix_web_url'} dataType - The category of the data.
 * @property {string} originalUrl - The full original input URL.
 * @property {string} decodedFragment - The decoded string from the URL fragment.
 * @property {MatrixSchemeData | MXCData} parsed - The result of the parsed resource.
 */

/**
 * @typedef {ParsedTemplate<'mxc', MXCData>} ParsedMXC
 */

/**
 * @typedef {ParsedTemplate<'matrix_scheme', MatrixSchemeData>} ParsedSchemeData
 */

/**
 * @typedef {ParsedTemplate<'matrix_web_url', MatrixWebData>} ParsedWebData
 */

/**
 * @typedef {ParsedTemplate<'custom', Record<string, any>>} ParsedCustom
 */

class TinyUriParser {
  /** @type {Map<string, (uri: string) => any>} */
  #customParsers;

  /**
   * Initializes the parser.
   * @param {Map<string, (uri: string) => any>} [customParsers] - Map of custom protocols to their parsing functions.
   */
  constructor(customParsers = new Map()) {
    this.#customParsers = customParsers;
  }

  /**
   * Main entry point for parsing.
   * @param {string} uriString - The raw URI string to parse.
   * @returns {ParsedMXC|ParsedSchemeData|ParsedWebData|ParsedCustom} The parsed object.
   * @throws {TypeError | RangeError | Error} If the input is invalid or parsing fails.
   */
  parse(uriString) {
    if (typeof uriString !== 'string') {
      throw new TypeError('The input must be a string.');
    }

    if (uriString.startsWith('mxc://')) {
      return {
        type: 'mxc',
        data: this.#parseMxc(uriString),
      };
    }

    if (uriString.startsWith('matrix:')) {
      return {
        type: 'matrix_scheme',
        data: this.#parseMatrixScheme(uriString),
      };
    }

    // Handle Matrix ID shorthands (#room, !event, $event, @user)
    if (
      uriString.startsWith('#') ||
      uriString.startsWith('!') ||
      uriString.startsWith('$') ||
      uriString.startsWith('@')
    ) {
      const prefixMap = { '#': 'r/', '!': 'roomid/', $: 'e/', '@': 'u/' };
      // @ts-ignore
      const prefix = prefixMap[uriString[0]];
      if (!prefix)
        throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
      return {
        type: 'matrix_scheme',
        data: this.#parseMatrixScheme(`matrix:${prefix}${uriString.substring(1)}`),
      };
    }

    // Check for Web URLs (e.g., https://matrix.to/#/...)
    if (uriString.includes('://') && uriString.includes('#/')) {
      return {
        type: 'matrix_web_url',
        data: this.#parseWebUrl(uriString),
      };
    }

    // Check custom protocols
    for (const [protocol, parser] of this.#customParsers) {
      if (uriString.startsWith(`${protocol}:`)) {
        return {
          type: 'custom',
          data: parser(uriString),
        };
      }
    }

    throw new Error(`Unable to determine the protocol for the provided URI: ${uriString}`);
  }

  /**
   * Parses MXC (Matrix Content) URIs.
   *
   * @param {string} uri - The raw MXC URI string.
   * @returns {MXCData} The parsed MXC data object.
   * @throws {Error} If the URI does not match the expected MXC format.
   */
  #parseMxc(uri) {
    const regex = /^mxc:\/\/([^/]+)\/(.+)$/;
    const match = uri.match(regex);

    if (!match) {
      throw new Error(`Invalid MXC URI format: ${uri}`);
    }

    const [_, server, dataId] = match;

    /** @type {MXCData} */
    const data = { server, dataId, dataType: 'mxc' };
    this.#validateMXCData(data);
    return data;
  }

  /**
   * Parses Matrix Scheme URIs (e.g., matrix:r/..., matrix:u/..., matrix:e/..., etc).
   *
   * @param {string} uri - The Matrix scheme URI string.
   * @returns {MatrixSchemeData} The parsed Matrix scheme data object.
   * @throws {Error} If the URI does not match the expected Matrix scheme format.
   */
  #parseMatrixScheme(uri) {
    // Regex handles: matrix:<type>/<resource>[/e/<event>][<query>]
    // Types supported: r (room), u (user), roomid (room), e (event)
    const regex =
      /^matrix:(?<prefix>r|u|roomid|e)\/(?<resource>[^?/\s]+)(?:\/e\/(?<event>[^?/\s]+))?(?<query>\?.*)?$/;
    const match = uri.match(regex);

    if (!match) {
      throw new Error(`Invalid Matrix Scheme URI: ${uri}`);
    }

    const { prefix, resource, event, query } = match.groups ?? {};
    const prefixType =
      prefix === 'r' ? '#' : prefix === 'e' ? '$' : prefix === 'roomid' ? '!' : '@';

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

    // Handles the extraction of resourceId and server
    if (prefix === 'e') {
      // If it is purely an event without a room
      data.resourceId = actualResource;
      data.eventId = actualResource;
      data.type = 'event';
      data.subType = null;
    } else {
      const lastColonIndex = actualResource.lastIndexOf(':');
      if (lastColonIndex !== -1) {
        data.server = actualResource.substring(lastColonIndex + 1);
        data.resourceId = actualResource.substring(0, lastColonIndex);
      } else {
        data.resourceId = actualResource;
      }
    }

    // If the URI contains a nested event (matrix:r/room/e/event)
    if (event) {
      let actualEvent = event;
      if (actualEvent.startsWith('$')) {
        actualEvent = actualEvent.substring(1);
      }

      // This is where the logic occurs: we specify that it is an event and identify its base type
      data.type = 'event';
      data.subType = baseType;
      data.eventId = actualEvent;
    }

    this.#validateMatrixSchemeData(data);
    return data;
  }

  /**
   * Parses Matrix Web URLs by decoding the URL fragment.
   *
   * @param {string} url - The full web URL (e.g., https://matrix.to/#/...).
   * @returns {MatrixWebData} The parsed web URL data object.
   * @throws {Error} If the URL is invalid or the fragment cannot be parsed.
   */
  #parseWebUrl(url) {
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

      parsedResource = this.#parseMatrixScheme(normalizedResource);
    } else if (mainPart.startsWith('@')) {
      // It's a user
      const normalizedResource = `matrix:u/${mainPart.substring(1)}`;
      parsedResource = this.#parseMatrixScheme(normalizedResource);
    } else {
      // Fallback: treat decoded fragment as a direct matrix scheme
      parsedResource = this.#parseMatrixScheme(`matrix:${decodedFragment}`);
    }

    return {
      dataType: 'matrix_web_url',
      originalUrl: url,
      decodedFragment,
      parsed: parsedResource,
    };
  }

  /**
   * Validates the MXC data object for required properties and correct types.
   *
   * @param {MXCData} data - The MXC data object to validate.
   * @throws {TypeError} If any property is missing or of an invalid type.
   */
  #validateMXCData(data) {
    if (typeof data.server !== 'string' || data.server.length === 0) {
      throw new TypeError('MXCData: server must be a non-empty string.');
    }
    if (typeof data.dataId !== 'string' || data.dataId.length === 0) {
      throw new TypeError('MXCData: dataId must be a non-empty string.');
    }
  }

  /**
   * Validates the Matrix Scheme data object for required properties and correct types.
   *
   * @param {MatrixSchemeData} data - The Matrix scheme data object to validate.
   * @throws {TypeError} If any property is missing or of an invalid type.
   */
  #validateMatrixSchemeData(data) {
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
  }
}

export default TinyUriParser;
