/**
 * Node.js port of the browser based TinyLoadingScreen test environment
 * (`test/html/html/templates/TinyLoadingScreen`).
 *
 * A tiny DOM polyfill is installed before the module is imported so the loading
 * screen can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color, sleep } from './_helpers.mjs';
import { installDOM } from './_dom.mjs';

let document = installDOM().document;

const { default: TinyLoadingScreen } =
  await import('../../dist/v1/libs/html/templates/TinyLoadingScreen.mjs');

/**
 * Node.js port of the browser TinyLoadingScreen test environment.
 * @returns {Promise<number>}
 */
const testLoadingScreen = async () => {
  // Re-install the DOM: sibling test modules may have replaced the globals.
  document = installDOM().document;

  const t = new TestRunner('TinyLoadingScreen');

  // -------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------
  section('TinyLoadingScreen - construction', '⏳');
  const loading = new TinyLoadingScreen(document.body);
  t.equal(loading.container, document.body, 'Stores the container');
  t.equal(loading.status, 'none', 'Starts idle');
  t.equal(loading.visible, false, 'Starts hidden');
  t.throws(() => new TinyLoadingScreen('nope'), 'Rejects invalid containers');

  // -------------------------------------------------------------------
  // Options
  // -------------------------------------------------------------------
  section('TinyLoadingScreen - options', '⚙️');
  loading.options = { zIndex: 1234 };
  t.equal(loading.options.zIndex, 1234, 'Stores the z-index');
  t.equal(loading.options.fadeIn, null, 'Disables the fadeIn animation by default');
  t.throws(() => (loading.options = { zIndex: 1.5 }), 'Rejects a non-integer z-index');
  t.throws(() => (loading.options = { fadeIn: -1 }), 'Rejects a negative fadeIn');
  t.throws(() => (loading.options = null), 'Rejects a non-object options value');

  // -------------------------------------------------------------------
  // Start / update / stop
  // -------------------------------------------------------------------
  section('TinyLoadingScreen - lifecycle', '🔄');
  const changes = [];
  loading.onChange = (status) => changes.push(status);
  t.equal(loading.start('Loading...'), true, 'start() creates the overlay');
  t.equal(loading.visible, true, 'Overlay is visible');
  t.equal(loading.status, 'active', 'Reaches the active state without fadeIn');
  t.equal(loading.message, 'Loading...', 'Stores the message');
  t.equal(loading.start('Again'), false, 'start() reuses the overlay');
  t.equal(loading.update('Updated'), true, 'update() changes the message');
  t.equal(loading.message, 'Updated', 'update() stores the new message');
  t.ok(changes.includes('fadeIn'), 'Emits status changes');

  t.equal(loading.stop(), true, 'stop() removes the overlay');
  t.equal(loading.visible, false, 'Removes the overlay synchronously without fadeOut');
  t.equal(loading.stop(), false, 'stop() is a no-op when idle');

  // -------------------------------------------------------------------
  // allowHtmlText
  // -------------------------------------------------------------------
  section('TinyLoadingScreen - allowHtmlText', '📝');
  loading.allowHtmlText = true;
  t.equal(loading.allowHtmlText, true, 'Allows enabling HTML messages');
  t.throws(() => (loading.allowHtmlText = 'nope'), 'Validates the allowHtmlText type');
  loading.defaultMessage = 'Default';
  t.equal(loading.defaultMessage, 'Default', 'Stores the default message');
  t.throws(() => (loading.defaultMessage = 5), 'Validates the default message type');

  await sleep(5);
  console.log(`\n${color('gray', 'TinyLoadingScreen test-suite finished.')}`);

  return t.summary();
};

export default testLoadingScreen;
