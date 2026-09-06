/**
 * @file ui-test.js
 * Bridge logic for testing TinyNetworkMonitor.
 */

import { TinyNetworkMonitor } from '/src/v1/libs/tools/TinyNetworkMonitor.mjs';

window.TinyNetworkMonitor = TinyNetworkMonitor;

// DOM Elements
const btnInit = document.getElementById('btn-init');
const btnReport = document.getElementById('btn-report');
const btnDestroy = document.getElementById('btn-destroy');
const btnClear = document.getElementById('btn-clear-console');

// Simulation Buttons
const btnSimResource = document.getElementById('btn-sim-resource');
const btnStressLimit = document.getElementById('btn-stress-limit');
const btnTestError = document.getElementById('btn-test-error');

const statOnline = document.getElementById('stat-online');
const statDownlink = document.getElementById('stat-downlink');
const statRtt = document.getElementById('stat-rtt');
const statType = document.getElementById('stat-type');
const resourceTbody = document.getElementById('resource-tbody');
const consoleOutput = document.getElementById('console-output');
const statusIndicator = document.getElementById('connection-status-indicator');

// State
let monitor = null;

/**
 * Logs messages to the UI visual console.
 * @param {string} message - The text to display.
 * @param {'info' | 'success' | 'error' | 'data' | 'system'} type - The log style.
 */
const logToConsole = (message, type = 'info') => {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  if (type === 'data') {
    entry.textContent = `[DATA] ${JSON.stringify(message, null, 2)}`;
  } else {
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  }

  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
};

/**
 * Updates the dashboard UI with the provided report.
 * @type {(data: import('./TinyNetworkMonitor.mjs').NetworkEvent) => void}
 */
const updateDashboard = ({ connectivity, quality, resources }) => {
  // Update Connectivity
  statOnline.textContent = connectivity.isOnline ? 'ONLINE' : 'OFFLINE';
  statOnline.style.color = connectivity.isOnline ? 'var(--success)' : 'var(--accent-danger)';

  // Update Quality
  statDownlink.textContent = `${quality.downlink} Mbps`;
  statRtt.textContent = `${quality.rtt} ms`;
  statType.textContent = quality.effectiveType.toUpperCase();

  // Update Resources
  resourceTbody.innerHTML = '';
  resources.forEach((res) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td title="${res.name}">${res.name.split('/').pop() || res.name}</td>
      <td>${res.duration.toFixed(2)}</td>
      <td>${res.entryType}</td>
    `;
    resourceTbody.appendChild(row);
  });
};

/**
 * Handles the 'NetworkUpdate' event.
 */
const handleNetworkUpdate = (data) => {
  logToConsole('Network update received.', 'success');
  updateDashboard(data);
};

/**
 * Handles specific resource events emitted by the monitor.
 */
const handleResourceEvent = (status, oldItem, newItem) => {
  logToConsole(`Resource Event: ${status}`, 'data');
  if (oldItem) logToConsole(`Old: ${oldItem.name}`, 'info');
  if (newItem) logToConsole(`New: ${newItem.name}`, 'info');
};

/**
 * Initializes the monitor.
 */
const initMonitor = (customLimit = 1000) => {
  try {
    logToConsole(`Initializing TinyNetworkMonitor (Limit: ${customLimit})...`, 'system');

    monitor = new TinyNetworkMonitor((data) => {
      // This is the callback provided to the constructor
      // It's redundant with the event emitter, but we use it for logging
    }, customLimit);

    window.networkMonitor = monitor;

    // Main Update Event
    monitor.on('NetworkUpdate', handleNetworkUpdate);

    // Resource Specific Events (Required for 100% coverage)
    monitor.on('ResourceAdded', (old, newItem) => handleResourceEvent('ADDED', old, newItem));
    monitor.on('ResourceDeleted', (old, newItem) => handleResourceEvent('DELETED', old, newItem));
    monitor.on('ResourceEdited', (old, newItem) => handleResourceEvent('EDITED', old, newItem));

    monitor.on('Destroyed', () => {
      logToConsole('Monitor destroyed successfully.', 'system');
      statusIndicator.textContent = 'System Idle';
      statusIndicator.style.color = 'var(--accent-secondary)';
    });

    // UI State Update
    btnInit.disabled = true;
    btnReport.disabled = false;
    btnDestroy.disabled = false;
    btnSimResource.disabled = false;
    btnStressLimit.disabled = false;

    statusIndicator.textContent = 'Monitoring Active';
    statusIndicator.style.color = 'var(--success)';

    // Initial log
    logToConsole('Monitor active and listening.', 'info');
  } catch (error) {
    logToConsole(error.message, 'error');
  }
};

// --- Simulation Logic ---

const simulateResourceLoad = async () => {
  if (!monitor) return;
  logToConsole('Triggering resource load (fetch)...', 'system');
  try {
    // Fetching a small asset with no-cache to ensure PerformanceObserver catches it
    await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
  } catch (e) {
    logToConsole(
      'Fetch failed (expected if CORS blocks, but observer might still trigger): ' + e.message,
      'error',
    );
  }
};

const testStressLimit = async () => {
  if (monitor) monitor.destroy();
  logToConsole('Starting Stress Test: Limit = 5', 'system');

  // Initialize with a very low limit
  monitor = new TinyNetworkMonitor(() => {}, 5);

  // Re-attach listeners for the new instance
  monitor.on('NetworkUpdate', handleNetworkUpdate);
  monitor.on('ResourceAdded', (old, newItem) => handleResourceEvent('ADDED', old, newItem));
  monitor.on('ResourceDeleted', (old, newItem) => handleResourceEvent('DELETED', old, newItem));
  monitor.on('ResourceEdited', (old, newItem) => handleResourceEvent('EDITED', old, newItem));

  // Rapidly load resources to force FIFO
  for (let i = 0; i < 7; i++) {
    await fetch(`${location.origin}/test/html/files/pudding.json?test=${(i % 10) + 1}`, {
      cache: 'no-store',
    });
    // Small delay to allow observer to process
    await new Promise((r) => setTimeout(r, 100));
  }
};

// --- Event Listeners for UI ---

btnInit.addEventListener('click', () => initMonitor());

btnReport.addEventListener('click', () => {
  if (monitor) {
    try {
      logToConsole(monitor.report, 'data');
    } catch (error) {
      logToConsole(error.message, 'error');
    }
  }
});

btnDestroy.addEventListener('click', () => {
  if (monitor) {
    monitor.destroy();
    monitor = null;
    btnInit.disabled = false;
    btnReport.disabled = true;
    btnDestroy.disabled = true;
    btnSimResource.disabled = true;
    btnStressLimit.disabled = true;
  }
});

btnSimResource.addEventListener('click', simulateResourceLoad);

btnStressLimit.addEventListener('click', testStressLimit);

btnTestError.addEventListener('click', () => {
  logToConsole('Attempting invalid instantiation...', 'system');
  try {
    // Test invalid resourceLimit
    new TinyNetworkMonitor(null, -5);
  } catch (error) {
    logToConsole(`Caught Expected Error: ${error.message}`, 'error');
  }
});

btnClear.addEventListener('click', () => {
  consoleOutput.innerHTML = '';
});
