/**
 * Bridge Logic for TinyUriParser Testing Environment.
 * Connects the UI components to the TinyUriParser class.
 */

import { TinyUriParser } from '/src/v1/libs/tools/TinyUriParser.mjs';
import * as MatrixProtocol from '/src/v1/libs/tools/TinyUriParser/MatrixProtocol.mjs';
import * as Discord from '/src/v1/libs/tools/TinyUriParser/Discord.mjs';
import * as BlueSky from '/src/v1/libs/tools/TinyUriParser/BlueSky.mjs';

const { MatrixProtocolParsers } = MatrixProtocol;
const { DiscordProtocolParsers } = Discord;
const { BlueSkyProtocolParsers } = BlueSky;

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
    'https://discord.com/channels/@me/987654321098765432/111111111111111111',
    'https://discord.com/channels/@me/987654321098765432/111111111111111111?jump=1',

    // CDN assets
    'https://cdn.discordapp.com/emojis/123456789012345678.png',
    'https://cdn.discordapp.com/icons/123456789012345678/abc123def456.png?size=128',
    'https://cdn.discordapp.com/splashes/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/discovery-splashes/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/banners/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/embed/avatars/0.png',
    'https://cdn.discordapp.com/avatars/123456789012345678/a_abc123def456.webp',
    'https://cdn.discordapp.com/guilds/123456789012345678/users/987654321098765432/avatars/abc123def456.png',
    'https://cdn.discordapp.com/guilds/123456789012345678/users/987654321098765432/banners/abc123def456.png',
    'https://cdn.discordapp.com/avatar-decoration-presets/abc123def456.png',
    'https://cdn.discordapp.com/app-icons/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/app-assets/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/app-assets/123456789012345678/achievements/987654321098765432/icons/abc123def456.png',
    'https://cdn.discordapp.com/app-assets/123456789012345678/store/abc123def456',
    'https://cdn.discordapp.com/app-assets/710982414301790216/store/abc123def456.png',
    'https://cdn.discordapp.com/team-icons/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/stickers/123456789012345678.png',
    'https://media.discordapp.net/stickers/123456789012345678.gif',
    'https://cdn.discordapp.com/role-icons/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/guild-events/123456789012345678/abc123def456.png',
    'https://cdn.discordapp.com/guild-tag-badges/123456789012345678/abc123def456.png',

    // Attachments
    'https://cdn.discordapp.com/attachments/123456789012345678/987654321098765432/report.pdf',
    'https://cdn.discordapp.com/attachments/123456789012345678/987654321098765432/SPOILER_cat.png',
    'https://cdn.discordapp.com/attachments/123456789012345678/987654321098765432/archive.tar.gz',
    'https://media.discordapp.net/attachments/123456789012345678/987654321098765432/photo.webp?ex=6600000000&is=65fe8e80&hm=abc123',
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

/**
 * A single selectable example, flattened from {@link EXAMPLES}.
 * @typedef {Object} ExampleReference
 * @property {number} id - Position of the example inside the flattened list.
 * @property {string} protocol - Protocol group the example belongs to.
 * @property {string} uri - The raw URI string injected into the textarea.
 */

/**
 * Flattened, index-addressable version of {@link EXAMPLES}.
 * @type {ExampleReference[]}
 */
const EXAMPLE_REFERENCES = [];

for (const [protocol, uris] of Object.entries(EXAMPLES)) {
  for (const uri of uris) {
    EXAMPLE_REFERENCES.push({ id: EXAMPLE_REFERENCES.length, protocol, uri });
  }
}

// Expose the classes and parsers on the window object for manual debugging.
window.TinyUriParser = TinyUriParser;
Object.assign(window, MatrixProtocol);
Object.assign(window, Discord);
Object.assign(window, BlueSky);

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
const exampleSelect = document.getElementById('example-select');
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
 * Writes an example into the textarea, syncs the `<select>` and runs the parser.
 * @param {ExampleReference} reference - The example to load.
 * @returns {void}
 */
const loadExample = (reference) => {
  exampleSelect.value = String(reference.id);
  inputField.value = reference.uri;
  executeParse();
};

/**
 * Picks a random example for the given protocol and loads it.
 * @param {string} protocol - One of the keys of {@link EXAMPLES}.
 * @returns {void}
 */
const loadRandomExample = (protocol) => {
  const pool = EXAMPLE_REFERENCES.filter((reference) => reference.protocol === protocol);
  if (pool.length === 0) return;
  loadExample(pool[Math.floor(Math.random() * pool.length)]);
};

/**
 * Renders every entry of {@link EXAMPLE_REFERENCES} inside the example `<select>`,
 * grouped by protocol using `<optgroup>` elements.
 * @returns {void}
 */
const populateExampleSelect = () => {
  /** @type {Map<string, HTMLOptGroupElement>} */
  const groups = new Map();

  for (const reference of EXAMPLE_REFERENCES) {
    if (!groups.has(reference.protocol)) {
      const group = document.createElement('optgroup');
      group.label = reference.protocol;
      groups.set(reference.protocol, group);
      exampleSelect.append(group);
    }

    const option = document.createElement('option');
    option.value = String(reference.id);
    option.textContent = reference.uri;
    option.title = reference.uri;
    groups.get(reference.protocol).append(option);
  }
};

// Event Listeners
runBtn.addEventListener('click', executeParse);

exampleSelect.addEventListener('change', () => {
  const selectedId = Number.parseInt(exampleSelect.value, 10);
  const reference = EXAMPLE_REFERENCES.find((item) => item.id === selectedId);
  if (reference) loadExample(reference);
});

exampleButtons.forEach((button) => {
  button.addEventListener('click', () => {
    loadRandomExample(button.dataset.protocol);
  });
});

clearBtn.addEventListener('click', () => {
  inputField.value = '';
  exampleSelect.value = '';
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

// Initial render
populateExampleSelect();
