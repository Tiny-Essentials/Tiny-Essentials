import { processPsdSolidFiltersFromFile } from '/src/v1/webTemplates/ag-psd/31.0/ProcessSolidFilters/FileInput.mjs';

/**
 * @typedef {Object} FolderOptions
 * @property {'inherit'|'exclude'|'custom'} [subfolders] - How nested folders are handled.
 * @property {FilterConfig|FilterConfig[]} [childFilter] - Nested filters used when 'subfolders' is 'custom'.
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} id - Filter identifier.
 * @property {string} color - Color in HEX format.
 * @property {string|string[]} [startsWith] - Prefix criterion.
 * @property {string|string[]} [endsWith] - Suffix criterion.
 * @property {string|string[]} [contains] - Substring criterion.
 * @property {string|string[]} [equals] - Equality criterion.
 * @property {RegExp|RegExp[]} [matches] - Regular expression criterion.
 * @property {(layerName: string) => boolean} [test] - Custom predicate criterion.
 * @property {boolean|FolderOptions} [folder] - When enabled, the filter also claims folders.
 */

/**
 * @typedef {Object} MatchTypeOption
 * @property {string} value - The criterion key expected by the filter engine.
 * @property {string} label - The human readable label shown in the UI.
 * @property {string} placeholder - The placeholder shown in the value input.
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} id - Filter identifier.
 * @property {string} color - Color in HEX format.
 * @property {string|string[]} [startsWith] - Prefix criterion.
 * @property {string|string[]} [endsWith] - Suffix criterion.
 * @property {string|string[]} [contains] - Substring criterion.
 * @property {string|string[]} [equals] - Equality criterion.
 * @property {RegExp|RegExp[]} [matches] - Regular expression criterion.
 * @property {(layerName: string) => boolean} [test] - Custom predicate criterion.
 */

/** @type {MatchTypeOption[]} */
const MATCH_TYPES = [
  { value: 'startsWith', label: 'Starts With', placeholder: 'layer-, art_' },
  { value: 'endsWith', label: 'Ends With', placeholder: '-shadow, -line' },
  { value: 'contains', label: 'Contains', placeholder: 'lineart, sketch' },
  { value: 'equals', label: 'Equals', placeholder: 'background' },
  { value: 'matches', label: 'RegExp', placeholder: '/^bg_\\d+$/i' },
  { value: 'test', label: 'Custom Function', placeholder: '(name) => name.length > 10' },
];

const COLOR_PALETTE = [
  '#e6194b',
  '#3cb44b',
  '#4363d8',
  '#f58231',
  '#911eb4',
  '#42d4f4',
  '#f032e6',
  '#bfef45',
];

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

let filterCounter = 0;
let colorCursor = 0;

/**
 * Returns the next color of the palette in a cyclic fashion.
 * @returns {string} A HEX color string.
 */
function nextColor() {
  const color = COLOR_PALETTE[colorCursor % COLOR_PALETTE.length];
  colorCursor += 1;
  return color;
}

/**
 * Logs messages to the visual console.
 * @param {string} message - The message to display.
 * @param {boolean} [isError=false] - Whether the message represents an error.
 * @returns {void}
 */
function logConsole(message, isError = false) {
  const line = document.createElement('div');
  line.textContent = `> ${new Date().toLocaleTimeString()}: ${message}`;
  if (isError) {
    line.className = 'error';
  }
  DOM.console.appendChild(line);
  DOM.console.scrollTop = DOM.console.scrollHeight;
}

/**
 * Compiles a raw string into a RegExp, supporting the /pattern/flags syntax.
 * @param {string} input - The raw regular expression source.
 * @returns {RegExp} The compiled regular expression.
 * @throws {SyntaxError} If the pattern is not a valid regular expression.
 */
function parseRegExp(input) {
  const match = input.match(/^\/(.*)\/([a-z]*)$/i);
  return match ? new RegExp(match[1], match[2]) : new RegExp(input);
}

/**
 * Compiles a raw string into a predicate function.
 * @param {string} input - A string that evaluates to a function.
 * @returns {(layerName: string) => boolean} The compiled predicate.
 * @throws {TypeError} If the expression does not evaluate to a function.
 */
function parseFunction(input) {
  // The QA interface intentionally evaluates developer input to test custom predicates.
  const factory = new Function(`"use strict"; return (${input});`);
  const fn = factory();
  if (typeof fn !== 'function') {
    throw new TypeError('The custom criterion must evaluate to a function.');
  }
  return fn;
}

/**
 * Converts a raw criterion value into the type expected by the filter engine.
 * @param {string} type - The criterion key (e.g. 'startsWith').
 * @param {string} rawValue - The raw value typed by the user.
 * @returns {string|string[]|RegExp|((layerName: string) => boolean)} The parsed value.
 * @throws {SyntaxError|TypeError} If the value cannot be parsed for the given type.
 */
