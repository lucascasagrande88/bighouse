"""Marcadores del panel de control.

Cada texto editable se publica envuelto en comentarios HTML:
    <!--cms:es.hero.lead-->Texto original<!--/cms-->
La edge function reemplaza lo que hay entre los marcadores por la versión guardada en el panel,
y el panel usa los mismos marcadores para saber qué se puede editar en cada página.
"""
import re

from markupsafe import Markup, escape

RICH = re.compile(r'<[a-zA-Z/]')

# Claves que nunca son texto visible (enlaces, rutas, datos técnicos).
SKIP_ANY = {'href', 'wa', 'mail', 'map', 'img', 'slug', 'date', 'track', 'url', 'key', 'external', 'featured',
            'img_alt', 'img_alt_2', 'team_url', 'schema'}
# Claves que sólo se saltean en la raíz de cada página.
SKIP_ROOT = {'meta'}


class CmsStr(str):
    """Un str normal (para JSON-LD, slices, comparaciones) que al renderizarse en HTML lleva sus marcadores."""

    def __new__(cls, value, key):
        obj = str.__new__(cls, value)
        obj.key = key
        return obj

    def __html__(self):
        body = str(self) if RICH.search(self) else str(escape(str(self)))
        return Markup(f'<!--cms:{self.key}-->{body}<!--/cms-->')


def mark(obj, prefix, root=True):
    """Devuelve una copia de obj con cada texto convertido en CmsStr con su clave."""
    if isinstance(obj, CmsStr):
        return obj
    if isinstance(obj, str):
        return CmsStr(obj, prefix)
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in SKIP_ANY or (root and k in SKIP_ROOT):
                out[k] = v
            else:
                out[k] = mark(v, f'{prefix}.{k}', False)
        return out
    if isinstance(obj, list):
        return [mark(v, f'{prefix}.{i}', False) for i, v in enumerate(obj)]
    return obj


def plain(value):
    """Para atributos HTML: el texto sin marcadores."""
    return str(value) if value is not None else ''
