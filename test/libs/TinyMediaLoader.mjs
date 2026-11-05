import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based media loader test environments
 * (`test/html/html/loader/TinyMediaLoader`).
 *
 * Covers:
 * - TinyMediaProgress (byte accounting, rate, ETA, reset)
 * - TinyMediaMirror (in-flight registry, publish/subscribe replay)
 * - TinyFetchLoader (the concrete TinyMediaLoader subclass, end to end)
 *
 * `TinyMediaLoader` is abstract, so it is exercised through
 * `TinyFetchLoader`, which reuses its whole state machine, cache, progress
 * tracker and mirror registry without touching the DOM.
 *
 * @returns {Promise<number>}
 */

const { default: TinyMediaProgress } =
  await import('../../dist/v1/libs/html/loader/utils/TinyMediaProgress.mjs');
const { default: TinyMediaMirror } =
  await import('../../dist/v1/libs/html/loader/utils/TinyMediaMirror.mjs');
const { default: TinyFetchLoader } =
  await import('../../dist/v1/libs/html/loader/formats/TinyFetchLoader.mjs');
const { default: TinyMediaCache } =
  await import('../../dist/v1/libs/html/loader/utils/TinyMediaCache.mjs');

/**
 * Builds a `fetch` stub that always answers with the same body.
 * @param {string} body - The response body.
 * @param {object} [init] - Extra response options.
 * @returns {{ fetch: typeof fetch, calls: Array<{ url: string, init: object }> }}
 */
const stubFetch = (body, init = {}) => {
  const calls = [];
  const fetch = async (url, options = {}) => {
    calls.push({ url: String(url), init: options });
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'text/plain', 'content-length': String(body.length) },
      ...init,
    });
  };
  return { fetch, calls };
};

/**
 * Node.js port of the browser media loader test environment.
 * @returns {Promise<number>}
 */