function parseCriterionValue(type, rawValue) {
  const trimmed = rawValue.trim();
  if (type === 'matches') {
    return parseRegExp(trimmed);
  }
  if (type === 'test') {
    return parseFunction(trimmed);
  }
  const parts = trimmed
    .split(',')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  return parts.length === 1 ? parts[0] : parts;
}

/**
 * Creates a single criterion row (type selector + value input + remove button).
 * @returns {HTMLDivElement} The assembled criterion row element.
 */
function createCriterionRow() {
  const row = document.createElement('div');
  row.className = 'criterion-row';

  const typeSelect = document.createElement('select');
  typeSelect.className = 'criterion-type';
  for (const option of MATCH_TYPES) {
    const opt = document.createElement('option');
    opt.value = option.value;
    opt.textContent = option.label;
    typeSelect.appendChild(opt);
  }

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.className = 'criterion-value';
  valueInput.placeholder = MATCH_TYPES[0].placeholder;

  typeSelect.addEventListener('change', () => {
    const selected = MATCH_TYPES.find((item) => item.value === typeSelect.value);
    valueInput.placeholder = selected ? selected.placeholder : '';
  });

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.className = 'btn-danger btn-small';
  removeBtn.addEventListener('click', () => row.remove());

  row.append(typeSelect, valueInput, removeBtn);
  return row;
}

/**
 * Creates a controller that appends filter cards into a container.
 * @param {HTMLElement} container - The element that holds the filter cards.
 * @returns {{ add: () => void }} The list controller.
 */
function createFilterList(container) {
  return {
    add() {
      filterCounter += 1;
      container.appendChild(createFilterCard(filterCounter));
    },
  };
}

/**
 * Builds the folder options block of a filter card.
 * @returns {HTMLDivElement} The assembled folder options element.
 */
function createFolderOptions() {
  const wrapper = document.createElement('div');
  wrapper.className = 'folder-options';

  const toggle = document.createElement('label');
  toggle.className = 'folder-toggle';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'folder-enabled';
  const toggleText = document.createElement('span');
  toggleText.textContent = 'Apply to folders';
  toggle.append(checkbox, toggleText);

  const settings = document.createElement('div');
  settings.className = 'folder-settings';
  settings.hidden = true;

  const strategy = document.createElement('select');
  strategy.className = 'folder-subfolders';
  const strategies = [
    { value: 'inherit', label: 'Inherit (all subfolders)' },
    { value: 'exclude', label: 'Exclude subfolders' },
    { value: 'custom', label: 'Custom child filter' },
  ];
  for (const item of strategies) {
    const option = document.createElement('option');
    option.value = item.value;
    option.textContent = item.label;
    strategy.appendChild(option);
  }

  const childWrapper = document.createElement('div');
  childWrapper.className = 'child-filters-wrapper';
  childWrapper.hidden = true;

  const childContainer = document.createElement('div');
  childContainer.className = 'child-filters';

  const childList = createFilterList(childContainer);
  const addChildBtn = document.createElement('button');
  addChildBtn.type = 'button';
  addChildBtn.className = 'btn-ghost btn-small';
  addChildBtn.textContent = '+ Add Child Filter';
  addChildBtn.addEventListener('click', () => childList.add());

  childWrapper.append(childContainer, addChildBtn);

  checkbox.addEventListener('change', () => {
    settings.hidden = !checkbox.checked;
  });
  strategy.addEventListener('change', () => {
    childWrapper.hidden = strategy.value !== 'custom';
    if (strategy.value === 'custom' && childContainer.children.length === 0) {
      childList.add();
    }
  });

  settings.append(strategy, childWrapper);
  wrapper.append(toggle, settings);
  return wrapper;
}

/**
 * Creates a filter card with an ID, a color, a dynamic list of criteria and folder options.
 * @param {number} index - The index used to build the default identifier.
 * @returns {HTMLDivElement} The assembled filter card element.
 */
function createFilterCard(index) {
  const card = document.createElement('div');
  card.className = 'filter-card';

  const header = document.createElement('div');
  header.className = 'filter-header';

  const idInput = document.createElement('input');
  idInput.type = 'text';
  idInput.className = 'filter-id';
  idInput.placeholder = `ID (e.g. artist${index})`;
  idInput.value = `artist${index}`;

  const colorInput = document.createElement('input');
  colorInput.type = 'color';
  colorInput.className = 'filter-color';
  colorInput.value = nextColor();

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.textContent = '✕';
  removeBtn.className = 'btn-danger btn-small';
  removeBtn.addEventListener('click', () => card.remove());

  header.append(idInput, colorInput, removeBtn);

  const criteriaList = document.createElement('div');
  criteriaList.className = 'criteria-list';
  criteriaList.appendChild(createCriterionRow());

  const addCriterionBtn = document.createElement('button');
  addCriterionBtn.type = 'button';
  addCriterionBtn.className = 'btn-ghost';
  addCriterionBtn.textContent = '+ Add Criterion (AND)';
  addCriterionBtn.addEventListener('click', () => {
    criteriaList.appendChild(createCriterionRow());
  });

  card.append(header, criteriaList, addCriterionBtn, createFolderOptions());
  return card;
}

