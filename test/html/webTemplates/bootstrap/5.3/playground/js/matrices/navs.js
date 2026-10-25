/**
 * @file Nav and tab colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'pills',
    title: 'Pills',
    description: 'nav-pills with an active bg-{tone} link',
    toneClass: (tone) => `nav-link active bg-${tone}`,
  },
  {
    id: 'tabs',
    title: 'Tabs',
    description: 'nav-tabs with an active text-{tone} border-{tone} link',
    toneClass: (tone) => `nav-link active text-${tone} border-${tone}`,
  },
  {
    id: 'underline',
    title: 'Underline',
    description: 'nav-underline with an active text-{tone} border-{tone} link',
    toneClass: (tone) => `nav-link active text-${tone} border-${tone}`,
  },
]);

/** @type {Readonly<Record<string, string>>} */
const NAV_CLASS = Object.freeze({
  pills: 'nav nav-pills',
  tabs: 'nav nav-tabs',
  underline: 'nav nav-underline',
});

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLUListElement}
 */
const createNav = (family, tone) => {
  const nav = el('ul', NAV_CLASS[family.id]);

  ['One', 'Two', 'Three'].forEach((label, index) => {
    const item = el('li', 'nav-item');
    const link = el('a', index === 0 ? family.toneClass(tone) : 'nav-link', label);
    link.href = '#';
    item.append(link);
    nav.append(item);
  });

  return nav;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-nav-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-column gap-2', ...state.tones.map((tone) => createNav(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'nav',
  mountId: 'pg-nav-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
