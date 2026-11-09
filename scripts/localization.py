"""Compile fully rendered language editions; no remote translation on page load."""
from collections import Counter
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
import json
import re
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

ROOT = Path(__file__).resolve().parent.parent
MISSING = Counter()
TEXT_KEYS = {'title', 'sub', 'body', 'focus', 'description', 'role', 'category',
             'series', 'label', 'nav', 'tags', 'video_label'}


def localized_path(path, lang='en'):
    if lang == 'en':
        return '/en/' if path == '/' else '/en' + path
    return path.removeprefix('/en') or '/'


def language_switch(path, lang):
    es = localized_path(path, 'es')
    en = localized_path(es, 'en')
    links = []
    for code, href, label in [('es', es, 'Español'), ('en', en, 'English')]:
        current = ' aria-current="page"' if code == lang else ''
        links.append(f'<a href="{href}" lang="{code}" hreflang="{code}" '
                     f'data-language="{code}" aria-label="{label}"{current}>{code.upper()}</a>')
    return '<nav class="language-switch" aria-label="'+('Idioma' if lang == 'es' else 'Language')+'">'+''.join(links)+'</nav>'


def decorate(html, path, lang):
    html = html.replace('<button class="nav-toggle"', language_switch(path, lang)+'<button class="nav-toggle"', 1)
    verification=json.loads((ROOT/'data/site-verification.json').read_text(encoding='utf8'))
    for name,value in verification.items():
        html=html.replace('</head>',f'<meta name="{name}" content="{escape(value,quote=True)}"></head>',1)
    html = html.replace('</head>', '<link rel="stylesheet" href="/assets/locale.css?v=20261109-r4"></head>', 1)
    # Run before deferred interaction scripts, including first-entry preference.
    html = html.replace('<script src="/assets/site.js"', '<script src="/assets/locale.js?v=20261109-r4"></script><script src="/assets/site.js?v=20261109-r4"', 1)
    html = html.replace('<input type="hidden" name="form-name"', f'<input type="hidden" name="language" value="{lang}"><input type="hidden" name="form-name"')
    if path == '/' and lang == 'es':
        prompt = '<aside class="language-prompt" aria-label="Language suggestion"><p>This site is also available in English.</p><a href="/en/" data-language="en" lang="en" hreflang="en">Explore in English ↗</a><button type="button" data-dismiss-language aria-label="Keep browsing in Spanish">×</button></aside>'
        html = html.replace('</header>', '</header>'+prompt, 1)
    return html


def _collect_pairs(original, translated, pairs, key=None):
    if isinstance(original, dict) and isinstance(translated, dict):
        for k, value in original.items():
            if k in translated:
                _collect_pairs(value, translated[k], pairs, k)
    elif isinstance(original, list) and isinstance(translated, list):
        for a, b in zip(original, translated):
            _collect_pairs(a, b, pairs, key)
    elif key in TEXT_KEYS and isinstance(original, str) and isinstance(translated, str):
        pairs[original] = translated


def load_catalog():
    catalog = json.loads((ROOT/'data/i18n/en.json').read_text(encoding='utf8'))
    pairs = {}
    for name in ['projects', 'artworks']:
        a = json.loads((ROOT/f'data/{name}.json').read_text(encoding='utf8'))
        b = json.loads((ROOT/f'data/{name}.en.json').read_text(encoding='utf8'))
        _collect_pairs(a, b, pairs)
    pairs.update(catalog.get('translations', {}))
    return catalog, pairs


def translate(value, pairs, context='text'):
    if not value.strip():
        return value
    core = value.strip()
    if context == 'data-filter' and core == 'all':
        return value
    if core in pairs:
        return value[:len(value)-len(value.lstrip())]+pairs[core]+value[len(value.rstrip()):]
    for prefix, en in [('Ampliar ', 'Enlarge '), ('Reproducir ', 'Play '),
                       ('Imagen de ', 'Image from '), ('Ver ', 'View ')]:
        if core.startswith(prefix):
            return en+pairs.get(core[len(prefix):], core[len(prefix):])
    if re.match(r'^\d+ de 4:', core):
        return core.replace(' de 4:', ' of 4:', 1)
    # Canonical project descriptions are composed from two translated fields.
    if context == 'meta':
        for es, en in sorted(pairs.items(), key=lambda x: -len(x[0])):
            if len(es) >= 12 and es in core:
                core = re.sub(r'(?<!\w)'+re.escape(es)+r'(?!\w)', lambda _: en, core)
        if core == value.strip():
            MISSING[(context, core)] += 1
        return core
    MISSING[(context, core)] += 1
    return value


