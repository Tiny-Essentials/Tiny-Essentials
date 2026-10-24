/**
 * @file Button group matrix for the Bootstrap 5.3 playground.
 *
 * Renders every button family (normal, ghost, subtle, outline) against every
 * tone, state, size and structure. Four controls limit the output: a family
 * select, a tone multi-select (all tones on by default) and two switches that
 * toggle the `hover-border` modifier and swap every `<button>` for an
 * `<a role="button">`.
 */

/* -------------------------------------------------------------------- types */

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

/** @typedef {'default' | 'active' | 'disabled-attribute' | 'disabled-class'} ButtonState */
/** @typedef {'group' | 'vertical'} GroupLayout */
/** @typedef {'button' | 'anchor'} ButtonTag */

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
 * @property {ButtonTag} [tag] Element used to render every button.
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
 * @property {readonly string[]} tones Tones rendered by every environment.
 * @property {boolean} hoverBorder Whether the `hover-border` modifier is on.
 * @property {ButtonTag} tag Element used to render every button.
 */

/**
 * @typedef {Object} ToneRowOptions
 * @property {ButtonState} [groupState] State applied to every button of every group.
 * @property {readonly ButtonState[]} [buttonStates] Per-button state override, by index.
 * @property {readonly string[]} [labels] Visible labels, one per button.
 * @property {'' | 'btn-sm' | 'btn-lg'} [size] Optional Bootstrap size class.
 * @property {string} [ariaLabel] Prefix of the accessible name of each group.
 * @property {GroupLayout} [layout] Wrapper used by every group.
 */

/**
 * @typedef {Object} PickerCallbacks
 * @property {(familyId: string) => void} onFamilyChange
 * @property {(tones: readonly string[]) => void} onTonesChange
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
 * @typedef {Object} IconBadgeItem
 * @property {string} tone Tone used by the button and by the badge.
 * @property {string} label Visible label of the button.
 * @property {string} icon Bootstrap Icons class, without the `bi` prefix.
 * @property {string} [badge] Badge text. When set, the icon is not rendered.
 */

/* ---------------------------------------------------------------- constants */

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
  'pink',
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

/** @type {readonly { size: '' | 'btn-sm' | 'btn-lg', label: string }[]} */
const SIZES = Object.freeze([
  { size: 'btn-sm', label: 'Small' },
  { size: '', label: 'Default' },
  { size: 'btn-lg', label: 'Large' },
]);

/** @type {readonly string[]} */
const DEFAULT_LABELS = Object.freeze(['Left', 'Left 2', 'Middle', 'Right 2', 'Right']);

/** @type {readonly string[]} */
const ICON_POOL = Object.freeze([
  'bi-download',
  'bi-check-lg',
  'bi-trash',
  'bi-flower2',
  'bi-inbox',
]);

/** @type {string} */
const ALL_FAMILIES = 'all';

/** @type {Readonly<Record<string, string>>} */
const STORAGE = Object.freeze({
  family: 'pg-btn-family',
  tones: 'pg-btn-tones',
  hoverBorder: 'pg-btn-hover-border',
  tag: 'pg-btn-tag',
});

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

/* ------------------------------------------------------------------ helpers */

/**
 * Creates an element, applies a class list and appends the children.
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tag Tag name.
 * @param {string} [className] Class list. Omitted when empty.
 * @param {...(Node | string)} children Child nodes or text.
 * @returns {HTMLElementTagNameMap[T]}
 */
const el = (tag, className = '', ...children) => {
  const node = document.createElement(tag);

  if (className) {
    node.className = className;
  }

  node.append(...children);

  return node;
};

/**
 * Creates a `<button type="button">`.
 * @param {string} text Visible label.
 * @param {string} className Class list.
 * @returns {HTMLButtonElement}
 */
const button = (text, className) => {
  const node = el('button', className, text);
  node.type = 'button';

  return node;
};

/**
 * Creates a small uppercase heading used to separate the demo blocks.
 * @param {string} text
 * @returns {HTMLHeadingElement}
 */
