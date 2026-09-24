import { TinySetMapDatabase } from '/src/v1/libs/storage/TinySetMapDatabase.mjs';

/* ============================================================================
   STATE
   ============================================================================ */
/** @type {TinySetMapDatabase|null} */
let database = null;

/* ============================================================================
   DOM HELPERS
   ============================================================================ */
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

/* ============================================================================
   CONSOLE
   ============================================================================ */
const consoleEl = $('#console-output');
const MAX_LOGS = 300;

/**
 * Serializes any value into a readable string for the console panel.
 * @param {unknown} value - The value to format.
 * @returns {string} The formatted representation.
 */
function format(value) {
  if (typeof value === 'string') return value;
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (value instanceof Map) return format([...value.entries()]);
  if (value instanceof Set) return format([...value]);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

/**
 * Appends a line to the console panel.
 * @param {'call'|'return'|'error'} kind - Visual style of the entry.
 * @param {string} tag - Short label shown in the middle column.
 * @param {unknown} body - Payload to render.
 * @returns {void}
 */
function log(kind, tag, body) {
  const entry = document.createElement('div');
  entry.className = `log log--${kind}`;

  const time = document.createElement('span');
  time.className = 'log__time';
  time.textContent = new Date().toLocaleTimeString('en-GB', { hour12: false });

  const label = document.createElement('span');
  label.className = 'log__tag';
  label.textContent = tag;

  const content = document.createElement('span');
  content.className = 'log__body';
  content.textContent = format(body);

  entry.append(time, label, content);
  consoleEl.append(entry);

  while (consoleEl.childElementCount > MAX_LOGS) {
    consoleEl.firstElementChild.remove();
  }
  consoleEl.scrollTop = consoleEl.scrollHeight;
}

/**
 * Runs an async operation, logging the call and its outcome.
 * @param {string} label - Human readable representation of the call.
 * @param {() => Promise<unknown>} operation - The operation to execute.
 * @returns {Promise<unknown>} The operation result, or `undefined` on failure.
 */
async function run(label, operation) {
  log('call', 'CALL', label);
  try {
    const result = await operation();
    log('return', 'RETURN', result);
    return result;
  } catch (error) {
    log('error', error?.name ?? 'Error', error?.message ?? String(error));
    return undefined;
  }
}

/* ============================================================================
   STATUS
   ============================================================================ */
/**
 * Updates the connection indicator in the header.
 * @param {'idle'|'connected'|'error'} state - Visual state.
 * @param {string} text - Label shown next to the dot.
 * @returns {void}
 */
function setStatus(state, text) {
  $('#status-dot').dataset.state = state;
  $('#status-text').textContent = text;
}

/* ============================================================================
   DATABASE LIFECYCLE
   ============================================================================ */
/**
 * Reads the migrations textarea and returns the parsed array.
 * @returns {unknown[]} The parsed migrations.
 */
function readMigrations() {
  return JSON.parse($('#db-migrations').value);
}

/**
 * Instantiates a fresh database from the sidebar form.
 * @returns {Promise<void>}
 */
async function initialize() {
  const name = $('#db-name').value.trim();
  let migrations;
  try {
    migrations = readMigrations();
  } catch (error) {
    log('error', 'SyntaxError', `Invalid migrations JSON: ${error.message}`);
    return;
  }

  await run(`new TinySetMapDatabase("${name}", migrations)`, async () => {
    if (database) await database.close();
    database = new TinySetMapDatabase(name, migrations);
    await database.ready;
    setStatus('connected', `Connected · v${database.version}`);
    refreshTables();
    return { name: database.name, version: database.version, tables: database.tableNames };
  });
}

/**
 * Repopulates the set and map table selectors.
 * @returns {void}
 */
function refreshTables() {
  const setSelect = $('#set-table');
  const mapSelect = $('#map-table');
  setSelect.innerHTML = '';
  mapSelect.innerHTML = '';
  if (!database) return;

  for (const name of database.tableNames) {
    const option = document.createElement('option');
    option.value = name;
    option.textContent = name;
    if (isSetTable(name)) setSelect.append(option);
    else mapSelect.append(option);
  }
}

/**
 * Checks whether a table is a set table.
 * @param {string} name - Table name.
 * @returns {boolean} `true` when the table is a `TinySetDb`.
 */
function isSetTable(name) {
  try {
    database.tableSet(name);
    return true;
  } catch {
    return false;
  }
}

/**
 * Returns the currently selected set table.
 * @returns {import('./TinySetMapDatabase.js').TinySetDb<string>|null}
 */
function currentSet() {
  const name = $('#set-table').value;
  if (!database || !name) {
    log('error', 'Error', 'No set table selected. Initialize the database first.');
    return null;
  }
  return database.tableSet(name);
}

/**
 * Returns the currently selected map table.
 * @returns {import('./TinySetMapDatabase.js').TinyMapDb<string, unknown>|null}
 */
function currentMap() {
  const name = $('#map-table').value;
  if (!database || !name) {
    log('error', 'Error', 'No map table selected. Initialize the database first.');
    return null;
  }
  return database.tableMap(name);
}

/**
 * Splits a comma separated list into a trimmed array of values.
 * @param {string} input - Raw input.
 * @returns {string[]} The parsed values.
 */
function parseList(input) {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

/**
 * Parses a raw input into a JSON value when possible.
 * @param {string} input - Raw input.
 * @returns {unknown} The parsed value or the original string.
 */
function parseValue(input) {
  const trimmed = input.trim();
  if (trimmed === '') return '';
  try {
    return JSON.parse(trimmed);
  } catch {
    return input;
  }
}

/* ============================================================================
   WIRING · LIFECYCLE
   ============================================================================ */
$('#btn-init').addEventListener('click', initialize);
$('#btn-refresh').addEventListener('click', () => {
  refreshTables();
  log('return', 'RETURN', 'Tables refreshed.');
});
$('#btn-close').addEventListener('click', () =>
  run('database.close()', async () => {
    if (!database) throw new Error('No database is open.');
    await database.close();
    setStatus('idle', 'Disconnected');
    return 'Connection closed.';
  }),
);
$('#console-clear').addEventListener('click', () => {
  consoleEl.innerHTML = '';
});

/* ============================================================================
   WIRING · TABS
   ============================================================================ */
$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.tab').forEach((item) => item.classList.remove('tab--active'));
    $$('.tab-panel').forEach((panel) => panel.classList.remove('tab-panel--active'));
    tab.classList.add('tab--active');
  });
});
$$('.tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $(`#panel-${tab.dataset.tab}`).classList.add('tab-panel--active');
  });
});

