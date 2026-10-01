#!/usr/bin/env python3
"""Genera las tres webs estáticas a partir de las plantillas y los textos.

Uso:  python3 _build/build.py           (desde psicologia-barcelona/)
Salida: conjunta/, sol/, nahuel/ listas para publicar en Netlify.
Los estilos (styles.css), las fuentes y las imágenes viven directamente en cada carpeta.
"""
import json
import shutil
import sys
import time
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, StrictUndefined

ROOT = Path(__file__).resolve().parent.parent
BUILD = ROOT / '_build'
sys.path.insert(0, str(BUILD))

import importlib  # noqa: E402
from content import common, blog, legal  # noqa: E402

VERSION = time.strftime('%Y%m%d%H%M')

SITES = {
    'conjunta': {
        'name': 'Psicoanálisis en Barcelona',
        'url': common.URLS['conjunta'],
        'theme_color': '#f3eee6',
        'og_alt': 'Psicoanálisis en Barcelona — psicoterapia en Barcelona y online',
        'preload_fonts': ['InstrumentSerif-normal-400.woff2', 'HankenGrotesk-normal-400.woff2'],
        'template': 'conjunta.html',
        'layout': 'conjunta_layout.html',
        'content': 'content.conjunta',
        'analytics': '',
        'blog': True,
    },
    'sol': {
        'name': 'Sol Galiana · Psicóloga',
        'url': common.URLS['sol'],
        'theme_color': '#f6efe4',
        'og_alt': 'Sol Galiana, psicóloga en Barcelona y online',
        'preload_fonts': ['Fraunces-normal-300-600.woff2', 'Figtree-normal-400.woff2'],
        'template': 'sol.html',
        'layout': 'sol_layout.html',
        'content': 'content.sol',
        'analytics': '',
        'blog': False,
    },
    'nahuel': {
        'name': 'Nahuel Ponce · Psicólogo',
        'url': common.URLS['nahuel'],
        'theme_color': '#0e0e0d',
        'og_alt': 'Nahuel Ponce, psicólogo en Barcelona y online',
        'preload_fonts': ['CormorantGaramond-normal-400.woff2', 'Manrope-normal-300.woff2'],
        'template': 'nahuel.html',
        'layout': 'nahuel_layout.html',
        'content': 'content.nahuel',
        'analytics': '',
        'blog': False,
    },
}

env = Environment(loader=FileSystemLoader(BUILD / 'templates'), undefined=StrictUndefined,
                  autoescape=True, trim_blocks=False, lstrip_blocks=False)
env.filters['roman'] = lambda n: ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][n]


def lang_path(lang, default='es'):
    return '/' if lang == default else f'/{lang}/'


def write(path: Path, text: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding='utf-8')


def jsonld(data):
    return json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')


def address(place):
    return {'@type': 'PostalAddress', 'addressLocality': 'Barcelona', 'addressRegion': 'Cataluña',
            'addressCountry': 'ES', **place['schema']}


def base_context(key, site, lang, langs, page_path, meta):
    url = site['url']
    default = langs[0]
    return {
        'site': site, 'lang': lang, 'version': VERSION, 'meta': meta,
        'canonical': url + page_path,
        'og_locale': common.OG_LOCALES[lang],
        'ui': common.UI[lang],
        'home_url': lang_path(lang, default),
        'privacy_url': '/privacidad/',
        'places': common.PLACES,
        'urls': common.URLS,
        'layout': site['layout'],
        'jsonld': '',
        'alternates': [],
        'languages': [],
        'dock': None,
    }


