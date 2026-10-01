"""
Editor automático de tutoriales.

Toma todos los videos de una carpeta (en orden alfabético), los transcribe con
Whisper y arma UN solo video final sin:
  - silencios / "aire" entre frases
  - muletillas sueltas ("eh", "mmm", "este"...)
  - tomas repetidas (si decís lo mismo dos veces, se queda la ÚLTIMA toma)
  - arranques en falso ("vamos a abrir el..." -> "vamos a abrir el panel")

Uso:
    python editar_tutorial.py "C:\\Users\\User\\Desktop\\tutorial"
    python editar_tutorial.py CARPETA --solo-reporte   (no renderiza, solo muestra qué cortaría)

Requisitos: ffmpeg en el PATH y `pip install faster-whisper`.
"""

import argparse
import difflib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import unicodedata
from pathlib import Path

EXTENSIONES = {".mp4", ".mov", ".mkv", ".avi", ".webm", ".m4v"}
MULETILLAS = {"eh", "ehh", "ehm", "em", "emm", "mm", "mmm", "este", "ah", "aa", "o sea", "bueno"}


def normalizar(texto):
    texto = unicodedata.normalize("NFD", texto.lower())
    texto = "".join(c for c in texto if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9ñ ]+", " ", texto).split()


def transcribir(video, modelo, cache_dir):
    cache = cache_dir / (video.stem + ".json")
    if cache.exists():
        return json.loads(cache.read_text(encoding="utf-8"))
    from faster_whisper import WhisperModel

    if not hasattr(transcribir, "_modelo"):
        print(f"  Cargando modelo Whisper '{modelo}' (la primera vez se descarga)...")
        transcribir._modelo = WhisperModel(modelo, device="auto", compute_type="auto")
    segmentos, _ = transcribir._modelo.transcribe(
        str(video), language="es", word_timestamps=True, vad_filter=True
    )
    palabras = []
    for seg in segmentos:
        for w in seg.words or []:
            palabras.append({"start": w.start, "end": w.end, "word": w.word.strip()})
        print(f"    {seg.end:7.1f}s  {seg.text.strip()[:70]}")
    cache.write_text(json.dumps(palabras, ensure_ascii=False, indent=1), encoding="utf-8")
    return palabras


def agrupar_frases(palabras, pausa):
    """Agrupa palabras en frases cortando donde hay un silencio mayor a `pausa`."""
    frases, actual = [], []
    for w in palabras:
        if actual and w["start"] - actual[-1]["end"] > pausa:
            frases.append(actual)
            actual = []
        actual.append(w)
    if actual:
        frases.append(actual)
    return [
        {"start": f[0]["start"], "end": f[-1]["end"], "texto": " ".join(w["word"] for w in f)}
        for f in frases
    ]


def es_repetida(a, b, umbral):
    """True si la frase `a` es una toma anterior (repetida o arranque en falso) de `b`."""
    ta, tb = normalizar(a["texto"]), normalizar(b["texto"])
    if not ta or not tb:
        return False
    if difflib.SequenceMatcher(None, ta, tb).ratio() >= umbral:
        return True
    # Arranque en falso: `a` es corta y coincide con el comienzo de `b`
    if len(ta) <= len(tb) and len(ta) >= 2:
        inicio = tb[: len(ta)]
        return difflib.SequenceMatcher(None, ta, inicio).ratio() >= umbral
    return False


def decidir(frases, umbral, ventana):
    for i, f in enumerate(frases):
        f["motivo"] = None
        palabras = normalizar(f["texto"])
        if not palabras or " ".join(palabras) in MULETILLAS or set(palabras) <= MULETILLAS:
            f["motivo"] = "muletilla"
            continue
        for g in frases[i + 1 : i + 1 + ventana]:
            if es_repetida(f, g, umbral):
                f["motivo"] = f"repetida -> \"{g['texto'][:50]}\""
                break
    return frases


def tramos(frases, margen, duracion, unir):
    """Convierte las frases que se quedan en tramos [inicio, fin] con un poco de margen."""
    out = []
    for f in frases:
        if f["motivo"]:
            continue
        ini, fin = max(0.0, f["start"] - margen), min(duracion, f["end"] + margen)
        if out and ini - out[-1][1] < unir:
            out[-1][1] = fin
        else:
            out.append([ini, fin])
    return out


def duracion_video(video):
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(video)],
        capture_output=True, text=True, check=True,
    )
    return float(r.stdout.strip())


