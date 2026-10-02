/**
 * Bridge Logic for TinyUriParser Testing Environment.
 * Connects the UI components to the TinyUriParser class.
 */

import { TinyUriParser } from '/src/v1/libs/tools/TinyUriParser.mjs';
import { MatrixProtocolParsers } from '/src/v1/libs/tools/TinyUriParser/MatrixProtocol.mjs';
import { DiscordProtocolParsers } from '/src/v1/libs/tools/TinyUriParser/Discord.mjs';
import { BlueSkyProtocolParsers } from '/src/v1/libs/tools/TinyUriParser/BlueSky.mjs';

/**
 * A curated collection of example URIs, grouped by the protocol they exercise.
 * @type {Record<'matrix' | 'discord' | 'bluesky', string[]>}
 */
const EXAMPLES = {
  matrix: [
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
  ],
  discord: [
    '<@123456789012345678>',
    '<@!123456789012345678>',
    '<@&123456789012345678>',
    '<#123456789012345678>',
    '<@$1402418491272986635>',
    '<id:customize>',
    '<id:browse>',
    '<id:guide>',
    '<id:linked-roles>',
    '<id:linked-roles:123456789012345678>',
    '<:party_pony:123456789012345678>',
    '<a:party_pony:123456789012345678>',
    '<t:1618953630>',
    '<t:1618953630:R>',
    '</play:123456789012345678>',
    '</play music:123456789012345678>',
    '</foo group bar:123456789012345678>',
    'https://discord.gg/XXXXXXXXXX',
    'https://discord.gg/customname',
    'https://discord.com/invite/XXXXXXXXXX',
    'https://discord.gg/XXXXXXXXXX?utm_source=Discord&utm_medium=social',
    'https://discord.com/channels/123456789012345678/987654321098765432/111111111111111111',
    'https://discord.com/channels/123456789012345678/987654321098765432/111111111111111111?jump=1',
    'https://discord.com/channels/@me/987654321098765432/111111111111111111',,
    'https://discord.com/channels/@me/987654321098765432/111111111111111111?jump=1',
  ],
  bluesky: [
    'alice.bsky.social',
    'did:plc:z72i7hdynmk6r22z27h6tvur',
    'did:web:example.com',
    'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.post/3k2abcd',
    'https://bsky.app/profile/alice.bsky.social',
    'https://bsky.app/profile/alice.bsky.social/post/3k2abcd',
    'https://bsky.app/profile/alice.bsky.social/feed/3k2abcd',
  ],
};

// Expose the classes and parsers on the window object for manual debugging.
window.TinyUriParser = TinyUriParser;
window.MatrixProtocolParsers = MatrixProtocolParsers;
window.DiscordProtocolParsers = DiscordProtocolParsers;
window.BlueSkyProtocolParsers = BlueSkyProtocolParsers;

// 1. Initialize the parser with the combined list of protocol parsers.
//    Order matters: the first parser whose predicate returns `true` wins.
const parser = new TinyUriParser(
  ...MatrixProtocolParsers,
  ...DiscordProtocolParsers,
  ...BlueSkyProtocolParsers,
);
window.parser = parser;

// DOM Elements
const inputField = document.getElementById('uri-input');
const runBtn = document.getElementById('run-btn');
const clearBtn = document.getElementById('clear-btn');
const consoleOutput = document.getElementById('console-output');
const statusDot = document.getElementById('status-dot');
const exampleButtons = document.querySelectorAll('[data-protocol]');

/**
 * Updates the visual console with formatted data.
 * @param {Error | null} err - The error to display, or `null` on success.
 * @param {unknown} [data] - The data to display when no error occurred.
 * @returns {void}
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
 * @returns {void}
 */
const executeParse = () => {
  const uriValue = inputField.value.trim();

  if (!uriValue) {
    updateConsole({ name: 'InputError', message: 'Input is empty. Please provide a URI.' });
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

/**
 * Picks a random example for the given protocol and immediately parses it.
 * @param {string} protocol - The protocol key (e.g., 'matrix', 'discord', 'bluesky').
 * @returns {void}
 */
const loadExample = (protocol) => {
  const pool = EXAMPLES[protocol];
  if (!pool || pool.length === 0) return;
  inputField.value = pool[Math.floor(Math.random() * pool.length)];
  executeParse();
};

// Event Listeners
runBtn.addEventListener('click', executeParse);

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    loadExample(button.dataset.protocol);
  });
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
