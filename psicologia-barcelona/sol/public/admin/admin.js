// Panel de control — edición de textos con vista previa en vivo.
import { sanitize, isBlockKey } from './sanitize.mjs';

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const API = '/api/cms';
const TOKEN_KEY = 'cms-token';

const state = {
  site: null,
  token: null,
  saved: { texts: {}, seo: {}, contact: {} },
  draft: { texts: {}, seo: {}, contact: {} },
  history: [],
  page: null,
  entries: new Map(), // clave → { originalNorm, nodes: [{ start, end }] }
  fieldEls: new Map(), // clave → elemento .field
  seoOriginal: { title: '', description: '' },
  pageKey: null,
  hover: null,
};

/* ---------- utilidades ---------- */
const storage = {
  get() { try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; } },
  set(v) { try { sessionStorage.setItem(TOKEN_KEY, v); } catch { /* sin almacenamiento */ } },
  clear() { try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* sin almacenamiento */ } },
};

let toastTimer;
function toast(message, isError = false) {
  const el = $('#toast');
  el.textContent = message;
  el.classList.toggle('is-error', isError);
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, isError ? 7000 : 4500);
}

async function api(method, body) {
  const res = await fetch(API, {
    method,
    headers: { 'content-type': 'application/json', ...(state.token && { authorization: `Bearer ${state.token}` }) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch { /* respuesta vacía */ }
  if (res.status === 401 && body?.action !== 'login') {
    showLogin('Tu sesión terminó. Vuelve a entrar (tus cambios sin guardar siguen acá).');
  }
  if (!res.ok) throw new Error(data.error || 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.');
  return data;
}

const has = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
const plain = (html) => { const d = document.createElement('div'); d.innerHTML = html; return d.textContent.replace(/\s+/g, ' ').trim(); };

/* ---------- etiquetas legibles ---------- */
const NAMES = {
  eyebrow: 'Antetítulo', h1: 'Título principal', lead: 'Texto destacado', kicker: 'Etiqueta de sección', title: 'Título',
  sub: 'Subtítulo', quote: 'Cita', primary: 'Botón principal', secondary: 'Botón secundario', label: 'Texto del enlace',
  badge: 'Insignia', caption: 'Pie de foto', rotate_intro: 'Frase que rota · inicio', rotate: 'Frase que rota',
  paras: 'Párrafo', q: 'Pregunta', a: 'Respuesta', name: 'Nombre', text: 'Texto', meta: 'Detalle', words: 'Palabra',
  lines: 'Línea', facts: 'Dato', k: 'Dato', v: 'Descripción', t: 'Título', d: 'Descripción', cta: 'Botón', note: 'Nota',
  body: 'Texto completo', role: 'Descripción', team: 'Texto', legal: 'Texto legal', when: 'Fecha', what: 'Título', where: 'Detalle',
  items: 'Elemento', points: 'Punto', langs: 'Idiomas', sign: 'Firma', intro: 'Introducción', research: 'Pregunta de investigación',
  research_kicker: 'Etiqueta', research_note: 'Texto', read: 'Botón «Leer»', more: 'Enlace «Ver todo»', web: 'Botón web',
  write: 'Botón escribir', wa_label: 'Botón WhatsApp', mail_label: 'Texto email', email: 'Email visible', phone: 'Teléfono visible',
  ig_label: 'Enlace Instagram', online_zone: 'Online · etiqueta', online_title: 'Online · título', online_detail: 'Online · detalle',
  in_person: 'Presencial · etiqueta', address_note: 'Nota sobre la dirección', tagline: 'Lema', excerpt: 'Resumen', description: 'Entradilla',
  tag: 'Categoría', date_label: 'Fecha', migr_title: 'Título', migr_text: 'Texto', extra: 'Seminario', extra_title: 'Título',
  consent_text: 'Texto del aviso', consent_more: 'Enlace', consent_reject: 'Botón rechazar', consent_accept: 'Botón aceptar',
  skip: 'Saltar al contenido', menu: 'Abrir menú', privacy: 'Enlace privacidad', back: 'Volver', home: 'Inicio',
  cta_title: 'Llamada · título', cta_text: 'Llamada · texto', cta_button: 'Llamada · botón', disclaimer: 'Aviso',
  minutes: 'min', minutes_long: 'min de lectura', author: 'Autoría', img_alt: 'Descripción de la foto',
};
function fieldName(key) {
  const parts = key.split('.');
  let num = null;
  for (let i = parts.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(parts[i])) { if (num === null) num = Number(parts[i]) + 1; continue; }
    const name = NAMES[parts[i]] || parts[i].replace(/_/g, ' ');
    return num === null ? name : `${name} ${num}`;
  }
  return key;
}

function groupName(el) {
  if (!el || el.matches('body')) return 'Otros textos (botón flotante del móvil y accesibilidad)';
  if (el.matches('header, .site-header')) return 'Menú y cabecera';
  if (el.matches('footer, .site-footer')) return 'Pie de página';
  if (el.matches('.consent')) return 'Aviso de analítica (cookies)';
  if (el.matches('.marquee')) return 'Banda de palabras en movimiento';
  const heading = el.querySelector('h1, h2');
  const kicker = el.querySelector('.kicker, .eyebrow, .scene-kicker');
  const text = (el.matches('[data-hero], .hero') ? 'Portada' : '') || plain((kicker || heading || el).innerHTML).slice(0, 48);
  return text || 'Sección';
}

/* ---------- entrada ---------- */
function showLogin(message) {
  $('#app').hidden = true;
  $('#login').hidden = false;
  const err = $('#login-error');
  err.hidden = !message;
  err.textContent = message || '';
  $('#password').focus();
}

$('[data-toggle-password]').addEventListener('click', (e) => {
  const input = $('#password');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  e.currentTarget.textContent = show ? 'Ocultar' : 'Mostrar';
  e.currentTarget.setAttribute('aria-pressed', String(show));
});

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.submitter || $('#login-form button[type=submit]');
  const err = $('#login-error');
  err.hidden = true;
  const password = $('#password').value;
  if (!password) { err.textContent = 'Escribe la contraseña.'; err.hidden = false; return; }
  btn.disabled = true;
  btn.textContent = 'Entrando…';
  try {
    const { token } = await api('POST', { action: 'login', password });
    state.token = token;
    storage.set(token);
    $('#password').value = '';
    await start();
  } catch (error) {
    err.textContent = error.message;
    err.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
});

$('#logout').addEventListener('click', () => {
  if (isDirty() && !confirm('Tienes cambios sin guardar. ¿Salir igualmente?')) return;
  state.token = null;
  storage.clear();
  state.draft = { texts: {}, seo: {}, contact: {} };
  updateStatus();
  showLogin('Saliste del panel.');
});

/* ---------- arranque ---------- */
async function loadSite() {
  const res = await fetch('/admin/site.json', { cache: 'no-store' });
  state.site = await res.json();
  document.title = `Panel · ${state.site.name}`;
  $$('[data-site-name]').forEach((el) => { el.textContent = state.site.name; });
  document.documentElement.style.setProperty('--accent', state.site.accent);
  const select = $('#page-select');
  select.textContent = '';
  const groups = new Map();
  for (const page of state.site.pages) {
    if (!groups.has(page.group)) {
      const og = document.createElement('optgroup');
      og.label = page.group;
      groups.set(page.group, og);
      select.append(og);
    }
    const opt = document.createElement('option');
    opt.value = page.path;
    opt.textContent = page.label;
    groups.get(page.group).append(opt);
  }
}

async function start() {
  const { data, history } = await api('GET');
  state.saved = { texts: {}, seo: {}, contact: {}, ...data };
  state.history = history;
  $('#login').hidden = true;
  $('#app').hidden = false;
  renderContact();
  updateStatus();
  const fromHash = decodeURIComponent(location.hash.slice(1));
  const page = state.site.pages.find((p) => p.path === fromHash) || state.site.pages[0];
  openPage(page.path);
}

/* ---------- vista previa ---------- */
const frame = $('#frame');

function openPage(path) {
  state.page = path;
  $('#page-select').value = path;
  $('#view-site').href = path;
  history.replaceState(null, '', `#${encodeURIComponent(path)}`);
  $('#fields').innerHTML = '<p class="empty">Cargando la página…</p>';
  frame.src = `${path}?cms=original`;
}

$('#page-select').addEventListener('change', (e) => openPage(e.target.value));

frame.addEventListener('load', () => {
  const doc = frame.contentDocument;
  if (!doc || !doc.body) return;
  const url = new URL(frame.contentWindow.location.href);
  if (url.protocol === 'about:' || !state.page) return;
  if (url.searchParams.get('cms') !== 'original') {
    // Se navegó a otra página desde dentro de la vista previa.
    const page = state.site.pages.find((p) => p.path === url.pathname);
    openPage(page ? page.path : state.page);
    return;
  }
  const link = doc.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/admin/preview.css';
  doc.head.append(link);
  collectEntries(doc);
  readSeo(doc);
  applyAllToPreview();
  renderFields(doc);
  renderSeo();
  bindPreview(doc);
});

function collectEntries(doc) {
  state.entries = new Map();
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_COMMENT);
  const open = [];
  let node;
  while ((node = walker.nextNode())) {
    const m = node.data.match(/^cms:([\w.-]+)$/);
    if (m) { open.push({ key: m[1], start: node }); continue; }
    if (node.data === '/cms' && open.length) {
      const { key, start } = open.pop();
      if (!state.entries.has(key)) {
        state.entries.set(key, { originalNorm: sanitize(rangeHtml(doc, start, node), { block: isBlockKey(key) }), nodes: [], block: isBlockKey(key) });
      }
      state.entries.get(key).nodes.push({ start, end: node });
    }
  }
}

function rangeHtml(doc, start, end) {
  const holder = doc.createElement('div');
  for (let n = start.nextSibling; n && n !== end; n = n.nextSibling) holder.append(n.cloneNode(true));
  return holder.innerHTML;
}

function effective(key) {
  const entry = state.entries.get(key);
  if (has(state.draft.texts, key)) return state.draft.texts[key] === null ? entry.originalNorm : state.draft.texts[key];
  if (has(state.saved.texts, key)) return state.saved.texts[key];
  return entry.originalNorm;
}

function setPreview(key, html) {
  const entry = state.entries.get(key);
  if (!entry) return;
  for (const { start, end } of entry.nodes) {
    while (start.nextSibling && start.nextSibling !== end) start.nextSibling.remove();
    const frag = start.ownerDocument.createRange().createContextualFragment(html);
    end.parentNode.insertBefore(frag, end);
  }
}

function applyAllToPreview() {
  for (const key of state.entries.keys()) {
    if (has(state.draft.texts, key) || has(state.saved.texts, key)) setPreview(key, effective(key));
  }
}

function entryForNode(target) {
  for (const [key, entry] of state.entries) {
    for (const { start, end } of entry.nodes) {
      const range = start.ownerDocument.createRange();
      range.setStartAfter(start);
      range.setEndBefore(end);
      try {
        if (range.comparePoint(target, 0) === 0 && target !== start.parentNode) return { key, el: start.parentElement };
      } catch { /* nodo en otro árbol */ }
    }
  }
  for (const [key, entry] of state.entries) {
    for (const { start } of entry.nodes) if (start.parentNode === target) return { key, el: target };
  }
  return null;
}

function bindPreview(doc) {
  doc.addEventListener('click', (e) => {
    const hit = entryForNode(e.target);
    if (hit) {
      e.preventDefault();
      e.stopPropagation();
      focusField(hit.key);
      return;
    }
    const a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    const url = new URL(a.href, doc.baseURI);
    if (url.origin !== location.origin) {
      e.preventDefault();
      toast('Los enlaces externos (WhatsApp, Instagram…) no se abren desde la vista previa.');
      return;
    }
    if (url.pathname === new URL(doc.baseURI).pathname && url.hash) return;
    e.preventDefault();
    const page = state.site.pages.find((p) => p.path === url.pathname);
    if (page) openPage(page.path);
    else toast('Esa página no se edita desde el panel.');
  }, true);
  doc.addEventListener('mouseover', (e) => {
    const hit = entryForNode(e.target);
    const el = hit ? hit.el : null;
    if (state.hover === el) return;
    state.hover?.removeAttribute('data-cms-hover');
    state.hover = el;
    el?.setAttribute('data-cms-hover', '');
  });
}

function flashInPreview(key) {
  const entry = state.entries.get(key);
  const el = entry?.nodes[0]?.start.parentElement;
  if (!el) return;
  el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  el.setAttribute('data-cms-flash', '');
  setTimeout(() => el.removeAttribute('data-cms-flash'), 1400);
}

/* ---------- campos de texto ---------- */
function renderFields(doc) {
  const container = $('#fields');
  container.textContent = '';
  state.fieldEls = new Map();
  const groups = new Map();
  for (const [key, entry] of state.entries) {
    const host = entry.nodes[0].start.parentElement;
    const section = host.closest('section, header, footer, aside, .marquee, article.article, .page-hero') || doc.body;
    if (!groups.has(section)) groups.set(section, []);
    groups.get(section).push(key);
  }
  if (!groups.size) {
    container.innerHTML = '<p class="empty">Esta página no tiene textos editables.</p>';
    return;
  }
  // Los textos sueltos (fuera de una sección) van al final.
  const ordered = [...groups].sort(([a], [b]) => (a === doc.body) - (b === doc.body));
  let first = true;
  for (const [section, keys] of ordered) {
    const details = document.createElement('details');
    details.className = 'group';
    details.open = first;
    first = false;
    const summary = document.createElement('summary');
    summary.textContent = groupName(section);
    const count = document.createElement('span');
    count.className = 'group-count';
    count.textContent = `${keys.length}`;
    summary.append(count);
    const body = document.createElement('div');
    body.className = 'group-body';
    for (const key of keys) body.append(buildField(key));
    details.append(summary, body);
    container.append(details);
  }
  filterFields($('#search').value);
}

function buildField(key) {
  const entry = state.entries.get(key);
  const wrap = document.createElement('div');
  wrap.className = 'field';
  wrap.dataset.key = key;
  const id = `f-${key.replace(/[^\w-]/g, '-')}`;

  const head = document.createElement('div');
  head.className = 'field-head';
  const label = document.createElement('span');
  label.id = `${id}-label`;
  label.textContent = fieldName(key);
  const badge = document.createElement('span');
  badge.className = 'badge';
  head.append(label, badge);

  const input = document.createElement('div');
  input.className = `field-input${entry.block ? ' is-block' : ''}`;
  input.id = id;
  input.contentEditable = 'true';
  input.setAttribute('role', 'textbox');
  input.setAttribute('aria-labelledby', label.id);
  if (entry.block) input.setAttribute('aria-multiline', 'true');
  input.spellcheck = true;
  input.innerHTML = effective(key);

  const tools = document.createElement('div');
  tools.className = 'field-tools';
  const tool = (text, title, fn) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.addEventListener('mousedown', (e) => e.preventDefault());
    b.addEventListener('click', () => { input.focus(); fn(); onFieldInput(key, input); });
    tools.append(b);
  };
  tool('Cursiva', 'Cursiva (Ctrl+I)', () => document.execCommand('italic'));
  tool('Negrita', 'Negrita (Ctrl+B)', () => document.execCommand('bold'));
  if (entry.block) {
    tool('Párrafo', 'Convertir en párrafo', () => document.execCommand('formatBlock', false, 'p'));
    tool('Subtítulo', 'Convertir en subtítulo', () => document.execCommand('formatBlock', false, 'h2'));
    tool('Lista', 'Lista con viñetas', () => document.execCommand('insertUnorderedList'));
    tool('Cita', 'Cita destacada', () => document.execCommand('formatBlock', false, 'blockquote'));
    tool('Enlace', 'Agregar un enlace al texto seleccionado', () => {
      const url = prompt('Dirección del enlace (https://…, mailto:… o /pagina/)');
      if (url) document.execCommand('createLink', false, url.trim());
    });
  }
  tool('Quitar formato', 'Quitar cursiva y negrita', () => document.execCommand('removeFormat'));

  const foot = document.createElement('div');
  foot.className = 'field-foot';
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'link-button';
  reset.textContent = 'Volver al texto original';
  reset.addEventListener('click', () => {
    input.innerHTML = entry.originalNorm;
    onFieldInput(key, input);
  });
  foot.append(reset);

  input.addEventListener('input', () => onFieldInput(key, input));
  input.addEventListener('focus', () => flashInPreview(key));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !entry.block) {
      e.preventDefault();
      if (e.shiftKey) { document.execCommand('insertLineBreak'); onFieldInput(key, input); }
    }
  });
  input.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    if (entry.block) {
      const html = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
        .map((p) => `<p>${p.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])).replace(/\n/g, '<br>')}</p>`).join('');
      document.execCommand('insertHTML', false, html);
    } else {
      document.execCommand('insertText', false, text.replace(/\s*\n\s*/g, ' '));
    }
  });
  input.addEventListener('drop', (e) => e.preventDefault());

  wrap.append(head, input, tools, foot);
  state.fieldEls.set(key, wrap);
  refreshBadge(key);
  return wrap;
}

