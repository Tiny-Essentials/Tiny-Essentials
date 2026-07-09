import { createCheckDestroyed } from './utils.mjs';

const checkDestroy = createCheckDestroyed('UltraRandomMsgGen');

const defaultWords = [
  'lorem',
  'ipsum',
  'dolor',
  'sit',
  'amet',
  'consectetur',
  'adipiscing',
  'elit',
  'sed',
  'do',
  'eiusmod',
  'tempor',
  'incididunt',
  'ut',
  'labore',
  'et',
  'dolore',
  'magna',
  'aliqua',
];
const defaultEmojis = [
  '😂',
  '🌈',
  '🤖',
  '💥',
  '🐸',
  '🍕',
  '🦄',
  '🧠',
  '🧬',
  '🚀',
  '🫠',
  '💫',
  '🍩',
  '👾',
  '🎉',
  '🥴',
  '🐙',
  '🧃',
  '🪐',
  '🎈',
  '🧸',
  '👻',
  '🥳',
  '🍭',
  '💖',
  '😺',
  '🌮',
  '🪅',
  '🎮',
  '🥓',
  '🍮',
];

const defaultNouns = [
  'pudding',
  'bean',
  'snuggle',
  'bloop',
  'jelly',
  'unicorn',
  'floof',
  'giggle',
  'bubble',
  'muffin',
  'puff',
  'pickle',
  'goblin',
  'waffle',
  'sprinkle',
  'cupcake',
  'fizzle',
  'marshmallow',
  'duckling',
  'sock',
  'cloud',
  'teacup',
  'nugget',
  'gnome',
  'hug',
  'moonbean',
  'crayon',
  'jiggle',
  'glitter',
  'carrot',
  'goober',
];

const defaultVerbs = [
  'wiggles',
  'bounces',
  'flies',
  'splats',
  'scoots',
  'giggles',
  'wigglesnacks',
  'twirls',
  'boops',
  'pops',
  'sings',
  'hugs',
  'floats',
  'glows',
  'flaps',
  'mlems',
  'dances',
  'puddles',
  'nomnoms',
  'wigglejumps',
  'sniffs',
  'tumbles',
  'slides',
  'chirps',
  'burps',
  'sparkles',
  'waddles',
  'rambles',
  'blinks',
  'mews',
];

const defaultAdjectives = [
  'fluffy',
  'silly',
  'yummy',
  'squishy',
  'wobbly',
  'magical',
  'tiny',
  'sleepy',
  'wiggly',
  'bubbly',
  'glittery',
  'fuzzy',
  'jiggly',
  'sparkly',
  'giggly',
  'crunchy',
  'goofy',
  'soft',
  'mushy',
  'sweet',
  'loopy',
  'floaty',
  'bonkers',
  'chewy',
  'ticklish',
  'dreamy',
  'pastel',
  'cozy',
  'teensy',
  'grumbly',
];

