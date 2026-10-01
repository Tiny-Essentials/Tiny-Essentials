import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import TinyNotificationAdapter from '../../../src/v1/libs/sw/browser/TinyNotificationAdapter.mjs';

describe('TinyNotificationAdapter.toBrowser', () => {
  test('rejects invalid input', () => {
    assert.throws(() => TinyNotificationAdapter.toBrowser([]), TypeError);
    assert.throws(() => TinyNotificationAdapter.toBrowser('x'), TypeError);
  });

  test('falls back to a default title', () => {
    assert.equal(TinyNotificationAdapter.toBrowser(null).title, 'Notification');
  });

  test('strips service worker only options', () => {
    const { options } = TinyNotificationAdapter.toBrowser({
      title: 'Hi',
      body: 'There',
      badge: '/badge.png',
      actions: [{ action: 'a', title: 'A' }],
    });
    assert.equal(options.body, 'There');
    assert.equal('badge' in options, false);
    assert.equal('actions' in options, false);
  });

  test('drops renotify when there is no tag', () => {
    const { options } = TinyNotificationAdapter.toBrowser({ title: 'Hi', renotify: true });
    assert.equal('renotify' in options, false);
  });

  test('keeps renotify when a tag is present', () => {
    const { options } = TinyNotificationAdapter.toBrowser({
      title: 'Hi',
      renotify: true,
      tag: 'order',
    });
    assert.equal(options.renotify, true);
  });

  test('applies the overrides last', () => {
    const { options } = TinyNotificationAdapter.toBrowser(
      { title: 'Hi', body: 'a' },
      { body: 'b' },
    );
    assert.equal(options.body, 'b');
  });
});

describe('TinyNotificationAdapter.toServiceWorker', () => {
  test('rejects invalid input', () => {
    assert.throws(() => TinyNotificationAdapter.toServiceWorker(null), TypeError);
  });

  test('produces a body string', () => {
    const result = TinyNotificationAdapter.toServiceWorker({ title: 'Hi', options: {} });
    assert.equal(result.title, 'Hi');
    assert.equal(result.body, '');
  });

  test('round trips through toBrowser', () => {
    const browser = TinyNotificationAdapter.toBrowser({ title: 'Hi', body: 'There' });
    const back = TinyNotificationAdapter.toServiceWorker(browser);
    assert.equal(back.title, 'Hi');
    assert.equal(back.body, 'There');
  });
});