function onFieldInput(key, input) {
  const entry = state.entries.get(key);
  const value = sanitize(input.innerHTML, { block: entry.block });
  const base = has(state.saved.texts, key) ? state.saved.texts[key] : entry.originalNorm;
  if (value === base) delete state.draft.texts[key];
  else if (value === entry.originalNorm) state.draft.texts[key] = null;
  else state.draft.texts[key] = value;
  setPreview(key, value);
  refreshBadge(key);
  updateStatus();
}

function refreshBadge(key) {
  const wrap = state.fieldEls.get(key);
  if (!wrap) return;
  const badge = $('.badge', wrap);
  const reset = $('.link-button', wrap);
  const pending = has(state.draft.texts, key);
  const savedChange = has(state.saved.texts, key) && state.draft.texts[key] !== null;
  badge.className = 'badge';
  if (pending) { badge.classList.add('badge-edited'); badge.textContent = 'Sin guardar'; }
  else if (savedChange) { badge.classList.add('badge-saved'); badge.textContent = 'Modificado'; }
  else badge.textContent = '';
  const current = has(state.draft.texts, key) ? state.draft.texts[key] : (has(state.saved.texts, key) ? state.saved.texts[key] : null);
  reset.hidden = current === null;
}

function focusField(key) {
  selectTab('texts');
  if (window.matchMedia('(max-width: 900px)').matches) setView('edit');
  const wrap = state.fieldEls.get(key);
  if (!wrap) return;
  $('#search').value = '';
  filterFields('');
  wrap.closest('details').open = true;
  wrap.scrollIntoView({ block: 'center', behavior: 'smooth' });
  wrap.classList.add('is-target');
  setTimeout(() => wrap.classList.remove('is-target'), 1600);
  const input = $('.field-input', wrap);
  input.focus({ preventScroll: true });
}

