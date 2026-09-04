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
        `.trim().replace(/  /g, ''),
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
        `.trim().replace(/  /g, ''),
  matrix: `
          Checking Matrix identifiers:
          User ID: @yasmin:pony.house
          Room Alias: #general-ponies:pony.house
          Room ID (Opaque): !randomOpaqueId123:pony.house
          Event ID (v1 with domain): $abc123def456:pony.house
          Event ID (v3+ no domain): $aBcdEFgH12345+/AaBbCc=-
          Group ID (Legacy): +mlp-fans:pony.house
          Matrix URI: matrix://matrix.org/#!@yasmin:pony.house
          MXC URI: mxc://matrix.org/abc123def456
          HTML Mention: <a href="https://matrix.org/#/@yasmin:pony.house">@yasmin:pony.house</a>
        `.trim().replace(/  /g, ''),
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

function renderResults(matchGroups) {
  if (matchGroups.length === 0) {
    resultsList.innerHTML = '<div class="empty-state">No matches found.</div>';
    matchCount.textContent = '0 matches';
    return;
  }

  let total = 0;
  matchGroups.forEach((group) => {
    const groupDiv = document.createElement('div');
    groupDiv.innerHTML = `<div style="font-size: 0.7rem; color: var(--text-dim); margin-top: 10px; margin-bottom: 5px;">[${group.label}]</div>`;

    group.values.forEach((val) => {
      total++;
      const card = document.createElement('div');
      card.className = 'match-card';
      const value = document.createElement('span');
      value.className = 'value';
      value.textContent = val;
      card.appendChild(value);
      groupDiv.appendChild(card);
    });
    resultsList.appendChild(groupDiv);
  });

  matchCount.textContent = `${total} matches found`;
}

runBtn.addEventListener('click', runExtraction);
populateOptions();
