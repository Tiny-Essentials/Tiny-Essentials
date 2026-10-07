/**
 * Node.js port of the browser based notification test environments
 * (`test/html/html/notification/TinyNotify`).
 *
 * Covers:
 * - TinyNotifyCenter (notification center)
 * - TinyToastNotify (toast notifications)
 *
 * A tiny DOM polyfill is installed before the modules are imported.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color, sleep } from './_helpers.mjs';
import { installDOM } from './_dom.mjs';

const { document } = installDOM();

const { default: TinyNotifyCenter } =
  await import('../../dist/v1/libs/html/notification/TinyNotifyCenter.mjs');
const { default: TinyToastNotify } =
  await import('../../dist/v1/libs/html/notification/TinyToastNotify.mjs');

/**
 * Builds the notification center DOM structure.
 * @returns {{ center: any, badge: any, button: any, overlay: any }}
 */
const buildCenter = () => {
  const overlay = document.createElement('div');
  overlay.className = 'notify-overlay';
  const center = document.createElement('div');
  center.id = 'notifCenter';
  const list = document.createElement('div');
  list.className = 'list';
  center.appendChild(list);
  const badge = document.createElement('span');
  badge.id = 'notifBadge';
  const button = document.createElement('button');
  button.className = 'notify-bell';
  document.body.appendChild(overlay);
  document.body.appendChild(center);
  document.body.appendChild(badge);
  document.body.appendChild(button);
  return { center, badge, button, overlay };
};

/**
 * Node.js port of the browser notification test environments.
 * @returns {Promise<number>}
 */
const testNotify = async () => {
  const t = new TestRunner('TinyNotifyCenter');

  // -------------------------------------------------------------------
  // TinyNotifyCenter
  // -------------------------------------------------------------------
  section('TinyNotifyCenter - template', '🔔');
  const template = TinyNotifyCenter.getTemplate();
  t.ok(template.includes('notify-center'), 'getTemplate returns the markup');

  const { center, badge, button, overlay } = buildCenter();
  const notify = new TinyNotifyCenter({ center, badge, button, overlay });
  t.ok(notify instanceof TinyNotifyCenter, 'Creates an instance');
  t.equal(notify.count, 0, 'Starts with no notifications');
  t.throws(() => new TinyNotifyCenter({ center: null }), 'Validates the center element');

  section('TinyNotifyCenter - notifications', '📥');
  notify.add('Hello world');
  notify.add({ title: 'Title', message: 'With title' });
  notify.add('<b>Bold</b>', 'html');
  t.equal(notify.count, 3, 'Adds notifications');
  t.equal(notify.hasItem(0), true, 'hasItem finds an existing item');
  t.equal(notify.hasItem(99), false, 'hasItem rejects a missing item');
  t.equal(notify.getItemMode(0), 'html', 'Tracks the render mode');
  t.ok(notify.getItem(0), 'getItem returns the element');

  section('TinyNotifyCenter - read state', '✅');
  notify.markAsRead(0);
  t.equal(notify.count, 2, 'markAsRead decrements the unread count');
  notify.recount();
  t.equal(notify.count, 2, 'recount recomputes the unread count');

  section('TinyNotifyCenter - open/close', '🚪');
  notify.open();
  t.equal(center.classList.contains('open'), true, 'open() opens the center');
  notify.close();
  t.equal(center.classList.contains('open'), false, 'close() closes the center');
  notify.toggle();
  t.equal(center.classList.contains('open'), true, 'toggle() opens the center');
  notify.setMarkAllAsReadOnClose(true);
  notify.close();
  t.throws(() => notify.setMarkAllAsReadOnClose('nope'), 'Validates the markAllAsRead flag');

  // Flush the pending removal timers before destroying the instance.
  notify.setRemoveDelay(0);
  notify.clear();
  await sleep(10);

  notify.destroy();
  t.equal(notify.destroyed, true, 'destroy marks the instance as destroyed');
  t.throws(() => notify.add('nope'), 'Throws after being destroyed');

  // -------------------------------------------------------------------
  // TinyToastNotify
  // -------------------------------------------------------------------
  const toastRunner = new TestRunner('TinyToastNotify');
  section('TinyToastNotify - construction', '🍞');
  const toast = new TinyToastNotify('top', 'right', 3000, 60, 300);
  toastRunner.equal(toast.getY(), 'top', 'Stores the vertical position');
  toastRunner.equal(toast.getX(), 'right', 'Stores the horizontal position');
  toastRunner.equal(toast.getBaseDuration(), 3000, 'Stores the base duration');
  toastRunner.equal(toast.getExtraPerChar(), 60, 'Stores the extra per char');
  toastRunner.equal(toast.getFadeOutDuration(), 300, 'Stores the fade out duration');
  toastRunner.throws(() => new TinyToastNotify('nope'), 'Rejects an invalid Y position');
  toastRunner.throws(() => new TinyToastNotify('top', 'nope'), 'Rejects an invalid X position');

  section('TinyToastNotify - configuration', '⚙️');
  toast.setY('bottom');
  toastRunner.equal(toast.getY(), 'bottom', 'setY updates the vertical position');
  toast.setX('left');
  toastRunner.equal(toast.getX(), 'left', 'setX updates the horizontal position');
  toast.setBaseDuration(1000);
  toastRunner.equal(toast.getBaseDuration(), 1000, 'setBaseDuration updates the duration');
  toast.setExtraPerChar(10);
  toastRunner.equal(toast.getExtraPerChar(), 10, 'setExtraPerChar updates the extra per char');
  toast.setFadeOutDuration(100);
  toastRunner.equal(toast.getFadeOutDuration(), 100, 'setFadeOutDuration updates the fade out');
  toastRunner.throws(() => toast.setBaseDuration(-1), 'Rejects a negative duration');

  section('TinyToastNotify - show', '💬');
  toast.show('Hello');
  toast.show({ title: 'Title', message: 'With title' });
  toast.show({ message: '<b>Bold</b>', html: true });
  toastRunner.equal(toast.getContainer().childNodes.length, 3, 'Appends the toasts');
  toastRunner.throws(() => toast.show(5), 'Rejects an invalid payload');
  toastRunner.throws(
    () => toast.show({ message: 'x', onClick: 'nope' }),
    'Rejects an invalid onClick',
  );

  toast.destroy();
  toastRunner.equal(toast.destroyed, true, 'destroy marks the instance as destroyed');
  toastRunner.throws(() => toast.getContainer(), 'Throws after being destroyed');

  await sleep(5);
  console.log(`\n${color('gray', 'Notification test-suite finished.')}`);

  return t.summary() + toastRunner.summary();
};

export default testNotify;
