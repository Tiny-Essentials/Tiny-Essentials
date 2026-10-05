/**
 * @file ui-test.js
 * Bridge logic for the TinyThrottledApi Testing Environment.
 */

import TinyThrottledApi from '/src/v1/libs/utils/TinyThrottledApi.mjs';
import TinyTimeout from '/src/v1/libs/math/TinyTimeout.mjs';

window.TinyThrottledApi = TinyThrottledApi;
window.TinyTimeout = TinyTimeout;

const tm = new TinyTimeout();
const tFetch = new TinyThrottledApi(2, fetch, tm);
window.tFetch = tFetch;

/**
 * @typedef {Object} UIState
 * @property {TinyThrottledApi|null} apiInstance - The current instance of the throttled API.
 * @property {Function} mockApi - The simulated API function.
 */

/** @type {UIState} */
const state = {
  apiInstance: null,
  mockApi: null,
};

// --- DOM Elements ---
const elements = {
  // Config
  concurrencyLimit: document.getElementById('concurrency-limit'),
  timeoutValue: document.getElementById('timeout-value'),
  timeoutLimit: document.getElementById('timeout-limit'),
  btnInit: document.getElementById('btn-init'),

  // Mock
  mockDelay: document.getElementById('mock-delay'),
  mockFail: document.getElementById('mock-fail'),

  // Execution
  apiArgs: document.getElementById('api-args'),
  btnExecute: document.getElementById('btn-execute'),

  // Stats
  statActive: document.getElementById('stat-active'),
  statQueued: document.getElementById('stat-queued'),

  // Console
  consoleOutput: document.getElementById('console-output'),
  btnClearConsole: document.getElementById('btn-clear-console'),
};

/**
 * Logs a message to the visual console.
 * @param {string} message - The text to display.
 * @param {'info' | 'success' | 'error' | 'system'} type - The visual style.
 */
function log(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;

  const timestamp = new Date().toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  entry.textContent = `[${timestamp}] ${message}`;

  elements.consoleOutput.appendChild(entry);
  elements.consoleOutput.scrollTop = elements.consoleOutput.scrollHeight;
}

/**
 * Updates the numeric dashboard.
 */
function updateDashboard() {
  if (!state.apiInstance) return;

  elements.statActive.textContent = state.apiInstance.activeCount;
  elements.statQueued.textContent = state.apiInstance.queuedCount;
}

/**
 * Initializes the TinyThrottledApi instance with provided settings.
 */
function initializeApi() {
  try {
    const limit = parseInt(elements.concurrencyLimit.value, 10);
    const tValue = parseInt(elements.timeoutValue.value, 10);
    const tLimit = parseInt(elements.timeoutLimit.value, 10);

    // Define the Mock API
    state.mockApi = async (...args) => {
      const delay = parseInt(elements.mockDelay.value, 10) || 0;
      const shouldFail = elements.mockFail.checked;

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (shouldFail) {
            reject(new Error('Simulated API Error'));
          } else {
            resolve({
              status: 200,
              data: args,
              message: 'Success',
            });
          }
        }, delay);
      });
    };

    // Create instance
    state.apiInstance = new TinyThrottledApi(limit, state.mockApi, tm);

    // Apply optional timeout settings if user provided them
    state.apiInstance.timeoutValue = tValue;
    state.apiInstance.timeoutLimit = tLimit;

    log(`API Initialized. Limit: ${limit}, Delay: ${tValue}ms`, 'system');
    elements.btnExecute.disabled = false;
    updateDashboard();
  } catch (err) {
    log(`Initialization failed: ${err.message}`, 'error');
    elements.btnExecute.disabled = true;
  }
}

/**
 * Handles the execution of a single test case.
 */
async function executeTest() {
  if (!state.apiInstance) return;

  let args;
  try {
    args = JSON.parse(elements.apiArgs.value);
    if (!Array.isArray(args)) throw new TypeError('Arguments must be a JSON Array');
  } catch (err) {
    log(`Invalid JSON Arguments: ${err.message}`, 'error');
    return;
  }

  log(`Executing request with args: ${JSON.stringify(args)}`, 'info');

  try {
    // We await the exec call. Because exec returns a promise that resolves
    // when the task is actually performed, we can track the lifecycle.
    const result = await state.apiInstance.exec(...args);
    log(`Result: ${JSON.stringify(result)}`, 'success');
  } catch (err) {
    log(`Execution Error: ${err.message}`, 'error');
  } finally {
    updateDashboard();
  }
}

// --- Event Listeners ---

elements.btnInit.addEventListener('click', initializeApi);

elements.btnExecute.addEventListener('click', executeTest);

elements.btnClearConsole.addEventListener('click', () => {
  elements.consoleOutput.innerHTML = '';
  log('Console cleared', 'system');
});

// Polling for dashboard updates to ensure real-time feel
setInterval(updateDashboard, 100);