def localize_url(value, links):
    if value in links:
        return links[value]
    if value in {'/assets/press/press-cover.jpg','/assets/press/artwork-cover.jpg'}:
        return value[:-4]+'-en.jpg'
    parts = urlsplit(value)
    if parts.netloc in {'lucascasagrande.com', 'www.lucascasagrande.com'}:
        return urlunsplit((parts.scheme, parts.netloc, localized_path(parts.path or '/'), parts.query, parts.fragment))
    if value.startswith('/') and not value.startswith('//'):
        if parts.path.startswith(('/assets/', '/favicon', '/data/')):
            if parts.path.endswith('.pdf') and '/assets/press/' in parts.path:
                return value[:-4]+'_EN.pdf'
            return value
        return urlunsplit(('', '', localized_path(parts.path or '/'), parts.query, parts.fragment))
    if parts.netloc == 'wa.me' and parts.query:
        return urlunsplit((parts.scheme, parts.netloc, parts.path,
                         urlencode({'text': 'Hi Lucas, I saw your portfolio and would like to discuss a project.'}), parts.fragment))
    return value


class EnglishHTML(HTMLParser):
    def __init__(self, pairs, links):
        super().__init__(convert_charrefs=True)
        self.pairs, self.links, self.out = pairs, links, []
        self.raw = None
        self.in_title = False

    def handle_decl(self, decl):
        self.out.append('<!'+decl+'>')

    def handle_comment(self, data):
        self.out.append('<!--'+data+'-->')

    def handle_starttag(self, tag, attrs):
        mapped = []
        is_meta = tag == 'meta'
        attributes = dict(attrs)
        translatable_meta = attributes.get('name', attributes.get('property', '')) in {
            'description', 'og:title', 'og:description', 'twitter:title', 'twitter:description'}
        for name, value in attrs:
            if value is not None:
                if tag == 'html' and name == 'lang':
                    value = 'en'
                elif name in {'href', 'action', 'src'}:
                    value = localize_url(value, self.links)
                elif name in {'alt', 'aria-label', 'aria-roledescription', 'placeholder', 'title', 'data-title', 'data-category', 'data-filter'}:
                    value = translate(value, self.pairs, name)
                elif is_meta and translatable_meta and name == 'content':
                    value = translate(value, self.pairs, 'meta')
                elif tag == 'input' and name == 'value' and attributes.get('name') == 'subject':
                    value = 'Portfolio · New enquiry from %{formName}'
            mapped.append(name if value is None else f'{name}="{escape(value, quote=True)}"')
        self.out.append('<'+tag+(' '+' '.join(mapped) if mapped else '')+'>')
        if tag in {'script', 'style'}:
            self.raw = tag
        if tag == 'title':
            self.in_title = True

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        self.out[-1] = self.out[-1][:-1]+' />'

    def handle_endtag(self, tag):
        self.out.append('</'+tag+'>')
        if tag == self.raw:
            self.raw = None
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        self.out.append(data if self.raw else escape(translate(data, self.pairs, 'meta' if self.in_title else 'text'), quote=False))


def english_html(html, catalog, pairs):
    fragments = catalog.get('html', {})
    # Inline application code is opaque. A literal HTML template in JS/CSS must
    # never be changed by an editorial whole-fragment replacement.
    chunks = re.split(r'(<(?:script|style)\b[^>]*>.*?</(?:script|style)\s*>)', html, flags=re.I|re.S)
    for index in range(0, len(chunks), 2):
        for source, target in sorted(fragments.items(), key=lambda p: -len(p[0])):
            chunks[index] = chunks[index].replace(source, target)
    html = ''.join(chunks)
    parser = EnglishHTML(pairs, catalog.get('links', {}))
    parser.feed(html)
    return ''.join(parser.out)


def write_localization_report():
    report = [{'context': c, 'text': text, 'count': count}
              for (c, text), count in MISSING.most_common()]
    target = ROOT.parent/'i18n-build-review.json'
    target.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf8')
    if report:
        raise ValueError('Unreviewed English content. Complete data/i18n/en.json; see '+str(target))
