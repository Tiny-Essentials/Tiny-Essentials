/**
 * @file Form tone matrix for the Bootstrap 5.3 playground.
 *
 * Covers the three controls that accept a tone class:
 *
 *   .form-select-{tone}
 *   .form-check-{tone}   (checkbox, radio and switch)
 *   .form-range-{tone}
 *
 * The `validation` family wraps the same controls in a `.was-validated` form,
 * so the `--bs-form-valid-*` / `--bs-form-invalid-*` bridge is exercised too.
 */

import { createMatrix, el } from '../color-matrix.js';

/**
 * Tones that ship a `.form-*-{tone}` class. `contrast` and `contrast-inverse`
 * are button-only, so they are filtered out before rendering.
 *
 * @type {ReadonlySet<string>}
 */
const SUPPORTED = new Set([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
  'pink',
]);

/** @type {number} */
let uid = 0;

/**
 * Returns a document-unique id.
 * @param {string} prefix
 * @returns {string}
 */
const nextId = (prefix) => {
  uid += 1;

  return `pg-form-${prefix}-${uid}`;
};

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'control',
    title: 'Text',
    description: 'form-control form-control-{tone}',
    toneClass: (tone) => `form-control form-control-${tone}`,
  },
  {
    id: 'select',
    title: 'Select',
    description: 'form-select form-select-{tone}',
    toneClass: (tone) => `form-select form-select-${tone}`,
  },
  {
    id: 'checkbox',
    title: 'Checkbox',
    description: 'form-check form-check-{tone}',
    toneClass: (tone) => `form-check form-check-${tone}`,
  },
  {
    id: 'switch',
    title: 'Switch',
    description: 'form-check form-switch form-check-{tone}',
    toneClass: (tone) => `form-check form-switch form-check-${tone}`,
  },
  {
    id: 'radio',
    title: 'Radio',
    description: 'form-check form-check-{tone} with a radio input',
    toneClass: (tone) => `form-check form-check-${tone}`,
  },
  {
    id: 'range',
    title: 'Range',
    description: 'form-range form-range-{tone}',
    toneClass: (tone) => `form-range form-range-${tone}`,
  },
  {
    id: 'file',
    title: 'File',
    description: 'form-control form-file-{tone}',
    toneClass: (tone) => `form-control form-file-${tone}`,
  },
  {
    id: 'color',
    title: 'Color',
    description: 'form-control form-control-color form-control-color-{tone}',
    toneClass: (tone) => `form-control form-control-color form-control-color-${tone}`,
  },
  {
    id: 'input-group',
    title: 'Input group',
    description: 'input-group input-group-{tone}',
    toneClass: (tone) => `input-group input-group-${tone}`,
  },
  {
    id: 'floating',
    title: 'Floating label',
    description: 'form-floating form-floating-{tone}',
    toneClass: (tone) => `form-floating form-floating-${tone}`,
  },
  {
    id: 'validation',
    title: 'Validation',
    description: 'was-validated with required controls',
    toneClass: () => '',
  },
]);

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createSelect = (tone) => {
  const id = nextId(`select-${tone}`);

  const select = el('select', `form-select form-select-${tone}`);
  select.id = id;
  select.append(new Option('Option one', '1'), new Option('Option two', '2'));

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, select);
};

/**
 * @param {string} tone
 * @param {'checkbox' | 'switch' | 'radio'} familyId
 * @returns {HTMLDivElement}
 */
const createCheck = (tone, familyId) => {
  const type = familyId === 'radio' ? 'radio' : 'checkbox';
  const id = nextId(`${familyId}-${tone}`);

  const input = el('input', 'form-check-input');
  input.type = type;
  input.id = id;

  if (type === 'radio') {
    input.name = `${id}-group`;
  }

  const label = el('label', 'form-check-label small text-capitalize', tone);
  label.htmlFor = id;

  const classes = ['form-check', `form-check-${tone}`];

  if (familyId === 'switch') {
    classes.push('form-switch');
  }

  return el('div', classes.join(' '), input, label);
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createRange = (tone) => {
  const id = nextId(`range-${tone}`);

  const input = el('input', `form-range form-range-${tone}`);
  input.type = 'range';
  input.id = id;
  input.value = '60';

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, input);
};