def renderizar(cortes, salida, ancho, alto, fps):
    tmp = Path(tempfile.mkdtemp(prefix="edit_tutorial_"))
    lista = tmp / "lista.txt"
    vf = (
        f"scale={ancho}:{alto}:force_original_aspect_ratio=decrease,"
        f"pad={ancho}:{alto}:(ow-iw)/2:(oh-ih)/2,fps={fps},format=yuv420p"
    )
    try:
        with lista.open("w", encoding="utf-8") as fl:
            for n, (video, ini, fin) in enumerate(cortes):
                parte = tmp / f"parte_{n:05d}.mp4"
                print(f"  [{n + 1}/{len(cortes)}] {video.name} {ini:.2f}-{fin:.2f}")
                subprocess.run(
                    ["ffmpeg", "-y", "-v", "error", "-ss", f"{ini:.3f}", "-to", f"{fin:.3f}",
                     "-i", str(video), "-vf", vf, "-af", "aresample=48000,afade=t=in:d=0.02",
                     "-c:v", "libx264", "-preset", "fast", "-crf", "18",
                     "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2", str(parte)],
                    check=True,
                )
                fl.write(f"file '{parte.as_posix()}'\n")
        subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lista),
             "-c", "copy", "-movflags", "+faststart", str(salida)],
            check=True,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def main():
    p = argparse.ArgumentParser(description="Arma un solo video sin silencios ni tomas repetidas.")
    p.add_argument("carpeta", type=Path)
    p.add_argument("--salida", type=Path, help="Archivo final (default: CARPETA/edit/tutorial_editado.mp4)")
    p.add_argument("--modelo", default="small", help="Modelo Whisper: tiny/base/small/medium/large-v3")
    p.add_argument("--pausa", type=float, default=0.6, help="Silencio (s) que separa frases")
    p.add_argument("--margen", type=float, default=0.12, help="Aire (s) que se deja antes/después de cada frase")
    p.add_argument("--similitud", type=float, default=0.8, help="0-1, qué tan parecidas deben ser dos tomas")
    p.add_argument("--ventana", type=int, default=6, help="Cuántas frases hacia adelante buscar repeticiones")
    p.add_argument("--resolucion", default="1920x1080")
    p.add_argument("--fps", type=int, default=30)
    p.add_argument("--solo-reporte", action="store_true", help="No renderiza, solo genera el reporte")
    a = p.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("No encuentro ffmpeg. En Windows: winget install Gyan.FFmpeg (y reabrí la terminal).")
    videos = sorted(f for f in a.carpeta.iterdir() if f.suffix.lower() in EXTENSIONES)
    if not videos:
        sys.exit(f"No hay videos en {a.carpeta}")

    trabajo = a.carpeta / "edit"
    cache_dir = trabajo / "transcripciones"
    cache_dir.mkdir(parents=True, exist_ok=True)
    salida = a.salida or trabajo / "tutorial_editado.mp4"

    # Transcribir todo y unir las frases de todos los videos en una sola línea de tiempo,
    # así también se detectan repeticiones entre un video y el siguiente.
    todas = []
    for v in videos:
        print(f"Transcribiendo {v.name}...")
        dur = duracion_video(v)
        for f in agrupar_frases(transcribir(v, a.modelo, cache_dir), a.pausa):
            f.update(video=v, duracion=dur)
            todas.append(f)
    decidir(todas, a.similitud, a.ventana)

    cortes, reporte = [], []
    total_orig = total_final = 0.0
    for v in videos:
        frases = [f for f in todas if f["video"] == v]
        dur = duracion_video(v)
        total_orig += dur
        reporte.append(f"\n=== {v.name} ({dur:.1f}s) ===")
        for f in frases:
            marca = "  CORTA " if f["motivo"] else "  queda "
            extra = f"  [{f['motivo']}]" if f["motivo"] else ""
            reporte.append(f"{marca}{f['start']:7.2f}-{f['end']:7.2f}  {f['texto']}{extra}")
        for ini, fin in tramos(frases, a.margen, dur, unir=2 * a.margen + 0.05):
            cortes.append((v, ini, fin))
            total_final += fin - ini

    resumen = (
        f"\nDuración original: {total_orig / 60:.1f} min  ->  editado: {total_final / 60:.1f} min "
        f"({len(cortes)} cortes)"
    )
    (trabajo / "reporte.txt").write_text("\n".join(reporte) + "\n" + resumen + "\n", encoding="utf-8")
    print(resumen)
    print(f"Reporte de cortes: {trabajo / 'reporte.txt'}")

    if a.solo_reporte:
        return
    ancho, alto = a.resolucion.lower().split("x")
    print("Renderizando...")
    renderizar(cortes, salida, ancho, alto, a.fps)
    print(f"\nListo: {salida}")


if __name__ == "__main__":
    main()
