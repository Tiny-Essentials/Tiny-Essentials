/**
 * Node.js port of the browser based TinyNotificationAdapter test environment
 * (`test/sw/TinyNotificationAdapter.test.mjs`).
 *
 * Covers:
 * - TinyNotificationAdapter.toBrowser (SW -> page normalization)
 * - TinyNotificationAdapter.toServiceWorker (page -> SW normalization)
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';

const { default: TinyNotificationAdapter } =
  await import('../../dist/v1/libs/sw/browser/TinyNotificationAdapter.mjs');

/**
 * Node.js port of the browser TinyNotificationAdapter test environment.
 * @returns {Promise<number>}
 */
const testNotificationAdapter = async () => {
  const t = new TestRunner('TinyNotificationAdapter');

  // -------------------------------------------------------------------
  // toBrowser
  // -------------------------------------------------------------------
  section('TinyNotificationAdapter - toBrowser', '🔔');
  t.throws(() => TinyNotificationAdapter.toBrowser([]), 'Rejects an array input');
  t.throws(() => TinyNotificationAdapter.toBrowser('x'), 'Rejects a string input');

  t.equal(
    TinyNotificationAdapter.toBrowser(null).title,
    'Notification',
    'Falls back to a default title',
  );

  const stripped = TinyNotificationAdapter.toBrowser({
    title: 'Hi',
    body: 'There',
    badge: '/badge.png',
    actions: [{ action: 'a', title: 'A' }],
  });
  t.equal(stripped.options.body, 'There', 'Keeps the body');
  t.equal('badge' in stripped.options, false, 'Strips the service worker only badge option');
  t.equal('actions' in stripped.options, false, 'Strips the service worker only actions option');

  t.equal(
    'renotify' in TinyNotificationAdapter.toBrowser({ title: 'Hi', renotify: true }).options,
    false,
    'Drops renotify when there is no tag',
  );
  t.equal(
    TinyNotificationAdapter.toBrowser({ title: 'Hi', renotify: true, tag: 'order' }).options
      .renotify,
    true,
    'Keeps renotify when a tag is present',
  );

  t.equal(
    TinyNotificationAdapter.toBrowser({ title: 'Hi', body: 'a' }, { body: 'b' }).options.body,
    'b',
    'Applies the overrides last',
  );

  // -------------------------------------------------------------------
  // toServiceWorker
  // -------------------------------------------------------------------
  section('TinyNotificationAdapter - toServiceWorker', '📨');
  t.throws(() => TinyNotificationAdapter.toServiceWorker(null), 'Rejects invalid input');

  const result = TinyNotificationAdapter.toServiceWorker({ title: 'Hi', options: {} });
  t.equal(result.title, 'Hi', 'Keeps the title');
  t.equal(result.body, '', 'Produces a body string');

  const browser = TinyNotificationAdapter.toBrowser({ title: 'Hi', body: 'There' });
  const back = TinyNotificationAdapter.toServiceWorker(browser);
  t.equal(back.title, 'Hi', 'Round trips the title through toBrowser');
  t.equal(back.body, 'There', 'Round trips the body through toBrowser');

  console.log(`\n${color('gray', 'TinyNotificationAdapter test-suite finished.')}`);

  return t.summary();
};

export default testNotificationAdapter;
