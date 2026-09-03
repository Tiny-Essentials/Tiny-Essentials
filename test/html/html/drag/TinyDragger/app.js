import { TinyDragger } from '/src/v1/libs/html/drag/TinyDragger.mjs';
window.TinyDragger = TinyDragger;

document.addEventListener('DOMContentLoaded', () => {
  const box = document.getElementById('dragMe');
  const jail = document.getElementById('jail');

  const dragger = new TinyDragger(box, {
    jail: jail,
    multiCollision: true,
    lockInsideJail: true,
    collisionByMouse: false,
    revertOnDrop: false,
    vibration: {
      start: [30],
      move: [5],
      collide: [80],
      end: [20, 10, 20],
    },
  });

  const blocks = [
    { top: 200, left: 300 },
    { top: 50, left: 200 },
    { top: 120, left: 400 },
    { top: 300, left: 100 },
    { top: 250, left: 250 },
    { top: 100, left: 50 },
    { top: 200, left: 50 },
    { top: 50, left: 500 },
    { top: 300, left: 500 },
    { top: 180, left: 400 },
  ];

  const createBlock = (data) => {
    const block = document.createElement('div');
    block.style.top = `${data.top}px`;
    block.style.left = `${data.left}px`;
    block.classList.add('collidable');
    jail.appendChild(block);
    dragger.addCollidable(block);
  };

  for (const block of blocks) createBlock(block);

  box.addEventListener('drag', () => console.log('[drag] started'));
  box.addEventListener('dragging', () => console.log('[dragging] moving'));
  box.addEventListener('drop', (e) => {
    console.log('[drop]', e.detail);
  });
});
