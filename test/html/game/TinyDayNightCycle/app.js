import { TinyDayNightCycle } from '/src/v1/libs/game/TinyDayNightCycle.mjs';
import { multiplyArrayBlocks } from '/src/v1/basics/array.mjs';
window.TinyDayNightCycle = TinyDayNightCycle;
/* ===========================
       TinyDayNightCycle Tester Script
       - Expects TinyDayNightCycle to be available on window.TinyDayNightCycle
       - Controls many API points: setTime, addTime, setTo, monthDays,
         setWeatherConfig, setWeatherDuration, forceWeather, chooseNewWeather
       - Provides auto-tick and event logging
    ============================ */

document.getElementById('weatherConfig').value =
  '{"default":{"sunny":50,"cloudy":30,"rain":20},"day":{"sunny":60,"cloudy":25,"rain":15},"night":{"clear":50,"cloudy":30,"rain":20},"hours":{"06:00-09:00":{"fog":40,"sunny":30,"cloudy":30},"20:00-23:00":{"clear":60,"cloudy":40}},"seasons":{"winter":{"snow":50,"cloudy":30,"sunny":20},"summer":{"sunny":70,"cloudy":20,"rain":10}}}';
document.getElementById('monthConfig').value = '[40,25,35,28,40,25,30,20,45,33,30,50]';

// Utility helpers
const $ = (sel, root = document) => root.querySelector(sel);
const el = (id) => document.getElementById(id);
const nowStr = () => new Date().toLocaleTimeString();

// UI elements
const ui = {
  time: el('ui-time'),
  moon: el('ui-moon'),
  moonStep: el('ui-moon-step'),
  phase: el('ui-phase'),
  date: el('ui-date'),
  season: el('ui-season'),
  weather: el('ui-weather'),
  weatherTTL: el('ui-weather-ttl'),
  nextDayTTL: el('ui-next-day-ttl'),
  nextNightTTL: el('ui-next-night-ttl'),
  timelineBar: el('timelineBar'),
  timelineLabel: el('timelineLabel'),
  weatherBar: el('weatherBar'),
  weatherHint: el('weatherHint'),
  log: el('log'),
  assumption: el('assumption'),
};

// Controls
const controls = {
  dayStart: el('dayStart'),
  nightStart: el('nightStart'),
  setHour: el('setHour'),
  setMinute: el('setMinute'),
  btnSetTime: el('btnSetTime'),
  btnSetToDay: el('btnSetToDay'),
  btnSetToNight: el('btnSetToNight'),
  addHours: el('addHours'),
  addMinutes: el('addMinutes'),
  btnAddTime: el('btnAddTime'),
  btnAddTick: el('btnAddTick'),
  currentMonth: el('currentMonth'),
  currentYear: el('currentYear'),
  currentDay: el('currentDay'),
  monthConfig: el('monthConfig'),
  btnApplyMonthConfig: el('btnApplyMonthConfig'),
  btnSetDate: el('btnSetDate'),
  weatherMin: el('weatherMin'),
  weatherMax: el('weatherMax'),
  weatherConfig: el('weatherConfig'),
  btnApplyWeatherConfig: el('btnApplyWeatherConfig'),
  btnChooseWeather: el('btnChooseWeather'),
  btnForceClear: el('btnForceClear'),
  forceType: el('forceType'),
  forceDuration: el('forceDuration'),
  btnForceWeather: el('btnForceWeather'),
  tickMs: el('tickMs'),
  tickMinutes: el('tickMinutes'),
  btnStartAuto: el('btnStartAuto'),
  btnStopAuto: el('btnStopAuto'),
  btnClearLog: el('btnClearLog'),
  btnExportLog: el('btnExportLog'),
};

// Tester state
let cycle = null; // TinyDayNightCycle instance (provided by user)
let autoHandle = null;
let logs = [];

function log(...args) {
  const prefix = '[' + nowStr() + ']';
  const line = prefix + ' ' + args.join(' ');
  logs.push(line);
  ui.log.innerText = logs.slice(-500).join('\n');
  ui.log.scrollTop = ui.log.scrollHeight;
}

function resetUIStateIfMissing() {
  if (typeof window.TinyDayNightCycle !== 'function') {
    ui.assumption.innerHTML =
      'Missing <strong>TinyDayNightCycle</strong> — include your class file first.';
    disableAllControls(true);
    return false;
  }
  ui.assumption.innerHTML = 'Assume: <strong>TinyDayNightCycle</strong> is loaded on the page.';
  disableAllControls(false);
  return true;
}

function disableAllControls(disabled) {
  for (const k in controls) {
    if (
      controls[k] instanceof HTMLButtonElement ||
      controls[k] instanceof HTMLInputElement ||
      controls[k] instanceof HTMLTextAreaElement
    )
      controls[k].disabled = disabled;
  }
}

