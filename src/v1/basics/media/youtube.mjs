/**
 * @typedef {'default' | 'mqdefault' | 'hqdefault' | 'sddefault' | 'maxresdefault'} YouTubeThumbnailQuality
 */

/**
 * @typedef {Object} YouTubeOEmbedResponse
 * @property {string} title - Video title.
 * @property {string} author_name - Channel display name.
 * @property {string} author_url - Channel URL.
 * @property {string} type - Resource type returned by the provider (e.g. "video").
 * @property {string} version - oEmbed version.
 * @property {string} provider_name - Always "YouTube".
 * @property {string} provider_url - Provider root URL.
 * @property {string} html - Ready to use iframe markup.
 * @property {number} width - Suggested iframe width in pixels.
 * @property {number} height - Suggested iframe height in pixels.
 * @property {string} thumbnail_url - Thumbnail URL provided by the provider.
 * @property {number} thumbnail_width - Thumbnail width in pixels.
 * @property {number} thumbnail_height - Thumbnail height in pixels.
 */

/**
 * @typedef {Object} FetchYouTubeOEmbedOptions
 * @property {AbortSignal} [signal] - Optional abort signal forwarded to fetch.
 * @property {typeof fetch} [fetchImpl] - Injectable fetch implementation (useful for tests).
 */

const YOUTUBE_VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_OEMBED_ENDPOINT = 'https://www.youtube.com/oembed';
const YOUTUBE_THUMBNAIL_ENDPOINT = 'https://i.ytimg.com/vi';
const YOUTUBE_ALLOWED_HOSTS = new Set([
  'youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'youtu.be',
]);
const YOUTUBE_ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);
const YOUTUBE_THUMBNAIL_QUALITIES = new Set([
  'default',
  'mqdefault',
  'hqdefault',
  'sddefault',
  'maxresdefault',
]);

const YOUTUBE_OEMBED_TYPE = 'video';

/**
 * @param {unknown} value - Value to inspect.
 * @param {string} label - Human readable path used in the error message.
 * @returns {Record<string, unknown>} The same value, narrowed to a plain object.
 * @throws {TypeError} If `value` is not a non-null, non-array object.
 */
function assertPlainObject(value, label) {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new TypeError(
      `${label} must be a plain object, received ${Array.isArray(value) ? 'array' : typeof value}.`,
    );
  }

  return /** @type {Record<string, unknown>} */ (value);
}

/**
 * @param {Record<string, unknown>} payload - Object being read.
 * @param {string} key - Property name.
 * @param {string} context - Caller name used in the error message.
 * @returns {string} The validated, trimmed string.
 * @throws {TypeError} If the property is not a string.
 * @throws {RangeError} If the property is an empty string.
 */
function readRequiredString(payload, key, context) {
  const value = payload[key];

  if (typeof value !== 'string') {
    throw new TypeError(`${context}: "${key}" must be a string, received ${typeof value}.`);
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new RangeError(`${context}: "${key}" cannot be empty.`);
  }

  return trimmed;
}

/**
 * @param {Record<string, unknown>} payload - Object being read.
 * @param {string} key - Property name.
 * @param {string} context - Caller name used in the error message.
 * @returns {number} The validated integer.
 * @throws {TypeError} If the property is not a number.
 * @throws {RangeError} If the property is not a positive integer.
 */
