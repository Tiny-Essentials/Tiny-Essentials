import { TinyTimeout } from '/src/v1/libs/math/TinyTimeout.mjs';
window.TinyTimeout = TinyTimeout;

let instance = null;
let data = {};

function init() {
  const cooldown = parseInt(document.getElementById('cooldownInterval').value, 10);
  const autoChange = document.getElementById('autoConfigChange').checked;

  if (instance) instance.destroy();
  instance = new TinyTimeout({
    cooldownWatcherTime: cooldown,
    allowAutoConfigChange: autoChange,
  });
  data = {};
  document.getElementById('visualizer').innerHTML = '';
  document.getElementById('idStates').innerHTML = '';
  document.getElementById('instanceStatus').textContent = 'Active';
}

function destroy() {
  if (instance) {
    instance.destroy();
    instance = null;
    document.getElementById('instanceStatus').textContent = 'Destroyed';
  }
}

function trigger() {
  if (!instance) return alert('Instance not initialized!');
  const id = document.getElementById('testId').value.trim();
  const value = parseInt(document.getElementById('testValue').value, 10);
  const limitInput = document.getElementById('testLimit').value.trim();
  const limit = limitInput !== '' ? parseInt(limitInput, 10) : null;

  if (!id) return alert('Enter an ID');
  if (!Number.isFinite(value)) return alert('Invalid value');

  if (!data[id]) {
    const wrapper = document.createElement('div');
    wrapper.id = `wrap-${id}`;
    wrapper.innerHTML = `
          <div class="row">
            <span><strong>${id}</strong></span>
            <div class="bar-container">
              <div class="bar" id="bar-${id}" style="width:0%"></div>
            </div>
            <span id="label-${id}">0</span>
          </div>
        `;
    document.getElementById('visualizer').appendChild(wrapper);
    data[id] = 0;
  }

  const start = performance.now();
  instance.set(
    id,
    () => {
      const delay = performance.now() - start;
      data[id]++;
      document.getElementById(`label-${id}`).textContent = `${delay.toFixed(0)}ms`;
      const bar = document.getElementById(`bar-${id}`);
      const width = Math.min(100, delay / 10);
      bar.style.width = `${width}%`;
    },
    value,
    limit,
  );
}

async function pollDemo() {
  if (!instance) return alert('Init instance first.');
  let counter = 0;
  const target = document.getElementById('pollResult');
  target.textContent = 'Polling...';
  setTimeout(() => (counter = 5), 3000);
  await instance.waitForTrue(() => counter === 5);
  target.textContent = '✅ Condition met (counter = 5)';
}

window.init = init;
window.destroy = destroy;
window.trigger = trigger;
window.pollDemo = pollDemo;
