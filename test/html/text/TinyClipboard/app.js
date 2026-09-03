import { TinyClipboard } from '/src/v1/libs/text/TinyClipboard.mjs';
import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
window.TinyClipboard = TinyClipboard;
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const clipboard = new TinyClipboard();
window.tinyClipboard = clipboard;

// Show support status
document.getElementById('clipboardStatus').textContent = clipboard.isNavigatorClipboardAvailable();
document.getElementById('execCommandStatus').textContent = clipboard.isExecCommandAvailable();

// Functions
window.copyText = async function () {
  const text = document.getElementById('textInput').value;
  try {
    await clipboard.copyText(text);
    alert('Text copied successfully!');
  } catch (e) {
    alert('Error copying text: ' + e.message);
  }
};

window.readText = async function () {
  try {
    const text = await clipboard.readText();
    document.getElementById('readTextOutput').textContent = text;
  } catch (e) {
    document.getElementById('readTextOutput').textContent = 'Error: ' + e.message;
  }
};

window.readAllTexts = async function () {
  try {
    const texts = await clipboard.readAllTexts();
    document.getElementById('readTextOutput').textContent = JSON.stringify(texts, null, 2);
  } catch (e) {
    document.getElementById('readTextOutput').textContent = 'Error: ' + e.message;
  }
};

window.copyBlob = async function () {
  const fileInput = document.getElementById('blobInput');
  const file = fileInput.files[0];
  if (!file) return alert('Please choose a file first!');
  try {
    await clipboard.copyBlob(file);
    alert('Blob copied successfully!');
  } catch (e) {
    alert('Error copying blob: ' + e.message);
  }
};

window.readCustom = async function () {
  try {
    const blob = await clipboard.readCustom('image/');
    document.getElementById('readBlobOutput').textContent = blob
      ? `Blob: ${blob.type}, ${blob.size} bytes`
      : 'Nothing found';
  } catch (e) {
    document.getElementById('readBlobOutput').textContent = 'Error: ' + e.message;
  }
};

window.readAllCustom = async function () {
  try {
    const blobs = await clipboard.readAllCustom('image/');
    const infos = blobs.map((b) => `Blob: ${b.type}, ${b.size} bytes`);
    document.getElementById('readBlobOutput').textContent = `[\n${infos.join('\n')}\n]`;
  } catch (e) {
    document.getElementById('readBlobOutput').textContent = 'Error: ' + e.message;
  }
};

window.readAll = async function () {
  try {
    const all = await clipboard.readAllData();
    const result = all.map((x, i) =>
      typeof x === 'string' ? `Text ${i}: "${x}"` : `Blob ${i}: ${x.type}, ${x.size} bytes`,
    );
    document.getElementById('readAllOutput').textContent = `[\n${result.join('\n')}\n]`;
  } catch (e) {
    document.getElementById('readAllOutput').textContent = 'Error: ' + e.message;
  }
};

window.readAllConsole = async () => {
  const result = await clipboard.readAll();
  const result2 = [];
  console.log(result);
  const promises = [];
  for (const index in result) {
    promises.push(result[index].getType('text/plain').then((data) => (result2[index] = data)));
  }

  await Promise.all(promises);
  console.log(result2);
};

window.readConsole = async () => {
  const result = await clipboard.readIndex(0);
  console.log(result);
  console.log(await result.getType('text/plain'));
};

// Listen for pasted files
TinyHtml.listenForPaste(document, {
  onFilePaste: (item, file) => {
    console.log(item, 'Pasted blob:', file);
    const preview = document.getElementById('pastePreview');
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.title = `${file.name} (${file.type})`;
    preview.appendChild(img);
  },
  onTextPaste: (item, text) => {
    console.log(item, 'Pasted text:', text);
  },
});
