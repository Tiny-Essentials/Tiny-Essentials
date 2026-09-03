import * as tinyHtml from '/src/v1/basics/html.mjs';
import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
Object.assign(window, tinyHtml);
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;
TinyHtml.classCanWhitespace = true;

const el = document.getElementById('test-box');
const result = document.getElementById('result');
const $el = $('#test-box');
const tinyEl = new TinyHtml(el);

window.tinyEl = tinyEl;

const controls = {
  width: document.getElementById('set-width'),
  height: document.getElementById('set-height'),
  scrollTop: document.getElementById('scroll-top'),
  scrollLeft: document.getElementById('scroll-left'),
  padding: document.getElementById('set-padding'),
  margin: document.getElementById('set-margin'),
};

const syncInputs = () => {
  controls.width.value = tinyEl.width;
  controls.height.value = tinyEl.height;
  controls.scrollTop.value = tinyEl.scrollTop();
  controls.scrollLeft.value = tinyEl.scrollLeft();
  controls.padding.value = tinyEl.padding().left;
  controls.margin.value = tinyEl.margin().top;
};

const attachInputEvents = () => {
  controls.width.addEventListener('input', () => {
    tinyEl.setWidth(parseInt(controls.width.value));
    update();
  });
  controls.height.addEventListener('input', () => {
    tinyEl.setHeight(parseInt(controls.height.value));
    update();
  });
  controls.scrollTop.addEventListener('input', () => {
    tinyEl.setScrollTop(parseInt(controls.scrollTop.value));
    update();
  });
  controls.scrollLeft.addEventListener('input', () => {
    tinyEl.setScrollLeft(parseInt(controls.scrollLeft.value));
    update();
  });
  controls.padding.addEventListener('input', () => {
    el.style.padding = parseInt(controls.padding.value) + 'px';
    update();
  });
  controls.margin.addEventListener('input', () => {
    el.style.margin = parseInt(controls.margin.value) + 'px';
    update();
  });
};

$el
  .draggable({
    drag: () => update(),
  })
  .resizable({
    handles: 'all',
    stop: () => update(),
    resize: () => update(),
  });

const update = () => {
  syncInputs();
  const tinyValues = {
    'TinyHtml.position': JSON.stringify(tinyEl.position()),
    'TinyHtml.offset': JSON.stringify(tinyEl.offset()),
    'TinyHtml.offsetParent': tinyEl.offsetParent().tagName,
    'TinyHtml.cssFloat(paddingLeft)': tinyEl.cssFloat('paddingLeft') + 'px',
    'TinyHtml.cssFloats([marginTop, marginBottom])': JSON.stringify(
      tinyEl.cssFloats(['marginTop', 'marginBottom']),
    ),
    'TinyHtml.height': tinyEl.height + 'px',
    'TinyHtml.innerHeight': tinyEl.innerHeight() + 'px',
    'TinyHtml.outerHeight': tinyEl.outerHeight() + 'px',
    'TinyHtml.outerHeight (with margin)': tinyEl.outerHeight(true) + 'px',
    'TinyHtml.width': tinyEl.width + 'px',
    'TinyHtml.innerWidth': tinyEl.innerWidth() + 'px',
    'TinyHtml.outerWidth': tinyEl.outerWidth() + 'px',
    'TinyHtml.outerWidth (with margin)': tinyEl.outerWidth(true) + 'px',
    'TinyHtml.scrollTop': tinyEl.scrollTop() + 'px',
    'TinyHtml.scrollLeft': tinyEl.scrollLeft() + 'px',
  };

  const jQueryValues = {
    '$(el).position()': JSON.stringify($el.position()),
    '$(el).offset()': JSON.stringify($el.offset()),
    '$(el).offsetParent()': $el.offsetParent()[0].tagName,
    "$(el).css('padding-left')": $el.css('padding-left'),
    "parseFloat($(el).css('margin-top')) / margin-bottom": JSON.stringify({
      marginTop: parseFloat($el.css('margin-top')),
      marginBottom: parseFloat($el.css('margin-bottom')),
    }),
    '$(el).height()': $el.height() + 'px',
    '$(el).innerHeight()': $el.innerHeight() + 'px',
    '$(el).outerHeight()': $el.outerHeight() + 'px',
    '$(el).outerHeight(true)': $el.outerHeight(true) + 'px',
    '$(el).width()': $el.width() + 'px',
    '$(el).innerWidth()': $el.innerWidth() + 'px',
    '$(el).outerWidth()': $el.outerWidth() + 'px',
    '$(el).outerWidth(true)': $el.outerWidth(true) + 'px',
    '$(el).scrollTop()': $el.scrollTop() + 'px',
    '$(el).scrollLeft()': $el.scrollLeft() + 'px',
  };

  const resultLines = [];
  const jqueryLines = [];
  const comparisonLines = [];

  const keys = Object.keys(tinyValues);
  const jKeys = Object.keys(jQueryValues);

  for (let i = 0; i < keys.length; i++) {
    const tKey = keys[i];
    const jKey = jKeys[i];
    const tVal = tinyValues[tKey];
    const jVal = jQueryValues[jKey];

    const isEqual = tVal === jVal;
    const status = isEqual ? '✅' : '❌';

    resultLines.push(`${tKey}: ${tVal}`);
    jqueryLines.push(`${jKey}: ${jVal}`);
    comparisonLines.push(`${status} ${tKey.replace('TinyHtml.', '')}`);
  }

  result.textContent = resultLines.join('\n');
  document.getElementById('jquery-result').textContent = jqueryLines.join('\n');
  document.getElementById('comparison').textContent =
    'Comparison Check:\n' + comparisonLines.join('\n');
};

document.addEventListener('DOMContentLoaded', () => {
  attachInputEvents();
  update();
});
window.addEventListener('scroll', update);
window.addEventListener('resize', update);
$(window).on('scroll resize', update);

//////////////////////////////////////////////////////////////////

const log = (msg) => {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] ${msg}`);
};

const handlerA = () => log('✅ Handler A triggered');
const handlerB = () => log('✅ Handler B triggered (once)');
const handlerC = () => log('✅ Handler C triggered');

document.getElementById('on-test').addEventListener('click', () => {
  tinyEl.on('click', handlerA);
  log('on(): Added handlerA');
});

document.getElementById('once-test').addEventListener('click', () => {
  tinyEl.once('click', handlerB);
  log('once(): Added handlerB (fires only once)');
});

document.getElementById('off-test').addEventListener('click', () => {
  tinyEl.off('click', handlerA);
  log('off(): Removed handlerA');
});

document.getElementById('off-all-test').addEventListener('click', () => {
  tinyEl.offAll('click');
  log('offAll(): Removed all click handlers');
});

document.getElementById('off-all-types-test').addEventListener('click', () => {
  tinyEl.offAllTypes();
  log('offAllTypes(): Removed all handlers from all events');
});
