# Distribuidora Libertad · web + catálogo + tablero

Sitio estático (HTML/CSS/JS, sin build) + Supabase como base de datos. Mismo modelo que TV Luz.

| Link | Para quién | Qué hace |
|---|---|---|
| `/` | Público | Web: portada, rubros, destacados, cómo pedir, nosotros, cobertura, contacto |
| `/catalogo` | Público | Lista de precios completa (6.528 artículos): búsqueda, filtros, pedido → WhatsApp |
| `/links` | Público | Página tipo Linktree para la bio de Instagram/WhatsApp (pedido, catálogo, cómo llegar, llamar, rubros) |
| `/tablero` | Cliente | Panel de edición con usuario y contraseña |

Netlify: proyecto `distribuidora-libertad` → https://distribuidora-libertad.netlify.app

## Qué se edita desde el Tablero

- **Productos**: precio en línea (Enter), mostrar/ocultar, destacar, editar, subir foto (se optimiza sola a WebP), alta y baja.
- **Actualizar precios**: subir el Excel/CSV del proveedor → detecta columnas, muestra una muestra de lo que leyó, previsualiza cambios con % de variación y aplica todo de una vez. Opcional: sumar artículos nuevos y renombrar la lista ("Octubre 2026").
- **Aumento general por %**: por rubro o todo el catálogo, con redondeo.
- **Destacados**: los que salen en la portada, con orden.
- **Pedidos**: copia de cada pedido que se manda por WhatsApp desde la web, con estados (nuevo / confirmado / entregado / cancelado).
- **Datos del sitio**: WhatsApp, teléfono, email, dirección, horario, redes, aviso superior, título de portada, nombre de la lista, zonas.

## Puesta en marcha de la base (una sola vez)

1. Crear proyecto Supabase `DISTRIBUIDORA-LIBERTAD` (región São Paulo).
2. SQL Editor → correr `SUPABASE-SETUP.sql`.
3. Cargar el catálogo inicial (6.528 artículos de `assets/data/catalogo-base.js`).
4. Authentication → Users → crear el usuario del cliente.
5. Completar `assets/js/config.js` → `LIB_SUPABASE.url` y `LIB_SUPABASE.key` (publishable/anon key) y volver a publicar.

Mientras la base no esté conectada, la web y el catálogo funcionan igual con el catálogo base; el tablero muestra un aviso.

## SEO

- FAQ en la portada con datos estructurados `FAQPage` + `HardwareStore` (JSON-LD).
- `sitemap.xml`, `robots.txt` (tablero excluido), canonical y Open Graph con imagen para compartir.
- Links a los 13 rubros del catálogo en el pie (rastreables).

## Movimiento

Todo entra y sale con ease-in-out: bloques ligados al scroll (entran desde abajo y salen por arriba), títulos palabra por palabra, entrada escalonada del hero, acordeón de FAQ animado y transición suave entre páginas. Respeta "reducir movimiento" del sistema.

## Imágenes

- Listado y prompts: `IMAGENES.md`.
- Al sumar imágenes nuevas, activarlas en `assets/js/config.js` → `LIB_ASSETS` (ej. agregar el id del rubro a `rubros`).
- Íconos de rubro: `assets/img/rubros/rubro-<id>.webp` (360×360, fondo transparente).

## Estructura

```
index.html · catalogo.html · tablero.html
assets/css/site.css        sistema visual (tokens, componentes)
assets/css/tablero.css     estilos del panel
assets/js/config.js        Supabase, datos por defecto, rubros, imágenes activas
assets/js/db.js            lectura de productos/ajustes (con respaldo local)
assets/js/comun.js         header, menú, pedido → WhatsApp, toasts
assets/js/home.js · catalogo.js · tablero.js
assets/data/catalogo-base.js   respaldo del catálogo (solo se descarga si la base no responde)
assets/vendor/             supabase-js 2.x y SheetJS (self-hosted)
assets/fonts/              Archivo (variable) + IBM Plex Mono (self-hosted)
```
