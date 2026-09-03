import { TinyGamepad } from '/src/v1/libs/game/TinyGamepad.mjs';

window.TinyGamepad = TinyGamepad;
let tg = null;

const log = (msg) => {
  const box = document.getElementById('log');
  const line = document.createElement('div');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
};

// Atualiza o status da interface em tempo real
const updateUI = () => {
  if (!tg) return;

  // Atualiza textos simples
  document.getElementById('heldKeys').textContent = [...tg.heldKeys].join(', ') || '-';
  document.getElementById('activeMappedInputs').textContent =
    [...tg.activeMappedInputs].join(', ') || '-';
  document.getElementById('activeMappedKeys').textContent =
    [...tg.activeMappedKeys].join(', ') || '-';
  document.getElementById('comboInputs').textContent = tg.comboMappedInputs.join(', ') || '-';
  document.getElementById('comboKeys').textContent = tg.comboMappedKeys.join(', ') || '-';
  document.getElementById('mode').textContent = tg.inputMode;
  document.getElementById('gamepadId').textContent = tg.hasGamepad() ? tg.getGamepad().id : 'None';

  // --- Atualização dos botões isPressure no Real-Time Status ---
  let pressureData = '-';
  if (tg.hasGamepad()) {
    const gp = tg.getGamepad();
    const buttons = gp.buttons;
    const pressedPressureButtons = [];
    buttons.forEach((btn, idx) => {
      // tinyGamepad adiciona isPressure? Vamos checar pressionamento sensível
      // O gamepad padrão tem btn.value e btn.pressed, mas "isPressure" não é nativo.
      // Vamos considerar botão com valor > 0.1 e não booleano puro como pressão:
      if (btn.pressed && btn.value !== undefined && btn.value > 0.1) {
        pressedPressureButtons.push(`Button${idx}: ${btn.value.toFixed(2)}`);
      }
    });
    pressureData = pressedPressureButtons.length ? pressedPressureButtons.join('\n') : 'None';
  }
  document.getElementById('pressureButtons').textContent = pressureData;

  // Atualiza eixos analógicos
  const analogsContainer = document.getElementById('analogsContainer');

  // Limpa os eixos antes de atualizar
  // Preservamos o título h3, removendo outros elementos filhos
  [...analogsContainer.children]
    .filter((el) => el.tagName.toLowerCase() !== 'h3')
    .forEach((el) => analogsContainer.removeChild(el));

  if (tg.hasGamepad()) {
    const gp = tg.getGamepad();
    const axes = gp.axes;

    // Para cada eixo, cria a linha com barra e valor
    axes.forEach((value, index) => {
      // Aplica deadzone pra display: mostra 0 se dentro da deadzone
      const dz = tg.deadZone;
      const valToDisplay = Math.abs(value) < dz ? 0 : value;

      // Cria container da linha do eixo
      const row = document.createElement('div');
      row.className = 'analog-row';

      // Label do eixo
      const label = document.createElement('div');
      label.className = 'analog-label';
      label.textContent = `Axis ${index}`;

      // Barra do eixo
      const bar = document.createElement('div');
      bar.className = 'analog-bar';

      // Barra preenchida da esquerda ou direita, com base no sinal do valor
      const fill = document.createElement('div');
      fill.className = 'analog-fill';
      if (valToDisplay < 0) fill.classList.add('negative');

      // Valor absoluto para largura proporcional
      fill.style.width = `${Math.min(Math.abs(valToDisplay) * 100, 100)}%`;

      bar.appendChild(fill);

      // Valor numérico
      const valueSpan = document.createElement('div');
      valueSpan.className = 'analog-value';
      valueSpan.textContent = valToDisplay.toFixed(3);

      row.appendChild(label);
      row.appendChild(bar);
      row.appendChild(valueSpan);

      analogsContainer.appendChild(row);
    });
  } else {
    // Se não tem gamepad conectado
    const noGp = document.createElement('div');
    noGp.style.color = '#999';
    noGp.style.fontStyle = 'italic';
    noGp.textContent = 'No gamepad connected to display analog data.';
    analogsContainer.appendChild(noGp);
  }
};

function renderPrettyJSON(container, data) {
  container.innerHTML = '';
  const root = formatValue(data, 0);
  container.appendChild(root);
}

