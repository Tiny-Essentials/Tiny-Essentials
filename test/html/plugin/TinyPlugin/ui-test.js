/**
 * UI Test Bridge for TinyPlugin Module
 * This script connects the HTML controls to the exported functions.
 */

import { 
    signPluginIdentity, 
    createPluginIdChecker, 
    verifyPluginSignature 
} from '/src/v1/libs/plugin/TinyPlugin.mjs';

// --- DOM Elements ---
const elements = {
    // Inputs
    pluginId: document.getElementById('plugin-id'),
    pluginAuthors: document.getElementById('plugin-authors'),
    pluginCategories: document.getElementById('plugin-categories'),
    pluginTags: document.getElementById('plugin-tags'),
    accessMode: document.getElementById('access-mode'),
    signatureInput: document.getElementById('signature-input'),
    publicKeyDisplay: document.getElementById('public-key-display'),
    keyStatus: document.getElementById('key-status'),
    
    // Buttons
    btnGenerateChecker: document.getElementById('btn-generate-checker'),
    btnSignIdentity: document.getElementById('btn-sign-identity'),
    btnGenerateKey: document.getElementById('btn-generate-key'),
    btnVerify: document.getElementById('btn-verify'),
    btnClearConsole: document.getElementById('btn-clear-console'),

    // Console
    console: document.getElementById('console-output')
};

// --- State ---
let currentKeyPair = null;

// --- Utilities ---

/**
 * Logs messages to the visual console UI.
 * @param {string} message 
 * @param {'info' | 'success' | 'error' | 'system' | 'data'} type 
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
    authors: elements.pluginAuthors.value.split(',').map(s => s.trim()).filter(s => s),
    categories: elements.pluginCategories.value.split(',').map(s => s.trim()).filter(s => s),
    tags: elements.pluginTags.value.split(',').map(s => s.trim()).filter(s => s)
});

// --- Event Handlers ---

/**
 * Generates an RSASSA-PKCS1-v1_5 key pair for testing purposes.
 */
const handleGenerateKey = async () => {
    try {
        log('Generating RSASSA-PKCS1-v1_5 Key Pair...', 'system');
        currentKeyPair = await crypto.subtle.generateKey(
            {
                name: "RSASSA-PKCS1-v1_5",
                modulusLength: 2048,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: "SHA-256",
            },
            true,
            ["sign", "verify"]
        );

        const exportedPublic = await crypto.subtle.exportKey("spki", currentKeyPair.publicKey);
        const base64Public = bufferToBase64(exportedPublic);
        
        // Displaying the key in actual PEM format
        elements.publicKeyDisplay.value = toPEM(base64Public);
        elements.keyStatus.textContent = 'Key Generated (RSASSA-PKCS1-v1_5)';
        elements.keyStatus.style.color = 'var(--success-color)';
        
        log('Key pair generated successfully.', 'success');
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

        log(`Signing identity for: ${id}...`, 'system');
        
        const signature = await signPluginIdentity(
            id, 
            authors, 
            categories, 
            tags, 
            currentKeyPair.privateKey
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

        // Setup Mock Access Control for testing
        const mockAccessControl = {
            mode: mode,
            importKeyFormat: 'spki',
            importAlgorithm: { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
            cryptoAlgorithm: { name: 'RSASSA-PKCS1-v1_5' },
            publicKey: elements.publicKeyDisplay.value,
            whitelist: { ids: new Set(), authors: new Set(), categories: new Set(), tags: new Set() },
            blacklist: { ids: new Set(), authors: new Set(), categories: new Set(), tags: new Set() },
        };

        const verifiedPlugins = new Set();

        log(`Starting verification (Mode: ${mode})...`, 'system');

        const isValid = await verifyPluginSignature(
            mockAccessControl,
            verifiedPlugins,
            id,
            authors,
            categories,
            tags,
            base64Signature
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
elements.btnClearConsole.addEventListener('click', () => elements.console.innerHTML = '');

log('Test Suite Initialized. Please generate a key to begin.', 'system');