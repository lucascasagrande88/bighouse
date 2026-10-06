#!/usr/bin/env python3
"""Manual de marca (A4 apaisado) de cada marca, reconstruido en vector con datos y fotos reales.
Uso: python3 marca/_build/manual.py  → out/<Marca>_Manual.html ; render.mjs lo imprime a PDF."""
from pathlib import Path

from common import MARCA, PEOPLE, fonts_css, logo, photo

OUT = Path(__file__).resolve().parent / 'out'
W, H = 297, 210


def rgb(hexv):
    h = hexv.lstrip('#')
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def cmyk(hexv):
    r, g, b = [v / 255 for v in rgb(hexv)]
    k = 1 - max(r, g, b)
    if k >= 1:
        return (0, 0, 0, 100)
    c, m, y = [(1 - v - k) / (1 - k) for v in (r, g, b)]
    return tuple(round(v * 100) for v in (c, m, y, k))


BRANDS = {
    'nahuel': {
        'folder': 'Nahuel-Ponce', 'name': 'Nahuel Ponce', 'site': 'nahuel',
        'serif': 'Cormorant Garamond', 'sans': 'Manrope', 'bg': '#F2EFEA', 'ink': '#232323', 'muted': '#4B4B4B', 'accent': '#8D7D70', 'soft': '#D9D3CB',
        'role': 'Psicólogo General Sanitario · Barcelona y online',
        'tagline': 'Un espacio para escuchar <em>lo que insiste.</em>',
        'cover_photo': 'retrato',
        'essence': 'Nahuel Ponce acompaña procesos de ansiedad, vínculos, duelo, crisis, migración y malestar subjetivo desde una escucha sobria, profunda y singular. Su marca transmite pensamiento, presencia, precisión y un espacio de trabajo donde cada historia puede desplegarse sin apuro.',
        'personality': ['Sobria', 'Precisa', 'Editorial', 'Humana', 'Reflexiva', 'Serena'],
        'values': [('Escucha', 'Dar lugar antes que responder.'), ('Profundidad', 'Ir a lo que subyace.'), ('Singularidad', 'Cada historia tiene su forma.'), ('Claridad', 'Decir con precisión, sin exceso.')],
        'territory_title': 'Comprender <em>antes que silenciar.</em>',
        'territory': 'La marca de Nahuel se construye alrededor de la escucha, la repetición y la elaboración subjetiva. La comunicación no busca calmar rápidamente ni ofrecer fórmulas, sino abrir un espacio para pensar lo que insiste y encontrar una posición propia frente a ello.',
        'pillars': [('Escuchar', 'Hacer lugar a lo que aparece.'), ('Insistir', 'Leer lo que se repite.'), ('Comprender', 'Volver sobre la propia historia.'), ('Elaborar', 'Abrir una nueva posición.')],
        'positioning': 'Una psicoterapia sobria y contemporánea para quienes buscan poner en palabras aquello que insiste, en Barcelona o a distancia.',
        'territory_photo': 'lectura',
        'logos': [('Logo-Principal', 'Logo principal', 'Versión principal de la marca. Web, documentos, presentaciones y aplicaciones institucionales.'),
                  ('Logo-Secundario', 'Logo secundario', 'Para espacios reducidos o contextos donde se requiere una composición más compacta.'),
                  ('Monograma', 'Monograma', 'Símbolo de identificación: favicon, perfil de redes, sello y cierre de piezas.')],
        'horizontal': 'Logo-Horizontal',
        'variants': ['Positivo', 'Negativo', 'Taupe', 'Mono-Negro'],
        'min_sizes': [('Logo-Horizontal', 'Horizontal', '40 mm · 180 px'), ('Logo-Principal', 'Principal', '24 mm · 120 px'), ('Monograma', 'Monograma', '8 mm · 32 px')],
        'clear': 'El área de seguridad equivale a la altura de la N del monograma. Ningún texto, imagen o borde debe invadirla.',
        'palette': [('Hueso', '#F2EFEA', 35, 'Base principal y fondos amplios.'), ('Niebla', '#D9D3CB', 25, 'Fondos secundarios y bloques.'),
                    ('Tinta', '#232323', 15, 'Tipografía principal y contraste.'), ('Grafito', '#4B4B4B', 15, 'Textos secundarios y reglas.'), ('Taupe', '#8D7D70', 10, 'Acentos y detalles.')],
        'type_words': 'Escucha · Precisión · Tiempo',
        'resources': [('Monograma N', 'Signo de identificación y cierre.'), ('Numeración romana', 'Orden, secuencia y tono editorial.'),
                      ('Reglas finas', 'Estructura y respiración visual.'), ('Fotografía en blanco y negro', 'Ciudad, lectura, presencia.')],
        'resources_principle': 'Menos adorno, <em>más estructura.</em>',
        'photo_title': 'Imágenes honestas <em>y silenciosas.</em>',
        'photo_text': 'Fotografía en blanco y negro, con grano y luz natural: la ciudad, la lectura, la presencia de Nahuel. Siempre fotos reales: él, sus espacios y su Barcelona.',
        'photo_do': ['Blanco y negro con contraste suave', 'Retratos reales, sin poses forzadas', 'Ciudad y arquitectura como contexto', 'Encuadres con aire y asimetría'],
        'photo_dont': ['Fotos de stock o generadas', 'Clichés de psicología (cerebros, puzzles, manos)', 'Colores saturados o filtros fuertes'],
        'photos': ['ciudad', 'calle', 'noche'],
        'voice': 'La voz de Nahuel habla con precisión, calma y profundidad. No simplifica en exceso ni promete soluciones rápidas: propone una escucha rigurosa y un espacio donde algo de la experiencia pueda ser dicho y pensado.',
        'voice_words': ['Precisa', 'Serena', 'Sobria', 'Reflexiva'],
        'voice_yes': ['Frases que abren pensamiento', 'Lenguaje claro, sin grandilocuencia', 'Tono humano y profesional'],
        'voice_no': ['Promesas rápidas o efectistas', 'Tono motivacional o excesivamente blando', 'Mensajes impersonales o abstractos'],
        'voice_examples': ['No se trata de silenciar el síntoma, sino de escucharlo.', 'Poner en palabras también es una forma de abrir espacio.', 'Cada historia merece su tiempo.'],
        'do': ['Usar composiciones limpias y estructuradas', 'Priorizar contraste tipográfico y aire', 'Elegir imágenes honestas y silenciosas', 'Sostener un tono preciso y humano', 'Favorecer la lectura antes que el ornamento'],
        'dont': ['Deformar, inclinar o recolorear el logo', 'Sobrecargar con recursos visuales', 'Usar clichés de psicología o bienestar', 'Escribir con grandilocuencia', 'Perder estructura, margen o jerarquía'],
        'closing': 'Una marca que escucha, <em>ordena y da lugar.</em>',
        'people': ['nahuel'], 'social': True,
    },
    'sol': {
        'folder': 'Sol-Galiana', 'name': 'Sol Galiana', 'site': 'sol',
        'serif': 'Cormorant Garamond', 'sans': 'Figtree', 'bg': '#F4F0E8', 'ink': '#4A4F48', 'muted': '#5f645c', 'accent': '#C58E72', 'soft': '#DCC9B7', 'sage': '#A9B39F',
        'role': 'Psicóloga clínica · Barcelona y online',
        'tagline': 'Un lugar propio, <em>también lejos de casa.</em>',
        'cover_photo': 'retrato',
        'essence': 'Sol Galiana acompaña procesos de ansiedad, identidad, vínculos, migración y duelo desde una escucha cálida, contemporánea y profundamente humana. Su marca transmite contención, pertenencia y la posibilidad de encontrar un lugar propio, también lejos de casa.',
        'personality': ['Cálida', 'Cercana', 'Contemporánea', 'Humana', 'Inclusiva', 'Serena'],
        'values': [('Escucha', 'Comprender antes que simplificar.'), ('Pertenencia', 'Crear un espacio donde sentirse en casa.'), ('Apertura', 'Respeto por todas las identidades y recorridos.'), ('Claridad', 'Comunicar con calma, honestidad y sensibilidad.')],
        'territory_title': 'Un lugar propio, <em>también lejos de casa.</em>',
        'territory': 'La marca de Sol se construye alrededor de las experiencias emocionales de quienes atraviesan cambios, desplazamientos y búsquedas de pertenencia. La comunicación no parte únicamente del síntoma, sino del recorrido subjetivo de cada persona.',
        'pillars': [('Llegar', 'El impacto de lo nuevo.'), ('Extrañar', 'La nostalgia y lo que se deja atrás.'), ('Pertenecer', 'Encontrar lugar e identidad.'), ('Quedarse', 'Construir continuidad y arraigo.')],
        'positioning': 'Una psicología cercana y contemporánea para personas que buscan comprender lo que les pasa y encontrar un espacio propio, en Barcelona o a distancia.',
        'territory_photo': 'cafe',
        'logos': [('Logo-Principal', 'Logo principal', 'Logotipo con descriptor. Uso preferente en web, papelería y comunicación institucional.'),
                  ('Logo-con-Simbolo', 'Logo con símbolo', 'El sol que sale sobre el horizonte acompaña al nombre en piezas protagonistas.'),
                  ('Monograma', 'Monograma', 'Iniciales SG para perfiles, sellos, favicon y formatos reducidos.')],
        'horizontal': 'Logo-Principal',
        'variants': ['Positivo', 'Negativo', 'Sage', 'Mono-Negro'],
        'min_sizes': [('Logo-Principal', 'Principal', '25 mm · 100 px'), ('Logo-Vertical', 'Vertical', '20 mm · 80 px'), ('Monograma', 'Monograma', '12 mm · 35 px')],
        'clear': 'El área de seguridad equivale a la altura de la letra S del logotipo. Ningún texto, imagen o borde debe invadirla.',
        'palette': [('Cream', '#F4F0E8', 35, 'Base principal para fondos.'), ('Sage', '#A9B39F', 30, 'Calidez, naturaleza y formas.'),
                    ('Sand', '#DCC9B7', 20, 'Bloques y profundidad.'), ('Terracotta', '#C58E72', 10, 'Acento puntual: el sol.'), ('Charcoal', '#4A4F48', 5, 'Tipografía y contraste.')],
        'type_words': 'Escucha · Pertenencia · Calma',
        'resources': [('El sol que sale', 'Símbolo de la marca: un comienzo.'), ('Formas orgánicas', 'Envolventes, inspiradas en el refugio.'),
                      ('Líneas fluidas', 'Recorridos sutiles que conectan.'), ('Marcos suaves', 'Esquinas redondeadas para fotos y mensajes.')],
        'resources_principle': 'Menos ornamento, <em>más respiración visual.</em>',
        'photo_title': 'Intimidad, luz natural <em>y refugio.</em>',
        'photo_text': 'Se priorizan espacios reales, materiales nobles y retratos honestos de Sol, evitando clichés clínicos o una estética fría. Las fotos del consultorio se reservan para hablar de dónde atiende.',
        'photo_do': ['Luz suave y natural', 'Interiores cálidos y habitables', 'Retratos honestos y cercanos', 'Plantas, textiles, madera'],
        'photo_dont': ['Estética hospitalaria', 'Fotos de stock o generadas', 'Poses forzadas o exceso de retoque'],
        'photos': ['cercana', 'escucha', 'sofa'],
        'voice': 'La voz de Sol habla con sensibilidad, claridad y cercanía. Invita a poner en palabras lo que pasa, sin grandilocuencia ni tecnicismos innecesarios.',
        'voice_words': ['Cálida', 'Serena', 'Clara', 'Respetuosa'],
        'voice_yes': ['Frases que acompañan y abren conversación', 'Lenguaje humano y contemporáneo', 'Mensajes inclusivos y hospitalarios'],
        'voice_no': ['Tono excesivamente clínico o frío', 'Promesas grandilocuentes', 'Mensajes impersonales'],
        'voice_examples': ['Empecemos por una conversación.', 'Tu identidad no necesita traducción.', 'Un espacio cálido para comprender lo que te pasa.'],
        'do': ['Dejar aire alrededor del logo', 'Usar el terracota sólo como acento', 'Combinar formas orgánicas con mucho espacio', 'Usar fotos reales de Sol', 'Escribir en español o inglés con el mismo tono'],
        'dont': ['Deformar, inclinar o recolorear el logo', 'Llenar la pieza de formas y colores', 'Usar fotos de stock o de otras personas', 'Publicar la dirección exacta del consultorio', 'Sustituir las tipografías por otras'],
        'closing': 'Una marca que acompaña, <em>abre y da lugar.</em>',
        'people': ['sol'], 'social': False,
    },
    'conjunta': {
        'folder': 'Psicoanalisis-en-Barcelona', 'name': 'Psicoanálisis en Barcelona', 'site': 'conjunta',
        'serif': 'Fraunces', 'sans': 'Hanken Grotesk', 'bg': '#F4EEE5', 'ink': '#2E2D2A', 'muted': '#4E5448', 'accent': '#B76D4F', 'soft': '#D8CFC2', 'sage': '#8E9578',
        'role': 'Sol Galiana · Nahuel Ponce',
        'tagline': 'Dos recorridos. <em>Una escucha compartida.</em>',
        'cover_photo': 'aquiyahora',
        'essence': 'Somos dos profesionales que compartimos una forma de entender la terapia basada en la escucha, la singularidad y la profundidad. Dos recorridos que se encuentran para ofrecer un espacio de pensamiento, cuidado y transformación, en Barcelona y online, en español, inglés y portugués.',
        'personality': ['Cálida', 'Profunda', 'Clara', 'Humana', 'Plural', 'Serena'],
        'values': [('Escucha', 'Un espacio atento y sin juicios.'), ('Singularidad', 'Cada historia merece su tiempo.'), ('Profundidad', 'Más allá del síntoma.'), ('Encuentro', 'Dos recorridos, una misma ética.')],
        'territory_title': 'Un lugar <em>para empezar.</em>',
        'territory': 'La marca reúne dos trayectorias que se cruzan: dos profesionales con títulos homologados en España, formación en psicoanálisis y más de siete años de experiencia clínica. La comunicación invita a elegir con quién empezar, en qué idioma y de qué forma.',
        'pillars': [('Escucha', 'Hablar con libertad.'), ('Singularidad', 'Sin fórmulas generales.'), ('Profundidad', 'Comprender la propia historia.'), ('Encuentro', 'Dos miradas, un espacio.')],
        'positioning': 'Psicoterapia psicoanalítica en Barcelona y online para adultos y jóvenes, con especial experiencia en personas migrantes, expatriadas y estudiantes internacionales.',
        'territory_photo': 'espacio',
        'logos': [('Logo-Principal', 'Logo principal', 'Símbolo, nombre y profesionales. Uso preferente en web, papelería y presentaciones.'),
                  ('Logo-Secundario', 'Logo secundario', 'Versión sin descriptor para lecturas rápidas: redes, sellos y piezas pequeñas.'),
                  ('Monograma', 'Monograma', 'Iniciales P/B para perfiles, favicon y detalles.')],
        'horizontal': 'Logo-Horizontal', 'cover_logo': 'Logo-Principal', 'cover_logo_w': '86mm',
        'variants': ['Positivo', 'Negativo', 'Terracota', 'Mono-Negro'],
        'min_sizes': [('Logo-Horizontal', 'Horizontal', '45 mm · 200 px'), ('Logo-Principal', 'Principal', '25 mm · 110 px'), ('Monograma', 'Monograma', '10 mm · 32 px')],
        'clear': 'El área de seguridad equivale a la altura de la onda de los trazos. Ningún texto, imagen o borde debe invadirla.',
        'palette': [('Crema', '#F4EEE5', 35, 'Calma y claridad. Fondo base.'), ('Arena', '#D8CFC2', 20, 'Equilibrio y serenidad.'), ('Oliva suave', '#8E9578', 12, 'Escucha y presencia.'),
                    ('Verde profundo', '#4E5448', 15, 'Profundidad y cuidado.'), ('Terracota', '#B76D4F', 10, 'Calidez y humanidad.'), ('Carbón', '#2E2D2A', 8, 'Estabilidad y legibilidad.')],
        'type_words': 'Carácter · Calidez · Claridad',
        'resources': [('Dos trazos', 'Dos trayectorias que se encuentran.'), ('Arcos', 'Marcos para fotos: una puerta, una escucha.'),
                      ('Numeración', 'Orden editorial 01, 02, 03.'), ('Separadores finos', 'Estructura sin peso visual.')],
        'resources_principle': 'Dos recorridos, <em>un mismo lenguaje.</em>',
        'photo_title': 'Interiores habitados, <em>luz natural.</em>',
        'photo_text': 'Fotografía real de los consultorios y de Sol y Nahuel. Tonos cálidos, plantas, madera y libros. Barcelona sin cliché turístico.',
        'photo_do': ['Luz natural y tonos cálidos', 'Interiores reales y habitados', 'Retratos de ambos profesionales', 'Plantas, madera, libros'],
        'photo_dont': ['Postales turísticas de Barcelona', 'Fotos de stock o generadas', 'Ambientes fríos u hospitalarios'],
        'photos': ['sol-escucha', 'nahuel-lectura', 'rincon'],
        'voice': 'La voz de Psicoanálisis en Barcelona habla en plural, con calidez y precisión. Explica sin tecnicismos qué es un proceso psicoanalítico y deja claro que no hace falta tener todo resuelto para empezar.',
        'voice_words': ['Cercana', 'Precisa', 'Plural', 'Serena'],
        'voice_yes': ['Hablar en primera persona del plural', 'Explicar el enfoque con palabras simples', 'Invitar a elegir profesional, modalidad e idioma'],
        'voice_no': ['Tecnicismos sin explicar', 'Promesas de resultados rápidos', 'Tono publicitario o motivacional'],
        'voice_examples': ['No es necesario tener todo claro para empezar.', 'A veces hay un motivo claro. A veces sólo algo que insiste.', 'Elige con quién quieres empezar.'],
        'do': ['Mantener los dos trazos con sus colores', 'Mostrar a ambos profesionales por igual', 'Usar el verde profundo para piezas con peso', 'Dejar aire alrededor del logo', 'Ofrecer los tres idiomas cuando corresponda'],
        'dont': ['Separar o reordenar los trazos', 'Deformar, inclinar o recolorear el logo', 'Usar fotos de stock o de otras personas', 'Publicar direcciones exactas', 'Sustituir las tipografías por otras'],
        'closing': 'Dos recorridos, <em>una escucha compartida.</em>',
        'people': ['sol', 'nahuel'], 'social': False,
    },
}


