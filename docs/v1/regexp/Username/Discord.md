# 🎮 Discord Pattern Templates

> A declarative catalog of **35 regular-expression templates** that describe Discord's
> markup, mentions, links and CDN assets.

This module contains **no logic**. It is a frozen, plain-object registry. All the
intelligence lives in the engine; this file only declares *what* a
Discord artifact looks like.

---

## 📑 Table of Contents

1. [What is this file?](#-what-is-this-file)
2. [The 60-second mental model](#-the-60-second-mental-model)
3. [Template catalog](#-template-catalog)
   - [Markup & mentions](#-markup--mentions)
   - [Links & invites](#-links--invites)
   - [CDN assets](#-cdn-assets)
4. [Daily usage recipes](#-daily-usage-recipes)
5. [Testing your changes](#-testing-your-changes)
6. [Adding a new template](#-adding-a-new-template)
7. [Quick reference](#-quick-reference)

---

## 📌 What is this file?

`Discord` is a **data-only module**. It exports a single frozen object:

```javascript
import DiscordRegex from 'tiny-essentials/regexp/Username/Discord';

DiscordRegex.userMention;
// { prefix: '<@', validValues: '[0-9]', length: [17, 22], domain: '>' }
```

Each key is a **`UsernameRegexTemplate`** — a plain object that the engine
translates into a `RegExp`. Nothing is compiled until you call the engine.

**Use it when you need to:**

- ✅ Validate that a string is a real Discord snowflake mention.
- ✅ Extract every CDN URL from a message before it is deleted or cached.
- ✅ Detect invite links for anti-spam / moderation.
- ✅ Build a syntax highlighter for Discord-flavoured markdown.

**Do not use it for:** authentication, permission checks, or anything where a
regex is the only line of defence. A regex proves *shape*, never *authorization*.

---

## 🧠 The 60-second mental model

Every template is expanded by the engine in this exact order:

```text
^  {start}  {prefix}  (?:{validValues}){min,max}  {domainPart}  $
   └ raw ─┘ └escaped┘ └──── the "core" ────────┘  └ suffix ──┘
```

| Step | Function | Reads |
| :--- | :--- | :--- |
| 1 | `getPrefix()` | `start`, `prefix` |
| 2 | `usernameStringRegexBuilder()` | `validValues`, `length` |
| 3 | `getDomainPart()` | `domainPattern` **or** `domain`, plus `end` |

The result is a **single-line, fully anchored** pattern. There is no `m` flag
and no `s` flag, so `.` never matches a newline.

---

## 📚 Template Catalog

### 🏷️ Markup & mentions

| Key | Example match | Notes |
| :--- | :--- | :--- |
| `spoiler` | `\|\|hidden text\|\|` | 1–2000 chars. Content excludes a lone `\|`. |
| `mediaSpoiler` | `SPOILER_cat.png` | Discord's attachment spoiler prefix. |
| `userMention` | `<@123456789012345678>` | Snowflake = 17–22 digits. |
| `nicknameMention` | `<@!123456789012345678>` | Mention with server nickname. |
| `roleMention` | `<@&123456789012345678>` | Role ping. |
| `channelMention` | `<#123456789012345678>` | Text, voice, forum, stage — all types. |
| `customEmoji` | `<:party_parrot:123456789012345678>` | Name: 2–32 chars. |
| `animatedEmoji` | `<a:party_parrot:123456789012345678>` | Same, with the `a:` marker. |
| `timestamp` | `<t:1700000000:R>` | Style is optional. |
| `slashCommand` | `</ping:123456789012345678>` | Also matches subcommands. |
| `gameProfile` | `<@$123456789012345678>` | Game profile mention. |
| `guildNavigation` | `<id:customize>` | Also `<id:linked-roles:ID>`. |

**Why `spoiler` is ReDoS-safe** — the content class is
`[^|]|\|(?!\|)`. The two alternatives are mutually exclusive on the first
character, so the engine never has to backtrack. It stays linear even at
`{1,2000}`.

---

### 🔗 Links & invites

| Key | Example match | Notes |
| :--- | :--- | :--- |
| `messageLink` | `https://discord.com/channels/111…/222…/333…` | Accepts `@me` for DMs. |
| `inviteLink` | `https://discord.gg/abc123` | Also `discord.com/invite/…`. |

Both keep the query string attached via `end: OPTIONAL_QUERY_STRING`, so
`?utm_source=discord` stays inside the match instead of being silently dropped.

---

### 🖼️ CDN assets

Every CDN template shares the same skeleton:

```text
https?://(?:cdn\.discordapp\.com|media\.discordapp\.net)/<path>/<SNOWFLAKE>/<HASH>.<ext>
```

| Key | Path segment |
| :--- | :--- |
| `cdnAttachment` | `/attachments/CHANNEL/ATTACHMENT/FILENAME` |
| `cdnEmoji` | `/emojis/EMOJI_ID.ext` |
| `cdnGuildIcon` | `/icons/GUILD/HASH.ext` |
| `cdnGuildSplash` | `/splashes/GUILD/HASH.ext` |
| `cdnGuildDiscoverySplash` | `/discovery-splashes/GUILD/HASH.ext` |
| `cdnBanner` | `/banners/ID/HASH.ext` |
| `cdnDefaultUserAvatar` | `/embed/avatars/0.ext` |
| `cdnUserAvatar` | `/avatars/USER/HASH.ext` |
| `cdnGuildMemberAvatar` | `/guilds/GUILD/users/USER/avatars/HASH.ext` |
| `cdnGuildMemberBanner` | `/guilds/GUILD/users/USER/banners/HASH.ext` |
| `cdnAvatarDecoration` | `/avatar-decoration-presets/HASH.ext` |
| `cdnApplicationIcon` | `/app-icons/APP/HASH.ext` |
| `cdnApplicationAsset` | `/app-assets/APP/HASH.ext` |
| `cdnAchievementIcon` | `/app-assets/APP/achievements/ID/icons/HASH.ext` |
| `cdnStorePageAsset` | `/app-assets/APP/store/HASH` |
| `cdnStickerPackBanner` | `/app-assets/APP/store/HASH.ext` |
| `cdnTeamIcon` | `/team-icons/TEAM/HASH.ext` |
| `cdnSticker` | `/stickers/STICKER.ext` |
| `cdnRoleIcon` | `/role-icons/ROLE/HASH.ext` |
| `cdnGuildScheduledEventCover` | `/guild-events/EVENT/HASH.ext` |
| `cdnGuildTagBadge` | `/guild-tag-badges/GUILD/HASH.ext` |

**Accepted extensions:** `jpg`, `jpeg`, `png`, `webp`, `gif`, `avif`.

---

## 🚀 Daily usage recipes

### 1. Validate a single mention

```javascript
import { isValidUsername } from 'tiny-essentials/regexp/Username';
import DiscordRegex from 'tiny-essentials/regexp/Username/templates/Discord';

isValidUsername('<@123456789012345678>', DiscordRegex.userMention);
// true
```

### 2. Extract every mention from a message

```javascript
import { extractUsernames } from 'tiny-essentials/regexp/Username';
import DiscordRegex from 'tiny-essentials/regexp/Username/templates/Discord';

const mentions = extractUsernames(
  'hey <@123456789012345678> and <@987654321098765432>',
  [DiscordRegex.userMention, DiscordRegex.nicknameMention],
);
// ['<@123456789012345678>', '<@987654321098765432>']
```

### 3. Build a reusable validator once

```javascript
import { usernameRegex } from 'tiny-essentials/regexp/Username';
import DiscordRegex from 'tiny-essentials/regexp/Username/templates/Discord';

// Build the RegExp once and reuse it — never rebuild inside a loop.
const INVITE = usernameRegex(DiscordRegex.inviteLink);

export const isInvite = (text) => INVITE.test(text);
```

### 4. Normalize mentions to lowercase

```javascript
const rules = { ...DiscordRegex.customEmoji, transform: 'lowercase' };
const emojis = extractUsernames('<:Party_Parrot:123456789012345678>', rules);
// ['<:party_parrot:123456789012345678>']
```

---

## 🧪 Testing your changes

Because this file is pure data, a snapshot test is enough:

```javascript
import { describe, it, expect } from 'vitest';
import { usernameRegex } from 'tiny-essentials/regexp/Username';
import DiscordRegex from 'tiny-essentials/regexp/Username/templates/Discord';

describe('Discord', () => {
  it('matches a standard user mention', () => {
    expect(usernameRegex(DiscordRegex.userMention).test('<@123456789012345678>')).toBe(true);
  });

  it('rejects a mention with a short snowflake', () => {
    expect(usernameRegex(DiscordRegex.userMention).test('<@123>')).toBe(false);
  });

  it('keeps the query string on a CDN attachment', () => {
    const url = 'https://cdn.discordapp.com/attachments/111111111111111111/222222222222222222/a.png?ex=1';
    expect(usernameRegex(DiscordRegex.cdnAttachment).test(url)).toBe(true);
  });
});
```

**Always test the negative case.** A pattern that matches everything is worse
than no pattern at all.

---

## ➕ Adding a new template

1. **Pick the right section.** Keep CDN entries at the bottom, grouped.
2. **Reuse the shared constants.** `SNOWFLAKE`, `CDN_HOST`, `CDN_EXT`,
   `CDN_HASH` and `OPTIONAL_QUERY_STRING` already exist. Do not duplicate them.
3. **Prefer `prefix`/`domain` over `start`/`domainPattern`** unless you truly
   need regex. Escaped literals are safer.
4. **Add the JSDoc block** with `@type {UsernameRegexTemplate}` so the editor
   keeps autocompleting.
5. **Add a row to the catalog table** in this document.

```javascript
  /**
   * CDN: Soundboard Sound
   * Format: https://cdn.discordapp.com/soundboard-sounds/ID
   * @type {UsernameRegexTemplate}
   */
  cdnSoundboardSound: {
    start: `${CDN_HOST}/soundboard-sounds/`,
    validValues: '[0-9]',
    length: [17, 22],
    end: OPTIONAL_QUERY_STRING,
  },
```

---

## 📋 Quick reference

```javascript
import DiscordRegex from 'tiny-essentials/regexp/Username/templates/Discord';

// 35 keys, all frozen at the top level.
Object.keys(DiscordRegex).length; // 35

// Every value follows the same shape:
// { start?, prefix?, validValues, length, domain?, domainPattern?, end? }
```

| Group | Count | Keys |
| :--- | :--: | :--- |
| Markup & mentions | 12 | `spoiler`, `mediaSpoiler`, `userMention`, `nicknameMention`, `roleMention`, `channelMention`, `customEmoji`, `animatedEmoji`, `timestamp`, `slashCommand`, `gameProfile`, `guildNavigation` |
| Links & invites | 2 | `messageLink`, `inviteLink` |
| CDN assets | 21 | `cdn*` |