function filterFields(query) {
  const q = query.trim().toLowerCase();
  for (const group of $$('.group')) {
    let visible = 0;
    for (const field of $$('.field', group)) {
      const text = `${fieldName(field.dataset.key)} ${$('.field-input', field).textContent}`.toLowerCase();
      const show = !q || text.includes(q);
      field.hidden = !show;
      if (show) visible++;
    }
    group.hidden = visible === 0;
    if (q && visible) group.open = true;
  }
}
$('#search').addEventListener('input', (e) => filterFields(e.target.value));

/* ---------- contacto ---------- */
function contactValue(def) {
  if (has(state.draft.contact, def.id)) return state.draft.contact[def.id] ?? def.original;
  return state.saved.contact[def.id] ?? def.original;
}

function renderContact() {
  const box = $('#contact-fields');
  box.textContent = '';
  for (const def of state.site.contacts) {
    const wrap = document.createElement('div');
    const id = `c-${def.id}`;
    const label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = id;
    label.textContent = def.label;
    const input = document.createElement('input');
    input.id = id;
    input.type = def.type === 'email' ? 'email' : def.type === 'phone' ? 'tel' : 'text';
    input.value = contactValue(def);
    input.autocomplete = 'off';
    const help = document.createElement('p');
    help.className = 'field-help';
    help.textContent = def.type === 'phone' ? `Con prefijo de país, como está ahora: ${def.original}` : def.type === 'instagram' ? `Sólo el usuario, sin @. Ahora: ${def.original}` : `Ahora: ${def.original}`;
    input.addEventListener('input', () => {
      const v = input.value.trim();
      const base = state.saved.contact[def.id] ?? def.original;
      if (v === base) delete state.draft.contact[def.id];
      else if (v === def.original || v === '') state.draft.contact[def.id] = null;
      else state.draft.contact[def.id] = v;
      updateStatus();
    });
    wrap.append(label, input, help);
    box.append(wrap);
  }
}

