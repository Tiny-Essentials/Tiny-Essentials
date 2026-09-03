import { TinyNotifyCenter } from '/src/v1/libs/html/notification/TinyNotifyCenter.mjs';
import { TinyToastNotify } from '/src/v1/libs/html/notification/TinyToastNotify.mjs';
window.TinyNotifyCenter = TinyNotifyCenter;
window.TinyToastNotify = TinyToastNotify;

document.addEventListener('DOMContentLoaded', () => {
  TinyNotifyCenter.insertTemplate();
  const notif = new TinyNotifyCenter();
  notif.setMarkAllAsReadOnClose(true);
  notif.add('You received a new message. A message full of pudding for you to eat daily.');
  notif.add({
    avatar: 'https://tantabuscdn.net/img/2025/4/27/47404/large.png',
    message: 'Your system was updated successfully.',
    title: 'The tiny system test.',
    onClick: () => {
      console.log('Tiny test event!');
      notif.close();
    },
  });
  notif.add('Scheduled task <i>completed</i>.', 'html');

  const toast = new TinyToastNotify('top', 'right', 3000, 60);
  toast.show('Mensagem rápida');
  toast.show('Mensagem um pouco mais longa que vai durar mais tempo...');
  toast.show({
    title: 'Heads up!',
    message: 'Something important happened.',
  });
  toast.show({
    html: true,
    avatar: 'https://tantabuscdn.net/img/2025/4/27/47404/large.png',
    title: 'Atenção',
    message: 'Clique para <i>abrir</i> o painel!',
    onClick: (e, close) => {
      console.log('Tiny click!');
      close();
    },
  });
});