/**
 * Adds a new filter card to the container.
 * @returns {void}
 */
function addFilterCard() {
  filterCounter += 1;
  DOM.filterContainer.appendChild(createFilterCard(filterCounter));
}

/**
 * Reads a filter card and converts it into a FilterConfig object.
 * @param {HTMLDivElement} card - The filter card element.
 * @param {number} index - The index used as a fallback identifier.
 * @returns {FilterConfig|null} The filter configuration, or null when the card has no criteria.
 */
function buildFilterConfig(card, index) {
  const idInput = card.querySelector(':scope > .filter-header > .filter-id');
  const colorInput = card.querySelector(':scope > .filter-header > .filter-color');
  const filter = {
    id: idInput.value.trim() || `filter-${index}`,
    color: colorInput.value,
  };
  const target = /** @type {Record<string, unknown>} */ (filter);
  let criteriaCount = 0;

  const criteriaList = card.querySelector(':scope > .criteria-list');
  for (const row of criteriaList.querySelectorAll(':scope > .criterion-row')) {
    const type = row.querySelector('.criterion-type').value;
    const rawValue = row.querySelector('.criterion-value').value;
    if (rawValue.trim() === '') {
      continue;
    }
    target[type] = parseCriterionValue(type, rawValue);
    criteriaCount += 1;
  }

  if (criteriaCount === 0) {
    return null;
  }

  const folderOptions = card.querySelector(':scope > .folder-options');
  const checkbox = folderOptions.querySelector(':scope > .folder-toggle > .folder-enabled');
  if (checkbox.checked) {
    const strategy = folderOptions.querySelector(
      ':scope > .folder-settings > .folder-subfolders',
    ).value;
    if (strategy === 'custom') {
      const childContainer = folderOptions.querySelector(
        ':scope > .folder-settings > .child-filters-wrapper > .child-filters',
      );
      target.folder = { subfolders: 'custom', childFilter: buildFilterList(childContainer) };
    } else {
      target.folder = { subfolders: strategy };
    }
  }

  return /** @type {FilterConfig} */ (filter);
}

/**
 * Reads every filter card inside a container.
 * @param {HTMLElement} container - The element that holds the filter cards.
 * @returns {FilterConfig[]} The list of parsed filter configurations.
 */
function buildFilterList(container) {
  const cards = container.querySelectorAll(':scope > .filter-card');
  return Array.from(cards)
    .map((card, index) => buildFilterConfig(/** @type {HTMLDivElement} */ (card), index + 1))
    .filter((filter) => filter !== null);
}

// Initialization: Add one default filter row
const filterList = createFilterList(DOM.filterContainer);
DOM.addFilterBtn.addEventListener('click', () => filterList.add());
filterList.add();

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
  let filters;
  try {
    filters = buildFilterList(DOM.filterContainer);
  } catch (err) {
    logConsole(`Configuration Error: ${err.message}`, true);
    return;
  }

  const defaultConfig = { color: DOM.defaultColor.value };

  logConsole('Starting PSD processing...');
  console.log('Filters:', filters);

  try {
    const startTime = performance.now();

    // 2. Call the module
    const result = await processPsdSolidFiltersFromFile(DOM.fileInput, filters, defaultConfig);
    const duration = ((performance.now() - startTime) / 1000).toFixed(2);
    logConsole(`Success! Processed in ${duration}s`);

    // 3. Display Stats
    DOM.stats.textContent = JSON.stringify(result.stats, null, 2);

    // 3.1. Layer breakdown (one row per processed layer)
    if (result.vectorData.length > 0) {
      console.table(
        result.vectorData.map((layer) => ({
          Layer: layer.name,
          'Filter ID': layer.filterId,
          Opacity: `${Math.round(layer.opacity * 100)}%`,
          Position: `${layer.bounds.x}, ${layer.bounds.y}`,
          Size: `${layer.bounds.width}×${layer.bounds.height}`,
        })),
      );
    } else {
      console.warn('⚠️ No layers were processed. Is the PSD empty or fully hidden?');
    }

    // 3.2. Statistics breakdown (one row per filter, plus unclaimed/unfiltered)
    const totalPixels = Object.values(result.stats).reduce((sum, count) => sum + count, 0);
    const emptyFilters = [];

    console.table(
      Object.entries(result.stats).map(([id, count]) => {
        if (count === 0) emptyFilters.push(id);

        return {
          Filter: id,
          Pixels: count.toLocaleString('en-US'),
          Coverage: totalPixels > 0 ? `${((count / totalPixels) * 100).toFixed(2)}%` : '0.00%',
          Status: count === 0 ? '⚠️ Empty' : '✅ OK',
        };
      }),
    );

    if (emptyFilters.length > 0) {
      console.warn(`⚠️ ${emptyFilters.length} filter(s) matched no pixels:`, emptyFilters);
    }

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
