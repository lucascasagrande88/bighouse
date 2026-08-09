/*
  Storyboard Builder — Chimichurri Diseño
  Todo corre en el navegador: el ZIP se lee con JSZip, las imágenes se muestran
  vía blob: URLs y nada se sube a ningún servidor.
*/

// ─── Utilidades ───────────────────────────────────────────────

function naturalCompare(a, b) {
  const ax = [], bx = [];
  String(a).replace(/(\d+)|(\D+)/g, (_, d, s) => { ax.push([d || Infinity, s || '']); });
  String(b).replace(/(\d+)|(\D+)/g, (_, d, s) => { bx.push([d || Infinity, s || '']); });
  while (ax.length && bx.length) {
    const an = ax.shift();
    const bn = bx.shift();
    const nn = (an[0] - bn[0]) || an[1].localeCompare(bn[1]);
    if (nn) return nn;
  }
  return ax.length - bx.length;
}

function makeId() {
  return 'f_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function slugify(str) {
  return (str || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '') || 'storyboard';
}

function autoGrow(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = textarea.scrollHeight + 'px';
}

// ─── Detección de descripciones ───────────────────────────────

const GENERIC_ONLY_RE = /^(img|dsc|photo|foto|frame|cuadro|escena|scene|shot|plano|toma|image|picture|captura|screenshot|whatsapp\s?image|whatsapp\s?video)[\s\d.:_-]*(at[\s\d.:_-]*)?(\(\d+\))?$/i;
const CAMERA_JUNK_RE = [
  /^img[-_]\d{6,8}[-_]wa\d{3,6}$/i, // IMG-20240101-WA0007 (exportado por WhatsApp Android)
];

function parseFrameName(basename) {
  const s = basename.trim();
  let order = null, desc = '';

  if (CAMERA_JUNK_RE.some(re => re.test(s))) {
    return { order: null, desc: '' };
  }

  let m = s.match(/^(\d{1,4})\s*[-_.):]\s*(.+)$/);
  if (m) {
    order = parseInt(m[1], 10);
    desc = m[2];
  } else if (/^\d{1,4}$/.test(s)) {
    order = parseInt(s, 10);
    desc = '';
  } else {
    m = s.match(/^(?:frame|cuadro|escena|scene|shot|plano|toma)s?\s*[-_ ]?(\d{1,4})?\s*[-_.):]\s*(.+)$/i);
    if (m) {
      order = m[1] ? parseInt(m[1], 10) : null;
      desc = m[2];
    } else {
      m = s.match(/^(.+?)\s*[-_.):]\s*(\d{1,4})$/);
      if (m) {
        order = parseInt(m[2], 10);
        desc = m[1];
      } else {
        desc = s;
      }
    }
  }

  desc = desc.replace(/_+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!desc || desc.length < 3 || GENERIC_ONLY_RE.test(desc)) {
    desc = '';
  } else {
    desc = desc.charAt(0).toUpperCase() + desc.slice(1);
  }

  return { order, desc };
}

async function buildSidecarMap(zip) {
  const map = new Map();
  const txtPaths = Object.keys(zip.files).filter(p => /\.txt$/i.test(p) && !zip.files[p].dir);
  for (const path of txtPaths) {
    const base = path.split('/').pop().replace(/\.txt$/i, '').toLowerCase();
    try {
      const text = (await zip.files[path].async('text')).trim();
      if (text) map.set(base, text);
    } catch (e) { /* ignore unreadable entry */ }
  }
  return map;
}

const MANIFEST_NAME_RE = /^(guion|gui[oó]n|script|storyboard|descripcion(es)?|notas?|notes?|manifest|cuadros)$/i;

function splitCsvLine(line, delim) {
  const out = [];
  let cur = '', inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') { inQuotes = !inQuotes; continue; }
    if (c === delim && !inQuotes) { out.push(cur); cur = ''; continue; }
    cur += c;
  }
  out.push(cur);
  return out;
}

