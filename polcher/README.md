# Pölcher — Web + App de pedidos

Dos productos para **Pölcher**, beer bar de Quilmes, que comparten identidad y datos:

1. **La web** (`index.html`) — landing con hero, carta, cultura cervecera, FAQ y contacto.
2. **La app de pedidos** (`pedidos/`) — el cliente arma su pedido y lo cierra por **WhatsApp**.

Todo es estático (HTML + CSS + JS, sin build). Se sube tal cual a Netlify o cualquier hosting.

## Estructura

```
polcher/
├── index.html              ← la web
├── pedidos/
│   ├── index.html          ← la app de pedidos
│   ├── pedidos.css
│   └── pedidos.js          ← carrito + armado del mensaje de WhatsApp
├── assets/
│   ├── css/fonts.css       ← fuentes (compartidas)
│   ├── css/style.css       ← estilos de la web
│   ├── js/menu-data.js     ← ⭐ LA CARTA (fuente única: la usan la web y la app)
│   ├── js/app.js           ← lógica de la web
│   ├── fonts/              ← Bebas Neue + Montserrat (auto-hospedadas)
│   ├── img/                ← fotos, logos, OG
│   │   └── menu/           ← (creá esta carpeta) fotos de cada producto
│   └── video/              ← (creá esta carpeta) video de fondo del hero
└── README.md
```

## Verlo local

```bash
cd polcher
python3 -m http.server 8000
# web:      http://localhost:8000
# pedidos:  http://localhost:8000/pedidos/
```

## ⭐ Editar la carta (un solo lugar)

Todo lo de la carta vive en **`assets/js/menu-data.js`**. Ahí cambiás nombres,
descripciones, **precios**, y de cada birra: estilo, **IBU**, **amargor**, cuerpo,
graduación y maridaje. La web y la app se actualizan solas.

- `price`: número en pesos (los actuales son **de ejemplo**, cambialos).
- `img`: ruta a la foto (ej. `"assets/img/menu/la-doble.webp"`) o `null` para el
  placeholder de marca. Poné las fotos en `assets/img/menu/`.

## Otros placeholders a completar (buscá ⚠️ en el código)

| Dónde | Qué cambiar |
|---|---|
| `pedidos/pedidos.js` (constante `WHATSAPP`) | **Número de WhatsApp** del local (formato `5491155554444`) |
| `index.html` (Instagram) | **Usuario real de Instagram** |
| `index.html` (`<head>`) | **Dominio** real (canonical + Open Graph) |
| FAQ en `app.js` + JSON-LD del `<head>` | Dirección, días y horarios cuando estén confirmados |

## Video de fondo del hero

Cuando tengas el video, ponelo en `assets/video/` (ideal: `.mp4` H.264 **y** `.webm`,
mudo, en loop, liviano) y **descomentá** el bloque `<video>` en `index.html` (está
señalado). Mientras no exista, se ve la foto (que es el *poster*).

## Detalles

- **Responsive** web + app, menú mobile a pantalla completa, carrito como bottom-sheet.
- **SEO**: Open Graph, Twitter Card, JSON-LD `BarOrPub` + `FAQPage`. La app va `noindex`.
- **Fuentes auto-hospedadas** (sin depender de Google Fonts en runtime).
- **GSAP** aporta el parallax del hero; si el CDN no carga, la web funciona igual.

> Según el Brand OS de Pölcher no se inventan precios, IBU ni variedades: los datos
> cargados son de ejemplo, reemplazalos por los reales antes de publicar.

_Diseño y desarrollo: Chimichurri Diseño._