def schema_for(key, site, lang, c):
    places = [{'@type': 'Place', 'name': f"Consultorio {p['zone']}", 'address': address(p)} for p in common.PLACES]
    langs = {'es': 'Spanish', 'en': 'English', 'pt': 'Portuguese'}
    if key == 'conjunta':
        persons = [
            {'@type': 'Person', 'name': common.SOL['name'], 'jobTitle': 'Psicóloga clínica', 'url': common.URLS['sol'] + '/',
             'telephone': common.SOL['phone'], 'email': common.SOL['email'], 'knowsLanguage': ['es', 'en']},
            {'@type': 'Person', 'name': common.NAHUEL['name'], 'jobTitle': 'Psicólogo General Sanitario', 'url': common.URLS['nahuel'] + '/',
             'telephone': common.NAHUEL['phone'], 'email': common.NAHUEL['email'], 'knowsLanguage': ['es', 'pt']},
        ]
        main = {
            '@type': 'ProfessionalService', '@id': site['url'] + '/#org', 'name': site['name'],
            'url': site['url'] + '/', 'image': site['url'] + '/og.jpg', 'logo': site['url'] + '/favicon.svg',
            'description': c['meta']['description'], 'priceRange': '€€',
            'areaServed': [{'@type': 'City', 'name': 'Barcelona'}],
            'availableLanguage': [langs[x] for x in ('es', 'en', 'pt')],
            'address': address(common.PLACES[0]), 'location': places, 'employee': persons,
            'knowsAbout': ['Psicoterapia', 'Psicoanálisis', 'Ansiedad', 'Duelo', 'Procesos migratorios', 'Supervisión clínica'],
        }
    else:
        p = common.SOL if key == 'sol' else common.NAHUEL
        person = {
            '@type': 'Person', '@id': site['url'] + '/#person', 'name': p['name'], 'jobTitle': c['schema']['jobTitle'],
            'url': site['url'] + '/', 'image': site['url'] + '/og.jpg', 'telephone': p['phone'], 'email': p['email'],
            'knowsLanguage': c['schema']['languages'], 'alumniOf': c['schema']['alumniOf'],
            'memberOf': {'@type': 'Organization', 'name': 'APOLa Barcelona'},
            'worksFor': {'@type': 'ProfessionalService', 'name': 'Psicoanálisis en Barcelona', 'url': common.URLS['conjunta'] + '/'},
        }
        if p.get('instagram'):
            person['sameAs'] = [p['instagram']]
        main = {
            '@type': 'ProfessionalService', '@id': site['url'] + '/#service', 'name': site['name'],
            'url': site['url'] + '/', 'image': site['url'] + '/og.jpg', 'description': c['meta']['description'],
            'telephone': p['phone'], 'email': p['email'], 'priceRange': '€€',
            'areaServed': [{'@type': 'City', 'name': 'Barcelona'}], 'availableLanguage': [langs[x] for x in c['schema']['languages']],
            'address': address(common.PLACES[0]), 'location': places, 'founder': person,
        }
    faq = {'@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': i['q'], 'acceptedAnswer': {'@type': 'Answer', 'text': i['a']}} for i in c['faq']['items']
    ]}
    return jsonld({'@context': 'https://schema.org', '@graph': [main, faq]})


