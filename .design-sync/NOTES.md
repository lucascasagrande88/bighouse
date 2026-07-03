# design-sync notes — Chimichurri Diseño

- Repo shape: **static HTML/CSS site** (Netlify), NOT a React/Storybook package.
  The automatic converter (package/storybook shapes) does not apply.
- Design system source of truth: `assets/css/style.css` — CSS custom properties
  (tokens) + utility/component classes. Fonts: Syne (headings) + Inter (body) via
  Google Fonts @import.
- Sync approach: **hand-authored** Claude Design project. `ds-bundle/` holds
  `styles.css` (verbatim copy of the DS stylesheet = the design closure) plus one
  self-contained `@dsCard`-marked preview HTML per component family.
- Four accent themes via body class overrides: `.diseno` (#D4FF00 lime),
  `.fisico` (#FF7A3D orange), `.experiencias` (#A78BFA purple),
  `.portal-page` (#38BDF8 sky).
