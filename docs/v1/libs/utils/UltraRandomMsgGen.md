# 🍮 UltraRandomMsgGen - Configuration & Constructor

A powerful and playful message generator with grammar support, emoji magic ✨, and chaos knobs 🔧.

---

## 📑 Table of Contents

- [📦 `RandomMsgModes`](#-randommsgmodes)
- [🎨 `EmojiPlacement`](#-emojiplacement)
- [🧰 `MsgGenConfig`](#-msggenconfig)
  - [Basic Settings](#basic-settings)
  - [Word and Emoji Pools](#word-and-emoji-pools)
  - [Generation Mode](#generation-mode)
- [📖 Grammar Mode (for `natural`)](#-grammar-mode-for-natural)
- [🔁 Repetition & Emojis](#-repetition--emojis)
- [📑 Paragraph Support (Optional)](#-paragraph-support-optional)
- [🧾 Line Generation](#-line-generation)
- [🏗️ Constructor](#️-constructor)
  - [Arguments:](#arguments)
  - [Behavior:](#behavior)
- [⚙️ `configure(newConfig)`](#️-configurenewconfig)
- [📝 Grammar Templates & Word Lists Management](#-grammar-templates--word-lists-management)
  - [Template Methods](#template-methods)
  - [Noun Methods](#noun-methods)
  - [Verb Methods](#verb-methods)
  - [Adjective Methods](#adjective-methods)
- [🗣️ Word Set Management](#️-word-set-management)
- [😄 Emoji Set Management](#-emoji-set-management)
- [🎲 Internal Helpers (Private Methods)](#-internal-helpers-private-methods)
  - [`_getRandomItem(array)`](#_getrandomitemarray)
  - [`_generateChunk()`](#_generatechunk)
  - [`_generateNaturalSentence()`](#_generatenaturalsentence)
  - [`_generateLine(targetLength, seenWords)`](#_generatelinetargetlength-seenwords)
  - [`_generateParagraphLines(totalLength)`](#_generateparagraphlinestotallength)
- [🎉 Main Method](#-main-method)
  - [`generate()`](#generate)

---

## 📦 `RandomMsgModes`

Defines how messages are composed:

| Mode         | Description                                            |
| ------------ | ------------------------------------------------------ |
| `'mixed'`    | Mix of readable words, gibberish, symbols, and emojis. |
| `'readable'` | Generates only human-readable word content.            |
| `'chaotic'`  | Full chaos mode: messy, random symbols and nonsense.   |
| `'natural'`  | Structured messages based on grammar templates.        |

---

## 🎨 `EmojiPlacement`

Controls where emojis appear in the message:

| Option     | Description                             |
| ---------- | --------------------------------------- |
| `'inline'` | Emojis can appear within lines.         |
| `'end'`    | Emojis only appear at the end of lines. |
| `'none'`   | No emojis at all. 😢                    |

---

## 🧰 `MsgGenConfig`

Customizable config object for controlling every aspect of the generation process:

### Basic Settings

| Property            | Type      | Description                                           |
| ------------------- | --------- | ----------------------------------------------------- |
| `minLength`         | `number`  | Minimum length of generated text (in characters).     |
| `maxLength`         | `number`  | Maximum length of generated text (in characters).     |
| `readable`          | `boolean` | If true, uses more readable, word-like content.       |
| `useEmojis`         | `boolean` | Enables emoji generation.                             |
| `includeNumbers`    | `boolean` | Allows numbers to appear in output.                   |
| `includeSymbols`    | `boolean` | Allows symbols like `!@#$` in output.                 |
| `allowWeirdSpacing` | `boolean` | Allows extra spacing, newlines, or unexpected casing. |

### Word and Emoji Pools

| Property   | Type       | Description                                    |
| ---------- | ---------- | ---------------------------------------------- |
| `emojiSet` | `string[]` | Custom emoji list (if set, overrides default). |
| `wordSet`  | `string[]` | Custom word list used in readable/mixed modes. |

### Generation Mode

| Property | Type             | Description                                                |
| -------- | ---------------- | ---------------------------------------------------------- |
| `mode`   | `RandomMsgModes` | Chooses between `mixed`, `readable`, `chaotic`, `natural`. |

---

## 📖 Grammar Mode (for `natural`)

| Property             | Type       | Description                                          |
| -------------------- | ---------- | ---------------------------------------------------- |
| `grammar.templates`  | `string[]` | Templates like `"The {adj} {noun} likes to {verb}"`. |
| `grammar.nouns`      | `string[]` | Words to fill `{noun}`.                              |
| `grammar.verbs`      | `string[]` | Words to fill `{verb}`.                              |
| `grammar.adjectives` | `string[]` | Words to fill `{adj}`.                               |

---

## 🔁 Repetition & Emojis

| Property         | Type             | Description                               |
| ---------------- | ---------------- | ----------------------------------------- |
| `repeatWords`    | `boolean`        | If false, avoids repeating the same word. |
| `emojiPlacement` | `EmojiPlacement` | Emoji layout preference.                  |

---

## 📑 Paragraph Support (Optional)

| Property         | Type     | Description                   |
| ---------------- | -------- | ----------------------------- |
| `paragraphs.min` | `number` | Minimum number of paragraphs. |
| `paragraphs.max` | `number` | Maximum number of paragraphs. |

---

## 🧾 Line Generation

| Property           | Type     | Description                          |
| ------------------ | -------- | ------------------------------------ |
| `line.minLength`   | `number` | Minimum characters per line.         |
| `line.maxLength`   | `number` | Maximum characters per line.         |
| `line.emojiChance` | `number` | Chance (0 to 1) for emojis per line. |

---

## 🏗️ Constructor

```js
new UltraRandomMsgGen(config = {})
```

### Arguments:

* `config`: A partial or full `MsgGenConfig` object to customize generation behavior.

### Behavior:

* Initializes internal configuration with defaults.
* Validates all config types and values (length ranges, emoji placement, etc.).
* Automatically loads default words, emojis, and grammar unless overridden.

> ✨ This constructor sets up everything needed for cute, chaotic, or naturally structured nonsense generation!

---

## ⚙️ `configure(newConfig)`

Merge new configuration values into the current generator settings.

* **Parameters:**

  * `newConfig` *(Object)* — Partial config overrides.
* **Returns:** `UltraRandomMsgGen` — The instance (for chaining).

---

## 📝 Grammar Templates & Word Lists Management

These methods let you manage the grammar templates and word lists for sentence generation.

### Template Methods

* **`setGrammarTemplates(...templates)`**
  Replace the entire list of sentence templates.
  *Accepts multiple strings or arrays of strings.*

* **`addGrammarTemplates(...templates)`**
  Append new sentence templates to the existing list.

* **`removeGrammarTemplates(...templates)`**
  Remove specific templates from the list.

---

### Noun Methods

* **`setGrammarNouns(...nouns)`**
  Replace the list of nouns.

* **`addGrammarNouns(...nouns)`**
  Add new nouns to the list.

* **`removeGrammarNouns(...nouns)`**
  Remove specific nouns from the list.

---

### Verb Methods

* **`setGrammarVerbs(...verbs)`**
  Replace the list of verbs.

* **`addGrammarVerbs(...verbs)`**
  Add new verbs.

* **`removeGrammarVerbs(...verbs)`**
  Remove verbs from the list.

---

### Adjective Methods

* **`setGrammarAdjectives(...adjectives)`**
  Replace the list of adjectives.

* **`addGrammarAdjectives(...adjectives)`**
  Add adjectives.

* **`removeGrammarAdjectives(...adjectives)`**
  Remove adjectives.

---

## 🗣️ Word Set Management

* **`setWords(...words)`**
  Replace the entire word set used in readable/mixed modes.

* **`addWords(...words)`**
  Add new words to the existing word set.

* **`removeWords(...words)`**
  Remove specific words from the word set.

---

## 😄 Emoji Set Management

* **`setEmojis(...emojis)`**
  Replace the emoji set used in generation.

* **`addEmojis(...emojis)`**
  Add emojis to the current emoji set.

* **`removeEmojis(...emojis)`**
  Remove emojis from the current set.

---

## 🎲 Internal Helpers (Private Methods)

### `_getRandomItem(array)`

Returns a random element from the given array.

* **Parameters:**

  * `array` *(string\[])* — Array to pick from.
* **Returns:**

  * *(string)* Random element.

---

### `_generateChunk()`

Generates a single random chunk of content based on the current mode and settings.
Chunks can be words, emojis, symbols, numbers, or full sentences (in natural mode).

* **Returns:**

  * *(string)* Random chunk.

---

### `_generateNaturalSentence()`

Generates a natural-language sentence by filling placeholders (`{noun}`, `{verb}`, `{adj}`) in a random template.

* **Returns:**

  * *(string)* Generated sentence.

---

### `_generateLine(targetLength, seenWords)`

Generates a single line of text aiming for `targetLength` characters, applying spacing, casing, and emoji placement rules.
Avoids repeated words if configured.

* **Parameters:**

  * `targetLength` *(number)* — Desired character length.
  * `seenWords` *(Set<string>)* — Tracks used words to avoid repeats.
* **Returns:**

  * *(string)* Generated line.

---

### `_generateParagraphLines(totalLength)`

Generates multiple lines that together reach approximately `totalLength` characters, building a paragraph.

* **Parameters:**

  * `totalLength` *(number)* — Desired paragraph length in characters.
* **Returns:**

  * *(string\[])* Array of generated lines.

---

## 🎉 Main Method

### `generate()`

Generates the final message string using all configured rules.
May return a multi-paragraph text if paragraph config is set.

* **Returns:**

  * *(string)* The full generated message.
