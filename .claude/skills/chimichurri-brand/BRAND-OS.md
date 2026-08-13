# Chimichurri Diseño — Brand OS

> The operating manual for the Chimichurri Diseño brand. This is the source of
> truth for how anything on-brand should look and sound. The machine-readable
> half lives in `styles.css`; this document is the human-readable half.

---

## 1. Essence

- **Who:** Chimichurri Diseño — a design & visual-communication studio.
- **Tagline:** *Diseño que vende.* (Design that sells.)
- **Promise:** turn ordinary businesses into brands that look serious, clear,
  and sellable.
- **Feel:** bold, modern, high-contrast, confident. Dark and premium — never
  cheap, never cluttered.

---

## 2. Voice & tone

- **Language:** Argentine Spanish (voseo — "contanos", "escribinos", "tenés").
- **Direct and benefit-first.** Lead with what the client gains, not with
  features. Example: *"Si tu negocio se ve mal, perdés ventas todos los días."*
- **Confident, not arrogant.** Short sentences. No corporate filler.
- **Highlight the key word** in a headline with the accent color
  (`<em>` renders as accent, not italic).

---

## 3. Color

Defined as CSS custom properties in `styles.css`. Always reference with
`var(--token)` — never paste a raw hex into new work.

### Core (dark theme)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#080808` | Page background (near-black) |
| `--surface` | `#0f0f0f` | Cards, panels |
| `--surface2` | `#161616` | Chips, insets |
| `--text` | `#f2f2f2` | Primary text |
| `--text-muted` | `#6e6e6e` | Secondary text |
| `--border` | `rgba(255,255,255,0.07)` | Hairline borders |

### Accent themes (one per section/page — set as a `<body>` class)
| Class | `--accent` | Use for |
|---|---|---|
| `diseno` | `#D4FF00` lime | Graphic design / branding (default) |
| `fisico` | `#FF7A3D` orange | Print & physical pieces |
| `experiencias` | `#A78BFA` purple | Screen / experience work |
| `portal-page` | `#38BDF8` sky | Client portal |

Each theme also swaps `--accent-dim` (8% tint) and `--accent-border` (22% tint).
**WhatsApp green** `#25D366` is fixed across all themes.

**Rule:** accent is a *highlight* — buttons, one word in a headline, a stat, a
border on hover. Never flood large areas with it.

---

## 4. Typography

- **Headings:** `Syne`, weight 800. Tight tracking, near-1.0 line-height.
- **Body:** `Inter`. Line-height 1.65.
- Loaded via Google Fonts `@import` at the top of `styles.css`.

Scale (fluid, from `styles.css`):
| Element | Size | Notes |
|---|---|---|
| `h1` | `clamp(3rem, 8vw, 7rem)` | Syne 800, letter-spacing −0.03em |
| `h2` | `clamp(2rem, 5vw, 4rem)` | Syne 800 |
| `h3` | `clamp(1.1rem, 2.5vw, 1.55rem)` | Inter 700 |
| `p` | `clamp(0.9rem, 1.5vw, 1.04rem)` | color `--text-muted` |
| `.label` | 0.7rem, uppercase, 0.15em tracking | accent kicker with a short rule |

---

## 5. Shape, space & motion

- **Radii:** `--radius` 12px · `--radius-lg` 20px · `--radius-xl` 28px ·
  buttons & pills fully round (100px).
- **Layout:** `--max-w` 1160px centered container (`.wrap`, 28px side padding).
  Section rhythm: `.section` = 96px vertical, `.section-sm` = 56px.
- **Motion:** `--ease` = 0.18s ease. Hovers lift cards `translateY(-3px)` and
  shift the accent border in.
- **Nav height:** `--nav-h` 68px, fixed, blurred translucent bar.

---

## 6. Component vocabulary

Build with these classes — do not re-style from scratch. Full CSS in
`styles.css`.

**Layout:** `.wrap` · `.section` / `.section-sm` · `.grid-2` / `.grid-3` /
`.grid-4` · `.sh` (section header) · `.divider`

**Type & tags:** `.label` (accent kicker) · `.pill` · `.text-accent`

**Actions:** `.btn` + `.btn-primary` | `.btn-ghost` | `.btn-wa` |
`.btn-outline-accent`; sizes `.btn-lg` / `.btn-sm`

**Cards:** `.card` (+ `.card-icon`) · `.hub-card` (+ `.hub-chips`) ·
`.pack` (+ `.pack.featured`, `.pack-name` `.pack-title` `.pack-desc`
`.pack-list`)

**Sections:** `.stats-row` > `.stat` (`.stat-n` `.stat-label`) ·
`.ba-grid` > `.ba-col.before` / `.ba-col.after` (before/after) ·
`.steps` > `.step` (`.step-n`) · `.quote-block` · `.cta-block` · `.portal-opt`

**Chrome:** `.nav` (`.nav-inner` `.logo` `.logo-dot` `.nav-menu` `.nav-wa`) ·
`.hero` / `.cat-hero` (+ `-glow`) · `.footer` (`.footer-inner` `.footer-col`) ·
`.wa-fab` (floating WhatsApp button) · `.chips` > `.chip`

Signature touches: the `.logo-dot` accent dot, the `.label` rule-before-text
kicker, the "Más elegido" badge on `.pack.featured`, ghost-number `.step-n`.

---

## 7. Quick start (HTML)

```html
<!doctype html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="styles.css">
</head>
<body class="diseno">
  <section class="section">
    <div class="wrap">
      <div class="label">Qué hacemos</div>
      <h2>Diseño que <em>vende.</em></h2>
      <div class="grid-3" style="margin-top:32px">
        <div class="card">
          <div class="card-icon">🎨</div>
          <h3>Identidad visual</h3>
          <p>Logo y sistema visual coherente para tu marca.</p>
        </div>
        <!-- …two more .card… -->
      </div>
      <a class="btn btn-primary btn-lg" style="margin-top:32px">Ver catálogos</a>
    </div>
  </section>
</body>
</html>
```

---

## 8. Do / Don't

**Do**
- Start from `styles.css` and its classes.
- Keep it dark, high-contrast, spacious.
- Use one accent theme per page/section.
- Write in confident Argentine Spanish, benefit-first.

**Don't**
- White/light backgrounds or off-brand fonts.
- Raw hex values instead of `var(--…)` tokens.
- Accent as a large fill or on more than a few elements per view.
- Sharp corners on buttons, or cramped layouts.
