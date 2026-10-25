/**
 * @file Table colour matrix for the Bootstrap 5.3 playground.
 *
 * Covers every table layout that accepts a theme colour: whole table, striped,
 * hover, bordered, row and cell.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid',
    description: 'table table-{tone}',
    toneClass: (tone) => `table table-${tone}`,
  },
  {
    id: 'striped',
    title: 'Striped',
    description: 'table table-striped table-{tone}',
    toneClass: (tone) => `table table-striped table-${tone}`,
  },
  {
    id: 'hover',
    title: 'Hover',
    description: 'table table-hover table-{tone}',
    toneClass: (tone) => `table table-hover table-${tone}`,
  },
  {
    id: 'bordered',
    title: 'Bordered',
    description: 'table table-bordered table-{tone}',
    toneClass: (tone) => `table table-bordered table-${tone}`,
  },
  {
    id: 'row',
    title: 'Row',
    description: 'table with a single table-{tone} row',
    toneClass: () => 'table',
  },
  {
    id: 'cell',
    title: 'Cell',
    description: 'table with a single table-{tone} cell',
    toneClass: () => 'table',
  },
]);

/**
 * @param {string} tag
 * @param {string} text
 * @returns {HTMLElement}
 */
const cell = (tag, text) => {
  const node = el(tag, '', text);

  return node;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {string} tone
 * @returns {HTMLTableElement}
 */
const createTable = (family, tone) => {
  const table = el('table', family.toneClass(tone));

  const thead = el('thead');
  const headRow = el('tr');
  ['#', 'Name', 'Role'].forEach((label) => headRow.append(cell('th', label)));
  thead.append(headRow);

  const tbody = el('tbody');
  [
    ['1', 'Ada Lovelace', 'Engineer'],
    ['2', 'Alan Turing', 'Researcher'],
    ['3', 'Grace Hopper', 'Admiral'],
  ].forEach((row, rowIndex) => {
    const tr = el('tr');

    if (family.id === 'row' && rowIndex === 1) {
      tr.className = `table-${tone}`;
    }

    row.forEach((value, cellIndex) => {
      const td = cell('td', value);

      if (family.id === 'cell' && rowIndex === 1 && cellIndex === 1) {
        td.className = `table-${tone}`;
      }

      tr.append(td);
    });

    tbody.append(tr);
  });

  table.append(thead, tbody);

  return table;
};

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-table-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el('div', 'd-flex flex-column gap-3', ...state.tones.map((tone) => createTable(family, tone))),
  );

  return section;
};

createMatrix({
  id: 'table',
  mountId: 'pg-table-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
