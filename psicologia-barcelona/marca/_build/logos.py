#!/usr/bin/env python3
"""Logos vectoriales de las 3 marcas (texto en curvas). Uso: python3 marca/_build/logos.py
Salida: marca/<marca>/logos/svg/*.svg  (luego export.mjs genera PDF y PNG)."""
import json
import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from textpath import metrics, text  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]

CORM = 'cormorant-garamond-latin-500-normal'
CORM_6 = 'cormorant-garamond-latin-600-normal'
FRAU = 'fraunces-latin-400-normal'

BRANDS = {
    'nahuel': {
        'folder': 'Nahuel-Ponce', 'name': 'Nahuel Ponce',
        'colors': {'hueso': '#F2EFEA', 'niebla': '#D9D3CB', 'grafito': '#4B4B4B', 'taupe': '#8D7D70', 'tinta': '#232323'},
        'light': 'hueso', 'dark': 'tinta', 'sans': 'manrope',
    },
    'sol': {
        'folder': 'Sol-Galiana', 'name': 'Sol Galiana',
        'colors': {'sage': '#A9B39F', 'cream': '#F4F0E8', 'sand': '#DCC9B7', 'terracotta': '#C58E72', 'charcoal': '#4A4F48'},
        'light': 'cream', 'dark': 'charcoal', 'sans': 'figtree',
    },
    'conjunta': {
        'folder': 'Psicoanalisis-en-Barcelona', 'name': 'Psicoanálisis en Barcelona',
        'colors': {'crema': '#F4EEE5', 'arena': '#D8CFC2', 'oliva': '#8E9578', 'verde': '#4E5448', 'terracota': '#B76D4F', 'carbon': '#2E2D2A'},
        'light': 'crema', 'dark': 'carbon', 'sans': 'hanken-grotesk',
    },
}


def sans(b, w=400):
    return f"{BRANDS[b]['sans']}-latin-{w}-normal"


class Art:
    """Acumula elementos y su caja para armar un SVG ajustado con margen."""

    def __init__(self):
        self.items, self.box = [], [math.inf, math.inf, -math.inf, -math.inf]

    def add(self, el, x0, y0, x1, y1):
        self.items.append(el)
        b = self.box
        self.box = [min(b[0], x0), min(b[1], y0), max(b[2], x1), max(b[3], y1)]

    def text(self, font, s, size, x, y, fill, tracking=0, anchor='start', role='ink'):
        d, w = text(font, s, size, x, y, tracking, anchor)
        m = metrics(font, size)
        x0 = x - (w / 2 if anchor == 'middle' else w if anchor == 'end' else 0)
        self.add(f'<path data-role="{role}" fill="{fill}" d="{d}"/>', x0, y - m['asc'] * .82, x0 + w, y + m['desc'] * .5)
        return w

    def svg(self, pad=0.08, title=''):
        x0, y0, x1, y1 = self.box
        p = max(x1 - x0, y1 - y0) * pad
        vb = (x0 - p, y0 - p, x1 - x0 + 2 * p, y1 - y0 + 2 * p)
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.1f} {vb[1]:.1f} {vb[2]:.1f} {vb[3]:.1f}" '
                f'width="{vb[2]:.0f}" height="{vb[3]:.0f}"><title>{title}</title>' + ''.join(self.items) + '</svg>\n'), vb


def bezier(p0, p1, p2, p3, t):
    u = 1 - t
    return (u ** 3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t ** 3 * p3[0],
            u ** 3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t ** 3 * p3[1])


def stroke(segments, wmax, wmin=0.4, n=140, power=.75):
    """Trazo de pincel: curva (lista de cubic beziers) con grosor que crece hacia el centro y se afina en las puntas."""
    pts = []
    for i in range(n + 1):
        t = i / n * len(segments)
        k = min(int(t), len(segments) - 1)
        pts.append(bezier(*segments[k], t - k))
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]
        c = pts[min(i + 1, n)]
        dx, dy = c[0] - a[0], c[1] - a[1]
        ln = math.hypot(dx, dy) or 1
        nx, ny = -dy / ln, dx / ln
        w = wmin + (wmax - wmin) * math.sin(math.pi * i / n) ** power
        left.append((x + nx * w / 2, y + ny * w / 2))
        right.append((x - nx * w / 2, y - ny * w / 2))
    poly = left + right[::-1]
    d = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in poly) + ' Z'
    xs, ys = [p[0] for p in poly], [p[1] for p in poly]
    return d, (min(xs), min(ys), max(xs), max(ys))


