import { TinyIframeEvents } from '../src/v1/libs/html/events/TinyIframeEvents.mjs';

const events = new TinyIframeEvents();
events.secretEventName = '__PUDDING__';

// Envia mensagem ao parent
document.getElementById('sendToParent').onclick = () => {
  events.winEmit('hello:fromIframe', {
    timestamp: new Date().toISOString(),
    content: 'Oi parent!',
  });
};

// Ouve evento do parent
events.on('win:hello:fromParent', (payload, meta) => {
  log('📨 Received from parent:', payload);
  console.log('iframe', payload, meta);
});

function log(...args) {
  const out = document.getElementById('log');
  const p = document.createElement('p');
  p.textContent = args.map((a) => JSON.stringify(a)).join(' ');
  out.appendChild(p);
}
