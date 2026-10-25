/**
 * @file Colour token matrix for the Bootstrap 5.3 playground.
 *
 * Renders every theme colour through every token shape Bootstrap 5.3 exposes:
 * solid, subtle, gradient, text and the raw CSS custom properties.
 *
 * The `tokens` family reads the resolved value with `getComputedStyle`, so it
 * reflects whichever theme the stylesheet loader applied and refreshes itself
 * when `data-bs-theme` changes.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly string[]} */
const TOKEN_SUFFIXES = Object.freeze([
  '',
  '-rgb',
  '-text-emphasis',
  '-bg-subtle',
  '-border-subtle',
]);

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'bg-{tone}',
    toneClass: (tone) => `bg-${tone}`,
  },
  {
    id: 'subtle',
    title: 'Subtle',
    description: 'bg-{tone}-subtle text-{tone}-emphasis border-{tone}-subtle',
    toneClass: (tone) =>
      `bg-${tone}-subtle text-${tone}-emphasis border border-${tone}-subtle`,
  },
  {
    id: 'gradient',
    title: 'Gradient',
    description: 'bg-gradient bg-{tone}',
    toneClass: (tone) => `bg-gradient bg-${tone}`,
  },
  {
    id: 'text',
    title: 'Text',
    description: 'text-{tone}',
    toneClass: (tone) => `text-${tone}`,
  },
  {
    id: 'tokens',
    title: 'Resolved tokens',
    description: 'getComputedStyle() over every --bs-{tone}* variable',
    toneClass: () => '',
  },
]);

/**
 * Reads a custom property from the document root.
 * @param {string} name Custom property name, including the leading `--`.
 * @returns {string} Resolved value, or an em dash when the token is missing.
 */
const readToken = (name) =>
  getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '—';

/**
 * Rewrites every `[data-pg-token]` node with the current value of its token.
 * @returns {void}
 */
const refreshTokens = () => {
  document.querySelectorAll('[data-pg-token]').forEach((node) => {
    node.textContent = readToken(/** @type {HTMLElement} */ (node).dataset.pgToken);
  });
};

new MutationObserver(refreshTokens).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['data-bs-theme'],
});

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createSwatch = (family, tone) => {
  const column = el('div', 'col-6 col-md-4 col-xl-3');
  const card = el('div', 'card border rounded-3 overflow-hidden h-100');

  card.append(
    el('div', `ratio ratio-21x9 ${family.toneClass(tone)}`),
    el(
      'div',
      `bg-${tone}-subtle text-${tone}-emphasis px-2 py-1 small fw-semibold text-capitalize`,
      tone,
    ),
    el(
      'div',
      'card-body p-2 small text-body-secondary',
      el('code', '', `${family.id}-${tone}`),
    ),
  );

  column.append(card);

  return column;
};

/**
 * @param {string} tone
 * @returns {HTMLElement}
 */
const createTokenCard = (tone) => {
  const column = el('div', 'col-12 col-xl-6');
  const card = el('div', 'card h-100');

  const body = el('div', 'table-responsive');
  const table = el('table', 'table table-sm mb-0 small');
  const tbody = el('tbody');

  TOKEN_SUFFIXES.forEach((suffix) => {
    const name = `--bs-${tone}${suffix}`;
    const row = el('tr');
    const head = el('th', 'text-nowrap fw-normal', el('code', '', name)));
    const value = el('td', 'text-break');
    const code = el('code', '', '—');
    code.dataset.pgToken = name;
    value.append(code);
    row.append(head, value);
    tbody.append(row);
  });

  table.append(tbody);
  body.append(table);

  card.append(
    el('div', 'card-header py-1 small fw-semibold text-capitalize', tone),
    body,
  );
  column.append(card);

  return column;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-color-${family.id}`;

  const grid = el(
    'div',
    'row g-3',
    ...state.tones.map((tone) =>
      family.id === 'tokens' ? createTokenCard(tone) : createSwatch(family, tone),
    ),
  );

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    grid,
  );

  requestAnimationFrame(refreshTokens);

  return section;
};

createMatrix({
  id: 'color',
  mountId: 'pg-color-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});