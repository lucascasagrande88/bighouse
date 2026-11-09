"""SEO for the rendered personal portfolio. No network calls or policy changes.

Call enhance_html AFTER translation, then generate_discovery AFTER writing both
languages. Metadata comes from that page's head, never an untranslated fallback.
The caller supplies verified Vimeo metadata explicitly; dates are never inferred
from filenames, project years, download timestamps, or deployment timestamps.
"""
from __future__ import annotations

from datetime import datetime
from html import escape, unescape
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import json
import re
import xml.etree.ElementTree as ET

SITE = "https://lucascasagrande.com"
MANAGED_ID = "portfolio-seo"
_EXCLUDED = {"/404.html", "/404/", "/gracias/", "/thanks/"}
_SOCIAL_PROFILES = (
    "https://vimeo.com/lucascasagrande",
    "https://www.behance.net/lucascasagrande",
    "https://www.linkedin.com/in/lucascasagrande/",
    "https://www.instagram.com/lucas_bighouse/",
)


def _clean(value):
    return re.sub(r"\s+", " ", unescape(str(value or ""))).strip()


def _url(value):
    """Public absolute URL with no query/fragment; reject foreign page origins."""
    bits = urlsplit(urljoin(SITE + "/", str(value)))
    if bits.scheme != "https" or bits.netloc != urlsplit(SITE).netloc:
        raise ValueError("Portfolio page URL must use the canonical HTTPS origin")
    path = bits.path or "/"
    if path.endswith("/index.html"):
        path = path[:-10]
    if path == "/index.html":
        path = "/"
    if not Path(path).suffix and not path.endswith("/"):
        path += "/"
    return urlunsplit((bits.scheme, bits.netloc, path, "", ""))


def _public_media(value):
    """Only stable public media, never signed query strings or private sources."""
    if not value:
        return None
    bits = urlsplit(urljoin(SITE + "/", unescape(str(value))))
    if bits.scheme != "https" or bits.query or bits.fragment:
        return None
    if bits.netloc == urlsplit(SITE).netloc and bits.path.startswith("/assets/"):
        return urlunsplit(bits)
    return None


def _locale(lang):
    if lang.lower() in ("es", "es-ar"):
        return "es-AR"
    if lang.lower() == "en":
        return "en"
    raise ValueError("Supported portfolio languages are es-AR and en")


def _base_path(path):
    path = urlsplit(_url(path)).path
    return path[3:] if path.startswith("/en/") else path


def _indexable(path, parser):
    return (_base_path(path) not in _EXCLUDED and not parser.refresh
            and not any("noindex" in v.lower() for v in parser.robots))


class _Page(HTMLParser):
    def __init__(self, html):
        super().__init__(convert_charrefs=True)
        self.in_head = False
        self.in_title = False
        self.title = ""
        self.metas = []
        self.links = []
        self.images = []
        self.video_controls = []
        self.robots = []
        self.refresh = False
        self.jsonld = []
        self._json_script = None
        self._in_video = False
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "head":
            self.in_head = True
        if tag == "title" and self.in_head:
            self.in_title = True
        if tag == "meta" and self.in_head:
            self.metas.append(attrs)
            if attrs.get("name", "").lower() in ("robots", "googlebot", "bingbot"):
                self.robots.append(attrs.get("content", ""))
            if attrs.get("http-equiv", "").lower() == "refresh":
                self.refresh = True
        if tag == "a" and attrs.get("href"):
            self.links.append(attrs["href"])
        if tag == "img" and attrs.get("src"):
            self.images.append(attrs)
        if attrs.get("data-local-video") or attrs.get("data-vimeo"):
            self.video_controls.append(attrs)
        if tag == "video":
            self._in_video = True
            if attrs.get("src"):
                self.video_controls.append({"data-local-video": attrs["src"]})
        if tag == "source" and self._in_video and attrs.get("src"):
            self.video_controls.append({"data-local-video": attrs["src"]})
        if tag == "iframe" and attrs.get("src"):
            match = re.search(r"https://player\.vimeo\.com/video/(\d+)", attrs["src"])
            if match:
                self.video_controls.append({"data-vimeo": match[1]})
        if tag == "script" and attrs.get("type", "").lower() == "application/ld+json":
            self._json_script = {"attrs": attrs, "text": ""}

    def handle_endtag(self, tag):
        if tag == "head":
            self.in_head = False
        if tag == "title":
            self.in_title = False
        if tag == "video":
            self._in_video = False
        if tag == "script" and self._json_script is not None:
            self.jsonld.append(self._json_script)
            self._json_script = None

    def handle_data(self, data):
        if self.in_title:
            self.title += data
        if self._json_script is not None:
            self._json_script["text"] += data

    def meta(self, key):
        for attrs in self.metas:
            if attrs.get("name", attrs.get("property", "")).lower() == key:
                return _clean(attrs.get("content", ""))
        return ""


