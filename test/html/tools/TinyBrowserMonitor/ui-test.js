/**
 * @file ui-test.js
 * Bridge logic for testing TinyBrowserMonitor.
 * Refactored to use granular event updates for real-time performance.
 */

import { TinyBrowserMonitor } from '/src/v1/libs/tools/TinyBrowserMonitor.mjs';

window.TinyBrowserMonitor = TinyBrowserMonitor;

// --- DOM Elements ---
const btnInit = document.getElementById('btn-init');
const btnReport = document.getElementById('btn-report');
const btnDestroy = document.getElementById('btn-destroy');
const btnClear = document.getElementById('btn-clear-console');

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

const statBatteryLevel = document.getElementById('stat-battery-level');
const statBatteryCharging = document.getElementById('stat-battery-charging');
const statDeviceMem = document.getElementById('stat-device-mem');
const statDeviceCpu = document.getElementById('stat-device-cpu');
const statDeviceGpu = document.getElementById('stat-device-gpu');
const statMemUsed = document.getElementById('stat-mem-used');
const statMemTotal = document.getElementById('stat-mem-total');
const statMemLimit = document.getElementById('stat-mem-limit');
const statFps = document.getElementById('stat-fps');
const statLcp = document.getElementById('stat-lcp');
const statCls = document.getElementById('stat-cls');

const eventTicker = document.getElementById('event-ticker');

// --- State ---
let monitor = null;

// --- UI Update Functions (Granular) ---

const updateConnectivityUI = (connectivity) => {
  statOnline.textContent = connectivity.isOnline ? 'ONLINE' : 'OFFLINE';
  statOnline.style.color = connectivity.isOnline ? 'var(--success)' : 'var(--accent-danger)';
};

const updateQualityUI = (quality) => {
  statDownlink.textContent = `${quality.downlink} Mbps`;
  statRtt.textContent = `${quality.rtt} ms`;
  statType.textContent = quality.effectiveType.toUpperCase();
};

const updateBatteryUI = (battery) => {
  if (battery.enabled) {
    statBatteryLevel.textContent = `${(battery.level * 100).toFixed(0)}%`;
    statBatteryCharging.textContent = battery.charging ? 'Charging' : 'Discharging';
  } else {
    statBatteryLevel.textContent = '--';
    statBatteryCharging.textContent = '--';
  }
};

const updateDeviceUI = (device) => {
  if (device.enabled) {
    statDeviceMem.textContent = `${device.memory} GB`;
    statDeviceCpu.textContent = `${device.cpu.logicalCores} Cores`;
    statDeviceGpu.textContent = `${device.gpu.renderer}`;
  }
};

const updateMemoryUI = (memoryUsage) => {
  if (memoryUsage.enabled) {
    const h = monitor.getFormattedMemoryUsage('MB', memoryUsage);
    statMemUsed.textContent = `${h.used.toFixed(2)} MB`;
    statMemTotal.textContent = `${h.total.toFixed(2)} MB`;
    statMemLimit.textContent = `${h.limit.toFixed(2)} MB`;
  }
};

const updateFPSUI = (fps) => {
  statFps.textContent = `${fps.fps} FPS`;
};

const updateLCPUI = (lcp) => {
  statLcp.textContent = `${lcp.toFixed(0)} ms`;
};

const updateLayoutShiftUI = (data) => {
  statCls.textContent = data.layoutShift.toFixed(4);
};

