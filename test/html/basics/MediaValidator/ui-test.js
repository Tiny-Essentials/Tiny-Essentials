/**
 * UI TEST BRIDGE LOGIC
 *
 * This script acts as the connection between the HTML UI and the
 * media-validator.js module.
 *
 * NOTE: Because we are in a browser, we use "Mocks" to simulate Node.js
 * environments for 'sharp', 'stream', and 'file-type'.
 */

import {
  validateMagicNumbers,
  validateImage,
  validateAudioVideo,
} from '/src/v1/webTemplates/media/MediaValidator/v1/Browser/index.mjs';

// --- DOM Elements ---
const consoleOutput = document.getElementById('console-output');
const expectedTypeSelect = document.getElementById('expected-type');
const fileInputMagic = document.getElementById('file-input-magic');
const fileInputImage = document.getElementById('file-input-image');
const fileInputAV = document.getElementById('file-input-av');

// --- UI Helper: Logging ---
/**
 * Logs messages to the visual console in the UI.
 * @param {string} message - The text to display.
 * @param {'info' | 'success' | 'error'} type - The style of the log.
 */
function logToConsole(message, type = 'info') {
  const entry = document.createElement('div');
  entry.className = `log-entry log-${type}`;

  // Timestamp for clarity
  const timestamp = new Date().toLocaleTimeString([], {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  entry.textContent = `[${timestamp}] ${message}`;
  consoleOutput.appendChild(entry);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

document.getElementById('btn-clear').addEventListener('click', () => {
  consoleOutput.innerHTML = '';
});

// --- Test Handlers ---

/**
 * Executes the Magic Number validation test.
 * Uses the File's own type property to simulate the detection result.
 */
async function runMagicNumberTest() {
  const file = fileInputMagic.files[0];
  if (!file) {
    logToConsole('Please select a file first.', 'error');
    return;
  }

  logToConsole(`Starting Magic Number Validation for: ${file.name}...`, 'info');

  try {
    // Simulamos o comportamento do 'file-type' usando o tipo que o navegador detectou no arquivo
    const fileTypeFromBuffer = async (buffer) => {
      return { mime: file.type };
    };

    const buffer = await file.arrayBuffer();
    const expectedType = expectedTypeSelect.value;

    const mime = await validateMagicNumbers({
      inputData: buffer,
      expectedType,
      fileTypeFromBuffer,
    });

    logToConsole(`Success! Detected MIME: ${mime}`, 'success');
  } catch (err) {
    logToConsole(`Validation Failed: ${err.message}`, 'error');
  }
}

/**
 * Executes the Image validation test.
 */
async function runImageTest() {
  const file = fileInputImage.files[0];
  if (!file) {
    logToConsole('Please select an image file.', 'error');
    return;
  }

  logToConsole(`Starting Image Structural Validation: ${file.name}...`, 'info');

  try {
    const result = await validateImage({
      inputData: file,
      mimeType: file.type,
    });

    if (result.error) {
      logToConsole(`Error: ${result.error}`, 'error');
    } else {
      logToConsole(`Success! Metadata: ${JSON.stringify(result.data)}`, 'success');
    }
  } catch (err) {
    logToConsole(`Unexpected Error: ${err.message}`, 'error');
  }
}

/**
 * Executes the Audio/Video validation test.
 */
async function runAudioVideoTest() {
  const file = fileInputAV.files[0];
  if (!file) {
    logToConsole('Please select an audio/video file.', 'error');
    return;
  }

  logToConsole(`Starting Audio/Video Validation: ${file.name}...`, 'info');

  try {
    const result = await validateAudioVideo({
      inputData: file,
      mimeType: file.type,
    });

    if (result.error) {
      logToConsole(`Error: ${result.error}`, 'error');
    } else {
      logToConsole(`Success! Duration: ${result.data.duration.toFixed(2)}s`, 'success');
    }
  } catch (err) {
    logToConsole(`Unexpected Error: ${err.message}`, 'error');
  }
}

// --- Event Listeners ---
document.getElementById('btn-magic').addEventListener('click', runMagicNumberTest);
document.getElementById('btn-image').addEventListener('click', runImageTest);
document.getElementById('btn-audio').addEventListener('click', runAudioVideoTest);
