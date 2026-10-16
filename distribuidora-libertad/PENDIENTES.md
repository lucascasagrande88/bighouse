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

## 2. Fotos de productos: EN CURSO (16/10)

- **Hecho:** 74 artículos con foto del catálogo del proveedor: Candela 32 (asociadas por COD. SIGMA = código `C*` de la lista), BRITEX 18 e INDELPLAS 24 (por descripción). Hay 22 dudosas para revisar, listadas en `FOTOS.md`. Son WebP de 600×600 con fondo blanco en `assets/img/productos/<codigo>.webp` y están cargadas como 5.º campo (`foto`) del catálogo base. `db.js` (`fromBase`) lo lee; la foto del destacado tiene prioridad.
- Contando los 13 destacados, hoy hay 87 artículos con foto.
- **Respaldo por rubro: HECHO.** Sin foto, `U.foto()` (`comun.js`) muestra `assets/img/rubros/rubro-<id>.webp` (clase `img-rubro`, al 70 %) en tarjetas, filas y ficha. El filtro "con foto" sigue contando solo fotos reales.
- **Falta: catálogo Rottweiler.** Está en Drive ("DISTRIBUIDORA LIBERTAD Interno", 51 MB), pero no está sincronizado en `G:` y es demasiado grande para el conector. Hay que bajarlo a `MATERIAL/`. Cubre los códigos `EVOL*`/`EVO*` (unos 900 artículos), así que es la fuente más grande.
- INDELPLAS (fichas, portalámparas, cintas pasacable, tanzas) viene en el PDF comprimido con fotos de unos 80 px, que no sirven. Si el cliente consigue el catálogo sin comprimir, se suman.
- Scripts y mapeo: `WEB/fotos-catalogo/` (fuera del repo, ver `LEEME.txt`).
- **Subcategorías:** propuesta de 40 en `IMAGENES.md` §9 (cubren el 69 % del catálogo), para generarlas con ChatGPT. Falta el código del segundo nivel (palabra clave → `sub-<id>.webp`) cuando estén las imágenes.

## 3. Supabase (sigue pendiente)

- 16/10: el conector de Supabase solo ve la organización "DATABASE 01" (Pro; proyectos CEMENTERA, CHIMI_BRAIN y CLIENTES), no TV-LUZ. Un proyecto nuevo ahí cuesta USD 10 por mes. Falta decidir la organización.
- La creación del proyecto por API dio timeout 4 veces. Crear `DISTRIBUIDORA-LIBERTAD` (São Paulo) en la organización de TV-LUZ y después:
  - Correr `SUPABASE-SETUP.sql`.
  - Cargar el catálogo (ya con la lista de octubre y las fotos).
  - Crear el usuario del cliente.
  - Completar `assets/js/config.js` (`LIB_SUPABASE.url` / `key`).

## 4. Deploy

- Proyecto Netlify ya creado: `distribuidora-libertad` (https://distribuidora-libertad.netlify.app). Se sube arrastrando el zip de esta carpeta en Deploys, o con `netlify deploy --prod --dir distribuidora-libertad` desde local.

## Datos a confirmar con el cliente

- WhatsApp de pedidos (2657 55-7780), horario de atención, zonas reales de entrega, formas de pago y compra mínima (para sumar a las FAQ).
- Qué significa la columna Bonificación (0,15 y −0,0865) y si se muestra en la web.
