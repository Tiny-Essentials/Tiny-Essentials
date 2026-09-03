// --- PASTE YOUR CLASS HERE OR IMPORT IT ---
// For this single-file demonstration, I am including the class directly.
// In a real environment, you would use: import TinySiteMap from './TinySiteMap.js';
import { TinySiteMap } from '/src/v1/libs/tools/TinySiteMap.mjs';

// --- TEST SUITE LOGIC ---

window.TinySiteMap = TinySiteMap;
let generator = null;
let xmlEditor = null;

const log = (msg, type = 'info') => {
  const consoleEl = document.getElementById('console');
  const div = document.createElement('div');
  div.className = `log-entry log-${type}`;
  div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  consoleEl.appendChild(div);
  consoleEl.scrollTop = consoleEl.scrollHeight;
};

const updateStateDisplay = () => {
  const stateEl = document.getElementById('instance-state');
  if (generator) {
    stateEl.textContent = `Type: ${generator.type}\nEntries: ${generator.entries.length}\nBase: ${generator.baseUrl}`;
  } else {
    stateEl.textContent = 'No instance active.';
  }
};

// Initialize CodeMirror Editor for XML
window.addEventListener('DOMContentLoaded', () => {
  xmlEditor = CodeMirror(document.getElementById('xml-editor-container'), {
    mode: 'xml',
    theme: 'dracula',
    readOnly: true,
    lineNumbers: true,
    minimap: false,
  });
});

window.loadTemplate = (type) => {
  const jsonArea = document.getElementById('data-json');
  const typeSelect = document.getElementById('cfg-type');
  typeSelect.value = type;

  if (type === 'normal') {
    jsonArea.value = JSON.stringify(
      [
        { loc: '/home', lastmod: '2023-10-27T10:00:00Z', priority: 1.0 },
        { loc: '/about', changefreq: 'monthly' },
        { loc: '/contact', customTags: { 'example:contactType': 'support' } },
      ],
      null,
      2,
    );
  } else {
    jsonArea.value = JSON.stringify(
      [{ loc: '/sitemap-pages.xml' }, { loc: '/sitemap-posts.xml' }],
      null,
      2,
    );
  }
  log(`Template '${type}' loaded into editor.`, 'info');
};

window.runGenerate = () => {
  try {
    const config = {
      baseUrl: document.getElementById('cfg-base-url').value,
      type: document.getElementById('cfg-type').value,
      maxResolvedUrlSize: parseInt(document.getElementById('cfg-max-size').value),
      entries: JSON.parse(document.getElementById('data-json').value),
      namespaceStrategy: TinySiteMap.kaliStrategy,
    };

    generator = new TinySiteMap(config);
    window.env = generator;
    const xml = generator.generateXml();

    // Update the CodeMirror editor
    xmlEditor.setValue(xml);

    log('XML generated successfully.', 'success');
    updateStateDisplay();
  } catch (e) {
    log(`${e.name}: ${e.message}`, 'error');
    xmlEditor.setValue('ERROR: ' + e.message);
  }
};

window.runAdd = () => {
  if (!generator) return log('Generate XML first to create instance.', 'error');
  try {
    const data = JSON.parse(document.getElementById('data-json').value);
    // Add a dummy entry based on the last item's structure
    const template = data[0] || { loc: '/new' };
    generator.addEntry({ ...template, loc: (template.loc + '/new').replace('//', '/') });
    log('Entry added successfully.', 'success');
    runGenerate(); // Refresh view
    updateStateDisplay();
  } catch (e) {
    log(`${e.name}: ${e.message}`, 'error');
  }
};

window.runUpdate = () => {
  if (!generator) return log('Generate XML first to create instance.', 'error');
  try {
    const data = JSON.parse(document.getElementById('data-json').value);
    generator.updateEntry(0, data[0]);
    log('Entry 0 updated.', 'success');
    runGenerate();
    updateStateDisplay();
  } catch (e) {
    log(`${e.name}: ${e.message}`, 'error');
  }
};

window.runRemove = () => {
  if (!generator) return log('Generate XML first to create instance.', 'error');
  try {
    generator.removeEntry(0);
    log('Entry 0 removed.', 'success');
    runGenerate();
    updateStateDisplay();
  } catch (e) {
    log(`${e.name}: ${e.message}`, 'error');
  }
};

window.runMove = () => {
  if (!generator) return log('Generate XML first to create instance.', 'error');
  try {
    generator.moveEntry(0, 1);
    log('Moved entry 0 to index 1.', 'success');
    runGenerate();
    updateStateDisplay();
  } catch (e) {
    log(`${e.name}: ${e.message}`, 'error');
  }
};

// Init
window.loadTemplate('normal');
