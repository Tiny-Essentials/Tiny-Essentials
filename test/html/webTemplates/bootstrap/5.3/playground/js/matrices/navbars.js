/**
 * @file Navbar colour matrix for the Bootstrap 5.3 playground.
 *
 * Bootstrap 5.3 deprecated `navbar-dark`; the theme is now driven by
 * `data-bs-theme`, so the matrix flips it automatically for light tones.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly string[]} */
const LIGHT_TONES = Object.freeze(['light', 'warning', 'info']);

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'navbar bg-{tone} with data-bs-theme',
    toneClass: (tone) => `navbar bg-${tone}`,
  },
  {
    id: 'brand',
    title: 'Brand only',
    description: 'navbar bg-body-tertiary with a text-{tone} brand',
    toneClass: () => 'navbar bg-body-tertiary',
  },
  {
    id: 'dark',
    title: 'Forced dark',
    description: 'navbar bg-{tone} with data-bs-theme="dark"',
    toneClass: (tone) => `navbar bg-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createNavbar = (family, tone) => {
  const navbar = el('nav', family.toneClass(tone));
  navbar.setAttribute(
    'data-bs-theme',
    family.id === 'dark' || !LIGHT_TONES.includes(tone) ? 'dark' : 'light',
  );

  const container = el('div', 'container-fluid');
  const brand = el('a', 'navbar-brand', tone);
  brand.href = '#';

  if (family.id === 'brand') {
    brand.className = `navbar-brand text-${tone}`;
  }

  container.append(brand, el('span', 'navbar-text', `bg-${tone}`));
  navbar.append(container);

  return navbar;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-navbar-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-column gap-2', ...state.tones.map((tone) => createNavbar(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'navbar',
  mountId: 'pg-navbar-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
