# Distribuidora Libertad · web + catálogo + tablero

Sitio estático (HTML/CSS/JS, sin build) + Supabase como base de datos. Mismo modelo que TV Luz.

| Link | Para quién | Qué hace |
|---|---|---|
| `/` | Público | Web: portada, rubros, destacados, cómo pedir, nosotros, cobertura, contacto |
| `/catalogo` | Público | Lista de precios completa (6.528 artículos): búsqueda, filtros, pedido → WhatsApp |
| `/links` | Público | Página tipo Linktree para la bio de Instagram/WhatsApp (pedido, catálogo, cómo llegar, llamar, rubros) |
| `/tablero` | Cliente | Panel de edición con usuario y contraseña |

Netlify: proyecto `distribuidora-libertad` → https://distribuidora-libertad-v1.netlify.app

## Qué se edita desde el Tablero

- **Productos**: precio en línea (Enter), mostrar/ocultar, destacar, editar, subir foto (se optimiza sola a WebP), alta y baja.
- **Actualizar precios**: subir el Excel/CSV del proveedor → detecta columnas, muestra una muestra de lo que leyó, previsualiza cambios con % de variación y aplica todo de una vez. Opcional: sumar artículos nuevos y renombrar la lista ("Octubre 2026").
- **Aumento general por %**: por rubro o todo el catálogo, con redondeo.
- **Destacados**: los que salen en la portada, con orden.
- **Pedidos**: copia de cada pedido que se manda por WhatsApp desde la web, con estados (nuevo / confirmado / entregado / cancelado).
- **Datos del sitio**: WhatsApp, teléfono, email, dirección, horario, redes, aviso superior, título de portada, nombre de la lista, zonas.

## Base de datos (ya configurada)

Libertad usa el proyecto Supabase compartido **"clientes"** (`gbdqxpatunbgegywtlkd`, el mismo de TV Luz). Para no chocar con otras webs, todo lo de Libertad lleva prefijo: tablas `lib_productos`, `lib_ajustes`, `lib_pedidos`, bucket `lib-fotos`, función `lib_es_admin()`. El esquema está en `SUPABASE-SETUP.sql` (idempotente).

- Usuario del Tablero: `ventas@distrilibertad.com.ar` (la contraseña la tiene Lucas).
- Acceso por sitio: tabla compartida `panel_accesos (user_id, sitio)`. Solo los usuarios con `sitio = 'libertad'` editan Libertad. Para sumar uno: crearlo en Authentication → Users y correr el insert del final de `SUPABASE-SETUP.sql`.
- Catálogo inicial cargado: 6.528 artículos, 14 destacados. Si la tabla quedara vacía, el Tablero muestra "Cargar catálogo inicial".
- Pendiente opcional en Supabase → Authentication → URL Configuration: sumar `https://distribuidora-libertad-v1.netlify.app/tablero` a Redirect URLs (para "Olvidé mi contraseña").

Las fotos de catálogo de proveedores (`assets/data/fotos.js`) se usan cuando un producto no tiene foto propia.

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
