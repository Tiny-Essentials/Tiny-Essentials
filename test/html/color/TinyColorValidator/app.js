import { TinyColorValidator } from '/src/v1/libs/color/TinyColorValidator.mjs';

const {
  isColor,
  isHex,
  isHexa,
  isRgb,
  isRgba,
  isHsl,
  isHsla,
  isHwb,
  isLab,
  isLch,
  isName,
  isSpecialName,
  parseHex,
  parseHexa,
  parseRgb,
  parseRgba,
  parseHsl,
  parseHsla,
  parseHwb,
  parseLab,
  parseLch,
} = TinyColorValidator;

window.TinyColorValidator = TinyColorValidator;

const parsers = {
  isHex: parseHex,
  isHexa: parseHexa,
  isRgb: parseRgb,
  isRgba: parseRgba,
  isHsl: parseHsl,
  isHsla: parseHsla,
  isHwb: parseHwb,
  isLab: parseLab,
  isLch: parseLch,
};

const colorInput = document.getElementById('colorInput');
const validateAllBtn = document.getElementById('validateAllBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const validateAllResults = document.getElementById('validateAllResults');

validateAllBtn.addEventListener('click', () => {
  try {
    const value = colorInput.value.trim();
    const result = isColor(value);
    validateAllResults.textContent = `Input: "${value}"\nResult: ${result}`;
  } catch (err) {
    validateAllResults.textContent = `Error: ${err.message}`;
  }
});

clearAllBtn.addEventListener('click', () => {
  colorInput.value = '';
  validateAllResults.textContent = '';
});

// Specific validators
const specificInput = document.getElementById('specificInput');
const specificResults = document.getElementById('specificResults');

document.querySelectorAll('[data-validator]').forEach((button) => {
  button.addEventListener('click', () => {
    const validatorName = button.dataset.validator;
    const value = specificInput.value.trim();
    try {
      const fn = eval(validatorName); // dynamic function access
      const result = fn(value);
      specificResults.textContent = `Validator: ${validatorName}\nInput: "${value}"\nResult: ${result}`;
    } catch (err) {
      specificResults.textContent = `Error with ${validatorName}: ${err.message}`;
    }
  });
});

// HTML Color Registry
const htmlName = document.getElementById('htmlName');
const htmlResults = document.getElementById('htmlResults');
document.getElementById('addHtmlName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.addName(htmlName.value);
    htmlResults.textContent = `Added "${htmlName.value}": ${result}`;
  } catch (err) {
    htmlResults.textContent = `Error: ${err.message}`;
  }
});
document.getElementById('removeHtmlName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.removeName(htmlName.value);
    htmlResults.textContent = `Removed "${htmlName.value}": ${result}`;
  } catch (err) {
    htmlResults.textContent = `Error: ${err.message}`;
  }
});
document.getElementById('checkHtmlName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.hasName(htmlName.value);
    htmlResults.textContent = `Exists "${htmlName.value}": ${result}`;
  } catch (err) {
    htmlResults.textContent = `Error: ${err.message}`;
  }
});

// Special Color Registry
const specialName = document.getElementById('specialName');
const specialResults = document.getElementById('specialResults');
document.getElementById('addSpecialName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.addSpecialName(specialName.value);
    specialResults.textContent = `Added "${specialName.value}": ${result}`;
  } catch (err) {
    specialResults.textContent = `Error: ${err.message}`;
  }
});
document.getElementById('removeSpecialName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.removeSpecialName(specialName.value);
    specialResults.textContent = `Removed "${specialName.value}": ${result}`;
  } catch (err) {
    specialResults.textContent = `Error: ${err.message}`;
  }
});
document.getElementById('checkSpecialName').addEventListener('click', () => {
  try {
    const result = TinyColorValidator.hasSpecialName(specialName.value);
    specialResults.textContent = `Exists "${specialName.value}": ${result}`;
  } catch (err) {
    specialResults.textContent = `Error: ${err.message}`;
  }
});

// --- Predefined test colors ---
const defaultColors = TinyColorValidator.getNames();
const predefinedColors = [
  '#fff',
  '#ffffff',
  '#ffffffff', // hex
  'rgb(255, 0, 0)', // rgb
  'rgba(0,255,0,0.5)', // rgba
  'hsl(120, 100%, 50%)',
  'hsla(240,100%,50%,0.3)', // hsl
  'hwb(200 20% 30%)', // hwb
  'lab(50% -20 30)',
  'lch(60% 70 120)', // lab/lch
  'red',
  'blue',
  'rebeccapurple', // names
  'transparent',
  'currentColor', // special names
  'invalidColor',
  '#12',
  'rgb(999,0,0)', // invalid
  ...defaultColors,
];
document.getElementById('batchInput').value = JSON.stringify(predefinedColors, null, 2);

console.log(defaultColors);
const validators = {
  isColor,
  isHex,
  isHexa,
  isRgb,
  isRgba,
  isHsl,
  isHsla,
  isHwb,
  isLab,
  isLch,
  isName,
  isSpecialName,
};

function runSingleTest(color) {
  const results = [];
  const parsed = {};
  for (const [fnName, fn] of Object.entries(validators)) {
    let passed = false;
    try {
      passed = fn(color);
      if (passed) parsed[fnName] = parsers[fnName](color);
    } catch (e) {
      passed = false;
    }
    if (passed) results.push(fnName);
  }

  console.log(parsed);
  return results;
}

// --- Single test handler ---
document.getElementById('singleTestBtn').addEventListener('click', () => {
  const input = document.getElementById('singleInput').value.trim();
  if (!input) return;

  const results = runSingleTest(input);
  const div = document.getElementById('singleResult');
  div.innerHTML = `
        <div>
          <span class="color-sample" style="background:${input}"></span>
          <code>${input}</code>
        </div>
        <div>${
          results.length > 0
            ? `<span class="valid">Valid in: ${results.join(', ')}</span>`
            : `<span class="invalid">No match found</span>`
        }</div>
      `;
});

// --- Batch test handler ---
document.getElementById('batchTestBtn').addEventListener('click', () => {
  const textarea = document.getElementById('batchInput');
  let arr;
  try {
    arr = JSON.parse(textarea.value);
    if (!Array.isArray(arr)) throw new Error();
  } catch {
    alert('Invalid JSON array');
    return;
  }

  let table = `<table>
        <thead>
          <tr>
            <th>Sample</th>
            <th>Color</th>
            ${Object.keys(validators)
              .map((fn) => {
                let panelName = fn.replace('is', '');
                return `<th>${panelName}</th>`;
              })
              .join('')}
          </tr>
        </thead>
        <tbody>
      `;

  const parsed = {};
  for (const color of arr) {
    const rowResults = {};
    const values = Object.entries(validators);
    for (const index in values) {
      const [fnName, fn] = values[index];
      try {
        rowResults[fnName] = fn(color);
      } catch {
        rowResults[fnName] = false;
      }
      if (parsers[fnName] && rowResults[fnName]) {
        const result = parsers[fnName](color);
        if (result) parsed[fnName] = result;
      }
    }

    table += `
          <tr>
            <td><span class="color-sample" style="background:${color}"></span></td>
            <td><code>${color}</code></td>
            ${Object.entries(rowResults)
              .map(
                ([fnName, passed]) => `<td class="${passed ? 'passed' : 'failed'}">${passed}</td>`,
              )
              .join('')}
          </tr>
        `;
  }

  console.table(parsed);
  table += '</tbody></table>';
  document.getElementById('batchResult').innerHTML = table;
});
