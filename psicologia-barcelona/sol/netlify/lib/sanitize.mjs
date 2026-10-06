// Limpieza del HTML que llega desde el panel: sólo se aceptan etiquetas de texto simples.
// Lo usa la función del panel antes de guardar (nunca se guarda HTML sin pasar por acá).

const INLINE = new Set(['em', 'strong', 'b', 'i', 'br', 'a']);
const BLOCK = new Set(['p', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote']);
const VOID = new Set(['br']);
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|template|svg|math|noscript|textarea|select)\b[\s\S]*?<\/\1\s*>/gi;
const ENTITY = /^&(#\d{1,7}|#x[0-9a-f]{1,6}|[a-z][a-z0-9]{1,31});/i;

export const MAX_FIELD = 60000;

// Los textos largos (artículos, privacidad) admiten párrafos, subtítulos, listas y citas.
export function isBlockKey(key) {
  return /\.body$/.test(key);
}

function escapeText(text) {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '<') out += '&lt;';
    else if (ch === '>') out += '&gt;';
    else if (ch === '"') out += '&quot;';
    else if (ch === '&') {
      const m = text.slice(i).match(ENTITY);
      if (m) { out += m[0]; i += m[0].length - 1; } else out += '&amp;';
    } else out += ch;
  }
  return out;
}

function safeHref(raw) {
  const value = raw.trim().replace(/&amp;/g, '&');
  if (/^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test(value) && !/[\s<>"'`]/.test(value)) {
    return value.replace(/&/g, '&amp;');
  }
  return null;
}

export function sanitize(html, { block = false } = {}) {
  if (typeof html !== 'string') return '';
  let s = html.slice(0, MAX_FIELD);
  s = s.replace(/<!--[\s\S]*?(-->|$)/g, '').replace(DROP_WITH_CONTENT, '');
  const allowed = (tag) => INLINE.has(tag) || (block && BLOCK.has(tag));
  const open = [];
  let out = '';
  let last = 0;
  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)\b((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let m;
  while ((m = tagRe.exec(s))) {
    out += escapeText(s.slice(last, m.index));
    last = tagRe.lastIndex;
    const closing = m[0][1] === '/';
    const tag = m[1].toLowerCase();
    const normal = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag;
    if (!allowed(tag)) {
      // <div> y <p> sueltos (por ejemplo al pegar) se convierten en salto de línea en los textos cortos.
      if (!block && !closing && /^(div|p|h[1-6]|li|blockquote)$/.test(tag) && out.trim() && !out.endsWith('<br>')) out += '<br>';
      continue;
    }
    if (VOID.has(normal)) { if (!closing) out += '<br>'; continue; }
    if (closing) {
      const idx = open.lastIndexOf(normal);
      if (idx === -1) continue;
      while (open.length > idx) out += `</${open.pop()}>`;
      continue;
    }
    if (normal === 'a') {
      const hrefMatch = m[2].match(/\bhref\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i);
      const href = hrefMatch ? safeHref(hrefMatch[2] ?? hrefMatch[3] ?? hrefMatch[4] ?? '') : null;
      if (!href) continue;
      const external = /^https?:\/\//i.test(href);
      out += `<a href="${href}"${external ? ' target="_blank" rel="noopener"' : ''}>`;
    } else {
      out += `<${normal}>`;
    }
    open.push(normal);
  }
  out += escapeText(s.slice(last));
  while (open.length) out += `</${open.pop()}>`;
  return out.replace(/(<br>\s*)+$/g, '').trim();
}

// Para título y descripción de la página (texto plano).
export function cleanPlain(text, max) {
  if (typeof text !== 'string') return '';
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
