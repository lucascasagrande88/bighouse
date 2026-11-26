"""Curated artwork and live visuals, localized in Spanish and English."""
import re

COPY = {
    "es": {
        "liveTitle": "Visuales para<br>escenarios.",
        "liveIntro": "Pantallas de concierto, 3D y animación para música en vivo.",
        "showLabel": "Registro de concierto / Ferro, Buenos Aires",
        "vidTitle": "Miranda! en Ferro 2025 — Puro Talento, registro de UrbanVibes",
        "showCredit": "Registro de UrbanVibes · Ferro 2025",
        "songOne": "Puro Talento",
        "songTwo": "Uno los dos",
        "songOneDescription": "Geometría 3D y movimiento caleidoscópico.",
        "songTwoDescription": "Un hotel que se abre y se ilumina al ritmo de la canción.",
        "watch": "Ver en YouTube",
        "musicLabel": "Identidad visual / Música",
        "musicDescription": "Un universo gráfico y 3D para Saint Bodhi.",
        "musicLink": "Ver proyecto",
        "liveCta": "Hablemos de visuales",
        "artHomeTitle": "Mundos<br>propios.",
        "artHomeIntro": "Escultura digital, paisajes y arquitectura imaginada.",
        "allArt": "Explorar Artworks",
        "galleryTitle": "Archivo visual.",
        "galleryIntro": "Una selección de obra 3D. Entrá a cada imagen para verla a escala completa.",
        "archiveNav": "Ir a los filtros",
        "filmNav": "Ver obras en movimiento",
        "filmLabel": "Art films / Morcreate",
        "filmText": "Factory y Flowers, dos films 3D para la muestra de ecoarte de Morcreate.",
        "filmLink": "Ver los dos films",
        "galleryLabel": "Artworks",
        "homeHeading": "<div class=\"section-top\"><div><p class=\"eyebrow\">Artworks</p><h2>Mundos<br>propios.</h2></div><p>Escultura digital, paisajes y arquitectura imaginada.</p></div>",
        "homeEnd": "<div class=\"section-end\"><a class=\"btn\" href=\"/artworks/\">Explorar Artworks</a></div>",
        "galleryHead": "<header class=\"gallery-head shell portfolio-gallery-head\"><p class=\"eyebrow\">Artworks</p><h1>Archivo visual.</h1><p>Una selección de obra 3D. Entrá a cada imagen para verla a escala completa.</p><div class=\"portfolio-gallery-nav\"><a href=\"#archive-filters\">Ir a los filtros ↓</a><a href=\"#art-films\">Ver obras en movimiento ↗</a></div></header>",
    },
    "en": {
        "liveTitle": "Visuals for<br>the stage.",
        "liveIntro": "Concert screens, 3D and animation for live music.",
        "showLabel": "Concert footage / Ferro, Buenos Aires",
        "vidTitle": "Miranda! at Ferro 2025 — Puro Talento, footage by UrbanVibes",
        "showCredit": "Footage by UrbanVibes · Ferro 2025",
        "songOne": "Puro Talento",
        "songTwo": "Uno los dos",
        "songOneDescription": "3D geometry and kaleidoscopic movement.",
        "songTwoDescription": "A hotel opens up and lights up to the rhythm of the song.",
        "watch": "Watch on YouTube",
        "musicLabel": "Visual identity / Music",
        "musicDescription": "A graphic and 3D world for Saint Bodhi.",
        "musicLink": "View project",
        "liveCta": "Talk about live visuals",
        "artHomeTitle": "Worlds<br>of my own.",
        "artHomeIntro": "Digital sculpture, landscapes and imagined architecture.",
        "allArt": "Explore Artworks",
        "galleryTitle": "Visual archive.",
        "galleryIntro": "Selected 3D artwork. Open any image to see it at full size.",
        "archiveNav": "Jump to filters",
        "filmNav": "See the art films",
        "filmLabel": "Art films / Morcreate",
        "filmText": "Factory and Flowers, two 3D films for Morcreate’s eco-art exhibition.",
        "filmLink": "Watch both films",
        "galleryLabel": "Artworks",
        "homeHeading": "<div class=\"section-top\"><div><p class=\"eyebrow\">Artworks</p><h2>Worlds<br>of my own.</h2></div><p>Digital sculpture, landscapes and imagined architecture.</p></div>",
        "homeEnd": "<div class=\"section-end\"><a class=\"btn\" href=\"/en/artworks/\">Explore Artworks</a></div>",
        "galleryHead": "<header class=\"gallery-head shell portfolio-gallery-head\"><p class=\"eyebrow\">Artworks</p><h1>Visual archive.</h1><p>Selected 3D artwork. Open any image to see it at full size.</p><div class=\"portfolio-gallery-nav\"><a href=\"#archive-filters\">Jump to filters ↓</a><a href=\"#art-films\">See the art films ↗</a></div></header>",
    },
}
FEATURED_ART = ["art-04","art-12","art-07","art-16","art-18","art-21"]
WIDE_ART = ["art-04","art-16"]
STYLESHEET = '<link rel="stylesheet" href="/assets/portfolio.css?v=20261125-portfolio">'