function readRequiredPositiveInteger(payload, key, context) {
  const value = payload[key];

  if (typeof value !== 'number') {
    throw new TypeError(`${context}: "${key}" must be a number, received ${typeof value}.`);
  }

  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${context}: "${key}" must be a positive integer, received ${value}.`);
  }

  return value;
}

/**
 * Deeply validates a YouTube oEmbed payload.
 * @param {unknown} payload - Raw value returned by `response.json()`.
 * @param {string} [context='assertYouTubeOEmbedResponse'] - Caller name used in error messages.
 * @returns {YouTubeOEmbedResponse} A brand new, fully validated object.
 * @throws {TypeError} If the payload or any of its properties has the wrong type.
 * @throws {RangeError} If a numeric property is not a positive integer.
 */
export function assertYouTubeOEmbedResponse(payload, context = 'assertYouTubeOEmbedResponse') {
  const source = assertPlainObject(payload, `${context}: payload`);
  const type = readRequiredString(source, 'type', context);

  if (type !== YOUTUBE_OEMBED_TYPE) {
    throw new RangeError(
      `${context}: "type" must be "${YOUTUBE_OEMBED_TYPE}", received "${type}".`,
    );
  }

  return {
    title: readRequiredString(source, 'title', context),
    author_name: readRequiredString(source, 'author_name', context),
    author_url: readRequiredString(source, 'author_url', context),
    type,
    version: readRequiredString(source, 'version', context),
    provider_name: readRequiredString(source, 'provider_name', context),
    provider_url: readRequiredString(source, 'provider_url', context),
    html: readRequiredString(source, 'html', context),
    width: readRequiredPositiveInteger(source, 'width', context),
    height: readRequiredPositiveInteger(source, 'height', context),
    thumbnail_url: readRequiredString(source, 'thumbnail_url', context),
    thumbnail_width: readRequiredPositiveInteger(source, 'thumbnail_width', context),
    thumbnail_height: readRequiredPositiveInteger(source, 'thumbnail_height', context),
  };
}

/**
 * Extracts a YouTube video id from a raw id or a full YouTube URL.
 * @param {string} input - Raw 11 character video id or a full YouTube URL.
 * @returns {string} The 11 character video id.
 * @throws {TypeError} If `input` is not a string.
 * @throws {RangeError} If `input` is empty or the host is not a YouTube host.
 * @throws {SyntaxError} If `input` is not a valid id nor a parseable URL containing an id.
 */
export function extractYouTubeVideoId(input) {
  if (typeof input !== 'string') {
    throw new TypeError('extractYouTubeVideoId: "input" must be a string.');
  }

  const trimmedInput = input.trim();

  if (trimmedInput.length === 0) {
    throw new RangeError('extractYouTubeVideoId: "input" cannot be empty.');
  }

  if (YOUTUBE_VIDEO_ID_PATTERN.test(trimmedInput)) {
    return trimmedInput;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(trimmedInput);
  } catch {
    throw new SyntaxError(
      `extractYouTubeVideoId: "${input}" is neither a video id nor a valid URL.`,
    );
  }

  if (!YOUTUBE_ALLOWED_PROTOCOLS.has(parsedUrl.protocol)) {
    throw new RangeError(`extractYouTubeVideoId: unsupported protocol "${parsedUrl.protocol}".`);
  }

  const host = parsedUrl.hostname.replace(/^www\./, '').toLowerCase();

  if (!YOUTUBE_ALLOWED_HOSTS.has(host)) {
    throw new RangeError(`extractYouTubeVideoId: unsupported host "${host}".`);
  }

  const pathMatch = parsedUrl.pathname.match(/^\/(?:embed|shorts|live|v)\/([A-Za-z0-9_-]{11})/);
  const videoId =
    host === 'youtu.be'
      ? parsedUrl.pathname.slice(1).split('/')[0]
      : (parsedUrl.searchParams.get('v') ?? pathMatch?.[1] ?? null);

  if (typeof videoId !== 'string' || !YOUTUBE_VIDEO_ID_PATTERN.test(videoId)) {
    throw new SyntaxError(`extractYouTubeVideoId: no valid video id found in "${input}".`);
  }

  return videoId;
}

/**
 * Fetches the oEmbed metadata of a YouTube video.
 * @param {string} videoIdOrUrl - Raw 11 character video id or a full YouTube URL.
 * @param {FetchYouTubeOEmbedOptions} [options] - Optional fetch configuration.
 * @returns {Promise<YouTubeOEmbedResponse>} The fully validated oEmbed payload.
 * @throws {TypeError} If `options` is not a plain object, if `options.signal` is not an `AbortSignal`,
 * if `options.fetchImpl` is not a function, or if the payload has a wrong type.
 * @throws {RangeError} If the payload contains an out of range numeric value.
 * @throws {Error} If the HTTP request fails or returns a non 2xx status.
 */
export async function fetchYouTubeOEmbed(videoIdOrUrl, options = {}) {
  const context = 'fetchYouTubeOEmbed';
  const settings = assertPlainObject(options, `${context}: "options"`);
  const { signal, fetchImpl = fetch } = settings;

  if (signal !== undefined && !(signal instanceof AbortSignal)) {
    throw new TypeError(`${context}: "options.signal" must be an AbortSignal.`);
  }

  if (typeof fetchImpl !== 'function') {
    throw new TypeError(`${context}: "options.fetchImpl" must be a function.`);
  }

  const videoId = extractYouTubeVideoId(videoIdOrUrl);
  const endpoint = new URL(YOUTUBE_OEMBED_ENDPOINT);

  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('url', `https://www.youtube.com/watch?v=${videoId}`);

  const response = await fetchImpl(endpoint, { method: 'GET', signal });

  if (typeof response !== 'object' || response === null || typeof response.json !== 'function') {
    throw new TypeError(`${context}: "options.fetchImpl" did not resolve to a Response.`);
  }

  if (!response.ok) {
    throw new Error(
      `${context}: request failed with status ${response.status} for video "${videoId}".`,
    );
  }

  return assertYouTubeOEmbedResponse(await response.json(), context);
}

/**
 * Builds the thumbnail URL of a YouTube video without any network request.
 * @param {string} videoIdOrUrl - Raw 11 character video id or a full YouTube URL.
 * @param {YouTubeThumbnailQuality} [quality='hqdefault'] - Thumbnail resolution.
 * @returns {string} The thumbnail URL.
 * @throws {TypeError} If `quality` is not a string.
 * @throws {RangeError} If `quality` is not a supported thumbnail quality.
 */
export function getYouTubeThumbnailUrl(videoIdOrUrl, quality = 'hqdefault') {
  if (typeof quality !== 'string') {
    throw new TypeError(
      `getYouTubeThumbnailUrl: "quality" must be a string, received ${typeof quality}.`,
    );
  }

  if (!YOUTUBE_THUMBNAIL_QUALITIES.has(quality)) {
    throw new RangeError(
      `getYouTubeThumbnailUrl: "quality" must be one of ${[...YOUTUBE_THUMBNAIL_QUALITIES].join(', ')}.`,
    );
  }

  return `${YOUTUBE_THUMBNAIL_ENDPOINT}/${extractYouTubeVideoId(videoIdOrUrl)}/${quality}.jpg`;
}
