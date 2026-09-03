import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const cases = [
  { id: 'item-1a', container: 'container-1' },
  { id: 'item-1b', container: 'container-1' },
  { id: 'item-1c', container: 'container-1' },
  { id: 'item-2a', container: 'container-2' },
  // { id: 'item-h1', container: 'container-horizontal' },
  // { id: 'item-h2', container: 'container-horizontal' },
  { id: 'item-n1', container: 'inner-container' },
  { id: 'item-n2', container: 'inner-container' },
];

window.elems = {};
function updateVisuals() {
  for (const { id, container } of cases) {
    const tinyId = `${id}:${container}`;
    if (!window.elems[tinyId])
      window.elems[tinyId] = { el: TinyHtml.getById(id), cont: TinyHtml.getById(container) };
    const { el, cont } = window.elems[tinyId];

    const isIn = el.isInContainer(cont);
    const isFull = el.isFullyInContainer(cont);

    el.removeClass('visible-full', 'visible-partial', 'invisible');

    const existing = el.querySelector('.status-label');
    if (existing) existing.remove();

    const label = TinyHtml.createElement('div');
    label.addClass('status-label');

    if (isFull) {
      el.addClass('visible-full');
      label.setText('Fully Visible');
    } else if (isIn) {
      el.addClass('visible-partial');
      label.setText('Partially Visible');
    } else {
      el.addClass('invisible');
      label.setText('Not Visible');
    }

    el.append(label);
  }
}

// Attach scroll/resize listeners
window.addEventListener('scroll', () => updateVisuals(), { passive: true });
window.addEventListener('resize', () => updateVisuals());

const all = document.querySelectorAll('*');
for (const el of all) {
  if (el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth) {
    el.addEventListener('scroll', () => updateVisuals(), { passive: true });
  }
}

// Inicializa os testes visuais
window.addEventListener('load', updateVisuals);
updateVisuals();
