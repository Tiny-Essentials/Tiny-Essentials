/**
 * @file Pagination colour matrix for the Bootstrap 5.3 playground.
 *
 * Every family mirrors one of the static pagination examples: basic, icons,
 * disabled, sizing and alignment.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'page-link bg-{tone} border-{tone} text-white',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
  {
    id: 'outline',
    title: 'Outline',
    description: 'page-link text-{tone} border-{tone}',
    toneClass: (tone) => `page-link text-${tone} border-${tone}`,
  },
  {
    id: 'active',
    title: 'Active item',
    description: 'page-item active with a bg-{tone} page-link',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
  {
    id: 'icons',
    title: 'Icons',
    description: 'Previous/Next with &laquo; and &raquo;',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
  {
    id: 'disabled',
    title: 'Disabled',
    description: 'page-item disabled with a colored active item',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
  {
    id: 'sizing',
    title: 'Sizing',
    description: 'pagination-lg and pagination-sm',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
  {
    id: 'alignment',
    title: 'Alignment',
    description: 'justify-content-center',
    toneClass: (tone) => `page-link bg-${tone} border-${tone} text-white`,
  },
]);

/**
 * @param {string} label
 * @param {string} [className]
 * @param {boolean} [active]
 * @returns {HTMLLIElement}
 */
const pageItem = (label, className = 'page-link', active = false) => {
  const item = el('li', active ? 'page-item active' : 'page-item');
  const link = el('a', className, label);
  link.href = '#';
  item.append(link);

  return item;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createPagination = (family, tone) => {
  const nav = el('nav');
  const list = el('ul', 'pagination mb-0');

  if (family.id === 'icons') {
    list.append(
      pageItem('«', family.toneClass(tone)),
      pageItem('1', family.toneClass(tone), true),
      pageItem('2', family.toneClass(tone)),
      pageItem('»', family.toneClass(tone)),
    );
  } else if (family.id === 'disabled') {
    const disabled = el('li', 'page-item disabled');
    disabled.append(el('a', 'page-link', 'Previous'));
    list.append(
      disabled,
      pageItem('1', family.toneClass(tone)),
      pageItem('2', family.toneClass(tone), true),
      pageItem('3', family.toneClass(tone)),
    );
  } else if (family.id === 'sizing') {
    const large = el('ul', 'pagination pagination-lg mb-2');
    large.append(
      pageItem('1', family.toneClass(tone), true),
      pageItem('2', family.toneClass(tone)),
      pageItem('3', family.toneClass(tone)),
    );

    const small = el('ul', 'pagination pagination-sm mb-0');
    small.append(
      pageItem('1', family.toneClass(tone), true),
      pageItem('2', family.toneClass(tone)),
      pageItem('3', family.toneClass(tone)),
    );

    nav.append(large, small);

    return nav;
  } else if (family.id === 'alignment') {
    list.classList.add('justify-content-center');
    list.append(
      pageItem('Previous', 'page-link'),
      pageItem('1', family.toneClass(tone), true),
      pageItem('2', family.toneClass(tone)),
      pageItem('3', family.toneClass(tone)),
      pageItem('Next', 'page-link'),
    );
  } else {
    list.append(
      pageItem('Previous', 'page-link'),
      pageItem('1', family.toneClass(tone), true),
      pageItem('2', family.toneClass(tone)),
      pageItem('3', family.toneClass(tone)),
      pageItem('Next', 'page-link'),
    );
  }

  nav.append(list);

  return nav;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-pagination-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-column gap-2',
      ...state.tones.map((tone) => createPagination(family, tone)),
    ),
  );

  return section;
};

createMatrix({
  id: 'pagination',
  mountId: 'pg-pagination-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
