/**
 * IMPORTING YOUR MODULES
 * Note: The paths must match your local directory structure.
 */
import { extractUsernames } from '/src/v1/regexp/Username/index.mjs';
import { BlueSkyRegex } from '/src/v1/regexp/Username/templates/BlueSky.mjs';
import { DiscordRegex } from '/src/v1/regexp/Username/templates/Discord.mjs';
import { MatrixProtocolRegex } from '/src/v1/regexp/Username/templates/MatrixProtocol.mjs';

// DOM Elements
const testInput = document.getElementById('testInput');
const runBtn = document.getElementById('runBtn');
const resultsList = document.getElementById('resultsList');
const matchCount = document.getElementById('matchCount');
const protocolSelect = document.getElementById('protocolSelect');
const transformSelect = document.getElementById('transformSelect');
const status = document.getElementById('status');
const customConfig = document.getElementById('customConfig');

// Populate Select Options
const populateOptions = () => {
  const optDF = document.getElementById('opt-default');
  const optBS = document.getElementById('opt-bluesky');
  const optDC = document.getElementById('opt-discord');
  const optMX = document.getElementById('opt-matrix');

  optDF.appendChild(new Option('default', `default`));
  Object.keys(BlueSkyRegex).forEach((k) => optBS.appendChild(new Option(k, `bsky:${k}`)));
  Object.keys(DiscordRegex).forEach((k) => optDC.appendChild(new Option(k, `discord:${k}`)));
  Object.keys(MatrixProtocolRegex).forEach((k) => optMX.appendChild(new Option(k, `matrix:${k}`)));
};

// Toggle Sandbox Visibility
protocolSelect.addEventListener('change', () => {
  if (protocolSelect.value === 'custom') {
    customConfig.style.display = 'flex';
  } else {
    customConfig.style.display = 'none';
  }
});

// Test Data
const examples = {
  bluesky: `
          Testing BlueSky / AT protocols:
          Handle: @yasmin.pony.house or @pony.house
          DID: did:plc:1234567890abcdefghi or did:web:mydomain.com
          AT URI: at://did:plc:1234567890abcdefghi/app.bsky.feed.post/3jklmn56pqr2
          Hashtag: #MyLittlePony or #programming
        `
    .trim()
    .replace(/  /g, ''),
  discord: `
          Testing Discord mentions:
          User Mention: <@123456789012345678>
          Nickname Mention: <@!123456789012345678>
          Role Mention: <@&123456789012345678>
          Channel Mention: <#123456789012345678>
          Custom Emoji: <:twilight_smile:123456789012345678>
          Animated Emoji: <a:rainbow_dash_fly:123456789012345678>
          Slash Command (Simple): </play:123456789012345678>
          Slash Command (With Subcommand): </play music:123456789012345678>
        `
    .trim()
    .replace(/  /g, ''),
  matrix: `
          Checking Matrix identifiers:
          User ID: @yasmin:pony.house
          Room Alias: #general-ponies:pony.house
          Room ID (Opaque): !randomOpaqueId123:pony.house
          Event ID (v1 with domain): $abc123def456:pony.house
          Event ID (v3+ no domain): $aBcdEFgH12345+/AaBbCc=-
          Group ID (Legacy): +mlp-fans:pony.house

          Checking Matrix Links and HTML:
          Matrix.to Link: https://matrix.to/#/@yasmin:pony.house
          Matrix URI: matrix:u/@yasmin:pony.house
          MXC URI: mxc://matrix.org/abc123def456
          HTML Mention: <a href="https://matrix.to/#/@yasmin:pony.house">Yasmin</a>
        `
    .trim()
    .replace(/  /g, ''),
};

window.loadExample = (key) => {
  testInput.value = examples[key];
  runExtraction();
};