const defaultTemplates = [
  // 🧁 Tiny
  'Boop!',
  'Wiggle achieved.',
  'Oops, {noun} everywhere!',
  'Tiny {adj} {noun}, big {adj} {noun}.',
  'Snuggle initiated with a {adj} {noun}.',
  '{adj} vibes only, powered by {noun}.',
  'No {noun}, no {noun}.',
  'Bounce first, {verb} later.',
  'Mlem. {verb}. {noun}.',
  '{noun} go brrr and {verb}.',
  'Why not? {noun} did. Then {noun} followed.',

  // 🍬 Simple
  'A {adj} {noun} just {verb} near the {adj} window.',
  'That {adj} {noun} stole my {noun}!',
  'Look, a {adj} {noun} trying to {verb} again!',
  'Every {noun} deserves a {adj} nap.',
  'The {adj} {noun} is my {adj} spirit animal.',
  'Someone call the {noun}, it’s {verb}ing and {verb}ing again!',
  'Don’t touch the {adj} {noun}. It {verb}s loudly.',
  '{noun} forgot how {noun}s work and just {verb}ed.',

  // 🍩 Averages
  'There once was a {adj} {noun} who loved to {verb} with a {adj} {noun} all day.',
  'Apparently, {noun}s are banned from {verb}ing and {verb}ing in the {noun} library.',
  'That {adj} noise? Just a {noun} learning to {verb} on a {adj} {noun}.',
  'I saw a {adj} {noun} {verb} so hard, it became a {adj} muffin.',
  'The {adj} {noun} met a {adj} pickle and everything {verb}ed.',
  '{noun}s are like {noun}: {adj}, unpredictable, and wiggly.',
  'Don’t judge a {adj} {noun} by its ability to {verb}, or by its {adj} hat.',
  'All I wanted was peace, but a {adj} {noun} with a {adj} {noun} had other plans.',

  // 🍓 Giants
  'One {adj} morning, a {adj} {noun} decided it was finally time to {verb}, but halfway through, it tripped on a {noun} and turned into a {adj} marshmallow.',
  'I tried to be {adj} today, but then a {noun} {verb}ed across my {noun} and typed “asdfgh{noun}” repeatedly.',
  'If you think you’ve seen everything, wait until a {adj} {noun} {verb}s on a {noun} wearing {adj} socks with tiny {noun}s.',
  'No one ever believed the stories about the ancient {adj} {noun} who could {verb} with such {adj} grace that entire {noun}s turned pink out of embarrassment.',
  'A curious {adj} {noun} wandered into a {noun} shop, not knowing that its destiny involved twelve {adj} {noun}s, one rubber {noun}, and a suspiciously quiet {adj} llama.',

  // 🍒 Giants and narratives
  'In a land where every {adj} {noun} was made of pudding and the sky was {adj} whipped cream, one brave {adj} {noun} set out to discover the legendary Spoon of {noun}s, facing obstacles like bouncing {noun}s, sassy {noun}s, and the Great Wobble of the {noun}.',
  'Once upon a {adj} time, long before the {noun}s learned to {verb}, there existed a tiny {adj} {noun} who dreamed of swimming in a pool made entirely of {adj} glitter pudding while {verb}ing off-key lullabies to passing {noun}s with monocles.',
  'The Council of {noun}s gathered in {adj} secret when the sacred {adj} {noun} started to {verb} uncontrollably, threatening the entire {adj} dessert-based civilization with spontaneous {noun} jiggles and uncontainable {noun} fits across the {noun}.',

  // ☎️ Chats and chats
  'Hey... do you ever wonder if {noun}s dream of {noun}s?',
  'Okay but hear me out: what if the {adj} {noun} could actually {verb} backwards?',
  'Can we talk about the {noun} that just {verb}ed and vanished?',
  'So I was talking to a {noun}, and it told me to stop being {adj}. Rude.',
  'Not to alarm you, but there’s a {adj} {noun} behind you doing the {verb}.',
  'Why does this {noun} keep staring at me like I owe it pudding?',
  'Is this a safe space to admit I accidentally {verb}ed a {noun}?',
  'I just walked into the room and someone shouted “{adj} {noun}!” — what did I miss?',
  'Wait... we were supposed to bring a {noun}? No one told me!',
  'Okay but what if the {adj} {noun} has feelings too?',
  'Be honest, do I look like a {noun} that forgot how to {verb}?',
  'If I say "oops", do I still have to explain why the {noun} is glowing?',
  'I don’t know what’s going on but I brought snacks and a confused {noun}.',
  'Do you think pudding knows it’s pudding? Just a thought.',
  'Is this about the time I {verb}ed the {adj} {noun} by accident? Because I can explain.',

  // 🌀 Confusions, unexpected entrances, lost people
  'Wait, are we talking about {noun}s or am I on the wrong chat again?',
  'What is this group even about? I just saw "pudding" and joined.',
  'Hi! I have no idea what’s happening but I’m here and I brought a {noun}.',
  'I blinked and now there’s a {adj} {noun} in charge of everything.',
  'Can someone please explain why the {noun} is floating and chanting?',
  'Okay who gave the {noun} access to glitter and emotional support pickles?',
  'I came for a calm discussion and now there’s a {adj} battle between {noun}s.',
  'Not sure if I’m early, late, or inside a {noun} dream.',
  'I was gone for 3 minutes and now someone’s riding a {noun} into the pudding realm.',
  'This isn’t the pudding appreciation group, is it? ...oh no.',
  'So... who summoned the {adj} {noun} this time? Be honest.',
  'I came here for vibes and stayed for the {noun}s.',
  'Does anyone else hear faint giggling or is that just the {adj} {noun} again?',
  'I feel like I missed step one, two, and also three of this conversation.',
  'All I asked was “what’s up?” and now I’m emotionally attached to a {noun}.',

  // 💬 More interactive chat style
  'Me: "I’ll be normal today." Also me: *{verb}s into a meeting riding a {adj} {noun}*',
  '"It’s just pudding," they said. "It can’t hurt you," they said. They were wrong.',
  'I said one nice thing to a {noun} and now it follows me everywhere.',
  'Can we take a moment to appreciate how the {adj} {noun} is just vibing?',
  'Who put a tiny hat on the {noun}? Because that’s adorable.',
  'My life has been different ever since the {noun} started {verb}ing.',
  'Raise your hand if you’ve ever been personally attacked by a {adj} {noun}.',
  '"Don’t be weird," they said. So I became a {noun} instead.',
  'Do {noun}s have feelings? Asking for a {adj} friend.',
  'I trusted the {noun} and all I got was a glitter-covered sock.',
  'Plot twist: the {adj} {noun} was inside us all along.',

  // Mini cute explosions and chaos
  'The {adj} {noun} {verb} and {verb} all over the {adj} {noun}!',
  'Oops! {noun}s {verb}ed into the {adj} {noun} while {verb}ing crazily.',
  '{adj}, {adj}, and more {adj} {noun}s just {verb}ed by!',
  'Why does the {adj} {noun} keep {verb}ing and {verb}ing without stopping?',
  'Look! A {adj} {noun}, a {adj} {noun}, and a {noun} all {verb}ing together!',
  'Sometimes, the {noun} just {verb}s, then {verb}s again, and never stops being {adj}.',

  // Phrases with repetition and multiple spaces for chaos
  '{noun}, {noun}, and {noun} — all {verb}ing and {verb}ing in a {adj} {noun}.',
  'I saw a {adj} {noun} {verb}, then another {noun} {verb}ing with a {adj} {noun}.',
  'The {noun} {verb}s {verb} while the {adj} {noun} {verb}s and the {noun} just {verb}s.',
  'Can a {adj} {noun} {verb} {verb} without a {adj} {noun} watching?',

  // Phrases with interactions and breaks for fun
  'Whoa! The {adj} {noun} just {verb}ed... and then {verb}ed again!',
  'Hey... did you see that {adj} {noun} {verb} over there?',
  'Umm, the {noun} is {verb}ing but also {verb}ing and {verb}ing!',
  'Lol! {noun}s {verb} so {adj}ly, it’s impossible not to giggle.',

  // Mini exaggerated and cute dialogues
  '"Hey! What’s up?" asked the {adj} {noun}, who {verb}ed loudly.',
  '"I’m just a {adj} {noun} trying to {verb}, you know?"',
  '"Did you see the {adj} {noun} that just {verb}ed in the pudding?"',
  '"No way! The {noun} {verb}s better than me!"',
  '"Wait, the {adj} {noun} said it would {verb}, but it {verb}ed instead!"',

  // Extensive, crazy and fun narrative phrases
  'Once upon a {adj} {noun}, a group of {adj} {noun}s {verb}ed through the {adj} forest, singing {adj} songs and eating {noun}s made of pudding.',
  'The legend tells of a {adj} {noun} who could {verb} faster than any {noun} ever seen, leaving trails of {adj} sparkles behind.',
  'Every day, the {adj} {noun} would {verb} around the {adj} meadow, trying to convince the {noun}s to join the grand pudding party.',
  'No one knows why the {adj} {noun} suddenly {verb}ed and then {verb}ed again, but everyone agrees it was the cutest thing they ever saw.',
  'In the kingdom of {adj} {noun}s, only the bravest {noun} dared to {verb} the giant pudding monster, armed with nothing but {adj} smiles and jellybeans.',

  // Total cases with many placeholders
  '{adj} {noun} {verb} {verb} {verb} {noun} {verb} {adj} {noun} {verb} {noun}!',
  '{noun} {noun} {verb} {adj} {noun} and then {verb} {verb} the {adj} {noun}.',
  '{verb} the {adj} {noun}, then {verb} the {noun} while {verb}ing {adj}ly.',
  'Can the {adj} {noun} {verb} and {verb} the {adj} {noun} at the same time?',
  '{noun} {verb} {noun} {verb}, but the {adj} {noun} {verb}s better.',

  // Frases with cute interjections and silly sounds
  'Boop! The {adj} {noun} just {verb}ed in the pudding.',
  'Bloop bloop, the {noun} is {verb}ing all over again!',
  'Mlem mlem, a {adj} {noun} {verb}s quietly in the corner.',
  'Splat! {noun} {verb}ed right on the {adj} {noun}.',
  'Yum! A {adj} {noun} just {verb}ed in my mouth.',

  // Phrases with silly questions
  'Do {noun}s really {verb} when nobody’s watching?',
  'Why does the {adj} {noun} always {verb} at midnight?',
  'Can a {noun} be too {adj} to {verb} properly?',
  'Is it normal for a {adj} {noun} to {verb} three times in a row?',
  'Who taught the {noun} to {verb} like that?',

  // Frases of confusion and fun surprises
  'Wait, did the {adj} {noun} just {verb} itself?',
  'I can’t believe the {noun} {verb}ed into a {adj} {noun}!',
  'Suddenly, a {adj} {noun} appeared and started to {verb} wildly.',
  'That {noun} was {verb}ing so {adj}ly it broke the pudding meter.',
  'Everyone’s talking about the {adj} {noun} that {verb}ed out of nowhere.',
];

