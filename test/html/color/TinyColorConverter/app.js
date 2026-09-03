import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
import { TinyColorConverter } from '/src/v1/libs/color/TinyColorConverter.mjs';

window.TinyHtml = TinyHtml;
window.TinyColorConverter = TinyColorConverter;
TinyHtml.elemDebug = true;

const colorPreview = TinyHtml.getById('colorPreview');

const outputOriginal = TinyHtml.getById('outputOriginal');
const outputHex = TinyHtml.getById('outputHex');
const outputInt = TinyHtml.getById('outputInt');

const outputRgbStr = TinyHtml.getById('outputRgbStr');
const outputRgbaStr = TinyHtml.getById('outputRgbaStr');

const outputHslStr = TinyHtml.getById('outputHslStr');
const outputHslaStr = TinyHtml.getById('outputHslaStr');

const outputRgba = TinyHtml.getById('outputRgba');
const outputHsla = TinyHtml.getById('outputHsla');

const outputHexToInt = TinyHtml.getById('outputHexToInt');
const outputHexToRgb = TinyHtml.getById('outputHexToRgb');
const outputIntToHex = TinyHtml.getById('outputIntToHex');

const outputHslStringToRgbaArray = TinyHtml.getById('outputHslStringToRgbaArray');
const outputHslToRgba = TinyHtml.getById('outputHslToRgba');
const outputHslToRgb = TinyHtml.getById('outputHslToRgb');

const outputHslToInt = TinyHtml.getById('outputHslToInt');
const outputHslToHex = TinyHtml.getById('outputHslToHex');

const outputRgbaToHsl = TinyHtml.getById('outputRgbaToHsl');
const outputRgbaToHsla = TinyHtml.getById('outputRgbaToHsla');

const outputIntToHsl = TinyHtml.getById('outputIntToHsl');
const outputIntToHsla = TinyHtml.getById('outputIntToHsla');

const outputHexToHsl = TinyHtml.getById('outputHexToHsl');
const outputHexToHsla = TinyHtml.getById('outputHexToHsla');

const values = [
  outputHex,
  outputInt,
  ////////////////////
  outputRgbStr,
  outputRgbaStr,
  ////////////////////
  outputHslStr,
  outputHslaStr,
  ////////////////////
  outputHexToInt,
  outputIntToHex,
  ////////////////////
  outputHslToInt,
  outputHslToHex,
];

for (const item of values) {
  item.addClass('tiny-click').on('click', () => {
    const isInt = item.hasAttr('is-int');
    const isHsl = item.hasAttr('is-hsl');
    const parsed = !isInt ? item.text() : parseInt(item.text());
    console.log(parsed, isHsl, isInt);
    const conv = new TinyColorConverter(parsed, isHsl);
    showResults(conv);
  });
}

function showResults(conv) {
  colorPreview.setStyle('background', conv.toRgbaString());

  outputOriginal.setText(JSON.stringify(conv.getOriginal()));
  outputHex.setText(conv.toHex());

  outputInt.setText(conv.toInt().toString());

  outputRgbStr.setText(conv.toRgbString());
  outputRgbaStr.setText(conv.toRgbaString());

  outputHslStr.setText(conv.toHslString());
  outputHslaStr.setText(conv.toHslaString());

  outputRgba.setText(JSON.stringify(conv.toRgbaArray()));
  outputHsla.setText(JSON.stringify(conv.toHslaArray()));

  outputHexToInt.setText(TinyColorConverter.hexToInt(conv.toHex()).toString());
  outputHexToRgb.setText(JSON.stringify(TinyColorConverter.hexToRgb(conv.toHex())));
  outputIntToHex.setText(TinyColorConverter.intToHex(conv.toInt()));

  outputHslStringToRgbaArray.setText(
    JSON.stringify(TinyColorConverter.hslStringToRgbaArray(conv.toHslaString())),
  );
  outputHslToRgba.setText(JSON.stringify(TinyColorConverter.hslToRgba(...conv.toHslaArray())));
  outputHslToRgb.setText(JSON.stringify(TinyColorConverter.hslToRgb(...conv.toHslaArray())));

  outputHslToInt.setText(TinyColorConverter.hslToInt(...conv.toHslaArray()).toString());
  outputHslToHex.setText(TinyColorConverter.hslToHex(...conv.toHslaArray()));

  outputRgbaToHsl.setText(JSON.stringify(TinyColorConverter.rgbaToHsl(...conv.toRgbaArray())));
  outputRgbaToHsla.setText(JSON.stringify(TinyColorConverter.rgbaToHsla(...conv.toRgbaArray())));

  outputIntToHsl.setText(JSON.stringify(TinyColorConverter.intToHsl(conv.toInt())));
  outputIntToHsla.setText(JSON.stringify(TinyColorConverter.intToHsla(conv.toInt())));

  outputHexToHsl.setText(JSON.stringify(TinyColorConverter.hexToHsl(conv.toHex())));
  outputHexToHsla.setText(JSON.stringify(TinyColorConverter.hexToHsla(conv.toHex())));
}

window.handleConvert = () => {
  const input = document.getElementById('colorInput').value;
  const isHsl = document.getElementById('checkHSL').checked;
  const method = document.getElementById('methodSelect').value;

  let parsed;
  try {
    parsed = JSON.parse(input);
  } catch {
    parsed = input;
  }

  try {
    if (method === 'static') {
    } else {
      const conv = new TinyColorConverter(parsed, isHsl);
      showResults(conv);
    }
  } catch (e) {
    alert('Error converting color: ' + e.message);
    console.error(e);
  }
};

window.generateRandom = () => {
  const color = TinyColorConverter.randomColor();
  const conv = new TinyColorConverter(color);
  showResults(conv);
};

window.generateGradient = () => {
  const len = parseInt(document.getElementById('gradientLen').value);
  const type = document.getElementById('gradientType').value;
  const pastel = document.getElementById('pastelMode').checked;
  const out = TinyColorConverter._rca(len, type, pastel);

  const container = document.getElementById('gradientOutput');
  container.innerHTML = '';
  out.forEach((c) => {
    const div = document.createElement('div');
    div.className = 'color-box';
    let bg = '#000';
    if (type === 'hex') {
      bg = c.hex;
      div.title = c.hex;
      div.onclick = () => {
        document.getElementById('colorInput').value = c.hex;
        handleConvert();
      };
    } else if (type === 'rgb') {
      bg = `rgb(${c.r}, ${c.g}, ${c.b})`;
      div.title = bg;
      div.onclick = () => {
        document.getElementById('colorInput').value =
          `rgb(${Math.trunc(c.r)}, ${Math.trunc(c.g)}, ${Math.trunc(c.b)})`;
        handleConvert();
      };
    } else {
      bg = `hsl(${c.h}, ${c.s}%, ${c.l}%)`;
      div.title = bg;
      div.onclick = () => {
        document.getElementById('colorInput').value =
          `hsl(${Math.trunc(c.h)}, ${Math.trunc(c.s)}, ${Math.trunc(c.l)})`;
        handleConvert();
      };
    }
    div.style.background = bg;
    container.appendChild(div);
  });
};

generateRandom();