def _image(url, parser, root=None, caption=None):
    url = _public_media(url)
    if not url:
        return None
    path = urlsplit(url).path
    if root is not None and not (Path(root) / path.lstrip("/")).is_file():
        return None
    original = next((im for im in parser.images
                     if urljoin(SITE, im["src"]) == url), {})
    image = {"@type": "ImageObject", "@id": url + "#image",
             "url": url, "contentUrl": url}
    # Read actual pixels, not width/height attributes that may describe a box.
    if root is not None:
        try:
            from media import dimensions
            size = dimensions(str(Path(root) / path.lstrip("/")))
        except (ImportError, OSError, ValueError):
            size = None
        if size:
            image.update(width=size[0], height=size[1])
    label = _clean(caption or original.get("alt"))
    if label:
        image["caption"] = label
    return image


def _verified_date(metadata):
    """Accept explicit sourced first-publication DateTime, without inventing TZ.

    Vimeo public API v2 upload_date is accepted only with its matching video URL.
    It has no timezone, which is preserved as unknown rather than appended 'Z'.
    General records require uploadDate + upload_date_source/source_url.
    """
    if not isinstance(metadata, dict):
        return None
    raw = metadata.get("uploadDate")
    source = metadata.get("upload_date_source") or metadata.get("source_url")
    if not raw and metadata.get("upload_date") and metadata.get("id"):
        expected = f'https://vimeo.com/{metadata["id"]}'
        if metadata.get("url", "").rstrip("/") == expected:
            raw, source = metadata["upload_date"], expected
    if not raw or not source or not str(source).startswith("https://"):
        return None
    value = str(raw).strip().replace(" ", "T", 1)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?", value):
        return None
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    return value


def _duration(value):
    try:
        seconds = float(value)
    except (TypeError, ValueError):
        return None
    return f"PT{seconds:g}S" if 0 < seconds < 86400 else None