function formatValue(value, depth) {
  const container = document.createElement('div');
  container.className = 'json-indent';

  if (Array.isArray(value)) {
    container.appendChild(createLine('[', 'json-bracket'));
    value.forEach((item, index) => {
      const line = document.createElement('div');
      line.className = 'json-line';
      const valNode = formatValue(item, depth + 1);
      line.appendChild(valNode);
      container.appendChild(line);
    });
    container.appendChild(createLine(']', 'json-bracket'));
  } else if (typeof value === 'object' && value !== null) {
    container.appendChild(createLine('{', 'json-bracket'));
    Object.entries(value).forEach(([key, val], index, arr) => {
      const line = document.createElement('div');
      line.className = 'json-line';
      const spanKey = document.createElement('span');
      spanKey.className = 'json-key';
      spanKey.textContent = `"${key}"`;
      line.appendChild(spanKey);
      line.appendChild(document.createTextNode(': '));
      const valNode = formatValue(val, depth + 1);
      line.appendChild(valNode);
      container.appendChild(line);
    });
    container.appendChild(createLine('}', 'json-bracket'));
  } else {
    let span = document.createElement('span');
    if (typeof value === 'string') {
      span.className = 'json-string';
      span.textContent = `"${value}"`;
    } else if (typeof value === 'number') {
      span.className = 'json-number';
      span.textContent = value;
    } else if (typeof value === 'boolean') {
      span.className = 'json-boolean';
      span.textContent = value;
    } else if (value === null) {
      span.className = 'json-null';
      span.textContent = 'null';
    }
    return span;
  }

  return container;
}

function createLine(text, className) {
  const line = document.createElement('div');
  line.className = 'json-line';
  const span = document.createElement('span');
  span.className = className;
  span.textContent = text;
  line.appendChild(span);
  return line;
}

// Atualiza o feed de sensores (giroscópio, acelerômetro, bússola se houver)
const updateSensorFeed = () => {
  if (!tg) return;

  const sensorOutput = document.getElementById('sensorOutput');

  if (!tg.hasGamepad()) {
    sensorOutput.textContent = 'No gamepad connected to display sensor data.';
    return;
  }

  const gp = tg.getGamepad();
  const sensors = tg.getGamepadSensors?.() || {};

  // Monta objeto com dados principais:
  const data = {
    timestamp: gp ? gp.timestamp : Date.now(),
    mouse: {
      x: lastMouseX ?? null,
      y: lastMouseY ?? null,
    },
    axes: gp.axes.map((v) => Number(v.toFixed(3))),
    buttons: gp.buttons.map((b) => ({
      pressed: b.pressed,
      value: Number(b.value.toFixed(3)),
    })),
    sensors: {},
  };

  // Se TinyGamepad implementa sensores
  if (sensors.gyroscope) {
    data.sensors.gyroscope = {
      x: sensors.gyroscope.x.toFixed(3),
      y: sensors.gyroscope.y.toFixed(3),
      z: sensors.gyroscope.z.toFixed(3),
    };
  }
  if (sensors.accelerometer) {
    data.sensors.accelerometer = {
      x: sensors.accelerometer.x.toFixed(3),
      y: sensors.accelerometer.y.toFixed(3),
      z: sensors.accelerometer.z.toFixed(3),
    };
  }
  if (sensors.compass) {
    data.sensors.compass = {
      heading: sensors.compass.heading.toFixed(3),
    };
  }

  renderPrettyJSON(sensorOutput, data);
};