# ---------------------------------------------------------------- Nahuel

def n_mono(a, cx, top, size, fill):
    """Monograma: N de Cormorant atravesada por un filete vertical."""
    m = metrics(CORM, size)
    base = top + m['cap']
    a.text(CORM, 'N', size, cx, base, fill, anchor='middle')
    lw = size * .011
    ext = size * .22
    a.add(f'<rect data-role="ink" fill="{fill}" x="{cx - lw / 2:.2f}" y="{top - ext:.2f}" width="{lw:.2f}" height="{ext * .78:.2f}"/>',
          cx - lw, top - ext, cx + lw, top)
    a.add(f'<rect data-role="ink" fill="{fill}" x="{cx - lw / 2:.2f}" y="{base + ext * .22:.2f}" width="{lw:.2f}" height="{ext * .78:.2f}"/>',
          cx - lw, base, cx + lw, base + ext)


def nahuel_logos(c):
    ink, muted = c['ink'], c['muted']
    out = {}
    a = Art()  # principal: dos líneas en mayúsculas
    a.text(CORM, 'NAHUEL', 150, 0, 0, ink, .02)
    w = a.text(CORM, 'PONCE', 150, 0, 140, ink, .02)
    a.text(sans('nahuel'), 'PSICÓLOGO GENERAL SANITARIO', 21, 2, 200, muted, .26)
    out['Logo-Principal'] = a
    a = Art()  # horizontal
    w = a.text(CORM, 'NAHUEL PONCE', 120, 0, 0, ink, .02)
    a.text(sans('nahuel'), 'PSICÓLOGO GENERAL SANITARIO', 21, w / 2, 52, muted, .3, 'middle')
    out['Logo-Horizontal'] = a
    a = Art()  # secundario
    a.text(CORM, 'Nahuel', 140, 0, 0, ink)
    a.text(CORM, 'Ponce', 140, 0, 118, ink)
    a.text(sans('nahuel'), 'Psicólogo General Sanitario', 24, 4, 180, muted, .04)
    out['Logo-Secundario'] = a
    a = Art()
    n_mono(a, 0, 0, 300, ink)
    out['Monograma'] = a
    return out


# ---------------------------------------------------------------- Sol

def sol_sun(a, cx, base, r, c):
    """Símbolo: un sol que sale sobre dos líneas de horizonte."""
    a.add(f'<path data-role="accent" fill="{c["accent"]}" d="M{cx - r:.2f} {base:.2f} A{r:.2f} {r:.2f} 0 0 1 {cx + r:.2f} {base:.2f} Z"/>',
          cx - r, base - r, cx + r, base)
    w = r * 2.9
    lw = r * .045
    for k, (dy, col, amp) in enumerate([(r * .12, c['ink'], r * .07), (r * .32, c['accent2'], r * .1)]):
        y = base + dy
        d = (f'M{cx - w:.2f} {y:.2f} C{cx - w * .55:.2f} {y - amp:.2f} {cx - w * .2:.2f} {y + amp:.2f} {cx:.2f} {y:.2f} '
             f'S{cx + w * .55:.2f} {y - amp:.2f} {cx + w:.2f} {y + amp * .3:.2f}')
        a.add(f'<path data-role="{"ink" if k == 0 else "accent2"}" fill="none" stroke="{col}" stroke-width="{lw:.2f}" stroke-linecap="round" d="{d}"/>',
              cx - w, y - amp, cx + w, y + amp)


