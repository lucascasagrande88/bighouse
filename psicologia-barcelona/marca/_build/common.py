"""Piezas compartidas para papelería y manuales: fuentes embebidas, logos inline, QR, fotos y datos reales."""
import base64
import re
from functools import lru_cache
from pathlib import Path

import qrcode
import qrcode.image.svg

HERE = Path(__file__).resolve().parent
MARCA = HERE.parent
WEBS = MARCA.parent
FONTS = HERE / 'fonts'
PUBLIC = 'https://raw.githubusercontent.com/lucascasagrande88/bighouse/refs/heads/claude/wizardly-planck-k8eqja/psicologia-barcelona/marca'
MODE = {'canva': False}  # en modo Canva: imágenes PNG/JPG públicas y Google Fonts en lugar de SVG y fuentes embebidas
CANVA_IMG = MARCA / '_build' / 'canva-img'

FAMILIES = {
    'Cormorant Garamond': 'cormorant-garamond', 'Fraunces': 'fraunces', 'Manrope': 'manrope',
    'Figtree': 'figtree', 'Hanken Grotesk': 'hanken-grotesk',
}

# Datos reales (los mismos de las webs). No inventar teléfonos, emails ni dominios.
PEOPLE = {
    'sol': {'name': 'Sol Galiana', 'role': 'Psicóloga clínica', 'phone': '+34 605 69 56 03', 'email': 'solgaliana@gmail.com',
            'instagram': '@lic.solgaliana', 'web': 'sol-galiana-psicologia.netlify.app', 'langs': 'Español · English'},
    'nahuel': {'name': 'Nahuel Ponce', 'role': 'Psicólogo General Sanitario', 'phone': '+34 641 90 16 60', 'email': 'lic.poncenahuel@gmail.com',
               'web': 'nahuel-psicologia-barcelona.netlify.app', 'langs': 'Español · Português'},
    'conjunta': {'web': 'psicoanalisis-en-barcelona.netlify.app'},
}


def fonts_css():
    if MODE['canva']:
        return "@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:ital,wght@0,400;1,400&family=Manrope:wght@400;500&family=Figtree:wght@400;500&family=Hanken+Grotesk:wght@400;500&display=swap');"
    return _fonts_embedded()


@lru_cache(None)
def _fonts_embedded():
    out = []
    for fam, slug in FAMILIES.items():
        for f in sorted(FONTS.glob(f'{slug}-latin-*.woff2')):
            m = re.match(rf'{slug}-latin-(\d+)-(normal|italic)', f.stem)
            data = base64.b64encode(f.read_bytes()).decode()
            out.append(f"@font-face{{font-family:'{fam}';font-weight:{m[1]};font-style:{m[2]};src:url(data:font/woff2;base64,{data}) format('woff2')}}")
    return '\n'.join(out)


def logo(folder, name, height=None, width=None, cls=''):
    """SVG del logo inline. name: 'Logo-Principal_Positivo', etc."""
    svg = (MARCA / folder / 'logos' / 'svg' / f'{folder}_{name}.svg').read_text()
    svg = re.sub(r'<title>.*?</title>', '', svg)
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg)[1].split()]
    ratio = vb[2] / vb[3]
    svg = re.sub(r' width="[^"]+" height="[^"]+"', '', svg, count=1)
    if height:
        num, unit = re.match(r'([\d.]+)(\D+)', height).groups()
        size = f'height:{height};width:{float(num) * ratio:.2f}{unit}'
    else:
        num, unit = re.match(r'([\d.]+)(\D+)', width).groups()
        size = f'width:{width};height:{float(num) / ratio:.2f}{unit}'
    if MODE['canva']:
        return f'<img class="logo" src="{PUBLIC}/{folder}/logos/png/{folder}_{name}.png" style="{size};display:block" alt="Logo">'
    return svg.replace('<svg ', f'<svg class="logo {cls}" style="{size};display:block" ', 1)


def qr(url, color='#000000', size='18mm'):
    if MODE['canva']:
        CANVA_IMG.mkdir(exist_ok=True)
        name = f"qr-{url.split('.')[0]}-{color.lstrip('#')}.png"
        img = qrcode.QRCode(border=0, box_size=20, error_correction=qrcode.constants.ERROR_CORRECT_M)
        img.add_data(f'https://{url}')
        img.make_image(fill_color=color, back_color=None).save(CANVA_IMG / name) if False else img.make_image(fill_color=color, back_color='transparent').save(CANVA_IMG / name)
        return f'<img src="{PUBLIC}/_build/canva-img/{name}" style="width:{size};height:{size};display:block" alt="QR">'
    img = qrcode.make(f'https://{url}', image_factory=qrcode.image.svg.SvgPathImage, box_size=10, border=0,
                      error_correction=qrcode.constants.ERROR_CORRECT_M)
    svg = img.to_string(encoding='unicode')
    svg = re.sub(r'<\?xml[^>]*>', '', svg)
    svg = svg.replace('fill="#000000"', f'fill="{color}"').replace('<svg ', f'<svg style="width:{size};height:{size};display:block" ', 1)
    svg = re.sub(r'<path ([^>]*?)/>', lambda m: f'<path {m[1]} fill="{color}"/>' if 'fill=' not in m[1] else m[0], svg)
    return svg


def photo(site, name):
    """Foto real de las webs (en alta, versión -lg)."""
    src = WEBS / site / 'public' / 'assets' / f'{name}-lg.webp'
    if MODE['canva']:
        from PIL import Image
        CANVA_IMG.mkdir(exist_ok=True)
        out = CANVA_IMG / f'{site}-{name}.jpg'
        if not out.exists():
            Image.open(src).convert('RGB').save(out, quality=88, optimize=True, progressive=True)
        return f'{PUBLIC}/_build/canva-img/{out.name}'
    return src.as_uri()
