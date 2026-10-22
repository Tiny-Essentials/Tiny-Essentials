/**
 * @file Button group matrix for the Bootstrap 5.3 playground.
 *
 * Renders every button family (normal, ghost, subtle, outline) against every
 * tone, state, size and structure. A select limits the output to a single
 * family so a specific variant can be inspected in isolation.
 */

/**
 * @typedef {Object} ButtonExtra
 * @property {string} label Visible label of the variant.
 * @property {string} className Class applied to every button of the group.
 */

/**
 * @typedef {Object} ButtonFamily
 * @property {string} id Unique identifier, also used as a DOM id suffix.
 * @property {string} title Heading text.
 * @property {string} description Short explanation rendered under the heading.
 * @property {(tone: string) => string} toneClass Resolves the tone class of the family.
 * @property {readonly ButtonExtra[]} [extras] Tone-less variants that only exist in this family.
 */

/**
 * @typedef {'default' | 'active' | 'disabled-attribute' | 'disabled-class'} ButtonState
 */

/**
 * @typedef {'group' | 'vertical' | 'plain'} GroupLayout
 */

/**
 * @typedef {Object} GroupConfig
 * @property {string} toneClass Class applied to every button of the group.
 * @property {ButtonState} [state] State applied to every button of the group.
 * @property {readonly ButtonState[]} [buttonStates] Per-button state override, by index.
 * @property {boolean} [hoverBorder] Appends the opt-in `hover-border` modifier.
 * @property {GroupLayout} [layout] Wrapper used by the group.
 * @property {'' | 'btn-sm' | 'btn-lg'} [size] Optional Bootstrap size class.
 * @property {readonly string[]} [labels] Visible labels, one per button.
 * @property {string} [ariaLabel] Accessible name of the group.
 */

/**
 * Tones rendered for every family. `contrast` and `contrast-inverse` are tones,
 * not families: they follow the exact same `btn-{family}-{tone}` contract.
 *
 * @type {readonly string[]}
 */
const TONES = Object.freeze([
  'primary',
  'secondary',
  'success',
  'danger',
  'warning',
  'info',
  'light',
  'dark',
  'contrast',
  'contrast-inverse',
]);

/** @type {readonly ButtonState[]} */
const STATES = Object.freeze(['default', 'active', 'disabled-attribute', 'disabled-class']);

/** @type {readonly GroupLayout[]} */
const LAYOUTS = Object.freeze(['group', 'vertical', 'plain']);

/** @type {Readonly<Record<GroupLayout, string>>} */
const LAYOUT_CLASS = Object.freeze({
  group: 'btn-group',
  vertical: 'btn-group-vertical',
  plain: 'd-inline-flex flex-wrap gap-2',
});

/** @type {readonly string[]} */
const DEFAULT_LABELS = Object.freeze(['Left', 'Middle', 'Right']);

/** @type {string} */
const STORAGE_KEY = 'pg-btn-family';

/** @type {string} */
const ALL_FAMILIES = 'all';

/** @type {readonly ButtonFamily[]} */
const FAMILIES = Object.freeze([
  {
    id: 'normal',
    title: 'Normal',
    description: 'Filled buttons created with btn-{tone}.',
    toneClass: (tone) => `btn-${tone}`,
    extras: Object.freeze([{ label: 'Ghost (toneless)', className: 'btn-ghost' }]),
  },
  {
    id: 'ghost',
    title: 'Ghost',
    description: 'Transparent background with a colored label.',
    toneClass: (tone) => `btn-ghost-${tone}`,
  },
  {
    id: 'subtle',
    title: 'Subtle',
    description: 'Tonal background driven by --btn-tone.',
    toneClass: (tone) => `btn-subtle-${tone}`,
  },
  {
    id: 'outline',
    title: 'Outline',
    description: 'Border only, filled on hover.',
    toneClass: (tone) => `btn-outline-${tone}`,
  },
]);

