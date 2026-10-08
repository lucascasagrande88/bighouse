#!/usr/bin/env python3
"""Kit de 12 stories de Instagram (1080×1920) para Nahuel Ponce. Mismo sistema visual que los posteos (build.py).

7 stories con foto (foto a sangre, foto enmarcada, foto partida) y 5 placas tipográficas.
Todo el texto queda entre y=250 y y=1600: arriba y abajo Instagram tapa con su interfaz.

Genera:
  stories.html          vista local para revisar y exportar PNG
  stories-canva.html    misma maqueta con URLs públicas, para importar en Canva (cada página = una story)
  img/story-*.jpg       recortes de las fotos al tamaño exacto de cada hueco

Uso: cd marca/Nahuel-Ponce/instagram && python3 stories.py
"""
from pathlib import Path

from PIL import Image

import build
from build import ASH, ASH_D, BONE, INK, PAPER, PUBLIC

HERE = Path(__file__).resolve().parent
W, H = 1080, 1920
build.W, build.H = W, H  # el CSS compartido toma el tamaño de página de acá

CROPS = {
    'retrato-full': ('retrato', 1080, 1920, .30),
    'ciudad-full': ('ciudad', 1080, 1920, .35),
    'noche-full': ('noche', 1080, 1920, .45),
    'lectura-full': ('lectura', 1080, 1920, .5),
    'calle-top': ('calle', 1080, 1000, .4),
    'lectura-frame': ('lectura', 760, 950, .45),
    'retrato-post': ('retrato', 640, 800, .25),
}

SAFE = 'rgba(242,239,234,.28)'


def make_crops():
    for name, (src, w, h, fy) in CROPS.items():
        im = Image.open(HERE / f'img/{src}.jpg')
        scale = max(w / im.width, h / im.height)
        im = im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)
        left = (im.width - w) // 2
        top = round((im.height - h) * fy)
        im.crop((left, top, left + w, top + h)).save(HERE / f'img/story-{name}.jpg', quality=90, optimize=True, progressive=True)


def head(dark, num, label):
    """Etiqueta + número romano + filete, debajo de la barra de progreso de Instagram."""
    muted = ASH if dark else ASH_D
    line = SAFE if dark else 'rgba(35,35,35,.28)'
    return f'''
  <p class="abs label" style="left:84px;top:262px;margin:0;color:{muted}">{label}</p>
  <p class="abs serif it" style="right:84px;top:246px;margin:0;font-size:40px;color:{muted}">{num}</p>
  <div class="abs" style="left:84px;right:84px;top:316px;height:1px;background:{line}"></div>'''


def sign(dark, y=1500):
    fg, muted = (BONE, ASH) if dark else (INK, ASH_D)
    line = SAFE if dark else 'rgba(35,35,35,.28)'
    return f'''
  <div class="abs" style="left:84px;right:84px;top:{y}px;height:1px;background:{line}"></div>
  <p class="abs serif" style="left:84px;top:{y + 40}px;margin:0;font-size:36px;line-height:1;color:{fg}">Nahuel Ponce</p>
  <p class="abs label" style="left:84px;top:{y + 92}px;margin:0;font-size:20px;color:{muted}">Psicólogo · Barcelona y online</p>
  <img class="abs" src="{build.MONO['neg' if dark else 'pos']}" style="right:84px;top:{y + 34}px;height:86px" alt="N">'''


def sticker_slot(top, height, text, dark):
    """Hueco punteado para pegar un sticker de Instagram (pregunta, encuesta, link). Se borra al publicar."""
    c = 'rgba(242,239,234,.45)' if dark else 'rgba(35,35,35,.4)'
    return f'''
  <div class="abs" style="left:140px;right:140px;top:{top}px;height:{height}px;border:2px dashed {c};border-radius:36px"></div>
  <p class="abs label" style="left:140px;right:140px;top:{top + height // 2 - 14}px;margin:0;font-size:19px;text-align:center;color:{c}">{text}</p>'''