const updateResourceTable = (resources) => {
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
 * Master update function for initial load or full state sync.
 */
const updateFullDashboard = (data) => {
  updateConnectivityUI(data.connectivity);
  updateQualityUI(data.quality);
  updateBatteryUI(data.battery);
  updateDeviceUI(data.device);
  updateMemoryUI(data.memoryUsage);
  updateResourceTable(data.resources);

  if (data.performance) {
    updateFPSUI(data.performance.fps);
    updateLCPUI(data.performance.lcp);
    statCls.textContent = data.performance.layoutShift.toFixed(4);
  }
};

// --- Logging & Ticker ---

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

const updateEventTicker = (eventName) => {
  eventTicker.textContent = `Last Event: ${eventName}`;
  eventTicker.classList.remove('flash');
  void eventTicker.offsetWidth;
  eventTicker.classList.add('flash');
};

// --- Monitor Lifecycle ---

const initMonitor = () => {
  try {
    const resourceLimit = parseInt(document.getElementById('input-resource-limit').value, 10);
    const memoryIntervalMs = parseInt(document.getElementById('input-memory-interval').value, 10);

    logToConsole(`Initializing TinyBrowserMonitor (Limit: ${resourceLimit})...`, 'system');

    monitor = new TinyBrowserMonitor({ resourceLimit, memoryIntervalMs });
    window.networkMonitor = monitor;

    // 1. Listen for high-frequency/granular events
    monitor.on('FPS', (fps) => {
      updateFPSUI(fps);
    });

    monitor.on('MemoryUsage', (memory) => {
      updateMemoryUI(memory);
    });

    monitor.on('BatteryUpdated', (battery) => {
      updateBatteryUI(battery);
      updateEventTicker('BatteryUpdated');
    });

    monitor.on('LcpUpdated', (data) => {
      updateLCPUI(data.lcp);
      updateEventTicker('LCP');
    });

    monitor.on('LayoutShiftUpdated', (data) => {
      updateLayoutShiftUI(data);
      updateEventTicker('LayoutShift');
    });

    monitor.on('WindowResize', (windowMetrics) => {
      updateEventTicker('WindowResize');
      // Window/Screen metrics are usually handled via the full update or specific listeners if added
    });

    // 2. Listen for Resource lifecycle
    monitor.on('ResourceAdded', (old, newItem) => {
      logToConsole(`Resource Added: ${newItem.name}`, 'data');
      updateResourceTable(monitor.resources);
    });
    monitor.on('ResourceDeleted', (old, newItem) => {
      logToConsole(`Resource Deleted: ${old.name}`, 'data');
      updateResourceTable(monitor.resources);
    });
    monitor.on('ResourceEdited', (old, newItem) => {
      logToConsole(`Resource Edited: ${newItem.name}`, 'data');
      updateResourceTable(monitor.resources);
    });

    // 3. Listen for general lifecycle
    monitor.on('Destroyed', () => {
      logToConsole('Monitor destroyed successfully.', 'system');
      statusIndicator.textContent = 'System Idle';
      statusIndicator.style.color = 'var(--accent-secondary)';
      eventTicker.textContent = 'System Idle';
    });

    // 4. The "God Event" for full synchronization and initial load
    monitor.on('NetworkUpdated', (data) => {
      updateFullDashboard(data);
      // Log non-UI events to console for debugging
      logToConsole(`Event Captured: NetworkUpdated`, 'system');
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
  logToConsole('Triggering resource load...', 'system');
  try {
    // Fetching a small asset with no-cache to ensure PerformanceObserver catches it
    await fetch('https://www.google.com/favicon.ico', { mode: 'no-cors', cache: 'no-store' });
  } catch (e) {
    logToConsole('Fetch failed: ' + e.message, 'error');
  }
};

const testStressLimit = async () => {
  if (monitor) monitor.destroy();
  logToConsole('Starting Stress Test: Limit = 5', 'system');

  // Initialize with a very low limit
  monitor = new TinyBrowserMonitor({ resourceLimit: 5 });

  // Re-attach all listeners for the new instance
  initMonitor(); // Re-running init is a quick way to re-bind everything in this test script

  // Rapidly load resources to force FIFO
  for (let i = 0; i < 7; i++) {
    await fetch(`${location.origin}/test/html/files/pudding.json?test=${(i % 10) + 1}`, {
      cache: 'no-store',
    });
    // Small delay to allow observer to process
    await new Promise((r) => setTimeout(r, 100));
  }
};

// --- Event Listeners ---
btnInit.addEventListener('click', initMonitor);
btnReport.addEventListener('click', () => {
  if (monitor) logToConsole(monitor.performance, 'data'); // Just a sample report
});
btnDestroy.addEventListener('click', () => {
  if (monitor) {
    monitor.destroy();
    monitor = null;
    btnInit.disabled = false;
    btnReport.disabled = true;
    btnDestroy.disabled = true;
    btnSimResource.disabled = false; // Keep sim enabled for testing
    btnStressLimit.disabled = false;
  }
});
btnSimResource.addEventListener('click', simulateResourceLoad);
btnStressLimit.addEventListener('click', testStressLimit);
btnTestError.addEventListener('click', () => {
  logToConsole('Attempting invalid instantiation...', 'system');
  try {
    // Passing object instead of positional arguments
    new TinyBrowserMonitor({ resourceLimit: -5 });
  } catch (error) {
    logToConsole(`Caught Expected Error: ${error.message}`, 'error');
  }
});
btnClear.addEventListener('click', () => {
  consoleOutput.innerHTML = '';
});