function parseManifestCsv(text) {
  const out = [];
  const rows = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (!rows.length) return out;
  const delim = rows[0].includes(';') && !rows[0].includes(',') ? ';' : ',';
  const headerCells = splitCsvLine(rows[0], delim).map(c => c.trim().toLowerCase().replace(/^"|"$/g, ''));
  const keyHeaderRe = /^(cuadro|frame|numero|n[uú]mero|archivo|file|filename|imagen|image)$/;
  const descHeaderRe = /^(descripcion|descripci[oó]n|desc|texto|text|description|nota|notas)$/;
  const kIdx = headerCells.findIndex(h => keyHeaderRe.test(h));
  const dIdx = headerCells.findIndex(h => descHeaderRe.test(h));
  let startIdx = 0, keyIdx = 0, descIdx = 1;
  if (kIdx !== -1 || dIdx !== -1) {
    startIdx = 1;
    keyIdx = kIdx !== -1 ? kIdx : 0;
    descIdx = dIdx !== -1 ? dIdx : 1;
  }
  for (let i = startIdx; i < rows.length; i++) {
    const cells = splitCsvLine(rows[i], delim);
    const key = (cells[keyIdx] || '').trim().replace(/^"|"$/g, '');
    const desc = (cells[descIdx] || '').trim().replace(/^"|"$/g, '');
    if (key && desc) out.push({ key, desc });
  }
  return out;
}

function parseManifestJson(text) {
  const out = [];
  let data;
  try { data = JSON.parse(text); } catch (e) { return out; }
  const pickDesc = (o) => o.desc ?? o.descripcion ?? o.descripción ?? o.description ?? o.texto ?? o.text ?? '';
  const pickKey = (o, fallbackIdx) => o.file ?? o.filename ?? o.archivo ?? o.image ?? o.imagen ?? o.name ?? o.frame ?? o.cuadro ?? o.numero ?? o.number ?? (fallbackIdx != null ? String(fallbackIdx + 1) : null);
  if (Array.isArray(data)) {
    data.forEach((item, i) => {
      if (typeof item === 'string') { out.push({ key: String(i + 1), desc: item }); return; }
      if (item && typeof item === 'object') {
        const key = pickKey(item, i);
        const desc = pickDesc(item);
        if (key != null && desc) out.push({ key: String(key), desc: String(desc) });
      }
    });
  } else if (data && typeof data === 'object') {
    Object.entries(data).forEach(([k, v]) => {
      const desc = typeof v === 'string' ? v : pickDesc(v || {});
      if (desc) out.push({ key: k, desc: String(desc) });
    });
  }
  return out;
}

function parseManifestTxt(text) {
  const out = [];
  const lines = text.split(/\r?\n/);
  let seq = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    seq++;
    let m = line.match(/^(\d{1,4})\s*[:.\-)]\s*(.+)$/);
    if (m) { out.push({ key: m[1], desc: m[2].trim() }); continue; }
    m = line.match(/^([^:]+\.\w{2,5})\s*[:\-]\s*(.+)$/);
    if (m) { out.push({ key: m[1].trim(), desc: m[2].trim() }); continue; }
    out.push({ key: String(seq), desc: line });
  }
  return out;
}

function normalizeManifestKey(key) {
  const k = String(key).trim().toLowerCase();
  if (!k) return null;
  return k.split('/').pop().replace(/\.[a-z0-9]{2,5}$/i, '');
}

function mergeManifestEntries(map, entries) {
  for (const { key, desc } of entries) {
    if (!desc) continue;
    const norm = normalizeManifestKey(key);
    if (norm) map.set(norm, desc);
    const numMatch = String(key).match(/^(\d{1,4})$/) || String(key).match(/(\d{1,4})/);
    if (numMatch) map.set('#' + parseInt(numMatch[1], 10), desc);
  }
}