/* ============================================================================
   WIRING · SET OPERATIONS
   ============================================================================ */
$('#set-add').addEventListener('click', () => {
  const value = $('#set-value').value;
  run(`set.add("${value}")`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.add(value);
  });
});

$('#set-has').addEventListener('click', () => {
  const value = $('#set-value').value;
  run(`set.has("${value}")`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.has(value);
  });
});

$('#set-delete').addEventListener('click', () => {
  const value = $('#set-value').value;
  run(`set.delete("${value}")`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.delete(value);
  });
});

$('#set-seed-run').addEventListener('click', () => {
  const values = parseList($('#set-seed').value);
  run(`set.add([${values.map((v) => `"${v}"`).join(', ')}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    for (const value of values) {
      await table.add(value);
    }
    return table.toArray();
  });
});

$('#set-union').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.union([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return [...(await table.union(other))];
  });
});

$('#set-intersection').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.intersection([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return [...(await table.intersection(other))];
  });
});

$('#set-difference').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.difference([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return [...(await table.difference(other))];
  });
});

$('#set-symmetric').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.symmetricDifference([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return [...(await table.symmetricDifference(other))];
  });
});

$('#set-subset').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.isSubsetOf([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.isSubsetOf(other);
  });
});

$('#set-superset').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.isSupersetOf([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.isSupersetOf(other);
  });
});

$('#set-disjoint').addEventListener('click', () => {
  const other = parseList($('#set-other').value);
  run(`set.isDisjointFrom([${other}])`, async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.isDisjointFrom(other);
  });
});

$('#set-size').addEventListener('click', () =>
  run('set.size', async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.size;
  }),
);

$('#set-toarray').addEventListener('click', () =>
  run('set.toArray()', async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.toArray();
  }),
);

$('#set-tojson').addEventListener('click', () =>
  run('set.toJSON()', async () => {
    const table = currentSet();
    if (!table) return undefined;
    return table.toJSON();
  }),
);

$('#set-values').addEventListener('click', () =>
  run('set.values()', async () => {
    const table = currentSet();
    if (!table) return undefined;
    const collected = [];
    for await (const value of table.values()) collected.push(value);
    return collected;
  }),
);

$('#set-entries').addEventListener('click', () =>
  run('set.entries()', async () => {
    const table = currentSet();
    if (!table) return undefined;
    const collected = [];
    for await (const entry of table.entries()) collected.push(entry);
    return collected;
  }),
);

$('#set-foreach').addEventListener('click', () =>
  run('set.forEach(callback)', async () => {
    const table = currentSet();
    if (!table) return undefined;
    const collected = [];
    await table.forEach((value) => {
      collected.push(value);
    });
    return { iterated: collected.length, values: collected };
  }),
);

$('#set-clear').addEventListener('click', () =>
  run('set.clear()', async () => {
    const table = currentSet();
    if (!table) return undefined;
    await table.clear();
    return 'Set cleared.';
  }),
);

/* ============================================================================
   WIRING · MAP OPERATIONS
   ============================================================================ */
$('#map-set').addEventListener('click', () => {
  const key = $('#map-key').value;
  const value = parseValue($('#map-value').value);
  run(`map.set("${key}", ${JSON.stringify(value)})`, async () => {
    const table = currentMap();
    if (!table) return undefined;
    await table.set(key, value);
    return 'Entry stored.';
  });
});

$('#map-get').addEventListener('click', () => {
  const key = $('#map-key').value;
  run(`map.get("${key}")`, async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.get(key);
  });
});

$('#map-has').addEventListener('click', () => {
  const key = $('#map-key').value;
  run(`map.has("${key}")`, async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.has(key);
  });
});

$('#map-delete').addEventListener('click', () => {
  const key = $('#map-key').value;
  run(`map.delete("${key}")`, async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.delete(key);
  });
});

$('#map-size').addEventListener('click', () =>
  run('map.size', async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.size;
  }),
);

$('#map-toarray').addEventListener('click', () =>
  run('map.toArray()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.toArray();
  }),
);

$('#map-tojson').addEventListener('click', () =>
  run('map.toJSON()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    return table.toJSON();
  }),
);

$('#map-keys').addEventListener('click', () =>
  run('map.keys()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    const collected = [];
    for await (const key of table.keys()) collected.push(key);
    return collected;
  }),
);

$('#map-values').addEventListener('click', () =>
  run('map.values()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    const collected = [];
    for await (const value of table.values()) collected.push(value);
    return collected;
  }),
);

$('#map-entries').addEventListener('click', () =>
  run('map.entries()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    const collected = [];
    for await (const entry of table.entries()) collected.push(entry);
    return collected;
  }),
);

$('#map-foreach').addEventListener('click', () =>
  run('map.forEach(callback)', async () => {
    const table = currentMap();
    if (!table) return undefined;
    const collected = [];
    await table.forEach((value, key) => {
      collected.push([key, value]);
    });
    return { iterated: collected.length, entries: collected };
  }),
);

$('#map-clear').addEventListener('click', () =>
  run('map.clear()', async () => {
    const table = currentMap();
    if (!table) return undefined;
    await table.clear();
    return 'Map cleared.';
  }),
);

/* ============================================================================
   WIRING · DATABASE OPERATIONS
   ============================================================================ */
$('#db-get-name').addEventListener('click', () => run('database.name', async () => database?.name));

$('#db-get-version').addEventListener('click', () =>
  run('database.version', async () => database?.version),
);

$('#db-get-tablenames').addEventListener('click', () =>
  run('database.tableNames', async () => database?.tableNames),
);

$('#db-get-ready').addEventListener('click', () =>
  run('await database.ready', async () => {
    await database?.ready;
    return 'Ready.';
  }),
);

$('#db-has').addEventListener('click', () => {
  const name = $('#db-lookup').value;
  run(`database.has("${name}")`, async () => database?.has(name));
});

$('#db-tableset').addEventListener('click', () => {
  const name = $('#db-lookup').value;
  run(`database.tableSet("${name}")`, async () => {
    const table = database?.tableSet(name);
    return `TinySetDb<${table.storeName}>`;
  });
});

$('#db-tablemap').addEventListener('click', () => {
  const name = $('#db-lookup').value;
  run(`database.tableMap("${name}")`, async () => {
    const table = database?.tableMap(name);
    return `TinyMapDb<${table.storeName}>`;
  });
});

/* ============================================================================
   BOOT
   ============================================================================ */
log('return', 'INFO', 'Console ready. Click "Initialize" to open the database.');
