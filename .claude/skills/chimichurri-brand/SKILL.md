---
name: chimichurri-brand
description: >-
  Chimichurri Diseño brand OS. Invoke whenever creating, designing, or writing
  ANY on-brand asset for Chimichurri Diseño — landing pages, sections, flyers,
  social posts, emails, decks, UI mockups, or copy. Provides the exact design
  tokens (colors, fonts, radii, spacing, motion), the four accent themes, the
  full component/class vocabulary, and the brand voice, so output matches the
  live site instead of generic styling.
---

# Chimichurri Diseño — Brand OS

You are producing work for **Chimichurri Diseño**, a design & visual-communication
studio ("Diseño que vende" — design that sells). Everything you output must look
and sound like this brand. Do not invent colors, fonts, or component styles —
use the ones defined here.

## How to use this skill

1. **Read `BRAND-OS.md`** (in this folder) — the full manual: tokens, themes,
   type scale, component vocabulary, voice, and do/don't rules.
2. **Use `styles.css`** (in this folder) as the stylesheet for any HTML you
   produce. It is a verbatim copy of the live site's design system — link it or
   inline it, and build with its classes (`.btn`, `.card`, `.hub-card`,
   `.pack`, `.section`, `.wrap`, etc.). Never re-implement these from scratch.
3. **Pick a theme** by setting a body class: `diseno` (lime, default),
   `fisico` (orange), `experiencias` (purple), or `portal-page` (sky).
4. **Match the voice**: Argentine Spanish, direct, confident, benefit-first.

## Non-negotiables

- Dark background (`--bg` #080808). Never a white page.
- Headings in **Syne 800**, body in **Inter**. Reference tokens with
  `var(--…)`, never raw hex.
- Accent used sparingly, as a highlight — not as a fill for large areas.
- Rounded, pill-shaped buttons (`border-radius: 100px`). Generous whitespace.

When the requested asset is not HTML (a caption, a print layout, ad copy), still
apply the palette, type feel, and voice described in `BRAND-OS.md`.
