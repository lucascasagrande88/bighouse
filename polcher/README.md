# Pölcher — Sitio web

Landing de una sola página para **Pölcher**, beer bar de Quilmes.
Hecho con HTML + CSS + JS vanilla y animaciones con GSAP (mejora progresiva).
Sin build, sin dependencias que instalar: se sube tal cual (estático).

## Estructura

```
polcher/
├── index.html            ← la página completa
├── assets/
│   ├── css/style.css     ← estilos (paleta y tipografía del Brand OS)
│   ├── js/app.js         ← titular rotativo, tabs de carta, FAQ, animaciones
│   └── img/              ← fotos (WebP optimizado), logos y OG
└── README.md
```

## Cómo verlo localmente

Cualquier servidor estático sirve. Por ejemplo:

```bash
cd polcher
python3 -m http.server 8000
# abrí http://localhost:8000
```

## Qué tenés que reemplazar (placeholders)

Según el **Brand OS de Pölcher**, la marca no publica datos inventados. Dejé lugares
listos para que completes con la info real. Buscá el emoji ⚠️ en el código:

| Dónde | Qué cambiar |
|---|---|
| `index.html` (varios) y `app.js` | **Usuario de Instagram** real (hoy `instagram.com/polcher`) |
| Sección contacto en `index.html` | **Número de WhatsApp** real (`wa.me/549XXXXXXXXXX`) |
| `<head>` de `index.html` | **Dominio** real (canonical + Open Graph) |
| `app.js` → objeto `MENU` | **Carta real**: nombres, descripciones y (si querés) precios de burgers y birras |
| `app.js` → objeto `FAQ` **y** el `FAQPage` JSON-LD del `<head>` | Respuestas de dirección, días y horarios cuando estén confirmados. *Mantené ambos iguales para que el SEO coincida.* |

> La carta que viene cargada es **de ejemplo** (estilos genéricos, sin precios ni IBU),
> pensada para que la reemplaces por la real.

## Secciones

1. **Inicio / Hero** — titular que rota al azar en cada visita (frases del copy aprobado) + CTA a Instagram.
2. **Nosotros** — manifiesto y rasgos de marca.
3. **Carta** — pestañas Burgers / Birras.
4. **Preguntas** — acordeón con datos estructurados `FAQPage` (mejor indexación en Google).
5. **Contacto** — Instagram, WhatsApp y ubicación.
6. **Footer** — legal (venta responsable de alcohol) y navegación.

## Detalles técnicos

- **Responsive** real mobile / desktop, con menú hamburguesa a pantalla completa.
- **Accesibilidad**: `skip link`, foco visible, `aria-*`, y respeto de `prefers-reduced-motion`.
- **Performance**: imágenes en WebP, `preload` del hero, JS diferido.
- **SEO**: `title`/`description`, canonical, Open Graph + Twitter Card, JSON-LD `BarOrPub` + `FAQPage`.
- **GSAP** aporta el parallax; si el CDN no carga, la página funciona igual (las revelaciones usan `IntersectionObserver`).

_Diseño y desarrollo: Chimichurri Diseño._
