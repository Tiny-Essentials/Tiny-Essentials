/**
 * UI Test Bridge for TinyPlugin Module
 * This script connects the HTML controls to the exported functions and runs structural tests.
 */

import {
  signPluginIdentity,
  createPluginIdChecker,
  verifyPluginSignature,
  TinyPluginLayer,
  TinyPluginCore,
} from '/src/v1/libs/plugin/TinyPlugin.mjs';

// --- DOM Elements ---
const elements = {
  // Inputs
  pluginId: document.getElementById('plugin-id'),
  pluginAuthors: document.getElementById('plugin-authors'),
  pluginCategories: document.getElementById('plugin-categories'),
  pluginTags: document.getElementById('plugin-tags'),
  accessMode: document.getElementById('access-mode'),
  cryptoAlgorithm: document.getElementById('crypto-algorithm'),
  signatureInput: document.getElementById('signature-input'),
  publicKeyDisplay: document.getElementById('public-key-display'),
  keyStatus: document.getElementById('key-status'),

  // Buttons
  btnGenerateChecker: document.getElementById('btn-generate-checker'),
  btnSignIdentity: document.getElementById('btn-sign-identity'),
  btnGenerateKey: document.getElementById('btn-generate-key'),
  btnVerify: document.getElementById('btn-verify'),
  btnClearConsole: document.getElementById('btn-clear-console'),
  btnRunStructuralTests: document.getElementById('btn-run-structural-tests'),

  // Console
  console: document.getElementById('console-output'),
};

// --- State ---
let currentKeyPair = null;
let currentAlgorithm = null;

// --- Utilities ---

/**
 * Logs messages to the visual console UI.
 * @param {string} message
 * @param {'info' | 'success' | 'error' | 'system' | 'data' | 'test-pass' | 'test-fail'} type
 */
const log = (message, type = 'info') => {
  const entry = document.createElement('div');
  entry.className = `log-entry ${type}`;
  entry.textContent = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
  elements.console.appendChild(entry);
  elements.console.scrollTop = elements.console.scrollHeight;
};

/**
 * Converts an ArrayBuffer to a Base64 string for standard cryptographic display.
 * @param {ArrayBuffer} buffer
 * @returns {string}
 */
const bufferToBase64 = (buffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
};

/**
 * Wraps a Base64 string into a standard PEM format.
 * @param {string} base64
 * @param {string} label
 * @returns {string}
 */