const createHeading = (text) => el('h5', 'h6 text-body-secondary mt-3 mb-2', text);

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

  const element =
    tag === 'anchor'
      ? Object.assign(el('a'), { href: '#' })
      : Object.assign(el('button'), { type: 'button' });

  if (tag === 'anchor') {
    element.setAttribute('role', 'button');
  }

  element.className = ['btn', toneClass, size, hoverBorder ? 'hover-border' : '']
    .filter(Boolean)
    .join(' ');
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

  const group = el('div', LAYOUT_CLASS[layout]);
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
 * Renders one button group per active tone inside a single flex row.
 *
 * Every visual environment of the matrix goes through this helper, so a tone
 * enabled in the picker is automatically covered by all of them.
 *
 * @param {ButtonFamily} family Family whose `toneClass` resolves the class name.
 * @param {AppState} state Global application state.
 * @param {ToneRowOptions} [options] Per-row overrides.
 * @returns {HTMLDivElement} Row containing one group per active tone.
 * @throws {TypeError} When `family.toneClass` is not a function.
 * @throws {RangeError} When `groupState` or `layout` is unknown.
 */
const createToneRow = (family, state, options = {}) => {
  if (typeof family?.toneClass !== 'function') {
    throw new TypeError('family.toneClass must be a function');
  }

  const {
    groupState = 'default',
    buttonStates,
    labels,
    size = '',
    ariaLabel = family.title,
    layout = 'group',
  } = options;

  if (!STATES.includes(groupState)) {
    throw new RangeError(`Unknown button state: ${groupState}`);
  }

  if (!LAYOUTS.includes(layout)) {
    throw new RangeError(`Unknown layout: ${layout}`);
  }

  return el(
    'div',
    'd-flex flex-wrap gap-2',
    ...state.tones.map((tone) =>
      createGroup({
        toneClass: family.toneClass(tone),
        state: groupState,
        buttonStates,
        labels,
        size,
        layout,
        hoverBorder: state.hoverBorder,
        tag: state.tag,
        ariaLabel: `${ariaLabel} ${tone} group`,
      }),
    ),
  );
};

/**
 * Renders one row where only the middle button carries the disabled state.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @param {ButtonState} disabledState
 * @returns {HTMLDivElement}
 */
const createIndividualDisabled = (family, state, disabledState) =>
  el(
    'div',
    'd-flex flex-wrap gap-2',
    ...state.tones.map((tone) =>
      createGroup({
        toneClass: family.toneClass(tone),
        labels: ['Enabled', 'Disabled', 'Enabled'],
        buttonStates: ['default', disabledState, 'default'],
        hoverBorder: state.hoverBorder,
        tag: state.tag,
        ariaLabel: `${family.title} ${tone} individual disabled group`,
      }),
    ),
  );

