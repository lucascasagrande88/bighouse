"""Real image dimensions provide stable proportional boxes before lazy loading."""
from pathlib import Path
from functools import lru_cache
from html import unescape
from urllib.parse import urlsplit
from PIL import Image,ImageOps
import re,xml.etree.ElementTree as ET

@lru_cache(maxsize=None)
def dimensions(file):
    p=Path(file)
    if not p.is_file():return None
    if p.suffix.lower()=='.svg':
        root=ET.parse(p).getroot();box=root.attrib.get('viewBox','').split()
        if len(box)==4:return round(float(box[2])),round(float(box[3]))
        return None
    try:
        with Image.open(p) as im:return ImageOps.exif_transpose(im).size
    except (OSError,ValueError):return None

def normalize_images(html,root):
    def replace(match):
        tag=match.group(0);src=re.search(r'\bsrc="([^"]+)"',tag)
        if not src or not src[1].startswith('/'):return tag
        size=dimensions(str(root/urlsplit(unescape(src[1])).path.lstrip('/')))
        if not size:return tag
        w,h=size
        tag=re.sub(r'\s+(?:width|height)="[^"]*"','',tag)
        ratio=f'aspect-ratio:auto {w} / {h}'
        style=re.search(r'\sstyle="([^"]*)"',tag)
        if style:
            value=re.sub(r'aspect-ratio\s*:[^;]+;?','',style[1]).strip('; ')
            tag=tag[:style.start()]+f' style="{value+";" if value else ""}{ratio}"'+tag[style.end():]
        else:tag=tag[:-1]+f' style="{ratio}">'
        return tag[:-1]+f' width="{w}" height="{h}">'
    return re.sub(r'<img\b[^>]*>',replace,html)