/**
 * Creates a small uppercase heading used to separate the demo blocks.
 * @param {string} text
 * @returns {HTMLHeadingElement}
 */
const createHeading = (text) => {
  const heading = document.createElement('h5');
  heading.className = 'h6 text-uppercase text-body-secondary mt-3 mb-2';
  heading.textContent = text;

  return heading;
};

/**
 * Applies a visual state to a single button.
 * @param {HTMLButtonElement} button
 * @param {ButtonState} state
 * @returns {void}
 * @throws {RangeError} When `state` is not a known button state.
 */
const applyState = (button, state) => {
  if (!STATES.includes(state)) {
    throw new RangeError(`Unknown button state: ${state}`);
  }

  if (state === 'active') {
    button.classList.add('active');
    button.setAttribute('aria-pressed', 'true');
  }

  if (state === 'disabled-attribute') {
    button.disabled = true;
  }

  if (state === 'disabled-class') {
    button.classList.add('disabled');
    button.setAttribute('aria-disabled', 'true');
  }
};

/**
 * Creates a single button group.
 * @param {GroupConfig} config
 * @returns {HTMLDivElement}
 * @throws {TypeError} When `toneClass` is not a non-empty string.
 * @throws {RangeError} When `layout` or `state` is not a known value.
 */
const createGroup = ({
  toneClass,
  state = 'default',
  buttonStates,
  hoverBorder = false,
  layout = 'group',
  size = '',
  labels = DEFAULT_LABELS,
  ariaLabel = 'Button group',
}) => {
  if (typeof toneClass !== 'string' || toneClass.trim() === '') {
    throw new TypeError('toneClass must be a non-empty string');
  }

  if (!LAYOUTS.includes(layout)) {
    throw new RangeError(`Unknown layout: ${layout}`);
  }

  if (!STATES.includes(state)) {
    throw new RangeError(`Unknown button state: ${state}`);
  }

  const group = document.createElement('div');
  group.className = LAYOUT_CLASS[layout];
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', ariaLabel);

  labels.forEach((label, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = ['btn', toneClass, size, hoverBorder ? 'hover-border' : '']
      .filter(Boolean)
      .join(' ');
    button.textContent = label;

    applyState(button, buttonStates?.[index] ?? state);

    group.appendChild(button);
  });

  return group;
};

/**
 * Builds a `btn-toolbar` that mixes two groups of the same family.
 * @param {ButtonFamily} family
 * @returns {HTMLDivElement}
 */
const createToolbar = (family) => {
  const toolbar = document.createElement('div');
  toolbar.className = 'btn-toolbar gap-2';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', `${family.title} toolbar`);

  [
    { tone: 'primary', labels: ['1', '2', '3'] },
    { tone: 'secondary', labels: ['4', '5'] },
  ].forEach(({ tone, labels }) => {
    toolbar.appendChild(
      createGroup({
        toneClass: family.toneClass(tone),
        labels,
        ariaLabel: `${family.title} ${tone} toolbar group`,
      }),
    );
  });

  return toolbar;
};

/**
 * Builds a radio group that uses the `btn-check` pattern.
 * @param {ButtonFamily} family
 * @returns {HTMLDivElement}
 */
const createRadioGroup = (family) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'btn-group';
  wrapper.setAttribute('role', 'group');
  wrapper.setAttribute('aria-label', `${family.title} radio group`);

  const name = `pg-btn-group-${family.id}-radio`;
  const toneClass = family.toneClass('primary');

  ['Left', 'Left 2', 'Center', 'Right 2', 'Right'].forEach((label, index) => {
    const id = `${name}-${index}`;

    const input = document.createElement('input');
    input.type = 'radio';
    input.className = 'btn-check';
    input.name = name;
    input.id = id;
    input.autocomplete = 'off';
    input.checked = index === 0;

    const labelElement = document.createElement('label');
    labelElement.className = `btn ${toneClass}`;
    labelElement.htmlFor = id;
    labelElement.textContent = label;

    wrapper.append(input, labelElement);
  });

  return wrapper;
};

