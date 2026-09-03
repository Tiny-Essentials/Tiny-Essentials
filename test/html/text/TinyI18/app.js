import { TinyI18 } from '/src/v1/libs/text/TinyI18.mjs';
import * as clock from '/src/v1/basics/clock.mjs';
window.TinyI18 = TinyI18;
Object.assign(window, clock);

// --- Setup TinyI18 in local mode for demo ---
const i18 = new TinyI18({
  strict: true,
  mode: 'local',
  defaultLocale: 'en',
});
window.i18 = i18;

// Register helpers
i18.registerHelper('richList', ({ items = [] }) =>
  items.map((x, i) => `#${i + 1}: ${x}`).join(', '),
);
i18.registerHelper('uppercase', (data) => {
  const { text } = data;
  console.log(`Uppercase Debug:`, data);
  return String(text).toUpperCase();
});

// Load local locales
i18.loadLocaleLocal('en', {
  app: { title: 'Inventory', items: '{count} items' },
  interpolation: '{name} has {count} items',
  regexTest: {
    match: { $pattern: /^user\.\d+$/, value: 'Matched user ID', elseValue: 'Non-matched' },
  },
  ui: {
    list: (params) => `List:\n- ${params.items?.join('\n- ')}`,
    menu: { settings: { title: 'Settings Panel' } },
  },
  fnHelper: { $fn: 'richList', args: { value: 'This func is a fhHelper.' } },
  uppercaseExample: { $fn: 'uppercase', args: { value: 'This func is a uppercaseExample.' } },
});

i18.loadLocaleLocal('pt', {
  app: { title: 'Inventário', items: '{count} itens' },
  interpolation: '{name} possui {count} itens',
  regexTest: {
    match: {
      $pattern: /^user\.\d+$/,
      value: 'ID de usuário correspondido',
      elseValue: 'Não correspondido',
    },
  },
  ui: {
    list: (params) => `Lista:\n- ${params.items?.join('\n- ')}`,
    menu: { settings: { title: 'Painel de Configurações' } },
  },
  fnHelper: { $fn: 'richList', args: { value: 'Esta função é um fhHelper.' } },
  uppercaseExample: {
    $fn: 'uppercase',
    args: { value: 'Esta função é um uppercaseExample.' },
  },
});

i18.loadLocaleLocal('es', {
  app: { title: 'Inventario', items: '{count} elementos' },
  interpolation: '{name} tiene {count} elementos',
  regexTest: {
    match: {
      $pattern: /^user\.\d+$/,
      value: 'ID de usuario coincidente',
      elseValue: 'No coincidente',
    },
  },
  ui: {
    list: (params) => `Lista:\n- ${params.items?.join('\n- ')}`,
    menu: { settings: { title: 'Panel de Configuración' } },
  },
  fnHelper: { $fn: 'richList', args: { value: 'Esta función es un fhHelper.' } },
  uppercaseExample: {
    $fn: 'uppercase',
    args: { value: 'Esta función es un uppercaseExample.' },
  },
});

// DOM Elements
const elLang = document.getElementById('current-lang');
const resTitle = document.getElementById('res-title');
const resItems = document.getElementById('res-items');
const resFallback = document.getElementById('res-fallback');
const resRegex = document.getElementById('res-regex');
const resFn = document.getElementById('res-fn');
const resFnHelper = document.getElementById('res-fn-helper');
const resInterpolation = document.getElementById('res-interpolation');
const resNested = document.getElementById('res-nested');
const resError = document.getElementById('res-error');
const resStats = document.getElementById('res-stats');

// Render function
function renderAll() {
  elLang.textContent = i18.currentLocale || '(default only)';
  resTitle.textContent = i18.t('app.title');
  resItems.textContent = i18.t('app.items', { count: 5 });
  resFallback.textContent = i18.t('app.items', { count: 3 });
  resRegex.textContent = i18.p('user.123');
  resFn.textContent = i18.t('ui.list', { items: ['Apple', 'Banana', 'Cherry'] });
  resFnHelper.textContent = i18.t('fnHelper');
  resInterpolation.textContent = i18.t('interpolation', { name: 'Alice', count: 7 });
  resNested.textContent = i18.t('ui.menu.settings.title');

  try {
    resError.textContent = i18.t('nonexistent.key');
  } catch (e) {
    resError.textContent = e.message;
  }
}

// Language buttons
document.querySelectorAll('.lang-buttons button').forEach((btn) => {
  btn.addEventListener('click', async () => {
    await i18.setLocale(btn.dataset.lang || null);
    renderAll();
  });
});

// Stats button
document.getElementById('btn-stats').addEventListener('click', () => {
  resStats.textContent = JSON.stringify(i18.stats, null, 2);
});

// Initial render
renderAll();