/**
 * @typedef {'mixed'|'readable'|'chaotic'|'natural'} RandomMsgModes
 * Defines how the message content is generated:
 * - `mixed`: Combines readable words, gibberish, symbols, emojis, etc.
 * - `readable`: Focuses on human-readable words only.
 * - `chaotic`: Pure chaos, mostly gibberish and symbols.
 * - `natural`: Uses structured grammar templates to form silly but proper sentences.
 */

/**
 * @typedef {'inline'|'end'|'none'} EmojiPlacement
 * Controls where emojis are placed:
 * - `inline`: Emojis may appear throughout the text.
 * - `end`: Emojis appear at the end of lines.
 * - `none`: No emojis will be used.
 */

/**
 * @typedef {Object} MsgGenConfig
 * Configuration object for customizing message generation.
 *
 * @property {number} minLength - Minimum total length (in characters) of the final generated text.
 * @property {number} maxLength - Maximum total length (in characters) of the final generated text.
 * @property {boolean} readable - Whether to favor readable word-like strings.
 * @property {boolean} useEmojis - Whether emojis are allowed in the generated content.
 * @property {boolean} includeNumbers - Whether random numbers can appear in the text.
 * @property {boolean} includeSymbols - Whether random symbols (e.g., !@#) are included.
 * @property {boolean} allowWeirdSpacing - Enables fun spacing effects (e.g., extra spaces, newlines, uppercase words).
 *
 * @property {string[]} emojiSet - List of emojis to choose from. Overrides default set if provided.
 * @property {string[]} wordSet - List of base words used in readable and mixed modes.
 *
 * @property {RandomMsgModes} mode - Determines the overall generation strategy (`mixed`, `readable`, `chaotic`, or `natural`).
 *
 * @property {Object} grammar - Grammar configuration used when `mode` is set to `'natural'`.
 * @property {string[]} grammar.templates - Sentence templates using placeholders (`{noun}`, `{verb}`, `{adj}`).
 * @property {string[]} grammar.nouns - List of nouns to insert into `{noun}` placeholders.
 * @property {string[]} grammar.verbs - List of verbs to insert into `{verb}` placeholders.
 * @property {string[]} grammar.adjectives - List of adjectives to insert into `{adj}` placeholders.
 *
 * @property {boolean} repeatWords - If false, avoids repeating the same word within a single generation.
 * @property {EmojiPlacement} emojiPlacement - Controls how emojis are placed in the text.
 *
 * @property {Object} [paragraphs] - Optional paragraph configuration.
 * @property {number} paragraphs.min - Minimum number of paragraphs to generate.
 * @property {number} paragraphs.max - Maximum number of paragraphs to generate.
 *
 * @property {Object} line - Configuration for line-based generation.
 * @property {number} line.minLength - Minimum number of characters per line.
 * @property {number} line.maxLength - Maximum number of characters per line.
 * @property {number} line.emojiChance - Probability (0 to 1) that a line will end with an emoji when allowed.
 */