/* ---------- Google (título y descripción) ---------- */
function readSeo(doc) {
  state.pageKey = doc.querySelector('meta[name="cms-page"]')?.content || null;
  state.seoOriginal = {
    title: doc.title,
    description: doc.querySelector('meta[name="description"]')?.content || '',
  };
}

function seoValue(field) {
  const k = state.pageKey;
  if (has(state.draft.seo, k)) return state.draft.seo[k]?.[field] || state.seoOriginal[field];
  return state.saved.seo[k]?.[field] || state.seoOriginal[field];
}

function renderSeo() {
  const enabled = !!state.pageKey;
  $('#seo-title').disabled = !enabled;
  $('#seo-description').disabled = !enabled;
  $('#seo-title').value = enabled ? seoValue('title') : '';
  $('#seo-description').value = enabled ? seoValue('description') : '';
  updateSerp();
}

function updateSerp() {
  const t = $('#seo-title').value;
  const d = $('#seo-description').value;
  const tc = $('#seo-title-count');
  const dc = $('#seo-description-count');
  tc.textContent = `${t.length} / 60`;
  dc.textContent = `${d.length} / 160`;
  tc.classList.toggle('is-over', t.length > 60);
  dc.classList.toggle('is-over', d.length > 160);
  $('#serp-url').textContent = `${state.site.url.replace(/^https?:\/\//, '')}${state.page === '/' ? '' : ` › ${state.page.replace(/^\/|\/$/g, '').replace(/\//g, ' › ')}`}`;
  $('#serp-title').textContent = t;
  $('#serp-desc').textContent = d;
}

function onSeoInput() {
  const k = state.pageKey;
  if (!k) return;
  const title = $('#seo-title').value.trim();
  const description = $('#seo-description').value.trim();
  const saved = state.saved.seo[k] || {};
  const next = {
    title: title && title !== state.seoOriginal.title ? title : '',
    description: description && description !== state.seoOriginal.description ? description : '',
  };
  const same = (next.title || '') === (saved.title || '') && (next.description || '') === (saved.description || '');
  if (same) delete state.draft.seo[k];
  else state.draft.seo[k] = next;
  updateSerp();
  updateStatus();
}
$('#seo-title').addEventListener('input', onSeoInput);
$('#seo-description').addEventListener('input', onSeoInput);
$('#seo-reset').addEventListener('click', () => {
  $('#seo-title').value = state.seoOriginal.title;
  $('#seo-description').value = state.seoOriginal.description;
  onSeoInput();
});

/* ---------- guardar ---------- */
function changeCount() {
  return Object.keys(state.draft.texts).length + Object.keys(state.draft.seo).length + Object.keys(state.draft.contact).length;
}
function isDirty() { return changeCount() > 0; }

function updateStatus(message, kind) {
  const n = changeCount();
  const status = $('#status');
  status.className = 'status';
  if (message) {
    status.textContent = message;
    if (kind) status.classList.add(kind);
  } else if (n) {
    status.textContent = n === 1 ? '1 cambio sin guardar' : `${n} cambios sin guardar`;
    status.classList.add('is-dirty');
  } else {
    status.textContent = 'Todo guardado';
  }
  $('#save').disabled = !n;
  $('#discard').disabled = !n;
}

async function save() {
  if (!isDirty()) return;
  const btn = $('#save');
  btn.disabled = true;
  btn.textContent = 'Guardando…';
  try {
    const { data, history } = await api('POST', { action: 'save', ...state.draft });
    state.saved = { texts: {}, seo: {}, contact: {}, ...data };
    state.history = history;
    state.draft = { texts: {}, seo: {}, contact: {} };
    for (const key of state.fieldEls.keys()) refreshBadge(key);
    renderContact();
    renderSeo();
    updateStatus();
    toast('¡Guardado! La web se actualiza en menos de un minuto.');
  } catch (error) {
    updateStatus('No se pudo guardar', 'is-error');
    toast(error.message, true);
    setTimeout(() => updateStatus(), 4000);
  } finally {
    btn.textContent = 'Guardar y publicar';
    btn.disabled = !isDirty();
  }
}
$('#save').addEventListener('click', save);
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !$('#app').hidden) {
    e.preventDefault();
    save();
  }
});