def sol_logos(c):
    ink, muted = c['ink'], c['muted']
    out = {}
    a = Art()
    w = a.text(CORM, 'SOL GALIANA', 130, 0, 0, ink, .01)
    a.text(sans('sol'), 'Psicóloga clínica · Barcelona y online', 27, w / 2, 58, muted, .08, 'middle')
    out['Logo-Principal'] = a
    a = Art()
    a.text(CORM, 'SOL GALIANA', 130, 0, 0, ink, .01)
    out['Logotipo'] = a
    a = Art()
    a.text(CORM, 'SOL', 140, 0, 0, ink, .02, 'middle')
    a.text(CORM, 'GALIANA', 140, 0, 125, ink, .02, 'middle')
    a.text(sans('sol'), 'Psicóloga clínica', 27, 0, 186, muted, .1, 'middle')
    a.text(sans('sol'), 'Barcelona y online', 27, 0, 226, muted, .1, 'middle')
    out['Logo-Vertical'] = a
    a = Art()
    sol_sun(a, 0, -34, 78, c)
    w = text(CORM, 'SOL GALIANA', 120, 0, 0, .01)[1]
    a.text(CORM, 'SOL GALIANA', 120, 0, 120, ink, .01, 'middle')
    a.text(sans('sol'), 'Psicóloga clínica', 30, 0, 176, muted, .12, 'middle')
    out['Logo-con-Simbolo'] = a
    a = Art()
    sol_sun(a, 0, 0, 90, c)
    out['Simbolo-Sol'] = a
    a = Art()
    m = metrics(CORM_6, 300)
    a.text(CORM_6, 'S', 300, 0, m['cap'], ink)
    a.text(CORM_6, 'G', 300, 104, m['cap'] * 1.42, ink)
    out['Monograma'] = a
    return out


# ---------------------------------------------------------------- Psicoanálisis en Barcelona

def two_strokes(a, x, y, s, c):
    """Dos trazos que se cruzan: dos recorridos, una escucha compartida."""
    def P(px, py):
        return (x + px * s, y + py * s)
    d1, b1 = stroke([(P(0, 72), P(60, 92), P(120, 66), P(160, 40)), (P(160, 40), P(205, 10), P(260, -4), P(300, 24))], 11 * s, .7 * s)
    d2, b2 = stroke([(P(30, 0), P(52, 26), P(95, 40), P(130, 37)), (P(130, 37), P(165, 34), P(192, 48), P(214, 74))], 7.5 * s, .6 * s, 120)
    a.add(f'<path data-role="accent2" fill="{c["accent2"]}" d="{d2}"/>', *b2)
    a.add(f'<path data-role="accent" fill="{c["accent"]}" d="{d1}"/>', *b1)


def conjunta_logos(c):
    ink, muted = c['ink'], c['muted']
    out = {}
    a = Art()
    two_strokes(a, -190, -350, 1.27, c)
    a.text(FRAU, 'Psicoanálisis', 112, 0, -130, ink, -.01, 'middle')
    a.text(FRAU, 'en Barcelona', 112, 0, -20, ink, -.01, 'middle')
    a.text(sans('conjunta'), 'SOL GALIANA  ·  NAHUEL PONCE', 22, 0, 40, muted, .3, 'middle')
    out['Logo-Principal'] = a
    a = Art()
    two_strokes(a, -165, -285, 1.1, c)
    a.text(FRAU, 'Psicoanálisis', 112, 0, -80, ink, -.01, 'middle')
    a.text(FRAU, 'en Barcelona', 112, 0, 30, ink, -.01, 'middle')
    out['Logo-Secundario'] = a
    a = Art()
    two_strokes(a, 0, 4, .7, c)
    w = a.text(FRAU, 'Psicoanálisis en Barcelona', 80, 250, 62, ink, -.01)
    a.text(sans('conjunta'), 'SOL GALIANA  ·  NAHUEL PONCE', 17, 252, 104, muted, .3)
    out['Logo-Horizontal'] = a
    a = Art()
    two_strokes(a, 0, 0, 1, c)
    out['Simbolo'] = a
    a = Art()
    m = metrics(FRAU, 280)
    a.text(FRAU, 'P', 280, 0, m['cap'], ink)
    a.text(FRAU, 'B', 280, 70, m['cap'] * 2.02, ink)
    out['Monograma'] = a
    return out


