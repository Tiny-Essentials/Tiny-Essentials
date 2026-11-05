# 🎨 DeepStrap (Bootstrap 5.3 theme)

**DeepStrap** is a token-driven Bootstrap 5.3 theme shipped as SCSS partials. Instead of overriding Bootstrap after the fact, it feeds Bootstrap's own Sass maps, so every component — including the ones you write later — inherits the same design tokens.

---

## ✨ Highlights

* **Token first** — colors, spacing, radii, shadows and typography live in overridable Sass maps.
* **CSS custom properties** — every token is also exposed as a `--ui-*` variable, so runtime theming is a one-liner.
* **Light and dark** — both themes are generated from the same source of truth.
* **Optional plugins** — ghost buttons, contrast buttons, cube icon, sphere pulse and a background grid.

---

## 🚀 Quick start

```scss
// app.scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/themes/deepstrap/theme';
```

> The entry point imports Bootstrap itself. Do not import `bootstrap/scss/bootstrap` a second time.

---

## 🗂️ Structure

```
scss/
├── background/
│   └── _background-grid.scss
├── components/
│   ├── buttons/
│   │   ├── _buttons-contrast.scss
│   │   └── _buttons-ghost.scss
│   └── icon/
│       ├── _cube-icon.scss
│       └── _sphere-pulse.scss
├── input/
│   └── _placeholder-colors-fix.scss
├── spacing/
│   └── _spacing-plus.scss
└── themes/
    └── deepstrap/
        ├── _theme.scss          ← entry point
        ├── _variables.scss      ← Bootstrap variable overrides
        ├── _tokens.scss         ← CSS custom properties
        ├── _colors.scss         ← palette + theme maps
        ├── _effects.scss
        ├── _global.scss
        ├── _bootstrap-overrides.scss
        ├── _buttons.scss
        ├── _forms.scss
        ├── _forms-tones.scss
        ├── _links.scss
        ├── _utilities.scss
        ├── _badges.scss
        ├── _tables.scss
        └── plugins/
            ├── _tone-mixins.scss
            ├── _form-tone-mixins.scss
            ├── _sizing.scss
            └── _typography.scss
```

---

## 🎛️ Customizing tokens

Every map is declared with `!default`, so you can override it **before** importing the theme:

```scss
@use 'sass:map';

$cube-icon-sizes: (
  sm: 1rem,
  md: 2rem,
  lg: 5rem,
);

@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/themes/deepstrap/theme';
```

---

## 🧩 Plugins

### Ghost buttons

Borderless, low-emphasis buttons that inherit the current text color.

```html
<button class="btn btn-ghost">Neutral</button>
<button class="btn btn-ghost-primary">Primary</button>
<button class="btn btn-ghost-danger">Danger</button>
```

```scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/components/buttons/buttons-ghost';
```

### Contrast buttons

High-contrast variants intended for primary actions.

```html
<button class="btn btn-contrast">Confirm</button>
```

### Cube icon

A pure-CSS animated cube with a configurable size scale.

```html
<span class="cube-icon cube-icon-lg"></span>
```

```scss
$cube-icon-sizes: (
  xs: 1rem,
  sm: 1.5rem,
  md: 3rem,
  lg: 4rem,
  xl: 6rem,
) !default;
```

### Sphere pulse

A small pulsing indicator, useful as a live/status dot.

```html
<span class="sphere-pulse-success"></span>
```

### Background grid

A subtle grid that follows the active `data-bs-theme`.

```scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/background/background-grid';
```

---

## 🔤 Typography helpers

```scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/themes/deepstrap/plugins/typography';
```

---

## 📏 Spacing helpers

`_spacing-plus.scss` extends Bootstrap's spacing scale with the extra steps used across the theme.

```scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/spacing/spacing-plus';
```

---

## 🎨 Placeholder fix

Import the fix after Bootstrap to restore the expected behavior:

```scss
@import 'tiny-essentials/webTemplates/bootstrap/5.3/scss/input/placeholder-colors-fix';
```

---

## 🧪 Playground

A complete playground lives in `test/html/webTemplates/bootstrap/5.3/playground/` and exercises every component, variant and color in both themes.