$('#discard').addEventListener('click', () => {
  if (!confirm('¿Descartar todos los cambios sin guardar?')) return;
  state.draft = { texts: {}, seo: {}, contact: {} };
  renderContact();
  updateStatus();
  openPage(state.page);
});

window.addEventListener('beforeunload', (e) => {
  if (isDirty()) { e.preventDefault(); e.returnValue = ''; }
});

/* ---------- pestañas y vistas ---------- */
function selectTab(name) {
  for (const t of ['texts', 'contact', 'seo']) {
    $(`#tab-${t}`).setAttribute('aria-selected', String(t === name));
    $(`#panel-${t}`).hidden = t !== name;
  }
}
$$('.tabs [role=tab]').forEach((tab) => tab.addEventListener('click', () => selectTab(tab.id.replace('tab-', ''))));

function setView(view) {
  $('.workspace').dataset.view = view;
  $$('.mobile-switch button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.view === view)));
}
$$('.mobile-switch button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));

$$('[data-device]').forEach((b) => b.addEventListener('click', () => {
  $$('[data-device]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
  $('#frame-wrap').classList.toggle('is-mobile', b.dataset.device === 'mobile');
}));

/* ---------- historial ---------- */
function renderHistory() {
  const list = $('#history-list');
  list.textContent = '';
  if (!state.history.length) {
    list.innerHTML = '<li>Todavía no hay versiones anteriores.</li>';
    return;
  }
  const fmt = new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
  for (const item of state.history) {
    const li = document.createElement('li');
    const info = document.createElement('div');
    info.textContent = fmt.format(new Date(item.savedAt));
    const small = document.createElement('small');
    small.textContent = item.changes ? `${item.changes} texto(s) modificado(s)` : 'Textos originales';
    info.append(small);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-ghost btn-small';
    btn.textContent = 'Volver a esta versión';
    btn.addEventListener('click', async () => {
      if (!confirm('¿Volver a esta versión? La versión actual también queda guardada en el historial.')) return;
      try {
        const { data, history } = await api('POST', { action: 'restore', id: item.id });
        state.saved = { texts: {}, seo: {}, contact: {}, ...data };
        state.history = history;
        state.draft = { texts: {}, seo: {}, contact: {} };
        $('#history-dialog').close();
        renderContact();
        updateStatus();
        openPage(state.page);
        toast('Versión restaurada y publicada.');
      } catch (error) {
        toast(error.message, true);
      }
    });
    li.append(info, btn);
    list.append(li);
  }
}

$$('[data-open]').forEach((b) => b.addEventListener('click', () => {
  const dialog = $(`#${b.dataset.open}`);
  if (dialog.id === 'history-dialog') renderHistory();
  if (dialog.id === 'password-dialog') { $('#password-form').reset(); $('#pw-error').hidden = true; }
  dialog.showModal();
}));
$$('[data-close]').forEach((b) => b.addEventListener('click', () => b.closest('dialog').close()));

/* ---------- contraseña ---------- */
$('#password-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#pw-error');
  err.hidden = true;
  const current = $('#pw-current').value;
  const next = $('#pw-next').value;
  const repeat = $('#pw-repeat').value;
  const fail = (msg) => { err.textContent = msg; err.hidden = false; };
  if (next.length < 10) return fail('La contraseña nueva tiene que tener al menos 10 caracteres.');
  if (next !== repeat) return fail('Las dos contraseñas nuevas no coinciden.');
  try {
    const { token } = await api('POST', { action: 'password', current, next });
    state.token = token;
    storage.set(token);
    $('#password-dialog').close();
    toast('Contraseña cambiada. Úsala la próxima vez que entres.');
  } catch (error) {
    fail(error.message);
  }
});

/* ---------- inicio ---------- */
try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* navegador sin soporte */ }
(async () => {
  try {
    await loadSite();
  } catch {
    document.body.textContent = 'No se pudo cargar el panel. Recarga la página.';
    return;
  }
  state.token = storage.get();
  if (!state.token) { showLogin(); return; }
  try {
    await start();
  } catch {
    showLogin();
  }
})();