/**
 * Builds one `btn-toolbar` per tone, each mixing two groups of the family.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createToolbar = (family, state) =>
  el(
    'div',
    'd-flex flex-column gap-2',
    ...state.tones.map((tone, index) => {
      const nextTone = state.tones[(index + 1) % state.tones.length];

      const toolbar = el('div', 'btn-toolbar gap-2');
      toolbar.setAttribute('role', 'toolbar');
      toolbar.setAttribute('aria-label', `${family.title} ${tone} toolbar`);

      [
        { tone, labels: ['1', '2', '3'] },
        { tone: nextTone, labels: ['4', '5'] },
      ].forEach(({ tone: currentTone, labels }) => {
        toolbar.appendChild(
          createGroup({
            toneClass: family.toneClass(currentTone),
            labels,
            hoverBorder: state.hoverBorder,
            tag: state.tag,
            ariaLabel: `${family.title} ${currentTone} toolbar group`,
          }),
        );
      });

      return toolbar;
    }),
  );

/**
 * Builds one `btn-check` radio group per tone.
 *
 * The `btn-check` pattern requires a `<label>`, so this block ignores
 * `state.tag` on purpose.
 *
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createRadioGroup = (family, state) =>
  el(
    'div',
    'd-flex flex-wrap gap-2',
    ...state.tones.map((tone) => {
      const name = `pg-btn-group-${family.id}-${tone}-radio`;
      const toneClass = family.toneClass(tone);

      const wrapper = el('div', 'btn-group');
      wrapper.setAttribute('role', 'group');
      wrapper.setAttribute('aria-label', `${family.title} ${tone} radio group`);

      DEFAULT_LABELS.forEach((label, index) => {
        const id = `${name}-${index}`;

        const input = el('input', 'btn-check');
        input.type = 'radio';
        input.name = name;
        input.id = id;
        input.autocomplete = 'off';
        input.checked = index === 0;

        const labelElement = el(
          'label',
          ['btn', toneClass, state.hoverBorder ? 'hover-border' : ''].filter(Boolean).join(' '),
          label,
        );
        labelElement.htmlFor = id;

        wrapper.append(input, labelElement);
      });

      return wrapper;
    }),
  );

/**
 * Builds one `data-bs-toggle="button"` toggle per tone.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createToggleRow = (family, state) =>
  el(
    'div',
    'd-flex flex-wrap gap-2',
    ...state.tones.map((tone) => {
      const element = createButton({
        tag: state.tag,
        toneClass: family.toneClass(tone),
        label: `Toggle ${tone}`,
        state: 'default',
        size: '',
        hoverBorder: state.hoverBorder,
      });

      element.dataset.bsToggle = 'button';
      element.setAttribute('aria-pressed', 'false');

      return element;
    }),
  );

/**
 * Creates a single button that carries an icon or a badge.
 *
 * `createButton` writes `textContent`, so it cannot host child nodes. This
 * helper delegates the class/state resolution to `createButton` and then
 * replaces the text node with the icon + label pair or the label + badge pair.
 *
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @param {IconBadgeItem} item
 * @returns {HTMLButtonElement | HTMLAnchorElement}
 * @throws {TypeError} When `item.label` is not a non-empty string.
 * @throws {TypeError} When `item.icon` is not a non-empty string.
 */
const createIconBadgeButton = (family, state, item) => {
  if (typeof item.label !== 'string' || item.label.trim() === '') {
    throw new TypeError('item.label must be a non-empty string');
  }

  if (typeof item.icon !== 'string' || item.icon.trim() === '') {
    throw new TypeError('item.icon must be a non-empty string');
  }

  const element = createButton({
    tag: state.tag,
    toneClass: family.toneClass(item.tone),
    label: '',
    state: 'default',
    size: '',
    hoverBorder: state.hoverBorder,
  });

  if (item.badge) {
    element.append(`${item.label} `, el('span', `badge text-bg-${item.tone} ms-1`, item.badge));

    return element;
  }

  const icon = el('i', `bi ${item.icon} me-1`);
  icon.setAttribute('aria-hidden', 'true');
  element.append(icon, document.createTextNode(item.label));

  return element;
};

/**
 * Builds the "Icon and badge" rows for a single family.
 *
 * Two rows are produced: the first renders an icon per tone, the second
 * renders a label plus a badge per tone.
 *
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLDivElement}
 */
const createIconBadgeRow = (family, state) => {
  const iconRow = el('div', 'd-flex flex-wrap gap-2');
  const badgeRow = el('div', 'd-flex flex-wrap gap-2');

  state.tones.forEach((tone, index) => {
    const icon = ICON_POOL[index % ICON_POOL.length];

    iconRow.appendChild(createIconBadgeButton(family, state, { tone, label: tone, icon }));
    badgeRow.appendChild(
      createIconBadgeButton(family, state, {
        tone,
        label: tone,
        icon,
        badge: String(index + 1),
      }),
    );
  });

  return el('div', 'd-flex flex-column gap-2', iconRow, badgeRow);
};

/**
 * Renders every group variation of a single button family.
 * @param {ButtonFamily} family
 * @param {AppState} state
 * @returns {HTMLElement}
 */