async function buildManifest(zip) {
  const manifest = new Map();
  const candidates = Object.keys(zip.files).filter(p => /\.(txt|csv|json)$/i.test(p) && !zip.files[p].dir);
  for (const path of candidates) {
    const base = path.split('/').pop().replace(/\.[^.]+$/, '');
    if (!MANIFEST_NAME_RE.test(base)) continue;
    const ext = path.split('.').pop().toLowerCase();
    let text;
    try { text = await zip.files[path].async('text'); } catch (e) { continue; }
    let entries = [];
    if (ext === 'json') entries = parseManifestJson(text);
    else if (ext === 'csv') entries = parseManifestCsv(text);
    else entries = parseManifestTxt(text);
    mergeManifestEntries(manifest, entries);
  }
  return manifest;
}

function lookupManifestDesc(manifest, filename, orderNum, positionIdx) {
  const base = filename.split('/').pop().replace(/\.[a-z0-9]{2,5}$/i, '').toLowerCase();
  if (manifest.has(base)) return manifest.get(base);
  if (orderNum != null && manifest.has('#' + orderNum)) return manifest.get('#' + orderNum);
  if (manifest.has('#' + positionIdx)) return manifest.get('#' + positionIdx);
  return '';
}

// ─── Estado ────────────────────────────────────────────────────

const state = { frames: [], projectName: '', clientName: '', view: 'grid' };
let pendingAddTargetId = null;
let dragId = null;
let lastDeleted = null;
let toastTimer = null;

const $ = (id) => document.getElementById(id);

// ─── Carga y parseo del ZIP ─────────────────────────────────────