def css(b):
    return f"""{fonts_css()}
@page {{ size: {W}mm {H}mm; margin: 0; }}
* {{ box-sizing: border-box; }}
html, body {{ margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }}
body {{ font-family: '{b['sans']}', sans-serif; color: {b['ink']}; font-size: 9pt; line-height: 1.55; }}
.sheet {{ position: relative; width: {W}mm; height: {H}mm; overflow: hidden; page-break-after: always; background: {b['bg']}; padding: 22mm 20mm 20mm; }}
.sheet:last-child {{ page-break-after: auto; }}
.abs {{ position: absolute; }}
h1, h2, h3 {{ font-family: '{b['serif']}', serif; font-weight: 400; margin: 0; line-height: 1.04; }}
h1 {{ font-size: 40pt; letter-spacing: -.01em; }}
h2 {{ font-size: 30pt; letter-spacing: -.01em; margin-bottom: 6mm; }}
h3 {{ font-size: 14pt; margin-bottom: 1.5mm; }}
em {{ font-style: italic; color: {b['accent']}; }}
p {{ margin: 0 0 3mm; }}
.lead {{ font-size: 11pt; line-height: 1.5; max-width: 125mm; }}
.kicker {{ font-size: 7pt; letter-spacing: .2em; text-transform: uppercase; font-weight: 500; color: {b['accent']}; margin-bottom: 4mm; }}
.small {{ font-size: 7.6pt; line-height: 1.45; color: {b['muted']}; }}
.head {{ position: absolute; left: 20mm; right: 20mm; top: 10mm; display: flex; justify-content: space-between; font-size: 6.6pt; letter-spacing: .2em; text-transform: uppercase; color: {b['muted']}; border-bottom: .2mm solid {b['soft']}; padding-bottom: 2mm; }}
.foot {{ position: absolute; left: 20mm; right: 20mm; bottom: 8mm; display: flex; justify-content: space-between; font-size: 6.4pt; letter-spacing: .14em; text-transform: uppercase; color: {b['muted']}; }}
.grid {{ display: grid; gap: 6mm; }}
.card {{ border: .2mm solid {b['soft']}; padding: 6mm; background: rgba(255,255,255,.35); }}
.rule {{ height: .2mm; background: {b['soft']}; margin: 4mm 0; }}
.photo {{ object-fit: cover; display: block; }}
ul.list {{ margin: 0; padding: 0; list-style: none; }}
ul.list li {{ padding: 1.6mm 0 1.6mm 5mm; border-top: .2mm solid {b['soft']}; position: relative; }}
ul.list li::before {{ content: ''; position: absolute; left: 0; top: 3.3mm; width: 1.6mm; height: 1.6mm; border-radius: 50%; background: {b['accent']}; }}
ul.no li::before {{ background: transparent; border: .25mm solid {b['muted']}; }}
"""


