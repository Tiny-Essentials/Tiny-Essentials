/**
 * Node.js port of the browser based TinyAnalogClock test environment
 * (`test/html/html/templates/TinyAnalogClock`).
 *
 * A tiny DOM polyfill is installed before the module is imported so the clock
 * can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM } from './_dom.mjs';

installDOM();

const { default: TinyAnalogClock } =
  await import('../../dist/v1/libs/html/templates/TinyAnalogClock.mjs');

/**
 * Node.js port of the browser TinyAnalogClock test environment.
 * @returns {Promise<number>}
 */
const testAnalogClock = async () => {
  const t = new TestRunner('TinyAnalogClock');

  // -------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------
  section('TinyAnalogClock - construction', '🕰️');
  const clock = new TinyAnalogClock({ borderColor: '#ff0055' });
  t.ok(clock.element, 'Creates the root element');
  t.equal(clock.borderColor, '#ff0055', 'Applies the provided options');
  t.equal(clock.size, 800, 'Uses the default size');
  t.equal(clock.showNumbers, true, 'Shows the numbers by default');
  t.equal(clock.showSeconds, true, 'Shows the seconds by default');
  t.equal(clock.destroyed, false, 'Starts alive');

  // -------------------------------------------------------------------
  // Configuration setters
  // -------------------------------------------------------------------
  section('TinyAnalogClock - configuration', '⚙️');
  clock.size = 400;
  t.equal(clock.size, 400, 'Updates the size');
  t.throws(() => (clock.size = -1), 'Rejects an invalid size');

  clock.borderColor = '#000';
  t.equal(clock.borderColor, '#000', 'Updates the border color');
  t.throws(() => (clock.borderColor = ''), 'Rejects an empty border color');

  clock.skinUrl = 'https://example.com/skin.png';
  t.equal(clock.skinUrl, 'https://example.com/skin.png', 'Updates the skin');
  t.throws(() => (clock.skinUrl = 5), 'Rejects an invalid skin');

  clock.showNumbers = false;
  t.equal(clock.showNumbers, false, 'Hides the numbers');
  clock.showSeconds = false;
  t.equal(clock.showSeconds, false, 'Hides the seconds');

  // -------------------------------------------------------------------
  // Destroy
  // -------------------------------------------------------------------
  section('TinyAnalogClock - destroy', '💥');
  clock.destroy();
  t.equal(clock.destroyed, true, 'Marks the instance as destroyed');
  t.throws(() => clock.size, 'Throws after being destroyed');

  console.log(`\n${color('gray', 'TinyAnalogClock test-suite finished.')}`);

  return t.summary();
};

export default testAnalogClock;
