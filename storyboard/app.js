/*
  Storyboard — Chimichurri
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

const DEFAULT_DURATION = 4; // segundos por cuadro en la presentación
const FADE_MS = 420; // debe coincidir con la transition de .player-stage img en el CSS
const IDLE_MS = 2800; // inactividad hasta esconder los controles del player

const state = { frames: [], projectName: '' };
const playerState = { index: 0, playing: false, everStarted: false };
let pendingAddTargetId = null;
let dragId = null;
let lastDeleted = null;
let toastTimer = null;
let chromeHideTimer = null;

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

    showLoading('Armando el álbum…');
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
      frames.push({ id: makeId(), blob, blobUrl, name: filename, desc, duration: DEFAULT_DURATION });
    }

    state.frames = frames;
    if (!state.projectName) {
      state.projectName = file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    hideLoading();
    enterLibrary();
    openPlayer({ startIndex: 0, autoplay: false });
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
    { color: '#0A84FF', emoji: '⭐', desc: 'Cierre con logo animado y CTA: "Pedí ya por WhatsApp".' },
  ];
  return demo.map((d, i) => ({
    id: makeId(),
    blob: null,
    blobUrl: svgPlaceholder(d.color, d.emoji, i + 1),
    name: `demo-${i + 1}.svg`,
    desc: d.desc,
    duration: DEFAULT_DURATION,
  }));
}

function svgPlaceholder(color, emoji, n) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480">` +
    `<rect width="640" height="480" fill="#1c1c1e"/>` +
    `<rect width="640" height="480" fill="${color}" fill-opacity="0.14"/>` +
    `<text x="50%" y="46%" font-size="96" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `<text x="50%" y="76%" font-size="22" fill="${color}" font-family="sans-serif" text-anchor="middle">Cuadro ${n} · ejemplo</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── Library (grilla tipo álbum) ───────────────────────────────

function enterLibrary() {
  $('sbDropSection').hidden = true;
  $('sbEditor').hidden = false;
  $('tlActions').hidden = false;
  setTitleText(state.projectName || '');
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard';
  renderLibrary();
}

function setTitleText(text) {
  const el = $('tlTitle');
  if (el.textContent !== text) el.textContent = text;
}

function renderLibrary() {
  const grid = $('sbEditorList');
  grid.innerHTML = '';
  state.frames.forEach((frame, idx) => {
    const el = buildLibItem(frame, idx);
    el.style.setProperty('--i', idx);
    grid.appendChild(el);
  });
  grid.appendChild(buildLibAdd());
}

function buildLibItem(frame, idx) {
  const el = document.createElement('div');
  el.className = 'lib-item';
  el.draggable = true;
  el.dataset.id = frame.id;

  if (frame.blobUrl) {
    const img = document.createElement('img');
    img.src = frame.blobUrl;
    img.alt = `Cuadro ${idx + 1}`;
    img.loading = 'lazy';
    el.appendChild(img);
  } else {
    el.classList.add('empty');
    el.textContent = '🖼️';
  }

  const num = document.createElement('div');
  num.className = 'lib-item-num';
  num.textContent = String(idx + 1).padStart(2, '0');
  el.appendChild(num);

  const overlay = document.createElement('div');
  overlay.className = 'lib-item-overlay';

  const desc = document.createElement('textarea');
  desc.className = 'lib-item-desc';
  desc.placeholder = '¿Qué pasa acá?';
  desc.value = frame.desc;
  desc.rows = 2;
  desc.addEventListener('input', () => { frame.desc = desc.value; });
  desc.addEventListener('click', (e) => e.stopPropagation());

  const row = document.createElement('div');
  row.className = 'lib-item-row';

  const dur = document.createElement('div');
  dur.className = 'lib-item-dur';
  const durLabel = document.createElement('span');
  durLabel.textContent = frame.duration + 's';
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.addEventListener('click', (e) => { e.stopPropagation(); frame.duration = Math.max(1, frame.duration - 1); durLabel.textContent = frame.duration + 's'; });
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.addEventListener('click', (e) => { e.stopPropagation(); frame.duration = Math.min(20, frame.duration + 1); durLabel.textContent = frame.duration + 's'; });
  dur.appendChild(minus);
  dur.appendChild(durLabel);
  dur.appendChild(plus);

  const spacer = document.createElement('div');
  spacer.className = 'lib-item-spacer';

  const up = document.createElement('button');
  up.type = 'button';
  up.className = 'lib-item-btn';
  up.textContent = '↑';
  up.title = 'Mover antes';
  up.addEventListener('click', (e) => { e.stopPropagation(); moveFrame(frame.id, -1); });

  const down = document.createElement('button');
  down.type = 'button';
  down.className = 'lib-item-btn';
  down.textContent = '↓';
  down.title = 'Mover después';
  down.addEventListener('click', (e) => { e.stopPropagation(); moveFrame(frame.id, 1); });

  const del = document.createElement('button');
  del.type = 'button';
  del.className = 'lib-item-btn danger';
  del.textContent = '✕';
  del.title = 'Eliminar';
  del.addEventListener('click', (e) => { e.stopPropagation(); deleteFrame(frame.id); });

  row.appendChild(dur);
  row.appendChild(spacer);
  row.appendChild(up);
  row.appendChild(down);
  row.appendChild(del);

  overlay.appendChild(desc);
  overlay.appendChild(row);
  el.appendChild(overlay);

  el.addEventListener('click', () => {
    if (frame.blobUrl) openPlayer({ startIndex: idx, autoplay: false });
    else { pendingAddTargetId = frame.id; $('sbAddFrameInput').click(); }
  });

  attachDragHandlers(el, frame.id);
  return el;
}

function buildLibAdd() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'lib-add';
  el.textContent = '+';
  el.setAttribute('aria-label', 'Agregar cuadro');
  el.addEventListener('click', () => {
    pendingAddTargetId = null;
    $('sbAddFrameInput').click();
  });
  return el;
}

function moveFrame(id, delta) {
  const i = state.frames.findIndex(f => f.id === id);
  if (i === -1) return;
  const j = i + delta;
  if (j < 0 || j >= state.frames.length) return;
  const [f] = state.frames.splice(i, 1);
  state.frames.splice(j, 0, f);
  renderLibrary();
}

function deleteFrame(id) {
  const i = state.frames.findIndex(f => f.id === id);
  if (i === -1) return;
  const [f] = state.frames.splice(i, 1);
  lastDeleted = { frame: f, index: i };
  renderLibrary();
  showToast('Cuadro eliminado.', { actionLabel: 'Deshacer', onAction: undoDelete });
}

function undoDelete() {
  if (!lastDeleted) return;
  state.frames.splice(lastDeleted.index, 0, lastDeleted.frame);
  lastDeleted = null;
  renderLibrary();
}

function attachDragHandlers(el, id) {
  el.addEventListener('dragstart', () => {
    dragId = id;
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.lib-item.drag-over').forEach(n => n.classList.remove('drag-over'));
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
    renderLibrary();
  });
}

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
  closePlayer({ silent: true });
  $('sbEditor').hidden = true;
  $('sbEditorList').innerHTML = '';
  $('tlActions').hidden = true;
  setTitleText('');
  $('sbDropSection').hidden = false;
  $('sbFileInput').value = '';
  document.title = 'Storyboard — Chimichurri';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Player (quick look / slideshow) ──────────────────────────

function buildSegments() {
  const wrap = $('sbPlayerProgress');
  wrap.innerHTML = '';
  state.frames.forEach(() => {
    const seg = document.createElement('div');
    seg.className = 'player-seg';
    const fill = document.createElement('span');
    fill.className = 'player-seg-fill';
    seg.appendChild(fill);
    wrap.appendChild(seg);
  });
}

function buildFilmstrip() {
  const wrap = $('sbPlayerFilmstrip');
  wrap.innerHTML = '';
  state.frames.forEach((f, i) => {
    const t = document.createElement('div');
    t.className = 'film-thumb';
    t.dataset.idx = i;
    if (f.blobUrl) {
      const img = document.createElement('img');
      img.src = f.blobUrl;
      img.alt = `Cuadro ${i + 1}`;
      t.appendChild(img);
    }
    t.addEventListener('click', (e) => {
      e.stopPropagation();
      playerTogglePlay(false);
      playerShowFrame(i);
      showChrome();
    });
    wrap.appendChild(t);
  });
}

function updateFilmstrip() {
  const thumbs = [...$('sbPlayerFilmstrip').children];
  thumbs.forEach((t, i) => t.classList.toggle('active', i === playerState.index));
  const active = thumbs[playerState.index];
  if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
}

function updateSegments() {
  const segs = [...$('sbPlayerProgress').children];
  segs.forEach((seg, i) => {
    const fill = seg.firstElementChild;
    seg.classList.remove('done', 'active');
    fill.style.animation = 'none';
    if (i < playerState.index) {
      seg.classList.add('done');
    } else if (i === playerState.index) {
      seg.classList.add('active');
      const dur = state.frames[i] ? state.frames[i].duration || DEFAULT_DURATION : DEFAULT_DURATION;
      void fill.offsetWidth; // fuerza reflow para poder reiniciar la animación
      fill.style.animationDuration = dur + 's';
      fill.style.animation = 'segfill linear forwards';
      fill.style.animationDuration = dur + 's';
    }
  });
}

function markAllSegmentsDone() {
  [...$('sbPlayerProgress').children].forEach(seg => {
    seg.classList.remove('active');
    seg.classList.add('done');
    seg.firstElementChild.style.animation = 'none';
  });
}

function playerShowFrame(newIdx, opts = {}) {
  const frames = state.frames;
  if (!frames.length) return;
  newIdx = Math.max(0, Math.min(newIdx, frames.length - 1));
  playerState.index = newIdx;
  updateSegments();
  updateFilmstrip();

  const stage = $('sbPlayerStage');
  const doSwap = () => {
    const f = frames[newIdx];
    $('sbPlayerImg').src = f.blobUrl || '';
    $('sbPlayerImg').alt = `Cuadro ${newIdx + 1}`;
    const cap = $('sbPlayerCaption');
    cap.textContent = f.desc || '';
    cap.classList.toggle('show', !!f.desc);
    stage.classList.remove('fade');
  };

  if (opts.instant) {
    doSwap();
    return;
  }
  stage.classList.add('fade');
  // setTimeout en vez de 'transitionend': ese evento puede no dispararse nunca
  // (reduced-motion, pestaña en segundo plano) y dejaría la presentación colgada a mitad del fade.
  setTimeout(doSwap, FADE_MS);
}

function playerNext() {
  if (playerState.index >= state.frames.length - 1) {
    playerShowEnd();
    return;
  }
  playerShowFrame(playerState.index + 1);
}

function playerPrev() {
  if (playerState.index <= 0) return;
  $('sbPlayerEnd').classList.remove('show');
  playerShowFrame(playerState.index - 1);
}

function playerShowEnd() {
  playerState.playing = false;
  $('sbPlayer').classList.add('paused');
  $('sbPlayerPlayBtn').textContent = '▶';
  markAllSegmentsDone();
  $('sbPlayerEnd').classList.add('show');
  showChrome();
}

function playerReplay() {
  $('sbPlayerEnd').classList.remove('show');
  playerShowFrame(0, { instant: true });
  playerTogglePlay(true);
}

function playerTogglePlay(forcePlay) {
  const playerEl = $('sbPlayer');
  const shouldPlay = forcePlay != null ? forcePlay : !playerState.playing;
  playerState.playing = shouldPlay;
  playerEl.classList.toggle('paused', !shouldPlay);
  $('sbPlayerPlayBtn').textContent = shouldPlay ? '❚❚' : '▶';
  if (shouldPlay) {
    playerState.everStarted = true;
    $('sbPlayerBigPlay').hidden = true;
    updateSegments();
    showChrome();
  } else {
    clearTimeout(chromeHideTimer);
    $('sbPlayer').classList.remove('idle');
  }
}

function showChrome() {
  $('sbPlayer').classList.remove('idle');
  clearTimeout(chromeHideTimer);
  if (playerState.playing) {
    chromeHideTimer = setTimeout(() => { $('sbPlayer').classList.add('idle'); }, IDLE_MS);
  }
}

function openPlayer({ startIndex = 0, autoplay = false } = {}) {
  if (!state.frames.length) return;
  $('sbPlayer').hidden = false;
  $('sbPlayer').classList.remove('idle');
  $('sbPlayerProjectName').textContent = state.projectName || 'Storyboard';
  buildSegments();
  buildFilmstrip();
  $('sbPlayerEnd').classList.remove('show');
  playerState.everStarted = false;
  playerShowFrame(startIndex, { instant: true });
  if (autoplay) {
    $('sbPlayerBigPlay').hidden = true;
    playerTogglePlay(true);
  } else {
    $('sbPlayerBigPlay').hidden = false;
    playerTogglePlay(false);
  }
}

function closePlayer(opts = {}) {
  playerTogglePlay(false);
  $('sbPlayer').hidden = true;
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

function buildStandaloneHtml(title, framesData) {
  const framesJson = JSON.stringify(framesData).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${escapeHtml(title)} — Storyboard</title>
<style>
  :root { --ease:cubic-bezier(.4,0,.2,1); --ease-spring:cubic-bezier(.16,1,.3,1); }
  * { box-sizing:border-box; }
  html,body { height:100%; }
  body { margin:0; background:#000; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Helvetica Neue',Arial,sans-serif; overflow:hidden; }
  .p { position:fixed; inset:0; }
  .p.idle { cursor:none; }
  .stage { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; padding:70px 5vw 150px; }
  .stage img { max-width:100%; max-height:100%; object-fit:contain; border-radius:10px; box-shadow:0 30px 90px rgba(0,0,0,.6); opacity:1; transform:scale(1); transition:opacity .42s var(--ease), transform .55s var(--ease-spring); }
  .stage.fade img { opacity:0; transform:scale(.965); }
  .cap { position:absolute; left:6vw; right:6vw; bottom:128px; text-align:center; color:#fff; font-size:clamp(15px,2.1vw,21px); font-weight:500; letter-spacing:-.01em; line-height:1.5; text-shadow:0 2px 24px rgba(0,0,0,.6); opacity:0; transition:opacity .5s var(--ease); z-index:3; }
  .cap.show { opacity:1; }
  .top, .bottom { transition:opacity .35s var(--ease); }
  .p.idle .top, .p.idle .bottom { opacity:0; pointer-events:none; }
  .top { position:absolute; top:0; left:0; right:0; z-index:12; display:flex; justify-content:space-between; align-items:center; padding:18px 20px; background:linear-gradient(to bottom,rgba(0,0,0,.55),transparent); }
  .top-title { color:rgba(255,255,255,.92); font-size:13px; font-weight:600; }
  .pbtn { width:32px; height:32px; border-radius:50%; border:none; background:rgba(255,255,255,.14); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:14px; backdrop-filter:blur(8px); }
  .pbtn:hover { background:rgba(255,255,255,.26); }
  .bigplay { position:absolute; inset:0; margin:auto; width:76px; height:76px; border-radius:50%; background:rgba(255,255,255,.16); backdrop-filter:blur(10px); border:1.5px solid rgba(255,255,255,.35); color:#fff; font-size:26px; cursor:pointer; z-index:5; }
  .bigplay:hover { background:rgba(255,255,255,.24); }
  .bottom { position:absolute; left:0; right:0; bottom:0; padding:12px 18px calc(env(safe-area-inset-bottom,0px) + 16px); background:linear-gradient(to top,rgba(0,0,0,.65),transparent); display:flex; flex-direction:column; gap:12px; }
  .prog { display:flex; gap:4px; }
  .seg { flex:1; height:2.5px; background:rgba(255,255,255,.25); border-radius:2px; overflow:hidden; }
  .seg-fill { display:block; height:100%; width:0%; background:#fff; border-radius:2px; }
  .seg.done .seg-fill { width:100%; }
  .seg.active .seg-fill { animation-name:fillseg; animation-timing-function:linear; animation-fill-mode:forwards; }
  .p.paused .seg.active .seg-fill { animation-play-state:paused; }
  @keyframes fillseg { from{width:0%} to{width:100%} }
  .ctrls { display:flex; align-items:center; justify-content:center; gap:20px; }
  .pbtn-lg { width:42px; height:42px; font-size:15px; }
  .pbtn-lg.primary { width:52px; height:52px; background:#fff; color:#000; font-size:18px; }
  .pbtn-lg.primary:hover { background:#ededed; }
  .film { display:flex; gap:6px; overflow-x:auto; padding:2px 1px 4px; scrollbar-width:none; }
  .film::-webkit-scrollbar { display:none; }
  .film-thumb { flex-shrink:0; width:58px; aspect-ratio:4/3; border-radius:6px; overflow:hidden; cursor:pointer; opacity:.42; border:1.5px solid transparent; background:#111; }
  .film-thumb.active { opacity:1; border-color:#fff; }
  .film-thumb img { width:100%; height:100%; object-fit:cover; }
  .end { position:absolute; inset:0; z-index:10; background:rgba(0,0,0,.86); backdrop-filter:blur(14px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; text-align:center; padding:24px; opacity:0; pointer-events:none; transition:opacity .45s var(--ease); }
  .end.show { opacity:1; pointer-events:auto; }
  .end h2 { color:#fff; font-size:clamp(20px,4vw,30px); font-weight:700; letter-spacing:-.01em; margin:0; }
  .end p { color:rgba(255,255,255,.6); font-size:13.5px; max-width:340px; margin:0; }
  .end-actions { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin-top:6px; }
  .a-btn { display:inline-flex; align-items:center; gap:7px; padding:10px 18px; border-radius:100px; font-weight:600; font-size:13px; text-decoration:none; border:1px solid rgba(255,255,255,.2); cursor:pointer; background:rgba(255,255,255,.1); color:#fff; }
  .a-btn:hover { background:rgba(255,255,255,.18); }
  .a-btn.wa { background:#25D366; color:#06210f; border-color:transparent; }
  .a-btn.wa:hover { background:#21bd5b; }
  [hidden] { display:none !important; }
</style>
</head>
<body>
  <div class="p paused" id="p">
    <div class="stage" id="stage"><img id="img" alt=""></div>
    <p class="cap" id="cap"></p>
    <button class="bigplay" id="bigplay" aria-label="Reproducir">▶</button>
    <div class="top">
      <span class="top-title" id="pname"></span>
      <button class="pbtn" id="fsBtn" title="Pantalla completa">⛶</button>
    </div>
    <div class="bottom">
      <div class="prog" id="prog"></div>
      <div class="ctrls">
        <button class="pbtn pbtn-lg" id="prevBtn">◀</button>
        <button class="pbtn pbtn-lg primary" id="playBtn">▶</button>
        <button class="pbtn pbtn-lg" id="nextBtn">▶</button>
      </div>
      <div class="film" id="film"></div>
    </div>
    <div class="end" id="end">
      <h2>Fin del storyboard</h2>
      <p>Así se va a ver el video, cuadro por cuadro.</p>
      <div class="end-actions">
        <button class="a-btn" id="replayBtn">↺ Ver de nuevo</button>
        <a class="a-btn wa" href="https://wa.me/5491100000000" target="_blank" rel="noopener">¿Te copó? Escribinos</a>
      </div>
    </div>
  </div>
<script>
(function(){
  var FRAMES = ${framesJson};
  var TITLE = ${JSON.stringify(title)};
  document.getElementById('pname').textContent = TITLE;
  document.title = TITLE + ' — Storyboard';

  var st = { index: 0, playing: false, started: false };
  var p = document.getElementById('p');
  var prog = document.getElementById('prog');
  var film = document.getElementById('film');
  var stage = document.getElementById('stage');
  var img = document.getElementById('img');
  var cap = document.getElementById('cap');
  var bigplay = document.getElementById('bigplay');
  var playBtn = document.getElementById('playBtn');
  var end = document.getElementById('end');
  var idleTimer = null;

  FRAMES.forEach(function (f, i) {
    var seg = document.createElement('div'); seg.className = 'seg';
    var fill = document.createElement('span'); fill.className = 'seg-fill';
    seg.appendChild(fill); prog.appendChild(seg);

    var t = document.createElement('div'); t.className = 'film-thumb';
    if (f.src) { var ti = document.createElement('img'); ti.src = f.src; t.appendChild(ti); }
    t.addEventListener('click', function (e) { e.stopPropagation(); togglePlay(false); showFrame(i); showChrome(); });
    film.appendChild(t);
  });

  function updateFilmstrip() {
    var thumbs = film.children;
    for (var i = 0; i < thumbs.length; i++) thumbs[i].classList.toggle('active', i === st.index);
    var active = thumbs[st.index];
    if (active) active.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  function updateSegments() {
    var segs = prog.children;
    for (var i = 0; i < segs.length; i++) {
      var seg = segs[i], fill = seg.firstElementChild;
      seg.className = 'seg';
      fill.style.animation = 'none';
      if (i < st.index) { seg.className = 'seg done'; }
      else if (i === st.index) {
        seg.className = 'seg active';
        var dur = (FRAMES[i] && FRAMES[i].duration) || 4;
        void fill.offsetWidth;
        fill.style.animationDuration = dur + 's';
        fill.style.animation = 'fillseg linear forwards';
        fill.style.animationDuration = dur + 's';
      }
    }
  }

  function markAllDone() {
    var segs = prog.children;
    for (var i = 0; i < segs.length; i++) {
      segs[i].className = 'seg done';
      segs[i].firstElementChild.style.animation = 'none';
    }
  }

  function showFrame(idx, instant) {
    idx = Math.max(0, Math.min(idx, FRAMES.length - 1));
    st.index = idx;
    updateSegments();
    updateFilmstrip();
    var swap = function () {
      var f = FRAMES[idx];
      img.src = f.src || '';
      cap.textContent = f.desc || '';
      cap.classList.toggle('show', !!f.desc);
      stage.classList.remove('fade');
    };
    if (instant) { swap(); return; }
    stage.classList.add('fade');
    setTimeout(swap, 420);
  }

  function next() {
    if (st.index >= FRAMES.length - 1) { showEnd(); return; }
    showFrame(st.index + 1);
  }
  function prev() {
    if (st.index <= 0) return;
    end.classList.remove('show');
    showFrame(st.index - 1);
  }
  function showEnd() {
    st.playing = false;
    p.classList.add('paused');
    playBtn.textContent = '▶';
    markAllDone();
    end.classList.add('show');
    showChrome();
  }
  function togglePlay(force) {
    var should = force != null ? force : !st.playing;
    st.playing = should;
    p.classList.toggle('paused', !should);
    playBtn.textContent = should ? '❚❚' : '▶';
    if (should) { st.started = true; bigplay.hidden = true; updateSegments(); showChrome(); }
    else { clearTimeout(idleTimer); p.classList.remove('idle'); }
  }
  function showChrome() {
    p.classList.remove('idle');
    clearTimeout(idleTimer);
    if (st.playing) idleTimer = setTimeout(function () { p.classList.add('idle'); }, 2800);
  }

  prog.addEventListener('animationend', function (e) {
    if (!e.target.classList.contains('seg-fill')) return;
    if (!st.playing) return;
    next();
  });
  bigplay.addEventListener('click', function () { togglePlay(true); });
  playBtn.addEventListener('click', function () { togglePlay(); showChrome(); });
  document.getElementById('prevBtn').addEventListener('click', function () { prev(); showChrome(); });
  document.getElementById('nextBtn').addEventListener('click', function () { next(); showChrome(); });
  document.getElementById('replayBtn').addEventListener('click', function () {
    end.classList.remove('show');
    showFrame(0, true);
    togglePlay(true);
  });
  document.getElementById('fsBtn').addEventListener('click', function () {
    if (!document.fullscreenElement) { p.requestFullscreen && p.requestFullscreen().catch(function(){}); }
    else { document.exitFullscreen && document.exitFullscreen(); }
  });
  stage.addEventListener('click', function (e) {
    if (!st.started) return;
    var r = stage.getBoundingClientRect();
    var x = e.clientX - r.left;
    if (x < r.width * 0.35) prev(); else next();
    showChrome();
  });
  p.addEventListener('mousemove', showChrome);
  p.addEventListener('touchstart', showChrome);
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ') { e.preventDefault(); togglePlay(); showChrome(); }
    if (e.key === 'ArrowRight') { next(); showChrome(); }
    if (e.key === 'ArrowLeft') { prev(); showChrome(); }
  });

  showFrame(0, true);
  bigplay.hidden = false;
})();
</script>
</body>
</html>`;
}

async function collectFramesData() {
  const out = [];
  for (const f of state.frames) {
    const src = await frameToDataURL(f);
    out.push({ src, desc: f.desc || '', duration: f.duration || DEFAULT_DURATION });
  }
  return out;
}

async function exportHtml() {
  if (!state.frames.length) return null;
  const framesData = await collectFramesData();
  const title = state.projectName || 'Storyboard';
  const html = buildStandaloneHtml(title, framesData);
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
  enterLibrary();
  openPlayer({ startIndex: 0, autoplay: false });
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
    state.frames.push({ id: makeId(), blob: file, blobUrl, name: file.name, desc: parsed.desc, duration: DEFAULT_DURATION });
  }
  pendingAddTargetId = null;
  renderLibrary();
});

$('tlTitle').addEventListener('input', (e) => {
  state.projectName = e.target.textContent.trim();
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard';
});
$('tlTitle').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); e.target.blur(); } });

$('sbPresentBtn').addEventListener('click', () => openPlayer({ startIndex: 0, autoplay: true }));
$('sbResetBtn').addEventListener('click', resetBoard);

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

$('sbPlayerBigPlay').addEventListener('click', () => playerTogglePlay(true));
$('sbPlayerPlayBtn').addEventListener('click', () => { playerTogglePlay(); showChrome(); });
$('sbPlayerPrevBtn').addEventListener('click', () => { playerPrev(); showChrome(); });
$('sbPlayerNextBtn').addEventListener('click', () => { playerNext(); showChrome(); });
$('sbPlayerReplayBtn').addEventListener('click', playerReplay);
$('sbPlayerEditBtn').addEventListener('click', () => closePlayer());
$('sbPlayerCloseBtn').addEventListener('click', () => closePlayer());
$('sbPlayerFsBtn').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    $('sbPlayer').requestFullscreen && $('sbPlayer').requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen && document.exitFullscreen();
  }
});
$('sbPlayerStage').addEventListener('click', (e) => {
  if (!playerState.everStarted) return;
  const rect = $('sbPlayerStage').getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width * 0.35) playerPrev();
  else playerNext();
  showChrome();
});
$('sbPlayer').addEventListener('mousemove', showChrome);
$('sbPlayer').addEventListener('touchstart', showChrome);
$('sbPlayerProgress').addEventListener('animationend', (e) => {
  if (!e.target.classList.contains('player-seg-fill')) return;
  if (!playerState.playing) return;
  playerNext();
});

document.addEventListener('keydown', (e) => {
  if ($('sbPlayer').hidden) return;
  if (e.key === 'Escape') { closePlayer(); return; }
  if (!playerState.everStarted) return;
  if (e.key === ' ') { e.preventDefault(); playerTogglePlay(); showChrome(); }
  if (e.key === 'ArrowRight') { playerNext(); showChrome(); }
  if (e.key === 'ArrowLeft') { playerPrev(); showChrome(); }
});

window.addEventListener('beforeunload', (e) => {
  if (state.frames.length) { e.preventDefault(); e.returnValue = ''; }
});
