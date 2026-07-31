# Arquitectura

## Los dos principios

> **La IA dirige. El motor de animación ejecuta.**

El modelo nunca devuelve HTML ni CSS. Devuelve un `scenes.json` validado contra
un JSON Schema estricto: qué componente usar y cómo configurarlo. El motor tiene
8 componentes programados a mano. Un reel que se ve mal se arregla tocando un
componente, no rezando para que el modelo escriba mejor CSS.

> **El preview y el export salen del mismo código.**

`window.__seek(t)` dibuja el estado exacto del segundo `t`, sin animaciones CSS y
sin estado acumulado. El editor lo llama desde un `requestAnimationFrame`; el
worker llama `seek(n/fps)` y saca una captura. Lo que se ve en el editor es lo
que sale en el MP4, y eso está verificado (`worker/scripts/verify-stage.mjs`
comprueba que llegar al mismo instante por caminos distintos da el mismo píxel).

## Las tres piezas y por qué son tres

```
┌─────────────────────────────┐
│  NETLIFY · estático + edge  │   login, dashboard, editor, preview
│  chimichurridiseno.com      │   (todo lo que ve el usuario)
└──────────────┬──────────────┘
               │
┌──────────────▼──────────────┐
│  NETLIFY FUNCTIONS          │   auth, proyectos, y las 4 llamadas a OpenAI.
│  /api/*                     │   Acá vive la API key. Nunca sale.
└──────────────┬──────────────┘
               │  emite un ticket HMAC (20 min, atado a usuario+proyecto+acción)
               │
┌──────────────▼──────────────┐
│  WORKER · Docker            │   ffmpeg, transcripción, Chromium, codificación.
│  worker/                    │   El navegador le habla DIRECTO con el ticket.
└─────────────────────────────┘
```

**Por qué el worker está separado.** Netlify no tiene ffmpeg, sus funciones se
cortan por timeout, y un reel de 30 s a 30 fps son 900 capturas de pantalla de
1080×1920. Medido: ~110 ms por frame, o sea unos 1,6 minutos por pasada de
render — y el overlay con alfa es una segunda pasada. Eso no entra en ninguna
función serverless.

**Por qué el navegador sube directo al worker y no a través de Netlify.** Un mp4
de 60 MB no pasa por el body de una función. Netlify decide *quién* puede
hacerlo y emite un ticket firmado; el worker sólo verifica la firma. El worker no
tiene usuarios ni contraseñas.

## Seguridad

| Qué | Cómo |
| --- | --- |
| Contraseñas | scrypt con salt por usuario, en `FACTORY_USERS`. Nunca en el repo ni en el JS del cliente. |
| Sesión | Cookie HttpOnly + Secure + SameSite=Lax, payload firmado con HMAC-SHA256, 12 h. |
| El shell de la Factory | Edge function `gate.js`: sin sesión válida no se sirve ni el HTML. |
| Los datos | Cada función llama `requireSession()` por su cuenta. El gate no es la única defensa. |
| API key de OpenAI | Sólo en el entorno del servidor. El frontend no la ve ni en un header. |
| Tickets del worker | HMAC con `WORKER_SECRET`, distinto de `SESSION_SECRET`. Atados a usuario, proyecto y acción; vencen en 20 min. Una cookie de sesión **no** sirve como ticket (se verifica el `scope`). |
| Aislamiento entre usuarios | Los proyectos van namespaceados por email en Netlify Blobs. |
| Fuerza bruta | 8 intentos por IP+email cada 15 minutos. El mensaje de error es idéntico exista o no el usuario. |
| Redirect abierto | El `?next=` del login sólo acepta rutas que empiezan con `/content-factory/`. |

`shared/session.mjs` usa **sólo Web Crypto**, así que el mismo archivo corre en
las funciones (Node) y en el edge (Deno) sin bifurcarse. Está probado en ambos
sentidos: firma en Node, verifica en el worker.

## El flujo, capa por capa

### 1 · Ingesta (worker)

Un `.mp4` entra. Sale:

- duración, resolución, fps, codecs (`ffprobe`)
- audio extraído a mp3 mono 16 kHz
- transcripción con timestamps **por palabra y por segmento** (`whisper-1`)
- ritmo medido: palabras/minuto reales, pausas, pausa más larga
- cortes visuales (`select='gt(scene,0.4)'`)
- silencios (`silencedetect`)
- 8 fotogramas repartidos, como data URL
- el video normalizado a 1080×1920 para usarlo como capa base

