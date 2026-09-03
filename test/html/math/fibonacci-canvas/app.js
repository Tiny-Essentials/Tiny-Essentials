import * as TinyNumbers from '/src/_/numbers.mjs';
import { genFibonacciSeq } from '/src/v1/basics/simpleMath.mjs';
window.genFibonacciSeq = genFibonacciSeq;
Object.assign(window, TinyNumbers);

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

window.draw = function () {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const baseA = parseInt(document.getElementById('baseA').value);
  const baseB = parseInt(document.getElementById('baseB').value);
  const length = parseInt(document.getElementById('length').value);

  const fib = genFibonacciSeq({
    baseValues: [baseA, baseB],
    length,
  });

  let x = canvas.width / 2;
  let y = canvas.height / 2;
  let angle = 0;

  ctx.strokeStyle = '#00ff88';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);

  for (let i = 0; i < fib.length; i++) {
    const dist = fib[i] * 5; // escala visual
    angle += Math.PI / 2; // 90° graus para criar espiral
    x += Math.cos(angle) * dist;
    y += Math.sin(angle) * dist;
    ctx.lineTo(x, y);
  }

  ctx.stroke();
};

draw();