BUILDERS = {'nahuel': nahuel_logos, 'sol': sol_logos, 'conjunta': conjunta_logos}


def palettes(key):
    k = BRANDS[key]['colors']
    if key == 'nahuel':
        return {
            'Positivo': {'ink': k['tinta'], 'muted': k['grafito'], 'accent': k['taupe'], 'accent2': k['taupe'], 'bg': k['hueso']},
            'Negativo': {'ink': k['hueso'], 'muted': k['niebla'], 'accent': k['niebla'], 'accent2': k['niebla'], 'bg': k['tinta']},
            'Taupe': {'ink': k['hueso'], 'muted': k['hueso'], 'accent': k['hueso'], 'accent2': k['hueso'], 'bg': k['taupe']},
            'Mono-Negro': {'ink': '#000000', 'muted': '#000000', 'accent': '#000000', 'accent2': '#000000', 'bg': '#FFFFFF'},
            'Mono-Blanco': {'ink': '#FFFFFF', 'muted': '#FFFFFF', 'accent': '#FFFFFF', 'accent2': '#FFFFFF', 'bg': '#232323'},
        }
    if key == 'sol':
        return {
            'Positivo': {'ink': k['charcoal'], 'muted': k['charcoal'], 'accent': k['terracotta'], 'accent2': k['sage'], 'bg': k['cream']},
            'Negativo': {'ink': k['cream'], 'muted': k['sand'], 'accent': k['terracotta'], 'accent2': k['sage'], 'bg': k['charcoal']},
            'Sage': {'ink': k['cream'], 'muted': k['cream'], 'accent': k['terracotta'], 'accent2': k['cream'], 'bg': k['sage']},
            'Mono-Negro': {'ink': '#000000', 'muted': '#000000', 'accent': '#000000', 'accent2': '#000000', 'bg': '#FFFFFF'},
            'Mono-Blanco': {'ink': '#FFFFFF', 'muted': '#FFFFFF', 'accent': '#FFFFFF', 'accent2': '#FFFFFF', 'bg': '#4A4F48'},
        }
    return {
        'Positivo': {'ink': k['carbon'], 'muted': k['verde'], 'accent': k['terracota'], 'accent2': k['oliva'], 'bg': k['crema']},
        'Negativo': {'ink': k['crema'], 'muted': k['arena'], 'accent': k['terracota'], 'accent2': k['arena'], 'bg': k['verde']},
        'Terracota': {'ink': k['crema'], 'muted': k['crema'], 'accent': k['crema'], 'accent2': k['arena'], 'bg': k['terracota']},
        'Mono-Negro': {'ink': '#000000', 'muted': '#000000', 'accent': '#000000', 'accent2': '#000000', 'bg': '#FFFFFF'},
        'Mono-Blanco': {'ink': '#FFFFFF', 'muted': '#FFFFFF', 'accent': '#FFFFFF', 'accent2': '#FFFFFF', 'bg': '#2E2D2A'},
    }


def main():
    manifest = {}
    for key, b in BRANDS.items():
        out = ROOT / b['folder'] / 'logos' / 'svg'
        out.mkdir(parents=True, exist_ok=True)
        for old in out.glob('*.svg'):
            old.unlink()
        items = []
        for variant, pal in palettes(key).items():
            for logo, art in BUILDERS[key](pal).items():
                name = f"{b['folder']}_{logo}_{variant}"
                svg, vb = art.svg(title=f"{b['name']} · {logo.replace('-', ' ')} · {variant}")
                (out / f'{name}.svg').write_text(svg, encoding='utf-8')
                items.append({'file': f'{name}.svg', 'logo': logo, 'variant': variant, 'bg': pal['bg'], 'w': vb[2], 'h': vb[3]})
        manifest[key] = {'folder': b['folder'], 'items': items}
        print(key, len(items), 'logos')
    (ROOT / '_build' / 'logos.json').write_text(json.dumps(manifest, indent=1, ensure_ascii=False))


if __name__ == '__main__':
    main()
