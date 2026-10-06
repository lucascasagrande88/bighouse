#!/usr/bin/env python3
"""Genera el HTML del manual de cada web (después se imprime a PDF con print_pdf.mjs).

Uso: python3 _build/kit/build_kit.py <carpeta-capturas> <carpeta-salida>
Las capturas salen de _build/kit/tutorial.mjs.
"""
import base64
import re
import sys
import time
from pathlib import Path

from jinja2 import Environment, FileSystemLoader

ROOT = Path(__file__).resolve().parents[2]
media, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2]).resolve()
out.mkdir(parents=True, exist_ok=True)
MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
t = time.localtime()
DATE = f"{t.tm_mday} de {MESES[t.tm_mon - 1]} de {t.tm_year}"

COMMON_CHANGES = [
    'Panel de control privado con contraseña para editar los textos.',
    'Las direcciones exactas de los consultorios ya no se publican: sólo el barrio (Gràcia y Sants).',
]

KITS = {
    'sol': {
        'name': 'Sol Galiana', 'client': 'Sol Galiana', 'url': 'https://sol-galiana-psicologia.netlify.app',
        'accent': '#2f4a3b', 'accent2': '#b4593c', 'paper': '#f6efe4', 'cover_ink': '#2b2622',
        'serif': "'Fraunces', Georgia, serif", 'sans': "'Figtree', Arial, sans-serif",
        'langs_text': 'Español e inglés', 'pages_text': 'Portada en dos idiomas, privacidad y página de error.',
        'has_instagram': True, 'blog': False,
        'changes': COMMON_CHANGES + ['Las fotos del consultorio quedan reunidas en la sección «Dónde atiendo».'],
    },
    'nahuel': {
        'name': 'Nahuel Ponce', 'client': 'Nahuel Ponce', 'url': 'https://nahuel-psicologia-barcelona.netlify.app',
        'accent': '#141413', 'accent2': '#8a8170', 'paper': '#0e0e0d', 'cover_ink': '#efe9dd',
        'serif': "'Cormorant Garamond', Garamond, serif", 'sans': "'Manrope', Arial, sans-serif",
        'langs_text': 'Español y portugués', 'pages_text': 'Portada en dos idiomas, privacidad y página de error.',
        'has_instagram': False, 'blog': False,
        'changes': COMMON_CHANGES,
    },
    'conjunta': {
        'name': 'Psicoanálisis en Barcelona', 'client': 'Sol Galiana y Nahuel Ponce', 'url': 'https://psicoanalisis-en-barcelona.netlify.app',
        'accent': '#6b2635', 'accent2': '#9b4a55', 'paper': '#f3eee6', 'cover_ink': '#1f1c19',
        'serif': "'Instrument Serif', Georgia, serif", 'sans': "'Hanken Grotesk', Arial, sans-serif",
        'langs_text': 'Español, inglés y portugués', 'pages_text': 'Portada en tres idiomas, blog con 3 artículos, privacidad y página de error.',
        'has_instagram': False, 'blog': True,
        'changes': COMMON_CHANGES,
    },
}

STEPS = [
    ('entrar', 'Entra al panel', 'Abre la dirección de tu web seguida de /admin y escribe tu contraseña. «Mostrar» te deja ver lo que escribes.'),
    ('panel', 'Conoce la pantalla', 'A la izquierda, los textos de la página agrupados por sección. A la derecha, la vista previa: así se verá la web.'),
    ('clic-en-texto', 'Haz clic en un texto', 'Al pasar el ratón por la vista previa, los textos editables se marcan. Un clic abre su casilla a la izquierda. También puedes usar el buscador.'),
    ('escribir', 'Escribe', 'El cambio se ve al instante en la vista previa, marcado como «Sin guardar». Todavía no está publicado.'),
    ('cursiva', 'Cursiva y negrita', 'Selecciona una o más palabras y pulsa «Cursiva» o «Negrita». En los títulos, la cursiva es la parte de otro color.'),
    ('guardar', 'Guarda y publica', 'Cuando termines, pulsa «Guardar y publicar». La web se actualiza en menos de un minuto. «Descartar» borra lo que no guardaste.'),
    ('volver-original', 'Vuelve al texto original', 'Cada casilla modificada tiene «Volver al texto original» para recuperar el texto que entregamos.'),
    ('historial', 'Historial de versiones', 'Cada guardado deja la versión anterior en el Historial (las últimas 30). «Volver a esta versión» la recupera.'),
    ('paginas', 'Otras páginas e idiomas', 'En el menú de arriba eliges qué página editar: cada idioma{blog} y la privacidad.'),
    ('contacto', 'Datos de contacto', 'En «Contacto» cambias teléfono y email una sola vez y se actualizan en toda la web, incluidos los botones de WhatsApp.'),
    ('google', 'Cómo te ve Google', 'En «Google» defines el título y la descripción de la página en los buscadores y al compartirla por WhatsApp.'),
    ('contrasena', 'Tu contraseña', 'Desde «Contraseña» la cambias cuando quieras (mínimo 10 caracteres). Hazlo la primera vez que entres.'),
]
PAGE_TITLES = [('02 · Paso a paso', 'Cambiar un texto'), ('02 · Paso a paso', 'Formato y guardado'),
               ('03 · Deshacer y navegar', 'Nada se pierde'), ('04 · Más opciones', 'Contacto, Google y contraseña')]


def fonts_css(key):
    css = (ROOT / key / 'public/fonts.css').read_text()

    def embed(m):
        data = base64.b64encode((ROOT / key / 'public/fonts' / m.group(1)).read_bytes()).decode()
        return f"url('data:font/woff2;base64,{data}')"
    return re.sub(r"url\('/fonts/([^']+)'\)", embed, css)


env = Environment(loader=FileSystemLoader(Path(__file__).parent), autoescape=True)
tpl = env.get_template('manual.html')
for key, k in KITS.items():
    imgs = {p.stem.split('-tut-')[1].split('-', 1)[1] if p.stem.split('-tut-')[1][:2].isdigit() else p.stem.split('-tut-')[1]: p
            for p in media.glob(f'{key}-tut-*.png')}
    steps = []
    for i, (img, title, desc) in enumerate(STEPS, 1):
        if key == 'sol' and img == 'contacto':
            desc = desc.replace('teléfono y email', 'teléfono, email e Instagram')
        desc = desc.replace('{blog}', ', el blog y cada artículo' if k['blog'] else '')
        steps.append({'n': i, 't': title, 'd': desc, 'img': imgs[img].as_uri()})
    k = {**k, 'host': k['url'].replace('https://', ''), 'host_wbr': k['url'].replace('https://', '').replace('.', '<wbr>.').replace('-', '-<wbr>'), 'title': f"Kit de entrega · {k['name']}",
         'video': f'Tutorial-panel-{key}.mp4',
         'step_pages': [{'kicker': kc, 'title': tt, 'steps': steps[i * 3:i * 3 + 3]} for i, (kc, tt) in enumerate(PAGE_TITLES)],
         'mobile_edit': imgs['movil-editar'].as_uri(), 'mobile_view': imgs['movil-vista'].as_uri()}
    (out / f'manual-{key}.html').write_text(tpl.render(k=k, fonts=fonts_css(key), date=DATE), encoding='utf-8')
    print('ok', key)
