/**
 * @file Card colour matrix for the Bootstrap 5.3 playground.
 *
 * Every family mirrors the markup of the static "Cards" section, so the
 * matrix can be used as a drop-in replacement.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly string[]} */
const ICONS = Object.freeze([
  'bi-palette',
  'bi-phone',
  'bi-moon-stars',
  'bi-grid-3x3-gap',
  'bi-braces',
]);

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'icon',
    title: 'Icon',
    description: 'card h-100 border rounded-3 with a cube-icon',
    toneClass: () => 'card h-100 border rounded-3',
  },
  {
    id: 'header',
    title: 'Header & footer',
    description: 'card with card-header and card-footer',
    toneClass: () => 'card',
  },
  {
    id: 'list',
    title: 'List group',
    description: 'card with list-group list-group-flush',
    toneClass: () => 'card',
  },
  {
    id: 'solid',
    title: 'Solid',
    description: 'card text-bg-{tone}',
    toneClass: (tone) => `card text-bg-${tone}`,
  },
  {
    id: 'border',
    title: 'Border',
    description: 'card border-2 border-{tone}',
    toneClass: (tone) => `card border-2 border-${tone}`,
  },
  {
    id: 'header',
    title: 'Colored header',
    description: 'card with a bg-{tone} card-header',
    toneClass: () => 'card',
  },
  {
    id: 'horizontal',
    title: 'Horizontal',
    description: 'card with row g-0 and a bg-{tone} image column',
    toneClass: () => 'card',
  },
  {
    id: 'subtle',
    title: 'Subtle',
    description: 'card bg-{tone}-subtle',
    toneClass: (tone) => `card bg-${tone}-subtle`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @param {number} index
 * @returns {HTMLDivElement}
 */
const createCard = (family, tone, index) => {
  const card = el('div', family.toneClass(tone));

  if (family.id === 'icon') {
    const body = el('div', 'card-body');
    const icon = el(
      'div',
      `cube-icon cube-icon-md rounded-3 bg-${tone} bg-opacity-10 text-${tone} fs-5 mb-3`,
    );
    icon.append(el('i', `bi ${ICONS[index % ICONS.length]}`));

    body.append(
      icon,
      el('h6', 'card-title text-capitalize', tone),
      el('p', 'card-text small text-body-secondary mb-0', `Accent ${tone}.`),
    );
    card.append(body);

    return card;
  }

  if (family.id === 'header') {
    card.append(
      el('div', 'card-header text-capitalize', tone),
      el(
        'div',
        'card-body',
        el('h5', 'card-title', 'Header & footer'),
        el('p', 'card-text', `Card with ${tone} header.`),
      ),
      el('div', 'card-footer text-body-secondary', '2 days ago'),
    );

    return card;
  }

  if (family.id === 'list') {
    const list = el('ul', 'list-group list-group-flush');
    ['An item', 'A second item', 'A third item'].forEach((label) => {
      list.append(el('li', 'list-group-item', label));
    });
    card.append(list);

    return card;
  }

  if (family.id === 'horizontal') {
    card.style.maxWidth = '540px';

    const row = el('div', 'row g-0');
    const image = el(
      'div',
      `col-md-4 d-flex align-items-center justify-content-center bg-${tone} bg-opacity-25`,
      tone,
    );
    const body = el(
      'div',
      'col-md-8',
      el(
        'div',
        'card-body',
        el('h5', 'card-title', 'Horizontal card'),
        el('p', 'card-text', 'Uses grid + g-0.'),
      ),
    );

    row.append(image, body);
    card.append(row);

    return card;
  }

  // solid
  card.append(
    el('div', 'card-header text-capitalize', tone),
    el(
      'div',
      'card-body',
      el('h5', 'card-title', 'Colored card'),
      el('p', 'card-text mb-0', `text-bg-${tone}`),
    ),
  );

  return card;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-card-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'row g-3',
      ...state.tones.map((tone, index) => {
        const column = el('div', 'col-md-4');
        column.append(createCard(family, tone, index));

        return column;
      }),
    ),
  );

  return section;
};

createMatrix({
  id: 'card',
  mountId: 'pg-card-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
