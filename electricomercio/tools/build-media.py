#!/usr/bin/env python3
"""Optimiza las imágenes de media-src/ a img/ (WebP en varios anchos) y genera media.js.

Uso: python3 tools/build-media.py
Los originales van en media-src/ con el nombre de IMAGE_PROMPTS.md (cualquier
extensión: .jpg .png .webp). Los videos (.mp4/.webm) se copian tal cual.
"""
import json, os, shutil, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, OUT = os.path.join(ROOT, "media-src"), os.path.join(ROOT, "img")

# anchos por tipo de pieza (el más chico se usa en mobile vía srcset)
WIDTHS = {
    "hero-desktop": [1280, 1920, 2400],
    "hero-mobile": [720, 1080],
    "hero-cable-cutout": [600, 1000],
    "banda": [960, 1920],
    "proyecto": [600, 1000],
    "rubro": [480, 800],
    "lista": [900, 1500],
    "contacto": [1280, 2400],
    "nosotros": [900, 1600],
}

def kind(name):
    for k in WIDTHS:
        if name.startswith(k):
            return k
    return None

def main():
    os.makedirs(OUT, exist_ok=True)
    manifest = {}
    for f in sorted(os.listdir(SRC)):
        name, ext = os.path.splitext(f)
        ext = ext.lower()
        if ext in (".mp4", ".webm"):
            shutil.copy2(os.path.join(SRC, f), os.path.join(OUT, f))
            manifest.setdefault(name, {})["video"] = "img/" + f
            continue
        k = kind(name)
        if not k or ext not in (".jpg", ".jpeg", ".png", ".webp"):
            print("ignorado:", f); continue
        im = Image.open(os.path.join(SRC, f))
        alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
        im = im.convert("RGBA" if alpha else "RGB")
        srcs = []
        for w in WIDTHS[k]:
            w = min(w, im.width)
            h = round(im.height * w / im.width)
            out = "%s-%d.webp" % (name, w)
            im.resize((w, h), Image.LANCZOS).save(os.path.join(OUT, out), "WEBP", quality=80, method=6)
            if not any(s[1] == w for s in srcs):
                srcs.append(("img/" + out, w))
        manifest.setdefault(name, {}).update({
            "src": srcs[-1][0], "w": im.width, "h": im.height,
            "srcset": ", ".join("%s %dw" % s for s in srcs),
        })
        print("ok:", f, "->", [s[0] for s in srcs])
    with open(os.path.join(ROOT, "media.js"), "w") as fh:
        fh.write("/* Generado por tools/build-media.py — no editar a mano. */\n")
        fh.write("window.EC_MEDIA = " + json.dumps(manifest, indent=2, ensure_ascii=False) + ";\n")
    print(len(manifest), "piezas en media.js")

if __name__ == "__main__":
    sys.exit(main())
