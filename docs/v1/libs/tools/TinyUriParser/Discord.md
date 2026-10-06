# 📡 TinyUriParser & Discord URI Toolkit

> A tiny, dependency-free toolkit for parsing and rebuilding Discord URIs,
> mentions, invites, CDN assets, and more — with strict runtime validation.

---

## 📖 Table of Contents

1. [Overview](#-overview)
2. [Installation](#-installation)
3. [Core Concepts](#-core-concepts)
4. [TinyUriParser API](#-tinyuriparser-api)
5. [Discord Module](#-discord-module-discordmjs)
   - [Mentions](#1--mentions)
   - [Game Profiles](#2--game-profiles)
   - [Guild Navigation](#3--guild-navigation)
   - [Emojis](#4--emojis)
   - [Timestamps](#5--timestamps)
   - [Commands](#6--commands)
   - [Invites](#7--invites)
   - [Message Links](#8--message-links)
   - [CDN Assets](#9--cdn-assets)
6. [Known Issues](#-known-issues)

---

## 🎯 Overview

This project has two layers:

| Layer | File | Responsibility |
| --- | --- | --- |
| 🧩 **Engine** | `TinyUriParser` | Generic, protocol-agnostic URI parser/stringifier. |
| 💬 **Discord** | `TinyUriParser/Discord` | All Discord-specific parsers built on top of the engine. |

The engine knows **nothing** about Discord. It only knows how to:

1. Test a string against a set of registered parsers.
2. Return a structured `{ type, data }` object.
3. Rebuild the original string from that object.

The Discord module plugs into the engine by exporting **parser pairs**.

---

## 📦 Installation

```js
// Import the engine
import TinyUriParser from 'tiny-essentials/libs/tools/TinyUriParser';

// Import the Discord parser collection
import { DiscordProtocolParsers } from 'tiny-essentials/libs/tools/TinyUriParser/Discord';
```

---

## 🧩 Core Concepts

### What is a `ParserPair`?

A `ParserPair` is an immutable tuple with **exactly four** elements:

```js
[type, checker, parser, stringify]
```

| Index | Name | Type | Purpose |
| --- | --- | --- | --- |
| 0 | `type` | `string` | Unique identifier (e.g., `'emoji'`). |
| 1 | `checker` | `(uri: string) => boolean` | Returns `true` if this parser can handle the URI. |
| 2 | `parser` | `(uri: string) => ParsedUri` | Converts the URI into a structured object. |
| 3 | `stringify` | `(data: object) => string` | Rebuilds the URI from parsed data. |

### The `ParsedUri` shape

Every parser returns an object with this shape:

```js
{
  type: 'emoji',              // The parser category
  data: { /* parser-specific payload */ }
}
```

---

## 🔧 TinyUriParser API

### `TinyUriParser.buildParserPair(type, checker, parser, stringify)`

Static factory. Creates a frozen `ParserPair`.

```js
const MyPair = TinyUriParser.buildParserPair(
  'greeting',
  (uri) => uri.startsWith('hello:'),
  (uri) => ({ dataType: 'greeting', name: uri.slice(6) }),
  (data) => `hello:${data.name}`,
);
```

### `new TinyUriParser(...parsers)`

Creates a new parser registry.

```js
const parser = new TinyUriParser(...DiscordProtocolParsers);
```

### `parser.parse(uri)`

Parses a URI string into a `{ type, data }` object.

```js
const result = parser.parse('<:party:123456789>');
// { type: 'emoji', data: { dataType: 'emoji', name: 'party', id: '123456789', animated: false } }
```

### `parser.stringify(parsedObject)`

Rebuilds the original URI from a parsed object.

```js
parser.stringify(result);
// '<:party:123456789>'
```

### `parser.parsers`

Returns a **copy** of the registered parser pairs. Mutating the result does not affect the instance.

### `parser.size`

Returns the number of registered parsers.

### `parser.destroy()`

Clears internal state and marks the instance as destroyed. All subsequent calls throw.

---

## 💬 Discord Module

### 📥 Importing

```js
import TinyUriParser from 'tiny-essentials/libs/tools/TinyUriParser';
import {
  DiscordProtocolParsers,
  DiscordMentionParser,
  DiscordEmojiParser,
  // ...etc
} from 'tiny-essentials/libs/tools/TinyUriParser/Discord';

const parser = new TinyUriParser(...DiscordProtocolParsers);
```

> ⚠️ **Order matters.** `DiscordProtocolParsers` is pre-sorted from the most
> specific parser to the most permissive. Always spread it as-is.

---

### 1. 👤 Mentions

Parses `<@id>`, `<@!id>`, `<@&id>` and `<#id>`.

| Input | `target` | `isNickname` |
| --- | --- | --- |
| `<@123>` | `'user'` | `false` |
| `<@!123>` | `'user'` | `true` |
| `<@&123>` | `'role'` | `false` |
| `<#123>` | `'channel'` | `false` |

```js
parser.parse('<@!42>');
// { type: 'mention', data: { dataType: 'mention', target: 'user', id: '42', isNickname: true } }
```

---

### 2. 🎮 Game Profiles

Parses `<@$id>`.

```js
parser.parse('<@$1402418491272986635>');
// { type: 'game_profile', data: { dataType: 'game_profile', id: '1402418491272986635' } }
```

---

### 3. 🧭 Guild Navigation

Parses `<id:type>` and `<id:linked-roles:roleId>`.

| Target | Description |
| --- | --- |
| `customize` | Opens the "Customize" tab. |
| `browse` | Opens the "Browse Channels" tab. |
| `guide` | Opens the server guide. |
| `linked-roles` | Requires a `roleId`. |

```js
parser.parse('<id:linked-roles:123456789>');
// { type: 'guild_navigation', data: { dataType: 'guild_navigation', target: 'linked-roles', roleId: '123456789' } }
```

---

### 4. 😀 Emojis

Parses `<:name:id>` and `<a:name:id>`.

```js
parser.parse('<a:party:123456789>');
// { type: 'emoji', data: { dataType: 'emoji', name: 'party', id: '123456789', animated: true } }
```

---

### 5. ⏰ Timestamps

Parses `<t:unix>` and `<t:unix:style>`.

| Style | Meaning |
| --- | --- |
| `t` | Short time (16:20) |
| `T` | Long time (16:20:30) |
| `d` | Short date (20/04/2024) |
| `D` | Long date (20 April 2024) |
| `f` | Short date/time |
| `F` | Long date/time |
| `R` | Relative ("2 hours ago") |
| `s` | Short date/time (lowercase) |
| `S` | Long date/time (uppercase) |

```js
parser.parse('<t:1618953630:R>');
// { type: 'timestamp', data: { dataType: 'timestamp', timestamp: 1618953630, style: 'R' } }
```

---

### 6. ⌨️ Commands

Parses `</name:id>`, `</name sub:id>` and `</name group sub:id>`.

```js
parser.parse('</play music:123456789>');
// {
//   type: 'command',
//   data: {
//     dataType: 'command',
//     name: 'play music',
//     command: 'play',
//     subcommandGroup: null,
//     subcommand: 'music',
//     id: '123456789'
//   }
// }
```

---

### 7. 🔗 Invites

Parses clean and whitespace-obfuscated invite links.

| Input | `host` | `kind` | `obfuscated` |
| --- | --- | --- | --- |
| `discord.gg/abc` | `'discord.gg'` | `null` | `false` |
| `discord.com/invite/abc` | `'discord.com'` | `'invite'` | `false` |
| `discord.com/servers/abc` | `'discord.com'` | `'servers'` | `false` |
| `discord . gg / abc` | `'discord.gg'` | `null` | `true` |

```js
parser.parse('discord.gg/abc?ref=friend');
// {
//   type: 'invite',
//   data: {
//     dataType: 'invite',
//     code: 'abc',
//     host: 'discord.gg',
//     kind: null,
//     obfuscated: false,
//     params: { ref: 'friend' }
//   }
// }
```

---

### 8. ✉️ Message Links

Parses `https://discord.com/channels/<guild>/<channel>/<message>`.

```js
parser.parse('https://discord.com/channels/1/2/3');
// {
//   type: 'message_link',
//   data: {
//     dataType: 'message_link',
//     guildId: '1',
//     channelId: '2',
//     messageId: '3',
//     params: {}
//   }
// }
```

---

### 9. 🖼️ CDN Assets

Parses URLs from `cdn.discordapp.com` and `media.discordapp.net`.

**Supported asset kinds** (in match order):

```
attachment, guild_member_avatar, guild_member_banner, achievement_icon,
sticker_pack_banner, store_page_asset, application_asset, application_icon,
guild_icon, guild_splash, guild_discovery_splash, banner, default_user_avatar,
user_avatar, avatar_decoration, team_icon, emoji, sticker, role_icon,
guild_scheduled_event_cover, guild_tag_badge
```

```js
parser.parse('https://cdn.discordapp.com/icons/123/abc.png?size=128');
// {
//   type: 'cdn_asset',
//   data: {
//     dataType: 'cdn_asset',
//     kind: 'guild_icon',
//     host: 'cdn.discordapp.com',
//     path: 'icons/123/abc.png',
//     hash: 'abc',
//     ext: 'png',
//     filename: null,
//     spoiler: false,
//     segments: { guildId: '123' },
//     params: { size: '128' }
//   }
// }
```

---

## ⚠️ Known Issues

### 🐛 Syntax errors (blocking)

The following lines are **missing an opening parenthesis** before the template
literal. They will throw a `SyntaxError` at parse time:

```js
// ❌ Broken
throw new TypeError`Parser at index ${index} must be an array.`);

// ✅ Fixed
throw new TypeError(`Parser at index ${index} must be an array.`);
```

This pattern repeats in **`TinyUriParser`** (3 occurrences) and
**`Discord`** (18 occurrences). Also check:

```js
// ❌ Broken
return { regex: new RegExp`^${pattern}$`), names };

// ✅ Fixed
return { regex: new RegExp(`^${pattern}$`), names };
```
