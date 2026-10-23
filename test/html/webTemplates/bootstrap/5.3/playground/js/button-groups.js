/**
 * @file Button group matrix for the Bootstrap 5.3 playground.
 *
 * Renders every button family (normal, ghost, subtle, outline) against every
 * tone, state, size and structure. Three controls limit the output: a select
 * picks the family, a switch toggles the opt-in `hover-border` modifier and a
 * second switch swaps every `<button>` for an `<a role="button">`.
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
 * @typedef {'group' | 'vertical'} GroupLayout
 */

/**
 * @typedef {'button' | 'anchor'} ButtonTag
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
 * @typedef {Object} ButtonConfig
 * @property {ButtonTag} tag Element used to render the button.
 * @property {string} toneClass Class applied to the button.
 * @property {string} label Visible label.
 * @property {ButtonState} state State applied to the button.
 * @property {string} size Optional Bootstrap size class.
 * @property {boolean} hoverBorder Whether the `hover-border` modifier is on.
 */

/**
 * @typedef {Object} AppState
 * @property {string} family Currently selected family id, or `all`.
 * @property {boolean} hoverBorder Whether the `hover-border` modifier is on.
 * @property {ButtonTag} tag Element used to render every button.
 */

/**
 * @typedef {Object} PickerCallbacks
 * @property {(familyId: string) => void} onFamilyChange
 * @property {(enabled: boolean) => void} onHoverBorderChange
 * @property {(tag: ButtonTag) => void} onTagChange
 */

/**
 * @typedef {Object} SwitchConfig
 * @property {string} id Input id, also used by the label.
 * @property {string} label Inner HTML of the label.
 * @property {boolean} checked Initial state.
 * @property {(checked: boolean) => void} onChange Change handler.
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
const LAYOUTS = Object.freeze(['group', 'vertical']);

/** @type {Readonly<Record<GroupLayout, string>>} */
const LAYOUT_CLASS = Object.freeze({
  group: 'btn-group',
  vertical: 'btn-group-vertical',
});

/** @type {readonly string[]} */
const DEFAULT_LABELS = Object.freeze(['Left', 'Middle', 'Right']);

/** @type {string} */
const FAMILY_STORAGE_KEY = 'pg-btn-family';

/** @type {string} */
const HOVER_STORAGE_KEY = 'pg-btn-hover-border';

/** @type {string} */
const TAG_STORAGE_KEY = 'pg-btn-tag';

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
 *
 * `<a>` elements have no `disabled` attribute, so `disabled-attribute` degrades
 * to the `.disabled` class plus `aria-disabled` and `tabindex="-1"`.
 *
 * @param {HTMLButtonElement | HTMLAnchorElement} element
 * @param {ButtonState} state
 * @returns {void}
 * @throws {RangeError} When `state` is not a known button state.
 */
const applyState = (element, state) => {
  if (!STATES.includes(state)) {
    throw new RangeError(`Unknown button state: ${state}`);
  }

  if (state === 'default') {
    return;
  }

  if (state === 'active') {
    element.classList.add('active');
    element.setAttribute('aria-pressed', 'true');
    return;
  }

  const isAnchor = element instanceof HTMLAnchorElement;

  if (state === 'disabled-attribute' && !isAnchor) {
    /** @type {HTMLButtonElement} */ (element).disabled = true;
    return;
  }

  element.classList.add('disabled');
  element.setAttribute('aria-disabled', 'true');

  if (isAnchor) {
    element.setAttribute('tabindex', '-1');

    if (state === 'disabled-attribute') {
      element.title = 'disabled is not valid on <a>; fell back to .disabled';
    }
  }
};

/**
 * Creates a single button, either a `<button>` or an `<a role="button">`.
 * @param {ButtonConfig} config
 * @returns {HTMLButtonElement | HTMLAnchorElement}
 * @throws {TypeError} When `toneClass` is not a non-empty string.
 * @throws {RangeError} When `state` is not a known button state.
 */
