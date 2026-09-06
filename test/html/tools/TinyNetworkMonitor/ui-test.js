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
 * @param {import('./TinyNetworkMonitor.js').NetworkReport} report
 */
const updateDashboard = (report) => {
  // Update Connectivity
  statOnline.textContent = report.connectivity.isOnline ? 'ONLINE' : 'OFFLINE';
  statOnline.style.color = report.connectivity.isOnline ? 'var(--success)' : 'var(--accent-danger)';

  // Update Quality
  statDownlink.textContent = `${report.quality.downlink} Mbps`;
  statRtt.textContent = `${report.quality.rtt} ms`;
  statType.textContent = report.quality.effectiveType.toUpperCase();

  // Update Resources
  resourceTbody.innerHTML = '';
  report.resources.forEach((res) => {
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
 * @param {Object} data - The data object emitted by the monitor.
 */
const handleNetworkUpdate = (data) => {
  logToConsole('Network update received.', 'success');
  updateDashboard(data.report);
};

/**
 * Initializes the monitor.
 */
const initMonitor = () => {
  try {
    logToConsole('Initializing TinyNetworkMonitor...', 'system');

    monitor = new TinyNetworkMonitor((data) => {
      // This is the callback provided to the constructor
      // It's redundant with the event emitter, but we use it for logging
    });

    window.networkMonitor = monitor;

    // Attach event listeners to the instance
    monitor.on('NetworkUpdate', handleNetworkUpdate);
    monitor.on('Destroyed', () => {
      logToConsole('Monitor destroyed successfully.', 'system');
      statusIndicator.textContent = 'System Idle';
      statusIndicator.style.color = 'var(--accent-secondary)';
    });

    // UI State Update
    btnInit.disabled = true;
    btnReport.disabled = false;
    btnDestroy.disabled = false;
    statusIndicator.textContent = 'Monitoring Active';
    statusIndicator.style.color = 'var(--success)';

    // Initial log
    logToConsole('Monitor active and listening.', 'info');
  } catch (error) {
    logToConsole(error.message, 'error');
  }
};

// Event Listeners for UI
btnInit.addEventListener('click', initMonitor);

btnReport.addEventListener('click', () => {
  if (monitor) {
    try {
      const report = monitor.report;
      logToConsole(report, 'data');
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
  }
});

btnClear.addEventListener('click', () => {
  consoleOutput.innerHTML = '';
});
