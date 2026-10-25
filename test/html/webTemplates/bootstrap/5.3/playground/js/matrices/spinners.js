/**
 * @file Spinner colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'border',
    title: 'Border',
    description: 'spinner-border text-{tone}',
    toneClass: (tone) => `spinner-border text-${tone}`,
  },
  {
    id: 'grow',
    title: 'Grow',
    description: 'spinner-grow text-{tone}',
    toneClass: (tone) => `spinner-grow text-${tone}`,
  },
  {
    id: 'small',
    title: 'Small',
    description: 'spinner-*-sm text-{tone}',
    toneClass: (tone) => `spinner-border spinner-border-sm text-${tone}`,
  },
  {
    id: 'button',
    title: 'Inside a button',
    description: 'btn btn-{tone} with a spinner-border-sm',
    toneClass: (tone) => `btn btn-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createSpinner = (family, tone) => {
  if (family.id === 'button') {
    const button = el('button', family.toneClass(tone));
    button.type = 'button';
    button.disabled = true;

    const spinner = el('span', 'spinner-border spinner-border-sm me-2');
    spinner.setAttribute('aria-hidden', 'true');

    const label = el('span', '', 'Loading…');
    label.setAttribute('role', 'status');

    button.append(spinner, label);

    return button;
  }

  const spinner = el('div', family.toneClass(tone));
  spinner.setAttribute('role', 'status');
  spinner.setAttribute('aria-label', `${tone} spinner`);
  spinner.style.width = '2rem';
  spinner.style.height = '2rem';

  if (family.id === 'small') {
    spinner.style.width = '1rem';
    spinner.style.height = '1rem';
  }

  return spinner;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-spinner-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-wrap align-items-center gap-3',
      ...state.tones.map((tone) => createSpinner(family, tone)),
    ),
  );

  return section;
};

createMatrix({
  id: 'spinner',
  mountId: 'pg-spinner-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
