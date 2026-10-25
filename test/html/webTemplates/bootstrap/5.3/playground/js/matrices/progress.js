// js/matrices/progress.js
import { createMatrix, el } from '../color-matrix.js';

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'basic',
    title: 'Basic',
    description: 'progress-bar bg-{tone}',
    toneClass: (tone) => `progress-bar bg-${tone}`,
  },
  {
    id: 'striped',
    title: 'Striped',
    description: 'progress-bar progress-bar-striped bg-{tone}',
    toneClass: (tone) => `progress-bar progress-bar-striped bg-${tone}`,
  },
  {
    id: 'animated',
    title: 'Animated',
    description: 'progress-bar progress-bar-striped progress-bar-animated bg-{tone}',
    toneClass: (tone) => `progress-bar progress-bar-striped progress-bar-animated bg-${tone}`,
  },
]);

/**
 * @param {import('../color-matrix.js').MatrixFamily} family
 * @param {import('../color-matrix.js').MatrixState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-progress-${family.id}`;

  section.append(
    el('h4', 'fw-bold mb-0', family.title),
    el('p', 'small text-body-secondary mb-0', family.description),
    el(
      'div',
      'd-flex flex-column gap-2',
      ...state.tones.map((tone) => {
        const wrapper = el('div', 'progress');
        wrapper.setAttribute('role', 'progressbar');
        wrapper.setAttribute('aria-valuenow', '60');
        wrapper.setAttribute('aria-valuemin', '0');
        wrapper.setAttribute('aria-valuemax', '100');

        const bar = el('div', family.toneClass(tone), tone);
        bar.style.width = '60%';
        wrapper.append(bar);

        return wrapper;
      }),
    ),
  );

  return section;
};

createMatrix({
  id: 'progress',
  mountId: 'pg-progress-matrix',
  families: FAMILIES,
  renderFamily,
  controls: ['family', 'tones'],
});