/**
 * UltraRandomMsgGen - Phrase templates and word lists
 *
 * Portions of the templates, word sets, and phrase structures
 * were generated and expanded by ChatGPT (OpenAI).
 *
 * This content was crafted to produce innocent, playful, and diverse
 * random messages focused on a pudding-themed, whimsical style.
 *
 * @class
 */
class UltraRandomMsgGen {
  /** @type {string[]} */
  static #defaultWords = defaultWords;
  /** @type {string[]} */
  static #defaultEmojis = defaultEmojis;
  /** @type {string[]} */
  static #defaultNouns = defaultNouns;
  /** @type {string[]} */
  static #defaultVerbs = defaultVerbs;
  /** @type {string[]} */
  static #defaultAdjectives = defaultAdjectives;
  /** @type {string[]} */
  static #defaultTemplates = defaultTemplates;

  /**
   * Utility to validate arrays before setting.
   * @param {any} value
   * @param {string} field
   */
  static #validateArray(value, field) {
    if (!Array.isArray(value)) throw new TypeError(`${field} must be an array of strings`);
    if (!value.every((v) => typeof v === 'string'))
      throw new TypeError(`${field} must contain only strings`);
    if (value.length === 0) throw new Error(`${field} cannot be empty`);
  }

  /** @returns {string[]} */
  static get defaultWords() {
    return [...this.#defaultWords];
  }
  /** @param {string[]} value */
  static set defaultWords(value) {
    this.#validateArray(value, 'defaultWords');
    this.#defaultWords = [...value];
  }

  /** @returns {string[]} */
  static get defaultEmojis() {
    return [...this.#defaultEmojis];
  }
  /** @param {string[]} value */
  static set defaultEmojis(value) {
    this.#validateArray(value, 'defaultEmojis');
    this.#defaultEmojis = [...value];
  }

  /** @returns {string[]} */
  static get defaultNouns() {
    return [...this.#defaultNouns];
  }
  /** @param {string[]} value */
  static set defaultNouns(value) {
    this.#validateArray(value, 'defaultNouns');
    this.#defaultNouns = [...value];
  }

  /** @returns {string[]} */
  static get defaultVerbs() {
    return [...this.#defaultVerbs];
  }
  /** @param {string[]} value */
  static set defaultVerbs(value) {
    this.#validateArray(value, 'defaultVerbs');
    this.#defaultVerbs = [...value];
  }

  /** @returns {string[]} */
  static get defaultAdjectives() {
    return [...this.#defaultAdjectives];
  }
  /** @param {string[]} value */
  static set defaultAdjectives(value) {
    this.#validateArray(value, 'defaultAdjectives');
    this.#defaultAdjectives = [...value];
  }

  /** @returns {string[]} */
  static get defaultTemplates() {
    return [...this.#defaultTemplates];
  }
  /** @param {string[]} value */
  static set defaultTemplates(value) {
    this.#validateArray(value, 'defaultTemplates');
    this.#defaultTemplates = [...value];
  }

  /**
   * Tracks whether the instance has been destroyed.
   * @type {boolean}
   */
  #destroyed = false;

  /**
   * Gets the current destruction status of the instance.
   *
   * @returns {boolean} True if the instance is destroyed, false otherwise.
   */
  get destroyed() {
    return this.#destroyed;
  }

  /** @type {MsgGenConfig} */
  #config = {
    minLength: 10,
    maxLength: 300,
    readable: true,
    useEmojis: true,
    includeNumbers: true,
    includeSymbols: true,
    allowWeirdSpacing: false,
    emojiSet: [],
    wordSet: [],
    mode: 'mixed', // 'mixed', 'readable', 'chaotic'
    grammar: {
      templates: [],
      nouns: [],
      verbs: [],
      adjectives: [],
    },
    repeatWords: true,
    emojiPlacement: 'inline', // 'inline' | 'end' | 'none'
    line: {
      minLength: 20,
      maxLength: 120,
      emojiChance: 0.3, // 30% chance per line
    },
  };

  get config () {
    return structuredClone(this.#config);
  }

  #symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?/\\~'.split('');

  get symbols () {
    return structuredClone(this.#symbols);
  }

  /**
   * Creates an instance of UltraRandomMsgGen.
   *
   * @param {Object} [config={}] - Configuration object to customize the generator.
   * @param {number} [config.minLength=10] - Minimum total length (in characters) of generated text.
   * @param {number} [config.maxLength=300] - Maximum total length (in characters) of generated text.
   * @param {boolean} [config.readable=true] - Whether to generate readable words or random strings.
   * @param {boolean} [config.useEmojis=true] - Whether to include emojis in the generated text.
   * @param {boolean} [config.includeNumbers=true] - Whether to include numbers randomly.
   * @param {boolean} [config.includeSymbols=true] - Whether to include symbols randomly.
   * @param {boolean} [config.allowWeirdSpacing=false] - Whether to allow weird spacing (newlines, extra spaces, uppercase).
   * @param {string[]} [config.emojiSet] - Array of emojis to use (defaults to internal emoji set).
   * @param {string[]} [config.wordSet] - Array of words to use (defaults to internal word set).
   * @param {RandomMsgModes} [config.mode='mixed'] - Mode of text generation.
   * @param {Object} [config.grammar] - Grammar configuration with templates and word categories.
   * @param {string[]} [config.grammar.templates] - Array of string templates with placeholders for generating sentences.
   * @param {string[]} [config.grammar.nouns] - Array of noun strings for template substitution.
   * @param {string[]} [config.grammar.verbs] - Array of verb strings for template substitution.
   * @param {string[]} [config.grammar.adjectives] - Array of adjective strings for template substitution.
   * @param {boolean} [config.repeatWords=true] - Whether to allow repeating words in the output.
   * @param {EmojiPlacement} [config.emojiPlacement='inline'] - Placement mode for emojis in generated text.
   * @param {Object} [config.paragraphs] - Paragraph configuration object or null for single block text.
   * @param {number} [config.paragraphs.min] - Minimum number of paragraphs to generate.
   * @param {number} [config.paragraphs.max] - Maximum number of paragraphs to generate.
   * @param {Object} [config.line] - Line configuration for generated text.
   * @param {number} [config.line.minLength=20] - Minimum length (characters) per line.
   * @param {number} [config.line.maxLength=120] - Maximum length (characters) per line.
   * @param {number} [config.line.emojiChance=0.3] - Probability (0–1) of placing emoji per line.
   */
  constructor(config = {}) {
    const {
      minLength,
      maxLength,
      readable,
      useEmojis,
      includeNumbers,
      includeSymbols,
      allowWeirdSpacing,
      emojiSet,
      wordSet,
      mode,
      grammar,
      repeatWords,
      emojiPlacement,
      paragraphs,
      line,
    } = config;

    // Validations
    if (minLength !== undefined && (!Number.isInteger(minLength) || minLength < 1)) {
      throw new TypeError('config.minLength must be an integer >= 1');
    }

    if (maxLength !== undefined && (!Number.isInteger(maxLength) || maxLength < 1)) {
      throw new TypeError('config.maxLength must be an integer >= 1');
    }

    if (minLength !== undefined && maxLength !== undefined && minLength > maxLength) {
      throw new RangeError('config.minLength cannot be greater than config.maxLength');
    }

    if (readable !== undefined && typeof readable !== 'boolean') {
      throw new TypeError('config.readable must be a boolean');
    }

    if (useEmojis !== undefined && typeof useEmojis !== 'boolean') {
      throw new TypeError('config.useEmojis must be a boolean');
    }

    if (includeNumbers !== undefined && typeof includeNumbers !== 'boolean') {
      throw new TypeError('config.includeNumbers must be a boolean');
    }

    if (includeSymbols !== undefined && typeof includeSymbols !== 'boolean') {
      throw new TypeError('config.includeSymbols must be a boolean');
    }

    if (allowWeirdSpacing !== undefined && typeof allowWeirdSpacing !== 'boolean') {
      throw new TypeError('config.allowWeirdSpacing must be a boolean');
    }

    if (emojiSet !== undefined && !Array.isArray(emojiSet)) {
      throw new TypeError('config.emojiSet must be an array of strings');
    }

    if (wordSet !== undefined && !Array.isArray(wordSet)) {
      throw new TypeError('config.wordSet must be an array of strings');
    }

    if (mode !== undefined && !['mixed', 'readable', 'chaotic', 'natural'].includes(mode)) {
      throw new RangeError('config.mode must be one of: "mixed", "readable", "chaotic", "natural');
    }

    if (grammar !== undefined) {
      if (typeof grammar !== 'object' || grammar === null) {
        throw new TypeError('config.grammar must be an object');
      }
      const { templates, nouns, verbs, adjectives } = grammar;
      if (templates !== undefined && !Array.isArray(templates)) {
        throw new TypeError('config.grammar.templates must be an array of strings');
      }
      if (nouns !== undefined && !Array.isArray(nouns)) {
        throw new TypeError('config.grammar.nouns must be an array of strings');
      }
      if (verbs !== undefined && !Array.isArray(verbs)) {
        throw new TypeError('config.grammar.verbs must be an array of strings');
      }
      if (adjectives !== undefined && !Array.isArray(adjectives)) {
        throw new TypeError('config.grammar.adjectives must be an array of strings');
      }
    }

    if (repeatWords !== undefined && typeof repeatWords !== 'boolean') {
      throw new TypeError('config.repeatWords must be a boolean');
    }

    if (emojiPlacement !== undefined && !['inline', 'end', 'none'].includes(emojiPlacement)) {
      throw new RangeError('config.emojiPlacement must be one of: "inline", "end", "none"');
    }

    if (paragraphs !== undefined) {
      if (typeof paragraphs !== 'object') {
        throw new TypeError('config.paragraphs must be an object or null');
      }
      const { min, max } = paragraphs;
      if (min !== undefined && (!Number.isInteger(min) || min < 1)) {
        throw new TypeError('config.paragraphs.min must be an integer >= 1');
      }
      if (max !== undefined && (!Number.isInteger(max) || max < 1)) {
        throw new TypeError('config.paragraphs.max must be an integer >= 1');
      }
      if (min !== undefined && max !== undefined && min > max) {
        throw new RangeError('config.paragraphs.min cannot be greater than config.paragraphs.max');
      }
    }

    if (line !== undefined) {
      if (typeof line !== 'object' || line === null) {
        throw new TypeError('config.line must be an object');
      }
      const { minLength: lineMin, maxLength: lineMax, emojiChance } = line;
      if (lineMin !== undefined && (!Number.isInteger(lineMin) || lineMin < 1)) {
        throw new TypeError('config.line.minLength must be an integer >= 1');
      }
      if (lineMax !== undefined && (!Number.isInteger(lineMax) || lineMax < 1)) {
        throw new TypeError('config.line.maxLength must be an integer >= 1');
      }
      if (lineMin !== undefined && lineMax !== undefined && lineMin > lineMax) {
        throw new RangeError('config.line.minLength cannot be greater than config.line.maxLength');
      }
      if (
        emojiChance !== undefined &&
        (typeof emojiChance !== 'number' || emojiChance < 0 || emojiChance > 1)
      ) {
        throw new RangeError('config.line.emojiChance must be a number between 0 and 1');
      }
    }

    this.#config.emojiSet = [...UltraRandomMsgGen.#defaultEmojis];
    this.#config.wordSet = [...UltraRandomMsgGen.#defaultWords];

    this.#config.grammar.templates = [...UltraRandomMsgGen.#defaultTemplates];
    this.#config.grammar.nouns = [...UltraRandomMsgGen.#defaultNouns];
    this.#config.grammar.verbs = [...UltraRandomMsgGen.#defaultVerbs];
    this.#config.grammar.adjectives = [...UltraRandomMsgGen.#defaultAdjectives];
    Object.assign(this.#config, config);
  }

  /**
   * Merges new configuration values into the current instance.
   * @param {Object} newConfig - Object with one or more configuration overrides.
   * @returns {this} - The instance for chaining.
   */
  configure(newConfig = {}) {
    checkDestroy(this.#destroyed);
    Object.assign(this.#config, newConfig);
    return this;
  }

  /**
   * Replaces the entire list of grammar templates.
   * @param {...string[]} templates - One or more arrays or strings containing sentence templates.
   * @returns {this} - The instance for chaining.
   */
  setGrammarTemplates(...templates) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.templates = templates.flat();
    return this;
  }

  /**
   * Adds new grammar templates to the existing list.
   * @param {...string[]} templates - One or more arrays or strings containing sentence templates.
   * @returns {this} - The instance for chaining.
   */
  addGrammarTemplates(...templates) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.templates.push(...templates.flat());
    return this;
  }

  /**
   * Replaces the list of noun words used in grammar templates.
   * @param {...string[]} nouns - One or more arrays or strings of nouns.
   * @returns {this} - The instance for chaining.
   */
  setGrammarNouns(...nouns) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.nouns = nouns.flat();
    return this;
  }

  /**
   * Adds noun words to the existing list used in grammar templates.
   * @param {...string[]} nouns - One or more arrays or strings of nouns.
   * @returns {this} - The instance for chaining.
   */
  addGrammarNouns(...nouns) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.nouns.push(...nouns.flat());
    return this;
  }

  /**
   * Replaces the list of verb words used in grammar templates.
   * @param {...string[]} verbs - One or more arrays or strings of verbs.
   * @returns {this} - The instance for chaining.
   */
  setGrammarVerbs(...verbs) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.verbs = verbs.flat();
    return this;
  }

  /**
   * Adds verb words to the existing list used in grammar templates.
   * @param {...string[]} verbs - One or more arrays or strings of verbs.
   * @returns {this} - The instance for chaining.
   */
  addGrammarVerbs(...verbs) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.verbs.push(...verbs.flat());
    return this;
  }

  /**
   * Replaces the list of adjective words used in grammar templates.
   * @param {...string[]} adjectives - One or more arrays or strings of adjectives.
   * @returns {this} - The instance for chaining.
   */
  setGrammarAdjectives(...adjectives) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.adjectives = adjectives.flat();
    return this;
  }

  /**
   * Adds adjective words to the existing list used in grammar templates.
   * @param {...string[]} adjectives - One or more arrays or strings of adjectives.
   * @returns {this} - The instance for chaining.
   */
  addGrammarAdjectives(...adjectives) {
    checkDestroy(this.#destroyed);
    this.#config.grammar.adjectives.push(...adjectives.flat());
    return this;
  }

  /**
   * Removes specific grammar templates from the current list.
   * @param {...string[]} templates - One or more arrays or strings of templates to remove.
   * @returns {this} - The instance for chaining.
   */
  removeGrammarTemplates(...templates) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(templates.flat());
    this.#config.grammar.templates = this.#config.grammar.templates.filter(
      (t) => !removeSet.has(t),
    );
    return this;
  }

  /**
   * Removes specific noun words from the grammar noun list.
   * @param {...string[]} nouns - One or more arrays or strings of nouns to remove.
   * @returns {this} - The instance for chaining.
   */
  removeGrammarNouns(...nouns) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(nouns.flat());
    this.#config.grammar.nouns = this.#config.grammar.nouns.filter((n) => !removeSet.has(n));
    return this;
  }

  /**
   * Removes specific verb words from the grammar verb list.
   * @param {...string[]} verbs - One or more arrays or strings of verbs to remove.
   * @returns {this} - The instance for chaining.
   */
  removeGrammarVerbs(...verbs) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(verbs.flat());
    this.#config.grammar.verbs = this.#config.grammar.verbs.filter((v) => !removeSet.has(v));
    return this;
  }

  /**
   * Removes specific adjective words from the grammar adjective list.
   * @param {...string[]} adjectives - One or more arrays or strings of adjectives to remove.
   * @returns {this} - The instance for chaining.
   */
  removeGrammarAdjectives(...adjectives) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(adjectives.flat());
    this.#config.grammar.adjectives = this.#config.grammar.adjectives.filter(
      (a) => !removeSet.has(a),
    );
    return this;
  }

  /**
   * Replaces the entire word set used in readable/mixed modes.
   * @param {...string[]} words - One or more arrays or strings of words.
   * @returns {this} - The instance for chaining.
   */
  setWords(...words) {
    checkDestroy(this.#destroyed);
    this.#config.wordSet = words.flat();
    return this;
  }

  /**
   * Adds new words to the word set used in readable/mixed modes.
   * @param {...string[]} words - One or more arrays or strings of words.
   * @returns {this} - The instance for chaining.
   */
  addWords(...words) {
    checkDestroy(this.#destroyed);
    this.#config.wordSet.push(...words.flat());
    return this;
  }

  /**
   * Removes specific words from the word set.
   * @param {...string[]} words - Words to be removed.
   * @returns {this} - The instance for chaining.
   */
  removeWords(...words) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(words.flat());
    this.#config.wordSet = this.#config.wordSet.filter((word) => !removeSet.has(word));
    return this;
  }

  /**
   * Replaces the emoji set used in generated output.
   * @param {...string[]} emojis - One or more arrays or strings of emojis.
   * @returns {this} - The instance for chaining.
   */
  setEmojis(...emojis) {
    checkDestroy(this.#destroyed);
    this.#config.emojiSet = emojis.flat();
    return this;
  }

  /**
   * Adds new emojis to the emoji set.
   * @param {...string[]} emojis - One or more arrays or strings of emojis.
   * @returns {this} - The instance for chaining.
   */
  addEmojis(...emojis) {
    checkDestroy(this.#destroyed);
    this.#config.emojiSet.push(...emojis.flat());
    return this;
  }

  /**
   * Removes specific emojis from the emoji set.
   * @param {...string[]} emojis - Emojis to be removed.
   * @returns {this} - The instance for chaining.
   */
  removeEmojis(...emojis) {
    checkDestroy(this.#destroyed);
    const removeSet = new Set(emojis.flat());
    this.#config.emojiSet = this.#config.emojiSet.filter((emoji) => !removeSet.has(emoji));
    return this;
  }

  /**
   * Returns a random item from an array.
   * @private
   * @param {string[]} array - Array to pick from.
   * @returns {string} - Random item from array.
   */
  _getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Generates a single random content chunk based on the mode and settings.
   * @private
   * @returns {string} - A chunk (word, emoji, symbol, number, etc.).
   */
  _generateChunk() {
    const {
      wordSet,
      emojiSet,
      includeNumbers,
      includeSymbols,
      useEmojis,
      readable,
      mode,
      emojiPlacement,
    } = this.#config;

    if (mode === 'natural') {
      return this._generateNaturalSentence();
    }

    const pools = [];

    if (readable || mode === 'readable' || mode === 'mixed') {
      pools.push(this._getRandomItem(wordSet));
    }

    if (mode === 'chaotic' || mode === 'mixed') {
      pools.push(Math.random().toString(36).slice(2));
    }

    if (includeNumbers) {
      pools.push(Math.floor(Math.random() * 99999).toString());
    }

    if (includeSymbols) {
      pools.push(this._getRandomItem(this.#symbols));
    }

    if (emojiPlacement === 'inline' && useEmojis && emojiSet.length) {
      pools.push(this._getRandomItem(emojiSet));
    }

    return this._getRandomItem(pools);
  }

  /**
   * Generates a natural sentence by replacing placeholders in a template.
   * @private
   * @returns {string} - A generated sentence.
   */
  _generateNaturalSentence() {
    const { templates, nouns, verbs, adjectives } = this.#config.grammar;

    let template = this._getRandomItem(templates);

    return template
      .replace(/{noun}/g, () => this._getRandomItem(nouns))
      .replace(/{verb}/g, () => this._getRandomItem(verbs))
      .replace(/{adj}/g, () => this._getRandomItem(adjectives));
  }

  /**
   * Generates a single line of text with target length and rules.
   * @private
   * @param {number} targetLength - Target character length for the line.
   * @param {Set<string>} [seenWords] - Set of already used words (for avoiding repeats).
   * @returns {string} - A generated line.
   */
  _generateLine(targetLength, seenWords) {
    const { allowWeirdSpacing, repeatWords, readable, emojiSet, useEmojis, emojiPlacement, line } =
      this.#config;

    const parts = [];
    seenWords ??= new Set();

    while (parts.join(' ').length < targetLength) {
      let chunk = this._generateChunk();

      if (!repeatWords && seenWords.has(chunk)) continue;
      seenWords.add(chunk);

      if (allowWeirdSpacing) {
        if (Math.random() < 0.1) chunk = '\n' + chunk;
        if (Math.random() < 0.1) chunk = '   ' + chunk;
        if (Math.random() < 0.05) chunk = chunk.toUpperCase();
      }

      parts.push(chunk);
    }

    let lineText = parts.join(readable ? ' ' : '');

    if (
      emojiPlacement === 'end' &&
      useEmojis &&
      emojiSet.length &&
      Math.random() < (line?.emojiChance || 0)
    ) {
      lineText += ' ' + this._getRandomItem(emojiSet);
    }

    return lineText;
  }

  /**
   * Generates lines to form a paragraph based on total length.
   * @private
   * @param {number} totalLength - Total target character count for the paragraph.
   * @returns {string[]} - Array of lines that form the paragraph.
   */
  _generateParagraphLines(totalLength) {
    const { line } = this.#config;
    const lines = [];
    const seenWords = new Set();
    let currentTotal = 0;

    while (currentTotal < totalLength) {
      const lineLength = Math.floor(
        Math.random() * (line.maxLength - line.minLength + 1) + line.minLength,
      );

      const adjustedLength = Math.min(lineLength, totalLength - currentTotal);

      lines.push(this._generateLine(adjustedLength, seenWords));
      currentTotal += adjustedLength;
    }

    return lines;
  }

  /**
   * Generates the final random message, which can be a paragraph or block of lines.
   * Uses full configuration rules (grammar, symbols, emojis, etc).
   * @returns {string} - A full generated message.
   */
  generate() {
    checkDestroy(this.#destroyed);
    const { minLength, maxLength, paragraphs } = this.#config;

    const totalLength = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;

    if (paragraphs && typeof paragraphs === 'object') {
      const paraCount =
        Math.floor(Math.random() * (paragraphs.max - paragraphs.min + 1)) + paragraphs.min;
      const approxLength = Math.floor(totalLength / paraCount);
      const paragraphsArray = [];

      for (let i = 0; i < paraCount; i++) {
        const lines = this._generateParagraphLines(approxLength);
        paragraphsArray.push(lines.join('\n'));
      }

      return paragraphsArray.join('\n\n');
    }

    return this._generateParagraphLines(totalLength).join('\n');
  }

  /**
   * Safely destroys the instance by clearing references to aid garbage collection.
   * Once destroyed, the instance cannot be used to generate new messages.
   *
   * @throws {Error} If the instance has already been destroyed.
   * @returns {void}
   */
  destroy() {
    if (this.destroyed) {
      throw new Error('This instance of UltraRandomMsgGen has already been destroyed.');
    }

    // Clear primary memory references
    this.#symbols = [];

    this.#config.emojiSet = [];
    this.#config.wordSet = [];

    this.#config.grammar.templates = [];
    this.#config.grammar.nouns = [];
    this.#config.grammar.verbs = [];
    this.#config.grammar.adjectives = [];

    // Lock the instance
    this.#destroyed = true;
  }
}

export default UltraRandomMsgGen;