const createButton = ({ tag, toneClass, label, state, size, hoverBorder }) => {
  if (typeof toneClass !== 'string' || toneClass.trim() === '') {
    throw new TypeError('toneClass must be a non-empty string');
  }

  if (!STATES.includes(state)) {
    throw new RangeError(`Unknown button state: ${state}`);
  }

  const className = ['btn', toneClass, size, hoverBorder ? 'hover-border' : '']
    .filter(Boolean)
    .join(' ');

  let element;

  if (tag === 'anchor') {
    const anchor = document.createElement('a');
    anchor.href = '#';
    anchor.setAttribute('role', 'button');
    element = anchor;
  } else {
    const button = document.createElement('button');
    button.type = 'button';
    element = button;
  }

  element.className = className;
  element.textContent = label;
  applyState(element, state);

  return element;
};

/**
 * Creates a single button group.
 * @param {GroupConfig} config
 * @returns {HTMLDivElement}
 * @throws {RangeError} When `layout` is not a known layout.
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
  tag = 'button',
}) => {
  if (!LAYOUTS.includes(layout)) {
    throw new RangeError(`Unknown layout: ${layout}`);
  }

  const group = document.createElement('div');
  group.className = LAYOUT_CLASS[layout];
  group.setAttribute('role', 'group');
  group.setAttribute('aria-label', ariaLabel);

  labels.forEach((label, index) => {
    group.appendChild(
      createButton({
        tag,
        toneClass,
        label,
        state: buttonStates?.[index] ?? state,
        size,
        hoverBorder,
      }),
    );
  });

  return group;
};

/**
 * Builds a `btn-toolbar` that mixes two groups of the same family.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createToolbar = (family, state) => {
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
        hoverBorder: state.hoverBorder,
        tag: state.tag,
        ariaLabel: `${family.title} ${tone} toolbar group`,
      }),
    );
  });

  return toolbar;
};

/**
 * Builds a radio group that uses the `btn-check` pattern.
 *
 * The `btn-check` pattern requires a `<label>`, so this block ignores
 * `state.tag` on purpose.
 *
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createRadioGroup = (family, state) => {
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
    labelElement.className = ['btn', toneClass, state.hoverBorder ? 'hover-border' : '']
      .filter(Boolean)
      .join(' ');
    labelElement.htmlFor = id;
    labelElement.textContent = label;

    wrapper.append(input, labelElement);
  });

  return wrapper;
};

/**
 * Builds the `data-bs-toggle="button"` toggle for a family.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLButtonElement | HTMLAnchorElement}
 */
const createToggle = (family, state) => {
  const element = createButton({
    tag: state.tag,
    toneClass: family.toneClass('primary'),
    label: 'Toggle me',
    state: 'default',
    size: '',
    hoverBorder: state.hoverBorder,
  });

  element.dataset.bsToggle = 'button';
  element.setAttribute('aria-pressed', 'false');

  return element;
};

/**
 * Renders every group variation of a single button family.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
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
        hoverBorder: state.hoverBorder,
        tag: state.tag,
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
        createGroup({
          toneClass: extra.className,
          hoverBorder: state.hoverBorder,
          tag: state.tag,
          ariaLabel: `${extra.label} group`,
        }),
      );
    });
    section.appendChild(extras);
  }

  section.appendChild(createHeading('States'));
  const states = document.createElement('div');
  states.className = 'd-flex flex-wrap gap-2';
  STATES.forEach((item) => {
    states.appendChild(
      createGroup({
        toneClass: family.toneClass('primary'),
        state: item,
        hoverBorder: state.hoverBorder,
        tag: state.tag,
        ariaLabel: `${family.title} ${item} group`,
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
          hoverBorder: state.hoverBorder,
          tag: state.tag,
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
        hoverBorder: state.hoverBorder,
        tag: state.tag,
        ariaLabel: `${family.title} ${size || 'default'} group`,
      }),
    );
  });
  section.appendChild(sizes);

  section.appendChild(createHeading('Toggle'));
  const toggles = document.createElement('div');
  toggles.className = 'd-flex flex-wrap gap-2';
  toggles.appendChild(createToggle(family, state));
  section.appendChild(toggles);

  section.appendChild(createHeading('Vertical'));
  const vertical = document.createElement('div');
  vertical.className = 'd-flex flex-wrap gap-3';
  vertical.appendChild(
    createGroup({
      toneClass: family.toneClass('primary'),
      layout: 'vertical',
      hoverBorder: state.hoverBorder,
      tag: state.tag,
      ariaLabel: `${family.title} vertical group`,
    }),
  );
  section.appendChild(vertical);

  section.appendChild(createHeading('Toolbar'));
  section.appendChild(createToolbar(family, state));

  section.appendChild(createHeading('Radio (btn-check — always <label>)'));
  section.appendChild(createRadioGroup(family, state));

  return section;
};

/**
 * Builds a single switch.
 * @param {SwitchConfig} config
 * @returns {HTMLDivElement}
 */
