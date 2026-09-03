import { TinyHtml } from '/src/v1/libs/html/TinyHtml.mjs';
window.TinyHtml = TinyHtml;
TinyHtml.elemDebug = true;

const out = document.getElementById('output');

const ids = [
  'text-input',
  'search-input',
  'url-input',
  'email-input',
  'tel-input',
  'password-input',
  'number-input',
  'range-input',
  'date-input',
  'time-input',
  'datetime-input',
  'month-input',
  'week-input',
  'color-input',
  'checkbox-input',
  'radio-input',
  'hidden-input',
  'file-input',
  'image-input',
  'button-input',
  'submit-input',
  'reset-input',
  'select-test',
  'select-multiple',
  'textarea-test',
];

const instances = {};
for (const id of ids) {
  instances[id] = TinyHtml.getById(id);
}

window.instances = instances;

window.radioInstances = Array.from(document.querySelectorAll('input[name="radio-group"]')).map(
  (el) => new TinyHtml(el),
);
window.checkboxInstances = Array.from(document.querySelectorAll('input[name="check-group"]')).map(
  (el) => new TinyHtml(el),
);

document.getElementById('read-values').addEventListener('click', () => {
  const results = {};
  for (const [id, inst] of Object.entries(instances)) {
    try {
      const type = inst.attr('type');
      results[id] =
        type === 'number' || type === 'range'
          ? inst.valNb()
          : type === 'date' || type === 'datetime-local'
            ? inst.valDate()
            : inst.val();
      console.log(`${id}:`, results[id]);
    } catch (err) {
      results[id] = `[Error] ${(err && err.message) || err}`;
    }
  }

  const checkGroup = Array.from(document.querySelectorAll('input[name="check-group"]'));
  const radioGroup = Array.from(document.querySelectorAll('input[name="radio-group"]'));

  results['check-group'] = checkGroup
    .filter((i) => new TinyHtml(i).val() === 'on')
    .map((i) => i.value);
  const selectedRadio = radioGroup.find((i) => new TinyHtml(i).val() === 'on');
  results['radio-group'] = selectedRadio ? selectedRadio.value : null;

  out.textContent = 'TinyHtml.val() values:\n' + JSON.stringify(results, null, 2);
});

document.getElementById('write-values').addEventListener('click', () => {
  for (const [id, inst] of Object.entries(instances)) {
    try {
      if (id === 'checkbox-input') {
        inst.setVal(true);
      } else if (id === 'radio-input') {
        inst.setVal(true);
      } else if (id === 'select-test') {
        inst.setVal('c');
      } else if (id === 'select-multiple') {
        inst.setVal(['y', 'z']);
      } else if (id === 'file-input' || id === 'image-input') {
        continue;
      } else {
        inst.setVal('updated-' + id);
      }
    } catch (err) {
      // Ignore errors
    }
  }

  document.querySelectorAll('input[name="check-group"]').forEach((input) => {
    input.checked = ['1', '3'].includes(input.value);
  });
  document.querySelectorAll('input[name="radio-group"]').forEach((input) => {
    input.checked = input.value === 'b';
  });

  out.textContent = 'TinyHtml.setVal() applied.';
});
