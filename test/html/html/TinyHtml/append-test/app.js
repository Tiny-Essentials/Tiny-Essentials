import * as tinyHtml from '/src/v1/basics/html.mjs';
import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
Object.assign(window, tinyHtml);
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const yay = document.getElementById('yay');
function createNode(content) {
  const el = document.createElement('div');
  el.className = 'box highlight';
  el.textContent = content;
  yay.append(el);
  return el;
}

const tA = TinyHtml.getById('targetA');
const tB = TinyHtml.getById('targetB');
const tC = TinyHtml.getById('targetC');

const tqA = $(document.getElementById('qtargetA'));
const tqB = $(document.getElementById('qtargetB'));
const tqC = $(document.getElementById('qtargetC'));

/////////////////////////////////////////////

window.tA = tA;
window.tB = tB;
window.tC = tC;

window.tqA = tqA;
window.tqB = tqB;
window.tqC = tqC;

////////////////////////////////////////////////
// append and prepend

document.getElementById('btnAppend').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Appended to A'));
  const el2 = $(createNode('Appended to A'));
  tA.append(el);
  tqA.append(el2);
});

document.getElementById('btnPrepend').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Prepended to A'));
  const el2 = $(createNode('Prepended to A'));
  tA.prepend(el);
  tqA.prepend(el2);
});

////////////////////////////////////////////////
// after and before

document.getElementById('btnBefore').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Before C'));
  const el2 = $(createNode('Before C'));
  tC.before(el);
  tqC.before(el2);
});

document.getElementById('btnAfter').addEventListener('click', () => {
  const el = new TinyHtml(createNode('After C'));
  const el2 = $(createNode('After C'));
  tC.after(el);
  tqC.after(el2);
});

////////////////////////////////////////////////
// insertBefore and insertAfter

document.getElementById('btnInsertBefore').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Inserted before B'));
  const el2 = $(createNode('Inserted before B'));
  el.insertBefore(tB);
  el2.insertBefore(tqB);
});

document.getElementById('btnInsertAfter').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Inserted after B'));
  const el2 = $(createNode('Inserted after B'));
  el.insertAfter(tB);
  el2.insertAfter(tqB);
});

////////////////////////////////////////////////////
// replaceWith and replaceAll

document.getElementById('btnReplaceWith').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Replacing A'));
  const el2 = $(createNode('Replacing A'));
  tA.replaceWith(el);
  tqA.replaceWith(el2);
});

document.getElementById('btnReplaceAll').addEventListener('click', () => {
  const el = new TinyHtml(createNode('Replaced All'));
  const el2 = $(createNode('Replaced All'));
  el.replaceAll([tA, tB, tC]);
  el2.replaceAll([tqA, tqB, tqC]);
});

//////////////////////////////////////////////////
// appendTo and prependTo

document.getElementById('btnAppendTo').addEventListener('click', () => {
  const el = new TinyHtml(createNode('AppendedTo to B'));
  const el2 = $(createNode('AppendedTo to B'));
  el.appendTo(tB);
  el2.appendTo(tqB.get(0));
});

document.getElementById('btnPrependTo').addEventListener('click', () => {
  const el = new TinyHtml(createNode('PrependTo to B'));
  const el2 = $(createNode('PrependTo to B'));
  el.prependTo(tB);
  el2.prependTo(tqB.get(0));
});
