import { TinyTextDiffer } from '/src/v1/libs/text/TinyTextDiffer.mjs';

/** @type {TinyTextDiffer} */
const differ = new TinyTextDiffer(['Hello World', 'Hellow World!']);
window.differ = differ;

/** @type {number[]} */
let selectedIndexes = [];

const historyList = document.getElementById('historyList');
const textInput = document.getElementById('textInput');
const diffOutput = document.getElementById('diffOutput');
const logPanel = document.getElementById('logPanel');

/**
 * @param {string} msg
 * @param {boolean} isError
 * @returns {void}
 */
const log = (msg, isError = false) => {
  const entry = document.createElement('div');
  entry.style.color = isError ? '#ff6b6b' : '#888';
  entry.textContent = `> [${new Date().toLocaleTimeString()}] ${msg}`;
  logPanel.prepend(entry);
};

/**
 * @returns {void}
 */
const renderHistory = () => {
  historyList.innerHTML = '';
  differ.history.forEach((text, index) => {
    const div = document.createElement('div');
    div.className = `history-item ${selectedIndexes.includes(index) ? 'selected' : ''}`;
    div.innerHTML = `<span><strong>v${index}</strong>: ${text.substring(0, 20)}${text.length > 20 ? '...' : ''}</span>`;

    div.onclick = () => {
      toggleSelection(index);
    };

    const delBtn = document.createElement('button');
    delBtn.textContent = '×';
    delBtn.className = 'danger';
    delBtn.style.padding = '2px 8px';
    delBtn.onclick = (e) => {
      e.stopPropagation();
      differ.removeAt(index);
      selectedIndexes = selectedIndexes.filter((i) => i !== index);
      renderHistory();
      log(`Removed index ${index}`);
    };

    div.appendChild(delBtn);
    historyList.appendChild(div);
  });
};

/**
 * @param {number} index
 * @returns {void}
 */
const toggleSelection = (index) => {
  if (selectedIndexes.includes(index)) {
    selectedIndexes = selectedIndexes.filter((i) => i !== index);
  } else {
    if (selectedIndexes.length >= 2) selectedIndexes.shift();
    selectedIndexes.push(index);
  }
  renderHistory();
};

document.getElementById('addBtn').onclick = () => {
  try {
    const val = textInput.value;
    if (!val) return;
    differ.add(val);
    textInput.value = '';
    renderHistory();
    log('New version added.');
  } catch (e) {
    log(e.message, true);
  }
};

document.getElementById('compareBtn').onclick = () => {
  try {
    if (selectedIndexes.length !== 2) {
      throw new Error('Please select exactly two versions to compare.');
    }

    // Sorting to ensure logic flow (old vs new)
    const [idx1, idx2] = [...selectedIndexes].sort((a, b) => a - b);

    /** @type {DiffResult[][]} */
    const results = differ.compare(idx1, idx2);
    renderDiff(results[0]);
    log(`Comparing v${idx1} with v${idx2}`);
  } catch (e) {
    log(e.message, true);
  }
};

/**
 * @param {DiffResult[]} diffArray
 * @returns {void}
 */
const renderDiff = (diffArray) => {
  diffOutput.innerHTML = '';
  diffArray.forEach((part) => {
    const span = document.createElement('span');
    span.className = `diff-${part.type}`;
    span.textContent = part.value;
    diffOutput.appendChild(span);
  });
};

document.getElementById('clearBtn').onclick = () => {
  differ.clear();
  selectedIndexes = [];
  diffOutput.textContent = 'History cleared.';
  renderHistory();
  log('History cleared.');
};

// Initial Render
renderHistory();
