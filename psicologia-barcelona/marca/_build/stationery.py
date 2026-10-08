#!/usr/bin/env python3
"""Papelería lista para imprenta (PDF con sangrado de 3 mm): tarjeta 85×55, tríptico A4 y stickers Ø50 mm.
Uso: python3 marca/_build/stationery.py   → genera HTML en marca/_build/out/ ; render.mjs los imprime a PDF."""
from pathlib import Path

import sys

import common
from common import PEOPLE, fonts_css, logo, photo, qr

OUT = Path(__file__).resolve().parent / 'out'
OUT.mkdir(exist_ok=True)
B = 3  # sangrado mm

THEMES = {
    'nahuel': {'folder': 'Nahuel-Ponce', 'serif': "'Cormorant Garamond'", 'sans': "'Manrope'",
               'bg': '#F2EFEA', 'ink': '#232323', 'muted': '#4B4B4B', 'accent': '#8D7D70', 'soft': '#D9D3CB', 'dark': '#232323', 'on_dark': '#F2EFEA'},
    'sol': {'folder': 'Sol-Galiana', 'serif': "'Cormorant Garamond'", 'sans': "'Figtree'",
            'bg': '#F4F0E8', 'ink': '#4A4F48', 'muted': '#5f645c', 'accent': '#C58E72', 'soft': '#DCC9B7', 'sage': '#A9B39F', 'dark': '#4A4F48', 'on_dark': '#F4F0E8'},
    'conjunta': {'folder': 'Psicoanalisis-en-Barcelona', 'serif': "'Fraunces'", 'sans': "'Hanken Grotesk'",
                 'bg': '#F4EEE5', 'ink': '#2E2D2A', 'muted': '#4E5448', 'accent': '#B76D4F', 'soft': '#D8CFC2', 'sage': '#8E9578', 'dark': '#4E5448', 'on_dark': '#F4EEE5'},
}


def base_css(t, w, h):
    return f"""{fonts_css()}
@page {{ size: {w}mm {h}mm; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ font-family: {t['sans']}, sans-serif; color: {t['ink']}; }}
.sheet {{ position: relative; width: {w}mm; height: {h}mm; overflow: hidden; page-break-after: always; background: {t['bg']}; }}
.sheet:last-child {{ page-break-after: auto; }}
.abs {{ position: absolute; }}
.serif {{ font-family: {t['serif']}, serif; font-weight: 400; }}
.it {{ font-style: italic; }}
p {{ margin: 0; }}
.kicker {{ font-size: 6.2pt; letter-spacing: .22em; text-transform: uppercase; font-weight: 500; color: {t['accent']}; }}
.body {{ font-size: 7.6pt; line-height: 1.5; font-weight: 400; }}
.photo {{ position: absolute; object-fit: cover; }}
"""


def blob(color, d, x, y, w, h, view='0 0 100 100'):
    return f'<svg class="abs" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm" viewBox="{view}" preserveAspectRatio="none"><path fill="{color}" d="{d}"/></svg>'


BLOB_A = 'M0 30 C18 8 42 4 60 20 C80 38 96 52 100 100 L0 100 Z'
BLOB_B = 'M100 0 L100 100 C78 92 60 70 54 48 C46 22 70 4 100 0 Z'


def html(t, w, h, sheets, title):
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>{title}</title><style>{base_css(t, w, h)}</style></head><body>' + ''.join(sheets) + '</body></html>'


def contact_lines(p, color, size=7.2, gap=1.55):
    rows = [p['phone'], p['email']] + ([p['instagram']] if p.get('instagram') else []) + [p['web']]
    return ''.join(f'<p style="font-size:{size}pt;line-height:{gap};color:{color}">{r}</p>' for r in rows)


# ------------------------------------------------------------------ Tarjetas 85 × 55

