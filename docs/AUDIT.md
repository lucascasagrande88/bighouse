# Auditoría: qué sirve y qué se descarta

Punto de partida real del repositorio antes de este cambio (commit `00a3f70`):

```
index.html                  hub principal
catalogo-diseno/            landing catálogo
catalogo-fisico/            landing catálogo
catalogo-experiencias/      landing catálogo
portal-clientes/            landing portal
assets/css/style.css        sistema visual completo (362 líneas)
assets/catalogos/.gitkeep   placeholder de PDFs
_redirects                  2 redirects de Netlify
```

No existía ninguna Content Factory: ni login, ni backend, ni funciones, ni
`package.json`, ni motor de animación. Por lo tanto **no hay una "versión
anterior de la Factory" que reorganizar** — hay un sitio estático que aporta
shell y lenguaje visual, y todo el producto se construye nuevo sobre eso.

---

## Lo que sirve y se reutiliza

| Pieza existente | Cómo se reutiliza |
| --- | --- |
| Tokens de `style.css` (`--bg #080808`, `--accent #D4FF00`, `--surface`, radios, `--ease`) | Se convierten en el **skin `chimichurri`** del motor de render (`engine/src/skins.js`). El reel sale con el color de la marca porque lee las mismas variables que la web. |
| Tipografías Syne 800 + Inter | Escala tipográfica del motor: Syne para impacto/hook, Inter para listas y cuerpo. |
| Overrides de acento por sección (`.diseno`, `.fisico`, `.experiencias`, `.portal-page`) | La idea de multi-skin ya estaba resuelta. Se extiende a marcas: `chimichurri`, `lucas`, `cliente`. |
| Patrón `hub-card` + `label` + `pill` | Índice de fábricas (`/content-factory/factories.html`) y tarjetas de proyecto del dashboard. |
| Nav + footer + `wa-fab` | No se usan dentro de la Factory (es una herramienta, no una landing), pero el nav sí para volver al sitio. |
| Netlify + dominio | Hostea el shell del frontend y las funciones de IA/auth. Sigue sirviendo. |
| Estructura de carpetas por ruta (`/catalogo-x/index.html`) | Se mantiene el mismo criterio: `/content-factory/`, `/content-factory/reel/`. |

Las cinco páginas existentes y `assets/css/style.css` quedan **intactas**: ni una
línea modificada. Cero regresión, verificable con `git diff`. La Factory tiene su
propia hoja de estilos (`content-factory/assets/factory.css`) que **copia** los
tokens en vez de importar `style.css`, porque son cosas distintas: una es una
landing y la otra es una herramienta densa. El precio de esa decisión es que un
cambio de color de marca hay que hacerlo en dos lugares; está anotado en el
roadmap.

## Lo que se descarta

No hay código de Factory que borrar. Lo que se descarta son **supuestos**:

1. **"Todo vive en Netlify estático."** Se descarta. Netlify no tiene ffmpeg,
   las funciones tienen límite de tiempo y el render de 30 s de video a 30 fps
   son ~900 capturas de pantalla. El procesamiento pesado se va a un worker
   separado (`worker/`). El usuario sigue viendo todo bajo el dominio de
   Chimichurri; internamente se delega.
2. **"Password en el JavaScript."** Nunca existió acá, y no se agrega.
   La API key de OpenAI vive sólo en el servidor.
3. **"La IA genera el HTML de cada escena."** Se descarta por inestable.
   La IA elige entre componentes maestros programados y los configura.
4. **Descargador interno de Instagram.** Fuera. Se sube el `.mp4`.
5. **Subtitulado.** El producto no pone subtítulos: interpreta visualmente.

## Deuda preexistente detectada (no la introduje, la marco)

- `wa.me/5491100000000` sigue siendo el placeholder en las 5 páginas. Hay que
  reemplazarlo por el número real.
- `assets/catalogos/*.pdf` están linkeados en el footer pero no existen: hoy
  son tres 404.

---

## Lo que se agrega

```
netlify.toml                  config de funciones + edge + headers
package.json                  deps del backend (Netlify Blobs)
shared/session.mjs            firma/verificación de sesión (Web Crypto, corre
                              igual en Node y en Deno edge)
scripts/hash-password.mjs     genera el hash scrypt para FACTORY_USERS

content-factory/              frontend privado
  index.html                  login (form real, cookie HttpOnly)
  factories.html              índice de fábricas 01..04
  reel/index.html             dashboard de proyectos + nuevo proyecto
  reel/editor.html            editor: escenas | preview 9:16 | propiedades + timeline
  assets/factory.css          UI de herramienta (hereda tokens de la marca)
  assets/js/*.js              api, guard, dashboard, editor, timeline

engine/                       motor de animación (compartido preview + render)
  stage.html                  superficie 1080x1920, expone window.__seek(t)
  schema/analysis.schema.json contrato del análisis del reel original
  schema/scenes.schema.json   contrato del storyboard (strict, para OpenAI)
  src/anim.js                 easings deterministas + stagger
  src/timing.js               WPM, duración estimada, reflow elástico
  src/skins.js                skins de marca
  src/icons.js                set de íconos SVG inline
  src/components.js           8 componentes maestros
  src/renderer.js             seek(t) determinista
  src/sfx.js                  mapa de efectos por función

netlify/functions/            backend liviano
  auth-login / auth-logout / auth-session
  projects                    CRUD sobre Netlify Blobs
  ai-adapt                    idea original → aplicación Chimichurri → guion
  ai-direct                   guion → hasta 10 escenas (JSON Schema strict)
  ai-image-prompt             prompt de imagen por escena
  worker-job                  firma y delega el trabajo pesado
netlify/edge-functions/gate.js  bloquea /content-factory sin sesión

worker/                       servicio de procesamiento y render
  server.js                   /ingest, /render/mp4, /render/alpha
  src/probe|audio|frames|transcribe|render|sign
  Dockerfile
```

## Principio de arquitectura

> La IA dirige. El motor de animación ejecuta.

El modelo nunca devuelve HTML ni CSS. Devuelve un `scenes.json` validado contra
un JSON Schema estricto: tipo de escena, textos, palabras clave, animación,
sonido, transición. El motor tiene 8 componentes maestros programados a mano y
los configura con eso. Consecuencia práctica: un reel que se ve mal se arregla
tocando un componente, no rezando para que el modelo escriba mejor CSS.

## Principio de render

`window.__seek(t)` es determinista: la escena en el segundo 12,4 se dibuja
idéntica siempre, sin animaciones CSS ni estado acumulado. El preview del
navegador llama `seek()` desde un `requestAnimationFrame`; el worker llama
`seek(n/fps)` y saca una captura. **El mismo código produce el preview y el
export**, así que lo que se ve en el editor es lo que sale en el MP4.