**Por qué whisper-1 y no un modelo más nuevo:** es el que devuelve
`verbose_json` con timestamps por palabra, que es exactamente lo que necesita el
análisis de ritmo. Un texto corrido sin tiempos no sirve para medir pausas.
Configurable por `OPENAI_TRANSCRIBE_MODEL`.

**Por qué fotogramas y no "mandarle el video a una IA":** no hay ningún modelo
que lea un mp4 y entienda el encuadre. Lo que funciona es transcripción con
tiempos + imágenes concretas a un modelo multimodal.

### 2 · Análisis (función)

Cruza transcripción, tiempos y fotogramas, y devuelve las cinco capas: mensaje,
estructura, timing, lenguaje visual, audio. Los números medidos por ffmpeg
**sobreescriben** los que estime el modelo: están medidos.

### 3 · Adaptación (función)

Tres niveles: idea original → aplicación a la marca → guion nuevo. Y un control
que el modelo no puede hacer solo: se mide la duración estimada del guion y si
no entra en el objetivo (±15%) se le pide reescribir con una instrucción
concreta —"sacá 34 palabras"— **una sola vez**. Si el segundo intento tampoco
entra, se devuelve igual con el aviso visible. Mejor un guion largo y avisado que
un guion mutilado.

### 4 · Dirección (función)

El guion entra, el storyboard sale. Dos cosas no se delegan al modelo:

- **Los tiempos.** El modelo decide *dónde* cortar; `reflowScenes` reparte la
  duración según el peso de locución de cada corte. Pedirle `start`/`end` a un
  modelo da timelines que no cierran.
- **Los topes.** El schema estricto garantiza la forma pero no las cantidades:
  nada le impide devolver 14 escenas o una lista de 9 ítems. `buildProject`
  recorta y devuelve las correcciones como avisos visibles en el editor.

### 5 · Edición (navegador)

Tres paneles y una timeline de 5 pistas. El preview es un `<iframe>` con
`/engine/stage.html` — el mismo motor del render. Autoguardado a los 900 ms.

### 6 · Export (worker)

| Salida | Para qué |
| --- | --- |
| MP4 H.264 1080×1920 | El reel terminado, con la mezcla de audio. |
| Secuencia PNG con alfa (zip) | **La salida segura para After Effects.** |
| WebM VP9 con alfa | El overlay liviano. |
| ProRes 4444 | Mejor calidad, archivos enormes. Detrás de una bandera. |
| `scenes.json` + `guion.txt` | Para reconstruir o rehacer. |

En modo alfa el stage no dibuja fondos ni el video base: sólo tipografía, íconos
y gráficos. La transparencia sale de `omitBackground` de Playwright, y **hace
falta limpiar el fondo del elemento `<html>`, no sólo del `<body>`** — si no, el
PNG sale negro opaco aunque todo lo demás esté bien. Está verificado leyendo el
canal alfa de los píxeles, no mirando el archivo (un visor compone la
transparencia sobre negro y no prueba nada).

## Los 8 componentes maestros

| Componente | Cuándo lo elige el director |
| --- | --- |
| `kinetic_hook` | Abre el reel |
| `camera_words` | La persona habla y alcanza. Es el descanso. |
| `impact_word` | Golpea con una idea corta |
| `animated_list` | El guion enumera |
| `comparison` | El guion compara |
| `stat_number` | El guion menciona una cifra |
| `concept_image` | El guion describe una situación |
| `cta_end` | Cierra y pide la acción |

Hay 16 alias narrativos (`before_after` → `comparison`, `punchline` → `cta_end`,
etc.) para que el modelo pueda hablar en términos de narrativa y el motor siga
ejecutando componentes probados.

## Verificación

```bash
npm run check          # 24 chequeos: schemas, tiempos, saneado. Sin API ni navegador.
cd worker && npm run verify   # 14 chequeos: determinismo, transparencia, velocidad.
```

`npm run check` audita que los schemas sean **compatibles con el modo estricto de
OpenAI** (todo objeto con `additionalProperties: false`, todas las propiedades en
`required`, ninguna palabra clave no soportada). Es el error más fácil de cometer
editando un schema y el más molesto de diagnosticar, porque la API lo rechaza
recién en la primera llamada real.

## Lo que no está verificado en este repositorio

La codificación con ffmpeg —H.264, VP9 con alfa, ProRes, la mezcla de audio— no
se pudo ejecutar acá: el ffmpeg disponible en el entorno de desarrollo es una
build recortada sin demuxer `image2` ni decoder PNG, o sea que no puede ni leer
una secuencia de PNG. Los comandos están escritos y revisados, y `zipFrames`
(que sólo necesita `zip`) sí se probó de verdad. **La primera corrida del worker
con ffmpeg completo es la que valida esa parte.**