let lastMouseX = null;
let lastMouseY = null;
window.addEventListener('mousemove', (e) => {
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

// Loop para atualizar UI e sensor feed continuamente
const startLiveUI = () => {
  const update = () => {
    updateUI();
    updateSensorFeed();
    requestAnimationFrame(update);
    updateMappings();
  };
  update();
};

const updateMappings = () => {
  const pre = document.getElementById('inputMappings');
  const mapped = Object.entries(tg.mappedInputs)
    .map(([k, v]) => `${k} → ${Array.isArray(v) ? v.join(', ') : v}`)
    .join('\n');
  pre.textContent = mapped || 'No mappings yet.';
};

const applyDefaultMappings = () => {
  const defaultBindings = {
    Jump: 'Button0',
    Shoot: 'Button1',
    MoveLeft: ['Axis0-', 'ArrowLeft'],
    MoveRight: ['Axis0+', 'ArrowRight'],
    MoveUp: ['Axis1-', 'ArrowUp'],
    MoveDown: ['Axis1+', 'ArrowDown'],
    Reload: ['KeyR', 'ShiftLeft'],
    Chat: 'KeyT',
    Action: 'KeyF',
    Dash: 'Mouse1',
  };

  for (const [logical, physical] of Object.entries(defaultBindings)) {
    tg.mapInput(logical, physical);
    tg.onInput(
      logical,
      (evt) =>
        evt.input && log(`Mapped input "${logical}" triggered via ${evt.type} (${evt.input})`),
    );
  }
};

document.getElementById('initBtn').addEventListener('click', () => {
  if (tg) return;

  const expectedId = document.getElementById('expectedId').value || null;
  const ignoreRaw = document.getElementById('ignoreIds').value;
  const ignoreIds = ignoreRaw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const deadZone = parseFloat(document.getElementById('deadZone').value);
  const useKeyboardMouse = document.getElementById('useKeyboardMouse').checked;
  const debugAllInputs = document.getElementById('debugAllInputs').checked;

  if (useKeyboardMouse) document.addEventListener('contextmenu', (event) => event.preventDefault());

  tg = new TinyGamepad({
    expectedId,
    ignoreIds,
    deadZone,
    inputMode: useKeyboardMouse ? 'both' : 'gamepad-only',
    allowMouse: true,
  });
  window.tg = tg;

  tg.onConnected((e) => log(`Gamepad connected: ${e.id}`));
  tg.onDisconnected((e) => log(`Gamepad disconnected: ${e.id}`));

  tg.mapInput('All', '*');
  if (debugAllInputs)
    tg.onInput('All', (evt) => evt.key !== 'MouseMove' && console.log(`Input (ALL)`, evt));

  /** tg.onMappedInputStart((evt) =>
          console.log(
            `Mapped Input Start`,
            evt,
            tg.activeMappedInputs,
            tg.comboMappedInputs,
          ),
        );
        tg.onMappedInputEnd((evt) =>
          console.log(
            `Mapped Input End`,
            evt,
            tg.activeMappedInputs,
            tg.comboMappedInputs,
          ),
        );

        if (debugAllInputs) {
          tg.onMappedKeyStart((evt) =>
            console.log(`Mapped Key Input Start`, evt, tg.comboMappedKeys),
          );
          tg.onMappedKeyEnd((evt) =>
            console.log(`Mapped Key Input End`, evt, tg.comboMappedKeys),
          );
        } */

  tg.registerInputSequence(['Chat', 'Action'], (timestamp) =>
    console.log('Chat + Action', tg.activeMappedInputs, timestamp),
  );

  tg.registerKeySequence(['KeyP', 'KeyU', 'KeyD', 'KeyD', 'KeyI', 'KeyN', 'KeyG'], (timestamp) =>
    console.log('Pudding cheat!', timestamp),
  );

  tg.onInput(
    '*',
    (evt) => debugAllInputs && evt.input && log(`Raw Input ${evt.input} from ${evt.type}`),
  );

  tg.onMappedInputStart(
    (evt) => evt.input && log(`Mapped Input Start: ${evt.logicalName} (${evt.input})`),
  );
  tg.onMappedInputEnd(
    (evt) => evt.input && log(`Mapped Input End: ${evt.logicalName} (${evt.input})`),
  );

  tg.onMappedKeyStart((evt) => log(`Mapped Key Start: ${evt.key}`));
  tg.onMappedKeyEnd((evt) => log(`Mapped Key End: ${evt.key}`));

  tg.registerInputSequence(['Chat', 'Action'], (timestamp) =>
    log(`Input Sequence Triggered! ${timestamp}`),
  );
  tg.registerKeySequence(['KeyP', 'KeyU', 'KeyD', 'KeyD', 'KeyI', 'KeyN', 'KeyG'], (timestamp) =>
    log('🟣 Secret Key Sequence Triggered (PUDDING)!'),
  );

  applyDefaultMappings();
  startLiveUI();
  log('TinyGamepad initialized!');
  document.getElementById('initBtn').setAttribute('disabled', true);
  document.getElementById('debugAllInputs').setAttribute('disabled', true);
  document.getElementById('useKeyboardMouse').setAttribute('disabled', true);
});

document.getElementById('mapInputBtn').addEventListener('click', () => {
  if (!tg) return alert('Initialize TinyGamepad first!');
  const logical = document.getElementById('logicalName').value.trim();
  const physical = document.getElementById('physicalInput').value.trim();
  if (!logical || !physical) return alert('Please provide both logical and physical input.');
  tg.mapInput(logical, physical);
  tg.onInput(logical, (evt) => {
    if (evt.input) log(`Mapped input "${logical}" triggered via ${evt.type} (${evt.input})`);
  });
});

document.getElementById('exportBtn').addEventListener('click', () => {
  if (!tg) return;
  document.getElementById('configJson').value = JSON.stringify(tg.exportConfig(), null, 2);
  log('Configuration exported.');
});

document.getElementById('importBtn').addEventListener('click', () => {
  if (!tg) return;
  try {
    const json = document.getElementById('configJson').value;
    tg.importConfig(json);
    log('Configuration imported.');
  } catch (err) {
    alert('Invalid JSON');
  }
});

document.getElementById('vibrateBtn').addEventListener('click', () => {
  if (!tg) return;
  const success = tg.vibrate?.({ duration: 200 });
  log(success ? 'Vibration triggered.' : 'Vibration not supported.');
});

const awaitBtn = document.getElementById('awaitInputBtn');
const awaitNameInput = document.getElementById('awaitLogicalName');
const awaitStatus = document.getElementById('awaitStatus');

awaitBtn.addEventListener('click', async () => {
  const logicalName = awaitNameInput.value.trim();
  if (!logicalName) {
    alert('Please enter a logical name first.');
    return;
  }

  awaitStatus.textContent = 'Waiting for input...';

  try {
    // Chama o método para aguardar input
    const input = await tg.awaitInputMapping();

    // Mapeia automaticamente
    tg.mapInput(logicalName, input.key);

    awaitStatus.textContent = `Mapped "${logicalName}" to "${input.key}"`;
  } catch (err) {
    console.error(err);
    awaitStatus.textContent = 'Await cancelled or failed.';
  }
});