/**
 * Builds the `data-bs-toggle="button"` toggle for a family.
 * @param {ButtonFamily} family
 * @returns {HTMLButtonElement}
 */
const createToggle = (family) => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `btn ${family.toneClass('primary')}`;
  button.dataset.bsToggle = 'button';
  button.setAttribute('aria-pressed', 'false');
  button.textContent = 'Toggle me';

  return button;
};

/**
 * Renders every group variation of a single button family.
 * @param {ButtonFamily} family
 * @returns {HTMLElement}
 */
const renderFamily = (family) => {
  const section = document.createElement('section');
  section.className = 'd-flex flex-column gap-2';
  section.id = `pg-btn-group-${family.id}`;

  const title = document.createElement('h4');
  title.className = 'fw-bold mb-0';
  title.textContent = family.title;

  const description = document.createElement('p');
  description.className = 'small text-body-secondary mb-0';
  description.textContent = family.description;

  section.append(title, description);

  section.appendChild(createHeading('Tones'));
  const tones = document.createElement('div');
  tones.className = 'd-flex flex-wrap gap-2';
  TONES.forEach((tone) => {
    tones.appendChild(
      createGroup({
        toneClass: family.toneClass(tone),
        ariaLabel: `${family.title} ${tone} group`,
      }),
    );
  });
  section.appendChild(tones);

  if (family.extras?.length) {
    section.appendChild(createHeading('Tone-less'));
    const extras = document.createElement('div');
    extras.className = 'd-flex flex-wrap gap-2';
    family.extras.forEach((extra) => {
      extras.appendChild(
        createGroup({ toneClass: extra.className, ariaLabel: `${extra.label} group` }),
      );
    });
    section.appendChild(extras);
  }

  section.appendChild(createHeading('States'));
  const states = document.createElement('div');
  states.className = 'd-flex flex-wrap gap-2';
  STATES.forEach((state) => {
    states.appendChild(
      createGroup({
        toneClass: family.toneClass('primary'),
        state,
        ariaLabel: `${family.title} ${state} group`,
      }),
    );
  });
  section.appendChild(states);

  /**
   * Renders one row where only the middle button carries the disabled state.
   * @param {string} heading
   * @param {ButtonState} disabledState
   * @returns {void}
   */
  const appendIndividualDisabled = (heading, disabledState) => {
    section.appendChild(createHeading(heading));

    const row = document.createElement('div');
    row.className = 'd-flex flex-wrap gap-2';

    TONES.forEach((tone) => {
      row.appendChild(
        createGroup({
          toneClass: family.toneClass(tone),
          labels: ['Enabled', 'Disabled', 'Enabled'],
          buttonStates: ['default', disabledState, 'default'],
          ariaLabel: `${family.title} ${tone} individual disabled group`,
        }),
      );
    });

    section.appendChild(row);
  };

  appendIndividualDisabled('Individual disabled (attribute)', 'disabled-attribute');
  appendIndividualDisabled('Individual disabled (class)', 'disabled-class');

  section.appendChild(createHeading('Sizes'));
  const sizes = document.createElement('div');
  sizes.className = 'd-flex flex-wrap align-items-center gap-2';
  ['btn-sm', '', 'btn-lg'].forEach((size) => {
    sizes.appendChild(
      createGroup({
        toneClass: family.toneClass('primary'),
        size,
        ariaLabel: `${family.title} ${size || 'default'} group`,
      }),
    );
  });
  section.appendChild(sizes);

  section.appendChild(createHeading('Toggle'));
  const toggles = document.createElement('div');
  toggles.className = 'd-flex flex-wrap gap-2';
  toggles.appendChild(createToggle(family));
  section.appendChild(toggles);

  section.appendChild(createHeading('Hover border'));
  const hoverBorders = document.createElement('div');
  hoverBorders.className = 'd-flex flex-wrap gap-2';
  TONES.forEach((tone) => {
    hoverBorders.appendChild(
      createGroup({
        toneClass: family.toneClass(tone),
        labels: [tone],
        hoverBorder: true,
        layout: 'plain',
        ariaLabel: `${family.title} ${tone} hover border`,
      }),
    );
  });
  section.appendChild(hoverBorders);

  section.appendChild(createHeading('Hover border + state'));
  const hoverBorderStates = document.createElement('div');
  hoverBorderStates.className = 'd-flex flex-wrap gap-2';
  STATES.forEach((state) => {
    hoverBorderStates.appendChild(
      createGroup({
        toneClass: family.toneClass('primary'),
        hoverBorder: true,
        state,
        ariaLabel: `${family.title} hover border ${state}`,
      }),
    );
  });
  section.appendChild(hoverBorderStates);

  section.appendChild(createHeading('Vertical'));
  const vertical = document.createElement('div');
  vertical.className = 'd-flex flex-wrap gap-3';
  vertical.appendChild(
    createGroup({
      toneClass: family.toneClass('primary'),
      layout: 'vertical',
      ariaLabel: `${family.title} vertical group`,
    }),
  );
  section.appendChild(vertical);

  section.appendChild(createHeading('Toolbar'));
  section.appendChild(createToolbar(family));

  section.appendChild(createHeading('Radio (btn-check)'));
  section.appendChild(createRadioGroup(family));

  return section;
};

