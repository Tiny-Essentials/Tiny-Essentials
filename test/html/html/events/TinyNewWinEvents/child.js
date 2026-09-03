import { TinyNewWinEvents } from '../src/v1/libs/html/events/TinyNewWinEvents.mjs';

const log = (msg) => {
  document.querySelector('#log').textContent += msg + '\n';
};

window.conn = new TinyNewWinEvents();

conn.on('win:ping', (payload) => {
  log('Received ping: ' + JSON.stringify(payload));
  conn.winEmit('pong', { from: 'child', receivedAt: Date.now() });
});

conn.onClose(() => {
  log('Main window was closed');
});
