# Worker de ingesta y render

Hace las tres cosas que Netlify no puede hacer: desarmar un `.mp4` con ffmpeg,
transcribir con tiempos, y renderizar cientos de frames con Chromium.

El worker **no tiene usuarios ni contraseñas**. Valida tickets HMAC que emite
`/api/worker/ticket` en Netlify. Los dos lados comparten `WORKER_SECRET`.

## Build y deploy

El `Dockerfile` espera el contexto de build en la **raíz del repositorio**, no
en `worker/`, porque copia también `engine/`, `shared/` y `assets/`:

```bash
docker build -f worker/Dockerfile -t chimi-worker .
docker run -p 8080:8080 --env-file worker/.env -v chimi-work:/data/work chimi-worker
```

En Railway / Render / Fly: apuntá el Dockerfile a `worker/Dockerfile` y el
contexto a la raíz. Necesita un volumen persistente en `/data/work` y bastante
CPU: el render es CPU-bound de punta a punta.

## Variables de entorno

| Variable | Obligatoria | Para qué |
| --- | --- | --- |
| `WORKER_SECRET` | sí | Verifica los tickets. Igual al de Netlify. |
| `OPENAI_API_KEY` | sí | Transcripción y generación de imágenes. |
| `ALLOWED_ORIGIN` | sí | `https://chimichurridiseno.com`. Sin esto queda `*`. |
| `PUBLIC_URL` | recomendada | URL pública del worker, para armar los links de descarga. |
| `WORK_DIR` | no | Área de trabajo. Default `./work` (en Docker `/data/work`). |
| `WORK_TTL_HOURS` | no | Cuánto viven los archivos de trabajo. Default 48. |
| `MAX_UPLOAD_MB` | no | Default 220. |
| `OPENAI_TRANSCRIBE_MODEL` | no | Default `whisper-1`. |
| `OPENAI_IMAGE_MODEL` | no | Default `gpt-image-1`. |
| `STAGE_URL` | no | Default `http://127.0.0.1:$PORT/engine/stage.html`. |
| `FFMPEG_PATH` / `FFPROBE_PATH` | no | Si no están en el `PATH`. |

## Endpoints

Todos menos `/health` piden `Authorization: Bearer <ticket>`.

| Método | Ruta | Qué hace |
| --- | --- | --- |
| GET | `/health` | Estado y si tiene las claves cargadas. |
| POST | `/ingest` | multipart `file` + `project_id` + `kind`. Devuelve el desarmado completo. |
| POST | `/asset` | multipart `file` + `slot`. Sube imagen, voz o música. |
| POST | `/image` | `{prompt, project_id, scene_id}`. Genera y guarda la imagen. |
| POST | `/render` | `{project, outputs[], fps}`. Responde 202 con `job_id`. |
| GET | `/status/:id` | Progreso del job. |

### Salidas de `/render`

`outputs` acepta:

- `mp4` — reel completo, H.264, 1080×1920, con la mezcla de audio.
- `alpha_png` — secuencia PNG con alfa, comprimida. **La salida segura para
  After Effects.** Menos elegante, mucho más confiable que cualquier otra.
- `alpha_webm` — VP9 con alfa. Liviano.
- `prores` — ProRes 4444 con alfa. Mejor calidad, archivos enormes.

Siempre se agregan `scenes.json` y `guion.txt`.

## Por qué el render tarda lo que tarda

Un reel de 30 s a 30 fps son 900 capturas de pantalla de 1080×1920, más la
codificación. En una máquina de 2 vCPU son varios minutos. No hay atajo mágico:
lo que hay es no renderizar de nuevo lo que no cambió, que es trabajo pendiente
(ver `docs/ROADMAP.md`).

Si además se pide overlay con alfa, son 900 capturas más: son dos pasadas
distintas, porque el modo alfa no dibuja fondos ni el video base.

## Estado de los jobs

El registro de jobs vive **en memoria**. Si el worker se reinicia en medio de un
render, el job se pierde y hay que volver a pedirlo; los archivos ya escritos
quedan en el volumen. Para una sola persona usando la herramienta esto alcanza.
Cuando sean varios en paralelo hay que mover los jobs a Redis o a una tabla —
está anotado en el roadmap y no escondido como si no importara.

## Límites conocidos

- **Una instancia por vez.** Dos renders simultáneos se pelean por la CPU.
- **El video base se sincroniza frame a frame.** Es lento pero es la única
  manera de que la capa de cámara quede en sincronía real.
- **Sin fuentes instaladas, el reel sale con otra tipografía.** El `Dockerfile`
  copia `worker/fonts/`; si está vacío, Chromium intenta Google Fonts y si no
  hay red usa `system-ui`.
