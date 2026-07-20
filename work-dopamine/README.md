# Chimichurri — Funnel de vidrieras digitales

Landing estática para Netlify. Concepto central: **Chimichurri crea vidrieras
digitales**, sistemas de diseño para que un negocio se vea, se entienda y se
elija. Dirección visual intensa (masas de color, luz, ritmo, parallax y
microinteracciones), premium y con energía, sin estéticas baratas ni de baja calidad.
Respeta `prefers-reduced-motion` sin dejar la experiencia normal estática.

## Estructura del funnel

1. **Hero** — slogan "Sistemas de diseño para vender más", titular dinámico de
   vidrieras digitales, prueba social arriba (+50 comercios) y video Loom
   opcional configurable en `config.js`.
2. **Tiras móviles** — dos marquees reales: servicios y "que te vean · que te
   entiendan · que te elijan".
3. **Vidriera digital** — antes/después activado por scroll.
4. **Sistema Chimi** — Estrategia · Sistema · Campañas.
5. **Diagnóstico** — quiz de 5 preguntas, resultado adaptativo, dato cómico,
   captura de lead y plan profesional en `gracias.html`.
6. **Lo que empieza a pasar** — beneficios concretos.
7. **Cierre** — CTA al diagnóstico.

## Packs de copy

5 packs coherentes (`script.js` → `copyPacks`). En cada carga se elige uno al
azar; se puede forzar con `?copy_seed=0` … `?copy_seed=4`. El pack se registra
en `dataLayer`, GA4/Meta y en el lead de Netlify (`copy_seed`, `copy_pack`).

## Antes de publicar

- `config.js`: pegá el embed de Loom si ya está listo.
- `config.js`: confirmá `whatsappNumber` y, si aplica, `bookingUrl`.
- `config.js`: cargá `metaPixelId` y `ga4MeasurementId` si vas a pautar.
- Subí la carpeta o el ZIP a Netlify Drop. `index.html` va en la raíz.

## Formulario / Netlify Forms

El formulario `chimi-dopamine-leads` (`data-netlify="true"`) guarda: nombre,
negocio, WhatsApp, email, Instagram/web, `copy_seed`, `copy_pack`, puntaje,
perfil, resultado, las 5 respuestas del quiz, UTMs y referrer.

## Assets antes/después

La sección de vidriera usa una maqueta CSS premium lista para reemplazar por
styleframes reales: en `index.html`, dentro de `.vitrine-mock-before` y
`.vitrine-mock-after`, reemplazá el contenido por `<img>` manteniendo las
clases. No se usan imágenes AI genéricas.
