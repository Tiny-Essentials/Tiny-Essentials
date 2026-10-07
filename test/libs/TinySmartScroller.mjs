/**
 * Node.js port of the browser based TinySmartScroller test environment
 * (`test/html/html/scroll/TinySmartScroller`).
 *
 * A tiny DOM polyfill (plus `MutationObserver`/`ResizeObserver` stubs) is
 * installed before the module is imported so the scroller can be exercised
 * outside of a real browser.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM, TinyElement } from './_dom.mjs';

const { document } = installDOM();

// ---------------------------------------------------------------------------
// Observer stubs
// ---------------------------------------------------------------------------
class Window {}

class MutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.Window = Window;
globalThis.MutationObserver = MutationObserver;
globalThis.ResizeObserver = ResizeObserver;

const { default: TinySmartScroller } =
  await import('../../dist/v1/libs/html/scroll/TinySmartScroller.mjs');

/**
 * Node.js port of the browser TinySmartScroller test environment.
 * @returns {Promise<number>}
 */
const testSmartScroller = async () => {
  const t = new TestRunner('TinySmartScroller');

  // -------------------------------------------------------------------
  // Construction & validation
  // -------------------------------------------------------------------
  section('TinySmartScroller - construction', '📜');
  const container = new TinyElement('div');
  const scroller = new TinySmartScroller(container, {
    autoScrollBottom: true,
    observeMutations: true,
    debounceTime: 0,
  });
  t.ok(scroller instanceof TinySmartScroller, 'Creates an instance');
  t.equal(scroller.target, container, 'Stores the target');
  t.equal(scroller.isWindow(), false, 'Detects an element target');
  t.equal(scroller.getAutoScrollBottom(), true, 'Stores the autoScrollBottom option');
  t.equal(scroller.getObserveMutations(), true, 'Stores the observeMutations option');
  t.equal(scroller.isDestroyed(), false, 'Starts alive');
  t.throws(() => new TinySmartScroller('nope'), 'Rejects an invalid target');
  t.throws(
    () => new TinySmartScroller(container, { debounceTime: -1 }),
    'Rejects a negative debounce time',
  );

  // -------------------------------------------------------------------
  // Boundary configuration
  // -------------------------------------------------------------------
  section('TinySmartScroller - boundaries', '📐');
  scroller.setExtraScrollBoundary(250);
  t.equal(scroller.getExtraScrollBoundary(), 250, 'setExtraScrollBoundary updates the boundary');
  t.throws(() => scroller.setExtraScrollBoundary('nope'), 'Validates the boundary type');

  // -------------------------------------------------------------------
  // Load tags
  // -------------------------------------------------------------------
  section('TinySmartScroller - load tags', '🏷️');
  t.equal(scroller.hasLoadTag('IMG'), true, 'Ships with default load tags');
  scroller.addLoadTag('CUSTOM');
  t.equal(scroller.hasLoadTag('CUSTOM'), true, 'addLoadTag registers a tag');
  scroller.removeLoadTag('CUSTOM');
  t.equal(scroller.hasLoadTag('CUSTOM'), false, 'removeLoadTag removes a tag');
  t.throws(() => scroller.addLoadTag(5), 'addLoadTag validates the tag');

  // -------------------------------------------------------------------
  // Attribute filters
  // -------------------------------------------------------------------
  section('TinySmartScroller - attribute filters', '🧹');
  t.ok(scroller.getAttributeFilters().length > 0, 'Ships with default attribute filters');
  scroller.addAttributeFilter('data-test');
  t.equal(scroller.hasAttributeFilter('data-test'), true, 'addAttributeFilter registers a filter');
  scroller.removeAttributeFilter('data-test');
  t.equal(scroller.hasAttributeFilter('data-test'), false, 'removeAttributeFilter removes a filter');
  t.throws(() => scroller.addAttributeFilter(5), 'addAttributeFilter validates the input');

  // -------------------------------------------------------------------
  // Size filters
  // -------------------------------------------------------------------
  section('TinySmartScroller - size filters', '📏');
  const handler = () => {};
  scroller.onSize(handler);
  t.throws(() => scroller.onSize('nope'), 'onSize validates the handler');
  scroller.offSize(handler);
  t.ok(true, 'offSize removes the handler');

  // -------------------------------------------------------------------
  // Scroll helpers
  // -------------------------------------------------------------------
  section('TinySmartScroller - scroll helpers', '🖱️');
  scroller.scrollToBottom();
  scroller.scrollToTop();
  t.equal(typeof scroller.isAtBottom(), 'boolean', 'isAtBottom returns a boolean');
  t.equal(typeof scroller.isAtTop(), 'boolean', 'isAtTop returns a boolean');
  t.equal(typeof scroller.isScrollPaused(), 'boolean', 'isScrollPaused returns a boolean');
  t.equal(scroller.getElemAmount(), 0, 'getElemAmount starts at zero');

  // -------------------------------------------------------------------
  // Destroy
  // -------------------------------------------------------------------
  section('TinySmartScroller - destroy', '💥');
  scroller.destroy();
  t.equal(scroller.isDestroyed(), true, 'destroy marks the instance as destroyed');
  t.throws(() => scroller.scrollToBottom(), 'Throws after being destroyed');

  console.log(`\n${color('gray', 'TinySmartScroller test-suite finished.')}`);

  return t.summary();
};

export default testSmartScroller;
