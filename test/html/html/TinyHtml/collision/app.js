import * as tinyHtml from '/src/v1/basics/html.mjs';
import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
import * as tinyCollisions from '/src/v1/basics/collision.mjs';
Object.assign(window, tinyCollisions);
Object.assign(window, tinyHtml);
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const fixed = TinyHtml.getById('fixed');
const colliding = TinyHtml.getById('colliding');

window.tinyFixed = fixed;
window.tinyColliding = colliding;

let isDragging = false;
let offsetX = 0;
let offsetY = 0;

colliding.on('mousedown', (e) => {
  isDragging = true;
  offsetX = e.offsetX;
  offsetY = e.offsetY;
  colliding.get(0).style.cursor = 'grabbing';
});

document.addEventListener('mouseup', () => {
  isDragging = false;
  colliding.get(0).style.cursor = 'grab';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;

  const containerRect = document.getElementById('container').getBoundingClientRect();
  let x = e.clientX - containerRect.left - offsetX;
  let y = e.clientY - containerRect.top - offsetY;

  const collStyle = colliding.get(0).style;
  collStyle.left = `${x}px`;
  collStyle.top = `${y}px`;

  const collided = colliding.isCollWith(fixed);
  colliding.toggleClass('colliding', collided);
});