def build_site(key, site):
    out = ROOT / key
    mod = importlib.import_module(site['content'])
    langs = mod.LANGS
    urls = []  # (path, alternates)
    alt = [{'lang': l, 'url': site['url'] + lang_path(l, langs[0])} for l in langs]
    languages = [{'code': l, 'name': common.LANG_NAMES[l], 'url': lang_path(l, langs[0])} for l in langs]

    for lang in langs:
        c = mod.PAGES[lang]
        path = lang_path(lang, langs[0])
        ctx = base_context(key, site, lang, langs, path, c['meta'])
        ctx.update({
            'c': c, 'nav': c['nav'], 'cta': c['cta'], 'alternates': alt if len(langs) > 1 else [],
            'languages': languages, 'jsonld': schema_for(key, site, lang, c),
            'posts': blog.POSTS[:3] if site['blog'] else [],
            'dock': c.get('dock'),
        })
        html = env.get_template(site['template']).render(**ctx)
        target = out / ('index.html' if path == '/' else f'{lang}/index.html')
        write(target, html)
        urls.append((path, alt if len(langs) > 1 else []))

    es = mod.PAGES[langs[0]]
    nav_sub = [{'href': '/' + n['href'], 'label': n['label']} if n['href'].startswith('#') else n for n in es['nav']]
    cta_sub = {'href': '/' + es['cta']['href'], 'label': es['cta']['label']}

    def simple_ctx(path, meta):
        ctx = base_context(key, site, langs[0], langs, path, meta)
        ctx.update({'c': es, 'nav': nav_sub, 'cta': cta_sub, 'posts': []})
        return ctx

    if site['blog']:
        meta = {'title': 'Blog de psicología y psicoanálisis | Psicoanálisis en Barcelona',
                'description': 'Artículos sobre psicoterapia psicoanalítica, ansiedad, vínculos, duelo y la experiencia de migrar, escritos por psicólogos en Barcelona.'}
        ctx = simple_ctx('/blog/', meta)
        ctx['posts'] = blog.POSTS
        ctx['jsonld'] = jsonld({'@context': 'https://schema.org', '@type': 'Blog', 'name': 'Blog · Psicoanálisis en Barcelona',
                                'url': site['url'] + '/blog/', 'inLanguage': 'es',
                                'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': f"{site['url']}/blog/{p['slug']}/"} for p in blog.POSTS]})
        write(out / 'blog/index.html', env.get_template('blog_index.html').render(**ctx))
        urls.append(('/blog/', []))
        for post in blog.POSTS:
            path = f"/blog/{post['slug']}/"
            meta = {'title': f"{post['title']} | Psicoanálisis en Barcelona", 'description': post['description'], 'og_type': 'article'}
            ctx = simple_ctx(path, meta)
            ctx['post'] = post
            ctx['jsonld'] = jsonld({
                '@context': 'https://schema.org', '@type': 'BlogPosting', 'headline': post['title'],
                'description': post['description'], 'datePublished': post['date'], 'dateModified': post['date'],
                'inLanguage': 'es', 'mainEntityOfPage': site['url'] + path, 'image': site['url'] + '/og.jpg',
                'author': [{'@type': 'Person', 'name': common.SOL['name']}, {'@type': 'Person', 'name': common.NAHUEL['name']}],
                'publisher': {'@type': 'Organization', 'name': site['name'], 'logo': {'@type': 'ImageObject', 'url': site['url'] + '/favicon.svg'}},
            })
            write(out / f"blog/{post['slug']}/index.html", env.get_template('blog_post.html').render(**ctx))
            urls.append((path, []))

    # Privacidad y 404
    priv = legal.privacy(key)
    ctx = simple_ctx('/privacidad/', {'title': f"Privacidad | {site['name']}", 'description': 'Política de privacidad y uso de cookies.', 'robots': 'noindex,follow'})
    ctx['page'] = priv
    write(out / 'privacidad/index.html', env.get_template('simple.html').render(**ctx))
    ctx = simple_ctx('/404.html', {'title': f"Página no encontrada | {site['name']}", 'description': 'Página no encontrada.', 'robots': 'noindex'})
    ctx['page'] = legal.not_found(key)
    write(out / '404.html', env.get_template('simple.html').render(**ctx))

    # Estáticos
    shutil.copy(BUILD / 'static/app.js', out / 'app.js')
    write(out / 'config.js', "window.SITE_CONFIG = {\n  // ID de medición de Google Analytics 4 (G-XXXXXXX). Vacío = sin analítica.\n"
          f"  analyticsMeasurementId: '{site['analytics']}'\n}};\n")
    write(out / 'robots.txt', f"User-agent: *\nAllow: /\n\nSitemap: {site['url']}/sitemap.xml\n")
    today = time.strftime('%Y-%m-%d')
    rows = []
    for path, alts in urls:
        links = ''.join(f'\n    <xhtml:link rel="alternate" hreflang="{a["lang"]}" href="{a["url"]}"/>' for a in alts)
        rows.append(f"  <url>\n    <loc>{site['url']}{path}</loc>\n    <lastmod>{today}</lastmod>{links}\n  </url>")
    write(out / 'sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
          'xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' + '\n'.join(rows) + '\n</urlset>\n')
    analytics_hosts = 'https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com'
    write(out / '_headers', f"""/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; img-src 'self' data: {analytics_hosts}; style-src 'self'; font-src 'self'; script-src 'self' https://www.googletagmanager.com; connect-src 'self' {analytics_hosts}; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

/assets/*
  Cache-Control: public, max-age=31536000, immutable

/fonts/*
  Cache-Control: public, max-age=31536000, immutable
""")
    write(out / 'netlify.toml', '[build]\n  publish = "."\n  command = ""\n\n[build.processing.html]\n  pretty_urls = true\n')
    print(f'{key}: {len(urls)} páginas')


if __name__ == '__main__':
    only = sys.argv[1:] or list(SITES)
    for key in only:
        build_site(key, SITES[key])
