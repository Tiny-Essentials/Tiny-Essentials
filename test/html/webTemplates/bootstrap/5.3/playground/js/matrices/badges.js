/**
 * @file Badge colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'badge text-bg-{tone}',
    toneClass: (tone) => `badge text-bg-${tone}`,
  },
  {
    id: 'pill',
    title: 'Pill',
    description: 'badge rounded-pill text-bg-{tone}',
    toneClass: (tone) => `badge rounded-pill text-bg-${tone}`,
  },
  {
    id: 'subtle',
    title: 'Subtle',
    description: 'badge text-{tone} bg-{tone}-subtle',
    toneClass: (tone) => `badge text-${tone} bg-${tone}-subtle border border-${tone}-subtle`,
  },
  {
    id: 'in-button',
    title: 'Inside a button',
    description: 'Badge positioned inside a .btn',
    toneClass: (tone) => `badge text-bg-${tone}`,
  },
  {
    id: 'link',
    title: 'Link + badge',
    description: 'Anchor with a rounded-pill badge',
    toneClass: (tone) => `badge text-bg-${tone} rounded-pill`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createBadge = (family, tone) => {
  const badge = el('span', family.toneClass(tone), tone);

  if (family.id === 'in-button') {
    const wrapper = el('button', 'btn btn-primary position-relative', 'Inbox ');
    const positioned = el('span', 'position-absolute top-0 start-100 translate-middle');
    positioned.append(badge);
    wrapper.append(positioned);

    return wrapper;
  }

  if (family.id === 'link') {
    const link = el('a', 'text-decoration-none');
    link.href = '#';
    link.append('Notifications ', badge);

    return link;
  }

  return badge;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-badge-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-wrap align-items-center gap-2',
      ...state.tones.map((tone) => createBadge(family, tone)),
    ),
  );

  return section;
};

createMatrix({
  id: 'badge',
  mountId: 'pg-badge-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
