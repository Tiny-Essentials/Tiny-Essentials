# 🧠 `TinyRateLimiter` – A Simple Per-User Rate Limiter

The `TinyRateLimiter` is a flexible and lightweight JavaScript class designed to help you limit actions (like requests or commands) per user. You can define rules like **maximum hits**, **time windows**, and benefit from automatic memory cleanup. ✨

---

## 📑 Table of Contents

- [📦 Constructor](#-constructor)
  - [🔧 Options](#-options)
- [📋 Methods](#-methods)
  - [🚀 `hit(userId: string): void`](#-hituserid-string-void)
  - [❌ `isRateLimited(userId: string): boolean`](#-isratelimiteduserid-string-boolean)
  - [🧾 `isGroupId(id: string): boolean`](#-isgroupidid-string-boolean)
  - [🛠️ `setData(userId: string, timestamps: number[]): void`](#-setdatauserid-string-timestamps-number-void)
  - [📥 `getData(userId: string): number[]`](#-getdatauserid-string-number)
  - [🧠 `getMaxHits(): number`](#-getmaxhits-number)
  - [⏳ `getInterval(): number`](#-getinterval-number)
  - [👀 `getLastHit(userId: string): number|null`](#-getlasthituserid-string-numbernull)
  - [⌛ `getTimeSinceLastHit(userId: string): number|null`](#-gettimesincelasthituserid-string-numbernull)
  - [📊 `getAverageHitSpacing(userId: string): number|null`](#-getaveragehitspacinguserid-string-numbernull)
  - [🔗 `getGroupId(userId: string): string`](#-getgroupiduserid-string-string)
  - [📦 `assignToGroup(userId: string, groupId: string): void`](#-assigntogroupuserid-string-groupid-string-void)
  - [💡 `getGroupTTL(groupId: string): number|undefined`](#-getgroupttlgroupid-string-numberundefined)
  - [🕰️ `setGroupTTL(groupId: string, ttl: number): void`](#-setgroupttlgroupid-string-ttl-number-void)
  - [📊 `getMetrics(groupId: string): { totalHits, lastHit, timeSinceLastHit, averageHitSpacing }`](#-getmetricsgroupid-string--totalhits-lasthit-timesincelasthit-averagehitspacing-)
  - [🧼 `destroy(): void`](#-destroy-void)
  - [🧠 `setOnMemoryExceeded(callback: () => void): void`](#-setonmemoryexceededcallback---void-void)
  - [🧽 `clearOnMemoryExceeded(): void`](#-clearonmemoryexceeded-void)
  - [🕓 `setOnGroupExpired(callback: (groupId: string) => void): void`](#-setongroupexpiredcallback-groupid-string--void-void)
  - [🔕 `clearOnGroupExpired(): void`](#-clearongroupexpired-void)
  - [❌ `deleteGroupTTL(groupId: string): void`](#-deletegroupttlgroupid-string-void)
  - [♻️ `resetGroup(groupId: string): void`](#-resetgroupgroupid-string-void)
  - [👤 `resetUserGroup(userId: string): void`](#-resetusergroupuserid-string-void)
  - [🔍 `hasData(userId: string): boolean`](#-hasdatauserid-string-boolean)
  - [👥 `getUsersInGroup(groupId: string): string[]`](#-getusersingroupgroupid-string-string)
  - [💤 `getMaxIdle(): number`](#-getmaxidle-number)
  - [💤 `setMaxIdle(ms: number): void`](#-setmaxidlems-number-void)
  - [📈 `getTotalHits(groupId: string): number`](#-gettotalhitsgroupid-string-number)
- [🧽 Automatic Cleanup](#-automatic-cleanup)
- [💥 Errors](#-errors)
- [🧪 Example Usage](#-example-usage)
- [🌈 Summary](#-summary)

---

## 📦 Constructor

```js
new TinyRateLimiter(options)
```

### 🔧 Options

| Option            | Type     | Default     | Description                                    |
| ----------------- | -------- | ----------- | ---------------------------------------------- |
| `maxHits`         | `number` | `undefined` | Max number of hits per user before blocking 🚧 |
| `interval`        | `number` | `undefined` | Time window in milliseconds ⏱️                 |
| `cleanupInterval` | `number` | `undefined` | Interval to auto-clean inactive users 🧹       |
| `maxIdle`         | `number` | `300000`    | Max idle time per user before cleanup 💤       |
| `maxMemory`       | `number` | `100000`    | Max memory size limit before auto cleanup 🚧   |

> ⚠️ At least one of `maxHits` or `interval` must be defined.

---

## 📋 Methods

### 🚀 `hit(userId: string): void`

Registers a hit for the given `userId`.

⚠️ **Important usage notice**
  * This method **must be called before** `isRateLimited(userId)` in order for rate limit checks to work correctly.

```js
rateLimiter.hit("user123");
```

Tracks timestamps internally and automatically removes old entries based on `interval` and `maxHits`.

---

### ❌ `isRateLimited(userId: string): boolean`

Checks if the given `userId` is currently rate limited.

```js
if (rateLimiter.isRateLimited("user123")) {
  console.log("Too many actions! Please slow down.");
}
```

---

### 🧾 `isGroupId(id: string): boolean`

Checks whether a given `id` is marked as a **groupId** (i.e., it represents a group and not a single user).

```js
if (rateLimiter.isGroupId('group-xyz')) {
  console.log('This is a group ID!');
}
```

---

### 🛠️ `setData(userId: string, timestamps: number[]): void`

Sets the hit timestamps for a specific user. Useful for restoring or mocking state.

```js
rateLimiter.setData("user123", [Date.now() - 1000, Date.now()]);
```

---

### 📥 `getData(userId: string): number[]`

Returns all hit timestamps for a given user.

```js
const hits = rateLimiter.getData("user123");
console.log(hits); // [timestamp1, timestamp2, ...]
```

---

### 🧠 `getMaxHits(): number`

Returns the configured `maxHits` value, or throws if invalid.

---

### ⏳ `getInterval(): number`

Returns the configured `interval` value, or throws if invalid.

#### Sliding Window Rate Limiting

TinyRateLimiter uses a sliding window strategy.

Hits are tracked as timestamps, and only those that occurred within the
last `interval` milliseconds are counted. The window moves continuously
with time, ensuring fair and predictable rate limiting without fixed resets.

---

### 👀 `getLastHit(userId: string): number|null`

Returns the timestamp of the user's last hit, or `null` if none.

---

### ⌛ `getTimeSinceLastHit(userId: string): number|null`

Returns how much time (in ms) has passed since the user's last hit.

---

### 📊 `getAverageHitSpacing(userId: string): number|null`

Returns the average time (in ms) between a user's hits, or `null` if not enough data.

---

### 🔗 `getGroupId(userId: string): string`

Returns the group ID that the user is assigned to (default is same as userId).

---

### 📦 `assignToGroup(userId: string, groupId: string): void`

Manually assigns a user to a specific group for shared rate limits.

---

### 💡 `getGroupTTL(groupId: string): number|undefined`

Returns the custom TTL (ms) for a specific group, if defined.

---

### 🕰️ `setGroupTTL(groupId: string, ttl: number): void`

Sets the maximum idle time before a group is auto-cleaned.

---

### 📊 `getMetrics(groupId: string): { totalHits, lastHit, timeSinceLastHit, averageHitSpacing }`

Returns a detailed summary of activity for a group:

```js
{
  totalHits: number,
  lastHit: number|null,
  timeSinceLastHit: number|null,
  averageHitSpacing: number|null
}
```

---

### 🧼 `destroy(): void`

Stops internal timers and clears all stored data. Ideal for cleanup in tests or long-running apps.

---

### 🧠 `setOnMemoryExceeded(callback: () => void): void`

Sets a callback to be called when memory usage (based on internal data size) exceeds a threshold.

```js
rateLimiter.setOnMemoryExceeded(() => {
  console.warn("Rate limiter memory usage is high!");
});
```

---

### 🧽 `clearOnMemoryExceeded(): void`

Clears the memory-exceeded callback.

---

### 🕓 `setOnGroupExpired(callback: (groupId: string) => void): void`

Sets a callback that will be called whenever a group expires due to inactivity (based on TTL or `maxIdle`).

```js
rateLimiter.setOnGroupExpired((groupId) => {
  console.log(`Group "${groupId}" has expired.`);
});
```

---

### 🔕 `clearOnGroupExpired(): void`

Removes the group expiration callback.

---

### ❌ `deleteGroupTTL(groupId: string): void`

Removes any custom TTL (idle timeout) for a specific group.

```js
rateLimiter.deleteGroupTTL("admins");
```

---

### ♻️ `resetGroup(groupId: string): void`

Removes all hit history and data for a group (but keeps user–group associations unless manually removed).

---

### 👤 `resetUserGroup(userId: string): void`

Fully removes a user's data about group assignment.

---

### 🔍 `hasData(userId: string): boolean`

Returns `true` if the user has any stored data (hits or group association).

---

### 👥 `getUsersInGroup(groupId: string): string[]`

Returns a list of users assigned to the given group.

---

### 💤 `getMaxIdle(): number`

Returns the current global `maxIdle` value (in ms) used for cleanup.

---

### 💤 `setMaxIdle(ms: number): void`

Sets the global `maxIdle` value (in ms), which applies to all groups without a custom TTL.

---

### 📈 `getTotalHits(groupId: string): number`

Returns the total number of hits recorded for a given group.

```js
const total = rateLimiter.getTotalHits("group42");
console.log(`Group total hits: ${total}`);
```

---

## 🧽 Automatic Cleanup

Inactive groups are automatically removed every `cleanupInterval` milliseconds if they haven't had any hits for longer than their TTL (or `maxIdle` if not set).

This helps reduce memory usage and keeps your limiter lean and clean! 🪶

---

## 💥 Errors

The constructor will throw if:

* Neither `maxHits` nor `interval` are provided.
* Any of the values are not positive integers.

---

## 🧪 Example Usage

```js
const limiter = new TinyRateLimiter({
  maxHits: 5,
  interval: 10000,
  cleanupInterval: 60000,
  maxIdle: 120000,
  maxMemory: 100000,
});

limiter.hit("user42");

if (limiter.isRateLimited("user42")) {
  console.log("Rate limited! 🛑");
} else {
  console.log("Action allowed ✅");
}
```

---

## 🌈 Summary

| Feature                    | Support |
| -------------------------- | ------- |
| Per-user tracking          | ✅       |
| Max hits                   | ✅       |
| Time window interval       | ✅       |
| Automatic cleanup          | ✅       |
| Manual data control        | ✅       |
| Lightweight + fast         | ✅       |
| Group-based rate limiting  | ✅       |
| Activity metrics per group | ✅       |

