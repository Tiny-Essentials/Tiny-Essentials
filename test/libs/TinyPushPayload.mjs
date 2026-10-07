/**
 * Node.js port of the browser based TinyPushPayload test environment
 * (`test/sw/TinyPushPayload.test.mjs`).
 *
 * Covers:
 * - TinyPushPayload.from (normalization + validation)
 * - TinyPushPayload.fromEvent (one-shot push event parsing)
 * - TinyPushPayload.isExpired
 * - TinyPushPayload.toNotification
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';

const { default: TinyPushPayload } =
  await import('../../dist/v1/libs/sw/service/shared/TinyPushPayload.mjs');
const { PUSH_TYPE } = await import('../../dist/v1/libs/sw/utils.mjs');

/**
 * Builds a minimal PushEvent-like object.
 * @param {string|null} text - The value returned by `data.text()`.
 * @param {boolean} [throws] - When `true`, `text()` rejects.
 * @returns {{ data: { text: () => Promise<string> } }}
 */
const fakeEvent = (text, throws = false) => ({
  data: {
    text: async () => {
      if (throws) throw new Error('stream error');
      return text;
    },
  },
});

/**
 * Node.js port of the browser TinyPushPayload test environment.
 * @returns {Promise<number>}
 */
const testPushPayload = async () => {
  const t = new TestRunner('TinyPushPayload');

  // -------------------------------------------------------------------
  // from
  // -------------------------------------------------------------------
  section('TinyPushPayload.from', '📦');
  t.throws(() => TinyPushPayload.from(null), 'Rejects null');
  t.throws(() => TinyPushPayload.from([]), 'Rejects arrays');
  t.throws(() => TinyPushPayload.from('x'), 'Rejects strings');

  const empty = TinyPushPayload.from({});
  t.equal(empty.type, PUSH_TYPE.UNKNOWN, 'Defaults the type to unknown');
  t.equal(empty.v, TinyPushPayload.VERSION, 'Defaults the version');
  t.equal(TinyPushPayload.from({ type: 'order:paid' }).type, 'order:paid', 'Keeps a valid type');

  t.equal(TinyPushPayload.from({ ttl: -10 }).ttl, 0, 'Clamps a negative ttl to 0');
  t.equal(TinyPushPayload.from({ ttl: 1e9 }).ttl, TinyPushPayload.MAX_TTL, 'Clamps a large ttl');
  t.equal(TinyPushPayload.from({ ttl: 10.9 }).ttl, 10, 'Truncates the ttl');

  t.equal(TinyPushPayload.from({ data: [] }).data, undefined, 'Drops an array data value');
  t.equal(TinyPushPayload.from({ data: null }).data, undefined, 'Drops a null data value');
  t.deepEqual(
    TinyPushPayload.from({ data: { a: 1 } }).data,
    { a: 1 },
    'Keeps an object data value',
  );

  t.equal(Object.isFrozen(TinyPushPayload.from({})), true, 'Returns a frozen object');

  // -------------------------------------------------------------------
  // fromEvent
  // -------------------------------------------------------------------
  section('TinyPushPayload.fromEvent', '📨');
  await t.ok(
    await TinyPushPayload.fromEvent({})
      .then(() => false)
      .catch(() => true),
    'Rejects values without a data property',
  );

  t.equal(
    (await TinyPushPayload.fromEvent({ data: null })).type,
    PUSH_TYPE.UNKNOWN,
    'Returns unknown when there is no payload',
  );
  t.equal(
    (await TinyPushPayload.fromEvent(fakeEvent(''))).type,
    PUSH_TYPE.UNKNOWN,
    'Returns unknown for an empty body',
  );

  t.equal(
    (await TinyPushPayload.fromEvent(fakeEvent('{"type":"order:paid"}'))).type,
    'order:paid',
    'Parses a valid JSON body',
  );

  const wrapped = await TinyPushPayload.fromEvent(fakeEvent('plain text'));
  t.equal(wrapped.notification.body, 'plain text', 'Wraps a non-JSON body into a notification');

  t.equal(
    (await TinyPushPayload.fromEvent(fakeEvent('', true))).type,
    PUSH_TYPE.UNKNOWN,
    'Survives a broken stream',
  );

  // -------------------------------------------------------------------
  // isExpired
  // -------------------------------------------------------------------
  section('TinyPushPayload.isExpired', '⏰');
  t.throws(() => TinyPushPayload.isExpired(null), 'Rejects a null message');
  t.throws(() => TinyPushPayload.isExpired({}, NaN), 'Rejects a non-finite now');
  t.equal(TinyPushPayload.isExpired({}), false, 'A message without expiry never expires');
  t.equal(TinyPushPayload.isExpired({ expiresAt: 100 }, 200), true, 'Detects an expired message');
  t.equal(TinyPushPayload.isExpired({ expiresAt: 200 }, 100), false, 'Keeps a live message');

  // -------------------------------------------------------------------
  // toNotification
  // -------------------------------------------------------------------
  section('TinyPushPayload.toNotification', '🔔');
  t.equal(
    TinyPushPayload.toNotification({}).title,
    'Notification',
    'Falls back to a default title',
  );

  const { options } = TinyPushPayload.toNotification({
    type: 'x',
    notification: {
      title: 'Hi',
      body: 'There',
      actions: [{ action: 'open', title: 'Open', url: '/open' }],
    },
  });
  t.equal(options.body, 'There', 'Maps the body');
  t.deepEqual(options.data.actions, { open: '/open' }, 'Maps the actions into a lookup table');

  console.log(`\n${color('gray', 'TinyPushPayload test-suite finished.')}`);

  return t.summary();
};

export default testPushPayload;
