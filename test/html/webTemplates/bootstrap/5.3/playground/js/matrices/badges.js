/**
 * @file Badge colour matrix for the Bootstrap 5.3 playground.
 *
 * Bootstrap ships two ways of colouring a badge:
 *
 * - `text-bg-{tone}` sets the background **and** a contrasting foreground.
 * - `bg-{tone}` sets only the background, so the text keeps the inherited
 *   colour. That is the family where contrast bugs show up.
 *
 * Both are rendered, plus a `compare` family that puts them side by side.
 */

import { createMatrix, el } from '../color-matrix.js';

/**
 * Resolves the two class lists a badge can use for a single tone.
 *
 * @param {string} tone Theme colour name.
 * @returns {{ text: string, background: string }} Class list of each variant.
 * @throws {TypeError} When `tone` is not a non-empty string.
 */
const badgeClasses = (tone) => {
  if (typeof tone !== 'string' || tone.trim() === '') {
    throw new TypeError('tone must be a non-empty string');
  }

  return {
    text: `badge text-bg-${tone}`,
    background: `badge bg-${tone}`,
  };
};

/** @type {readonly import('../color-matrix.js').MatrixFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'solid',
    title: 'Solid (text-bg)',
    description: 'badge text-bg-{tone} — background plus a contrasting foreground.',
    toneClass: (tone) => badgeClasses(tone).text,
  },
  {
    id: 'background',
    title: 'Background only (bg)',
    description: 'badge bg-{tone} — background only, the text keeps the inherited colour.',
    toneClass: (tone) => badgeClasses(tone).background,
  },
  {
    id: 'compare',
    title: 'text-bg vs bg',
    description: 'Both variants side by side, so the contrast difference is visible.',
    toneClass: () => '',
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
    toneClass: (tone) => `badge bg-${tone}`,
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
  if (family.id === 'compare') {
    const text = el('span', badgeClasses(tone).text, tone);
    text.title = `text-bg-${tone}`;

    const background = el('span', badgeClasses(tone).background, tone);
    background.title = `bg-${tone}`;

    return el('span', 'd-inline-flex align-items-center gap-1', text, background);
  }

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