def card(key):
    t = THEMES[key]
    f = t['folder']
    W, H = 85 + 2 * B, 55 + 2 * B
    m = B + 5  # margen de seguridad desde el borde del PDF
    s = []
    if key == 'nahuel':
        p = PEOPLE['nahuel']
        s.append(f'''<div class="sheet" style="background:{t['dark']}">
  <div class="abs" style="left:0;right:0;top:{H / 2 - 13}mm;display:flex;justify-content:center">{logo(f, 'Monograma_Negativo', '26mm')}</div></div>''')
        s.append(f'''<div class="sheet">
  <div class="abs" style="left:{m}mm;top:{m + 1}mm">{logo(f, 'Logo-Horizontal_Positivo', width='46mm')}</div>
  <div class="abs" style="left:{m}mm;top:{m + 15}mm;width:12mm;height:.25mm;background:{t['accent']}"></div>
  <div class="abs" style="left:{m}mm;bottom:{m}mm">{contact_lines(p, t['ink'])}<p style="font-size:6pt;letter-spacing:.18em;text-transform:uppercase;margin-top:1.6mm;color:{t['accent']}">Barcelona · Online · ES / PT</p></div>
  <div class="abs" style="right:{m}mm;bottom:{m}mm">{qr(p['web'], t['ink'], '15mm')}</div></div>''')
    elif key == 'sol':
        p = PEOPLE['sol']
        s.append(f'''<div class="sheet">
  {blob(t['sage'], BLOB_A, -2, 34, 44, 30)}{blob(t['soft'], BLOB_B, 66, -2, 28, 30)}
  <div class="abs" style="left:0;right:0;top:{H / 2 - 12}mm;display:flex;justify-content:center">{logo(f, 'Logo-con-Simbolo_Positivo', '23mm')}</div></div>''')
        s.append(f'''<div class="sheet">
  {blob(t['accent'], BLOB_B, 76, 36, 18, 26)}
  <div class="abs" style="left:{m}mm;top:{m}mm">{logo(f, 'Logo-Principal_Positivo', width='44mm')}</div>
  <div class="abs" style="left:{m}mm;bottom:{m}mm">{contact_lines(p, t['ink'])}<p style="font-size:6pt;letter-spacing:.16em;text-transform:uppercase;margin-top:1.6mm;color:{t['accent']}">Barcelona y online · ES / EN</p></div>
  <div class="abs" style="right:{m + 4}mm;top:{m + 1}mm">{qr(p['web'], t['ink'], '14mm')}</div></div>''')
    else:
        so, na, web = PEOPLE['sol'], PEOPLE['nahuel'], PEOPLE['conjunta']['web']

        def person(p, lang):
            return (f'<p class="serif" style="font-size:10.5pt;line-height:1.1">{p["name"]}</p>'
                    f'<p style="font-size:5.6pt;letter-spacing:.1em;text-transform:uppercase;color:{t["accent"]};margin:.8mm 0 .4mm">{p["role"]}</p>'
                    f'<p style="font-size:5.6pt;letter-spacing:.1em;color:{t["soft"]};margin-bottom:1.6mm">{lang}</p>'
                    f'<p style="font-size:6.8pt;line-height:1.55">{p["phone"]}</p><p style="font-size:6.8pt;line-height:1.55">{p["email"]}</p>')
        s.append(f'''<div class="sheet">
  <div class="abs" style="left:0;right:0;top:{H / 2 - 15}mm;display:flex;justify-content:center">{logo(f, 'Logo-Principal_Positivo', '30mm')}</div></div>''')
        s.append(f'''<div class="sheet" style="background:{t['dark']};color:{t['on_dark']}">
  <div class="abs" style="left:{m}mm;top:{m}mm;width:34mm">{person(so, 'ES / EN')}</div>
  <div class="abs" style="left:{m + 39}mm;top:{m}mm;width:34mm">{person(na, 'ES / PT')}</div>
  <div class="abs" style="left:{m}mm;right:{m}mm;top:{m + 24}mm;height:.2mm;background:rgba(244,238,229,.35)"></div>
  <div class="abs" style="left:{m}mm;bottom:{m}mm"><p style="font-size:6.8pt">{web}</p><p style="font-size:6pt;letter-spacing:.16em;text-transform:uppercase;margin-top:1.2mm;color:{t['soft']}">Gràcia · Online</p></div>
  <div class="abs" style="right:{m}mm;bottom:{m}mm;padding:1.4mm;background:{t['bg']}">{qr(web, t['ink'], '12mm')}</div></div>''')
    return html(t, W, H, s, f'Tarjeta · {f}')