def _schema(parser, canonical, lang, project, projects, artworks, root, video_metadata):
    title = _clean(parser.title)
    description = _description(parser.meta("description"))
    base = _base_path(canonical)
    prefix = "/en" if lang == "en" else ""
    person = {"@type": "Person", "@id": SITE + "/#person",
              "name": "Lucas Casagrande", "url": SITE + "/"}
    profiles = [p for p in _SOCIAL_PROFILES
                if any(h.rstrip("/") == p.rstrip("/") for h in parser.links)]
    if profiles:
        person["sameAs"] = profiles
    website = {"@type": "WebSite", "@id": SITE + "/#website",
               "url": SITE + "/", "name": "Lucas Casagrande",
               "inLanguage": ["es-AR", "en"], "publisher": {"@id": person["@id"]}}
    page = {"@type": "CollectionPage" if base in ("/work/", "/artworks/") else "WebPage",
            "@id": canonical + "#webpage", "url": canonical, "name": title,
            "description": description, "inLanguage": lang,
            "isPartOf": {"@id": website["@id"]}}
    image = _image(parser.meta("og:image"), parser, root)
    graph = [person, website, page]
    if image:
        graph.append(image)
        page["primaryImageOfPage"] = {"@id": image["@id"]}
    if base == "/":
        page["about"] = {"@id": person["@id"]}
        reel = next((p for p in projects if p.get("slug") == "reel-2026"), None)
        if reel:
            vid = str(reel.get("vid", ""))
            metadata = (video_metadata or {}).get(vid, {})
            date = _verified_date(metadata) if str(metadata.get("id", vid)) == vid else None
            content = _public_media(reel.get("local_video"))
            poster = _public_media(reel.get("img"))
            visible = content and any(_public_media(c.get("data-local-video")) == content
                                      for c in parser.video_controls)
            exists = root is None or (content and (Path(root) / urlsplit(content).path.lstrip("/")).is_file())
            if date and vid.isdigit() and visible and exists and poster:
                reel_node = {"@type": "VideoObject", "@id": canonical + "#reel",
                             "name": _clean(reel["title"]), "description": _description(reel.get("body")),
                             "thumbnailUrl": poster, "uploadDate": date, "contentUrl": content,
                             "encodingFormat": "video/mp4", "mainEntityOfPage": {"@id": page["@id"]}}
                duration = _duration(reel.get("duration"))
                if duration:
                    reel_node["duration"] = duration
                graph.append(reel_node)
                page["video"] = {"@id": reel_node["@id"]}
    if project:
        work = {"@type": "CreativeWork", "@id": canonical + "#work",
                "url": canonical, "name": _clean(project.get("title") or title),
                "description": description,
                "mainEntityOfPage": {"@id": page["@id"]}}
        if image:
            work["image"] = {"@id": image["@id"]}
        # A portfolio contribution does not make Lucas sole creator/director.
        if project.get("role"):
            work["contributor"] = {"@id": person["@id"]}
            work["creditText"] = _clean(project["role"])
        page["mainEntity"] = {"@id": work["@id"]}
        graph.append(work)
        vid = str(project.get("vid", ""))
        metadata = (video_metadata or {}).get(vid, {})
        date = _verified_date(metadata) if str(metadata.get("id", vid)) == vid else None
        local_video = _public_media(project.get("local_video"))
        visible = any((local_video and _public_media(c.get("data-local-video")) == local_video)
                      or c.get("data-vimeo") == vid for c in parser.video_controls)
        if root is not None and local_video and not (Path(root) / urlsplit(local_video).path.lstrip("/")).is_file():
            local_video = None
        # Main case video only; never infer dates for other films in a case.
        if date and image and vid.isdigit() and visible:
            video = {"@type": "VideoObject", "@id": canonical + "#video",
                     "name": work["name"], "description": description,
                     "thumbnailUrl": _public_media(project.get("video_poster")) or image["contentUrl"], "uploadDate": date,
                     "isPartOf": {"@id": work["@id"]},
                     "mainEntityOfPage": {"@id": page["@id"]}}
            if local_video:
                video["contentUrl"] = local_video
                video["encodingFormat"] = "video/mp4"
            else:
                video["embedUrl"] = "https://player.vimeo.com/video/" + vid
            duration = _duration(project.get("duration"))
            if duration:
                video["duration"] = duration
            work["video"] = {"@id": video["@id"]}
            page["video"] = {"@id": video["@id"]}
            graph.append(video)
    elif base == "/work/":
        visible_paths = {urlsplit(urljoin(SITE, h)).path for h in parser.links}
        items = []
        for p in projects:
            path = prefix + "/work/" + p["slug"] + "/"
            if path not in visible_paths:
                continue
            items.append({"@type": "ListItem", "position": len(items) + 1,
                          "item": {"@type": "CreativeWork", "name": _clean(p["title"]),
                                   "url": _url(path)}})
        if items:
            page["mainEntity"] = {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}
    elif base == "/artworks/":
        visible_images = {_public_media(im["src"]) for im in parser.images}
        items = []
        for a in artworks:
            if not any(_public_media(a.get(k)) in visible_images
                       for k in ("image", "thumbnail") if a.get(k)):
                continue
            art_image = _image(a.get("image"), parser, root, a.get("description"))
            if not art_image:
                continue
            art_image["name"] = _clean(a["title"])
            graph.append(art_image)
            items.append({"@type": "ListItem", "position": len(items) + 1,
                          "item": {"@id": art_image["@id"]}})
        if items:
            page["mainEntity"] = {"@type": "ItemList", "numberOfItems": len(items), "itemListElement": items}
    return {"@context": "https://schema.org", "@graph": graph}


def _description(value, limit=200):
    value = _clean(value)
    if len(value) <= limit:
        return value
    return value[:limit - 1].rsplit(" ", 1)[0].rstrip(" ,;:") + "…"


