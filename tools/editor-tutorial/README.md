# Editor automático de tutoriales

Une todos los videos de una carpeta en **un solo video**, sin silencios, muletillas ni tomas repetidas
(si repetís una frase, queda la última toma).

## Instalación (Windows, una sola vez)

```powershell
winget install Python.Python.3.12
winget install Gyan.FFmpeg
pip install faster-whisper
```
(Cerrá y abrí la terminal después de instalar.)

## Uso

```powershell
# 1) Ver qué cortaría, sin renderizar
python editar_tutorial.py "C:\Users\User\Desktop\tutorial" --solo-reporte

# 2) Generar el video
python editar_tutorial.py "C:\Users\User\Desktop\tutorial"
```

Resultado en `tutorial\edit\tutorial_editado.mp4` y el detalle de cada corte en `tutorial\edit\reporte.txt`.
Los videos se toman en orden alfabético (nombralos `01_...`, `02_...`).
Las transcripciones quedan guardadas, así que re-ejecutar con otros ajustes es rápido.

## Ajustes útiles

| Opción | Default | Para qué |
|---|---|---|
| `--margen 0.2` | 0.12 | Más aire entre frases si queda muy "picado" |
| `--pausa 0.8` | 0.6 | Silencio mínimo que se corta |
| `--similitud 0.7` | 0.8 | Más bajo = detecta más repeticiones (y más riesgo de cortar de más) |
| `--modelo medium` | small | Transcripción más precisa (más lento) |
| `--resolucion 1080x1920` | 1920x1080 | Formato vertical |
