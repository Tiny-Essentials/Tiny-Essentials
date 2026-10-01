import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import TinyPushPayload from '../../../src/v1/libs/sw/service/shared/TinyPushPayload.mjs';
import { PUSH_TYPE } from '../../../src/v1/libs/sw/utils.mjs';

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

describe('TinyPushPayload.from', () => {
  test('rejects non-objects', () => {
    assert.throws(() => TinyPushPayload.from(null), TypeError);
    assert.throws(() => TinyPushPayload.from([]), TypeError);
    assert.throws(() => TinyPushPayload.from('x'), TypeError);
  });

  test('defaults the type to unknown', () => {
    const message = TinyPushPayload.from({});
    assert.equal(message.type, PUSH_TYPE.UNKNOWN);
    assert.equal(message.v, TinyPushPayload.VERSION);
  });

  test('keeps a valid type', () => {
    assert.equal(TinyPushPayload.from({ type: 'order:paid' }).type, 'order:paid');
  });

  test('clamps the ttl to the allowed range', () => {
    assert.equal(TinyPushPayload.from({ ttl: -10 }).ttl, 0);
    assert.equal(TinyPushPayload.from({ ttl: 1e9 }).ttl, TinyPushPayload.MAX_TTL);
    assert.equal(TinyPushPayload.from({ ttl: 10.9 }).ttl, 10);
  });

  test('drops invalid data and notification values', () => {
    assert.equal(TinyPushPayload.from({ data: [] }).data, undefined);
    assert.equal(TinyPushPayload.from({ data: null }).data, undefined);
    assert.deepEqual(TinyPushPayload.from({ data: { a: 1 } }).data, { a: 1 });
  });

  test('returns a frozen object', () => {
    assert.ok(Object.isFrozen(TinyPushPayload.from({})));
  });
});

describe('TinyPushPayload.fromEvent', () => {
  test('rejects values without a data property', async () => {
    await assert.rejects(() => TinyPushPayload.fromEvent({}), TypeError);
  });

  test('returns unknown when there is no payload', async () => {
    assert.equal((await TinyPushPayload.fromEvent({ data: null })).type, PUSH_TYPE.UNKNOWN);
    assert.equal((await TinyPushPayload.fromEvent(fakeEvent(''))).type, PUSH_TYPE.UNKNOWN);
  });

  test('parses a valid JSON body', async () => {
    const message = await TinyPushPayload.fromEvent(fakeEvent('{"type":"order:paid"}'));
    assert.equal(message.type, 'order:paid');
  });

  test('wraps a non-JSON body into a notification', async () => {
    const message = await TinyPushPayload.fromEvent(fakeEvent('plain text'));
    assert.equal(message.notification.body, 'plain text');
  });

  test('survives a broken stream', async () => {
    const message = await TinyPushPayload.fromEvent(fakeEvent('', true));
    assert.equal(message.type, PUSH_TYPE.UNKNOWN);
  });
});

describe('TinyPushPayload.isExpired', () => {
  test('validates the arguments', () => {
    assert.throws(() => TinyPushPayload.isExpired(null), TypeError);
    assert.throws(() => TinyPushPayload.isExpired({}, NaN), TypeError);
  });

  test('compares the expiration time', () => {
    assert.equal(TinyPushPayload.isExpired({}), false);
    assert.equal(TinyPushPayload.isExpired({ expiresAt: 100 }, 200), true);
    assert.equal(TinyPushPayload.isExpired({ expiresAt: 200 }, 100), false);
  });
});

describe('TinyPushPayload.toNotification', () => {
  test('falls back to a default title', () => {
    assert.equal(TinyPushPayload.toNotification({}).title, 'Notification');
  });

  test('maps the actions into a lookup table', () => {
    const { options } = TinyPushPayload.toNotification({
      type: 'x',
      notification: {
        title: 'Hi',
        body: 'There',
        actions: [{ action: 'open', title: 'Open', url: '/open' }],
      },
    });
    assert.equal(options.body, 'There');
    assert.deepEqual(options.data.actions, { open: '/open' });
  });
});
