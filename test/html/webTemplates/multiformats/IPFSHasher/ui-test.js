import IPFSHasher from '/src/v1/webTemplates/multiformats/IPFSHasher/14.0/index.mjs';

/** @type {HTMLPreElement} */
const output = document.getElementById('output');
const statusEl = document.getElementById('instance-status');
const versionSelect = document.getElementById('cid-version');
const dataInput = document.getElementById('input-data');
const fileInput = document.getElementById('file-input');

/** @type {IPFSHasher | null} */
let hasher = null;

/**
 * Appends a line to the visual console.
 *
 * @param {string} message - The message to display.
 * @param {'ok' | 'err' | 'info'} [level='info'] - The severity level.
 * @returns {void}
 */
function log(message, level = 'info') {
  const time = new Date().toLocaleTimeString();
  const prefix = { ok: '[OK]', err: '[ERR]', info: '[..]' }[level];
  output.textContent += `\n${time} ${prefix} ${message}`;
  output.scrollTop = output.scrollHeight;
}

/**
 * Sets the instance status text and color.
 *
 * @param {string} text - The status text.
 * @param {'ok' | 'err'} [level='ok'] - The status level.
 * @returns {void}
 */
function setStatus(text, level = 'ok') {
  statusEl.textContent = `Status: ${text}`;
  statusEl.className = `status ${level}`;
}

document.getElementById('btn-construct').addEventListener('click', () => {
  try {
    hasher = new IPFSHasher(versionSelect.value);
    setStatus(`instantiated (${versionSelect.value})`, 'ok');
    log(`IPFSHasher created with version "${versionSelect.value}".`, 'ok');
  } catch (error) {
    hasher = null;
    setStatus('error', 'err');
    log(`Constructor threw: ${error.message}`, 'err');
  }
});

document.getElementById('btn-generate').addEventListener('click', async () => {
  if (!hasher) {
    log('No instance. Click "Instantiate IPFSHasher" first.', 'err');
    return;
  }
  try {
    const bytes = new TextEncoder().encode(dataInput.value);
    log(`Hashing ${bytes.length} byte(s)…`, 'info');
    const result = await hasher.generate(bytes);
    log(`CID: ${result.cidString}`, 'ok');
    log(`Details: ${JSON.stringify(result)}`, 'info');
  } catch (error) {
    log(`generate() threw: ${error.message}`, 'err');
  }
});

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  dataInput.value = new TextDecoder().decode(buffer).slice(0, 5000);
  log(`Loaded "${file.name}" (${file.size} bytes) into the input.`, 'info');
});

document.getElementById('btn-clear').addEventListener('click', () => {
  output.textContent = '';
});
