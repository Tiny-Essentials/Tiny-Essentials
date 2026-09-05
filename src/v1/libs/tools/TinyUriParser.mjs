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
 * @typedef {Object} MatrixSchemeData
 * @property {'matrix_scheme'} dataType - The category of the data.
 * @property {'roomId' | 'room' | 'user' | 'event'} type - The type of the matrix resource.
 * @property {null | 'roomId' | 'room' | 'user'} subType - The sub type of the matrix resource.
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
        data: this.#parseMatrixScheme(
          uriString,
          uriString.startsWith('matrix:r/')
            ? 'r'
            : uriString.startsWith('matrix:roomid/')
              ? 'roomid'
              : uriString.startsWith('matrix:u/')
                ? 'u'
                : null,
        ),
      };
    }

    // Handle Matrix ID shorthands (#room, !event, $event, @user)
    // We convert them to matrix scheme URIs to reuse the existing logic.
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
        data: this.#parseMatrixScheme(
          `matrix:${prefix}${uriString.substring(1)}`,
          uriString.startsWith('#')
            ? 'r'
            : uriString.startsWith('!')
              ? 'roomid'
              : uriString.startsWith('@')
                ? 'u'
                : null,
        ),
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
   * Parses MXC URIs.
   * @param {string} uri
   * @returns {MXCData}
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
   * Parses Matrix Scheme URIs (matrix:r/..., matrix:u/..., matrix:e/..., etc).
   * @param {string} uri
   * @param {'u'|'r'|'roomid'|null} uriType
   * @returns {MatrixSchemeData}
   */
  #parseMatrixScheme(uri, uriType) {
    // Regex handles: matrix:<type>/<resource>[/e/<event>][<query>]
    // Types supported: r (room), u (user), roomid (room), e (event)
    const regex =
      /^matrix:(?<prefix>r|u|roomid|e)\/(?<resource>[^?/\s]+)(?:\/e\/(?<event>[^?/\s]+))?(?<query>\?.*)?$/;
    const match = uri.match(regex);

    if (!match) {
      throw new Error(`Invalid Matrix Scheme URI: ${uri}`);
    }

    // @ts-ignore
    const { prefix, resource, event, query } = match.groups;
    const prefixType =
      prefix === 'r' ? '#' : prefix === 'e' ? '$' : prefix === 'roomid' ? '!' : '@';
    /** @param {string} p */
    const genType = (p) =>
      p === 'r' ? 'room' : p === 'e' ? 'event' : p === 'roomid' ? 'roomId' : 'user';

    /** @type {MatrixSchemeData} */
    const data = {
      dataType: 'matrix_scheme',
      subType: null,
      type: genType(prefix),
      resourceId: resource,
      server: null,
      params: {},
    };

    if (uriType !== null) {
      const subType = genType(uriType);
      data.subType = subType !== 'event' && data.type !== subType ? subType : null;
    }

    // Transforms the query string into a key/value object
    if (query) {
      const searchParams = new URLSearchParams(query);
      data.params = Object.fromEntries(searchParams.entries());
    }

    // Extract server from resource (e.g., "somewhere:example.org")
    const lastColonIndex = resource.lastIndexOf(':');
    if (lastColonIndex !== -1) {
      data.server = resource.substring(lastColonIndex + 1);
      data.resourceId = resource.substring(
        !(event || prefix === 'e') && resource.startsWith(prefixType) ? 1 : 0,
        lastColonIndex,
      );
    }

    if (event) {
      // Case: matrix:r/resource/e/event
      data.type = 'event';
      data.eventId = event;
    } else if (prefix === 'e') {
      // Case: matrix:e/event_id (direct event ID)
      data.type = 'event';
      data.eventId = data.resourceId;
    }

    this.#validateMatrixSchemeData(data);
    return data;
  }

  /**
   * Parses Matrix Web URLs by decoding the fragment.
   * @param {string} url
   * @returns {MatrixWebData}
   */
  #parseWebUrl(url) {
    const urlObj = new URL(url);
    const fragment = urlObj.hash.substring(2); // Remove '#/'
    const decodedFragment = decodeURIComponent(fragment);

    let parsedResource;

    // Normalization logic: Convert web shorthand to Matrix Scheme
    if (decodedFragment.startsWith('#') || decodedFragment.startsWith('!')) {
      // It's a room
      const isId = decodedFragment.startsWith('!');
      const type = !isId ? 'r' : 'roomid';
      const normalizedResource = decodedFragment.startsWith('#')
        ? `matrix:${type}/${decodedFragment.substring(1)}`
        : `matrix:${type}/${decodedFragment}`;
      parsedResource = this.#parseMatrixScheme(normalizedResource, type);
    } else if (decodedFragment.startsWith('@')) {
      // It's a user
      const normalizedResource = `matrix:u/${decodedFragment.substring(1)}`;
      parsedResource = this.#parseMatrixScheme(normalizedResource, 'u');
    } else {
      // Fallback: treat decoded fragment as a direct matrix scheme
      parsedResource = this.#parseMatrixScheme(`matrix:${decodedFragment}`, null);
    }

    return {
      dataType: 'matrix_web_url',
      originalUrl: url,
      decodedFragment,
      parsed: parsedResource,
    };
  }

  /**
   * @param {MXCData} data
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
   * @param {MatrixSchemeData} data
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
