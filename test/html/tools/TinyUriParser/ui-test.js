/**
 * Bridge Logic for TinyUriParser Testing Environment.
 * Connects the UI components to the TinyUriParser class.
 */

import { TinyUriParser } from '/src/v1/libs/tools/TinyUriParser.mjs';
import { MatrixProtocolParsers } from '/src/v1/libs/tools/TinyUriParser/MatrixProtocol.mjs';

window.TinyUriParser = TinyUriParser;
window.MatrixProtocolParsers = MatrixProtocolParsers;

// 1. Initialize the parser with the custom map
const parser = new TinyUriParser(...MatrixProtocolParsers);
window.parser = parser;

// DOM Elements
const inputField = document.getElementById('uri-input');
const runBtn = document.getElementById('run-btn');
const exampleBtn = document.getElementById('example-btn');
const clearBtn = document.getElementById('clear-btn');
const consoleOutput = document.getElementById('console-output');
const statusDot = document.getElementById('status-dot');

/**
 * Updates the visual console with formatted data.
 * @param {Error} err - Whether the data represents an error.
 * @param {any} [data] - The data to display.
 */
const updateConsole = (err, data = null) => {
  if (err) {
    consoleOutput.textContent = `[ERROR] ${err.name || 'Error'}: ${err.message}`;
    consoleOutput.classList.add('text-error');
    consoleOutput.classList.remove('text-success');
    statusDot.style.backgroundColor = 'var(--error)';
  } else {
    consoleOutput.textContent = JSON.stringify(data, null, 2);
    consoleOutput.classList.remove('text-error');
    consoleOutput.classList.add('text-success');
    statusDot.style.backgroundColor = 'var(--success)';
  }
};

/**
 * Executes the parser on the current input.
 * Displays both the parsed object and the reconstructed URI string for debugging.
 */
const executeParse = () => {
  const uriValue = inputField.value.trim();

  if (!uriValue) {
    updateConsole({ message: 'Input is empty. Please provide a URI.' });
    return;
  }

  try {
    // 1. Perform the parsing
    const parsedResult = parser.parse(uriValue);

    // 2. Perform the reconstruction (stringify) using the parsed result
    const reconstructedUri = parser.stringify(parsedResult);

    // 3. Wrap both results in a single object to display them together in the console
    updateConsole(null, {
      parsed: parsedResult,
      reconstructed: reconstructedUri,
    });
  } catch (error) {
    // If either parse() or stringify() throws an error, it will be caught here.
    updateConsole(error);
  }
};

// Event Listeners
runBtn.addEventListener('click', executeParse);

exampleBtn.addEventListener('click', () => {
  const examples = [
    'https://matrix.to/#/@yasmin:pony.house',

    'matrix:u/@yasmin:pony.house',

    'mxc://matrix.org/abc123def456',

    '#tinyhouse:pony.house',
    'matrix:r/tinyhouse:pony.house',

    '!friendship:pony.house',
    'matrix:roomid/friendship:pony.house?via=elsewhere.ca',

    // '$event_abc123 in !friendship:pony.house',
    'matrix:roomid/friendship:pony.house/e/event?via=elsewhere.ca',

    '@jasmindreasond:pony.house',
    'matrix:u/jasmindreasond:pony.house?action=chat',

    '#pony-party:pony.house',
    'https://matrix.to/#/%23pony-party:pony.house',

    '!friendship-club:pony.house',
    'https://matrix.to/#/!friendship-club:pony.house?via=elsewhere.ca',

    // $magic_moment in !friendship-club:pony.house
    'https://matrix.to/#/!friendship-club:pony.house/',

    '$magic_moment:pony.house?via=elsewhere.ca',

    '@jasmindreasond:pony.house',
    'https://matrix.to/#/@jasmindreasond:pony.house',

    '#pony-party:pony.house',
    'https://matrix.to/#/%23pony-party%3Apony.house',

    '!friendship-club:pony.house',
    'https://matrix.to/#/%21friendship-club%3Apony.house?via=elsewhere.ca',

    // $magic_moment in !friendship-club:pony.house
    'https://matrix.to/#/%21friendship-club%3Apony.house/',

    '@jasmindreasond:pony.house',
    'https://matrix.to/#/%40jasmindreasond%3Apony.house',
  ];
  // Pick a random example for testing
  const randomExample = examples[Math.floor(Math.random() * examples.length)];
  inputField.value = randomExample;
  executeParse();
});

clearBtn.addEventListener('click', () => {
  inputField.value = '';
  consoleOutput.textContent = 'Ready for execution...';
  consoleOutput.classList.remove('text-error', 'text-success');
  statusDot.style.backgroundColor = 'var(--text-secondary)';
});

// Allow "Enter" key in textarea to trigger execution (Shift+Enter for new line)
inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    executeParse();
  }
});
