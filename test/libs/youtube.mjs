import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based YouTube test environment
 * (`test/html/basics/youtube`).
 *
 * Covers:
 *
 * - extractYouTubeVideoId (raw ids, every supported host, error paths)
 * - getYouTubeThumbnailUrl (quality validation, URL composition)
 * - assertYouTubeOEmbedResponse (deep payload validation)
 * - fetchYouTubeOEmbed (request building, error handling, injected fetch)
 *
 * @returns {Promise<number>}
 */

const {
  assertYouTubeOEmbedResponse,
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  getYouTubeThumbnailUrl,
} = await import('../../dist/v1/basics/media/youtube.mjs');

/** A real, 11 character long YouTube video id. */
const VIDEO_ID = 'dQw4w9WgXcQ';

/**
 * Builds a valid oEmbed payload, allowing per-test overrides.
 * @param {Record<string, unknown>} [overrides] - Properties to override.
 * @returns {Record<string, unknown>} The payload.
 */
const oembedPayload = (overrides = {}) => ({
  title: 'Never Gonna Give You Up',
  author_name: 'Rick Astley',
  author_url: 'https://www.youtube.com/@RickAstleyYT',
  type: 'video',
  version: '1.0',
  provider_name: 'YouTube',
  provider_url: 'https://www.youtube.com/',
  html: `<iframe src="https://www.youtube.com/embed/${VIDEO_ID}"></iframe>`,
  width: 200,
  height: 113,
  thumbnail_url: `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
  thumbnail_width: 480,
  thumbnail_height: 360,
  ...overrides,
});

/**
 * Builds a `fetch` stub that always resolves with the given payload.
 * @param {unknown} payload - The JSON payload to resolve with.
 * @param {object} [init] - Extra response options.
 * @returns {{ fetchImpl: typeof fetch, calls: Array<{ url: string, init: object }> }}
 */
const stubFetch = (payload, init = {}) => {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), init: options });
    return {
      ok: true,
      status: 200,
      json: async () => payload,
      ...init,
    };
  };

  return { fetchImpl, calls };
};

/**
 * Node.js port of the browser YouTube test environment.
 * @returns {Promise<number>}
 */
const testYoutube = async () => {
  const t = new TestRunner('youtube');

  // -------------------------------------------------------------------
  // extractYouTubeVideoId - raw ids
  // -------------------------------------------------------------------
  section('extractYouTubeVideoId - raw ids', '🆔');
  t.equal(extractYouTubeVideoId(VIDEO_ID), VIDEO_ID, 'Accepts a raw video id');
  t.equal(extractYouTubeVideoId(`  ${VIDEO_ID}  `), VIDEO_ID, 'Trims the input');
  t.throws(() => extractYouTubeVideoId(123), 'Rejects a non-string input');
  t.throws(() => extractYouTubeVideoId(''), 'Rejects an empty string');
  t.throws(() => extractYouTubeVideoId('   '), 'Rejects a blank string');
  t.throws(() => extractYouTubeVideoId('too-short'), 'Rejects an invalid id');

  // -------------------------------------------------------------------
  // extractYouTubeVideoId - URLs
  // -------------------------------------------------------------------
  section('extractYouTubeVideoId - urls', '🔗');
  const urls = [
    `https://www.youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtube.com/watch?v=${VIDEO_ID}&t=10`,
    `https://m.youtube.com/watch?v=${VIDEO_ID}`,
    `https://music.youtube.com/watch?v=${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}`,
    `https://youtu.be/${VIDEO_ID}?t=42`,
    `https://www.youtube.com/embed/${VIDEO_ID}`,
    `https://www.youtube.com/shorts/${VIDEO_ID}`,
    `https://www.youtube.com/live/${VIDEO_ID}`,
    `https://www.youtube.com/v/${VIDEO_ID}`,
    `https://www.youtube-nocookie.com/embed/${VIDEO_ID}`,
    `http://www.youtube.com/watch?v=${VIDEO_ID}`,
  ];

  for (const url of urls) {
    t.equal(extractYouTubeVideoId(url), VIDEO_ID, `Extracts the id from ${url}`);
  }

  t.throws(
    () => extractYouTubeVideoId('https://vimeo.com/123456789'),
    'Rejects an unsupported host',
  );
  t.throws(
    () => extractYouTubeVideoId('ftp://youtube.com/watch?v=dQw4w9WgXcQ'),
    'Rejects an unsupported protocol',
  );
  t.throws(
    () => extractYouTubeVideoId('https://www.youtube.com/watch?v=short'),
    'Rejects a URL without a valid id',
  );
  t.throws(() => extractYouTubeVideoId('not a video id'), 'Rejects a non URL string');

  // -------------------------------------------------------------------
  // getYouTubeThumbnailUrl
  // -------------------------------------------------------------------
  section('getYouTubeThumbnailUrl', '🖼️');
  t.equal(
    getYouTubeThumbnailUrl(VIDEO_ID),
    `https://i.ytimg.com/vi/${VIDEO_ID}/hqdefault.jpg`,
    'Defaults to hqdefault',
  );
  t.equal(
    getYouTubeThumbnailUrl(VIDEO_ID, 'maxresdefault'),
    `https://i.ytimg.com/vi/${VIDEO_ID}/maxresdefault.jpg`,
    'Respects the quality argument',
  );
  t.equal(
    getYouTubeThumbnailUrl(`https://youtu.be/${VIDEO_ID}`, 'sddefault'),
    `https://i.ytimg.com/vi/${VIDEO_ID}/sddefault.jpg`,
    'Accepts a full URL',
  );
  t.throws(() => getYouTubeThumbnailUrl(VIDEO_ID, 'ultra'), 'Rejects an unknown quality');
  t.throws(() => getYouTubeThumbnailUrl(VIDEO_ID, 1), 'Rejects a non-string quality');
  t.throws(() => getYouTubeThumbnailUrl('nope'), 'Propagates the id validation');

  // -------------------------------------------------------------------
  // assertYouTubeOEmbedResponse
  // -------------------------------------------------------------------
  section('assertYouTubeOEmbedResponse', '✅');
  const valid = assertYouTubeOEmbedResponse(oembedPayload());
  t.equal(valid.title, 'Never Gonna Give You Up', 'Returns the parsed title');
  t.equal(valid.width, 200, 'Returns the parsed width');
  t.throws(() => assertYouTubeOEmbedResponse(null), 'Rejects a null payload');
  t.throws(() => assertYouTubeOEmbedResponse([]), 'Rejects an array payload');
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ type: 'channel' })),
    'Rejects an unexpected type',
  );
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ title: 42 })),
    'Rejects a non-string title',
  );
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ title: '   ' })),
    'Rejects an empty title',
  );
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ width: -1 })),
    'Rejects a negative width',
  );
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ height: 1.5 })),
    'Rejects a non-integer height',
  );
  t.throws(
    () => assertYouTubeOEmbedResponse(oembedPayload({ width: '200' })),
    'Rejects a string width',
  );

  // -------------------------------------------------------------------
  // fetchYouTubeOEmbed
  // -------------------------------------------------------------------
  section('fetchYouTubeOEmbed - success', '📡');
  const { fetchImpl, calls } = stubFetch(oembedPayload());
  const response = await fetchYouTubeOEmbed(VIDEO_ID, { fetchImpl });
  t.equal(response.title, 'Never Gonna Give You Up', 'Returns the validated payload');
  t.equal(calls.length, 1, 'Performs a single request');
  const expectedEndpoint = new URL('https://www.youtube.com/oembed');
  expectedEndpoint.searchParams.set('format', 'json');
  expectedEndpoint.searchParams.set('url', `https://www.youtube.com/watch?v=${VIDEO_ID}`);
  t.equal(String(calls[0].url), expectedEndpoint.toString(), 'Builds the oEmbed endpoint');
  t.equal(calls[0].init.method, 'GET', 'Uses GET');

  section('fetchYouTubeOEmbed - validation', '🧪');
  await t.throwsAsync(
    () => fetchYouTubeOEmbed(VIDEO_ID, { fetchImpl: 'nope' }),
    'Rejects a non-function fetchImpl',
  );
  await t.throwsAsync(
    () => fetchYouTubeOEmbed(VIDEO_ID, { signal: 'nope', fetchImpl }),
    'Rejects an invalid signal',
  );
  await t.throwsAsync(() => fetchYouTubeOEmbed(VIDEO_ID, null), 'Rejects a null options object');
  await t.throwsAsync(
    () => fetchYouTubeOEmbed('invalid', { fetchImpl }),
    'Propagates the id validation',
  );

  section('fetchYouTubeOEmbed - http errors', '🚨');
  const { fetchImpl: notOk } = stubFetch(oembedPayload(), { ok: false, status: 404 });
  await t.throwsAsync(
    () => fetchYouTubeOEmbed(VIDEO_ID, { fetchImpl: notOk }),
    'Throws on a non 2xx status',
  );

  const { fetchImpl: brokenResponse } = stubFetch(oembedPayload(), { json: undefined });
  await t.throwsAsync(
    () => fetchYouTubeOEmbed(VIDEO_ID, { fetchImpl: brokenResponse }),
    'Throws when the response is not a Response',
  );

  const { fetchImpl: invalidPayload } = stubFetch({ type: 'video' });
  await t.throwsAsync(
    () => fetchYouTubeOEmbed(VIDEO_ID, { fetchImpl: invalidPayload }),
    'Throws when the payload is invalid',
  );

  console.log(`\n${color('gray', 'youtube test-suite finished.')}`);

  return t.summary();
};

export default testYoutube;