/**
 * Renders the same controls inside a `.was-validated` form, so the
 * `--bs-form-invalid-*` bridge is visible without submitting anything.
 *
 * @param {string} tone
 * @returns {HTMLFormElement}
 */
const createValidation = (tone) => {
  const selectId = nextId(`invalid-select-${tone}`);
  const checkId = nextId(`invalid-check-${tone}`);

  const select = el('select', `form-select form-select-${tone}`);
  select.id = selectId;
  select.required = true;
  select.append(new Option('Required', ''), new Option('Option', '1'));

  const check = el('input', 'form-check-input');
  check.type = 'checkbox';
  check.id = checkId;
  check.required = true;

  const checkLabel = el('label', 'form-check-label small text-capitalize', tone);
  checkLabel.htmlFor = checkId;

  const form = el(
    'form',
    'was-validated d-flex flex-column gap-2',
    select,
    el('div', `form-check form-check-${tone}`, check, checkLabel),
  );
  form.noValidate = true;

  return form;
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createControl = (tone) => {
  const id = nextId(`control-${tone}`);

  const input = el('input', `form-control form-control-${tone}`);
  input.type = 'text';
  input.id = id;
  input.placeholder = 'name@example.com';

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, input);
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createFile = (tone) => {
  const id = nextId(`file-${tone}`);

  const input = el('input', `form-control form-file-${tone}`);
  input.type = 'file';
  input.id = id;

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, input);
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createColor = (tone) => {
  const id = nextId(`color-${tone}`);

  const input = el('input', `form-control form-control-color form-control-color-${tone}`);
  input.type = 'color';
  input.id = id;
  input.value = '#6c8cff';

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, input);
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createInputGroup = (tone) => {
  const id = nextId(`input-group-${tone}`);

  const input = el('input', 'form-control');
  input.type = 'text';
  input.id = id;
  input.placeholder = tone;

  const group = el(
    'div',
    `input-group input-group-${tone}`,
    el('span', 'input-group-text', '@'),
    input,
  );

  const label = el('label', 'form-label small text-capitalize mb-0', tone);
  label.htmlFor = id;

  return el('div', 'd-flex flex-column gap-1', label, group);
};

/**
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createFloating = (tone) => {
  const id = nextId(`floating-${tone}`);

  const input = el('input', 'form-control');
  input.type = 'text';
  input.id = id;
  input.placeholder = tone;

  const label = el('label', '', tone);
  label.htmlFor = id;

  return el('div', `form-floating form-floating-${tone}`, input, label);
};

/**
 * One renderer per family. Keeps `renderFamily` linear as the matrix grows.
 *
 * @type {Readonly<Record<string, (tone: string) => HTMLElement>>}
 */
const RENDERERS = Object.freeze({
  control: createControl,
  select: createSelect,
  checkbox: (tone) => createCheck(tone, 'checkbox'),
  switch: (tone) => createCheck(tone, 'switch'),
  radio: (tone) => createCheck(tone, 'radio'),
  range: createRange,
  file: createFile,
  color: createColor,
  'input-group': createInputGroup,
  floating: createFloating,
  validation: createValidation,
});

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-form-${family.id}`;

  const tones = state.tones.filter((tone) => SUPPORTED.has(tone));
  const row = el('div', 'd-flex flex-wrap align-items-start gap-4');
  const render = RENDERERS[family.id];

  if (!render) {
    throw new RangeError(`Unknown form family: ${family.id}`);
  }

  if (tones.length === 0) {
    row.append(
      el(
        'p',
        'alert alert-warning mb-0',
        'Select at least one tone supported by the form controls.',
      ),
    );
  }

  tones.forEach((tone) => row.append(render(tone)));

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    row,
  );

  return section;
};

createMatrix({
  id: 'form',
  mountId: 'pg-form-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
