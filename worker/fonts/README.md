# Fuentes de la marca para el render

El `Dockerfile` copia todo lo que haya en esta carpeta a
`/usr/share/fonts/truetype/chimichurri/` y corre `fc-cache`.

Hacen falta las dos familias que usa el sistema visual:

- **Syne** — pesos 700 y 800 (títulos, hooks, palabras de impacto)
- **Inter** — pesos 400 a 900 (listas, cuerpo, etiquetas)

Las dos son de Google Fonts y tienen licencia SIL Open Font License, así que se
pueden empaquetar en la imagen sin problema.

Dejá los archivos así:

```
worker/fonts/
  Syne-Bold.ttf
  Syne-ExtraBold.ttf
  Inter-Regular.ttf
  Inter-Medium.ttf
  Inter-SemiBold.ttf
  Inter-Bold.ttf
  Inter-ExtraBold.ttf
  Inter-Black.ttf
```

Los `.ttf` no están en el repositorio a propósito: son binarios que no aportan
nada al historial de git y se bajan una sola vez.

## Por qué importa

El worker renderiza sin red. Si las fuentes no están instaladas localmente, el
`<link>` a Google Fonts del `stage.html` falla en silencio y Chromium cae a
`system-ui`. El reel se renderiza igual, pero con otra tipografía — y eso no se
nota hasta que se ve el MP4 terminado.
