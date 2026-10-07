import { TestRunner, section, color } from './_helpers.mjs';

/**
 * Node.js port of the browser based TinyTextRangeEditor test environment
 * (`test/html/text/TinyTextRangeEditor`).
 *
 * A minimal `<textarea>` polyfill is installed before importing the module so
 * the editor can be exercised outside of a real browser.
 *
 * @returns {Promise<void>}
 */

// ---------------------------------------------------------------------------
// Minimal DOM polyfill
// ---------------------------------------------------------------------------
class HTMLInputElement {}
class HTMLTextAreaElement {
  constructor(value = '') {
    this.value = value;
    this.selectionStart = 0;
    this.selectionEnd = 0;
    this.scrollTop = 0;
    this.scrollLeft = 0;
  }
  focus() {
    globalThis.document.activeElement = this;
  }
  setSelectionRange(start, end) {
    this.selectionStart = start;
    this.selectionEnd = end;
  }
}

/**
 * (Re)installs the DOM polyfill. Sibling test modules (e.g. the shared DOM
 * helper) may replace these globals, so it is re-applied before every use.
 */
const installDom = () => {
  globalThis.HTMLInputElement = HTMLInputElement;
  globalThis.HTMLTextAreaElement = HTMLTextAreaElement;
  globalThis.document = { activeElement: null };
};

installDom();

const { default: TinyTextRangeEditor } =
  await import('../../dist/v1/libs/text/TinyTextRangeEditor.mjs');

/**
 * @param {string} value - Initial textarea value.
 * @returns {TinyTextRangeEditor}
 */
const createEditor = (value = '') => new TinyTextRangeEditor(new HTMLTextAreaElement(value));

/**
 * Node.js port of the browser TinyTextRangeEditor test environment.
 * @returns {Promise<number>}
 */
const testTextRangeEditor = async () => {
  // Re-apply the polyfill: sibling test modules may have replaced the globals.
  installDom();

  const t = new TestRunner('TinyTextRangeEditor');

  // -------------------------------------------------------------------
  // Construction & configuration
  // -------------------------------------------------------------------
  section('TinyTextRangeEditor - construction', '✂️');
  const editor = createEditor('Hello World');
  t.ok(editor instanceof TinyTextRangeEditor, 'Creates an instance');
  t.equal(editor.getOpenTag(), '[', 'Defaults the open tag');
  t.equal(editor.getCloseTag(), ']', 'Defaults the close tag');
  t.throws(() => new TinyTextRangeEditor({}), 'Rejects non-input elements');

  editor.setOpenTag('<');
  editor.setCloseTag('>');
  t.equal(editor.getOpenTag(), '<', 'setOpenTag updates the open tag');
  t.equal(editor.getCloseTag(), '>', 'setCloseTag updates the close tag');
  t.throws(() => editor.setOpenTag(5), 'setOpenTag validates the type');

  // -------------------------------------------------------------------
  // Selection helpers
  // -------------------------------------------------------------------
  section('TinyTextRangeEditor - selection', '🔎');
  editor.setSelectionRange(0, 5);
  t.equal(editor.getSelectedText(), 'Hello', 'getSelectedText returns the selection');
  editor.selectAll();
  t.equal(editor.getSelectedText(), 'Hello World', 'selectAll selects everything');
  editor.setSelectionRange(6, 11);
  editor.moveCaret(-5);
  t.deepEqual(editor.getSelectionRange(), { start: 1, end: 1 }, 'moveCaret offsets the caret');
  editor.setSelectionRange(4, 4);
  editor.expandSelection(2, 3);
  t.deepEqual(editor.getSelectionRange(), { start: 2, end: 7 }, 'expandSelection grows the range');

  // -------------------------------------------------------------------
  // Mutation helpers
  // -------------------------------------------------------------------
  section('TinyTextRangeEditor - mutation', '✏️');
  const insert = createEditor('Hello World');
  insert.setSelectionRange(5, 5);
  insert.insertText(',');
  t.equal(insert.getValue(), 'Hello, World', 'insertText inserts at the caret');

  const replace = createEditor('Hello World');
  replace.setSelectionRange(0, 5);
  replace.replaceAll(/World/g, () => 'Tiny');
  t.equal(replace.getValue(), 'Hello Tiny', 'replaceAll replaces matches');

  const inSelection = createEditor('a a a');
  inSelection.setSelectionRange(0, 3);
  inSelection.replaceInSelection(/a/g, () => 'b');
  t.equal(inSelection.getValue(), 'b b a', 'replaceInSelection only touches the selection');

  const del = createEditor('Hello World');
  del.setSelectionRange(0, 6);
  del.deleteSelection();
  t.equal(del.getValue(), 'World', 'deleteSelection removes the selection');

  // -------------------------------------------------------------------
  // Tag helpers
  // -------------------------------------------------------------------
  section('TinyTextRangeEditor - tags', '🏷️');
  const tag = createEditor('Hello');
  tag.selectAll();
  tag.wrapWithTag('b');
  t.equal(tag.getValue(), '[b]Hello[/b]', 'wrapWithTag wraps the selection');

  const attrTag = createEditor('Hello');
  attrTag.selectAll();
  attrTag.wrapWithTag('color', { color: 'red' });
  t.equal(
    attrTag.getValue(),
    '[color color="red"]Hello[/color]',
    'wrapWithTag supports attributes',
  );

  const insertTag = createEditor('');
  insertTag.insertTag('b', 'Hi');
  t.equal(insertTag.getValue(), '[b]Hi[/b]', 'insertTag inserts a tag with content');

  const selfClosing = createEditor('');
  selfClosing.insertSelfClosingTag('hr');
  t.equal(selfClosing.getValue(), '[hr]', 'insertSelfClosingTag inserts a tag');

  const toggle = createEditor('Hello');
  toggle.selectAll();
  toggle.toggleTag('b');
  t.equal(toggle.getValue(), '[b]Hello[/b]', 'toggleTag wraps when not wrapped');
  toggle.selectAll();
  toggle.toggleTag('b');
  t.equal(toggle.getValue(), 'Hello', 'toggleTag unwraps when already wrapped');

  // -------------------------------------------------------------------
  // Attribute serialization
  // -------------------------------------------------------------------
  section('TinyTextRangeEditor - attributes', '🧩');
  t.equal(editor._insertAttr({ a: '1', b: '2' }), 'a="1" b="2"', 'Serializes objects');
  t.equal(editor._insertAttr(['disabled', 'autofocus']), 'disabled autofocus', 'Serializes arrays');
  t.equal(editor._insertAttr({ checked: '' }), 'checked', 'Serializes boolean attributes');
  t.throws(() => editor._insertAttr(5), 'Rejects invalid attribute types');

  console.log(`\n${color('gray', 'TinyTextRangeEditor test-suite finished.')}`);

  return t.summary();
};

export default testTextRangeEditor;