const testMediaLoader = async () => {
  const t = new TestRunner('TinyMediaProgress');

  // -------------------------------------------------------------------
  // TinyMediaProgress
  // -------------------------------------------------------------------
  section('TinyMediaProgress - construction', '📊');
  const progress = new TinyMediaProgress(1000);
  t.equal(progress.total, 1000, 'Stores the total');
  t.equal(progress.loaded, 0, 'Starts with no bytes');
  t.equal(progress.remaining, 1000, 'Reports the remaining bytes');
  t.equal(progress.percent, 0, 'Starts at 0%');
  t.equal(progress.chunks, 0, 'Starts with no chunks');
  t.equal(progress.rate, 0, 'Starts with no rate');
  t.equal(progress.eta, 0, 'Starts with no ETA');
  t.throws(() => new TinyMediaProgress(-1), 'Rejects a negative total');
  t.throws(() => new TinyMediaProgress('nope'), 'Rejects a non-numeric total');

  section('TinyMediaProgress - accounting', '🧮');
  progress.start();
  progress.push(250);
  progress.push(250);
  t.equal(progress.loaded, 500, 'Accumulates the pushed bytes');
  t.equal(progress.chunks, 2, 'Counts the chunks');
  t.equal(progress.remaining, 500, 'Updates the remaining bytes');
  t.equal(progress.percent, 50, 'Computes the percentage');
  t.ok(progress.rate >= 0, 'Derives a non-negative rate');
  t.throws(() => progress.push(-1), 'Rejects a negative chunk');
  t.throws(() => progress.push('nope'), 'Rejects a non-numeric chunk');

  const snapshot = progress.snapshot();
  t.equal(snapshot.loaded, 500, 'snapshot() exposes the loaded bytes');
  t.equal(snapshot.total, 1000, 'snapshot() exposes the total');
  t.equal(snapshot.percent, 50, 'snapshot() exposes the percentage');
  t.equal(typeof snapshot.eta, 'number', 'snapshot() exposes the ETA');

  progress.total = 2000;
  t.equal(progress.total, 2000, 'Allows updating the total');
  t.equal(progress.percent, 25, 'Recomputes the percentage');
  t.throws(() => (progress.total = -1), 'Rejects an invalid total');

  progress.reset();
  t.equal(progress.loaded, 0, 'reset() clears the loaded bytes');
  t.equal(progress.chunks, 0, 'reset() clears the chunk counter');
  t.equal(progress.rate, 0, 'reset() clears the rate');

  // -------------------------------------------------------------------
  // TinyMediaMirror
  // -------------------------------------------------------------------
  const m = new TestRunner('TinyMediaMirror');
  section('TinyMediaMirror - registry', '🪞');
  TinyMediaMirror.clear();
  m.equal(TinyMediaMirror.size, 0, 'Starts empty');
  m.equal(TinyMediaMirror.has('a'), false, 'has() is false for unknown keys');
  m.equal(TinyMediaMirror.get('a'), null, 'get() is null for unknown keys');
  m.throws(() => TinyMediaMirror.open(5, 'x'), 'open() validates the key');
  m.throws(() => TinyMediaMirror.open('a', 5), 'open() validates the source');

  const entry = TinyMediaMirror.open('a', 'https://example.com/a.bin');
  m.equal(entry.key, 'a', 'open() registers the entry');
  m.equal(TinyMediaMirror.size, 1, 'Tracks the pending downloads');
  m.equal(TinyMediaMirror.open('a', 'other'), entry, 'open() reuses a live entry');
  m.equal(TinyMediaMirror.attach('a'), entry, 'attach() returns the entry');
  m.equal(entry.mirrors, 1, 'attach() increments the mirror count');
  m.equal(TinyMediaMirror.attach('ghost'), null, 'attach() is null for unknown keys');

  section('TinyMediaMirror - events', '📡');
  const received = [];
  const unsubscribe = TinyMediaMirror.subscribe('a', (event) => received.push(event.name));
  m.equal(typeof unsubscribe, 'function', 'subscribe() returns an unsubscribe function');
  m.throws(() => TinyMediaMirror.subscribe('a', 'nope'), 'subscribe() validates the handler');

  TinyMediaMirror.publish('a', 'progress', [{ loaded: 1 }]);
  TinyMediaMirror.publish('a', 'chunk', [new Uint8Array([1])]);
  m.deepEqual(received, ['progress', 'chunk'], 'Publishes to the live subscribers');
  m.equal(TinyMediaMirror.publish('ghost', 'x', []), 0, 'publish() is a no-op for unknown keys');
  m.throws(() => TinyMediaMirror.publish(5, 'x', []), 'publish() validates the key');
  m.throws(() => TinyMediaMirror.publish('a', 5, []), 'publish() validates the name');
  m.throws(() => TinyMediaMirror.publish('a', 'x', 'nope'), 'publish() validates the args');

  const replayed = [];
  TinyMediaMirror.subscribe('a', (event) => replayed.push(event.name));
  m.deepEqual(replayed, ['progress', 'chunk'], 'Late subscribers replay the history');
  m.equal(TinyMediaMirror.history('a').length, 2, 'history() exposes the event log');
  m.equal(TinyMediaMirror.entries().length, 1, 'entries() snapshots the registry');

  unsubscribe();
  TinyMediaMirror.publish('a', 'loaded', []);
  m.deepEqual(received, ['progress', 'chunk'], 'unsubscribe() stops the delivery');

  m.equal(TinyMediaMirror.close('a'), true, 'close() removes the entry');
  m.equal(TinyMediaMirror.close('a'), false, 'close() is false when already gone');
  m.equal(TinyMediaMirror.size, 0, 'The registry is empty again');

  // -------------------------------------------------------------------
  // TinyFetchLoader (TinyMediaLoader end to end)
  // -------------------------------------------------------------------
  const f = new TestRunner('TinyFetchLoader');
  section('TinyFetchLoader - construction', '📥');
  f.throws(() => new TinyFetchLoader({ responseType: 'nope' }), 'Rejects an invalid responseType');
  f.throws(() => new TinyFetchLoader({ fetch: 'nope' }), 'Rejects a non-function fetch');
  f.throws(() => new TinyFetchLoader({ init: 'nope' }), 'Rejects a non-object init');
  f.throws(() => new TinyFetchLoader({ cache: {} }), 'Rejects an invalid cache');

  section('TinyFetchLoader - text', '📄');
  const textStub = stubFetch('hello world');
  const textLoader = new TinyFetchLoader({
    src: 'https://example.com/a.txt',
    responseType: 'text',
    timeout: 0,
    fetch: textStub.fetch,
  });

  const events = [];
  for (const name of ['loadstart', 'loaded', 'loadend', 'response', 'chunk']) {
    textLoader.on(name, () => events.push(name));
  }

  const metadata = await textLoader.load();
  f.equal(textLoader.data, 'hello world', 'Decodes the text payload');
  f.ok(textLoader.blob instanceof Blob, 'Exposes the raw blob');
  f.equal(metadata.size, 11, 'Reports the payload size');
  f.equal(metadata.type, 'text/plain', 'Reports the content type');
  f.equal(textLoader.isLoaded, true, 'Reaches the loaded state');
  f.equal(textLoader.hasError, false, 'Does not flag an error');
  f.equal(textLoader.responseType, 'text', 'Exposes the response type');
  f.ok(events.includes('loadstart'), 'Emits loadstart');
  f.ok(events.includes('loaded'), 'Emits loaded');
  f.ok(events.includes('loadend'), 'Emits loadend');
  f.ok(events.includes('response'), 'Emits response');
  f.ok(events.includes('chunk'), 'Emits chunk');
  f.equal(textStub.calls.length, 1, 'Performs a single request');

  section('TinyFetchLoader - response types', '🧬');
  const jsonLoader = new TinyFetchLoader({
    src: 'https://example.com/a.json',
    responseType: 'json',
    timeout: 0,
    fetch: stubFetch('{"ok":true}').fetch,
  });
  await jsonLoader.load();
  f.deepEqual(jsonLoader.data, { ok: true }, 'Parses a JSON payload');

  const bufferLoader = new TinyFetchLoader({
    src: 'https://example.com/a.bin',
    responseType: 'arraybuffer',
    timeout: 0,
    fetch: stubFetch('abc').fetch,
  });
  await bufferLoader.load();
  f.ok(bufferLoader.data instanceof ArrayBuffer, 'Returns an ArrayBuffer');
  f.equal(bufferLoader.data.byteLength, 3, 'Keeps the payload length');

  const blobLoader = new TinyFetchLoader({
    src: 'https://example.com/a.bin',
    timeout: 0,
    fetch: stubFetch('abc').fetch,
  });
  await blobLoader.load();
  f.ok(blobLoader.data instanceof Blob, 'Defaults to a Blob payload');

  section('TinyFetchLoader - request body', '📤');
  const bodyStub = stubFetch('ok');
  const bodyLoader = new TinyFetchLoader({
    src: 'https://example.com/submit',
    timeout: 0,
    init: { method: 'POST' },
    body: 'hello=world',
    fetch: bodyStub.fetch,
  });
  f.equal(bodyLoader.body, 'hello=world', 'Exposes the configured body');
  await bodyLoader.load();
  f.equal(bodyStub.calls.length, 1, 'Sends a single request with a body');
  f.equal(bodyStub.calls[0].init.body, 'hello=world', 'Forwards the body to fetch');

  const initBodyStub = stubFetch('ok');
  const initBodyLoader = new TinyFetchLoader({
    src: 'https://example.com/submit',
    timeout: 0,
    init: { method: 'POST', body: 'from-init' },
    body: 'from-option',
    fetch: initBodyStub.fetch,
  });
  await initBodyLoader.load();
  f.equal(
    initBodyStub.calls[0].init.body,
    'from-init',
    'init.body takes precedence over the body option',
  );

  const noBodyStub = stubFetch('ok');
  const noBodyLoader = new TinyFetchLoader({
    src: 'https://example.com/plain',
    timeout: 0,
    fetch: noBodyStub.fetch,
  });
  f.equal(noBodyLoader.body, undefined, 'Defaults the body to undefined');
  await noBodyLoader.load();
  f.equal(noBodyStub.calls[0].init.body, undefined, 'Omits the body when it is not set');

  bodyLoader.body = 'replaced';
  f.equal(bodyLoader.body, 'replaced', 'Allows replacing the body between loads');

  section('TinyFetchLoader - clone & exportFetch', '🧷');
  const clone = textLoader.clone({ responseType: 'text' });
  f.ok(clone instanceof TinyFetchLoader, 'clone() returns a new loader');
  f.ok(clone !== textLoader, 'clone() returns an independent instance');
  f.equal(clone.src, textLoader.src, 'clone() keeps the source');
  f.throws(() => textLoader.clone('nope'), 'clone() validates the overrides');

  const tinyFetch = textLoader.exportFetch();
  f.equal(typeof tinyFetch, 'function', 'exportFetch() returns a function');
  const exported = await tinyFetch('https://example.com/b.txt');
  f.ok(exported instanceof Response, 'exportFetch() resolves a Response');

  section('TinyFetchLoader - errors', '🛑');
  const failing = new TinyFetchLoader({
    src: 'https://example.com/missing.txt',
    timeout: 0,
    fetch: async () => new Response('nope', { status: 404, statusText: 'Not Found' }),
  });
  let failed = false;
  failing.on('error', () => {});
  await failing.load().catch(() => (failed = true));
  f.equal(failed, true, 'Rejects when the response is not ok');
  f.equal(failing.hasError, true, 'Reaches the error state');

  const noSource = new TinyFetchLoader({ timeout: 0 });
  let missingSource = false;
  await noSource.load().catch(() => (missingSource = true));
  f.equal(missingSource, true, 'Rejects a load without a source');

  section('TinyFetchLoader - lifecycle', '🔄');
  const lifecycle = new TinyFetchLoader({
    src: 'https://example.com/a.txt',
    timeout: 0,
    fetch: stubFetch('abc').fetch,
  });
  f.equal(lifecycle.state, 'idle', 'Starts idle');
  await lifecycle.load();
  f.equal(lifecycle.state, 'loaded', 'Reaches the loaded state');
  await lifecycle.reload();
  f.equal(lifecycle.state, 'loaded', 'reload() loads the source again');
  lifecycle.destroy();
  f.equal(lifecycle.state, 'destroyed', 'destroy() reaches the destroyed state');
  await lifecycle.load().catch(() => {});
  f.equal(lifecycle.hasError, false, 'A destroyed loader does not flip to error');

  section('TinyFetchLoader - cache', '🗄️');
  const cache = new TinyMediaCache();
  const cached = new TinyFetchLoader({
    src: 'https://example.com/cached.txt',
    responseType: 'text',
    timeout: 0,
    cache,
    fetch: stubFetch('cached body').fetch,
  });
  await cached.load();
  f.equal(cached.data, 'cached body', 'Accepts a shared cache');
  f.equal(cached.cache, cache, 'Exposes the shared cache');
  cached.destroy();
  cache.destroy();

  section('TinyFetchLoader - cache probes', '🔍');
  const probeCache = new TinyMediaCache();
  const probeSrc = 'https://example.com/probe.txt';
  const probe = new TinyFetchLoader({
    src: probeSrc,
    responseType: 'text',
    timeout: 0,
    cache: probeCache,
    fetch: stubFetch('probe body').fetch,
  });

  f.equal(probe.isCached(), false, 'isCached() is false before the load');
  f.equal(probe.cached, false, 'cached is false before the load');
  f.equal(probe.peekCache(), null, 'peekCache() is null before the load');
  f.equal(probe.pending, false, 'pending is false when nothing is in flight');

  await probe.load();

  f.equal(probe.isCached(), true, 'isCached() is true after the load');
  f.equal(probe.isCached(probeSrc), true, 'isCached() accepts an explicit src');
  f.equal(probe.isCached('https://example.com/none.txt'), false, 'isCached() is false for others');
  f.equal(probe.cached, true, 'cached mirrors isCached()');
  f.throws(() => probe.isCached(5), 'isCached() validates the src');

  const peekedEntry = probe.peekCache();
  f.ok(peekedEntry !== null, 'peekCache() returns the entry');
  f.equal(peekedEntry.size, 10, 'peekCache() exposes the entry size');
  f.equal(probe.peekCache(probeSrc), peekedEntry, 'peekCache() accepts an explicit src');
  f.equal(probe.peekCache('https://example.com/none.txt'), null, 'peekCache() is null for others');
  f.throws(() => probe.peekCache(5), 'peekCache() validates the src');

  const bare = new TinyFetchLoader({ src: probeSrc, timeout: 0, fetch: stubFetch('x').fetch });
  f.equal(bare.isCached(), false, 'isCached() is false without a cache');
  f.equal(bare.cached, false, 'cached is false without a cache');
  f.equal(bare.peekCache(), null, 'peekCache() is null without a cache');
  bare.destroy();

  probe.destroy();
  probeCache.destroy();

  console.log(`\n${color('gray', 'Media loader test-suite finished.')}`);

  return t.summary() + m.summary() + f.summary();
};

export default testMediaLoader;
