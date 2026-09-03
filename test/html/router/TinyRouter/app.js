import { TinyRouter } from '/src/v1/libs/router/TinyRouter.mjs';

// --- Seletores de UI ---
const el = {
  path: document.getElementById('display-path'),
  params: document.getElementById('display-params'),
  query: document.getElementById('display-query'),
  url: document.getElementById('display-url'),
  log: document.getElementById('event-log'),
  manualQuery: document.getElementById('manual-query'),
};

// --- Funções de UI ---
function log(message, data = null) {
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  const time = new Date().toLocaleTimeString();
  entry.innerHTML = `<span>[${time}]</span> <strong>${message}</strong>${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}`;
  el.log.prepend(entry);
}

function updateUI(match) {
  el.path.textContent = match.path;
  el.params.textContent = JSON.stringify(match.params, null, 2);
  el.query.textContent = match.query.toString() || 'none';
  el.url.textContent = window.location.href;
}

// --- Inicialização do Roteador ---
const router = new TinyRouter({
  debugMode: true,
  useLogColors: true,
  onRouteChanged: (match) => {
    log(`Route Changed: ${match.path}`, match);
    updateUI(match);
  },
});

window.router = router;

// --- Registro de Rotas de Teste ---
router.add('/', (match) => {
  log('Matched: Home');
});

router.add('/settings', (match) => {
  log('Matched: Settings');
});

router.add('/search', (match) => {
  log('Matched: Search');
});

// Rota com parâmetros dinâmicos
router.add('/:host/images/:id', (match) => {
  log('Matched: Image Viewer', match.params);
});

router.add('/:host/profiles/:username', (match) => {
  log('Matched: Profile', match.params);
});

// Inicia o roteador
router.start();

// --- Event Listeners dos Botões ---
document.getElementById('btn-home').onclick = () => router.navigate('/');
document.getElementById('btn-settings').onclick = () => router.navigate('/settings');
document.getElementById('btn-search').onclick = () => router.navigate('/search?q=anime');

document.getElementById('btn-manual-search').onclick = () => {
  const q = el.manualQuery.value;
  router.navigate(`/search?q=${encodeURIComponent(q)}`);
};

document.getElementById('btn-img').onclick = () => {
  // Simula navegação para uma imagem de um booru específico
  router.navigate('/derpibooru.org/images/987654321');
};

document.getElementById('btn-prof').onclick = () => {
  router.navigate('/derpibooru.org/profiles/user_test');
};

document.getElementById('btn-clear-log').onclick = () => {
  el.log.innerHTML = '<div class="log-entry"><span>[System]</span> Log cleared.</div>';
};
