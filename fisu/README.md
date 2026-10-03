# FISÚ Helados — sitio web

Sitio estático (HTML + CSS + JS sin dependencias), servido en `/fisu/` dentro de este hub.

## Estructura
- `index.html`: home (hero, productos, sabores sticky, family shot, momentos, brand explosion, catálogo, CTA, footer).
- `productos/<slug>/index.html`: una página-póster por producto, con el color de su sabor.
- `assets/css/fisu.css`: sistema visual (tokens `--fisu-*`, tipografía, componentes).
- `assets/js/fisu.js`: header, menú full-screen, reveals, parallax, sabores sticky y filtros.
- `assets/img/`: productos recortados (AVIF + WebP, varios tamaños), `manifest.json` con dimensiones.
- `assets/fonts/`: Poppins y Lexend auto-hospedadas (subset latin).

## Editar contenido
Todo el contenido vive en `_src/data.mjs` (productos, contacto, dominio). Después:

```
node fisu/_src/build.mjs
```

Esto regenera la home, las páginas de producto, `sitemap.xml` y `robots.txt`.

## Pendiente de confirmar con la marca
- **Dominio** (`SITE.url`): se usa en canonical, Open Graph, schema.org y sitemap.
- **Contacto**: WhatsApp, email e Instagram son provisorios.
- **Nombres de productos**: el brand book no los nombra; son descriptivos según lo que muestra cada foto.
- `robots.txt` se genera en `/fisu/`; si FISÚ pasa a tener dominio propio, tiene que ir en la raíz.

## Imágenes
Todas salen del brand book (no hay productos ni packaging inventados). Los scripts de
`_src/pipeline/` documentan el proceso: recorte con BiRefNet (`cut.py`), upscale x2
con Real-ESRGAN (`up.py`) y exportación AVIF/WebP (`export.py`). El logo se vectorizó
calcando la versión oficial (`logo.py`, `trace.py`), sin redibujarlo.
