# DONATA — Información pendiente de confirmar

Este archivo centraliza **todo lo que falta confirmar o cargar** antes de publicar.
Ningún dato de abajo debe inventarse: se completa con información real de Donata.

> Regla de oro: mientras un dato no esté confirmado, se muestra un placeholder
> claramente identificado (nunca contenido falso ni foto de stock).

---

## 🔴 Crítico (bloquea publicación)

| # | Qué falta | Dónde se carga | Estado |
|---|-----------|----------------|--------|
| 1 | **Horarios reales** de atención | `data/restaurant.js` → `hours` (poner `confirmed: true` y cargar `schedule`) | ⛔ Pendiente |
| 2 | **Color rojo exacto** del logo | `config/theme.js` → `colors.rojo` | ⛔ Placeholder |
| 3 | **Logo de Donata** (SVG/PNG) | `assets/` + reemplazar el texto "DONATA" del nav/preloader | ⛔ Pendiente |
| 4 | **Fotos y videos reales** (parrilla, platos, salón, fachada, equipo, eventos) | `data/gallery.js`, `data/restaurant.js`, hero `<video>` | ⛔ Placeholders |

## 🟡 Importante

| # | Qué falta | Dónde se carga |
|---|-----------|----------------|
| 5 | **Menú real**: nombres, descripciones y precios confirmados | `data/menu.js` (hoy hay platos de ejemplo típicos de parrilla/minutas, marcados como placeholder) |
| 6 | **Reseñas reales de Google** (nombre, estrellas, texto) | `data/restaurant.js` → `reviews` |
| 7 | **Enlace al perfil de Google Business / Place ID** (para "Cómo llegar" exacto y reseñas) | `data/restaurant.js` → `address.mapsUrl` |
| 8 | **Imagen social (Open Graph)** 1200×630 px | `assets/og.jpg` (referenciada en `index.html`) |
| 9 | **PDF de la carta** completa (opcional) | subir a `assets/` y setear `data/menu.js` → `pdfUrl` |
| 10 | **Dominio final** y ajuste de `canonical` / `og:url` / `sitemap.xml` | `index.html`, `sitemap.xml`, `robots.txt` |

## 🟢 Opcional / a confirmar

- Estacionamiento y accesibilidad (solo se muestran si se confirman).
- Zonas y costo de delivery.
- Teléfono principal para los CTA (hoy: `11 2113-5677`). Cambiar en `data/restaurant.js` → `primaryPhoneIndex`.
- Reels verticales reales de Instagram para la galería.

---

## Datos ya confirmados (públicos)

- **Nombre:** Donata
- **Rubro:** Restaurante · Parrilla · Minutas
- **Dirección:** Av. Calchaquí 2539, Quilmes Oeste, Buenos Aires
- **Teléfonos:** 11 2113-5677 · 11 5496-7268
- **Instagram:** [@donataquilmes](https://www.instagram.com/donataquilmes/)
