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

const DEFAULT_DURATION = 4; // segundos por cuadro en la presentación
const FADE_MS = 380; // debe coincidir con la transition de .sb-player-stage en el CSS

const state = { frames: [], projectName: '', clientName: '' };
const playerState = { index: 0, playing: false, everStarted: false };
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
      frames.push({ id: makeId(), blob, blobUrl, name: filename, desc, duration: DEFAULT_DURATION });
    }

    state.frames = frames;
    if (!state.projectName) {
      state.projectName = file.name.replace(/\.zip$/i, '').replace(/[_-]+/g, ' ').trim();
    }
    hideLoading();
    enterEditor();
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
    { color: '#D4FF00', emoji: '⭐', desc: 'Cierre con logo animado y CTA: "Pedí ya por WhatsApp".' },
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">` +
    `<rect width="640" height="360" fill="#111"/>` +
    `<rect width="640" height="360" fill="${color}" fill-opacity="0.12"/>` +
    `<text x="50%" y="44%" font-size="90" text-anchor="middle" dominant-baseline="middle">${emoji}</text>` +
    `<text x="50%" y="78%" font-size="22" fill="${color}" font-family="sans-serif" text-anchor="middle">Cuadro ${n} · ejemplo</text>` +
    `</svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// ─── Editor (revisión rápida) ────────────────────────────────

function enterEditor() {
  $('sbDropSection').hidden = true;
  $('sbEditor').hidden = false;
  $('sbProjectName').value = state.projectName || '';
  $('sbClientName').value = state.clientName || '';
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard · Chimichurri Diseño';
  renderEditorList();
}

function renderEditorList() {
  const list = $('sbEditorList');
  list.innerHTML = '';
  state.frames.forEach((frame, idx) => list.appendChild(buildEditorRow(frame, idx)));
  list.appendChild(buildEditorAddRow());
  $('sbEditorCount').textContent = `${state.frames.length} cuadro${state.frames.length === 1 ? '' : 's'}`;
}

function buildEditorRow(frame, idx) {
  const el = document.createElement('div');
  el.className = 'sb-row';
  el.draggable = true;
  el.dataset.id = frame.id;

  const thumb = document.createElement('div');
  thumb.className = 'sb-row-thumb';
  if (frame.blobUrl) {
    const img = document.createElement('img');
    img.src = frame.blobUrl;
    img.alt = `Cuadro ${idx + 1}`;
    img.loading = 'lazy';
    thumb.appendChild(img);
  } else {
    thumb.classList.add('empty');
    thumb.textContent = '🖼️';
  }
  thumb.addEventListener('click', () => {
    if (frame.blobUrl) openPlayer({ startIndex: idx, autoplay: false });
    else { pendingAddTargetId = frame.id; $('sbAddFrameInput').click(); }
  });
  const num = document.createElement('div');
  num.className = 'sb-row-num';
  num.textContent = String(idx + 1).padStart(2, '0');
  thumb.appendChild(num);

  const body = document.createElement('div');
  body.className = 'sb-row-body';

  const desc = document.createElement('textarea');
  desc.className = 'sb-row-desc';
  desc.placeholder = '¿Qué pasa en este cuadro?';
  desc.rows = 1;
  desc.value = frame.desc;
  desc.addEventListener('input', () => { frame.desc = desc.value; autoGrow(desc); });

  const meta = document.createElement('div');
  meta.className = 'sb-row-meta';

  const duration = document.createElement('label');
  duration.className = 'sb-row-duration';
  const durInput = document.createElement('input');
  durInput.type = 'number';
  durInput.min = '1';
  durInput.max = '20';
  durInput.step = '0.5';
  durInput.value = frame.duration;
  durInput.addEventListener('change', () => {
    const v = parseFloat(durInput.value);
    frame.duration = Number.isFinite(v) && v > 0 ? Math.max(1, v) : DEFAULT_DURATION;
    durInput.value = frame.duration;
  });
  duration.appendChild(durInput);
  duration.appendChild(document.createTextNode('seg'));

  const spacer = document.createElement('div');
  spacer.className = 'sb-row-meta-spacer';

  const controls = document.createElement('div');
  controls.className = 'sb-row-controls';
  controls.innerHTML =
    '<button type="button" class="sb-row-btn sb-row-drag" title="Arrastrar para reordenar">⠿</button>' +
    '<button type="button" class="sb-row-btn" data-act="up" title="Mover antes">↑</button>' +
    '<button type="button" class="sb-row-btn" data-act="down" title="Mover después">↓</button>' +
    '<button type="button" class="sb-row-btn danger" data-act="del" title="Eliminar cuadro">✕</button>';
  controls.addEventListener('click', (e) => {
    e.stopPropagation();
    const btn = e.target.closest('button');
    const act = btn && btn.dataset.act;
    if (!act) return;
    if (act === 'up') moveFrame(frame.id, -1);
    if (act === 'down') moveFrame(frame.id, 1);
    if (act === 'del') deleteFrame(frame.id);
  });

  meta.appendChild(duration);
  meta.appendChild(spacer);
  meta.appendChild(controls);

  body.appendChild(desc);
  body.appendChild(meta);

  el.appendChild(thumb);
  el.appendChild(body);

  attachDragHandlers(el, frame.id);
  requestAnimationFrame(() => autoGrow(desc));

  return el;
}

function buildEditorAddRow() {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'sb-row-add';
  el.textContent = '+ Agregar cuadro';
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
  renderEditorList();
}

function deleteFrame(id) {
  const i = state.frames.findIndex(f => f.id === id);
  if (i === -1) return;
  const [f] = state.frames.splice(i, 1);
  lastDeleted = { frame: f, index: i };
  renderEditorList();
  showToast('Cuadro eliminado.', { actionLabel: 'Deshacer', onAction: undoDelete });
}

function undoDelete() {
  if (!lastDeleted) return;
  state.frames.splice(lastDeleted.index, 0, lastDeleted.frame);
  lastDeleted = null;
  renderEditorList();
}

function attachDragHandlers(el, id) {
  el.addEventListener('dragstart', () => {
    dragId = id;
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => {
    el.classList.remove('dragging');
    document.querySelectorAll('.sb-row.drag-over').forEach(n => n.classList.remove('drag-over'));
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
    renderEditorList();
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
  state.clientName = '';
  closePlayer({ silent: true });
  $('sbEditor').hidden = true;
  $('sbEditorList').innerHTML = '';
  $('sbDropSection').hidden = false;
  $('sbFileInput').value = '';
  document.title = 'Storyboard Builder — Chimichurri Diseño';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Player (presentación cinematográfica) ───────────────────

function buildSegments() {
  const wrap = $('sbPlayerProgress');
  wrap.innerHTML = '';
  state.frames.forEach(() => {
    const seg = document.createElement('div');
    seg.className = 'sb-player-seg';
    const fill = document.createElement('span');
    fill.className = 'sb-player-seg-fill';
    seg.appendChild(fill);
    wrap.appendChild(seg);
  });
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
      fill.style.animation = 'sbSegFill linear forwards';
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

  const doSwap = () => {
    const f = frames[newIdx];
    $('sbPlayerImg').src = f.blobUrl || '';
    $('sbPlayerImg').alt = `Cuadro ${newIdx + 1}`;
    $('sbPlayerCaption').textContent = f.desc || '';
    stage.classList.remove('fade');
  };

  const stage = $('sbPlayerStage');
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
    // si el segmento activo ya estaba con la animación en "none" (recién mostrado), reiniciarla
    updateSegments();
  }
}

function openPlayer({ startIndex = 0, autoplay = false } = {}) {
  if (!state.frames.length) return;
  $('sbEditor').hidden = true;
  $('sbDropSection').hidden = true;
  $('sbPlayer').hidden = false;
  $('sbPlayerProjectName').textContent = state.projectName || 'Storyboard';
  $('sbPlayerClientName').textContent = state.clientName || '';
  $('sbPlayerClientName').hidden = !state.clientName;
  buildSegments();
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
  if (!opts.silent) $('sbEditor').hidden = false;
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

function buildStandaloneHtml(title, client, framesData) {
  const framesJson = JSON.stringify(framesData).replace(/</g, '\\u003c');
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)} — Storyboard</title>
<style>
  :root { --bg:#050505; --accent:#D4FF00; }
  * { box-sizing:border-box; }
  html,body { height:100%; }
  body { margin:0; background:var(--bg); font-family:-apple-system,'Segoe UI',Inter,sans-serif; overflow:hidden; }
  .p { position:fixed; inset:0; display:flex; flex-direction:column; }
  .prog { display:flex; gap:6px; padding:14px 16px 0; }
  .seg { flex:1; height:3px; background:rgba(255,255,255,.22); border-radius:2px; overflow:hidden; }
  .seg-fill { display:block; height:100%; width:0%; background:#fff; border-radius:2px; }
  .seg.done .seg-fill { width:100%; }
  .seg.active .seg-fill { animation-name:fillseg; animation-timing-function:linear; animation-fill-mode:forwards; }
  .p.paused .seg.active .seg-fill { animation-play-state:paused; }
  @keyframes fillseg { from{width:0%} to{width:100%} }
  .top { display:flex; justify-content:space-between; align-items:flex-start; padding:10px 16px 0; }
  .meta { font-size:.78rem; color:rgba(255,255,255,.6); }
  .meta b { color:#fff; font-weight:700; display:block; font-size:.85rem; }
  .iconbtn { width:34px; height:34px; border-radius:50%; border:none; background:rgba(255,255,255,.12); color:#fff; display:flex; align-items:center; justify-content:center; cursor:pointer; font-size:1rem; }
  .iconbtn:hover { background:rgba(255,255,255,.24); }
  .stage { flex:1; min-height:0; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:22px; padding:14px 28px 6px; transition:opacity .38s ease; cursor:pointer; position:relative; }
  .stage.fade { opacity:0; }
  .imgwrap { flex:1; min-height:0; width:100%; display:flex; align-items:center; justify-content:center; }
  .imgwrap img { max-width:100%; max-height:100%; object-fit:contain; border-radius:16px; box-shadow:0 24px 70px rgba(0,0,0,.55); }
  .cap { max-width:680px; text-align:center; color:#fff; font-size:clamp(1rem,2.2vw,1.3rem); font-weight:600; line-height:1.55; min-height:1.6em; }
  .bigplay { position:absolute; inset:0; margin:auto; width:84px; height:84px; border-radius:50%; background:var(--accent); border:none; color:#000; font-size:1.7rem; cursor:pointer; box-shadow:0 10px 40px rgba(0,0,0,.5); }
  .controls { display:flex; align-items:center; justify-content:center; gap:18px; padding:6px 20px 26px; flex-shrink:0; }
  .btn { width:44px; height:44px; border-radius:50%; border:none; background:rgba(255,255,255,.12); color:#fff; font-size:1rem; cursor:pointer; }
  .btn:hover { background:rgba(255,255,255,.24); }
  .btn.primary { width:56px; height:56px; background:var(--accent); color:#000; font-size:1.2rem; }
  .end { position:absolute; inset:0; background:rgba(5,5,5,.88); backdrop-filter:blur(6px); display:flex; flex-direction:column; align-items:center; justify-content:center; gap:16px; text-align:center; padding:24px; opacity:0; pointer-events:none; transition:opacity .4s ease; }
  .end.show { opacity:1; pointer-events:auto; }
  .end h3 { color:#fff; font-size:clamp(1.3rem,4vw,2rem); margin:0; }
  .end p { color:rgba(255,255,255,.65); max-width:380px; font-size:.9rem; margin:0; }
  .end-actions { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; margin-top:6px; }
  .a-btn { display:inline-flex; align-items:center; gap:8px; padding:12px 22px; border-radius:100px; font-weight:700; font-size:.88rem; text-decoration:none; border:none; cursor:pointer; }
  .a-btn.primary { background:var(--accent); color:#000; }
  .a-btn.wa { background:#25D366; color:#000; }
  [hidden] { display:none !important; }
</style>
</head>
<body>
  <div class="p paused" id="p">
    <div class="prog" id="prog"></div>
    <div class="top">
      <div class="meta"><b id="pname"></b><span id="cname"></span></div>
      <div><button class="iconbtn" id="fsBtn" title="Pantalla completa">⛶</button></div>
    </div>
    <div class="stage" id="stage">
      <div class="imgwrap"><img id="img" alt=""></div>
      <p class="cap" id="cap"></p>
      <button class="bigplay" id="bigplay" aria-label="Reproducir">▶</button>
    </div>
    <div class="controls">
      <button class="btn" id="prevBtn">◀</button>
      <button class="btn primary" id="playBtn">▶</button>
      <button class="btn" id="nextBtn">▶</button>
    </div>
    <div class="end" id="end">
      <h3>Fin del storyboard</h3>
      <p>Así se va a ver el video, cuadro por cuadro.</p>
      <div class="end-actions">
        <button class="a-btn primary" id="replayBtn">↺ Ver de nuevo</button>
        <a class="a-btn wa" href="https://wa.me/5491100000000" target="_blank" rel="noopener">¿Te copó? Escribinos</a>
      </div>
    </div>
  </div>
<script>
(function(){
  var FRAMES = ${framesJson};
  var CLIENT = ${JSON.stringify(client || '')};
  var TITLE = ${JSON.stringify(title)};
  document.getElementById('pname').textContent = TITLE;
  var cnameEl = document.getElementById('cname');
  if (CLIENT) { cnameEl.textContent = CLIENT; } else { cnameEl.hidden = true; }

  var st = { index: 0, playing: false, started: false };
  var p = document.getElementById('p');
  var prog = document.getElementById('prog');
  var stage = document.getElementById('stage');
  var img = document.getElementById('img');
  var cap = document.getElementById('cap');
  var bigplay = document.getElementById('bigplay');
  var playBtn = document.getElementById('playBtn');
  var end = document.getElementById('end');

  FRAMES.forEach(function () {
    var seg = document.createElement('div'); seg.className = 'seg';
    var fill = document.createElement('span'); fill.className = 'seg-fill';
    seg.appendChild(fill); prog.appendChild(seg);
  });

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
    var swap = function () {
      var f = FRAMES[idx];
      img.src = f.src || '';
      cap.textContent = f.desc || '';
      stage.classList.remove('fade');
    };
    if (instant) { swap(); return; }
    stage.classList.add('fade');
    setTimeout(swap, 380);
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
  }
  function togglePlay(force) {
    var should = force != null ? force : !st.playing;
    st.playing = should;
    p.classList.toggle('paused', !should);
    playBtn.textContent = should ? '❚❚' : '▶';
    if (should) { st.started = true; bigplay.hidden = true; updateSegments(); }
  }

  prog.addEventListener('animationend', function (e) {
    if (!e.target.classList.contains('seg-fill')) return;
    if (!st.playing) return;
    next();
  });
  bigplay.addEventListener('click', function () { togglePlay(true); });
  playBtn.addEventListener('click', function () { togglePlay(); });
  document.getElementById('prevBtn').addEventListener('click', prev);
  document.getElementById('nextBtn').addEventListener('click', next);
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
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    if (e.key === 'ArrowRight') next();
    if (e.key === 'ArrowLeft') prev();
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
  const html = buildStandaloneHtml(title, state.clientName, framesData);
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
  enterEditor();
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
  renderEditorList();
});

$('sbProjectName').addEventListener('input', (e) => {
  state.projectName = e.target.value;
  document.title = (state.projectName ? state.projectName + ' — ' : '') + 'Storyboard · Chimichurri Diseño';
});
$('sbClientName').addEventListener('input', (e) => { state.clientName = e.target.value; });

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
$('sbPlayerPlayBtn').addEventListener('click', () => playerTogglePlay());
$('sbPlayerPrevBtn').addEventListener('click', playerPrev);
$('sbPlayerNextBtn').addEventListener('click', playerNext);
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
  if (e.target.closest('.sb-player-bigplay')) return;
  if (!playerState.everStarted) return;
  const rect = $('sbPlayerStage').getBoundingClientRect();
  const x = e.clientX - rect.left;
  if (x < rect.width * 0.35) playerPrev();
  else playerNext();
});
$('sbPlayerProgress').addEventListener('animationend', (e) => {
  if (!e.target.classList.contains('sb-player-seg-fill')) return;
  if (!playerState.playing) return;
  playerNext();
});

document.addEventListener('keydown', (e) => {
  if ($('sbPlayer').hidden) return;
  if (e.key === 'Escape') { closePlayer(); return; }
  if (!playerState.everStarted) return;
  if (e.key === ' ') { e.preventDefault(); playerTogglePlay(); }
  if (e.key === 'ArrowRight') playerNext();
  if (e.key === 'ArrowLeft') playerPrev();
});

window.addEventListener('beforeunload', (e) => {
  if (state.frames.length) { e.preventDefault(); e.returnValue = ''; }
});
