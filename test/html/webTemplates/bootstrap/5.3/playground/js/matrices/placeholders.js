/**
 * @file Placeholder colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'placeholder bg-{tone}',
    toneClass: (tone) => `placeholder bg-${tone}`,
  },
  {
    id: 'glow',
    title: 'Glow',
    description: 'placeholder-glow with placeholder bg-{tone}',
    toneClass: (tone) => `placeholder bg-${tone}`,
  },
  {
    id: 'wave',
    title: 'Wave',
    description: 'placeholder-wave with placeholder bg-{tone}',
    toneClass: (tone) => `placeholder bg-${tone}`,
  },
  {
    id: 'sizing',
    title: 'Sizing',
    description: 'placeholder-lg, default, -sm and -xs',
    toneClass: (tone) => `placeholder bg-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createPlaceholder = (family, tone) => {
  if (family.id === 'sizing') {
    const wrapper = el('div', 'd-flex flex-column gap-2');
    ['placeholder-lg', '', 'placeholder-sm', 'placeholder-xs'].forEach((size) => {
      const line = el('span', `placeholder bg-${tone} col-12 ${size}`.trim());
      wrapper.append(line);
    });

    return wrapper;
  }

  const wrapper = el('div', family.id === 'solid' ? '' : `placeholder-${family.id}`);
  const line = el('span', `${family.toneClass(tone)} col-12`);
  wrapper.append(line);

  return wrapper;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-placeholder-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-column gap-3',
      ...state.tones.map((tone) => createPlaceholder(family, tone)),
    ),
  );

  return section;
};

createMatrix({
  id: 'placeholder',
  mountId: 'pg-placeholder-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
