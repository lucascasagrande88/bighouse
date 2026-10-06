"""Texto → contornos SVG (con kerning real vía HarfBuzz), para que los logos no dependan de tener la fuente instalada."""
import io
from functools import lru_cache
from pathlib import Path

import uharfbuzz as hb
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

FONTS = Path(__file__).resolve().parent / 'fonts'


@lru_cache(None)
def load(name):
    """name: archivo en fonts/ sin extensión, p. ej. 'cormorant-garamond-latin-500-normal'."""
    tt = TTFont(FONTS / f'{name}.woff2')
    buf = io.BytesIO()
    tt.flavor = None
    tt.save(buf)
    data = buf.getvalue()
    face = hb.Face(data)
    font = hb.Font(face)
    upem = face.upem
    tt2 = TTFont(io.BytesIO(data))
    return {'hb': font, 'upem': upem, 'glyphs': tt2.getGlyphSet(), 'order': tt2.getGlyphOrder(),
            'ascender': tt2['hhea'].ascent, 'descender': tt2['hhea'].descent,
            'cap': getattr(tt2['OS/2'], 'sCapHeight', 0) or tt2['hhea'].ascent * .7,
            'xh': getattr(tt2['OS/2'], 'sxHeight', 0) or tt2['hhea'].ascent * .5}


def text(name, s, size, x=0, y=0, tracking=0.0, anchor='start'):
    """Devuelve (d, ancho) del texto con la línea base en y. tracking en em (0.1 = 10 %)."""
    f = load(name)
    buf = hb.Buffer()
    buf.add_str(s)
    buf.guess_segment_properties()
    hb.shape(f['hb'], buf, {'kern': True, 'liga': True})
    scale = size / f['upem']
    track = tracking * f['upem']
    adv = sum(p.x_advance for p in buf.glyph_positions) + track * (len(buf.glyph_positions) - 1)
    width = adv * scale
    ox = x - (width / 2 if anchor == 'middle' else width if anchor == 'end' else 0)
    pen = SVGPathPen(f['glyphs'], lambda v: f'{v:.2f}'.rstrip('0').rstrip('.'))
    cx = 0
    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = f['order'][info.codepoint]
        t = TransformPen(pen, (scale, 0, 0, -scale, ox + (cx + pos.x_offset) * scale, y - pos.y_offset * scale))
        f['glyphs'][gname].draw(t)
        cx += pos.x_advance + track
    return pen.getCommands(), width


def metrics(name, size):
    f = load(name)
    k = size / f['upem']
    return {'cap': f['cap'] * k, 'xh': f['xh'] * k, 'asc': f['ascender'] * k, 'desc': -f['descender'] * k}