const toPEM = (base64, label = 'PUBLIC KEY') => {
  const formatted = base64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${formatted}\n-----END ${label}-----`;
};

const getPluginData = () => ({
  id: elements.pluginId.value,
  authors: elements.pluginAuthors.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s),
  categories: elements.pluginCategories.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s),
  tags: elements.pluginTags.value
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s),
});

/**
 * Retorna os parâmetros corretos da Web Crypto API baseados no algoritmo escolhido.
 * @param {string} algoName
 */
const getAlgoConfig = (algoName) => {
  switch (algoName) {
    case 'RSASSA-PKCS1-v1_5':
      return {
        genParams: {
          name: 'RSASSA-PKCS1-v1_5',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        importParams: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        signParams: { name: 'RSASSA-PKCS1-v1_5' },
      };
    case 'RSA-PSS':
      return {
        genParams: {
          name: 'RSA-PSS',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        importParams: { name: 'RSA-PSS', hash: 'SHA-256' },
        signParams: { name: 'RSA-PSS', saltLength: 32 }, // RSA-PSS requer saltLength
      };
    case 'ECDSA':
      return {
        genParams: { name: 'ECDSA', namedCurve: 'P-256' },
        importParams: { name: 'ECDSA', namedCurve: 'P-256' }, // ECDSA precisa da curva para importar, não do hash
        signParams: { name: 'ECDSA', hash: { name: 'SHA-256' } }, // ECDSA precisa do hash na hora de assinar
      };
    default:
      throw new Error(`Algorithm not supported: ${algoName}`);
  }
};

// --- Structural Testing Runner ---

/**
 * Helper to create a valid installer that adheres to the Identity Contract.
 * @param {Object} identity - The identity to assign.
 * @param {Object} expectedOptions - Additional options for the installer.
 * @param {TinyPluginLayer} [forcedLayer] - If provided, returns this layer instead of creating a new one.
 * @returns {Function}
 */
const createValidInstaller = (identity, expectedOptions = {}, forcedLayer = null) => {
  return (sandbox, options) => {
    // 1. Mandatory Identity Assignment (The Identity Contract)
    sandbox.id = identity.id;
    sandbox.version = identity.version;
    sandbox.description = identity.description;
    sandbox.authors = identity.authors;
    sandbox.contributors = identity.contributors;
    sandbox.categories = identity.categories;
    sandbox.tags = identity.tags;

    // 2. Runtime Validation of Options (Rule 03)
    if (options && options.testProp && typeof options.testProp !== 'string') {
      throw new TypeError('testProp must be a string');
    }

    // 3. Return the Layer (Mandatory!)
    if (forcedLayer) return forcedLayer;
    return new TinyPluginLayer();
  };
};

/**
 * Dummy Engine class specifically for testing, following RULE 02 (The Extension Pattern).
 */
class TestEngine extends TinyPluginCore {
  constructor(config = {}) {
    super({
      logCfg: config.logCfg || { id: '[test]', logger: console, debugMode: false },
      sandboxBlacklist: config.sandboxBlacklist,
      accessControl: config.accessControl || { mode: 'none' },
    });
  }
}

/**
 * Runs a suite of structural tests to verify the integrity of the TinyPlugin system.
 */
const runStructuralTests = async () => {
  log('Starting Structural Test Suite...', 'system');
  let passed = 0;
  let failed = 0;

  /**
   * Helper to execute a test case.
   * @param {string} name
   * @param {() => Promise<void> | void} testFn
   */
  const runTest = async (name, testFn) => {
    try {
      await testFn();
      log(`[PASS] ${name}`, 'test-pass');
      passed++;
    } catch (err) {
      log(`[FAIL] ${name}: ${err.message}`, 'test-fail');
      failed++;
    }
  };

  // --- TEST 1: Identity Contract & Lifecycle ---
  await runTest('Identity Contract: Should fail if properties are missing', async () => {
    const core = new TestEngine();

    // Incomplete identity (missing description to force a validation failure)
    const invalidInstaller = (sandbox, options) => {
      sandbox.id = 'bad.plugin';
      sandbox.version = '1.0.0';
      // Missing description intentionally
      sandbox.authors = ['Tester'];
      sandbox.contributors = ['Tester'];
      sandbox.categories = ['Test'];
      sandbox.tags = ['Test'];
      return new TinyPluginLayer();
    };

    try {
      // Correct usage: engine.installPlugin(InstallerFunction, options)
      core.installPlugin(invalidInstaller, {});
      throw new Error('Core allowed a plugin with missing identity properties!');
    } catch (e) {
      if (!e.message.includes('not set') && !e.message.toLowerCase().includes('description')) {
        throw e;
      }
    }
  });

  await runTest('Lifecycle: Successful installation and readiness', async () => {
    const core = new TestEngine();
    const identity = {
      id: 'valid.plugin',
      version: '1.0.0',
      description: 'Valid Plugin',
      authors: ['Tester'],
      contributors: ['Tester'],
      categories: ['Test'],
      tags: ['Test'],
    };

    // Correct usage instead of TinyPlugin._addModuleToCore
    const plugin = core.installPlugin(createValidInstaller(identity), {});

    if (!plugin.isReady) throw new Error('Plugin should be ready after installation.');
    if (core.getPlugin('valid.plugin') !== plugin) throw new Error('Plugin not found in core.');
  });

  // --- TEST 2: Outbound Protection (Engine Proxy) ---
  await runTest('Outbound Protection: Sandbox Blacklist on Engine', async () => {
    const core = new TestEngine({
      sandboxBlacklist: {
        get: ['pluginsSize'],
        set: [],
      },
    });

    const identity = {
      id: 'proxy.test',
      version: '1.0.0',
      description: 'Proxy Test',
      authors: ['Tester'],
      contributors: ['Tester'],
      categories: ['Test'],
      tags: ['Test'],
    };

    const plugin = core.installPlugin(createValidInstaller(identity), {});
    const engineProxy = plugin.engine; // Access via dynamic proxy

    try {
      engineProxy.pluginsSize;
      throw new Error('Sandbox allowed access to a blacklisted engine property.');
    } catch (e) {
      // Engine Proxy must throw a Security Error on blacklisted property read
      if (!e.message.includes('Security Error')) throw e;
    }
  });

  // --- TEST 3: Inbound Protection (Engine Filter) ---
  await runTest('Inbound Protection: Whitelist Mode', async () => {
    const core = new TestEngine({
      accessControl: {
        mode: 'whitelist',
        whitelist: { ids: ['allowed.id'], authors: [], categories: [], tags: [] },
        blacklist: { ids: [], authors: [], categories: [], tags: [] },
      },
    });

    const idAllowed = {
      id: 'allowed.id',
      version: '1.0.0',
      description: 'A',
      authors: ['A'],
      contributors: ['A'],
      categories: ['A'],
      tags: ['A'],
    };
    const pAllowed = core.installPlugin(createValidInstaller(idAllowed), {});

    try {
      const idUnauthorized = {
        id: 'unauthorized.id',
        version: '1.0.0',
        description: 'B',
        authors: ['B'],
        contributors: ['B'],
        categories: ['B'],
        tags: ['B'],
      };
      core.installPlugin(createValidInstaller(idUnauthorized), {});

      // The Engine Filter intercepts this call
      pAllowed.getPlugin('unauthorized.id');
      throw new Error('Whitelist allowed access to an unauthorized plugin.');
    } catch (e) {
      if (!e.message.includes('Security Error')) throw e;
    }
  });

  await runTest('Inbound Protection: Blacklist Mode', async () => {
    const core = new TestEngine({
      accessControl: {
        mode: 'blacklist',
        blacklist: { ids: ['blocked.id'], authors: [], categories: [], tags: [] },
        whitelist: { ids: [], authors: [], categories: [], tags: [] },
      },
    });

    try {
      const idBlocked = {
        id: 'blocked.id',
        version: '1.0.0',
        description: 'B',
        authors: ['B'],
        contributors: ['B'],
        categories: ['B'],
        tags: ['B'],
      };
      core.installPlugin(createValidInstaller(idBlocked), {});

      const idOther = {
        id: 'other.id',
        version: '1.0.0',
        description: 'O',
        authors: ['O'],
        contributors: ['O'],
        categories: ['O'],
        tags: ['O'],
      };
      const pOther = core.installPlugin(createValidInstaller(idOther), {});

      // In blacklist mode, specific identities are blocked from being retrieved
      pOther.getPlugin('blocked.id');
      throw new Error('Blacklist allowed access to a blocked plugin.');
    } catch (e) {
      if (!e.message.includes('Security Error')) throw e;
    }
  });

  log(`Structural Test Suite Finished. Passed: ${passed}, Failed: ${failed}`, 'system');
};

// --- Event Handlers ---

/**
 * Generates an key pair for testing purposes.
 */
const handleGenerateKey = async () => {
  try {
    const algoName = elements.cryptoAlgorithm.value;
    currentAlgorithm = algoName;
    const config = getAlgoConfig(algoName);

    log(`Generating ${algoName} Key Pair...`, 'system');

    currentKeyPair = await crypto.subtle.generateKey(config.genParams, true, ['sign', 'verify']);

    const exportedPublic = await crypto.subtle.exportKey('spki', currentKeyPair.publicKey);
    const base64Public = bufferToBase64(exportedPublic);

    // Displaying the key in actual PEM format
    elements.publicKeyDisplay.value = toPEM(base64Public);
    elements.keyStatus.textContent = `Key Generated (${algoName})`;
    elements.keyStatus.style.color = 'var(--success-color)';

    log(`Key pair generated successfully using ${algoName}.`, 'success');
  } catch (err) {
    log(`Key Generation Failed: ${err.message}`, 'error');
  }
};

/**
 * Generates the deterministic identity string.
 */
const handleGenerateChecker = () => {
  try {
    const { id, authors, categories, tags } = getPluginData();
    if (!id) throw new Error('Plugin ID is required.');

    const checkerString = createPluginIdChecker(id, authors, categories, tags);
    log(`Identity String Generated:\n${checkerString}`, 'data');
  } catch (err) {
    log(err.message, 'error');
  }
};

/**
 * Signs the identity using the generated private key.
 */
const handleSignIdentity = async () => {
  try {
    const { id, authors, categories, tags } = getPluginData();

    if (!currentKeyPair) throw new Error('No private key available. Generate one first.');
    if (!id) throw new Error('Plugin ID is required.');

    const config = getAlgoConfig(currentAlgorithm);

    log(`Signing identity for: ${id} with ${currentAlgorithm}...`, 'system');
    const signature = await signPluginIdentity(
      id,
      authors,
      categories,
      tags,
      currentKeyPair.privateKey,
      config.signParams,
    );

    const base64Signature = bufferToBase64(signature);
    log(`Signature (Base64):\n${base64Signature}`, 'success');
    elements.signatureInput.value = base64Signature;
  } catch (err) {
    log(`Signing Failed: ${err.message}`, 'error');
  }
};

/**
 * Verifies a signature against the current configuration.
 */
const handleVerify = async () => {
  try {
    const { id, authors, categories, tags } = getPluginData();
    const base64Signature = elements.signatureInput.value.trim();
    const mode = elements.accessMode.value;

    if (!base64Signature) throw new Error('Signature required for verification.');
    if (!currentAlgorithm) throw new Error('No algorithm context found. Generate a key first.');

    const config = getAlgoConfig(currentAlgorithm);
    const mockAccessControl = {
      mode: mode,
      importKeyFormat: 'spki',
      importAlgorithm: config.importParams,
      cryptoAlgorithm: config.signParams,
      publicKey: elements.publicKeyDisplay.value,
      whitelist: { ids: new Set(), authors: new Set(), categories: new Set(), tags: new Set() },
      blacklist: { ids: new Set(), authors: new Set(), categories: new Set(), tags: new Set() },
    };

    const verifiedPlugins = new Set();

    log(`Starting verification (Mode: ${mode}, Algo: ${currentAlgorithm})...`, 'system');

    const isValid = await verifyPluginSignature(
      mockAccessControl,
      verifiedPlugins,
      id,
      authors,
      categories,
      tags,
      base64Signature,
    );

    if (isValid) {
      log('VERIFICATION SUCCESSFUL: The signature is valid.', 'success');
    } else {
      log('VERIFICATION FAILED: Signature mismatch or invalid key.', 'error');
    }
  } catch (err) {
    log(`Verification Process Error: ${err.message}`, 'error');
  }
};

// --- Initialization ---

elements.btnGenerateKey.addEventListener('click', handleGenerateKey);
elements.btnGenerateChecker.addEventListener('click', handleGenerateChecker);
elements.btnSignIdentity.addEventListener('click', handleSignIdentity);
elements.btnVerify.addEventListener('click', handleVerify);
elements.btnClearConsole.addEventListener('click', () => (elements.console.innerHTML = ''));
elements.btnRunStructuralTests.addEventListener('click', runStructuralTests);

elements.cryptoAlgorithm.addEventListener('change', () => {
  currentKeyPair = null;
  currentAlgorithm = null;
  elements.keyStatus.textContent = 'Algorithm changed. Please generate a new key.';
  elements.keyStatus.style.color = 'var(--text-color)';
  elements.publicKeyDisplay.value = '';
  elements.signatureInput.value = '';
});

log('Test Suite Initialized. Please select an algorithm and generate a key to begin.', 'system');
