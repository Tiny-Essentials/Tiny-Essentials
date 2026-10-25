/**
 * @file Dropdown colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'btn btn-{tone} dropdown-toggle',
    toneClass: (tone) => `btn btn-${tone} dropdown-toggle`,
  },
  {
    id: 'outline',
    title: 'Outline',
    description: 'btn btn-outline-{tone} dropdown-toggle',
    toneClass: (tone) => `btn btn-outline-${tone} dropdown-toggle`,
  },
  {
    id: 'split',
    title: 'Split',
    description: 'btn btn-{tone} + dropdown-toggle-split',
    toneClass: (tone) => `btn btn-${tone}`,
  },
]);

/**
 * @returns {HTMLUListElement}
 */
const createMenu = () => {
  const menu = el('ul', 'dropdown-menu');

  ['Action', 'Another action', 'Something else'].forEach((label) => {
    const item = el('li');
    const link = el('a', 'dropdown-item', label);
    link.href = '#';
    item.append(link);
    menu.append(item);
  });

  return menu;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createDropdown = (family, tone) => {
  const group = el('div', family.id === 'split' ? 'btn-group' : 'dropdown');

  if (family.id === 'split') {
    const action = el('button', `btn btn-${tone}`, 'Action');
    action.type = 'button';

    const toggle = el('button', `btn btn-${tone} dropdown-toggle dropdown-toggle-split`);
    toggle.type = 'button';
    toggle.dataset.bsToggle = 'dropdown';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.append(el('span', 'visually-hidden', 'Toggle Dropdown'));

    group.append(action, toggle, createMenu());

    return group;
  }

  const toggle = el('button', family.toneClass(tone), tone);
  toggle.type = 'button';
  toggle.dataset.bsToggle = 'dropdown';
  toggle.setAttribute('aria-expanded', 'false');

  group.append(toggle, createMenu());

  return group;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-dropdown-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-wrap align-items-center gap-2',
      ...state.tones.map((tone) => createDropdown(family, tone)),
    ),
  );

  return section;
};

createMatrix({
  id: 'dropdown',
  mountId: 'pg-dropdown-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
