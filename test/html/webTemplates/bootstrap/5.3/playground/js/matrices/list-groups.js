/**
 * @file List group colour matrix for the Bootstrap 5.3 playground.
 *
 * Mirrors every layout of the static "List group" section: basic, active,
 * action, flush, numbered, horizontal, badge and checkbox.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {Readonly<Record<string, string>>} */
const LIST_CLASS = Object.freeze({
  basic: 'list-group',
  active: 'list-group',
  action: 'list-group',
  flush: 'list-group list-group-flush',
  numbered: 'list-group list-group-numbered',
  horizontal: 'list-group list-group-horizontal',
  badge: 'list-group',
  check: 'list-group',
});

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'basic',
    title: 'Basic',
    description: 'list-group-item list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
  {
    id: 'active',
    title: 'Active',
    description: 'list-group-item active list-group-item-{tone}',
    toneClass: (tone) => `list-group-item active list-group-item-${tone}`,
  },
  {
    id: 'action',
    title: 'Action',
    description: 'list-group-item list-group-item-action list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-action list-group-item-${tone}`,
  },
  {
    id: 'flush',
    title: 'Flush',
    description: 'list-group list-group-flush with list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
  {
    id: 'numbered',
    title: 'Numbered',
    description: 'ol.list-group-numbered with list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
  {
    id: 'horizontal',
    title: 'Horizontal',
    description: 'list-group-horizontal with list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
  {
    id: 'badge',
    title: 'With badge',
    description: 'list-group-item with a badge text-bg-{tone}',
    toneClass: () => 'list-group-item d-flex justify-content-between align-items-center',
  },
  {
    id: 'check',
    title: 'Checkbox',
    description: 'list-group-item-{tone} with a form-check-input',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
]);

/**
 * Builds the three labels used by every list.
 * @param {string} tone
 * @returns {string[]}
 */
const labels = (tone) => [`${tone} one`, `${tone} two`, `${tone} three`];

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLLIElement}
 */
const createBadgeItem = (family, tone) => {
  const item = el('li', family.toneClass(tone));
  item.append(
    el('span', 'text-capitalize', tone),
    el('span', `badge text-bg-${tone} rounded-pill`, '14'),
  );

  return item;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @param {number} index
 * @returns {HTMLLIElement}
 */
const createCheckItem = (family, tone, index) => {
  const item = el('li', family.toneClass(tone));
  const id = `pg-list-check-${tone}-${index}`;

  const input = el('input', 'form-check-input me-1');
  input.type = 'checkbox';
  input.id = id;
  input.checked = index === 0;

  const label = el('label', 'form-check-label text-capitalize', `${tone} ${index + 1}`);
  label.htmlFor = id;

  item.append(input, label);

  return item;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createList = (family, tone) => {
  const tag = family.id === 'numbered' ? 'ol' : 'ul';
  const list = el(tag, LIST_CLASS[family.id]);

  if (family.id === 'horizontal') {
    const wrapper = el('div', 'overflow-auto');
    wrapper.append(list);
    labels(tone).forEach((label) => list.append(el('li', family.toneClass(tone), label)));

    return wrapper;
  }

  labels(tone).forEach((label, index) => {
    if (family.id === 'badge') {
      list.append(createBadgeItem(family, tone));
      return;
    }

    if (family.id === 'check') {
      list.append(createCheckItem(family, tone, index));
      return;
    }

    list.append(el('li', family.toneClass(tone), label));
  });

  return list;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-list-group-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-column gap-3', ...state.tones.map((tone) => createList(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'list-group',
  mountId: 'pg-list-group-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
