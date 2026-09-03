import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const scrollXSpan = document.getElementById('scrollX');
const scrollYSpan = document.getElementById('scrollY');
const boxXSpan = document.getElementById('boxX');
const boxYSpan = document.getElementById('boxY');
const targetBox = document.getElementById('targetBox');

const boxContainer = TinyHtml.getById('boxContainer');
const tinyWin = new TinyHtml(window);

function updateInfoPanel() {
  scrollXSpan.textContent = window.scrollX;
  scrollYSpan.textContent = window.scrollY;
  const rect = targetBox.getBoundingClientRect();
  boxXSpan.textContent = Math.round(rect.left);
  boxYSpan.textContent = Math.round(rect.top);
}

window.runScroll = function () {
  const x = parseInt(document.getElementById('x').value);
  const y = parseInt(document.getElementById('y').value);
  const duration = parseInt(document.getElementById('duration').value);
  const easing = document.getElementById('easing').value;
  tinyWin.scrollToXY({
    targetX: x,
    targetY: y,
    duration,
    easing,
    onAnimation: console.log,
  });
};

window.runScrollBox = function () {
  const x = parseInt(document.getElementById('x').value);
  const y = parseInt(document.getElementById('y').value);
  const duration = parseInt(document.getElementById('duration').value);
  const easing = document.getElementById('easing').value;
  boxContainer.scrollToXY({
    targetX: x,
    targetY: y,
    duration,
    easing,
    onAnimation: console.log,
  });
};

window.logScrollInfo = function () {
  updateInfoPanel();
  console.table({
    scrollX: window.scrollX,
    scrollY: window.scrollY,
    boxLeft: targetBox.getBoundingClientRect().left,
    boxTop: targetBox.getBoundingClientRect().top,
  });
};

setInterval(updateInfoPanel, 200);
