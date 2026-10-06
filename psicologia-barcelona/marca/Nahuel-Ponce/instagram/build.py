#!/usr/bin/env python3
"""Kit de 12 plantillas de Instagram (1080×1350) para Nahuel Ponce.

Genera:
  plantillas.html         vista local (fuentes y fotos locales) para revisar y exportar PNG
  plantillas-canva.html   misma maqueta con URLs públicas, para importar en Canva (cada página = un post)
  img/crop-*.jpg          recortes de las fotos al tamaño exacto de cada hueco

Uso: python3 marca/Nahuel-Ponce/instagram/build.py   (desde psicologia-barcelona/)
"""
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
FONTS = HERE.parents[2] / 'nahuel/public/fonts'
PUBLIC = 'https://raw.githubusercontent.com/lucascasagrande88/bighouse/refs/heads/claude/wizardly-planck-k8eqja/psicologia-barcelona/marca/Nahuel-Ponce/instagram'

# Paleta del manual de marca: Tinta, Grafito, Hueso, Niebla, Taupe.
INK, CHAR, BONE, PAPER, ASH, ASH_D = '#232323', '#4B4B4B', '#F2EFEA', '#D9D3CB', '#8D7D70', '#4B4B4B'
W, H = 1080, 1350

# Recortes: nombre → (foto, ancho, alto, foco vertical 0-1)
CROPS = {
    'retrato-top': ('retrato', 1080, 900, .30),
    'noche-full': ('noche', 1080, 1350, .45),
    'lectura-half': ('lectura', 540, 1350, .5),
    'ciudad-full': ('ciudad', 1080, 1350, .35),
    'calle-band': ('calle', 1080, 560, .35),
    'retrato-square': ('retrato', 420, 525, .25),
}