async function processZip(file) {
  if (!/\.zip$/i.test(file.name) && file.type !== 'application/zip' && file.type !== 'application/x-zip-compressed') {
    showToast('Ese archivo no parece un ZIP. Subí un .zip con las imágenes del storyboard.');
    return;
  }
  showLoading('Leyendo el ZIP…');
  try {
    const zip = await JSZip.loadAsync(file);
    const imagePaths = Object.keys(zip.files).filter(p => {
      const f = zip.files[p];
      if (f.dir) return false;
      if (/(^|\/)(__MACOSX|\.DS_Store)/i.test(p)) return false;
      const base = p.split('/').pop();
      if (base.startsWith('.') || base.startsWith('._')) return false;
      return /\.(jpe?g|png|gif|webp|bmp)$/i.test(p);
    });

    if (!imagePaths.length) {
      hideLoading();
      $('sbDropSection').hidden = false;
      showToast('No encontramos imágenes dentro del ZIP. Revisá el archivo e intentá de nuevo.');
      return;
    }

    imagePaths.sort(naturalCompare);

    showLoading('Detectando descripciones…');
    const [sidecarMap, manifest] = await Promise.all([buildSidecarMap(zip), buildManifest(zip)]);

    showLoading('Armando los cuadros…');
    const frames = [];
    for (let i = 0; i < imagePaths.length; i++) {
      const path = imagePaths[i];
      const filename = path.split('/').pop();
      const base = filename.replace(/\.[a-z0-9]{2,5}$/i, '');
      const blob = await zip.files[path].async('blob');
      const blobUrl = URL.createObjectURL(blob);
      const parsed = parseFrameName(base);
      let desc = sidecarMap.get(base.toLowerCase());
      if (!desc) desc = lookupManifestDesc(manifest, filename, parsed.order, i + 1) || parsed.desc || '';
      frames.push({ id: makeId(), blob, blobUrl, name: filename, desc, note: '' });
    }

    state.frames = frames;
    if (!state.projectName) {
      state.projectName = file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    hideLoading();
    enterBoard();
  } catch (err) {
    console.error(err);
    hideLoading();
    $('sbDropSection').hidden = false;
    showToast('No pudimos leer el ZIP. ¿Es un archivo .zip válido?');
  }
}

function buildDemoFrames() {
  const demo = [
    { color: '#D4FF00', emoji: '🌅', desc: 'Cámara abre en la fachada del local al amanecer, luces prendiéndose.' },
    { color: '#FF7A3D', emoji: '🍳', desc: 'Primer plano del plato estrella recién salido de la cocina, humeando.' },
    { color: '#A78BFA', emoji: '👋', desc: 'El dueño saluda a cámara desde la barra, sonriendo.' },
    { color: '#38BDF8', emoji: '📦', desc: 'Detalle del packaging para llevar, con el logo bien visible.' },
    { color: '#D4FF00', emoji: '⭐', desc: 'Cierre con logo animado y CTA: "Pedí ya por WhatsApp".' },
  ];
  return demo.map((d, i) => ({
    id: makeId(),
    blob: null,
    blobUrl: svgPlaceholder(d.color, d.emoji, i + 1),
    name: `demo-${i + 1}.svg`,
    desc: d.desc,
    note: '',
  }));
}

function svgPlaceholder(color, emoji, n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">` +
    `<rect width="640" height="360" fill="#111"/>` +
    `<rect width="640" height="360" fill="${color}" fill-opacity="0.12"/>` +
    `<text x="50%" y="44%" font-size="90" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `<text x="50%" y="78%" font-size="22" fill="${color}" font-family="sans-serif" text-anchor="middle">Cuadro ${n} · ejemplo</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── Render ──────────────────────────────────────────────────

function enterBoard() {
  $('sbDropSection').hidden = true;
  $('sbToolbar').hidden = false;
  $('sbBoard').hidden = false;
  $('sbBoardCount').hidden = false;
  $('sbProjectName').value = state.projectName || '';
  $('sbClientName').value = state.clientName || '';
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard · Chimichurri Diseño';
  renderBoard();
  requestAnimationFrame(() => {
    $('sbToolbar').scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

function renderBoard() {
  const board = $('sbBoard');
  board.innerHTML = '';
  board.className = 'sb-board' + (state.view === 'strip' ? ' view-strip' : '');
  state.frames.forEach((frame, idx) => board.appendChild(buildFrameEl(frame, idx)));
  board.appendChild(buildAddFrameEl());
  const count = $('sbBoardCount');
  count.textContent = `${state.frames.length} cuadro${state.frames.length === 1 ? '' : 's'}`;
}

function buildFrameEl(frame, idx) {
  const el = document.createElement('div');
  el.className = 'sb-frame';
  el.draggable = true;
  el.dataset.id = frame.id;

  const media = document.createElement('div');
  media.className = 'sb-frame-media';
  if (frame.blobUrl) {
    const img = document.createElement('img');
    img.src = frame.blobUrl;
    img.alt = `Cuadro ${idx + 1}`;
    img.loading = 'lazy';
    media.appendChild(img);
    media.addEventListener('click', () => openLightbox(frame, idx));
  } else {
    media.classList.add('empty');
    media.innerHTML = '<span>🖼️</span><span>Sin imagen — click para subir</span>';
    media.addEventListener('click', () => {
      pendingAddTargetId = frame.id;
      $('sbAddFrameInput').click();
    });
  }

  const num = document.createElement('div');
  num.className = 'sb-frame-num';
  num.textContent = String(idx + 1).padStart(2, '0');
  media.appendChild(num);

  const controls = document.createElement('div');
  controls.className = 'sb-frame-controls';
  controls.innerHTML =
    '<button type="button" class="sb-frame-btn sb-frame-drag" title="Arrastrar para reordenar">⠿</button>' +
    '<button type="button" class="sb-frame-btn" data-act="up" title="Mover antes">↑</button>' +
    '<button type="button" class="sb-frame-btn" data-act="down" title="Mover después">↓</button>' +
    '<button type="button" class="sb-frame-btn danger" data-act="del" title="Eliminar cuadro">✕</button>';
  controls.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('button');
    const act = btn && btn.dataset.act;
    if (!act) return;
    if (act === 'up') moveFrame(frame.id, -1);
    if (act === 'down') moveFrame(frame.id, 1);
    if (act === 'del') deleteFrame(frame.id);
  });
  media.appendChild(controls);

  const body = document.createElement('div');
  body.className = 'sb-frame-body';

  const desc = document.createElement('textarea');
  desc.className = 'sb-frame-desc';
  desc.placeholder = '¿Qué pasa en este cuadro?';
  desc.rows = 2;
  desc.value = frame.desc;
  desc.addEventListener('input', () => { frame.desc = desc.value; autoGrow(desc); });

  const note = document.createElement('input');
  note.type = 'text';
  note.className = 'sb-frame-note';
  note.placeholder = 'Nota / duración (opcional)';
  note.value = frame.note;
  note.addEventListener('input', () => { frame.note = note.value; });

  body.appendChild(desc);
  body.appendChild(note);

  el.appendChild(media);
  el.appendChild(body);

  attachDragHandlers(el, frame.id);
  requestAnimationFrame(() => autoGrow(desc));

  return el;
}

function buildAddFrameEl() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'sb-frame-add';
  el.innerHTML = '<span>+</span><span>Agregar cuadro</span>';
  el.addEventListener('click', () => {
    pendingAddTargetId = null;
    $('sbAddFrameInput').click();
  });
  return el;
}

// ─── Interacciones ───────────────────────────────────────────

function moveFrame(id, delta) {
  const i = state.frames.findIndex(f => f.id === id);
  if (i === -1) return;
  const j = i + delta;
  if (j < 0 || j >= state.frames.length) return;
  const [f] = state.frames.splice(i, 1);
  state.frames.splice(j, 0, f);
  renderBoard();
}

function deleteFrame(id) {
  const i = state.frames.findIndex(f => f.id === id);
  if (i === -1) return;
  const [f] = state.frames.splice(i, 1);
  lastDeleted = { frame: f, index: i };
  renderBoard();
  showToast('Cuadro eliminado.', { actionLabel: 'Deshacer', onAction: undoDelete });
}

function undoDelete() {
  if (!lastDeleted) return;
  state.frames.splice(lastDeleted.index, 0, lastDeleted.frame);
  lastDeleted = null;
  renderBoard();
}

function attachDragHandlers(el, id) {
  el.addEventListener('dragstart', () => {
    dragId = id;
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.sb-frame.drag-over').forEach(n => n.classList.remove('drag-over'));
  });
  el.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (dragId !== id) el.classList.add('drag-over');
  });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    if (dragId == null || dragId === id) return;
    const from = state.frames.findIndex(f => f.id === dragId);
    const to = state.frames.findIndex(f => f.id === id);
    dragId = null;
    if (from === -1 || to === -1) return;
    const [f] = state.frames.splice(from, 1);
    state.frames.splice(to, 0, f);
    renderBoard();
  });
}

