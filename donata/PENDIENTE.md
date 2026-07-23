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
| 2 | **Año de fundación** — usé "desde 1996" (de tu referencia). Confirmar. | `data/restaurant.js` → `since`, y textos en `index.html` | ⚠️ A confirmar |
| 3 | **Color exacto** (rojo/dorado) del logo real | `config/theme.js` → `colors.rojo` / `colors.fuego` | ⚠️ Aproximado |
| 4 | **Logo de Donata** (SVG/PNG) | `assets/` + reemplazar el texto "DONATA" del nav/preloader | ⛔ Pendiente |

## 🟢 Imágenes — YA INTEGRADAS

Las 10 fotos que enviaste ya están cargadas y optimizadas a WebP en `assets/`
(hero, salón, barra y 7 platos). **El salón y la barra parecen fotos reales;
los platos fueron generados en ChatGPT** — si más adelante querés reemplazarlos
por fotos reales de los platos de Donata, cambiás el archivo en `assets/`
manteniendo el mismo nombre (o editás el `src` en `data/gallery.js`).

Opcional: **video de fondo del hero** (Veo 3) → reemplazar el `<img>` del hero
por `<video>` (ver README).

## 🟡 Importante

| # | Qué falta | Dónde se carga |
|---|-----------|----------------|
| 5 | **Menú real**: nombres, descripciones y precios confirmados | `data/menu.js` (hoy hay platos de ejemplo de parrilla/minutas, marcados como placeholder) |
| 6 | **Reseñas reales de Google** (nombre, estrellas, texto) | `data/restaurant.js` → `reviews` |
| 7 | **Enlace al perfil de Google Business / Place ID** | `data/restaurant.js` → `address.mapsUrl` |
| 8 | **Imagen social (Open Graph)** 1200×630 px | `assets/og.jpg` (referenciada en `index.html`) — se puede recortar del hero |
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