def make_crops():
    for name, (src, w, h, fy) in CROPS.items():
        im = Image.open(HERE / f'img/{src}.jpg')
        scale = max(w / im.width, h / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        left = (im.width - w) // 2
        top = round((im.height - h) * fy)
        im.crop((left, top, left + w, top + h)).save(HERE / f'img/crop-{name}.jpg', quality=88, optimize=True, progressive=True)


def css(local):
    faces = ''
    if local:
        faces = ''.join(
            f"@font-face{{font-family:'{fam}';font-style:{st};font-weight:{wt};src:url('{(FONTS / f).as_uri()}') format('woff2')}}"
            for fam, st, wt, f in [
                ('Cormorant Garamond', 'normal', 400, 'CormorantGaramond-normal-400.woff2'),
                ('Cormorant Garamond', 'italic', 400, 'CormorantGaramond-italic-400.woff2'),
                ('Manrope', 'normal', '300 600', 'Manrope-normal-300.woff2'),
                ('UnifrakturMaguntia', 'normal', 400, 'UnifrakturMaguntia-normal-400.woff2'),
            ])
    return faces + f"""
body{{margin:0;background:#3a3a38;font-family:'Manrope',Arial,sans-serif}}
.page{{position:relative;width:{W}px;height:{H}px;overflow:hidden;margin:0 auto 40px}}
.abs{{position:absolute}}
.serif{{font-family:'Cormorant Garamond',Garamond,serif;font-weight:400}}
.it{{font-style:italic}}
.goth{{font-family:'UnifrakturMaguntia',serif}}
.label{{font-family:'Manrope',Arial,sans-serif;font-weight:500;font-size:24px;letter-spacing:.22em;text-transform:uppercase}}
.small{{font-family:'Manrope',Arial,sans-serif;font-weight:400;font-size:32px;line-height:1.45}}
img{{display:block}}
"""


def frame(dark, num, label, sign=True):
    """Barra superior (etiqueta + número romano) y firma inferior comunes a todas las piezas."""
    fg = BONE if dark else INK
    muted = ASH if dark else ASH_D
    line = 'rgba(242,239,234,.28)' if dark else 'rgba(35,35,35,.28)'
    out = f'''
  <p class="abs label" style="left:84px;top:78px;margin:0;color:{muted}">{label}</p>
  <p class="abs serif it" style="right:84px;top:62px;margin:0;font-size:40px;color:{muted}">{num}</p>
  <div class="abs" style="left:84px;right:84px;top:132px;height:1px;background:{line}"></div>'''
    if sign:
        out += f'''
  <div class="abs" style="left:84px;right:84px;bottom:150px;height:1px;background:{line}"></div>
  <p class="abs serif" style="left:84px;bottom:84px;margin:0;font-size:34px;line-height:1;color:{fg}">Nahuel Ponce</p>
  <p class="abs label" style="left:84px;bottom:50px;margin:0;font-size:20px;color:{muted}">Psicólogo · Barcelona y online</p>
  <img class="abs" src="{MONO['neg' if dark else 'pos']}" style="right:84px;bottom:46px;height:84px" alt="N">'''
    return out


def pages(img):
    P = []

    # I · Presentación
    P.append(('Presentación', INK, f'''
  <img class="abs" src="{img('retrato-top')}" style="left:0;top:0;width:1080px;height:900px" alt="Nahuel Ponce">
  <p class="abs label" style="left:84px;top:78px;margin:0;color:{BONE}">Presentación</p>
  <p class="abs serif it" style="right:84px;top:62px;margin:0;font-size:40px;color:{BONE}">I</p>
  <img class="abs" src="{MONO['neg']}" style="left:84px;top:850px;height:170px" alt="N">
  <h1 class="abs serif" style="left:84px;right:84px;top:1040px;margin:0;font-size:66px;line-height:1.05;color:{BONE}">Hola, soy Nahuel. <span class="it" style="color:{ASH}">Psicólogo en Barcelona y online.</span></h1>
  <p class="abs label" style="left:84px;bottom:62px;margin:0;font-size:18px;color:{ASH}">Orientación psicoanalítica · Español y portugués</p>'''))

    # II · Frase grande
    P.append(('Frase', INK, frame(True, 'II', 'Una idea') + f'''
  <p class="abs serif it" style="left:74px;top:190px;margin:0;font-size:380px;line-height:1;color:{ASH}">L</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:600px;margin:0;font-size:104px;line-height:1.02;letter-spacing:-.01em;color:{BONE}">o que no se dice, <span class="it" style="color:{ASH}">insiste.</span></h2>
  <p class="abs small" style="left:84px;width:700px;top:960px;margin:0;color:{ASH}">Escucharlo es empezar.</p>'''))

    # III · Frase sobre foto
    P.append(('Frase sobre foto', INK, f'''
  <img class="abs" src="{img('noche-full')}" style="left:0;top:0;width:1080px;height:1350px" alt="Calle de noche">
  <div class="abs" style="left:0;top:0;width:1080px;height:1350px;background:{INK};opacity:.55"></div>''' + frame(True, 'III', 'Para pensar') + f'''
  <h2 class="abs serif" style="left:84px;right:84px;top:520px;margin:0;font-size:96px;line-height:1.04;color:{BONE}">Comprender <span class="it">antes</span> que silenciar.</h2>'''))

    # IV · Pregunta frecuente
    P.append(('Pregunta frecuente', BONE, frame(False, 'IV', 'Preguntas frecuentes') + f'''
  <p class="abs serif it" style="left:78px;top:200px;margin:0;font-size:300px;line-height:1;color:rgba(35,35,35,.12)">¿?</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:420px;margin:0;font-size:80px;line-height:1.06;color:{INK}">¿Tengo que saber exactamente <span class="it">qué me pasa?</span></h2>
  <p class="abs small" style="left:84px;width:860px;top:800px;margin:0;color:#3d3a35">No. La primera consulta también sirve para comenzar a poner en palabras aquello que preocupa o genera malestar.</p>'''))

    # V · Carrusel portada
    P.append(('Carrusel · portada', INK, frame(True, 'V', 'Serie · 1 / 4') + f'''
  <p class="abs serif" style="left:84px;top:200px;margin:0;font-size:420px;line-height:1;color:rgba(242,239,234,.08)">III</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:470px;margin:0;font-size:92px;line-height:1.04;color:{BONE}">Tres señales de que algo <span class="it" style="color:{ASH}">está insistiendo.</span></h2>
  <p class="abs label" style="left:84px;top:900px;margin:0;color:{BONE}">Desliza  →</p>'''))

    # VI · Carrusel interior
    P.append(('Carrusel · interior', PAPER, frame(False, 'VI', 'Serie · 2 / 4') + f'''
  <p class="abs serif it" style="left:84px;top:210px;margin:0;font-size:200px;line-height:1;color:{INK}">I.</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:470px;margin:0;font-size:76px;line-height:1.06;color:{INK}">Las mismas escenas <span class="it">vuelven a repetirse.</span></h2>
  <p class="abs small" style="left:84px;width:880px;top:740px;margin:0;color:#3d3a35">Cambian las personas o los lugares, pero el desenlace se parece. Lo que se repite suele estar diciendo algo de la propia historia.</p>'''))

    # VII · Lista
    items = ['Ansiedad y angustia', 'Vínculos y apego', 'Duelo y pérdidas', 'Crisis y cambios', 'Identidad y migración']
    rows = ''.join(
        f'''
  <p class="abs serif it" style="left:84px;top:{430 + i * 112}px;margin:0;font-size:40px;line-height:1;color:{ASH}">{r}</p>
  <p class="abs serif" style="left:200px;top:{422 + i * 112}px;margin:0;font-size:56px;line-height:1;color:{BONE}">{t}</p>
  <div class="abs" style="left:84px;right:84px;top:{500 + i * 112}px;height:1px;background:rgba(242,239,234,.16)"></div>'''
        for i, (r, t) in enumerate(zip(['I', 'II', 'III', 'IV', 'V'], items)))
    P.append(('Lista', INK, frame(True, 'VII', 'Motivos de consulta') + f'''
  <h2 class="abs serif" style="left:84px;right:84px;top:190px;margin:0;font-size:76px;line-height:1.05;color:{BONE}">Cuando algo se vuelve <span class="it" style="color:{ASH}">difícil de sostener.</span></h2>''' + rows))

    # VIII · Servicio (foto a media página)
    P.append(('Servicio', INK, f'''
  <img class="abs" src="{img('lectura-half')}" style="left:0;top:0;width:540px;height:1350px" alt="Nahuel leyendo en un café">
  <p class="abs label" style="left:600px;top:78px;margin:0;color:{ASH}">Servicios</p>
  <p class="abs serif it" style="right:84px;top:62px;margin:0;font-size:40px;color:{ASH}">VIII</p>
  <h2 class="abs serif" style="left:600px;right:70px;top:360px;margin:0;font-size:74px;line-height:1.04;color:{BONE}">Psicoterapia <span class="it">individual</span></h2>
  <p class="abs label" style="left:600px;top:600px;margin:0;font-size:19px;color:{BONE}">45 minutos</p>
  <p class="abs label" style="left:600px;top:650px;margin:0;font-size:19px;color:{BONE}">Presencial u online</p>
  <p class="abs label" style="left:600px;top:700px;margin:0;font-size:19px;color:{BONE}">Español · Português</p>
  <p class="abs small" style="left:600px;right:70px;top:790px;margin:0;font-size:29px;color:{ASH}">Un espacio clínico para trabajar sobre el malestar, los vínculos, las pérdidas y aquello que se repite.</p>
  <img class="abs" src="{MONO['neg']}" style="right:84px;bottom:46px;height:84px" alt="N">'''))

    # IX · Lectura recomendada
    P.append(('Lectura recomendada', PAPER, frame(False, 'IX', 'Lectura recomendada') + f'''
  <div class="abs" style="left:84px;top:230px;width:330px;height:470px;background:{INK}"></div>
  <p class="abs label" style="left:120px;top:280px;width:260px;margin:0;font-size:15px;color:{ASH}">Seminario 5</p>
  <p class="abs serif" style="left:120px;top:330px;width:260px;margin:0;font-size:44px;line-height:1.05;color:{BONE}">Las formaciones del inconsciente</p>
  <img class="abs" src="{MONO['neg']}" style="left:120px;top:570px;height:90px" alt="N">
  <h2 class="abs serif" style="left:470px;right:84px;top:240px;margin:0;font-size:58px;line-height:1.08;color:{INK}">Jacques Lacan<br><span class="it">1957 – 1958</span></h2>
  <p class="abs small" style="left:470px;right:84px;top:420px;margin:0;font-size:30px;color:#3d3a35">Un seminario sobre cómo el inconsciente se hace oír en los sueños, los chistes y los lapsus.</p>
  <p class="abs serif it" style="left:84px;right:84px;top:820px;margin:0;font-size:46px;line-height:1.2;color:{INK}">Parte de mi formación en clínica psicoanalítica.</p>'''))

    # X · Aviso / modalidad
    P.append(('Aviso', INK, frame(True, 'X', 'Modalidad') + f'''
  <img class="abs" src="{img('calle-band')}" style="left:0;top:180px;width:1080px;height:560px" alt="Avenida europea">
  <h2 class="abs serif" style="left:84px;right:84px;top:800px;margin:0;font-size:78px;line-height:1.05;color:{BONE}">Presencia para encontrarse. <span class="it" style="color:{ASH}">Distancia para poder llegar.</span></h2>
  <p class="abs label" style="left:84px;top:1050px;margin:0;font-size:19px;color:{BONE}">Barcelona  ·  Online desde cualquier lugar</p>'''))

    # XI · Bilingüe
    P.append(('Bilingüe', BONE, f'''
  <div class="abs" style="left:0;top:675px;width:1080px;height:675px;background:{INK}"></div>
  <p class="abs label" style="left:84px;top:78px;margin:0;color:{ASH_D}">Español</p>
  <p class="abs serif it" style="right:84px;top:62px;margin:0;font-size:40px;color:{ASH_D}">XI</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:300px;margin:0;font-size:86px;line-height:1.04;color:{INK}">Lo que no se dice, <span class="it">insiste.</span></h2>
  <p class="abs label" style="left:84px;top:760px;margin:0;color:{ASH}">Português</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:960px;margin:0;font-size:86px;line-height:1.04;color:{BONE}">O que não se diz, <span class="it">insiste.</span></h2>
  <img class="abs" src="{MONO['neg']}" style="right:84px;bottom:46px;height:84px" alt="N">'''))

    # XII · Contacto
    P.append(('Contacto', INK, f'''
  <img class="abs" src="{img('ciudad-full')}" style="left:0;top:0;width:1080px;height:1350px" alt="Nahuel Ponce en la calle">
  <div class="abs" style="left:0;top:760px;width:1080px;height:590px;background:{INK}"></div>
  <p class="abs label" style="left:84px;top:78px;margin:0;color:{BONE}">Primera consulta</p>
  <p class="abs serif it" style="right:84px;top:62px;margin:0;font-size:40px;color:{BONE}">XII</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:820px;margin:0;font-size:82px;line-height:1.04;color:{BONE}">Puedes empezar <span class="it" style="color:{ASH}">por escribir.</span></h2>
  <p class="abs label" style="left:84px;top:1040px;margin:0;font-size:20px;color:{BONE}">WhatsApp  +34 641 90 16 60</p>
  <p class="abs label" style="left:84px;top:1090px;margin:0;font-size:20px;color:{ASH}">nahuel-psicologia-barcelona.netlify.app</p>
  <img class="abs" src="{MONO['neg']}" style="right:84px;bottom:46px;height:84px" alt="N">'''))
    return P


MONO = {}


def render(local):
    img = (lambda n: f'img/crop-{n}.jpg') if local else (lambda n: f'{PUBLIC}/img/crop-{n}.jpg')
    base = '../logos/png' if local else PUBLIC.replace('/instagram', '/logos/png')
    MONO['pos'] = f'{base}/Nahuel-Ponce_Monograma_Positivo.png'
    MONO['neg'] = f'{base}/Nahuel-Ponce_Monograma_Negativo.png'
    body = ''.join(
        f'\n<section class="page" data-document-role="page" data-label="{i:02d} · {name}" style="background:{bg}">{inner}\n</section>'
        for i, (name, bg, inner) in enumerate(pages(img), 1))
    head = '' if local else '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Manrope:wght@400;500&family=UnifrakturMaguntia&display=swap">'
    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Nahuel Ponce · Kit de Instagram</title>{head}
<style>{css(local)}</style></head>
<body>{body}
</body></html>
'''


if __name__ == '__main__':
    make_crops()
    (HERE / 'plantillas.html').write_text(render(True), encoding='utf-8')
    (HERE / 'plantillas-canva.html').write_text(render(False), encoding='utf-8')
    print('ok')
