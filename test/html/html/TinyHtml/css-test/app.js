import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
import { installWindowHiddenScript } from '/src/v1/basics/html.mjs';
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;
window.installWindowHiddenScript = installWindowHiddenScript;

installWindowHiddenScript({
  onVisible: (data) => console.log(`Window visible status:`, data),
  onHidden: (data) => console.log(`Window hidden status:`, data),
});

const box = TinyHtml.getById('box');
window.box = box;
document.getElementById('set-style').addEventListener('click', () => {
  box.setStyle({ backgroundColor: 'tomato', borderRadius: '10px', borderStyle: 'dashed' });
});

document.getElementById('get-styles').addEventListener('click', () => {
  const val = box.style({ rawAttr: false, camelCase: true });
  alert(JSON.stringify(val));
});

document.getElementById('get-style').addEventListener('click', () => {
  const val = box.getStyle('backgroundColor');
  alert('backgroundColor: ' + val);
});

document.getElementById('remove-style').addEventListener('click', () => {
  box.removeStyle(['backgroundColor', 'borderRadius']);
});

document.getElementById('toggle-style').addEventListener('click', () => {
  box.toggleStyle('backgroundColor', 'tomato', 'skyblue');
});

document.getElementById('clear-style').addEventListener('click', () => {
  box.clearStyle();
});
