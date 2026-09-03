import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
import { TinyDragger } from '/src/v1/libs/html/drag/TinyDragger.mjs';
import * as tinyCollisions from '/src/v1/basics/collision.mjs';
Object.assign(window, tinyCollisions);
window.TinyHtml = TinyHtml;
window.TinyDragger = TinyDragger;
TinyHtml.elemDebug = true;

const box = TinyHtml.getById('box');
const wall = TinyHtml.getById('wall');
const dragger = new TinyDragger(box.get(0), { jail: document.body, mirrorElem: false });
dragger.addCollidable(wall.get(0));

window.box = box;
window.wall = wall;

const dragging = () => {
  const colliding = box.isCollWithLock(wall, 'bottom'); // change 'right' if needed
  box.toggleClass('colliding', colliding);

  const rect1 = box.get(0).getBoundingClientRect();
  const rect2 = wall.get(0).getBoundingClientRect();

  const details = getElsCollDetails(rect1, rect2);
  console.log('DETAILS', details.depth, details.dirs, details.isNeg);
  // console.log('CENTER', getElsRelativeCenterOffset(rect1, rect2));
  // console.log('DEPTH', getElsCollDirDepth(rect1, rect2));
};

window.dragging = dragging;
box.on('drag', dragging);
box.on('dragging', dragging);
box.on('drop', dragging);
