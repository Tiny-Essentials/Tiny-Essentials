# 🌞 TinyDayNightCycle Documentation

**TinyDayNightCycle** is a lightweight and flexible JavaScript library designed to simulate day and night cycles along with seasonal changes, moons, weather patterns, and in-game time tracking. It allows you to manage and customize time progression, including hours, minutes, and seconds, as well as date transitions with support for variable month lengths and years.

This system also supports dynamic weather changes, moon phases, and seasonal adjustments, making it ideal for game development, simulations, or any interactive experience that requires realistic or custom time and environmental cycles.

With easy-to-use methods and configurable settings, TinyDayNightCycle provides you with precise control over the flow of time and weather in your application.

---

## 📑 Table of Contents

- [📄 Type Definitions](#-type-definitions)
  - [`SelectedWeather`](#selectedweather)
  - [`WeatherCallback`](#weathercallback)
  - [`WeatherCfgs`](#weathercfgs)
  - [`WeatherCfg`](#weathercfg)
  - [`WeatherData`](#weatherdata)
  - [`MoonData`](#moondata)
  - [`MoonRaw`](#moonraw)
- [⚙️ TinyDayNightCycle Class](#️-tinydaynightcycle-class)
- [🌞 Properties, Getters, Setters & Constructor](#-properties-getters-setters--constructor)
  - [🗂️ Private Fields](#️-private-fields)
  - [⚙️ Getters](#️-getters)
  - [⚙️ Setters](#️-setters)
  - [⚙️ Constructor](#️-constructor)
- [🌱 SEASON SYSTEM](#-season-system)
  - [`addSeason(name, values)`](#addseasonname-values)
  - [`removeSeason(name)`](#removeseasonname)
  - [`hasSeason(name)`](#hasseasonname)
  - [`getSeason(name)`](#getseasonname)
- [⏰ TIME SYSTEM](#-time-system)
  - [`setTime({hour = 0, minute = 0, second = 0})`](#settimehour--0-minute--0-second--0)
  - [`addTime({hours = 0, minutes = 0, seconds = 0})`](#addtimehours--0-minutes--0-seconds--0)
  - [`getTime(settings)`](#gettimesettings)
  - [`isDay()`](#isday)
  - [Time Until Day/Night Methods](#time-until-daynight-methods)
  - [`timeUntil(targetHour, unit)`](#timeuntiltargethour-unit)
  - [`setTo(phase)`](#settophase)
- [📅 DAY/MONTH/YEAR SYSTEM](#-daymonthyear-system)
  - [`nextDay(amount = 1)`](#nextdayamount--1)
  - [`prevDay(amount = 1)`](#prevdayamount--1)
  - [`updateSeason()`](#updateseason)
- [🌦️ WEATHER SYSTEM](#️-weather-system)
  - [`setWeatherConfig(config)`](#setweatherconfigconfig)
  - [`setWeatherDuration(minMinutes, maxMinutes)`](#setweatherdurationminminutes-maxminutes)
  - [`updateWeatherTimer(minutesPassed)`](#updateweathertimerminutespassed)
  - [`forceWeather({ where = 'main', type, duration = null })`](#forceweather-where--main-type-duration--null-)
  - [`chooseNewWeather({ customWeather, where = 'main' } = {})`](#choosenewweather-customweather-where--main---)
  - [`_randomInRange(min, max)`](#_randominrangemin-max)
- [🌙 MOON SYSTEM](#-moon-system)
  - [`addMoon(name, cycleLength, phaseNames, startingPhase = 0)`](#addmoonname-cyclelength-phasenames-startingphase--0)
  - [`removeMoon(name)`](#removemoonname)
  - [`advanceMoons(days = 1)`](#advancemoonsdays--1)
  - [`rewindMoons(days = 1)`](#rewindmoonsdays--1)
  - [`advanceMoon(moonIndex, days = 1)`](#advancemoonmoonindex-days--1)
  - [`rewindMoon(moonIndex, days = 1)`](#rewindmoonmoonindex-days--1)
  - [`moonExists(index)`](#moonexistsindex)
  - [`getMoon(index)`](#getmoonindex)
- [⏳ Day, Hour & Minute Sizes](#-day-hour--minute-sizes)
- [⚠️ INTERNAL UTILITIES](#️-internal-utilities)
  - [`_checkDestroyed()`](#_checkdestroyed)
  - [`destroy()`](#destroy)

---

### 📄 Type Definitions

---

#### `SelectedWeather`

Represents a mapping of weather type names to their selected values.  
Each key is a weather type name, and the value is either:  
- A string containing the selected weather configuration name, or  
- `null` if no selection has been made.

```js
typedef {Record<string, string|null>} SelectedWeather
```

---

#### `WeatherCallback`

A callback used to dynamically calculate weather probabilities.

**Parameters:**

* `configs` (Object): Contextual info about the current time and weather state

  * `hour` (number): Current in-game hour (0–23)
  * `minute` (number): Current in-game minute (0–59)
  * `currentMinutes` (number): Minutes since midnight (0–1439)
  * `isDay` (boolean): Whether it's currently daytime
  * `season` (string): Current season
  * `weather` (SelectedWeather): Current active weather types or null if none

**Returns:**

* (number): Probability weight for the weather type

```js
@callback WeatherCallback
```

---

#### `WeatherCfgs`

Represents the complete set of weather configurations.

| Property  | Description                                                      |
| --------- | ---------------------------------------------------------------- |
| `default` | Default weather configuration when no specific condition matches |
| `day`     | Weather configuration used during daytime hours                  |
| `night`   | Weather configuration used during nighttime hours                |
| `hours`   | Specific weather configurations mapped by hour (e.g., `"06"`)    |
| `seasons` | Specific weather configurations mapped by season name            |

```js
typedef {Object} WeatherCfgs
```

---

#### `WeatherCfg`

A weather configuration object mapping weather types to either:

* Numeric probability weights, or
* Dynamic `WeatherCallback` functions.

```js
typedef {Record<string, number | WeatherCallback>} WeatherCfg
```

---

#### `WeatherData`

Resolved weather data with numeric probability values only.

```js
typedef {Record<string, number>} WeatherData
```

---

#### `MoonData`

Data for a moon's current phase.

| Property      | Description                                |
| ------------- | ------------------------------------------ |
| `name`        | Name of the moon                           |
| `phaseIndex`  | Current phase index (zero-based)           |
| `phaseName`   | Descriptive name of the current phase      |
| `cycleLength` | Total phases/days in the moon's full cycle |

```js
typedef {Object} MoonData
```

---

#### `MoonRaw`

Raw data structure for a moon's cycle.

| Property       | Description                                    |
| -------------- | ---------------------------------------------- |
| `name`         | Name of the moon                               |
| `cycleLength`  | Total number of phases in the moon's cycle     |
| `currentPhase` | Current phase index (0-based)                  |
| `phaseNames`   | Optional list of names for each phase in cycle |

```js
typedef {Object} MoonRaw
```

---

### ⚙️ TinyDayNightCycle Class

`TinyDayNightCycle` is a simulation system that handles:

* Customizable day/night cycle with variable sunrise and sunset
* Calendar system with adjustable month lengths
* Dynamic weather with multiple configurable probability layers
* Multi-moon phase tracking

All time and date calculations are independent from real-world time and can run at any speed.

```js
class TinyDayNightCycle {
  // implementation...
}
```

---

### 🌞 Properties, Getters, Setters & Constructor

---

#### 🗂️ Private Fields

| Property           | Type                | Description                                                                                   |
|--------------------|---------------------|-----------------------------------------------------------------------------------------------|
| `#seasons`         | `Map<string, number[]>` | Season configurations mapping each season name to an array of months.                         |
| `#moons`           | `MoonRaw[]`         | Array of tracked moons with independent phases.                                               |
| `#dayStart`        | `number`            | Hour at which the day starts (0–23).                                                         |
| `#nightStart`      | `number`            | Hour at which the night starts (0–23).                                                       |
| `#weather`         | `SelectedWeather`   | Currently active weather types (strings or nulls).                                           |
| `#currentSeconds`  | `number`            | Current time in seconds since midnight (0–86399).                                            |
| `#currentMinutes`  | `number`            | Current time in minutes since midnight (0–1439).                                             |
| `#currentHours`    | `number`            | Current time in hours since midnight (0–24).                                                 |
| `#currentSeason`   | `string`            | Current season name.                                                                          |
| `#currentDay`      | `number`            | Current day of the month.                                                                     |
| `#currentMonth`    | `number`            | Current month number.                                                                  |
| `#currentYear`     | `number`            | Current year count.                                                                           |
| `#isDestroyed`     | `boolean`           | Flag indicating whether the instance has been destroyed.                                     |
| `#monthDays`       | `number[]`          | Number of days in each month (default all 31).                                               |
| `#weatherConfig`   | `WeatherCfgs`       | Weather configuration layers, including defaults, day/night, hours, and seasons.              |
| `#weatherDuration` | `{min: number, max: number}` | Range for duration of weather types in minutes.                                              |
| `#weatherTimeLeft` | `number`            | Minutes remaining until current weather expires.                                             |

---

#### ⚙️ Getters

- **`isDestroyed`** — Returns whether the instance is destroyed.  
  _Returns_: `boolean`

- **`currentSeconds`** — Current time in seconds since midnight.  
  _Returns_: `number` (0 to 86399)

- **`currentMinutes`** — Current time in minutes since midnight.  
  _Returns_: `number` (0 to 1439)

- **`currentHours`** — Current time in hours since midnight, may be decimal (e.g., 14.5 = 14:30).  
  _Returns_: `number` (0 to <24)

- **`moons`** — Array of moons with current phase details (`MoonData[]`).  
  _Returns_: `MoonData[]`

- **`seasons`** — List of all configured season names.  
  _Returns_: `string[]`

- **`dayStart`** — Hour the day starts (0–23).  
  _Returns_: `number`

- **`nightStart`** — Hour the night starts (0–23).  
  _Returns_: `number`

- **`weather`** — Current weather type(s) as a shallow copy.  
  _Returns_: `SelectedWeather`

- **`currentSeason`** — Current active season name.  
  _Returns_: `string`

- **`currentDay`** — Current day of the month.  
  _Returns_: `number`

- **`currentMonth`** — Current month number.  
  _Returns_: `number`

- **`currentYear`** — Current year count.  
  _Returns_: `number`

- **`monthDays`** — Copy of month-to-days mapping for calendar.  
  _Returns_: `number[]`

- **`weatherDuration`** — Range of weather durations (min/max minutes).  
  _Returns_: `{min: number, max: number}`

- **`weatherTimeLeft`** — Minutes left until weather changes.  
  _Returns_: `number`

- **`weatherConfig`** — Deep copy of complete weather configuration object.  
  _Returns_: `WeatherCfgs`

---

#### ⚙️ Setters

- **`currentSeconds`** — Sets current time in seconds (0–86399). Updates minutes and hours accordingly.  
  _Throws_: `TypeError | RangeError`

- **`currentMinutes`** — Sets current time in minutes (0–1439). Updates seconds and hours accordingly.  
  _Throws_: `TypeError | RangeError`

- **`currentHours`** — Sets current time in hours (0–<24), decimals allowed. Updates minutes and seconds accordingly.  
  _Throws_: `TypeError | RangeError`

- **`dayStart`** — Sets hour day starts (must be positive number).  
  _Throws_: `TypeError`

- **`nightStart`** — Sets hour night starts (must be positive number).  
  _Throws_: `TypeError`

- **`weather`** — Sets current weather object with string values or nulls.  
  _Throws_: `TypeError`

- **`currentSeason`** — Sets current season, must be configured season name.  
  _Throws_: `TypeError`

- **`currentDay`** — Sets current day of month (valid day according to month).  
  _Throws_: `TypeError`

- **`currentMonth`** — Sets current month number (must be valid month).  
  _Throws_: `TypeError`

- **`currentYear`** — Sets current year (positive non-zero number).  
  _Throws_: `TypeError`

- **`monthDays`** — Sets custom days per month array.  
  _Throws_: `TypeError`

- **`weatherDuration`** — Sets min/max range for weather durations in minutes.  
  _Throws_: `TypeError`

- **`weatherTimeLeft`** — Sets remaining time for current weather in minutes.  
  _Throws_: `TypeError`

- **`weatherConfig`** — Sets full weather configuration object with validation.  
  _Throws_: `TypeError`

---

#### ⚙️ Constructor

```js
/**
 * Creates a new TinyDayNightCycle instance.
 * @param {number} [dayStart=6] - Hour when the day starts (default 6).
 * @param {number} [nightStart=18] - Hour when the night starts (default 18).
 */
constructor(dayStart = 6, nightStart = 18)
```

Initializes the cycle with provided start times for day and night.

---

### 🌱 SEASON SYSTEM

#### `addSeason(name, values)`

➕ Adds or updates a season with the given name and associated months.

* **Parameters:**

  * `name` (string) — Name of the season.
  * `values` (number\[]) — Array of month numbers linked to this season.
* **Throws:**

  * `TypeError` if `name` is not a string or `values` is not an array of numbers.

---

#### `removeSeason(name)`

❌ Removes a season by name. If the removed season is the current season, resets current season to empty.

* **Parameters:**

  * `name` (string) — Name of the season to remove.
* **Throws:**

  * `TypeError` if `name` is not a string.

---

#### `hasSeason(name)`

🔍 Checks if a season exists.

* **Parameters:**

  * `name` (string) — Season name to check.
* **Returns:**

  * `boolean` — `true` if the season exists, otherwise `false`.
* **Throws:**

  * `TypeError` if `name` is not a string.

---

#### `getSeason(name)`

📅 Retrieves the months linked to a given season.

* **Parameters:**

  * `name` (string) — Season name.
* **Returns:**

  * `number[]` — Array of month numbers for the season.
* **Throws:**

  * `TypeError` if `name` is not a string.
  * `Error` if the season does not exist.

---

### ⏰ TIME SYSTEM

#### `setTime({hour = 0, minute = 0, second = 0})`

🕰️ Sets the internal time directly.

* **Parameters:**

  * `hour` (number, 0–23) — Hour to set.
  * `minute` (number, 0–59) — Minute to set.
  * `second` (number, 0–59) — Second to set.

---

#### `addTime({hours = 0, minutes = 0, seconds = 0})`

➕ Adds time to the current clock, automatically rolling days if needed.

* **Parameters:**

  * `hours` (number) — Hours to add.
  * `minutes` (number) — Minutes to add.
  * `seconds` (number) — Seconds to add.

---

#### `getTime(settings)`

⏳ Gets the current time as an object and formatted string, using the in-game time scale.

* **Parameters:**

  * `settings` (object, optional) — Configuration object with the following optional properties:

    * `hourSize` (`number`) — Number of in-game seconds representing an hour. Default: current internal `hourSize`.
    * `minuteSize` (`number`) — Number of in-game seconds representing a minute. Default: current internal `minuteSize`.
    * `withSeconds` (`boolean`) — Whether to include seconds in the formatted string. Default: `false`.

* **Returns:**
  An object with the following properties:

  ```ts
  {
    hour: number;       // current hour (integer)
    minute: number;     // current minute (integer)
    second: number;     // current second (integer)
    formatted: string;  // formatted time string, e.g. "14:05" or "14:05:30"
  }
  ```

---

#### `isDay()`

☀️ Determines if current time is considered day based on configured day/night start hours.

* **Returns:**

  * `boolean` — `true` if it is day, `false` if night.

---

#### Time Until Day/Night Methods

Calculates time left until the next day or night period starts.

* `minutesUntilDay()` — Minutes until day start.
* `secondsUntilDay()` — Seconds until day start.
* `hoursUntilDay()` — Hours until day start.
* `minutesUntilNight()` — Minutes until night start.
* `secondsUntilNight()` — Seconds until night start.
* `hoursUntilNight()` — Hours until night start.

---

#### `timeUntil(targetHour, unit)`

⌛ Helper calculating time difference until a specific hour.

* **Parameters:**

  * `targetHour` (number) — Target hour (0–23).
  * `unit` ('minutes' | 'seconds' | 'hours') — Unit of returned value.
* **Returns:**

  * Number of units until target hour.

---

#### `setTo(phase)`

⚡ Instantly sets time to start of a phase ("day" or "night").

* **Parameters:**

  * `phase` ("day" | "night") — Phase to jump to.

---

### 📅 DAY/MONTH/YEAR SYSTEM

#### `nextDay(amount = 1)`

▶️ Advances the current date by given days, wraps months and years, updates season and moons.

* **Parameters:**

  * `amount` (number) — Number of days to advance.

---

#### `prevDay(amount = 1)`

◀️ Moves the current date backward by given days, wraps months and years, updates season and moons.

* **Parameters:**

  * `amount` (number) — Number of days to rewind.

---

#### `updateSeason()`

🔄 Updates the current season based on the current month.

---

### 🌦️ WEATHER SYSTEM

#### `setWeatherConfig(config)`

⚙️ Sets the weather configuration object.

* **Parameters:**

  * `config` (WeatherCfgs) — Object containing default, time-based, day/night, and seasonal weather probabilities.

---

#### `setWeatherDuration(minMinutes, maxMinutes)`

⏲️ Sets minimum and maximum duration for weather in minutes.

* **Parameters:**

  * `minMinutes` (number) — Minimum duration in minutes.
  * `maxMinutes` (number) — Maximum duration in minutes.

---

#### `updateWeatherTimer(minutesPassed)`

⏳ Updates the weather timer and triggers new weather if time expires.

* **Parameters:**

  * `minutesPassed` (number) — Minutes passed since last update.

---

#### `forceWeather({ where = 'main', type, duration = null })`

🎯 Forces weather to a specific type optionally for a given duration.

* **Parameters:**

  * `where` (string) — Weather zone key (default `"main"`).
  * `type` (string | null) — Weather type to force.
  * `duration` (number | null) — Duration in minutes; if `null`, random duration is used.

---

#### `chooseNewWeather({ customWeather, where = 'main' } = {})`

🎲 Chooses new weather based on weighted probabilities from config, current time, season, and custom overrides.

* **Parameters:**

  * `customWeather` (WeatherCfg) — Optional overrides for probabilities.
  * `where` (string) — Weather zone key (default `"main"`).
* **Returns:**

  * `string | null` — Selected weather type or null if none chosen.

---

#### `_randomInRange(min, max)`

🎲 Returns a random integer between min and max inclusive.

* **Parameters:**

  * `min` (number) — Minimum integer.
  * `max` (number) — Maximum integer.
* **Returns:**

  * Random integer in the range \[min, max].

---

### 🌙 MOON SYSTEM

#### `addMoon(name, cycleLength, phaseNames, startingPhase = 0)`

🌕 Adds a new moon to the system with cycle length and optional phase names.

* **Parameters:**

  * `name` (string) — Moon name.
  * `cycleLength` (number) — Number of days in the moon cycle (minimum 1).
  * `phaseNames` (string\[]) — Optional array of phase names.
  * `startingPhase` (number, optional) — Initial phase index (default is 0).
* **Returns:**

  * `number` — Index of the newly added moon.

---

#### `removeMoon(name)`

🌓 Removes a moon by its name.

* **Parameters:**

  * `name` (string) — Name of the moon to remove.

---

#### `advanceMoons(days = 1)`

➡️ Advances all moons forward by the specified number of days.

* **Parameters:**

  * `days` (number) — Days to advance (default 1).

---

#### `rewindMoons(days = 1)`

⬅️ Moves all moons backward by the specified number of days.

* **Parameters:**

  * `days` (number) — Days to rewind (default 1).

---

#### `advanceMoon(moonIndex, days = 1)`

⏩ Advances a single moon’s phase by given days.

* **Parameters:**

  * `moonIndex` (number) — Index of the moon to advance.
  * `days` (number) — Number of days to advance (default 1).
* **Throws:**

  * `RangeError` if moonIndex is invalid.

---

#### `rewindMoon(moonIndex, days = 1)`

⏪ Rewinds a single moon’s phase by given days.

* **Parameters:**

  * `moonIndex` (number) — Index of the moon to rewind.
  * `days` (number) — Number of days to rewind (default 1).
* **Throws:**

  * `RangeError` if moonIndex is invalid.

---

#### `moonExists(index)`

🔎 Checks if a moon exists at the given index.

* **Parameters:**

  * `index` (number) — Moon index to check.
* **Returns:**

  * `boolean` — `true` if moon exists, else `false`.

---

#### `getMoon(index)`

🌗 Retrieves moon data including name, current phase, phase name, and cycle length.

* **Parameters:**

  * `index` (number | MoonRaw) — Moon index or a MoonRaw object.
* **Returns:**

  * `MoonData` — Object with moon details:

    * `name` (string)
    * `phaseIndex` (number)
    * `phaseName` (string)
    * `cycleLength` (number)
* **Throws:**

  * `TypeError` if argument is not a valid index or MoonRaw object.
  * `RangeError` if index is invalid.
  * `Error` if MoonRaw is missing required properties.

---

### ⏳ Day, Hour & Minute Sizes

* **`autoSizeAdjuste`** — Stores whether proportional recalculation of `daySize`, `hourSize`, and `minuteSize` should occur automatically when one of them is updated.

  * **Getter:** Returns whether automatic proportional size adjustment is enabled.
  * **Setter:** Sets whether automatic proportional size adjustment is enabled.

* **`daySize`** — Gets or sets the number of in-game seconds representing a full day.
Keeps the proportion for `hourSize` and `minuteSize` if `autoSizeAdjuste` is enabled.

  * **Getter:** Returns the current value.
  * **Setter:** Accepts a positive finite number; throws an error otherwise.

* **`hourSize`** — Gets or sets the number of in-game seconds representing a full hour.
Keeps the proportion for `daySize` and `minuteSize` if `autoSizeAdjuste` is enabled.

  * **Getter:** Returns the current value.
  * **Setter:** Accepts a positive finite number; throws an error otherwise.

* **`minuteSize`** — Gets or sets the number of in-game seconds representing a full minute.
Keeps the proportion for `hourSize` and `daySize` if `autoSizeAdjuste` is enabled.

  * **Getter:** Returns the current value.
  * **Setter:** Accepts a positive finite number; throws an error otherwise.

> ⚠️ Changing these values dynamically will affect how in-game time progresses.

---

### ⚠️ INTERNAL UTILITIES

#### `_checkDestroyed()`

🔒 Checks if the instance has been destroyed and throws if so.

* **Throws:**

  * `Error` if instance is already destroyed.

---

#### `destroy()`

💥 Destroys the instance, clearing all data and marking it unusable.

* Clears all internal collections and resets primitive values.
* After calling, any further method calls should throw or be ignored.
