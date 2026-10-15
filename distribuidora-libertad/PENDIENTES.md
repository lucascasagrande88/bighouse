# Pendientes · Distribuidora Libertad (traspaso a sesión local)

Estado al 15/10/2026. Web, catálogo, tablero, links, FAQ, animaciones e imágenes están terminados y en la rama `claude/hopeful-clarke-sq4eqx`. El zip para Netlify se genera desde esta carpeta (`index.html` en la raíz).

## 1. Lista de precios de octubre: HECHO

- `assets/data/catalogo-base.js` está regenerado con `Octubre-26-Distri-Libertad.xls` (en `MATERIAL/` de la carpeta del cliente). Tiene 6.519 artículos: 4.582 con precio y 1.937 en "Consultar".
- **Precio:** la web muestra el **Precio Venta, sin IVA** (decisión del 15/10). Está aclarado en `nota_precios`, en la FAQ (HTML y JSON-LD), en el total del pedido y en el mensaje de WhatsApp.
- **Códigos:** se conservan tal como vienen en la lista. El cambio de prefijo es parcial: 3.866 artículos siguen con `HUS-` y otros lo perdieron (`HUS-W3100` → `W3100`). Los rubros se heredaron comparando códigos sin el prefijo. Los 14 destacados no cambiaron de código.
- **Altas y bajas:** hay 51 artículos nuevos, clasificados por las dos primeras palabras del nombre según el catálogo viejo, con 7 ajustes manuales. 59 del catálogo viejo ya no están. Se excluyó el ítem `11 · AJUSTE DE CUENTA`, que no es un producto.
- **Tablero:** la importación de listas compara códigos ignorando mayúsculas y el prefijo `HUS-` (`claveArt()` en `tablero.js`).
- **Bonificación:** no se muestra. La columna tiene 450 valores, no 10: los `P57x` con 0,15 y muchos con −0,0865 (por ejemplo `RIEG*` y `EVOL*`). Hay que consultar al cliente qué significan antes de mostrarla.
- El script que generó el catálogo no está en el repo. Para la próxima lista alcanza con usar la importación del tablero (cuando haya Supabase) o pedirle a Claude que lo regenere igual.

## 2. Fotos de productos

- Objetivo: que todo artículo que pueda tener foto la tenga, y el resto muestre al menos una foto de su categoría.
- **Catálogo Rottweiler:** las 14 fotos de destacados del sitio original salieron de ahí, pero el PDF o las imágenes nunca llegaron a esta sesión. **El PDF `MATERIAL/ROTTWEILER_ 2025 Devia.pdf` en local pesa 0 bytes: falta conseguir una copia buena.** Con el catálogo en la carpeta del cliente hay que:
  - Extraer las imágenes (por ejemplo, `pdfimages` o PyMuPDF).
  - Asociarlas a los códigos de la lista: el catálogo suele mostrar código y descripción junto a cada foto.
  - Optimizarlas a WebP de 600 px con fondo blanco y guardarlas en `assets/img/productos/<codigo>.webp`.
  - Cargarlas en `foto_url`, o en el campo `foto` del catálogo base mientras no haya Supabase.
- **Respaldo por categoría:** para los artículos sin foto, usar una imagen de su rubro o subcategoría en lugar del ícono de línea.
  - Ya existen los 13 íconos 3D de rubro en `assets/img/rubros/rubro-<id>.webp`, que sirven como primer nivel.
  - Segundo nivel, más fino: subcategorías por palabra clave del nombre (disco, mecha, canilla, candado, cable, etc.) con imágenes generadas en el mismo estilo 3D.
  - Código a tocar: `U.foto()` en `assets/js/comun.js` y las filas del catálogo en `assets/js/catalogo.js`.
- Desde el entorno cloud no había salida a internet (Google, Wikimedia y Mercado Libre bloqueados), por eso no se pudieron buscar fotos públicas. En local sí se puede. Cuidado con los derechos: preferir el catálogo del proveedor o imágenes generadas.

## 3. Supabase (sigue pendiente)

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
