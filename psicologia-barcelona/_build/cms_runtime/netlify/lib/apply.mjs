// Aplica lo guardado en el panel sobre el HTML publicado.
// Lo usan la edge function (en cada visita) y el panel (para la vista previa).

const MARKER = /<!--cms:([\w.-]+)-->([\s\S]*?)<!--\/cms-->/g;

export function escapeAttr(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function digits(value) {
  return String(value).replace(/\D/g, '');
}

// Pares [buscar, reemplazar] para los datos de contacto cambiados en el panel.
export function contactReplacements(site, contact) {
  const pairs = [];
  for (const def of site.contacts || []) {
    const value = contact && contact[def.id];
    if (!value || value === def.original) continue;
    if (def.type === 'phone') {
      pairs.push([def.original, value]);
      if (digits(def.original) !== digits(value)) pairs.push([digits(def.original), digits(value)]);
    } else if (def.type === 'instagram') {
      pairs.push([`instagram.com/${def.original}`, `instagram.com/${value}`]);
      pairs.push([`@${def.original}`, `@${value}`]);
    } else {
      pairs.push([def.original, value]);
    }
  }
  return pairs;
}

export function applyTexts(html, texts) {
  if (!texts || !Object.keys(texts).length) return html;
  return html.replace(MARKER, (whole, key) => (
    Object.prototype.hasOwnProperty.call(texts, key) && typeof texts[key] === 'string'
      ? `<!--cms:${key}-->${texts[key]}<!--/cms-->`
      : whole
  ));
}

export function applySeo(html, seo) {
  if (!seo) return html;
  const page = html.match(/<meta name="cms-page" content="([^"]+)">/);
  const entry = page && seo[page[1]];
  if (!entry) return html;
  let out = html;
  if (entry.title) {
    const t = escapeAttr(entry.title);
    out = out.replace(/<title>[\s\S]*?<\/title>/, () => `<title>${t}</title>`)
      .replace(/(<meta property="og:title" content=")[^"]*(")/, (_, a, b) => a + t + b);
  }
  if (entry.description) {
    const d = escapeAttr(entry.description);
    out = out.replace(/(<meta name="description" content=")[^"]*(")/, (_, a, b) => a + d + b)
      .replace(/(<meta property="og:description" content=")[^"]*(")/, (_, a, b) => a + d + b);
  }
  return out;
}

export function applyContact(html, site, contact) {
  let out = html;
  for (const [from, to] of contactReplacements(site, contact)) {
    out = out.split(from).join(to);
  }
  return out;
}

export function applyCms(html, data, site) {
  if (!data) return html;
  let out = applyTexts(html, data.texts);
  out = applySeo(out, data.seo);
  out = applyContact(out, site, data.contact);
  return out;
}