function createCycleIfNeeded() {
  if (!resetUIStateIfMissing()) return false;
  if (!cycle) {
    // eslint-disable-next-line no-undef
    cycle = new window.TinyDayNightCycle(
      Number(controls.dayStart.value),
      Number(controls.nightStart.value),
    );
    window.cycle = cycle;

    cycle.addSeason('winter', [12, 1, 2]);
    cycle.addSeason('spring', [3, 4, 5]);
    cycle.addSeason('summer', [6, 7, 8]);
    cycle.addSeason('autumn', [9, 10, 11]);

    cycle.addMoon(
      'Moon',
      29,
      multiplyArrayBlocks(
        [
          'New Moon',
          'Waxing Crescent',
          'First Quarter',
          'Waxing Gibbous',
          'Full Moon',
          'Waning Gibbous',
          'Last Quarter',
          'Waning Crescent',
        ],
        [4, 4, 3, 3, 4, 3, 4, 4],
      ),
    );
    // initialize month/day/season from UI
    cycle.currentMonth = Number(controls.currentMonth.value) || 1;
    cycle.currentYear = Number(controls.currentYear.value) || 1;
    cycle.currentDay = Number(controls.currentDay.value) || 1;
    cycle.updateSeason?.();
    log('Created TinyDayNightCycle instance.');
  }
  return true;
}

/* ---------- UI -> Cycle actions ---------- */

controls.btnSetTime.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const hour = Number(controls.setHour.value || 0);
  const minute = Number(controls.setMinute.value || 0);
  cycle.setTime({ hour, minute });
  log('setTime', `${hour}:${minute}`);
  refreshUI();
});

controls.btnSetToDay.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  cycle.setTo('day');
  log('setTo day');
  refreshUI();
});

controls.btnSetToNight.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  cycle.setTo('night');
  log('setTo night');
  refreshUI();
});

controls.btnAddTime.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const hours = Number(controls.addHours.value || 0);
  const minutes = Number(controls.addMinutes.value || 0);
  cycle.addTime({ hours, minutes });
  log('addTime', `${hours}h ${minutes}m`);
  refreshUI();
});

controls.btnAddTick.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const minutes = Number(prompt('Advance how many minutes?', '60')) || 0;
  cycle.addTime({ minutes });
  log('manual tick +' + minutes + 'min');
  refreshUI();
});

controls.btnApplyMonthConfig.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  try {
    const cfg = JSON.parse(controls.monthConfig.value || '{}');
    cycle.monthDays = cfg;
    log('Applied month config', JSON.stringify(cfg));
  } catch (e) {
    log('Invalid JSON for month config:', e.message);
  }
  refreshUI();
});

controls.btnSetDate.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  cycle.currentMonth = Number(controls.currentMonth.value) || 1;
  cycle.currentYear = Number(controls.currentYear.value) || 1;
  cycle.currentDay = Number(controls.currentDay.value) || 1;
  cycle.updateSeason?.();
  log(
    'Set date to',
    `Day ${cycle.currentDay} / Month ${cycle.currentMonth} / Year ${cycle.currentYear}`,
  );
  refreshUI();
});

controls.btnApplyWeatherConfig.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  try {
    const cfg = JSON.parse(controls.weatherConfig.value || '{}');
    cycle.weatherConfig = cfg;
    log('Applied weather config');
  } catch (e) {
    log('Invalid JSON for weather config:', e.message);
  }
  refreshUI();
});

controls.btnChooseWeather.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const w = cycle.chooseNewWeather?.() ?? cycle.getRandomWeather?.();
  log('chooseNewWeather =>', w);
  refreshUI();
});

controls.btnForceClear.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  cycle.forceWeather?.({ type: 'clear' });
  log('forceWeather clear');
  refreshUI();
});

controls.btnForceWeather.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const type = controls.forceType.value.trim();
  if (!type) return log('No weather type provided to force.');
  const dur = Number(controls.forceDuration.value) || null;
  cycle.forceWeather?.({ type, duration: dur });
  log('forceWeather', type, dur ? `${dur}min` : '(auto)');
  refreshUI();
});

controls.btnStartAuto.addEventListener('click', () => {
  if (!createCycleIfNeeded()) return;
  const ms = Math.max(50, Number(controls.tickMs.value) || 500);
  const minutes = Math.max(1, Number(controls.tickMinutes.value) || 1);
  startAutoTick(ms, minutes);
  log('Auto tick started', `${minutes} min / ${ms} ms`);
});

controls.btnStopAuto.addEventListener('click', () => {
  stopAutoTick();
  log('Auto tick stopped');
});

