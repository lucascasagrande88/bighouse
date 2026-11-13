# Video de bienvenida — Chimichurri

Video de bienvenida a clientes, hecho con [Remotion](https://remotion.dev) (video generado con React).
Formato **9:16 — 1080×1920 @ 30fps**, ~24 s, pensado para enviar por WhatsApp / Stories.

El resultado renderizado está en **`out/bienvenida.mp4`**.

## Guion (5 escenas)

1. **Hero** — logo + "Te damos la bienvenida."
2. **Posicionamiento** — "No importa si tu negocio es bueno. Si se ve mal, perdés ventas."
3. **Servicios** — identidad & redes · físico & imprenta · experiencias
4. **Portal cliente** — "Todo en un solo lugar" + chips de entregas/aprobaciones
5. **CTA** — "¿Arrancamos tu proyecto?" + botón WhatsApp + firma

## Sistema visual

Tomado de `assets/css/style.css` del hub:
- Fondo `#080808`, acento lima `#D4FF00`, WhatsApp `#25D366`
- Tipografías **Syne** (titulares) + **Inter** (texto), locales en `public/fonts/`
- Motivo recurrente: el punto lima del logo

## Editar y re-renderizar

```bash
npm install
```

Previsualizar en el navegador (studio interactivo):

```bash
npx remotion studio
```

Re-renderizar el MP4 (en este entorno hay un Chromium preinstalado; por eso
se le pasa `--browser-executable`):

```bash
npx remotion render Bienvenida out/bienvenida.mp4 \
  --browser-executable=/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell
```

En una máquina normal (fuera de este entorno) alcanza con:

```bash
npx remotion render Bienvenida out/bienvenida.mp4
```

El texto de cada escena vive en `src/scenes/`. Los colores y fuentes, en `src/brand.ts`.
Para cambiar el número de WhatsApp o el copy, editá `src/scenes/Scene05CTA.tsx`.