const renderFamily = (family, state) => {
  const section = el('section', 'd-flex flex-column gap-2');
  section.id = `pg-btn-group-${family.id}`;

  const title = el('h4', 'fw-bold mb-0', family.title);
  const description = el('p', 'small text-body-secondary mb-0', family.description);
  section.append(title, description);

  /** @param {string} heading @param {...Node} nodes */
  const block = (heading, ...nodes) => section.append(createHeading(heading), ...nodes);

  block('Tones', createToneRow(family, state, { ariaLabel: `${family.title} tone` }));

  if (family.extras?.length) {
    block(
      'Tone-less',
      el(
        'div',
        'd-flex flex-wrap gap-2',
        ...family.extras.map((extra) =>
          createGroup({
            toneClass: extra.className,
            hoverBorder: state.hoverBorder,
            tag: state.tag,
            ariaLabel: `${extra.label} group`,
          }),
        ),
      ),
    );
  }

  STATES.forEach((item) => {
    block(
      `State: ${item}`,
      createToneRow(family, state, {
        groupState: item,
        ariaLabel: `${family.title} ${item}`,
      }),
    );
  });

  block(
    'Individual disabled (attribute)',
    createIndividualDisabled(family, state, 'disabled-attribute'),
  );
  block('Individual disabled (class)', createIndividualDisabled(family, state, 'disabled-class'));

  SIZES.forEach(({ size, label }) => {
    block(
      `Size: ${label}`,
      createToneRow(family, state, { size, ariaLabel: `${family.title} ${label}` }),
    );
  });

  block('Toggle', createToggleRow(family, state));
  block('Icon and badge', createIconBadgeRow(family, state));
  block(
    'Vertical',
    createToneRow(family, state, {
      layout: 'vertical',
      ariaLabel: `${family.title} vertical`,
    }),
  );
  block('Toolbar', createToolbar(family, state));
  block('Radio (btn-check — always <label>)', createRadioGroup(family, state));

  return section;
};

/* ------------------------------------------------------------------- picker */

/**
 * Builds a single switch.
 * @param {SwitchConfig} config
 * @returns {HTMLDivElement}
 */
const createSwitch = ({ id, label, checked, onChange }) => {
  const input = el('input', 'form-check-input');
  input.type = 'checkbox';
  input.role = 'switch';
  input.id = id;
  input.checked = checked;
  input.addEventListener('change', () => onChange(input.checked));

  const labelElement = el('label', 'form-check-label small');
  labelElement.htmlFor = id;
  labelElement.innerHTML = label;

  return el('div', 'form-check form-switch mb-0', input, labelElement);
};

/**
 * Builds the tone multi-select. All tones start selected, which keeps the
 * matrix identical to the previous full render.
 *
 * @param {AppState} state
 * @param {(tones: readonly string[]) => void} onChange
 * @returns {HTMLDivElement}
 */
const createTonePicker = (state, onChange) => {
  const selected = new Set(state.tones);

  const toggle = button('', 'btn btn-sm btn-outline-secondary dropdown-toggle');
  toggle.dataset.bsToggle = 'dropdown';
  toggle.dataset.bsAutoClose = 'outside';

  const syncLabel = () => {
    toggle.textContent = `Tones (${selected.size}/${TONES.length})`;
    toggle.classList.toggle('text-warning', selected.size !== TONES.length);
  };

  const commit = () => {
    syncLabel();
    onChange(TONES.filter((tone) => selected.has(tone)));
  };

  const items = TONES.map((tone) => {
    const input = el('input', 'form-check-input');
    input.type = 'checkbox';
    input.id = `pg-btn-tone-${tone}`;
    input.checked = selected.has(tone);
    input.addEventListener('change', () => {
      if (input.checked) {
        selected.add(tone);
      } else {
        selected.delete(tone);
      }

      commit();
    });

    const label = el('label', 'form-check-label small text-capitalize', tone);
    label.htmlFor = input.id;

    return el('div', 'form-check', input, label);
  });

  const setAll = (checked) => {
    TONES.forEach((tone) => (checked ? selected.add(tone) : selected.delete(tone)));
    items.forEach((item) => {
      /** @type {HTMLInputElement} */ (item.querySelector('input')).checked = checked;
    });
    commit();
  };

  const all = button('All', 'btn btn-sm btn-outline-secondary flex-fill');
  all.addEventListener('click', () => setAll(true));

  const none = button('None', 'btn btn-sm btn-outline-secondary flex-fill');
  none.addEventListener('click', () => setAll(false));

  const menu = el('div', 'dropdown-menu p-2', el('div', 'd-flex gap-1 mb-2', all, none), ...items);
  menu.style.minWidth = '12rem';
  menu.style.maxHeight = '16rem';
  menu.style.overflowY = 'auto';

  syncLabel();

  return el('div', 'dropdown', toggle, menu);
};

