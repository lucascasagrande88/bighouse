# GARZEZ — Tienda online

Tienda de ropa estática (HTML + CSS + JS, sin build ni dependencias) para la marca
venezolana de streetwear **Garzez** ([@_garzez_](https://www.instagram.com/_garzez_/)).
Se sirve tal cual desde Netlify junto al resto del sitio.

## Estructura

```
garzez/
├── index.html              Home: hero, destacados, editorial, drop, lookbook, newsletter
├── tienda/                 Catálogo con filtros (categoría, colección, talle, precio, stock) y orden
├── producto/               Detalle: ?p=slug&c=color — galería, talles, stock, acordeones
├── carrito/                Carrito completo, cupones y checkout
├── lookbook/               Campaña Drop 04
├── marca/                  Historia de la marca, línea de tiempo y prensa
├── ayuda/                  Envíos, cambios, guía de talles, cuidado y FAQ
├── assets/
│   ├── css/garzez.css      Sistema de diseño completo
│   ├── js/productos.js     ← CATÁLOGO (fuente única de verdad)
│   ├── js/tienda.js        Motor: carrito, grilla, filtros, PDP, checkout
│   └── img/                Imágenes generadas (provisorias)
└── tools/generar-imagenes.js   Genera los SVG de producto a partir del catálogo
```

## Cómo se opera

### Cargar o editar un producto

Todo vive en `assets/js/productos.js`. Copiá un objeto existente y cambiá
`slug`, `sku`, `nombre`, `precio`, `colores` y `stock`. El stock se define por
color y por talle, y es el que gobierna la tienda: si un talle queda en `0`, el
botón se deshabilita solo, aparece la etiqueta *Agotado* y el carrito no deja
pasarse del disponible.

Después de tocar el catálogo, regenerá las imágenes provisorias:

```bash
node garzez/tools/generar-imagenes.js
```

### Reemplazar las imágenes por fotos reales

Las imágenes actuales son SVG generados: sirven para que la tienda se vea armada
antes de tener producción de fotos. Para pasar a fotos reales, guardá los
archivos en `assets/img/productos/` respetando el nombre
`{slug}-{color}-{frente|espalda}.svg` (o cambiá la extensión en la función
`imagen()` de `tienda.js` si vas a usar `.jpg` / `.webp`). Proporción 4:5.
Lo mismo para `assets/img/editorial/` con las fotos de campaña.

### Configuración

En `assets/js/productos.js`, arriba de todo, está `window.GARZEZ_CONFIG`:

| Campo | Qué hace |
|---|---|
| `whatsapp` | Número al que llega el pedido. **Hoy es un placeholder (`5491100000000`)** |
| `envioGratisDesde` | Umbral de envío gratis |
| `costoEnvio` | Costo de envío por debajo del umbral |
| `cupones` | Códigos válidos (`TUKI10`, `DROP04`, `PANA`) |

El número de WhatsApp también aparece en el HTML de cada página (botón flotante y
footer): buscá y reemplazá `5491100000000` en todo el directorio.

## Checkout

El cierre de compra es por WhatsApp: el carrito arma el mensaje con las piezas,
talles, cantidades, subtotal, cupón, envío y total, y abre el chat con todo
cargado. Es el flujo que ya usa la marca para vender por Instagram y no necesita
backend ni pasarela.

Si más adelante se quiere cobro online (Stripe, Mercado Pago, Shopify Lite), el
punto de enganche es la función `enlaceWhatsApp()` en `assets/js/tienda.js`: ahí
se tiene el carrito completo listo para mandar a una pasarela.

## Detalles técnicos

- Carrito persistido en `localStorage` (`garzez_carrito_v1`), validado contra el
  stock del catálogo en cada operación.
- Los filtros de la tienda se reflejan en la URL (`?cat=`, `?col=`, `?orden=`),
  así se pueden compartir y linkear desde el home y el footer.
- Sin dependencias externas más allá de Google Fonts.
- Probado en desktop y mobile: sin scroll horizontal, menú y filtros colapsables.

## Pendiente antes de salir a producción

- [ ] Número de WhatsApp real de la marca
- [ ] Fotos de producto y de campaña reales
- [ ] Confirmar precios, costos de envío y política de cambios con la marca
- [ ] Conectar el formulario de newsletter a un proveedor (hoy solo confirma en pantalla)
- [ ] Definir dominio y cargar los datos fiscales en el footer
