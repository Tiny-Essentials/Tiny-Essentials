import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const target = TinyHtml.getById('target');
const resultDisplay = TinyHtml.getById('results');

function update() {
  const isPartial = target.isInViewport();
  const isFull = target.isScrolledIntoView();

  target.removeClass('visible-partial', 'visible-full');

  if (isFull) {
    target.addClass('visible-full');
    resultDisplay.setText('Fully Visible in Viewport');
  } else if (isPartial) {
    target.addClass('visible-partial');
    resultDisplay.setText('Partially Visible in Viewport');
  } else {
    resultDisplay.setText('Not Visible in Viewport');
  }
}

window.addEventListener('scroll', update);
window.addEventListener('resize', update);
window.addEventListener('load', update);
