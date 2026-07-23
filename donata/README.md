# DONATA — Sitio web · *Fuego de barrio*

Sitio oficial de **Donata**, restaurante · parrilla · minutas en Quilmes Oeste.
Construido por **Chimichurri** como sitio modelo reutilizable para restaurantes.

Claim: **“Acá se viene a comer de verdad.”**

---

## Stack

Sitio **estático de alto rendimiento**: HTML semántico + CSS moderno (variables,
grid, `scroll-snap`) + JavaScript vanilla (sin build, sin dependencias, sin
frameworks). Pensado para Lighthouse >90 en mobile, carga rápida en 4G y deploy
directo en Netlify (igual que el resto del hub Chimichurri).

- **Cero JS de terceros.** Animaciones con `IntersectionObserver`, `transform` y
  `opacity`. Partículas de brasa en `<canvas>`, desactivadas en baja potencia.
- **Accesible:** navegación por teclado, `focus-visible`, contraste AA, botones
  ≥44px, `prefers-reduced-motion` respetado (preloader e intro se omiten).
- **Mobile-first:** diseñado para 360 / 390 / 430px, con barra de acción fija
  (Reservar / Pedir) y menú fullscreen.

## Estructura

```
donata/
├── index.html            # Página única (secciones + SEO + schema.org)
├── config/
│   └── theme.js          # 🎨 Colores y tipografías (se inyectan como vars CSS)
├── data/
│   ├── restaurant.js     # 🏪 Negocio: contacto, WhatsApp, copy, reseñas
│   ├── menu.js           # 🍽️ Menú por categorías (placeholder editable)
│   └── gallery.js        # 📸 Galería y platos destacados
├── css/
│   └── donata.css        # Estilos (mobile-first)
├── js/
│   └── donata.js         # Render de datos + interacciones
├── assets/               # 📥 Fotos, video, logo, og.jpg (cargar reales)
├── robots.txt · sitemap.xml
├── PENDIENTE.md          # ⚠️ Todo lo que falta confirmar
└── README.md
```

## Cómo editar el contenido

**Nada de contenido dinámico está hardcodeado en los componentes.** Para
actualizar el sitio, editá los archivos de `config/` y `data/`:

| Quiero cambiar… | Archivo |
|---|---|
| Colores, tipografías | `config/theme.js` |
| Teléfonos, dirección, Instagram, horarios | `data/restaurant.js` |
| Mensajes precargados de WhatsApp | `data/restaurant.js` → `whatsappMessages` |
| Textos de claims / manifiesto | `data/restaurant.js` → `copy` (y titulares en `index.html`) |
| Menú (platos, precios, etiquetas) | `data/menu.js` |
| Galería y platos destacados | `data/gallery.js` |
| Reseñas de Google | `data/restaurant.js` → `reviews` |

> Los **titulares editoriales** viven también en `index.html` (por SEO, para que
> estén en el HTML sin depender de JS). El resto del contenido repetible se
> renderiza desde `data/`.

### Cargar fotos reales
En cualquier item de `data/gallery.js` o `data/restaurant.js`, completá el campo
`src` con la ruta a la imagen (ej. `assets/parrilla.webp`). Mientras `src` esté
vacío, se muestra un **slot tipográfico** claramente identificado — nunca stock.

### Video del hero
Reemplazá el `<div class="hero-placeholder">` de `index.html` por:
```html
<video autoplay muted loop playsinline poster="assets/hero-poster.jpg">
  <source src="assets/hero.webm" type="video/webm">
  <source src="assets/hero.mp4" type="video/mp4">
</video>
```

## Ejecutar localmente

Es estático: abrí `index.html` con cualquier servidor.
```bash
cd donata && python3 -m http.server 8000
# → http://localhost:8000
```

## Deploy

Deploya como estático (Netlify/Vercel/hosting simple). No requiere build.
Si Donata usa **dominio propio**, mové `robots.txt` y `sitemap.xml` a la raíz del
dominio y actualizá `canonical` / `og:url` en `index.html`. Ver `PENDIENTE.md`.

## Analítica

Los CTA emiten eventos a `window.dataLayer` (listo para GTM/GA4):
`donata_whatsapp_click`, `donata_phone_click`, `donata_maps_click`,
`donata_menu_view`, `donata_gallery_open`, `donata_page_view`.
Conectá tu contenedor de GTM para empezar a medir reservas y pedidos.

## Reutilizar para otro restaurante (Chimichurri)

1. Copiá la carpeta `donata/` con el nombre del nuevo cliente.
2. Reemplazá `config/theme.js` y `data/*.js`.
3. Cargá fotos en `assets/`.
4. Listo — cero cambios en componentes.

---

⚠️ **Antes de publicar, revisá [`PENDIENTE.md`](./PENDIENTE.md).**
