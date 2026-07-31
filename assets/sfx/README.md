# Banco de sonidos

Organizado por **función**, no por nombre de archivo. Una escena no pide
`whoosh_03.wav`, pide "entrada de lista". `engine/src/sfx.js` traduce función →
archivo, así que se puede cambiar el banco entero sin tocar un solo `scenes.json`.

## Archivos esperados

| Nombre en el sistema | Archivo | Cuándo suena |
| --- | --- | --- |
| `hook` | `hook-riser.mp3` | Arranque del reel |
| `impact_low` | `impact-low.mp3` | Palabra que golpea |
| `impact_hard` | `impact-hard.mp3` | Remate seco |
| `appear` | `appear.mp3` | Entra un texto |
| `disappear` | `disappear.mp3` | Sale un texto |
| `transition` | `transition.mp3` | Cambio de escena |
| `list_tick` | `list-tick.mp3` | Cada ítem de una lista |
| `pop` | `pop.mp3` | Ícono o burbuja |
| `click` | `click.mp3` | Marca de check |
| `whoosh` | `whoosh.mp3` | Movimiento rápido |
| `shimmer` | `shimmer.mp3` | Brillo, detalle |
| `glitch` | `glitch.mp3` | Corte agresivo |
| `success` | `success.mp3` | Resultado positivo |
| `cta` | `cta.mp3` | Aparece la acción |
| `close` | `close.mp3` | Último frame |

Formato: **MP3, mono o estéreo, 48 kHz**. Cortos: casi todos entre 150 ms y 1 s;
`hook-riser` puede llegar a 2 s.

## Licencias

Los sonidos tienen que ser **propios, licenciados o libres para uso comercial**.
El sistema no se construye sobre audio arrancado de reels ajenos: un reel de un
cliente con audio de otro es un problema del cliente, no una optimización.

Los `.mp3` están fuera del control de versiones (ver `.gitignore`): son binarios
que no aportan nada al historial.

## Qué pasa si falta un archivo

Nada se rompe.

- **En el preview**, `SfxBus` saltea el efecto en silencio.
- **En el render**, `buildAudio` lo omite y el worker devuelve un aviso con la
  lista de efectos que no encontró: *"Efectos sin archivo en el banco: hook,
  impact_low. Se renderiza sin ellos."*

Un banco vacío da un reel muy callado, no un reel roto.