def shade(top, height, to='bottom', strength=.85):
    return f'''
  <div class="abs" style="left:0;top:{top}px;width:{W}px;height:{height}px;background:linear-gradient(to {to},rgba(35,35,35,0),rgba(35,35,35,{strength}))"></div>'''


def pages(img):
    P = []

    # 01 · Presentación — foto a sangre
    P.append(('Presentación · foto', INK, f'''
  <img class="abs" src="{img('retrato-full')}" style="left:0;top:0;width:{W}px;height:{H}px" alt="Nahuel Ponce">''' + shade(0, 420, 'top', .55) + shade(1000, 920) + f'''
  <p class="abs label" style="left:84px;top:262px;margin:0;color:{BONE}">Presentación</p>
  <p class="abs serif it" style="right:84px;top:246px;margin:0;font-size:40px;color:{BONE}">I</p>
  <img class="abs" src="{build.MONO['neg']}" style="left:84px;top:1150px;height:150px" alt="N">
  <h1 class="abs serif" style="left:84px;right:84px;top:1330px;margin:0;font-size:78px;line-height:1.04;color:{BONE}">Hola, soy Nahuel. <span class="it" style="color:{PAPER}">Psicólogo en Barcelona y online.</span></h1>
  <p class="abs label" style="left:84px;top:1560px;margin:0;font-size:19px;color:{PAPER}">Orientación psicoanalítica · Español y portugués</p>'''))

    # 02 · Sólo foto — con una línea de ubicación
    P.append(('Sólo foto', INK, f'''
  <img class="abs" src="{img('ciudad-full')}" style="left:0;top:0;width:{W}px;height:{H}px" alt="Barcelona">''' + shade(1300, 620, strength=.6) + f'''
  <p class="abs serif it" style="left:84px;top:1450px;margin:0;font-size:58px;line-height:1;color:{BONE}">Barcelona, hoy.</p>
  <p class="abs label" style="left:84px;top:1540px;margin:0;font-size:19px;color:{BONE}">Nahuel Ponce · Psicólogo</p>
  <img class="abs" src="{build.MONO['neg']}" style="right:84px;top:1460px;height:96px" alt="N">'''))

    # 03 · Frase sobre foto
    P.append(('Frase sobre foto', INK, f'''
  <img class="abs" src="{img('noche-full')}" style="left:0;top:0;width:{W}px;height:{H}px" alt="Calle de noche">
  <div class="abs" style="left:0;top:0;width:{W}px;height:{H}px;background:{INK};opacity:.62"></div>''' + head(True, 'III', 'Para pensar') + f'''
  <h2 class="abs serif" style="left:84px;right:84px;top:720px;margin:0;font-size:120px;line-height:1.02;color:{BONE}">Lo que no se dice, <span class="it" style="color:{PAPER}">insiste.</span></h2>''' + sign(True)))

    # 04 · Placa frase
    P.append(('Placa · frase', INK, head(True, 'IV', 'Una idea') + f'''
  <p class="abs serif" style="left:64px;top:380px;margin:0;font-size:420px;line-height:1;color:{ASH}">“</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:760px;margin:0;font-size:112px;line-height:1.02;color:{BONE}">Comprender <span class="it" style="color:{ASH}">antes</span> que silenciar.</h2>
  <p class="abs small" style="left:84px;width:760px;top:1180px;margin:0;color:{ASH}">Escuchar lo que aparece, sin apurarse a taparlo.</p>''' + sign(True)))

    # 05 · Foto enmarcada — lectura
    P.append(('Foto enmarcada · lectura', PAPER, head(False, 'V', 'Lo que estoy leyendo') + f'''
  <img class="abs" src="{img('lectura-frame')}" style="left:160px;top:400px;width:760px;height:950px" alt="Nahuel leyendo en un café">
  <h2 class="abs serif" style="left:84px;right:84px;top:1385px;margin:0;font-size:64px;line-height:1.05;color:{INK}">Las formaciones <span class="it">del inconsciente.</span></h2>''' + f'''
  <p class="abs label" style="left:84px;top:1560px;margin:0;font-size:20px;color:{ASH_D}">Jacques Lacan · Seminario 5</p>
  <img class="abs" src="{build.MONO['pos']}" style="right:84px;top:1520px;height:86px" alt="N">'''))

    # 06 · Caja de preguntas
    P.append(('Caja de preguntas', BONE, head(False, 'VI', 'Preguntas') + f'''
  <p class="abs serif it" style="left:74px;top:340px;margin:0;font-size:280px;line-height:1;color:rgba(35,35,35,.12)">¿?</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:720px;margin:0;font-size:92px;line-height:1.04;color:{INK}">¿Qué te gustaría preguntarle <span class="it">a un psicólogo?</span></h2>
  <p class="abs small" style="left:84px;width:860px;top:1060px;margin:0;color:#3d3a35">Respondo algunas en las próximas stories.</p>''' + sticker_slot(1170, 270, 'Pegar sticker «Preguntas» aquí', False) + sign(False)))

    # 07 · Encuesta
    P.append(('Encuesta', INK, head(True, 'VII', 'Encuesta') + f'''
  <h2 class="abs serif" style="left:84px;right:84px;top:520px;margin:0;font-size:100px;line-height:1.03;color:{BONE}">¿Alguna vez hiciste <span class="it" style="color:{ASH}">terapia?</span></h2>
  <p class="abs small" style="left:84px;width:860px;top:860px;margin:0;color:{ASH}">No hay respuesta correcta. Me interesa saber desde dónde llegan.</p>''' + sticker_slot(1070, 330, 'Pegar sticker «Encuesta» aquí', True) + sign(True)))

    # 08 · Mito / realidad
    P.append(('Mito y realidad', PAPER, head(False, 'VIII', 'Mito y realidad') + f'''
  <p class="abs label" style="left:84px;top:470px;margin:0;color:{ASH_D}">Mito</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:530px;margin:0;font-size:80px;line-height:1.06;color:{INK};text-decoration:line-through;text-decoration-thickness:3px;text-decoration-color:rgba(35,35,35,.45)">Al psicólogo se va cuando ya no se puede más.</h2>
  <div class="abs" style="left:84px;right:84px;top:880px;height:1px;background:rgba(35,35,35,.28)"></div>
  <p class="abs label" style="left:84px;top:950px;margin:0;color:{ASH_D}">Realidad</p>
  <h2 class="abs serif it" style="left:84px;right:84px;top:1010px;margin:0;font-size:80px;line-height:1.06;color:{INK}">Se puede empezar por una pregunta, una duda o algo que se repite.</h2>''' + sign(False)))

    # 09 · Foto partida — modalidad
    P.append(('Foto partida · modalidad', INK, f'''
  <img class="abs" src="{img('calle-top')}" style="left:0;top:0;width:{W}px;height:1000px" alt="Avenida europea">''' + shade(0, 420, 'top', .5) + f'''
  <p class="abs label" style="left:84px;top:262px;margin:0;color:{BONE}">Modalidad</p>
  <p class="abs serif it" style="right:84px;top:246px;margin:0;font-size:40px;color:{BONE}">IX</p>
  <h2 class="abs serif" style="left:84px;right:84px;top:1080px;margin:0;font-size:84px;line-height:1.04;color:{BONE}">Presencia para encontrarse. <span class="it" style="color:{ASH}">Distancia para poder llegar.</span></h2>
  <p class="abs label" style="left:84px;top:1380px;margin:0;font-size:20px;color:{BONE}">Gràcia, Barcelona  ·  Online desde cualquier lugar</p>''' + sign(True)))

    # 10 · Nuevo post — miniatura enmarcada
    P.append(('Nuevo post', BONE, head(False, 'X', 'Nuevo en el perfil') + f'''
  <div class="abs" style="left:200px;top:400px;width:680px;height:840px;background:{INK}"></div>
  <img class="abs" src="{img('retrato-post')}" style="left:220px;top:420px;width:640px;height:800px" alt="Nuevo posteo">
  <h2 class="abs serif" style="left:84px;right:84px;top:1290px;margin:0;font-size:72px;line-height:1.05;text-align:center;color:{INK}">Hay un post nuevo. <span class="it">Toca para verlo.</span></h2>''' + sign(False)))

    # 11 · Detrás de escena — foto a sangre, mínimo texto
    P.append(('Detrás de escena · foto', INK, f'''
  <img class="abs" src="{img('lectura-full')}" style="left:0;top:0;width:{W}px;height:{H}px" alt="Nahuel leyendo">''' + shade(0, 420, 'top', .55) + shade(1150, 770, strength=.92) + f'''
  <p class="abs label" style="left:84px;top:262px;margin:0;color:{BONE}">Detrás de escena</p>
  <p class="abs serif it" style="right:84px;top:246px;margin:0;font-size:40px;color:{BONE}">XI</p>
  <p class="abs serif it" style="left:84px;right:240px;top:1420px;margin:0;font-size:60px;line-height:1.1;color:{BONE};text-shadow:0 2px 28px rgba(0,0,0,.9),0 0 8px rgba(0,0,0,.6)">Entre sesiones, leer.</p>
  <img class="abs" src="{build.MONO['neg']}" style="right:84px;top:1450px;height:96px" alt="N">'''))

    # 12 · Contacto con sticker de enlace
    P.append(('Contacto', INK, head(True, 'XII', 'Primera consulta') + f'''
  <img class="abs" src="{build.MONO['neg']}" style="left:84px;top:430px;height:220px" alt="N">
  <h2 class="abs serif" style="left:84px;right:84px;top:720px;margin:0;font-size:108px;line-height:1.02;color:{BONE}">Puedes empezar <span class="it" style="color:{ASH}">por escribir.</span></h2>
  <p class="abs label" style="left:84px;top:1000px;margin:0;font-size:22px;color:{BONE}">WhatsApp  +34 641 90 16 60</p>
  <p class="abs label" style="left:84px;top:1050px;margin:0;font-size:22px;color:{ASH}">nahuel-psicologia-barcelona.netlify.app</p>''' + sticker_slot(1170, 220, 'Pegar sticker «Enlace» aquí', True) + sign(True)))
    return P


def render(local):
    img = (lambda n: f'img/story-{n}.jpg') if local else (lambda n: f'{PUBLIC}/img/story-{n}.jpg')
    base = '../logos/png' if local else PUBLIC.replace('/instagram', '/logos/png')
    build.MONO['pos'] = f'{base}/Nahuel-Ponce_Monograma_Positivo.png'
    build.MONO['neg'] = f'{base}/Nahuel-Ponce_Monograma_Negativo.png'
    body = ''.join(
        f'\n<section class="page" data-document-role="page" data-label="{i:02d} · {name}" style="background:{bg}">{inner}\n</section>'
        for i, (name, bg, inner) in enumerate(pages(img), 1))
    fonts = '' if local else '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;1,400&family=Manrope:wght@400;500&display=swap">'
    return f'''<!doctype html>
<html lang="es"><head><meta charset="utf-8"><title>Nahuel Ponce · Stories de Instagram</title>{fonts}
<style>{build.css(local)}</style></head>
<body>{body}
</body></html>
'''


if __name__ == '__main__':
    make_crops()
    (HERE / 'stories.html').write_text(render(True), encoding='utf-8')
    (HERE / 'stories-canva.html').write_text(render(False), encoding='utf-8')
    print('ok')
