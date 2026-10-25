/**
 * @file List group colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'basic',
    title: 'Basic',
    description: 'list-group-item list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-${tone}`,
  },
  {
    id: 'action',
    title: 'Action',
    description: 'list-group-item list-group-item-action list-group-item-{tone}',
    toneClass: (tone) => `list-group-item list-group-item-action list-group-item-${tone}`,
  },
  {
    id: 'with-badge',
    title: 'With badge',
    description: 'list-group-item with a badge text-bg-{tone}',
    toneClass: () => 'list-group-item d-flex justify-content-between align-items-center',
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLLIElement}
 */
const createItem = (family, tone) => {
  const item = el('li', family.toneClass(tone));

  if (family.id === 'with-badge') {
    item.append(
      el('span', 'text-capitalize', tone),
      el('span', `badge text-bg-${tone} rounded-pill`, '14'),
    );

    return item;
  }

  item.textContent = tone;

  return item;
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
    el('ul', 'list-group', ...state.tones.map((tone) => createItem(family, tone))),
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