def live_section(t, prefix):
    return f'''<section class="live shell portfolio-live" id="live" aria-labelledby="live-title">
  <div class="section-top">
    <h2 id="live-title">{t['liveTitle']}</h2>
    <p>{t['liveIntro']}</p>
  </div>
  <article class="portfolio-show" aria-labelledby="miranda-title">
    <div class="portfolio-show-head">
      <div><p class="portfolio-kicker">{t['showLabel']}</p><h3 id="miranda-title">Miranda!</h3></div>
      <span>2025</span>
    </div>
    <div class="portfolio-player">
      <iframe title="{t['vidTitle']}" src="https://www.youtube-nocookie.com/embed/80ubrLGDoZI?start=3454" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowfullscreen></iframe>
    </div>
    <p class="portfolio-credit">{t['showCredit']}</p>
    <div class="portfolio-tracks">
      <a href="https://www.youtube.com/watch?v=80ubrLGDoZI&amp;t=3454s" aria-label="{t['watch']} · Puro Talento">
        <div><strong>{t['songOne']}</strong><p>{t['songOneDescription']}</p></div>
        <span aria-hidden="true">↗</span>
      </a>
      <a href="https://www.youtube.com/watch?v=80ubrLGDoZI&amp;t=862s" aria-label="{t['watch']} · Uno los dos">
        <div><strong>{t['songTwo']}</strong><p>{t['songTwoDescription']}</p></div>
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  </article>
  <article class="portfolio-companion">
    <a href="{prefix}/work/saint-bodhi/" aria-label="{t['musicLink']} · Saint Bodhi"><img src="/assets/projects/hd/saint-bodhi.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></a>
    <div><p class="portfolio-kicker">{t['musicLabel']}</p><h3>Saint Bodhi</h3><p>{t['musicDescription']}</p><a href="{prefix}/work/saint-bodhi/" class="btn">{t['musicLink']}</a></div>
  </article>
  <div class="portfolio-live-end">
    <p>Creamfields <span>·</span> Ultra Music Festival <span>·</span> PopUp</p>
    <a class="btn" href="{prefix}/contacto/">{t['liveCta']}</a>
  </div>
</section>'''


def gallery_film(t, prefix):
    return f'''<section class="shell portfolio-films" id="art-films" aria-labelledby="art-films-title">
  <article class="portfolio-companion">
    <a href="{prefix}/work/continuous-reflection/" aria-label="{t['filmLink']} · Continuous Refle(a)ction 2.0"><img src="/assets/projects/hd/continuous-reflection.webp" alt="" width="1600" height="900" loading="lazy" decoding="async"></a>
    <div><p class="portfolio-kicker">{t['filmLabel']}</p><h2 id="art-films-title">Continuous Refle(a)ction 2.0</h2><p>{t['filmText']}</p><a href="{prefix}/work/continuous-reflection/" class="btn">{t['filmLink']}</a></div>
  </article>
</section>'''


def refresh_portfolio(document, route, lang):
    if route not in ('/', '/artworks/'):
        return document

    t = COPY[lang]
    prefix = '/en' if lang == 'en' else ''
    document = document.replace('</head>', STYLESHEET + '</head>', 1)
    if route == '/':
        document = re.sub(r'<section class="visual-break">.*?</section>', '', document, count=1, flags=re.S)
        document = re.sub(
            r'<section class="live shell" id="live">.*?</section>',
            lambda _: live_section(t, prefix),
            document,
            count=1,
            flags=re.S,
        )
        return re.sub(
            r'<section class="section shell paper" id="artworks">.*?(<div class="art-preview">.*?)<div class="section-end">.*?</section>',
            lambda match: '<section class="section shell paper portfolio-artwork" id="artworks">'
            + t['homeHeading'] + match[1] + t['homeEnd'] + '</section>',
            document,
            count=1,
            flags=re.S,
        )

    document = re.sub(
        r'<header class="gallery-head shell">.*?</header>',
        lambda _: t['galleryHead'],
        document,
        count=1,
        flags=re.S,
    )
    document = document.replace(
        '<div class="filter-bar shell" data-filter-for="art-grid"',
        '<div class="filter-bar shell" id="archive-filters" data-filter-for="art-grid"',
        1,
    )

    def archive(match):
        figures = re.findall(r'<figure\b.*?</figure>', match[2], flags=re.S)
        entries = {
            re.search(r'data-art="[^"]+/([^/"]+)\.webp"', figure)[1]: figure
            for figure in figures
        }
        keys = [key for key in FEATURED_ART if key in entries]
        keys.extend(key for key in entries if key not in FEATURED_ART)
        ordered = [
            entries[key].replace('<figure ', '<figure class="portfolio-wide" ', 1)
            if key in WIDE_ART else entries[key]
            for key in keys
        ]
        opening = match[1].replace('art-grid shell', 'art-grid shell portfolio-archive', 1)
        return opening + '\n' + '\n'.join(ordered) + '\n</section>\n' + gallery_film(t, prefix)

    return re.sub(
        r'(<section class="art-grid shell" id="art-grid"[^>]*>)(.*?)</section>',
        archive,
        document,
        count=1,
        flags=re.S,
    )