def enhance_html(html, *, path, lang="es-AR", alternate_path=None, project=None,
                 projects=(), artworks=(), root=None, video_metadata=None):
    """Return enhanced HTML; does not write files.

    alternate_path is the explicit counterpart URL/path, not a redirect. The
    caller must render and translate it too. Unknown publication dates omit the
    VideoObject, while retaining the accurate CreativeWork and visible video.
    """
    lang = _locale(lang)
    canonical = _url(path)
    parser = _Page(html)
    match = re.search(r"<head\b[^>]*>(.*?)</head\s*>", html, re.I | re.S)
    indexable = _indexable(path, parser)
    if not match or not _clean(parser.title) or (indexable and not parser.meta("description")):
        raise ValueError("Rendered HTML needs head, localized title and description")
    title = _clean(parser.title)
    description = _description(parser.meta("description") or title)
    image = _image(parser.meta("og:image"), parser, root)

    def remove_tag(m):
        tag = m.group(0)
        attrs = dict(re.findall(r'([\w:-]+)\s*=\s*[\"\x27]([^\"\x27]*)[\"\x27]', tag))
        attrs = {k.lower(): unescape(v) for k, v in attrs.items()}
        key = attrs.get("name", attrs.get("property", "")).lower()
        rel = attrs.get("rel", "").lower().split()
        if tag.lower().startswith("<meta") and (key == "description" or key.startswith(("og:", "twitter:"))):
            return ""
        if tag.lower().startswith("<link") and ("canonical" in rel or ("alternate" in rel and "hreflang" in attrs)):
            return ""
        return tag

    head = re.sub(r"<(?:meta|link)\b[^>]*>", remove_tag, match[1], flags=re.I)
    head = re.sub(r'<script\b(?=[^>]*\bid=["\x27]' + MANAGED_ID + r'["\x27])[^>]*>.*?</script\s*>',
                  "", head, flags=re.I | re.S)
    tags = [f'<meta name="description" content="{escape(description, quote=True)}">',
            f'<link rel="canonical" href="{canonical}">']
    if not indexable and not any("noindex" in r.lower() for r in parser.robots):
        tags.append('<meta name="robots" content="noindex, follow">')
    if alternate_path and indexable:
        alternate = _url(alternate_path)
        if alternate == canonical:
            raise ValueError("Language counterpart cannot be the same URL")
        es, en = (alternate, canonical) if lang == "en" else (canonical, alternate)
        tags.extend(f'<link rel="alternate" hreflang="{code}" href="{url}">'
                    for code, url in (("es-AR", es), ("en", en), ("x-default", es)))
    values = {"og:type": "website", "og:site_name": "Lucas Casagrande",
              "og:title": title, "og:description": description, "og:url": canonical,
              "twitter:card": "summary_large_image", "twitter:title": title,
              "twitter:description": description}
    # Generic English has no selected territory; omit og:locale rather than
    # invent en_US. HTML lang, hreflang and schema inLanguage remain explicit.
    if lang == "es-AR":
        values["og:locale"] = "es_AR"
    if image:
        values.update({"og:image": image["contentUrl"], "twitter:image": image["contentUrl"]})
        if image.get("caption"):
            values.update({"og:image:alt": image["caption"], "twitter:image:alt": image["caption"]})
        for key in ("width", "height"):
            if image.get(key):
                values["og:image:" + key] = image[key]
    tags.extend(f'<meta {"property" if key.startswith("og:") else "name"}="{key}" content="{escape(str(value), quote=True)}">'
                for key, value in values.items())
    if indexable:
        data = _schema(parser, canonical, lang, project, projects, artworks, root, video_metadata)
        # Prevent a title/description containing </script> from ending the node.
        payload = json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
        tags.append(f'<script type="application/ld+json" id="{MANAGED_ID}">{payload}</script>')
    html = html[:match.start(1)] + head.rstrip() + "\n" + "\n".join(tags) + "\n" + html[match.end(1):]
    html = re.sub(r'(<html\b[^>]*?)\s+lang\s*=\s*["\x27][^"\x27]*["\x27]',
                  lambda m: m[1] + ' lang="' + lang + '"', html, count=1, flags=re.I)
    if not re.search(r"<html\b[^>]*\blang=", html, re.I):
        html = re.sub(r"<html\b", '<html lang="' + lang + '"', html, count=1, flags=re.I)
    return html


def audit_html(html):
    """Small deterministic check; not a substitute for Google's live validators."""
    parser = _Page(html)
    head = re.search(r"<head\b[^>]*>(.*?)</head\s*>", html, re.I | re.S)
    errors = []
    if not head:
        return {"errors": ["missing_head"], "videos": 0}
    canonical = re.findall(r'<link\b(?=[^>]*\brel=["\x27]canonical["\x27])[^>]*>', head[1], re.I)
    if len(canonical) != 1:
        errors.append("canonical_count:" + str(len(canonical)))
    for key in ("description", "og:title", "og:description", "og:url", "twitter:title", "twitter:description"):
        count = sum(m.get("name", m.get("property", "")).lower() == key for m in parser.metas)
        if count != 1:
            errors.append(key + "_count:" + str(count))
    videos = 0
    for script in parser.jsonld:
        try:
            data = json.loads(script["text"])
        except json.JSONDecodeError:
            errors.append("invalid_jsonld")
            continue
        nodes = data if isinstance(data, list) else data.get("@graph", [data])
        for node in nodes:
            if node.get("@type") == "VideoObject":
                videos += 1
                if not all(node.get(k) for k in ("name", "thumbnailUrl", "uploadDate")):
                    errors.append("incomplete_video")
    return {"errors": errors, "videos": videos,
            "noindex": any("noindex" in r.lower() for r in parser.robots)}