controls.btnClearLog.addEventListener('click', () => {
  logs = [];
  ui.log.innerText = '';
  log('Log cleared');
});

controls.btnExportLog.addEventListener('click', () => {
  const blob = new Blob([logs.join('\\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'daynight-log.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  log('Log exported');
});

// When user changes day/night start values, update instance if exists
controls.dayStart.addEventListener('change', () => {
  if (cycle) {
    cycle.dayStart = Number(controls.dayStart.value);
    log('dayStart changed', cycle.dayStart);
    refreshUI();
  }
});
controls.nightStart.addEventListener('change', () => {
  if (cycle) {
    cycle.nightStart = Number(controls.nightStart.value);
    log('nightStart changed', cycle.nightStart);
    refreshUI();
  }
});

// Update weather duration controls
controls.weatherMin.addEventListener('change', () => {
  if (cycle)
    cycle.setWeatherDuration?.(
      Number(controls.weatherMin.value),
      Number(controls.weatherMax.value),
    );
  refreshUI();
});
controls.weatherMax.addEventListener('change', () => {
  if (cycle)
    cycle.setWeatherDuration?.(
      Number(controls.weatherMin.value),
      Number(controls.weatherMax.value),
    );
  refreshUI();
});

/* ---------- Auto tick ---------- */
function startAutoTick(ms, minutes) {
  stopAutoTick();
  autoHandle = setInterval(() => {
    if (!cycle) return;
    cycle.addTime({ minutes });
    refreshUI();
  }, ms);
}
function stopAutoTick() {
  if (autoHandle) {
    clearInterval(autoHandle);
    autoHandle = null;
  }
}

/* ---------- UI refresh ---------- */
function refreshUI() {
  if (!cycle) {
    resetUIStateIfMissing();
    return;
  }
  const t = cycle.getTime?.(false) ?? { hour: 0, minute: 0, formatted: '--:--' };
  ui.time.innerText = t.formatted ?? `${t.hour}:${t.minute}`;
  ui.phase.innerText = cycle.isDay?.() ? 'Day' : 'Night';

  const m = cycle.moons;
  ui.moon.innerText = m[0].phaseName;
  ui.moonStep.innerText =
    typeof m[0].phaseIndex === 'number' ? `Phase ${m[0].phaseIndex + 1}` : '—';

  ui.date.innerText = `Day ${cycle.currentDay} / Month ${cycle.currentMonth} / Year ${cycle.currentYear}`;
  ui.season.innerText = cycle.currentSeason ?? '—';

  ui.weather.innerText = cycle.weather.main ?? '—';
  ui.weatherTTL.innerText =
    cycle.weatherTimeLeft != null ? `${Math.max(0, Math.round(cycle.weatherTimeLeft))} min` : '--';

  ui.nextDayTTL.innerText = `${Math.max(0, Math.round(cycle.minutesUntilDay()))} min`;
  ui.nextNightTTL.innerText = `${Math.max(0, Math.round(cycle.minutesUntilNight()))} min`;

  // timeline progress across day
  const progress = ((cycle.currentMinutes ?? 0) / 1440) * 100;
  ui.timelineBar.style.width = progress + '%';
  ui.timelineLabel.innerText = Math.round(progress) + '%';

  // weather progress bar (percentage of remaining vs duration)
  if (cycle.weatherTimeLeft != null && cycle.weatherDuration != null) {
    const max = cycle.weatherDuration.max ?? 1;
    const min = cycle.weatherDuration.min ?? 0;
    const dur = Math.max(1, max);
    const perc = Math.min(100, (cycle.weatherTimeLeft / dur) * 100);
    ui.weatherBar.style.width = perc + '%';
    ui.weatherHint.innerText = `${Math.round(perc)}% left`;
  } else {
    ui.weatherBar.style.width = '0%';
    ui.weatherHint.innerText = '--';
  }
}

/* ---------- Initialization ---------- */
// Try to create cycle automatically if class exists
(function init() {
  if (typeof window.TinyDayNightCycle === 'function') {
    createCycleIfNeeded();
    // ensure weather duration if present
    const wm = Number(controls.weatherMin.value),
      wx = Number(controls.weatherMax.value);
    cycle.setWeatherDuration?.(wm, wx);
    // initial choose weather if not present
    if (!cycle.weather.main) cycle.chooseNewWeather?.();
    refreshUI();
    log('Tester ready — TinyDayNightCycle found');
  } else {
    resetUIStateIfMissing();
    log('TinyDayNightCycle class not found. Please include it and reload the tester.');
  }
})();

// expose some helpers for console debugging
window.__DNC_TESTER__ = {
  getCycle: () => cycle,
  log,
  refreshUI,
  startAutoTick,
  stopAutoTick,
};