def page(b, n, total, section, body, bg=None, dark=False):
    style = f' style="background:{bg};color:{b["bg"] if dark else b["ink"]}"' if bg else ''
    return (f'<div class="sheet"{style}><div class="head"><span>{n:02d} · {section}</span><span>{b["name"]}</span></div>{body}'
            f'<div class="foot"><span>Manual de marca · Sistema de identidad visual</span><span>{n:02d} / {total:02d}</span></div></div>')


def photo_box(b, name, x, y, w, h, radius='0'):
    return f'<img class="abs photo" src="{photo(b["site"], name)}" style="left:{x}mm;top:{y}mm;width:{w}mm;height:{h}mm;border-radius:{radius}" alt="">'


def build(key):
    b = BRANDS[key]
    f = b['folder']
    pages = []

    def P(section, body, **kw):
        pages.append((section, body, kw))

    # 00 Portada
    P('Portada', f'''
  {photo_box(b, b['cover_photo'], 168, 0, 129, 210, '0')}
  <div class="abs" style="left:20mm;top:34mm;width:132mm">
    <p class="kicker">Brand kit · Manual de marca</p>
    {logo(f, b.get('cover_logo', b['horizontal']) + '_Positivo', width=b.get('cover_logo_w', '118mm'))}
    <div class="rule" style="width:18mm;margin:10mm 0 8mm"></div>
    <h2 style="font-size:24pt">{b['tagline']}</h2>
    <p class="small" style="margin-top:4mm">{b['role']}</p>
  </div>''')

    # 01 Esencia
    vals = ''.join(f'<div><h3>{t}</h3><p class="small">{d}</p></div>' for t, d in b['values'])
    P('Esencia de marca', f'''
  <div style="width:150mm"><p class="kicker">Esencia de marca</p><h1>{b['name']}</h1><p class="small" style="margin:2mm 0 7mm">{b['role']}</p>
  <p class="lead">{b['essence']}</p>
  <p class="kicker" style="margin-top:8mm">Personalidad</p><p style="font-size:11pt">{' · '.join(b['personality'])}</p>
  <p class="kicker" style="margin-top:6mm">Valores</p><div class="grid" style="grid-template-columns:repeat(4,1fr)">{vals}</div></div>
  {photo_box(b, b['territory_photo'], 190, 22, 87, 160)}''')

    # 02 Territorio
    roman = ['I', 'II', 'III', 'IV']
    pil = ''.join(f'<div style="border-top:.25mm solid {b["ink"]};padding-top:3mm"><p style="font-family:\'{b["serif"]}\';font-style:italic;font-size:13pt;color:{b["accent"]};margin:0">{roman[i]}</p><h3>{t}</h3><p class="small">{d}</p></div>' for i, (t, d) in enumerate(b['pillars']))
    P('Territorio de marca', f'''
  <p class="kicker">Territorio de marca</p><h1 style="max-width:200mm">{b['territory_title']}</h1>
  <p class="lead" style="margin-top:7mm;max-width:170mm">{b['territory']}</p>
  <p class="kicker" style="margin-top:8mm">Pilares narrativos</p><div class="grid" style="grid-template-columns:repeat(4,1fr);width:257mm">{pil}</div>
  <p class="kicker" style="margin-top:8mm">Posicionamiento</p><p style="font-family:'{b['serif']}';font-size:15pt;line-height:1.25;max-width:220mm">{b['positioning']}</p>''')

    # 03 Logo
    cards = ''.join(f'<div class="card" style="display:flex;flex-direction:column;justify-content:space-between;height:112mm"><p class="kicker">0{i + 1} · {t}</p>'
                    f'<div style="flex:1;display:flex;align-items:center;justify-content:center">{logo(f, name + "_Positivo", height="34mm" if "Mono" in name else None, width=None if "Mono" in name else "62mm")}</div>'
                    f'<p class="small">{d}</p></div>' for i, (name, t, d) in enumerate(b['logos']))
    P('Logo', f'<p class="kicker">Sistema de logo</p><h2>Logo final</h2><div class="grid" style="grid-template-columns:repeat(3,1fr)">{cards}</div>')

    # 04 Variantes de color
    pal = __import__('logos').palettes(key)
    names = {'Positivo': 'Positivo · fondos claros', 'Negativo': 'Negativo · fondos oscuros', 'Taupe': 'Sobre taupe', 'Sage': 'Sobre sage',
             'Terracota': 'Sobre terracota', 'Mono-Negro': 'Monocromo · una tinta'}
    vcards = ''.join(f'<div><div style="height:54mm;background:{pal[v]["bg"]};display:flex;align-items:center;justify-content:center;border:.2mm solid {b["soft"]}">'
                     f'{logo(f, b["horizontal"] + "_" + v, width="74mm")}</div><p class="small" style="margin-top:2mm">{names[v]}</p></div>' for v in b['variants'])
    P('Variantes', f'<p class="kicker">Versiones cromáticas</p><h2>Variantes de color</h2><div class="grid" style="grid-template-columns:repeat(2,1fr);gap:6mm 10mm">{vcards}</div>')

    # 05 Área de seguridad y tamaños mínimos
    mins = ''.join(f'<div style="display:flex;flex-direction:column;align-items:flex-start;gap:3mm"><div style="height:22mm;display:flex;align-items:flex-end">{logo(f, n + "_Positivo", height="12mm" if n == "Monograma" else None, width=None if n == "Monograma" else ("40mm" if "Horizontal" in n or n == b["horizontal"] else "26mm"))}</div>'
                   f'<p class="small"><b>{t}</b><br>Mínimo {s}</p></div>' for n, t, s in b['min_sizes'])
    P('Área de seguridad', f'''
  <p class="kicker">Uso del logo</p><h2>Área de seguridad y tamaños mínimos</h2>
  <div style="display:grid;grid-template-columns:150mm 1fr;gap:14mm;align-items:start">
    <div style="position:relative;padding:12mm;border:.3mm dashed {b['accent']};display:flex;justify-content:center;background:rgba(255,255,255,.35)">
      <div style="outline:.2mm solid {b['soft']}">{logo(f, b['horizontal'] + '_Positivo', width='110mm')}</div>
      <span class="abs small" style="left:2mm;top:2mm">x</span><span class="abs small" style="right:2mm;bottom:2mm">x</span>
    </div>
    <div><p>{b['clear']}</p><div class="rule"></div><p class="kicker">Tamaños mínimos (impresión · pantalla)</p><div class="grid" style="grid-template-columns:1fr;gap:5mm">{mins}</div></div>
  </div>''')

    # 06 Paleta
    sw = ''.join(f'<div><div style="height:62mm;background:{h};border:.2mm solid {b["soft"]}"></div><h3 style="margin-top:3mm">{n}</h3>'
                 f'<p class="small" style="margin:0">HEX {h}<br>RGB {", ".join(map(str, rgb(h)))}<br>CMYK {" ".join(map(str, cmyk(h)))} (aprox.)</p>'
                 f'<div style="height:1.2mm;background:{b["soft"]};margin:2.5mm 0 1mm"><div style="height:100%;width:{p}%;background:{b["ink"]}"></div></div><p class="small" style="margin:0">{p} % · {d}</p></div>'
                 for n, h, p, d in b['palette'])
    P('Paleta cromática', f'<p class="kicker">Color</p><h2>Paleta cromática</h2><div class="grid" style="grid-template-columns:repeat({len(b["palette"])},1fr);gap:5mm">{sw}</div>'
      f'<p class="small" style="margin-top:6mm">Los valores CMYK son una conversión de referencia: validarlos con la imprenta (prueba de color) antes de una tirada grande.</p>')

    # 07 Tipografía
    alpha = 'Aa Bb Cc Dd Ee Ff Gg Hh Ii Jj Kk Ll Mm Nn Ññ Oo Pp Qq Rr Ss Tt Uu Vv Ww Xx Yy Zz<br>0123456789 · áéíóú ü ç ã õ ¿? ¡! «» —'
    P('Tipografía', f'''
  <p class="kicker">Sistema tipográfico</p><h2>Dos voces: carácter y claridad</h2>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:12mm">
    <div class="card"><p class="kicker">01 · Tipografía de carácter</p><p style="font-family:'{b['serif']}';font-size:38pt;line-height:1;margin-bottom:3mm">{b['serif']}</p>
      <p style="font-family:'{b['serif']}';font-size:12pt;font-style:italic;color:{b['accent']}">{b['type_words']}</p><p style="font-family:'{b['serif']}';font-size:10pt">{alpha}</p>
      <p class="small">Titulares, citas, frases clave y énfasis. La cursiva marca la palabra que importa.</p></div>
    <div class="card"><p class="kicker">02 · Tipografía funcional</p><p style="font-family:'{b['sans']}';font-size:34pt;line-height:1;margin-bottom:3mm">{b['sans']}</p>
      <p style="font-family:'{b['sans']}';font-size:10pt;margin-top:6mm">{alpha}</p>
      <p class="small">Textos, datos, navegación y piezas informativas. Es la misma tipografía de la web.</p></div>
  </div>
  <div class="grid" style="grid-template-columns:repeat(4,1fr);margin-top:7mm">
    <div><p style="font-family:'{b['serif']}';font-size:26pt;line-height:1;margin:0">H1</p><p class="small">{b['serif']} · 40–72 pt</p></div>
    <div><p style="font-family:'{b['serif']}';font-size:18pt;line-height:1.2;margin:0">H2</p><p class="small">{b['serif']} · 24–40 pt</p></div>
    <div><p style="font-size:11pt;margin:0">Cuerpo</p><p class="small">{b['sans']} Regular · 9–16 pt</p></div>
    <div><p style="font-size:7pt;letter-spacing:.2em;text-transform:uppercase;margin:0">Etiqueta</p><p class="small">{b['sans']} Medium · mayúsculas espaciadas</p></div>
  </div>
  <p class="small" style="margin-top:5mm">Ambas tipografías son libres (Google Fonts, licencia OFL) y están disponibles en Canva. Archivos incluidos en la carpeta «tipografias».</p>''')

    # 08 Recursos gráficos
    res_art = {
        'nahuel': lambda: [logo(f, 'Monograma_Positivo', '26mm'), '<p style="font-family:\'Cormorant Garamond\';font-size:20pt;font-style:italic;margin:0">I · II · III</p>',
                   f'<div style="width:46mm"><div style="height:.2mm;background:{b["ink"]};margin:3mm 0"></div><div style="height:.2mm;background:{b["ink"]};width:60%"></div></div>',
                   f'<img class="photo" src="{photo("nahuel", "noche")}" style="width:30mm;height:30mm" alt="">'],
        'sol': lambda: [logo(f, 'Simbolo-Sol_Positivo', width='44mm'),
                f'<svg viewBox="0 0 100 60" style="width:44mm"><path fill="{b["sage"]}" d="M0 40 C20 10 50 0 70 20 C90 40 100 50 100 60 L0 60Z"/><path fill="{b["soft"]}" d="M40 60 C45 35 70 30 100 34 L100 60Z"/></svg>',
                f'<svg viewBox="0 0 100 30" style="width:44mm"><path fill="none" stroke="{b["accent"]}" stroke-width="1" d="M0 20 C25 0 50 30 75 12 S100 10 100 10"/></svg>',
                f'<img class="photo" src="{photo("sol", "cercana")}" style="width:30mm;height:30mm;border-radius:6mm" alt="">'],
        'conjunta': lambda: [logo(f, 'Simbolo_Positivo', width='46mm'),
                     f'<img class="photo" src="{photo("conjunta", "sol")}" style="width:26mm;height:32mm;border-radius:13mm 13mm 1mm 1mm" alt="">',
                     f'<p style="font-family:\'Fraunces\';font-size:20pt;font-style:italic;color:{b["accent"]};margin:0">01 · 02 · 03</p>',
                     f'<div style="width:46mm"><div style="height:.2mm;background:{b["ink"]}"></div></div>'],
    }[key]()
    rcards = ''.join(f'<div class="card" style="height:72mm;display:flex;flex-direction:column;justify-content:space-between"><div style="height:36mm;display:flex;align-items:center">{art}</div>'
                     f'<div><h3>{t}</h3><p class="small" style="margin:0">{d}</p></div></div>' for art, (t, d) in zip(res_art, b['resources']))
    P('Recursos gráficos', f'<p class="kicker">Recursos gráficos</p><h2>Elementos del sistema</h2><div class="grid" style="grid-template-columns:repeat(4,1fr)">{rcards}</div>'
      f'<p style="font-family:\'{b["serif"]}\';font-size:20pt;margin-top:9mm">{b["resources_principle"]}</p>')

    # 09 Fotografía
    ph = ''.join(photo_box(b, n, 128 + i * 52, 30, 48, 112, '0' if key == 'nahuel' else ('24mm 24mm 1mm 1mm' if key == 'conjunta' else '6mm')) for i, n in enumerate(b['photos']))
    P('Fotografía', f'''<div style="width:98mm"><p class="kicker">Dirección fotográfica</p><h2>{b['photo_title']}</h2><p>{b['photo_text']}</p>
  <p class="kicker" style="margin-top:5mm">Claves</p><ul class="list">{''.join(f'<li>{x}</li>' for x in b['photo_do'])}</ul>
  <p class="kicker" style="margin-top:5mm">Evitar</p><ul class="list no">{''.join(f'<li>{x}</li>' for x in b['photo_dont'])}</ul></div>{ph}''')

    # 10 Voz
    ex = ''.join(f'<div style="border-left:.4mm solid {b["accent"]};padding-left:4mm"><p style="font-family:\'{b["serif"]}\';font-style:italic;font-size:14pt;line-height:1.25;margin:0">«{e}»</p></div>' for e in b['voice_examples'])
    P('Voz y mensaje', f'''<p class="kicker">Voz y mensaje</p><h2>Cómo habla la marca</h2><p class="lead" style="max-width:200mm">{b['voice']}</p>
  <p style="font-size:11pt;margin:4mm 0 6mm">La voz suena: <b>{' · '.join(b['voice_words'])}</b></p>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:12mm"><div><p class="kicker">Sí</p><ul class="list">{''.join(f'<li>{x}</li>' for x in b['voice_yes'])}</ul></div>
  <div><p class="kicker">No</p><ul class="list no">{''.join(f'<li>{x}</li>' for x in b['voice_no'])}</ul></div></div>
  <p class="kicker" style="margin-top:7mm">Ejemplos</p><div class="grid" style="grid-template-columns:repeat(3,1fr)">{ex}</div>''')

    # 11 Papelería
    prev = MARCA / f / 'papeleria' / 'previas'
    card_f = (prev / f'{f}_Tarjeta-85x55mm_sangrado-3mm-01.png').as_uri()
    card_b = (prev / f'{f}_Tarjeta-85x55mm_sangrado-3mm-02.png').as_uri()
    tri_e = (prev / f'{f}_Triptico-A4_sangrado-3mm-01.png').as_uri()
    tri_i = (prev / f'{f}_Triptico-A4_sangrado-3mm-02.png').as_uri()
    stk = ''.join(f'<img src="{(prev / f"{f}_Stickers-50mm_sangrado-3mm-0{i}.png").as_uri()}" style="width:24mm;height:24mm;border-radius:50%;object-fit:cover;clip-path:circle(44.6%)" alt="">' for i in (1, 2, 3))
    shadow = 'box-shadow:0 1.5mm 4mm rgba(0,0,0,.14)'
    P('Papelería', f'''<p class="kicker">Aplicaciones</p><h2>Papelería</h2>
  <div style="display:grid;grid-template-columns:96mm 1fr;gap:10mm">
    <div><p class="kicker">Tarjeta personal · 85 × 55 mm</p><div style="display:flex;gap:4mm"><img src="{card_f}" style="width:45mm;{shadow}" alt=""><img src="{card_b}" style="width:45mm;{shadow}" alt=""></div>
      <p class="kicker" style="margin-top:8mm">Sticker redondo · Ø 50 mm</p><div style="display:flex;gap:5mm">{stk}</div>
      <p class="small" style="margin-top:6mm">Archivos listos para imprenta con 3 mm de sangrado en «papeleria». Datos reales y QR a la web.</p></div>
    <div><p class="kicker">Tríptico A4 · exterior e interior</p><img src="{tri_e}" style="height:62mm;max-width:100%;display:block;{shadow}" alt=""><img src="{tri_i}" style="height:62mm;max-width:100%;display:block;margin-top:4mm;{shadow}" alt=""></div>
  </div>''')

    # 12 Redes sociales (sólo Nahuel por ahora)
    if b['social']:
        thumbs = ''.join(f'<img src="{(MARCA / f / "instagram" / "previas" / f"post-{i:02d}.png").as_uri()}" style="width:100%;{shadow}" alt="">' for i in range(1, 13))
        P('Redes sociales', f'''<p class="kicker">Instagram</p><h2>Kit de 12 plantillas</h2>
  <div style="display:grid;grid-template-columns:70mm 1fr;gap:10mm"><div><p>Doce composiciones editables en Canva (1080 × 1350 px) para que Nahuel arme sus propias publicaciones: frase, foto, pregunta, carrusel, lista, servicio, lectura, aviso, bilingüe y contacto.</p>
  <p class="small">Cambiar el texto con doble clic; la foto con «Reemplazar». Duplicar la página para cada publicación nueva. Mantener la firma y el monograma.</p></div>
  <div class="grid" style="grid-template-columns:repeat(6,1fr);gap:3mm">{thumbs}</div></div>''')

    # 13 Do / Don't
    P('Usos correctos', f'''<p class="kicker">Do / Don't</p><h2>Para mantener la identidad</h2>
  <div class="grid" style="grid-template-columns:1fr 1fr;gap:12mm"><div><p class="kicker">Sí</p><ul class="list">{''.join(f'<li>{x}</li>' for x in b['do'])}</ul></div>
  <div><p class="kicker">No</p><ul class="list no">{''.join(f'<li>{x}</li>' for x in b['dont'])}</ul></div></div>
  <p style="font-family:'{b['serif']}';font-size:24pt;margin-top:12mm">{b['closing']}</p>''')

    # 14 Datos y archivos
    ppl = ''.join(f'<div class="card"><h3>{PEOPLE[k]["name"]}</h3><p class="small" style="margin:0">{PEOPLE[k]["role"]} · {PEOPLE[k]["langs"]}<br>{PEOPLE[k]["phone"]}<br>{PEOPLE[k]["email"]}'
                  f'{"<br>" + PEOPLE[k]["instagram"] if PEOPLE[k].get("instagram") else ""}<br>{PEOPLE[k]["web"]}</p></div>' for k in b['people'])
    web = PEOPLE['conjunta']['web'] if key == 'conjunta' else PEOPLE[b['people'][0]]['web']
    files = [('logos/svg', 'Vector editable (Illustrator, Figma, Inkscape)'), ('logos/pdf', 'Vector para imprenta'), ('logos/png', 'Alta resolución con fondo transparente (4000 px)'),
             ('papeleria', 'Tarjeta, tríptico y stickers listos para imprimir'), ('manual', 'Este manual en PDF'), ('tipografias', 'Fuentes de la marca (licencia libre OFL)')]
    if b['social']:
        files.append(('instagram', 'Plantillas editables en Canva + previas'))
    flist = ''.join(f'<li><b>{a}</b> — {d}</li>' for a, d in files)
    P('Datos y archivos', f'''<p class="kicker">Contacto y entregables</p><h2>Datos de la marca</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:12mm"><div><div class="grid" style="grid-template-columns:1fr">{ppl}</div>
  <p class="small" style="margin-top:5mm">Web: {web}<br>Atención presencial en Barcelona (Gràcia y Sants) y online. La dirección exacta se comparte al confirmar la cita.</p></div>
  <div><p class="kicker">Archivos entregados</p><ul class="list">{flist}</ul><p class="small" style="margin-top:6mm">Sistema de identidad visual diseñado por Chimichurri.</p></div></div>''')

    total = len(pages)
    sheets = [page(b, i, total, s, body, **kw) for i, (s, body, kw) in enumerate(pages, 1)]
    return f'<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Manual de marca · {b["name"]}</title><style>{css(b)}</style></head><body>' + ''.join(sheets) + '</body></html>'


if __name__ == '__main__':
    OUT.mkdir(exist_ok=True)
    for key, b in BRANDS.items():
        (OUT / f'{b["folder"]}_Manual.html').write_text(build(key), encoding='utf-8')
    print('ok')