function openLightbox(frame, idx) {
  $('sbLightboxImg').src = frame.blobUrl;
  $('sbLightboxImg').alt = `Cuadro ${idx + 1}`;
  $('sbLightboxCaption').textContent = `Cuadro ${String(idx + 1).padStart(2, '0')}` + (frame.desc ? ' — ' + frame.desc : '');
  $('sbLightbox').hidden = false;
}
function closeLightbox() { $('sbLightbox').hidden = true; }

function showLoading(text) {
  $('sbDropSection').hidden = true;
  $('sbLoadingText').textContent = text;
  $('sbLoading').hidden = false;
}
function hideLoading() { $('sbLoading').hidden = true; }

function showToast(message, opts = {}) {
  const toast = $('sbToast');
  toast.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = message;
  toast.appendChild(span);
  if (opts.actionLabel && opts.onAction) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = opts.actionLabel;
    btn.addEventListener('click', () => { opts.onAction(); toast.classList.remove('show'); });
    toast.appendChild(btn);
  }
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), opts.duration || 4200);
}

function resetBoard() {
  if (state.frames.length && !confirm('¿Seguro que querés empezar de nuevo? Vas a perder los cambios de este storyboard.')) return;
  state.frames.forEach(f => { if (f.blobUrl && f.blobUrl.startsWith('blob:')) URL.revokeObjectURL(f.blobUrl); });
  state.frames = [];
  state.projectName = '';
  state.clientName = '';
  $('sbToolbar').hidden = true;
  $('sbBoard').hidden = true;
  $('sbBoardCount').hidden = true;
  $('sbBoard').innerHTML = '';
  $('sbDropSection').hidden = false;
  $('sbFileInput').value = '';
  document.title = 'Storyboard Builder — Chimichurri Diseño';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Exportar / compartir ────────────────────────────────────

function frameToDataURL(frame) {
  return new Promise((resolve) => {
    if (!frame.blob) {
      resolve(frame.blobUrl && frame.blobUrl.startsWith('data:') ? frame.blobUrl : null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(frame.blob);
  });
}

function buildStandaloneHtml(title, client, frameCount, framesHtml) {
  const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
  const metaBits = [];
  if (client) metaBits.push(escapeHtml(client));
  metaBits.push(`${frameCount} cuadro${frameCount === 1 ? '' : 's'}`);
  metaBits.push(`Generado el ${date}`);
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Storyboard</title>
<style>
  :root { --bg:#080808; --surface:#0f0f0f; --accent:#D4FF00; --text:#f2f2f2; --muted:#8a8a8a; --border:rgba(255,255,255,0.08); }
  * { box-sizing:border-box; }
  body { background:var(--bg); color:var(--text); font-family:-apple-system,'Segoe UI',Inter,sans-serif; margin:0; padding:48px 24px 80px; }
  .wrap { max-width:1080px; margin:0 auto; }
  header { margin-bottom:40px; }
  .label { font-size:0.72rem; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:var(--accent); margin-bottom:10px; }
  h1 { font-size:clamp(1.8rem,4vw,2.6rem); margin:0 0 8px; letter-spacing:-0.02em; }
  .meta { color:var(--muted); font-size:0.9rem; }
  .board { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .frame { background:var(--surface); border:1px solid var(--border); border-radius:16px; overflow:hidden; }
  .frame-media { position:relative; aspect-ratio:16/9; background:#000; display:flex; align-items:center; justify-content:center; }
  .frame-media img { width:100%; height:100%; object-fit:contain; display:block; }
  .frame-empty { color:var(--muted); font-size:0.8rem; }
  .frame-num { position:absolute; top:10px; left:10px; background:var(--accent); color:#000; font-weight:800; font-size:0.8rem; padding:5px 9px; border-radius:7px; }
  .frame-body { padding:16px; }
  .frame-desc { margin:0; font-size:0.9rem; line-height:1.5; }
  .frame-desc .muted { color:var(--muted); font-style:italic; }
  .frame-note { margin:10px 0 0; padding-top:8px; border-top:1px solid var(--border); font-size:0.78rem; color:var(--muted); }
  footer { margin-top:56px; padding-top:24px; border-top:1px solid var(--border); color:var(--muted); font-size:0.8rem; display:flex; justify-content:space-between; flex-wrap:wrap; gap:8px; }
  footer a { color:var(--accent); text-decoration:none; }
  @media print { body{background:#fff;color:#000;} .frame{border-color:#ccc;break-inside:avoid;} .frame-media{background:#fff;} }
</style>
</head>
<body>
  <div class="wrap">
    <header>
      <div class="label">Storyboard</div>
      <h1>${escapeHtml(title)}</h1>
      <div class="meta">${metaBits.join(' · ')}</div>
    </header>
    <div class="board">${framesHtml}</div>
    <footer>
      <span>Armado con Storyboard Builder de Chimichurri Diseño</span>
      <a href="https://wa.me/5491100000000">wa.me/5491100000000</a>
    </footer>
  </div>
</body>
</html>`;
}

async function exportHtml() {
  if (!state.frames.length) return null;
  const framesHtml = [];
  for (let i = 0; i < state.frames.length; i++) {
    const f = state.frames[i];
    const dataUrl = await frameToDataURL(f);
    framesHtml.push(
      '<div class="frame">' +
        '<div class="frame-media">' +
          (dataUrl ? `<img src="${dataUrl}" alt="Cuadro ${i + 1}">` : '<div class="frame-empty">Sin imagen</div>') +
          `<div class="frame-num">${String(i + 1).padStart(2, '0')}</div>` +
        '</div>' +
        '<div class="frame-body">' +
          `<p class="frame-desc">${f.desc ? escapeHtml(f.desc) : '<span class="muted">Sin descripción</span>'}</p>` +
          (f.note ? `<p class="frame-note">${escapeHtml(f.note)}</p>` : '') +
        '</div>' +
      '</div>'
    );
  }
  const title = state.projectName || 'Storyboard';
  const html = buildStandaloneHtml(title, state.clientName, state.frames.length, framesHtml.join(''));
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = slugify(title) + '.html';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  return blob;
}

// ─── Wiring ───────────────────────────────────────────────────

const dropEl = $('sbDrop');
const fileInput = $('sbFileInput');

$('sbBrowseBtn').addEventListener('click', (e) => { e.stopPropagation(); fileInput.click(); });
dropEl.addEventListener('click', () => fileInput.click());
dropEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); }
});
fileInput.addEventListener('change', () => {
  if (fileInput.files[0]) processZip(fileInput.files[0]);
  fileInput.value = '';
});

['dragenter', 'dragover'].forEach(evt => dropEl.addEventListener(evt, (e) => {
  e.preventDefault();
  dropEl.classList.add('dragover');
}));
['dragleave'].forEach(evt => dropEl.addEventListener(evt, () => dropEl.classList.remove('dragover')));
dropEl.addEventListener('drop', (e) => {
  e.preventDefault();
  dropEl.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file) processZip(file);
});
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => e.preventDefault());

$('sbDemoBtn').addEventListener('click', () => {
  state.frames = buildDemoFrames();
  state.projectName = 'Ejemplo — Reel de producto';
  state.clientName = '';
  enterBoard();
  showToast('Este es un ejemplo con imágenes de muestra. Subí tu ZIP cuando quieras reemplazarlo.');
});

$('sbAddFrameInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  const blobUrl = URL.createObjectURL(file);
  const base = file.name.replace(/\.[a-z0-9]{2,5}$/i, '');
  const parsed = parseFrameName(base);
  if (pendingAddTargetId) {
    const f = state.frames.find(fr => fr.id === pendingAddTargetId);
    if (f) {
      if (f.blobUrl && f.blobUrl.startsWith('blob:')) URL.revokeObjectURL(f.blobUrl);
      f.blob = file;
      f.blobUrl = blobUrl;
      f.name = file.name;
      if (!f.desc) f.desc = parsed.desc;
    }
  } else {
    state.frames.push({ id: makeId(), blob: file, blobUrl, name: file.name, desc: parsed.desc, note: '' });
  }
  pendingAddTargetId = null;
  renderBoard();
});

$('sbProjectName').addEventListener('input', (e) => {
  state.projectName = e.target.value;
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard · Chimichurri Diseño';
});
$('sbClientName').addEventListener('input', (e) => { state.clientName = e.target.value; });

$('sbViewGridBtn').addEventListener('click', () => setView('grid'));
$('sbViewStripBtn').addEventListener('click', () => setView('strip'));
function setView(v) {
  state.view = v;
  $('sbViewGridBtn').classList.toggle('active', v === 'grid');
  $('sbViewStripBtn').classList.toggle('active', v === 'strip');
  renderBoard();
}

$('sbPrintBtn').addEventListener('click', () => window.print());

$('sbExportBtn').addEventListener('click', async () => {
  showToast('Generando el archivo…', { duration: 1500 });
  await exportHtml();
  showToast('Listo ✓ Descargaste el storyboard. Ya lo podés enviar por WhatsApp, mail o Drive.');
});

$('sbShareBtn').addEventListener('click', async () => {
  showToast('Generando el archivo…', { duration: 1500 });
  await exportHtml();
  const text = `Hola! Te comparto el storyboard${state.projectName ? ' de "' + state.projectName + '"' : ''} 🎬 Te acabo de descargar el archivo — lo adjunto en este chat.`;
  window.open('https://wa.me/?text=' + encodeURIComponent(text), '_blank', 'noopener');
});

$('sbResetBtn').addEventListener('click', resetBoard);

$('sbLightboxClose').addEventListener('click', closeLightbox);
$('sbLightbox').addEventListener('click', (e) => { if (e.target.id === 'sbLightbox') closeLightbox(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

window.addEventListener('beforeunload', (e) => {
  if (state.frames.length) { e.preventDefault(); e.returnValue = ''; }
});