# ------------------------------------------------------------------ Tríptico A4 (100 + 100 + 97 mm)

def triptych(key):
    t = THEMES[key]
    f = t['folder']
    W, H = 297 + 2 * B, 210 + 2 * B
    # columnas en el PDF (incluyendo sangrado): exterior = [solapa 97 | contratapa 100 | tapa 100]; interior = [100 | 100 | 97]
    ext = [(0, B + 97), (B + 97, 100), (B + 197, 100 + B)]
    inn = [(0, B + 100), (B + 100, 100), (B + 200, 97 + B)]
    pad = 11

    def col(cols, i, inner, style=''):
        x, w = cols[i]
        lpad = pad + (B if x == 0 else 0)
        rpad = pad + (B if i == 2 else 0)
        return f'<div class="abs" style="left:{x}mm;top:0;width:{w}mm;height:{H}mm;padding:{pad + B}mm {rpad}mm {pad + B}mm {lpad}mm;{style}">{inner}</div>'

    C = CONTENT[key]
    k = C['kicker_style'] if 'kicker_style' in C else ''
    exterior = f'''<div class="sheet">
  {col(ext, 0, C['flap'])}
  {col(ext, 1, C['back'], C.get('back_style', ''))}
  {col(ext, 2, C['front'], C.get('front_style', ''))}
  {C.get('ext_extra', '')}</div>'''
    interior = f'''<div class="sheet">
  {col(inn, 0, C['in1'])}
  {col(inn, 1, C['in2'], C.get('in2_style', ''))}
  {col(inn, 2, C['in3'], C.get('in3_style', ''))}
  {C.get('in_extra', '')}</div>'''
    return html(t, W, H, [exterior, interior], f'Tríptico · {f}')


def h2(t, text, size=19):
    return f'<h2 class="serif" style="margin:0 0 5mm;font-size:{size}pt;line-height:1.08;font-weight:400;color:{t["ink"]}">{text}</h2>'


def kick(t, text, color=None):
    return f'<p class="kicker" style="margin-bottom:4mm;color:{color or t["accent"]}">{text}</p>'


def para(text, color=None, mb=3):
    return f'<p class="body" style="margin-bottom:{mb}mm{";color:" + color if color else ""}">{text}</p>'


def numbered(t, items, roman=True, size=8.4):
    R = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX']
    rows = ''.join(
        f'<div style="display:flex;gap:4mm;padding:2.3mm 0;border-top:.2mm solid {t["soft"]}"><span class="serif it" style="width:7mm;color:{t["accent"]};font-size:9pt">{R[i] if roman else f"{i + 1:02d}"}</span>'
        f'<span style="font-size:{size}pt;line-height:1.35">{it}</span></div>' for i, it in enumerate(items))
    return rows


def services(t, items):
    return ''.join(
        f'<div style="padding:2.6mm 0;border-top:.2mm solid {t["soft"]}"><p class="serif" style="font-size:11pt;line-height:1.15">{n}</p>'
        f'<p style="font-size:6.4pt;letter-spacing:.14em;text-transform:uppercase;color:{t["accent"]};margin-top:.8mm">{m}</p></div>' for n, m in items)


def contact_block(t, p, dark=False):
    color = t['on_dark'] if dark else t['ink']
    return (f'<div style="margin-top:auto">{contact_lines(p, color, 8.2, 1.6)}'
            f'<div style="margin-top:6mm">{qr(p["web"], color, "22mm")}</div>'
            f'<p style="font-size:6.2pt;margin-top:2.5mm;opacity:.75;color:{color}">Escanea para ver la web</p></div>')