/**
 * Builds the family picker, the tone picker and the global switches.
 * @param {AppState} state
 * @param {PickerCallbacks} callbacks
 * @returns {HTMLDivElement}
 */
const createPicker = (state, callbacks) => {
  const label = el('label', 'form-label mb-0 small fw-bold text-body-secondary', 'Button family');
  label.htmlFor = 'pg-btn-family';

  const select = el('select', 'form-select form-select-sm w-auto');
  select.id = 'pg-btn-family';
  select.append(
    new Option('All families', ALL_FAMILIES),
    ...FAMILIES.map((family) => new Option(family.title, family.id)),
  );
  select.value = state.family;
  select.addEventListener('change', () => callbacks.onFamilyChange(select.value));

  return el(
    'div',
    'd-flex flex-wrap align-items-center gap-3',
    el('div', 'd-flex align-items-center gap-2', label, select),
    createTonePicker(state, callbacks.onTonesChange),
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
};

/* ------------------------------------------------------------------- render */

/**
 * Renders the requested families into the container.
 * @param {HTMLElement} container
 * @param {AppState} state
 * @returns {void}
 */
const render = (container, state) => {
  if (state.tones.length === 0) {
    container.replaceChildren(
      el('p', 'alert alert-warning mb-0', 'Select at least one tone to render the matrix.'),
    );

    return;
  }

  const families =
    state.family === ALL_FAMILIES
      ? FAMILIES
      : FAMILIES.filter((family) => family.id === state.family);

  container.replaceChildren(...families.map((family) => renderFamily(family, state)));
};

/**
 * Reads the persisted tones, falling back to every tone.
 * @returns {readonly string[]}
 */
const readTones = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE.tones) ?? 'null');

    return Array.isArray(parsed) ? TONES.filter((tone) => parsed.includes(tone)) : [...TONES];
  } catch {
    return [...TONES];
  }
};

/**
 * Reads the persisted state.
 * @returns {AppState}
 */
const loadState = () => {
  const family = localStorage.getItem(STORAGE.family);
  const tag = localStorage.getItem(STORAGE.tag);

  return {
    family: [ALL_FAMILIES, ...FAMILIES.map((item) => item.id)].includes(family)
      ? family
      : ALL_FAMILIES,
    tones: readTones(),
    hoverBorder: localStorage.getItem(STORAGE.hoverBorder) === 'true',
    tag: tag === 'anchor' ? 'anchor' : 'button',
  };
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

  const state = loadState();
  const results = el('div', 'd-flex flex-column gap-5');

  /**
   * Applies a partial state, persists it and repaints the matrix.
   * @param {Partial<AppState>} patch
   * @returns {void}
   */
  const update = (patch) => {
    Object.assign(state, patch);
    localStorage.setItem(STORAGE.family, state.family);
    localStorage.setItem(STORAGE.tones, JSON.stringify(state.tones));
    localStorage.setItem(STORAGE.hoverBorder, String(state.hoverBorder));
    localStorage.setItem(STORAGE.tag, state.tag);
    render(results, state);
  };

  const picker = createPicker(state, {
    onFamilyChange: (family) => update({ family }),
    onTonesChange: (tones) => update({ tones }),
    onHoverBorderChange: (hoverBorder) => update({ hoverBorder }),
    onTagChange: (tag) => update({ tag }),
  });

  render(results, state);
  mount.replaceChildren(picker, results);
};

mountButtonGroups();
