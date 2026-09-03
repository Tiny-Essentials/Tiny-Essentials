import { TinyIframeEvents } from '../src/v1/libs/html/events/TinyIframeEvents.mjs';

const iframe = document.getElementById('myIframe');

const events = new TinyIframeEvents({
  targetIframe: iframe,
});

events.secretEventName = '__PUDDING__';
window.frameEvents = events;

// Ouve evento vindo do iframe
events.on('win:hello:fromIframe', (payload, meta) => {
  log('📩 Received from iframe:', payload);
  console.log('parent', payload, meta);
});

// Envia mensagem para o iframe ao clicar
document.getElementById('sendToIframe').onclick = () => {
  events.winEmit('hello:fromParent', {
    timestamp: new Date().toISOString(),
    message: 'Olá iframe!',
  });
};

function log(...args) {
  const out = document.getElementById('log');
  const p = document.createElement('p');
  p.textContent = args.map((a) => JSON.stringify(a)).join(' ');
  out.appendChild(p);
}