def generate_discovery(root):
    """Write a sitemap index + plain ES/EN children, preserving robots policy.

    Uses actual indexable HTML, checks reciprocal annotations, and never invents
    lastmod dates. Language alternatives remain in HTML, not sitemap extensions.
    Fails before writing if a counterpart is missing/inconsistent.
    """
    root = Path(root)
    pages = {}
    for file in sorted(root.rglob("*.html")):
        relative = file.relative_to(root)
        if any(part.startswith(".") or part in ("node_modules", "scripts", "data", "assets", "__pycache__")
               for part in relative.parts):
            continue
        path = "/" + relative.as_posix()
        url = _url(path)
        html = file.read_text(encoding="utf-8")
        parser = _Page(html)
        if not _indexable(url, parser):
            continue
        head = re.search(r"<head\b[^>]*>(.*?)</head\s*>", html, re.I | re.S)
        if not head:
            continue
        alternates = {}
        for tag in re.findall(r"<link\b[^>]*>", head[1], flags=re.I):
            attrs = dict(re.findall(r'([\w:-]+)\s*=\s*["\x27]([^"\x27]*)["\x27]', tag))
            if attrs.get("rel") == "alternate" and attrs.get("hreflang"):
                alternates[attrs["hreflang"]] = _url(unescape(attrs.get("href", "")))
        pages[url] = alternates
    for url, alternates in pages.items():
        if alternates:
            if set(alternates) != {"es-AR", "en", "x-default"}:
                raise ValueError("Incomplete language set: " + url)
            if alternates["es-AR"] != alternates["x-default"] or url not in alternates.values():
                raise ValueError("Inconsistent language fallback/self-link: " + url)
            for other in set(alternates.values()):
                if other not in pages or pages[other] != alternates:
                    raise ValueError("Missing reciprocal indexable language page: " + other)
    es_urls = [url for url in pages if not urlsplit(url).path.startswith("/en/")]
    en_urls = [url for url in pages if urlsplit(url).path.startswith("/en/")]
    if not es_urls or {SITE + _base_path(url) for url in en_urls} != set(es_urls):
        raise ValueError("Discovery requires matching non-empty Spanish and English URL sets")
    ns = "http://www.sitemaps.org/schemas/sitemap/0.9"
    ET.register_namespace("", ns)
    index = ET.Element("{" + ns + "}sitemapindex")
    children = []
    for language, filename, urls in (("es-AR", "sitemap-es.xml", es_urls), ("en", "sitemap-en.xml", en_urls)):
        document = ET.Element("{" + ns + "}urlset")
        for url in urls:
            ET.SubElement(ET.SubElement(document, "{" + ns + "}url"), "{" + ns + "}loc").text = url
        ET.indent(document, space="  ")
        children.append({"language": language, "filename": filename, "urls": len(urls),
                         "xml": ET.tostring(document, encoding="unicode", xml_declaration=True) + "\n"})
        ET.SubElement(ET.SubElement(index, "{" + ns + "}sitemap"), "{" + ns + "}loc").text = SITE + "/" + filename
    ET.indent(index, space="  ")
    sitemap = ET.tostring(index, encoding="unicode", xml_declaration=True) + "\n"
    robot_file = root / "robots.txt"
    old_robots = robot_file.read_text(encoding="utf-8") if robot_file.is_file() else "User-agent: *\nAllow: /\n"
    sitemap_line = "Sitemap: " + SITE + "/sitemap.xml"
    # Keep other sitemap declarations and all crawler/training directives intact.
    lines = [line for line in old_robots.splitlines()
             if not (line.strip().lower().startswith("sitemap:")
                     and line.split(":", 1)[1].strip().rstrip("/") == SITE + "/sitemap.xml")]
    robots = "\n".join(lines).rstrip() + "\n" + sitemap_line + "\n"
    for child in children:
        (root / child["filename"]).write_text(child["xml"], encoding="utf-8")
    (root / "sitemap.xml").write_text(sitemap, encoding="utf-8")
    robot_file.write_text(robots, encoding="utf-8")
    return {"urls": len(pages), "language_pairs": len(es_urls), "sitemap_index": True,
            "child_sitemaps": [{k: v for k, v in child.items() if k != "xml"} for child in children],
            "hreflang_location": "HTML",
            "sitemap": str(root / "sitemap.xml"), "robots": str(robot_file),
            "robots_policy_preserved": True, "lastmod_omitted": True}
