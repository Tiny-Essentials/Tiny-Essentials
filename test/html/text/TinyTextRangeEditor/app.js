import { TinyTextRangeEditor } from '/src/v1/libs/text/TinyTextRangeEditor.mjs';
window.TinyTextRangeEditor = TinyTextRangeEditor;

const textarea = document.getElementById('editor');
const output = document.getElementById('output');
window.editor = new TinyTextRangeEditor(textarea);

// Delay helper
const delay = (ms) => new Promise((res) => setTimeout(res, ms));
window.delay = delay;

window.showSelectedText = () => {
  const text = editor.getSelectedText();
  output.textContent = 'Selected: "' + text + '"';
};

window.replaceAll = () => {
  editor.replaceAll(/test/gi, () => 'TEST');
  output.textContent = 'All occurrences of "test" replaced with "TEST".';
};

window.replaceTest = () => {
  editor.replaceInSelection(/test/gi, () => 'TEST');
  output.textContent = 'Expanded Selection of "test" replaced with "TEST".';
};

// Expand selection with delay
document.getElementById('expandSelection').addEventListener('click', async () => {
  await delay(3000);
  editor.expandSelection(3, 3);
  const text = editor.getSelectedText();
  output.textContent = 'Expanded Selection: "' + text + '"';
});

document.getElementById('expandInverseSelection').addEventListener('click', async () => {
  await delay(3000);
  editor.expandSelection(-3, 0);
  const text = editor.getSelectedText();
  output.textContent = 'Expanded Selection: "' + text + '"';
});

// Move caret left
document.getElementById('moveCaretLeft').addEventListener('click', async () => {
  await delay(3000);
  editor.moveCaret(-1);
  const text = editor.getSelectedText();
  output.textContent = 'After Caret Left: "' + text + '"';
});

// Move caret right
document.getElementById('moveCaretRight').addEventListener('click', async () => {
  await delay(3000);
  editor.moveCaret(1);
  const text = editor.getSelectedText();
  output.textContent = 'After Caret Right: "' + text + '"';
});

// Select all
document.getElementById('selectAll').addEventListener('click', async () => {
  await delay(3000);
  editor.selectAll();
  const text = editor.getSelectedText();
  output.textContent = 'All selected: "' + text + '"';
});

window.insertEmojiTagAuto = () => {
  editor.insertText('🥲', {
    autoSpacing: true,
  });
  output.textContent = 'Inserted [emoji]🥲[/emoji] with auto-spacing.';
};
