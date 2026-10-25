/**
 * @file Generic colour matrix engine for the Bootstrap 5.3 playground.
 *
 * Every component that exposes one class per theme colour (alerts, badges,
 * cards, list groups, progress bars, spinners, ...) needs the exact same
 * playground: a family picker, a tone multi-select, two global switches and a
 * persisted state.
 *
 * `createMatrix` extracts that contract. A component only describes its
 * families and how to render one family, and the engine takes care of the
 * picker, the persistence and the re-render.
 */

/* -------------------------------------------------------------------- types */

/**
 * @typedef {Object} MatrixExtra
 * @property {string} label Visible label of the variant.
 * @property {string} className Class applied to the variant.
 */

/**
 * @typedef {Object} MatrixFamily
 * @property {string} id Unique identifier, also used as a DOM id suffix.
 * @property {string} title Heading text.
 * @property {string} description Short explanation rendered under the heading.
 * @property {(tone: string) => string} toneClass Resolves the tone class of the family.
 * @property {readonly MatrixExtra[]} [extras] Tone-less variants that only exist in this family.
 */

/**
 * @typedef {Object} MatrixState
 * @property {string} family Currently selected family id, or `all`.
 * @property {readonly string[]} tones Tones rendered by every family.
 * @property {boolean} hoverBorder Whether the `hover-border` modifier is on.
 * @property {boolean} anchor Whether the component should render as `<a>`.
 */

/**
 * @typedef {Object} MatrixDefinition
 * @property {string} id Namespace used by the DOM ids and by localStorage.
 * @property {string} mountId Id of the element that receives the matrix.
 * @property {readonly MatrixFamily[]} families Families rendered by the matrix.
 * @property {(family: MatrixFamily, state: MatrixState) => HTMLElement} renderFamily Renders one family.
 * @property {readonly MatrixControl[]} [controls] Picker controls to display.
 */

/** @typedef {'family' | 'tones' | 'hoverBorder' | 'anchor'} MatrixControl */

/**
 * @typedef {Object} PickerCallbacks
 * @property {(familyId: string) => void} onFamilyChange
 * @property {(tones: readonly string[]) => void} onTonesChange
 * @property {(enabled: boolean) => void} onHoverBorderChange
 * @property {(enabled: boolean) => void} onAnchorChange
 */

/**
 * @typedef {Object} SwitchConfig
 * @property {string} id Input id, also used by the label.
 * @property {string} label Inner HTML of the label.
 * @property {boolean} checked Initial state.
 * @property {(checked: boolean) => void} onChange Change handler.
 */

/* ---------------------------------------------------------------- constants */

/**
 * Tones rendered for every family.
 * @type {readonly string[]}
 */
