/**
 * Node.js port of the browser based TinyHtml test environment
 * (`test/html/html/TinyHtml/*`).
 *
 * Covers:
 * - TinyHtml static helpers (attribute/property mapping, style parsing)
 * - TinyHtml element creation + traversal
 * - TinyHtml collision helpers (`test/html/html/TinyHtml/collision`)
 *
 * A tiny DOM polyfill is installed before the module is imported.
 *
 * @returns {Promise<number>}
 */

import { TestRunner, section, color } from './_helpers.mjs';
import { installDOM, TinyElement } from './_dom.mjs';

const { document } = installDOM();

// TinyHtml relies on a handful of browser globals during import.
class Comment extends TinyElement {}
class CustomEvent {
  constructor(type, options = {}) {
    this.type = type;
    this.detail = options.detail;
  }
}

class NodeList {}

class HTMLCollection {}

class MutationObserver {
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

globalThis.Comment = Comment;
globalThis.CustomEvent = CustomEvent;
globalThis.MutationObserver = MutationObserver;
globalThis.NodeList = NodeList;
globalThis.HTMLCollection = HTMLCollection;
globalThis.Text = TinyElement;

const { default: TinyHtml } = await import('../../dist/v1/libs/html/TinyHtml.mjs');
const TinyCollision = await import('../../dist/v1/basics/collision.mjs');

/**
 * Node.js port of the browser TinyHtml test environment.
 * @returns {Promise<number>}
 */
const testTinyHtml = async () => {
  const t = new TestRunner('TinyHtml');

  // -------------------------------------------------------------------
  // Attribute / property mapping
  // -------------------------------------------------------------------
  section('TinyHtml - attribute mapping', '🏷️');
  t.equal(TinyHtml.getPropName('class'), 'className', 'getPropName maps class');
  t.equal(TinyHtml.getAttrName('className'), 'class', 'getAttrName maps className');
  t.equal(TinyHtml.getPropName('unknown'), 'unknown', 'getPropName keeps unknown names');
  t.equal(TinyHtml.getAttrName('unknown'), 'unknown', 'getAttrName keeps unknown names');

  // -------------------------------------------------------------------
  // Style parsing
  // -------------------------------------------------------------------
  section('TinyHtml - parseStyle', '🎨');
  t.deepEqual(
    TinyHtml.parseStyle('color: red; width: 10px'),
    { color: 'red', width: '10px' },
    'parseStyle parses inline styles',
  );
  t.deepEqual(TinyHtml.parseStyle(''), {}, 'parseStyle handles empty strings');

  // -------------------------------------------------------------------
  // Element creation
  // -------------------------------------------------------------------
  section('TinyHtml - element creation', '🧱');
  const el = TinyHtml.createFrom('div', { class: 'box', id: 'main' });
  t.ok(el instanceof TinyHtml, 'createFrom returns a TinyHtml instance');
  t.equal(el.get(0).tagName, 'DIV', 'createFrom creates the right tag');
  t.equal(el.get(0).className, 'box', 'createFrom applies the class');
  t.equal(el.get(0).id, 'main', 'createFrom applies the id');
  t.throws(() => TinyHtml.createFrom(5), 'createFrom validates the tag name');

  // -------------------------------------------------------------------
  // Collision helpers
  // -------------------------------------------------------------------
  section('TinyHtml - collision helpers', '💥');
  const a = { top: 0, left: 0, right: 10, bottom: 10, width: 10, height: 10 };
  const b = { top: 5, left: 5, right: 15, bottom: 15, width: 10, height: 10 };
  const c = { top: 100, left: 100, right: 110, bottom: 110, width: 10, height: 10 };
  t.equal(TinyCollision.areElsColliding(a, b), true, 'areElsColliding detects an overlap');
  t.equal(TinyCollision.areElsColliding(a, c), false, 'areElsColliding ignores distant rects');
  t.deepEqual(TinyCollision.getRectCenter(a), { x: 5, y: 5 }, 'getRectCenter returns the center');
  t.ok(TinyCollision.getElsColliding(a, b) !== undefined, 'getElsColliding returns a direction');

  console.log(`\n${color('gray', 'TinyHtml test-suite finished.')}`);

  return t.summary();
};

export default testTinyHtml;
