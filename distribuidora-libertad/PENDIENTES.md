# Pendientes · Distribuidora Libertad (traspaso a sesión local)

Estado al 16/10/2026. Web, catálogo, tablero, links, FAQ, animaciones e imágenes están terminados y en la rama `claude/hopeful-clarke-sq4eqx`. El zip para Netlify se genera desde esta carpeta (`index.html` en la raíz).

## 1. Lista de precios de octubre: HECHO

- `assets/data/catalogo-base.js` está regenerado con `Octubre-26-Distri-Libertad.xls` (en `MATERIAL/` de la carpeta del cliente). Tiene 6.519 artículos: 4.582 con precio y 1.937 en "Consultar".
- **Precio:** la web muestra el **Precio Venta, sin IVA** (decisión del 15/10). Está aclarado en `nota_precios`, en la FAQ (HTML y JSON-LD), en el total del pedido y en el mensaje de WhatsApp.
- **Códigos:** se conservan tal como vienen en la lista. El cambio de prefijo es parcial: 3.866 artículos siguen con `HUS-` y otros lo perdieron (`HUS-W3100` → `W3100`). Los rubros se heredaron comparando códigos sin el prefijo. Los 14 destacados no cambiaron de código.
- **Altas y bajas:** hay 51 artículos nuevos, clasificados por las dos primeras palabras del nombre según el catálogo viejo, con 7 ajustes manuales. 59 del catálogo viejo ya no están. Se excluyó el ítem `11 · AJUSTE DE CUENTA`, que no es un producto.
- **Tablero:** la importación de listas compara códigos ignorando mayúsculas y el prefijo `HUS-` (`claveArt()` en `tablero.js`).
- **Bonificación:** no se muestra. La columna tiene 450 valores, no 10: los `P57x` con 0,15 y muchos con −0,0865 (por ejemplo `RIEG*` y `EVOL*`). Hay que consultar al cliente qué significan antes de mostrarla.
- El script que generó el catálogo no está en el repo. Para la próxima lista alcanza con usar la importación del tablero (cuando haya Supabase) o pedirle a Claude que lo regenere igual.

## 2. Fotos de productos: HECHO (16/10), con revisión pendiente

- 922 artículos con foto del catálogo del proveedor (928 contando los destacados):
  - Rottweiler: 848, asociadas por código EVOL* y revisadas a ojo.
  - Candela: 32, por COD. SIGMA.
  - INDELPLAS: 24 y BRITEX: 18, por descripción.
- **79 dudosas para revisar en `FOTOS.md`.** Son WebP de 600×600 con fondo blanco en `assets/img/productos/<codigo>.webp`, cargadas en `lib_productos.foto_url` y en el 5.º campo del catálogo base.
- Se descartaron 11 asociaciones malas de Rottweiler (barras de extensión, escuadras magnéticas, cortadora de cerámica, barras de silicona y pico).
- Respaldo: sin foto, `U.foto()` muestra la imagen 3D del rubro.
- **Falta:** generar las 40 subcategorías de `IMAGENES.md` §9 y programar el segundo nivel (palabra clave → `sub-<id>.webp`).
- Los fichas, portalámparas y tanzas de INDELPLAS no tienen foto: el PDF comprimido trae imágenes de unos 80 px.
- Scripts y mapeo: `WEB/fotos-catalogo/` (fuera del repo, ver `LEEME.txt`).

## 3. Supabase: HECHO (16/10)

- Libertad vive en el proyecto compartido **CLIENTES** (`gbdqxpatunbgegywtlkd`, organización DATABASE 01, el mismo de TV Luz). Sin costo extra.
  - Tablas `lib_productos`, `lib_ajustes`, `lib_pedidos`, bucket `lib-fotos` y función `lib_es_admin()`.
  - El acceso al tablero se da por sitio en `panel_accesos` (sitio = `libertad`). Hoy hay 2 usuarios.
- `config.js` apunta al proyecto con la clave publicable.
- La lista de octubre está cargada: 6.515 artículos activos y 928 con foto.
  - 59 artículos que ya no están en la lista quedaron ocultos (`activo = false`), no borrados.
  - Ya estaban ocultos de antes, y siguen así: `SO103316`, `SO103305`, `SO103306` y `EVOL3350`.
- Ajustes en la base: lista "Octubre 2026", nota de precios sin IVA y título de portada.
- Se trajo de la rama `claude/project-thread-ov1nfl` la revisión de seguridad del tablero (escapado de pedidos, rechazo de usuarios sin permiso, topes en el pedido) y el teléfono fijo nuevo 2657-798948.
- **Alta de un usuario del cliente:**
  1. Supabase > proyecto CLIENTES > Authentication > Users > Add user (email y contraseña, marcar "Auto confirm").
  2. En el SQL Editor: `insert into public.panel_accesos (user_id, sitio) select id, 'libertad' from auth.users where email = 'EMAIL';`
  3. Entra en `/tablero`.

## 4. Deploy

- Proyecto Netlify ya creado: `distribuidora-libertad` (https://distribuidora-libertad.netlify.app). Se sube arrastrando el zip de esta carpeta en Deploys, o con `netlify deploy --prod --dir distribuidora-libertad` desde local.

## Ramas

- La rama `claude/project-thread-ov1nfl` es una línea paralela que publica en `distribuidora-libertad-v1`, un proyecto que no se toca. De ahí se trajeron solo el cableado de Supabase, la revisión de seguridad y el teléfono.
- No se trajeron `assets/data/fotos.js`, que tenía 82 recortes y quedó superado por las fotos nuevas, ni el dominio `-v1` en canonical y sitemap.

## Datos a confirmar con el cliente

- WhatsApp de pedidos (2657 55-7780), horario de atención, zonas reales de entrega, formas de pago y compra mínima (para sumar a las FAQ).
- Qué significa la columna Bonificación (0,15 y −0,0865) y si se muestra en la web.