def build_content():
    n, s, c = THEMES['nahuel'], THEMES['sol'], THEMES['conjunta']
    pn, ps, web_c = PEOPLE['nahuel'], PEOPLE['sol'], PEOPLE['conjunta']['web']
    C = {}

    # ---------------- Nahuel
    C['nahuel'] = {
        'flap': (kick(n, 'Una forma de trabajo') + h2(n, 'Comprender antes que <span class="it">silenciar.</span>', 21)
                 + para('La terapia puede abrir un tiempo distinto: detenerse, poner en palabras y comprender qué lugar ocupa el malestar dentro de la propia historia.')
                 + f'<img class="photo" src="{photo("nahuel", "lectura")}" style="left:0;right:0;bottom:0;width:100%;height:92mm" alt="">'),
        'back': (f'<div style="display:flex;flex-direction:column;height:100%">' + kick(n, 'Primera consulta')
                 + h2(n, 'Puedes empezar <span class="it">por escribir.</span>', 20)
                 + para('No es necesario tener todo claro de antemano. Cuéntame brevemente qué te lleva a consultar y coordinamos una primera entrevista.')
                 + contact_block(n, pn) + '</div>'),
        'front': (f'<img class="photo" src="{photo("nahuel", "retrato")}" style="left:0;right:0;top:0;width:100%;height:128mm" alt="">'
                  + f'<div class="abs" style="left:{11}mm;right:{11 + B}mm;top:136mm">{logo("Nahuel-Ponce", "Logo-Principal_Negativo", width="52mm")}'
                  + f'<p class="serif" style="font-size:15pt;line-height:1.15;margin-top:7mm;color:{n["on_dark"]}">Un espacio para escuchar <span class="it" style="color:{n["soft"]}">lo que insiste.</span></p></div>'),
        'front_style': f'background:{n["dark"]}',
        'in1': (kick(n, 'Enfoque terapéutico') + h2(n, 'Lo que aparece como síntoma <span class="it">también tiene una historia.</span>')
                + para('Trabajo desde una perspectiva psicoanalítica, ofreciendo un espacio de escucha orientado a comprender aquello que está detrás del malestar y de las situaciones que tienden a repetirse.')
                + para('El trabajo terapéutico permite profundizar en la historia, los vínculos y las experiencias particulares de cada persona. Cada proceso se construye de manera individual, respetando los tiempos y la singularidad de quien consulta.')
                + f'<img class="photo" src="{photo("nahuel", "calle")}" style="left:0;right:0;bottom:0;width:100%;height:70mm" alt="">'),
        'in2': (kick(n, 'Motivos de consulta') + h2(n, 'Cuando algo se vuelve difícil de sostener.', 17)
                + numbered(n, ['Ansiedad y angustia', 'Vínculos y apego', 'Duelo y pérdidas', 'Crisis y cambios', 'Trauma', 'Manifestaciones psicosomáticas', 'Identidad y migración'])
                + f'<p class="serif it" style="margin-top:12mm;font-size:13pt;line-height:1.3;color:{n["accent"]}">No hace falta tener una explicación cerrada. El motivo inicial puede ser concreto o apenas una sensación de que algo no está funcionando.</p>'),
        'in3': (kick(n, 'Servicios', n['soft']) + h2({**n, 'ink': n['on_dark']}, 'Un proceso pensado <span class="it">para cada persona.</span>', 17)
                + services({**n, 'soft': '#4B4B4B'}, [('Psicoterapia individual', '45 min · presencial u online'), ('Sesión con tarifa flexible', '1 hora · desde 40 €'),
                                                      ('Supervisión clínica', '1 hora · presencial u online'), ('Supervisión grupal', '2 horas · presencial u online')])
                + f'<p class="body" style="margin-top:6mm;color:{n["soft"]}">Presencial en Barcelona (Gràcia) y online. Sesiones en español y en portugués. Principalmente adultos.</p>'),
        'in3_style': f'background:{n["dark"]};color:{n["on_dark"]}',
    }

    # ---------------- Sol
    C['sol'] = {
        'flap': (kick(s, 'Sobre mí') + h2(s, 'Empezar de nuevo <span class="it">puede moverlo todo.</span>', 21)
                 + para('Soy psicóloga clínica habilitada para ejercer en España, con formación en psicoanálisis y siete años de experiencia con adultos y jóvenes, online y presencial.')
                 + para('Transitar un país nuevo, un idioma nuevo y reconstruir el sentido de pertenencia no es algo que sólo estudie en consulta: es algo que he vivido.')
                 + f'<img class="photo" src="{photo("sol", "consulta")}" style="left:0;right:0;bottom:0;width:100%;height:86mm" alt="">'),
        'back': (f'<div style="display:flex;flex-direction:column;height:100%">' + kick(s, 'Primera consulta')
                 + h2(s, 'Empecemos por <span class="it">una conversación.</span>', 20)
                 + para('Cuéntame brevemente qué te lleva a consultar y coordinamos un primer encuentro, en Barcelona u online.')
                 + contact_block(s, ps) + '</div>'),
        'front': (f'<img class="photo" src="{photo("sol", "retrato")}" style="left:0;right:0;top:0;width:100%;height:120mm" alt="">'
                  + blob(s['sage'], BLOB_A, 0, 104, 44, 24)
                  + f'<div class="abs" style="left:11mm;right:{11 + B}mm;top:136mm">{logo("Sol-Galiana", "Logo-Principal_Positivo", width="66mm")}'
                  + f'<p class="serif" style="font-size:16pt;line-height:1.15;margin-top:7mm">Un lugar propio, <span class="it" style="color:{s["accent"]}">también lejos de casa.</span></p></div>'),
        'in1': (kick(s, 'Lo que podemos trabajar') + h2(s, 'Lo universal y lo que aparece <span class="it">al empezar en otro lugar.</span>', 17)
                + numbered(s, ['Ansiedad y estrés', 'Identidad y choque cultural', 'Nostalgia del país de origen', 'Soledad y pertenencia', 'Autoestima', 'Relaciones y vínculos', 'Pérdidas y duelo'], roman=False)
                + f'<p class="serif it" style="margin-top:12mm;font-size:14pt;line-height:1.3;color:{s["accent"]}">Puedes llegar con un motivo claro o con una sensación difícil de nombrar.</p>'),
        'in2': (kick(s, 'Enfoque psicoanalítico') + h2(s, 'Menos «aquí tienes una tarea». <span class="it">Más ir a lo que hay debajo.</span>', 16)
                + para('Profundizo en aquello que subyace a la ansiedad, el estrés, los patrones vinculares o el duelo, y no sólo en sus manifestaciones más visibles. Cada proceso se construye contigo, a tu ritmo.')
                + f'<div style="margin-top:6mm;padding:5mm;border-radius:6mm;background:{s["soft"]}">' + kick(s, 'Un espacio abierto', s['ink'])
                + para('Cálido y respetuoso con todas las identidades de género y orientaciones sexuales, incluidas las personas LGBTQ+. Sesiones en español (lengua materna) o en inglés (fluido).', mb=0) + '</div>'),
        'in3': (kick(s, 'Servicios', s['on_dark']) + h2({**s, 'ink': s['on_dark']}, 'Formas de <span class="it">encontrarnos.</span>', 18)
                + services({**s, 'soft': '#6b7268', 'accent': s['soft']}, [('Psicoterapia individual', '45 min · presencial u online'), ('Sesión con tarifa flexible', '1 hora · valor a conversar'),
                                                                         ('Supervisión clínica individual', '1 hora · presencial u online'), ('Supervisión grupal', '2 horas · presencial u online')])
                + f'<p class="body" style="margin-top:6mm;color:{s["on_dark"]}">Presencial en Barcelona (Gràcia) y online desde cualquier país.</p>'),
        'in3_style': f'background:{s["dark"]};color:{s["on_dark"]}',
    }

    # ---------------- Psicoanálisis en Barcelona
    def mini(p, img, lang):
        return (f'<div style="display:flex;gap:4mm;padding:3mm 0;border-top:.2mm solid {c["soft"]}"><img src="{photo("conjunta", img)}" style="width:24mm;height:30mm;object-fit:cover;border-radius:12mm 12mm 1mm 1mm" alt="">'
                f'<div><p class="serif" style="font-size:12pt;line-height:1.1">{p["name"]}</p><p style="font-size:6.2pt;letter-spacing:.12em;text-transform:uppercase;color:{c["accent"]};margin:1mm 0 1.5mm">{p["role"]}</p>'
                f'<p style="font-size:7.2pt;line-height:1.5">{lang}<br>{p["phone"]}<br>{p["email"]}</p></div></div>')
    C['conjunta'] = {
        'flap': (kick(c, 'Vivir lejos del lugar de origen') + h2(c, 'Mudarse no es sólo <span class="it">cambiar de lugar.</span>', 20)
                 + para('Comenzar una vida en otro país puede implicar entusiasmo y nuevas posibilidades, pero también pérdidas, contradicciones y preguntas difíciles de compartir.')
                 + para('Tenemos especial experiencia con personas migrantes, expatriadas y estudiantes internacionales: identidad, pertenencia, distancia con los vínculos de origen y nuevos proyectos.')
                 + f'<img class="photo" src="{photo("conjunta", "espacio")}" style="left:0;right:0;bottom:0;width:100%;height:80mm" alt="">'),
        'back': (f'<div style="display:flex;flex-direction:column;height:100%">' + kick(c, 'Contacto directo') + h2(c, 'Elige con quién <span class="it">quieres empezar.</span>', 19)
                 + mini(ps, 'sol', 'Español · English') + mini(pn, 'nahuel', 'Español · Português')
                 + f'<div style="margin-top:auto;display:flex;align-items:flex-end;gap:5mm">{qr(web_c, c["ink"], "20mm")}<p style="font-size:7.4pt;line-height:1.5">{web_c}<br><span style="color:{c["accent"]}">Gràcia · Online</span></p></div></div>'),
        'front': (f'<img class="photo" src="{photo("conjunta", "aquiyahora")}" style="left:14mm;right:{14 + B}mm;top:{14 + B}mm;width:{100 + B - 28 - B}mm;height:96mm;border-radius:40mm 40mm 2mm 2mm" alt="">'
                  + f'<div class="abs" style="left:0;right:{B}mm;top:124mm;display:flex;justify-content:center">{logo("Psicoanalisis-en-Barcelona", "Logo-Principal_Positivo", width="64mm")}</div>'
                  + f'<p class="serif abs" style="left:12mm;right:{12 + B}mm;top:178mm;text-align:center;font-size:14pt;line-height:1.2">Dos recorridos. <span class="it" style="color:{c["accent"]}">Una escucha compartida.</span></p>'),
        'in1': (kick(c, 'Nuestro enfoque') + h2(c, 'No hay una fórmula general para <span class="it">una historia singular.</span>', 17)
                + para('Más que centrarnos únicamente en eliminar un síntoma, buscamos comprender qué lugar ocupa dentro de la experiencia de cada persona.')
                + numbered(c, ['<b>Escucha.</b> Un espacio profesional, cercano y respetuoso para hablar con libertad.',
                               '<b>Singularidad.</b> Sin soluciones predeterminadas: cada proceso se construye a medida.',
                               '<b>Profundidad.</b> Comprender cómo se articula el malestar con tu historia y tus vínculos.'], roman=False, size=7.6)),
        'in2': (kick(c, 'Motivos de consulta') + h2(c, 'A veces hay un motivo claro. <span class="it">A veces sólo algo que insiste.</span>', 16)
                + numbered(c, ['Ansiedad, angustia y estrés', 'Vínculos y conflictos relacionales', 'Autoestima e identidad', 'Duelo, pérdidas y separaciones',
                               'Crisis y momentos de cambio', 'Procesos migratorios', 'Soledad y desarraigo'], roman=False, size=7.8)
                + f'<div style="margin-top:9mm">' + kick(c, 'Cómo empezar')
                + ''.join(f'<p class="body" style="margin-bottom:2mm"><span class="serif it" style="color:{c["accent"]};font-size:10pt">{i}.</span> <b>{a}</b> {b}</p>' for i, (a, b) in enumerate([('Escribes', 'por WhatsApp o email, con pocas palabras alcanza.'), ('Coordinamos', 'día, modalidad e idioma.'), ('Conversamos', 'en una primera sesión para conocernos.')], 1))
                + '</div>'),
        'in3': (kick(c, 'Servicios', c['soft']) + h2({**c, 'ink': c['on_dark']}, 'Presencial en Barcelona. <span class="it">Online desde donde estés.</span>', 16)
                + services({**c, 'soft': '#6a7064', 'accent': c['soft']}, [('Psicoterapia individual', '45 min · presencial u online'), ('Tarifa flexible', '1 hora · valor a conversar'),
                                                                         ('Supervisión clínica', '1 hora · individual'), ('Supervisión grupal', '2 horas · en formación')])
                + f'<p class="body" style="margin-top:6mm;color:{c["on_dark"]}">En español, inglés y portugués. Consulta honorarios y disponibilidad con cada profesional.</p>'),
        'in3_style': f'background:{c["dark"]};color:{c["on_dark"]}',
    }
    return C


