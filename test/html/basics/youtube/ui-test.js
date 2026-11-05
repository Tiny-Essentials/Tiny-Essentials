import {
  assertYouTubeOEmbedResponse,
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  getYouTubeThumbnailUrl,
} from '/src/v1/basics/media/youtube.mjs';

/**
 * Curated list of inputs used to exercise `extractYouTubeVideoId`.
 * @type {string[]}
 */
const EXAMPLES = [
  'dQw4w9WgXcQ',
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ?t=42',
  'https://m.youtube.com/watch?v=dQw4w9WgXcQ&list=PL123',
  'https://music.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.youtube.com/shorts/dQw4w9WgXcQ',
  'https://www.youtube.com/live/dQw4w9WgXcQ',
  'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ',
  'https://vimeo.com/123456789',
  'not a video id',
];

/**
 * A minimal, valid oEmbed payload used by the "Validate Payload" action.
 * @type {import('/src/v1/basics/media/youtube.mjs').YouTubeOEmbedResponse}
 */
const SAMPLE_OEMBED = {
  title: 'Never Gonna Give You Up',
  author_name: 'Rick Astley',
  author_url: 'https://www.youtube.com/@RickAstleyYT',
  type: 'video',
  version: '1.0',
  provider_name: 'YouTube',
  provider_url: 'https://www.youtube.com/',
  html: '<iframe width="200" height="113" src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
  width: 200,
  height: 113,
  thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  thumbnail_width: 480,
  thumbnail_height: 360,
};

// Expose the module on the window object for manual debugging.
Object.assign(window, {
  assertYouTubeOEmbedResponse,
  extractYouTubeVideoId,
  fetchYouTubeOEmbed,
  getYouTubeThumbnailUrl,
});

// DOM Elements
const inputField = document.getElementById('video-input');
const qualitySelect = document.getElementById('quality-select');
const exampleSelect = document.getElementById('example-select');
const consoleOutput = document.getElementById('console-output');
const statusDot = document.getElementById('status-dot');
const previewPanel = document.getElementById('preview-panel');
const previewImage = document.getElementById('thumbnail-preview');

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
    return;
  }

  consoleOutput.textContent = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
  consoleOutput.classList.remove('text-error');
  consoleOutput.classList.add('text-success');
  statusDot.style.backgroundColor = 'var(--success)';
};

/**
 * Reads the current input, throwing a friendly error when it is empty.
 * @returns {string} The trimmed input value.
 */
const readInput = () => {
  const value = inputField.value.trim();

  if (!value) {
    throw new Error('Input is empty. Provide a video id or a YouTube URL.');
  }

  return value;
};

/** Runs `extractYouTubeVideoId` against the current input. */
const runExtract = () => {
  try {
    const input = readInput();
    updateConsole(null, { input, videoId: extractYouTubeVideoId(input) });
  } catch (error) {
    updateConsole(error);
  }
};

/** Builds the thumbnail URL and previews it. */
const runThumbnail = () => {
  try {
    const input = readInput();
    const quality = qualitySelect.value;
    const url = getYouTubeThumbnailUrl(input, quality);

    previewImage.src = url;
    previewPanel.hidden = false;
    updateConsole(null, { quality, thumbnailUrl: url });
  } catch (error) {
    updateConsole(error);
  }
};

/** Fetches the oEmbed metadata (requires network access). */
const runOEmbed = async () => {
  try {
    const input = readInput();
    updateConsole(null, 'Loading oEmbed payload...');
    updateConsole(null, await fetchYouTubeOEmbed(input));
  } catch (error) {
    updateConsole(error);
  }
};

/** Validates the bundled sample payload (and the current input as a video id). */
const runValidate = () => {
  try {
    const validated = assertYouTubeOEmbedResponse(SAMPLE_OEMBED);
    updateConsole(null, { valid: true, payload: validated });
  } catch (error) {
    updateConsole(error);
  }
};

/** Renders every entry of {@link EXAMPLES} inside the example `<select>`. */
const populateExampleSelect = () => {
  for (const example of EXAMPLES) {
    const option = document.createElement('option');
    option.value = example;
    option.textContent = example;
    exampleSelect.append(option);
  }
};

// Event Listeners
document.getElementById('btn-extract').addEventListener('click', runExtract);
document.getElementById('btn-thumbnail').addEventListener('click', runThumbnail);
document.getElementById('btn-oembed').addEventListener('click', runOEmbed);
document.getElementById('btn-validate').addEventListener('click', runValidate);

exampleSelect.addEventListener('change', () => {
  inputField.value = exampleSelect.value;
  runExtract();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  inputField.value = '';
  exampleSelect.value = '';
  previewImage.removeAttribute('src');
  previewPanel.hidden = true;
  consoleOutput.textContent = 'Ready for execution...';
  consoleOutput.classList.remove('text-error', 'text-success');
  statusDot.style.backgroundColor = 'var(--text-secondary)';
});

// Allow "Enter" in the textarea to trigger the extraction (Shift+Enter for a new line).
inputField.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    runExtract();
  }
});

// Initial render
populateExampleSelect();
