import { TinyNewWinEvents } from '../src/v1/libs/html/events/TinyNewWinEvents.mjs';

const log = (msg) => {
  document.querySelector('#log').textContent += msg + '\n';
};

document.querySelector('#open').addEventListener('click', () => {
  window.conn = new TinyNewWinEvents({ url: 'child.html', name: 'pudding' });

  window.conn.on('win:pong', (payload) => {
    log('Received pong: ' + JSON.stringify(payload));
  });

  window.conn.onClose(() => {
    log('Child window was closed');
  });
});

document.querySelector('#send').addEventListener('click', () => {
  if (window.conn) {
    window.conn.winEmit('ping', { from: 'main', time: Date.now() });
    log('Sent ping to child');
  } else {
    log('Connection not established.');
  }
});