CONTENT = build_content()


# ------------------------------------------------------------------ Stickers Ø50 mm

def stickers(key):
    t = THEMES[key]
    f = t['folder']
    W = H = 50 + 2 * B
    if key == 'nahuel':
        variants = [(t['bg'], logo(f, 'Monograma_Positivo', '24mm')), (t['accent'], logo(f, 'Monograma_Taupe', '24mm')), (t['dark'], logo(f, 'Monograma_Negativo', '24mm'))]
    elif key == 'sol':
        variants = [(t['bg'], logo(f, 'Logo-con-Simbolo_Positivo', width='34mm')),
                    (t['sage'], f'<p class="serif" style="text-align:center;font-size:17pt;line-height:1.05;color:{t["on_dark"]}">Un lugar<br><span class="it">propio</span></p>'),
                    (t['accent'], logo(f, 'Monograma_Mono-Blanco', '22mm'))]
    else:
        variants = [(t['bg'], logo(f, 'Logo-Principal_Positivo', width='36mm')),
                    (t['accent'], f'<p class="serif" style="text-align:center;font-size:19pt;line-height:1;color:{t["on_dark"]}">Aquí<br><span class="it">y ahora</span></p>'),
                    (t['dark'], f'<p class="serif" style="text-align:center;font-size:12.5pt;line-height:1.15;color:{t["on_dark"]}">Dos recorridos.<br><span class="it">Una escucha<br>compartida.</span></p>')]
    sheets = [f'<div class="sheet" style="background:{bg}"><div class="abs" style="inset:0;display:flex;align-items:center;justify-content:center">{inner}</div></div>' for bg, inner in variants]
    sheets.append(f'''<div class="sheet" style="background:#fff"><svg class="abs" style="inset:0" viewBox="0 0 {W} {H}" width="{W}mm" height="{H}mm">
  <circle cx="{W / 2}" cy="{H / 2}" r="25" fill="none" stroke="#e6007e" stroke-width=".25"/></svg>
  <p class="abs" style="left:0;right:0;top:{H / 2 - 3}mm;text-align:center;font-size:6pt;color:#e6007e">Línea de corte Ø 50 mm<br>(sangrado 3 mm en las otras páginas)</p></div>''')
    return html(t, W, H, sheets, f'Stickers · {f}')


if __name__ == '__main__':
    canva = '--canva' in sys.argv
    common.MODE['canva'] = canva
    suffix = '_canva' if canva else ''
    if canva:
        CONTENT.clear(); CONTENT.update(build_content())
    for key in THEMES:
        f = THEMES[key]['folder']
        for kind, fn in (('Tarjeta', card), ('Triptico', triptych), ('Stickers', stickers)):
            doc = fn(key)
            if canva:  # cada hoja es una página de Canva; sin la página de guía de corte
                doc = doc.replace('<div class="sheet"', '<div class="sheet" data-document-role="page"')
                doc = doc.split('<div class="sheet" data-document-role="page" style="background:#fff">')[0] + ('</body></html>' if kind == 'Stickers' else '')
            (OUT / f'{f}_{kind}{suffix}.html').write_text(doc, encoding='utf-8')
    print('ok')