export const TONES = Object.freeze([
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

/** @type {string} */
export const ALL_FAMILIES = 'all';

/* ------------------------------------------------------------------ helpers */

/**
 * Creates an element, applies a class list and appends the children.
 * @template {keyof HTMLElementTagNameMap} T
 * @param {T} tag Tag name.
 * @param {string} [className] Class list. Omitted when empty.
 * @param {...(Node | string)} children Child nodes or text.
 * @returns {HTMLElementTagNameMap[T]}
 */
export const el = (tag, className = '', ...children) => {
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
export const button = (text, className) => {
  const node = el('button', className, text);
  node.type = 'button';

  return node;
};

/**
 * Creates a small uppercase heading used to separate the demo blocks.
 * @param {string} text
 * @returns {HTMLHeadingElement}
 */
export const createHeading = (text) => el('h5', 'h6 text-body-secondary mt-3 mb-2', text);

/* ------------------------------------------------------------------ storage */

/**
 * Builds the localStorage adapter of a single matrix.
 * @param {string} id Matrix namespace.
 * @returns {{
 *   load: (families: readonly MatrixFamily[]) => MatrixState,
 *   save: (state: MatrixState) => void,
 * }} Storage adapter.
 */
const createStorage = (id) => {
  const keys = {
    family: `pg-${id}-family`,
    tones: `pg-${id}-tones`,
    hoverBorder: `pg-${id}-hover-border`,
    anchor: `pg-${id}-anchor`,
  };

  return {
    load(families) {
      const family = localStorage.getItem(keys.family);
      const rawTones = localStorage.getItem(keys.tones);

      let tones = [...TONES];

      try {
        const parsed = JSON.parse(rawTones ?? 'null');

        if (Array.isArray(parsed)) {
          tones = TONES.filter((tone) => parsed.includes(tone));
        }
      } catch {
        tones = [...TONES];
      }

      return {
        family: [ALL_FAMILIES, ...families.map((item) => item.id)].includes(family)
          ? family
          : ALL_FAMILIES,
        tones,
        hoverBorder: localStorage.getItem(keys.hoverBorder) === 'true',
        anchor: localStorage.getItem(keys.anchor) === 'true',
      };
    },
    save(state) {
      localStorage.setItem(keys.family, state.family);
      localStorage.setItem(keys.tones, JSON.stringify(state.tones));
      localStorage.setItem(keys.hoverBorder, String(state.hoverBorder));
      localStorage.setItem(keys.anchor, String(state.anchor));
    },
  };
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
 * Builds the tone multi-select. All tones start selected.
 * @param {string} id Matrix namespace.
 * @param {MatrixState} state Current state.
 * @param {(tones: readonly string[]) => void} onChange Change handler.
 * @returns {HTMLDivElement}
 */
const createTonePicker = (id, state, onChange) => {
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
    input.id = `pg-${id}-tone-${tone}`;
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
 * @param {string} id Matrix namespace.
 * @param {MatrixState} state Current state.
 * @param {readonly MatrixFamily[]} families Families of the matrix.
 * @param {readonly MatrixControl[]} controls Controls to display.
 * @param {PickerCallbacks} callbacks Change handlers.
 * @returns {HTMLDivElement}
 */
const createPicker = (id, state, families, controls, callbacks) => {
  const children = [];

  if (controls.includes('family')) {
    const label = el('label', 'form-label mb-0 small fw-bold text-body-secondary', 'Family');
    label.htmlFor = `pg-${id}-family`;

    const select = el('select', 'form-select form-select-sm w-auto');
    select.id = `pg-${id}-family`;
    select.append(
      new Option('All families', ALL_FAMILIES),
      ...families.map((family) => new Option(family.title, family.id)),
    );
    select.value = state.family;
    select.addEventListener('change', () => callbacks.onFamilyChange(select.value));

    children.push(el('div', 'd-flex align-items-center gap-2', label, select));
  }

  if (controls.includes('tones')) {
    children.push(createTonePicker(id, state, callbacks.onTonesChange));
  }

  if (controls.includes('hoverBorder')) {
    children.push(
      createSwitch({
        id: `pg-${id}-hover-border`,
        label: '<code>hover-border</code>',
        checked: state.hoverBorder,
        onChange: callbacks.onHoverBorderChange,
      }),
    );
  }

  if (controls.includes('anchor')) {
    children.push(
      createSwitch({
        id: `pg-${id}-anchor`,
        label: 'Render as <code>&lt;a&gt;</code>',
        checked: state.anchor,
        onChange: callbacks.onAnchorChange,
      }),
    );
  }

  return el('div', 'd-flex flex-wrap align-items-center gap-3', ...children);
};

/* ------------------------------------------------------------------- render */

/**
 * Renders the requested families into the container.
 * @param {HTMLElement} container
 * @param {readonly MatrixFamily[]} families
 * @param {MatrixState} state
 * @param {(family: MatrixFamily, state: MatrixState) => HTMLElement} renderFamily
 * @returns {void}
 */
const render = (container, families, state, renderFamily) => {
  if (state.tones.length === 0) {
    container.replaceChildren(
      el('p', 'alert alert-warning mb-0', 'Select at least one tone to render the matrix.'),
    );

    return;
  }

  const visible =
    state.family === ALL_FAMILIES
      ? families
      : families.filter((family) => family.id === state.family);

  container.replaceChildren(...visible.map((family) => renderFamily(family, state)));
};

/* ------------------------------------------------------------------ factory */

/**
 * Mounts a colour matrix into `#${mountId}`.
 *
 * Returns `null` (instead of throwing) when the mount point is missing, so a
 * page can include only the matrices it needs without guarding every call.
 *
 * @param {MatrixDefinition} definition
 * @returns {void}
 */
export const createMatrix = ({
  id,
  mountId,
  families,
  renderFamily,
  controls = ['family', 'tones'],
}) => {
  const mount = document.getElementById(mountId);

  if (!(mount instanceof HTMLElement)) {
    return;
  }

  const storage = createStorage(id);
  const state = storage.load(families);
  const results = el('div', 'd-flex flex-column gap-5');

  /**
   * Applies a partial state, persists it and repaints the matrix.
   * @param {Partial<MatrixState>} patch
   * @returns {void}
   */
  const update = (patch) => {
    Object.assign(state, patch);
    storage.save(state);
    render(results, families, state, renderFamily);
  };

  const picker = createPicker(id, state, families, controls, {
    onFamilyChange: (family) => update({ family }),
    onTonesChange: (tones) => update({ tones }),
    onHoverBorderChange: (hoverBorder) => update({ hoverBorder }),
    onAnchorChange: (anchor) => update({ anchor }),
  });

  render(results, families, state, renderFamily);
  mount.replaceChildren(picker, results);
};
