import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';

const box = TinyHtml.getById('box');
const jBox = $('#jbox');

window.TinyHtml = TinyHtml;
window.box = box;
window.jBox = jBox;
TinyHtml.elemDebug = true;

window.box.on('tinyhtml.stylechanged', (event) => console.log(event.detail));
window.box.on('tinyhtml.classchanged', (event) => console.log(event.detail));

// Slide controls
TinyHtml.getById('slideDownBtn').on('click', () => {
  console.log(box.slideDown());
  jBox.slideDown();
});
TinyHtml.getById('slideUpBtn').on('click', () => {
  console.log(box.slideUp());
  jBox.slideUp();
});
TinyHtml.getById('slideToggleBtn').on('click', () => {
  console.log(box.slideToggle());
  jBox.slideToggle();
});

// Fade controls
TinyHtml.getById('fadeInBtn').on('click', () => {
  console.log(box.fadeIn());
  jBox.fadeIn();
});
TinyHtml.getById('fadeOutBtn').on('click', () => {
  console.log(box.fadeOut());
  jBox.fadeOut();
});
TinyHtml.getById('fadeToggleBtn').on('click', () => {
  console.log(box.fadeToggle());
  jBox.fadeToggle();
});

// Hover test
const hoverBtn = TinyHtml.getById('hoverBtn');
hoverBtn.hover(
  () => console.log('Hovered in!'),
  () => console.log('Hovered out!'),
);
