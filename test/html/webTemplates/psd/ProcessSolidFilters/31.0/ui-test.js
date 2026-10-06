import { processPsdSolidFiltersFromFile } from '/src/v1/webTemplates/psd/ProcessSolidFilters/31.0/FileInput.mjs';

/**
 * @typedef {Object} UIFilterRow
 * @property {HTMLInputElement} idInput
 * @property {HTMLInputElement} colorInput
 * @property {HTMLInputElement} prefixInput
 * @property {HTMLButtonElement} removeBtn
 */

const DOM = {
  fileInput: document.getElementById('psd-file'),
  filterContainer: document.getElementById('filter-container'),
  addFilterBtn: document.getElementById('add-filter-btn'),
  defaultColor: document.getElementById('default-color'),
  runTestBtn: document.getElementById('run-test-btn'),
  console: document.getElementById('console-output'),
  stats: document.getElementById('stats-output'),
  imageGrid: document.getElementById('image-results'),
};

/**
 * Logs messages to the visual console.
 * @param {string} message
 * @param {boolean} isError
 */
function logConsole(message, isError = false) {
  const span = document.createElement('div');
  span.textContent = `> ${new Date().toLocaleTimeString()}: ${message}`;
  if (isError) span.className = 'error';
  DOM.console.appendChild(span);
  DOM.console.scrollTop = DOM.console.scrollHeight;
}

/**
 * Creates a new filter row in the UI.
 * @returns {UIFilterRow}
 */
function createFilterRow() {
  const div = document.createElement('div');
  div.className = 'filter-row';

  const idInput = document.createElement('input');
  idInput.placeholder = 'ID (e.g. artist1)';
  idInput.type = 'text';

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.value = '#ff0000';

  const prefixInput = document.createElement('input');
  prefixInput.placeholder = 'Prefix (e.g. layer-)';
  prefixInput.type = 'text';

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✕';
  removeBtn.className = 'btn-danger';
  removeBtn.onclick = () => div.remove();

  div.append(idInput, colorInput, prefixInput, removeBtn);
  DOM.filterContainer.appendChild(div);

  return { idInput, colorInput, prefixInput, removeBtn };
}

// Initialization: Add one default filter row
DOM.addFilterBtn.addEventListener('click', createFilterRow);
createFilterRow();

// Main Execution Logic
DOM.runTestBtn.addEventListener('click', async () => {
  // Reset UI
  DOM.console.innerHTML = '';
  DOM.stats.textContent = '{}';
  DOM.imageGrid.innerHTML = '';

  const file = DOM.fileInput.files[0];
  if (!file) {
    logConsole('Error: No file selected.', true);
    return;
  }

  // 1. Collect Filter Configs
  const filters = [];
  const rows = DOM.filterContainer.querySelectorAll('.filter-row');

  for (const row of rows) {
    const idInput = row.querySelector('input[placeholder*="ID"]');
    const colorInput = row.querySelector('input[type="color"]');
    const prefixInput = row.querySelector('input[placeholder*="Prefix"]');

    // Convert hex color to #RRGGBB for the input
    const hexColor = rgbToHex(colorInput.value);

    filters.push({
      id: idInput.value || `filter-${filters.length}`,
      color: hexColor,
      startsWith: prefixInput.value || '',
    });
  }

  const defaultConfig = {
    color: rgbToHex(DOM.defaultColor.value),
  };

  logConsole('Starting PSD processing...');

  try {
    const startTime = performance.now();

    // 2. Call the module
    const result = await processPsdSolidFiltersFromFile(DOM.fileInput, filters, defaultConfig);

    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    logConsole(`Success! Processed in ${duration}s`);

    // 3. Display Stats
    DOM.stats.textContent = JSON.stringify(result.stats, null, 2);
    console.log(result.stats, result.vectorData);

    // 4. Display Images
    for (const item of result.separatedImages) {
      const url = URL.createObjectURL(item.buffer);
      const card = document.createElement('div');
      card.className = 'image-card';

      const img = document.createElement('img');
      img.src = url;

      const label = document.createElement('p');
      label.textContent = `ID: ${item.id}`;

      card.append(img, label);
      DOM.imageGrid.appendChild(card);
    }

    // Also show the full image
    const fullUrl = URL.createObjectURL(result.fullImageBuffer);
    const fullCard = document.createElement('div');
    fullCard.className = 'image-card';
    const fullImg = document.createElement('img');
    fullImg.src = fullUrl;
    const fullLabel = document.createElement('p');
    fullLabel.innerHTML = `<strong>Full Composite</strong>`;
    fullCard.append(fullImg, fullLabel);
    DOM.imageGrid.prepend(fullCard);
  } catch (err) {
    logConsole(`Critical Error: ${err.message}`, true);
    console.error(err);
  }
});

/**
 * Helper to ensure color format is correct for the logic
 * @param {string} rgb
 * @returns {string}
 */
function rgbToHex(rgb) {
  // This is a simplified helper for the UI color picker
  // The browser's input type="color" already returns #rrggbb
  return rgb.startsWith('#') ? rgb : `#${rgb}`;
}
