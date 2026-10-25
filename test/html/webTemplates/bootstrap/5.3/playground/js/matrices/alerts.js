/**
 * @file Alert colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'Filled alert created with alert-{tone}.',
    toneClass: (tone) => `alert-${tone}`,
  },
  {
    id: 'dismissible',
    title: 'Dismissible',
    description: 'Solid alert with a close button.',
    toneClass: (tone) => `alert-${tone} alert-dismissible fade show`,
  },
  {
    id: 'with-link',
    title: 'With link',
    description: 'Solid alert with an .alert-link child.',
    toneClass: (tone) => `alert-${tone}`,
  },
  {
    id: 'with-icon',
    title: 'With icon',
    description: 'Solid alert with a leading Bootstrap Icon.',
    toneClass: (tone) => `alert-${tone}`,
  },
  {
    id: 'with-heading',
    title: 'With heading',
    description: 'Solid alert with an .alert-heading title.',
    toneClass: (tone) => `alert-${tone}`,
  },
]);

/**
 * @param {string} tone
 * @returns {HTMLButtonElement}
 */
const createCloseButton = (tone) => {
  const close = el('button', 'btn-close');
  close.type = 'button';
  close.dataset.bsDismiss = 'alert';
  close.setAttribute('aria-label', 'Close');
  close.setAttribute('aria-label', `Close ${tone} alert`);

  return close;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLDivElement}
 */
const createAlert = (family, tone) => {
  const alert = el('div', `alert ${family.toneClass(tone)}`);
  alert.setAttribute('role', 'alert');

  switch (family.id) {
    case 'dismissible':
      alert.append(`A simple ${tone} alert.`, createCloseButton(tone));
      break;
    case 'with-link':
      alert.append(`A simple ${tone} alert with `, el('a', 'alert-link', 'an example link'), '.');
      break;
    case 'with-icon':
      alert.append(el('i', 'bi bi-info-circle me-2'), `A simple ${tone} alert.`);
      break;
    case 'with-heading':
      alert.append(
        el('h4', 'alert-heading', 'Alert heading'),
        el('p', 'mb-0', `A simple ${tone} alert.`),
      );
      break;
    default:
      alert.textContent = `A simple ${tone} alert.`;
  }

  return alert;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-alert-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-column gap-2', ...state.tones.map((tone) => createAlert(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'alert',
  mountId: 'pg-alert-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