// Core Logic
async function runExtraction() {
  const text = testInput.value;
  const protocolVal = protocolSelect.value;
  const transformVal = transformSelect.value === 'null' ? null : transformSelect.value;

  resultsList.innerHTML = '';
  matchCount.textContent = 'Scanning...';
  status.textContent = 'Processing...';
  status.style.color = 'var(--warning)';

  // Use setTimeout to allow UI to update "Scanning..." before heavy work
  setTimeout(() => {
    try {
      let allMatches = [];

      // Helper to process a specific template
      const processTemplate = (template, label) => {
        try {
          const extracted = extractUsernames(text, { ...template, transform: transformVal });
          if (extracted.length > 0) {
            allMatches.push({ label, values: extracted });
          }
        } catch (e) {
          console.error(`Error in template ${label}:`, e);
        }
      };

      if (protocolVal === 'all') {
        // BlueSky
        Object.entries(BlueSkyRegex).forEach(([k, v]) => processTemplate(v, `BlueSky: ${k}`));
        // Discord
        Object.entries(DiscordRegex).forEach(([k, v]) => processTemplate(v, `Discord: ${k}`));
        // Matrix
        Object.entries(MatrixProtocolRegex).forEach(([k, v]) => processTemplate(v, `Matrix: ${k}`));
      } else if (protocolVal.includes(':')) {
        const [proto, key] = protocolVal.split(':');
        let template;
        if (proto === 'bsky') template = BlueSkyRegex[key];
        if (proto === 'discord') template = DiscordRegex[key];
        if (proto === 'matrix') template = MatrixProtocolRegex[key];

        if (template) {
          const extracted = extractUsernames(text, { ...template, transform: transformVal });
          if (extracted.length > 0) {
            allMatches.push({ label: protocolVal.replace(':', ' '), values: extracted });
          }
        }
      } else if (protocolVal === 'default') {
        processTemplate({ prefix: '@' }, `Default`);
      } else if (protocolVal === 'custom') {
        // BUILDING CUSTOM TEMPLATE FROM SANDBOX INPUTS
        const customTemplate = {
          prefix: document.getElementById('customPrefix').value || undefined,
          start: document.getElementById('customStart').value || undefined,
          validValues: document.getElementById('customValidValues').value || '[a-zA-Z0-9_]',
          length: [
            parseInt(document.getElementById('customMinLen').value) || 3,
            parseInt(document.getElementById('customMaxLen').value) || 20,
          ],
          end: document.getElementById('customEnd').value || undefined,
          domain: document.getElementById('customDomain').value || undefined,
          domainPattern: document.getElementById('customDomainPattern').value || undefined,
        };
        processTemplate(customTemplate, `Custom Sandbox`);
      }

      renderResults(allMatches);
      status.textContent = 'Ready';
      status.style.color = 'var(--success)';
    } catch (err) {
      console.error(err);
      status.textContent = 'Error';
      status.style.color = 'var(--error)';
      resultsList.innerHTML = `<div class="empty-state" style="color: var(--error)">Error: ${err.message}</div>`;
    }
  }, 50);
}

/**
 * Renders the extracted matches to the DOM.
 * Each group shows its total count of matches.
 * Each unique result shows its total frequency across the entire scan.
 *
 * @param {Array<Object>} matchGroups - An array of objects containing labels and values.
 * @param {string} matchGroups[].label - The label describing the match group.
 * @param {string[]} matchGroups[].values - An array of extracted strings.
 */
function renderResults(matchGroups) {
  if (matchGroups.length === 0) {
    resultsList.innerHTML = '<div class="empty-state">No matches found.</div>';
    matchCount.textContent = '0 matches';
    return;
  }

  // 1. Create a frequency map to count total occurrences of every value
  const frequencyMap = new Map();
  matchGroups.forEach((group) => {
    group.values.forEach((val) => {
      const count = frequencyMap.get(val) || 0;
      frequencyMap.set(val, count + 1);
    });
  });

  const seenValues = new Set();
  let totalUniqueMatches = 0;

  // 2. Render groups and unique values
  matchGroups.forEach((group) => {
    // Create a list of values from this group that haven't been seen in previous groups
    const uniqueGroupValues = [];
    for (const val of group.values) {
      if (!seenValues.has(val)) {
        seenValues.add(val);
        uniqueGroupValues.push(val);
      }
    }

    // Only render the group div if it contains at least one new unique value
    if (uniqueGroupValues.length > 0) {
      const groupDiv = document.createElement('div');

      // Group header: shows the total number of matches found in this specific category
      const groupTotal = group.values.length;
      groupDiv.innerHTML = `
        <div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 10px; margin-bottom: 5px; display: flex; justify-content: space-between;">
          <span>[${group.label}]</span>
          <span>(${groupTotal} matches)</span>
        </div>`;

      uniqueGroupValues.forEach((val) => {
        seenValues.add(val);
        totalUniqueMatches++;

        const card = document.createElement('div');
        card.className = 'match-card';

        const valueSpan = document.createElement('span');
        valueSpan.className = 'value';
        valueSpan.textContent = val;

        // Value counter: shows how many times this specific value appeared in the whole scan
        const count = frequencyMap.get(val);
        const countSpan = document.createElement('span');
        countSpan.style.cssText =
          'margin-left: 8px; font-size: 0.75rem; color: var(--text-dim); opacity: 0.8;';
        countSpan.textContent = `(${count})`;

        card.appendChild(valueSpan);
        card.appendChild(countSpan);
        groupDiv.appendChild(card);
      });

      resultsList.appendChild(groupDiv);
    }
  });

  // Handle case where all matches were duplicates of previously seen values
  if (totalUniqueMatches === 0) {
    resultsList.innerHTML = '<div class="empty-state">No unique matches found.</div>';
  }

  matchCount.textContent = `${totalUniqueMatches} unique matches found`;
}

runBtn.addEventListener('click', runExtraction);
populateOptions();
