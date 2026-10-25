/**
 * @file Toast colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'toast text-bg-{tone}',
    toneClass: (tone) => `toast show text-bg-${tone}`,
  },
  {
    id: 'header',
    title: 'Colored header',
    description: 'toast with a bg-{tone} toast-header',
    toneClass: () => 'toast show',
  },
  {
    id: 'border',
    title: 'Border',
    description: 'toast border-2 border-{tone}',
    toneClass: (tone) => `toast show border-2 border-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createToast = (family, tone) => {
  const toast = el('div', family.toneClass(tone));
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');

  const header = el('div', 'toast-header');
  header.append(el('strong', 'me-auto text-capitalize', tone), el('small', '', 'just now'));

  if (family.id === 'header') {
    header.classList.add(`bg-${tone}`);
  }

  const body = el('div', 'toast-body', `A ${tone} toast message.`);

  toast.append(header, body);

  return toast;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-toast-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-wrap gap-3', ...state.tones.map((tone) => createToast(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'toast',
  mountId: 'pg-toast-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
