/**
 * @file Text, background and border colour matrix for the Bootstrap 5.3 playground.
 */

import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'text',
    title: 'Text',
    description: 'text-{tone}',
    toneClass: (tone) => `text-${tone}`,
  },
  {
    id: 'bg',
    title: 'Background',
    description: 'bg-{tone}',
    toneClass: (tone) => `bg-${tone} p-3 rounded`,
  },
  {
    id: 'bg-subtle',
    title: 'Subtle background',
    description: 'bg-{tone}-subtle text-{tone}-emphasis',
    toneClass: (tone) => `bg-${tone}-subtle text-${tone}-emphasis p-3 rounded`,
  },
  {
    id: 'border',
    title: 'Border',
    description: 'border border-2 border-{tone}',
    toneClass: (tone) => `border border-2 border-${tone} p-3 rounded`,
  },
  {
    id: 'link',
    title: 'Link',
    description: 'link-{tone}',
    toneClass: (tone) => `link-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-utility-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-wrap align-items-center gap-2',
      ...state.tones.map((tone) => {
        const className = family.toneClass(tone);

        if (family.id === 'link') {
          const link = el('a', className, tone);
          link.href = '#';

          return link;
        }

        return el('span', className, tone);
      }),
    ),
  );

  return section;
};

createMatrix({
  id: 'utility',
  mountId: 'pg-utility-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