/**
 * Builds the family picker.
 * @param {string} selectedId Currently selected family id, or `all`.
 * @param {(familyId: string) => void} onChange Called with the new family id.
 * @returns {HTMLDivElement}
 */
const createFamilyPicker = (selectedId, onChange) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex flex-wrap align-items-center gap-2';

  const label = document.createElement('label');
  label.className = 'form-label mb-0 small text-uppercase fw-bold text-body-secondary';
  label.htmlFor = 'pg-btn-family';
  label.textContent = 'Button family';

  const select = document.createElement('select');
  select.className = 'form-select form-select-sm w-auto';
  select.id = 'pg-btn-family';

  select.appendChild(new Option('All families', ALL_FAMILIES));
  FAMILIES.forEach((family) => select.appendChild(new Option(family.title, family.id)));
  select.value = selectedId;

  select.addEventListener('change', () => onChange(select.value));

  wrapper.append(label, select);

  return wrapper;
};

/**
 * Renders the requested families into the container.
 * @param {HTMLElement} container
 * @param {string} familyId Family id, or `all`.
 * @returns {void}
 */
const render = (container, familyId) => {
  const families =
    familyId === ALL_FAMILIES ? FAMILIES : FAMILIES.filter((family) => family.id === familyId);

  const fragment = document.createDocumentFragment();
  families.forEach((family) => fragment.appendChild(renderFamily(family)));
  container.replaceChildren(fragment);
};

/**
 * Renders the full button group matrix.
 * @param {string} [mountId] Id of the element that receives the matrix.
 * @returns {void}
 * @throws {Error} When the mount point is missing from the document.
 */
export const mountButtonGroups = (mountId = 'pg-button-groups') => {
  const mount = document.getElementById(mountId);

  if (!(mount instanceof HTMLElement)) {
    throw new Error(`Mount point #${mountId} was not found`);
  }

  const known = [ALL_FAMILIES, ...FAMILIES.map((family) => family.id)];
  const stored = localStorage.getItem(STORAGE_KEY);
  const initial = known.includes(stored) ? stored : ALL_FAMILIES;

  const results = document.createElement('div');
  results.className = 'd-flex flex-column gap-5';

  const picker = createFamilyPicker(initial, (familyId) => {
    localStorage.setItem(STORAGE_KEY, familyId);
    render(results, familyId);
  });

  render(results, initial);
  mount.replaceChildren(picker, results);
};

mountButtonGroups();
