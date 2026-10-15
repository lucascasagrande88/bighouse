# Pendientes · Distribuidora Libertad (traspaso a sesión local)

Estado al 15/10/2026. Web, catálogo, tablero, links, FAQ, animaciones e imágenes están terminados y en la rama `claude/hopeful-clarke-sq4eqx`. El zip para Netlify se genera desde esta carpeta (`index.html` en la raíz).

## 1. Lista de precios nueva: `Octubre-26-Distri-Libertad.xls`

- Hoja `excel-sheet`. Encabezado en la fila 5: `Ítem | Descripción | Precio Venta | Precio c/IVA | Bonificación`.
- 6.520 artículos: 4.582 con precio y 1.938 en 0, que se muestran como "Consultar". Hay 10 con bonificación (0.15 = 15%).
- **Ojo con los códigos:** la lista nueva viene sin el prefijo `HUS-` que tenía la lista anterior (antes `HUS-W3100`, ahora `W3100`). Normalizando el prefijo:
  - 6.468 coinciden con el catálogo actual.
  - 52 son nuevos.
  - 59 del catálogo viejo ya no están en la lista.
- **A definir con el cliente:** ¿la web muestra el "Precio Venta" (sin IVA) o el "Precio c/IVA"? Hoy muestra el precio de lista sin aclarar el IVA. Lo ideal es mostrar uno y aclararlo en la nota de precios. ¿Se muestra la bonificación?
- Tareas:
  - Regenerar `assets/data/catalogo-base.js` con la lista nueva: códigos sin `HUS-` y rubros heredados del catálogo viejo por código. Clasificar los 52 nuevos por palabras clave.
  - Actualizar los destacados en `assets/js/config.js` (`LIB_DESTACADOS_BASE`) a los códigos nuevos.
  - Cambiar `lista_nombre` a "Octubre 2026".
  - En el tablero (`assets/js/tablero.js`, importación de precios), comparar códigos ignorando el prefijo `HUS-` para que futuras listas matcheen solas.

## 2. Fotos de productos

- Objetivo: que todo artículo que pueda tener foto la tenga, y el resto muestre al menos una foto de su categoría.
- **Catálogo Rottweiler:** las 14 fotos de destacados del sitio original salieron de ahí, pero el PDF o las imágenes nunca llegaron a esta sesión. Con el catálogo en la carpeta del cliente hay que:
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
- Precio con o sin IVA en la web.