const createSwitch = ({ id, label, checked, onChange }) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-check form-switch mb-0';

  const input = document.createElement('input');
  input.className = 'form-check-input';
  input.type = 'checkbox';
  input.role = 'switch';
  input.id = id;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  const labelElement = document.createElement('label');
  labelElement.className = 'form-check-label small';
  labelElement.htmlFor = id;
  labelElement.innerHTML = label;

  wrapper.append(input, labelElement);

  return wrapper;
};

/**
 * Builds the family picker and the global switches.
 * @param {AppState} state
 * @param {PickerCallbacks} callbacks
 * @returns {HTMLDivElement}
 */
const createPicker = (state, callbacks) => {
  const wrapper = document.createElement('div');
  wrapper.className = 'd-flex flex-wrap align-items-center gap-3';

  const familyWrapper = document.createElement('div');
  familyWrapper.className = 'd-flex align-items-center gap-2';

  const familyLabel = document.createElement('label');
  familyLabel.className = 'form-label mb-0 small text-uppercase fw-bold text-body-secondary';
  familyLabel.htmlFor = 'pg-btn-family';
  familyLabel.textContent = 'Button family';

  const select = document.createElement('select');
  select.className = 'form-select form-select-sm w-auto';
  select.id = 'pg-btn-family';
  select.appendChild(new Option('All families', ALL_FAMILIES));
  FAMILIES.forEach((family) => select.appendChild(new Option(family.title, family.id)));
  select.value = state.family;
  select.addEventListener('change', () => callbacks.onFamilyChange(select.value));

  familyWrapper.append(familyLabel, select);

  wrapper.append(
    familyWrapper,
    createSwitch({
      id: 'pg-btn-hover-border',
      label: '<code>hover-border</code>',
      checked: state.hoverBorder,
      onChange: callbacks.onHoverBorderChange,
    }),
    createSwitch({
      id: 'pg-btn-tag',
      label: 'Render as <code>&lt;a&gt;</code>',
      checked: state.tag === 'anchor',
      onChange: (checked) => callbacks.onTagChange(checked ? 'anchor' : 'button'),
    }),
  );

  return wrapper;
};

/**
 * Renders the requested families into the container.
 * @param {HTMLElement} container
 * @param {AppState} state
 * @returns {void}
 */
const render = (container, state) => {
  const families =
    state.family === ALL_FAMILIES
      ? FAMILIES
      : FAMILIES.filter((family) => family.id === state.family);

  const fragment = document.createDocumentFragment();
  families.forEach((family) => fragment.appendChild(renderFamily(family, state)));
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
  const storedFamily = localStorage.getItem(FAMILY_STORAGE_KEY);
  const storedTag = localStorage.getItem(TAG_STORAGE_KEY);

  /** @type {AppState} */
  const state = {
    family: known.includes(storedFamily) ? storedFamily : ALL_FAMILIES,
    hoverBorder: localStorage.getItem(HOVER_STORAGE_KEY) === 'true',
    tag: storedTag === 'anchor' ? 'anchor' : 'button',
  };

  const results = document.createElement('div');
  results.className = 'd-flex flex-column gap-5';

  const picker = createPicker(state, {
    onFamilyChange: (familyId) => {
      state.family = familyId;
      localStorage.setItem(FAMILY_STORAGE_KEY, familyId);
      render(results, state);
    },
    onHoverBorderChange: (enabled) => {
      state.hoverBorder = enabled;
      localStorage.setItem(HOVER_STORAGE_KEY, String(enabled));
      render(results, state);
    },
    onTagChange: (tag) => {
      state.tag = tag;
      localStorage.setItem(TAG_STORAGE_KEY, tag);
      render(results, state);
    },
  });

  render(results, state);
  mount.replaceChildren(picker, results);
};

mountButtonGroups();
