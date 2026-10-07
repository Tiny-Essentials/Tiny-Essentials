/**
 * Node.js port of the browser based TinyDragger test environment
 * (`test/html/html/drag/TinyDragger`).
 *
 * A tiny DOM polyfill is installed before the module is imported so the dragger
 * can be exercised outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM, TinyElement } from './_dom.mjs';

const { document } = installDOM();

// The dragger relies on a handful of browser globals that are not part of the
// minimal DOM helper. They are stubbed here so the module can be imported.
class DOMRect {
  constructor(x = 0, y = 0, width = 0, height = 0) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.top = y;
    this.left = x;
    this.right = x + width;
    this.bottom = y + height;
  }
}

class MouseEvent extends TinyElement {}
class Touch {}
class CustomEvent {
  constructor(type) {
    this.type = type;
  }
}

globalThis.DOMRect = DOMRect;
globalThis.MouseEvent = MouseEvent;
globalThis.Touch = Touch;
globalThis.CustomEvent = CustomEvent;

const { default: TinyDragger } = await import('../../dist/v1/libs/html/drag/TinyDragger.mjs');

/**
 * Creates a fake element with a bounding rect.
 * @param {number} x
 * @param {number} y
 * @param {number} [size]
 */
const makeElement = (x, y, size = 100) => {
  const el = new TinyElement('div');
  el.getBoundingClientRect = () => new DOMRect(x, y, size, size);
  return el;
};

/**
 * Node.js port of the browser TinyDragger test environment.
 * @returns {Promise<number>}
 */
const testDragger = async () => {
  const t = new TestRunner('TinyDragger');

  // -------------------------------------------------------------------
  // Construction & validation
  // -------------------------------------------------------------------
  section('TinyDragger - construction', '🖱️');
  const target = makeElement(0, 0);
  const jail = makeElement(0, 0, 500);
  const dragger = new TinyDragger(target, { jail, multiCollision: true, lockInsideJail: true });
  t.ok(dragger instanceof TinyDragger, 'Creates an instance');
  t.equal(dragger.getTarget(), target, 'Stores the target element');
  t.equal(dragger.getJail(), jail, 'Stores the jail element');
  t.equal(dragger.getLockInsideJail(), true, 'Stores the lockInsideJail option');
  t.equal(dragger.isEnabled(), true, 'Starts enabled');
  t.throws(() => new TinyDragger('nope'), 'Rejects an invalid target');
  t.throws(() => new TinyDragger(target, { jail: 'nope' }), 'Rejects an invalid jail');

  // -------------------------------------------------------------------
  // Configuration
  // -------------------------------------------------------------------
  section('TinyDragger - configuration', '⚙️');
  dragger.setLockInsideJail(false);
  t.equal(dragger.getLockInsideJail(), false, 'setLockInsideJail updates the flag');
  t.throws(() => dragger.setLockInsideJail('nope'), 'setLockInsideJail validates the input');

  dragger.setRevertOnDrop(true);
  t.equal(dragger.getRevertOnDrop(), true, 'setRevertOnDrop updates the flag');
  dragger.setCollisionByMouse(true);
  t.equal(dragger.getCollisionByMouse(), true, 'setCollisionByMouse updates the flag');
  dragger.setDropInJailOnly(true);
  t.equal(dragger.getDropInJailOnly(), true, 'setDropInJailOnly updates the flag');
  dragger.setDefaultZIndex(500);
  t.equal(dragger.getDefaultZIndex(), 500, 'setDefaultZIndex updates the z-index');
  dragger.setMirrorEnabled(false);
  t.equal(dragger.isMirrorEnabled(), false, 'setMirrorEnabled updates the flag');

  // -------------------------------------------------------------------
  // Collidables
  // -------------------------------------------------------------------
  section('TinyDragger - collidables', '🎯');
  const block = makeElement(10, 10, 50);
  dragger.addCollidable(block);
  t.equal(dragger.getCollidables().includes(block), true, 'addCollidable registers an element');
  t.throws(() => dragger.addCollidable('nope'), 'addCollidable validates the element');
  t.equal(dragger.getCollidedElement(20, 20), block, 'getCollidedElement finds a hit');
  t.equal(dragger.getCollidedElement(500, 500), null, 'getCollidedElement returns null on miss');
  t.equal(dragger.getAllCollidedElements(20, 20).length, 1, 'getAllCollidedElements returns hits');
  dragger.removeCollidable(block);
  t.equal(dragger.getCollidables().includes(block), false, 'removeCollidable removes an element');

  // -------------------------------------------------------------------
  // Vibration
  // -------------------------------------------------------------------
  section('TinyDragger - vibration', '📳');
  dragger.setVibrationPattern({ startPattern: [10], movePattern: [5] });
  t.deepEqual(dragger.getStartVibration(), [10], 'setVibrationPattern stores the start pattern');
  t.deepEqual(dragger.getMoveVibration(), [5], 'setVibrationPattern stores the move pattern');
  t.throws(() => dragger.setVibrationPattern({ startPattern: 'nope' }), 'Validates the patterns');
  dragger.disableVibration();
  t.deepEqual(
    dragger.getVibrations(),
    {
      start: false,
      end: false,
      collide: false,
      move: false,
    },
    'disableVibration resets the patterns',
  );

  // -------------------------------------------------------------------
  // Enable / disable / destroy
  // -------------------------------------------------------------------
  section('TinyDragger - lifecycle', '🔄');
  dragger.disable();
  t.equal(dragger.isEnabled(), false, 'disable() disables the dragger');
  dragger.enable();
  t.equal(dragger.isEnabled(), true, 'enable() enables the dragger');

  dragger.destroy();
  t.throws(() => dragger.isEnabled(), 'Throws after being destroyed');

  console.log(`\n${color('gray', 'TinyDragger test-suite finished.')}`);

  return t.summary();
};

export default testDragger;
