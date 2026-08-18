/* ══════════════════════════════════════════════════════════════
   BIG HOUSE — Plataforma de rutinas (demo funcional, sin backend)
   Datos en localStorage. Acceso por código, sin contraseña.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const LS_DATA = 'bighouse_gym_v1';
  const LS_SESSION = 'bighouse_gym_session';

  const EX_BY_ID = {};
  (window.EXERCISES || []).forEach(e => (EX_BY_ID[e.id] = e));
  const GRUPOS = [...new Set((window.EXERCISES || []).map(e => e.grupo))];

  /* ---------- estado ---------- */
  function loadState() {
    try {
      const raw = localStorage.getItem(LS_DATA);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const s = window.SEED;
    const st = {
      _v: 1,
      settings: {
        gymName: s.gym.nombre, gymTag: s.gym.tag, ig: s.gym.ig,
        wa: s.gym.wa, addr: s.gym.sucursal, mapUrl: '', profeCode: s.profeCode,
      },
      alumnos: JSON.parse(JSON.stringify(s.alumnos)),
    };
    saveState(st);
    return st;
  }
  let STATE = loadState();
  function saveState(st) { localStorage.setItem(LS_DATA, JSON.stringify(st || STATE)); }

  function loadSession() {
    try { return JSON.parse(localStorage.getItem(LS_SESSION)) || null; } catch (e) { return null; }
  }
  function setSession(s) {
    if (s) localStorage.setItem(LS_SESSION, JSON.stringify(s));
    else localStorage.removeItem(LS_SESSION);
  }

  /* ---------- helpers ---------- */
  const $ = sel => document.querySelector(sel);
  const $$ = sel => Array.from(document.querySelectorAll(sel));
  const uid = p => (p || 'x') + Date.now().toString(36) + Math.floor(Math.random() * 900 + 100).toString(36);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const initials = n => (n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();

  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2200);
  }
  // Placeholder SVG (se ve intencional aunque no haya internet)
  function placeholderSVG(nombre, ab) {
    const label = ab === 'A' ? 'INICIO' : 'FIN';
    const nm = String(nombre || 'Ejercicio').toUpperCase().slice(0, 26);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400">' +
      '<rect width="400" height="400" fill="#181818"/>' +
      '<rect width="400" height="400" fill="url(#g)"/>' +
      '<defs><radialGradient id="g" cx="70%" cy="10%" r="90%">' +
      '<stop offset="0" stop-color="#D4FF00" stop-opacity="0.10"/>' +
      '<stop offset="1" stop-color="#181818" stop-opacity="0"/></radialGradient></defs>' +
      '<g transform="translate(200 168)" fill="none" stroke="#D4FF00" stroke-width="9" ' +
      'stroke-linecap="round" opacity="0.85">' +
      '<path d="M-70 0h140M-70-22v44M70-22v44M-92-13v26M92-13v26"/></g>' +
      '<text x="200" y="250" fill="#f4f4f4" font-family="Oswald,Arial,sans-serif" ' +
      'font-size="26" font-weight="700" text-anchor="middle" letter-spacing="1">' + esc(nm) + '</text>' +
      '<text x="200" y="284" fill="#8a8a8a" font-family="Oswald,Arial,sans-serif" ' +
      'font-size="15" font-weight="600" text-anchor="middle" letter-spacing="4">FOTO ' +
      (ab || 'A') + ' · ' + label + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  function fallbackImg(el, exId, ab) {
    // 1º CDN falla → probar GitHub raw; 2º raw falla → placeholder local (sin internet)
    const ex = EX_BY_ID[exId];
    const step = +(el.dataset.fb || 0);
    if (step === 0 && ex) {
      const alt = ab === 'A' ? ex.fotoAalt : ex.fotoBalt;
      if (alt) { el.dataset.fb = '1'; el.src = alt; return; }
    }
    el.onerror = null;
    el.dataset.fb = '2';
    el.src = placeholderSVG(ex ? ex.nombre : '', ab);
  }
  window._imgErr = fallbackImg;

  function planCount(al) {
    let ex = 0; (al.plan || []).forEach(d => ex += (d.ejercicios || []).length);
    return { dias: (al.plan || []).length, ejercicios: ex };
  }

  /* ---------- routing ---------- */
  function show(screen) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    const el = $('#screen-' + screen); if (el) el.classList.add('active');
    const appScreens = ['rutina', 'profe'];
    $('#topbar').classList.toggle('hidden', !appScreens.includes(screen));
    window.scrollTo(0, 0);
  }

  function route() {
    const ses = loadSession();
    if (!ses) { show('landing'); return; }
    if (ses.role === 'profe') { renderTopbar('profe'); renderProfe(); show('profe'); return; }
    if (ses.role === 'alumno') {
      const al = STATE.alumnos.find(a => a.id === ses.alumnoId);
      if (!al) { setSession(null); show('landing'); return; }
      renderTopbar('alumno', al); renderRutina(al); show('rutina');
    }
  }

  /* ---------- topbar ---------- */
  function renderTopbar(role, al) {
    const g = STATE.settings;
    $('#brandName').textContent = g.gymName;
    $('#brandTag').textContent = g.gymTag;
    $('#brandMark').textContent = (g.gymName || 'B')[0];
    const who = $('#whoami');
    if (role === 'profe') who.innerHTML = '<span class="role-txt">Profesor</span> <b>Panel</b>';
    else who.innerHTML = '<span class="role-txt">Alumno</span> <b>' + esc(al.nombre) + '</b>';
  }

  /* ══════════════ LANDING ══════════════ */
  function renderLanding() {
    const g = STATE.settings;
    $('#landTitle').innerHTML = esc(g.gymName).replace(/\s+/, '<br>');
    $('#landLogo').textContent = (g.gymName || 'B')[0];
    $('#brandMark') && ($('#brandMark').textContent = (g.gymName || 'B')[0]);
    $('#landWa').href = 'https://wa.me/' + (g.wa || '').replace(/\D/g, '');
    const igUser = (g.ig || '').replace('@', '');
    $('#landIg').href = 'https://instagram.com/' + igUser;
    $('#landIgUser').textContent = g.ig || '@tugimnasio';
    $('#landAddr').textContent = g.addr || 'Dirección del gimnasio';
    $('#landMap').href = g.mapUrl || ('https://maps.google.com/?q=' + encodeURIComponent(g.addr || ''));
  }

  /* ══════════════ LOGIN ══════════════ */
  let loginMode = 'alumno';
  function openLogin(mode) {
    loginMode = mode;
    $('#loginErr').textContent = '';
    $('#codeInput').value = '';
    if (mode === 'alumno') {
      $('#loginKicker').textContent = 'Acceso alumno';
      $('#loginTitle').textContent = 'Entrá a tu rutina';
      $('#loginSub').textContent = 'Ingresá el código que te dio el profe. Queda recordado en este dispositivo — sin contraseña.';
      const codes = STATE.alumnos.map(a => '<code data-code="' + esc(a.codigo) + '">' + esc(a.codigo) + '</code>').join('');
      $('#demoCodes').innerHTML = codes;
      $('#demoHint').classList.remove('hidden');
    } else {
      $('#loginKicker').textContent = 'Acceso profesor';
      $('#loginTitle').textContent = 'Panel del profesor';
      $('#loginSub').textContent = 'Ingresá el código de acceso del panel.';
      $('#demoCodes').innerHTML = '<code data-code="' + esc(STATE.settings.profeCode) + '">' + esc(STATE.settings.profeCode) + '</code>';
      $('#demoHint').classList.remove('hidden');
    }
    show('login');
    setTimeout(() => $('#codeInput').focus(), 100);
  }

  function tryLogin(code) {
    code = (code || '').trim().toUpperCase();
    if (!code) return;
    if (loginMode === 'profe') {
      if (code === (STATE.settings.profeCode || '').toUpperCase()) {
        setSession({ role: 'profe' }); route(); toast('Bienvenido, profe');
      } else fail();
      return;
    }
    const al = STATE.alumnos.find(a => (a.codigo || '').toUpperCase() === code);
    if (al) { setSession({ role: 'alumno', alumnoId: al.id }); route(); toast('¡A entrenar, ' + al.nombre.split(' ')[0] + '!'); }
    else fail();
    function fail() {
      $('#loginErr').textContent = 'Código incorrecto. Probá de nuevo.';
      $('#codeInput').focus(); $('#codeInput').select();
    }
  }

  /* ══════════════ ALUMNO: RUTINA ══════════════ */
  let curDay = 0;
  function renderRutina(al) {
    curDay = 0;
    $('#ticker').innerHTML = (GRUPOS.join(' <span>◆</span> ') + ' <span>◆</span> ').repeat(2);
    $('#rutName').textContent = al.nombre;
    $('#rutMeta').innerHTML = '<span class="tag tag-accent">' + esc(al.nivel) + '</span> &nbsp; ' +
      'Objetivo: <b style="color:var(--text)">' + esc(al.objetivo || '—') + '</b>';
    const pc = planCount(al);
    $('#rutStats').innerHTML = [
      ['Días', pc.dias], ['Ejercicios', pc.ejercicios],
      ['Nivel', al.nivel || '—'], ['Objetivo', (al.objetivo || '—')],
    ].map(([l, n]) => '<div class="stat"><div class="n" style="font-size:' + (String(n).length > 6 ? '1.15rem' : '2.2rem') + '">' + esc(n) + '</div><div class="l">' + l + '</div></div>').join('');
    renderDayBar(al);
    renderExList(al);
  }
  function renderDayBar(al) {
    const bar = $('#dayBar');
    if (!al.plan || !al.plan.length) { bar.innerHTML = ''; return; }
    bar.innerHTML = al.plan.map((d, i) =>
      '<div class="daypill' + (i === curDay ? ' on' : '') + '" data-day="' + i + '">' +
      '<div class="d">Día ' + (i + 1) + '</div><div class="t">' + esc(d.nombre.replace(/^D[ií]a\s*\d+\s*[—-]\s*/i, '')) + '</div>' +
      '<div class="c">' + (d.ejercicios || []).length + ' ejercicios</div></div>').join('');
  }
  function renderExList(al) {
    const list = $('#exList');
    const day = (al.plan || [])[curDay];
    if (!day || !day.ejercicios.length) {
      list.innerHTML = emptyState('Sin ejercicios en este día', 'El profe todavía no cargó ejercicios acá.');
      return;
    }
    list.innerHTML = day.ejercicios.map((p, i) => exCard(p, i)).join('');
  }
  function exCard(p, i) {
    const ex = EX_BY_ID[p.exId];
    if (!ex) return '';
    const musculos = (ex.musculos || []).map(m => '<span class="tag">' + esc(m) + '</span>').join('');
    const note = p.nota ? '<div class="ex-note"><b>Nota del profe</b><br>' + esc(p.nota) + '</div>' : '';
    return '' +
      '<div class="ex-card"><div class="ex-card-top">' +
        '<div class="ex-media">' +
          '<div class="ex-frame a"><span class="ab">A</span><img loading="lazy" src="' + ex.fotoA + '" alt="' + esc(ex.nombre) + ' inicio" onerror="_imgErr(this,\'' + ex.id + '\',\'A\')"></div>' +
          '<div class="arrow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>' +
          '<div class="ex-frame b"><span class="ab">B</span><img loading="lazy" src="' + ex.fotoB + '" alt="' + esc(ex.nombre) + ' final" onerror="_imgErr(this,\'' + ex.id + '\',\'B\')"></div>' +
        '</div>' +
        '<div class="ex-body">' +
          '<div class="top"><div><span class="tag tag-accent" style="margin-bottom:6px">' + esc(ex.grupo) + '</span>' +
            '<div class="ex-name">' + (i + 1) + '. ' + esc(ex.nombre) + '</div></div></div>' +
          '<div class="ex-tags">' + musculos + '<span class="tag">' + esc(ex.equipo) + '</span></div>' +
          '<div class="ex-cue">' + esc(ex.cue) + '</div>' +
          note +
          '<div class="ex-prescr">' +
            pr(p.series, 'Series') + pr(p.reps, 'Reps') + pr(p.peso, 'Carga') + pr(p.descanso, 'Descanso') +
          '</div>' +
        '</div>' +
      '</div></div>';
  }
  function pr(n, l) {
    return '<div class="pr"><div class="n">' + esc(n || '—') + '</div><div class="l">' + l + '</div></div>';
  }
  function emptyState(t, s) {
    return '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6.5h11M6 17.5h11M4 9v6M20 9v6"/><rect x="6" y="8" width="12" height="8" rx="1"/></svg>' +
      '<h3>' + esc(t) + '</h3><p>' + esc(s) + '</p></div>';
  }

  /* ══════════════ PROFE ══════════════ */
  function renderProfe() {
    const total = STATE.alumnos.length;
    let dias = 0, ejs = 0;
    STATE.alumnos.forEach(a => { const c = planCount(a); dias += c.dias; ejs += c.ejercicios; });
    $('#profeStats').innerHTML = [
      ['Alumnos', total], ['Días programados', dias],
      ['Ejercicios asignados', ejs], ['En biblioteca', (window.EXERCISES || []).length],
    ].map(([l, n]) => '<div class="stat"><div class="n">' + n + '</div><div class="l">' + l + '</div></div>').join('');
    renderStudents();
  }
  function renderStudents() {
    const grid = $('#studentGrid');
    if (!STATE.alumnos.length) { grid.innerHTML = emptyState('Sin alumnos', 'Creá el primero con “Nuevo alumno”.'); return; }
    grid.innerHTML = STATE.alumnos.map(a => {
      const c = planCount(a);
      return '<div class="stud-card">' +
        '<div class="stud-top"><div class="avatar">' + initials(a.nombre) + '</div>' +
          '<div class="nm"><b>' + esc(a.nombre) + '</b><span>' + c.dias + ' días · ' + c.ejercicios + ' ejercicios</span></div></div>' +
        '<div class="stud-meta"><span class="tag tag-accent">' + esc(a.nivel || '—') + '</span><span class="tag">' + esc(a.objetivo || '—') + '</span></div>' +
        '<div class="stud-code"><span class="k">Código</span><span class="v" data-copy="' + esc(a.codigo) + '" style="cursor:pointer">' + esc(a.codigo) + '</span></div>' +
        '<div class="stud-actions">' +
          '<button class="btn btn-primary btn-sm" data-plan="' + a.id + '">Armar plan</button>' +
          '<button class="btn btn-solid btn-sm" data-edit="' + a.id + '">Datos</button>' +
          '<button class="btn btn-solid btn-sm" data-preview="' + a.id + '">Ver ficha</button>' +
        '</div></div>';
    }).join('');
  }

  /* ---------- biblioteca (profe) ---------- */
  let libFilter = 'Todos', libQuery = '';
  function renderLibFilters() {
    const all = ['Todos', ...GRUPOS];
    $('#libFilters').innerHTML = all.map(g =>
      '<span class="tag' + (g === libFilter ? ' on' : '') + '" data-filter="' + esc(g) + '">' + esc(g) + '</span>').join('');
  }
  function renderLib() {
    const q = libQuery.toLowerCase();
    const items = (window.EXERCISES || []).filter(e =>
      (libFilter === 'Todos' || e.grupo === libFilter) &&
      (!q || e.nombre.toLowerCase().includes(q) || (e.musculos || []).join(' ').toLowerCase().includes(q)));
    const grid = $('#libGrid');
    if (!items.length) { grid.innerHTML = emptyState('Sin resultados', 'Probá otro filtro o búsqueda.'); return; }
    grid.innerHTML = items.map(e =>
      '<div class="lib-card" data-ex="' + e.id + '">' +
        '<div class="lib-media">' +
          '<div class="f a"><span class="ab">A</span><img loading="lazy" src="' + e.fotoA + '" onerror="_imgErr(this,\'' + e.id + '\',\'A\')" alt=""></div>' +
          '<div class="f b"><span class="ab">B</span><img loading="lazy" src="' + e.fotoB + '" onerror="_imgErr(this,\'' + e.id + '\',\'B\')" alt=""></div>' +
        '</div>' +
        '<div class="lib-info"><div class="g">' + esc(e.grupo) + '</div><h3>' + esc(e.nombre) + '</h3>' +
          '<div class="meta"><span class="tag">' + esc(e.equipo) + '</span><span class="tag">' + esc((e.musculos || [])[0] || '') + '</span></div></div>' +
      '</div>').join('');
  }

  /* ══════════════ MODAL infra ══════════════ */
  function openModal(html, wide) {
    $('#modal').className = 'modal' + (wide ? ' wide' : '');
    $('#modal').innerHTML = html;
    $('#modalBg').classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    $('#modalBg').classList.remove('open');
    document.body.style.overflow = '';
  }

  /* ---------- detalle ejercicio ---------- */
  function exerciseDetail(exId) {
    const e = EX_BY_ID[exId]; if (!e) return;
    openModal(
      '<div class="modal-head"><h3>' + esc(e.nombre) + '</h3><button class="modal-x" data-close>✕</button></div>' +
      '<div class="modal-body">' +
        '<div class="ex-media" style="border-radius:14px;overflow:hidden;margin-bottom:18px">' +
          '<div class="ex-frame a" style="width:50%;flex:1"><span class="ab">A · Inicio</span><img src="' + e.fotoA + '" onerror="_imgErr(this,\'' + e.id + '\',\'A\')" alt=""></div>' +
          '<div class="arrow"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div>' +
          '<div class="ex-frame b" style="width:50%;flex:1"><span class="ab">B · Fin</span><img src="' + e.fotoB + '" onerror="_imgErr(this,\'' + e.id + '\',\'B\')" alt=""></div>' +
        '</div>' +
        '<div class="ex-tags" style="margin-bottom:14px"><span class="tag tag-accent">' + esc(e.grupo) + '</span>' +
          (e.musculos || []).map(m => '<span class="tag">' + esc(m) + '</span>').join('') +
          '<span class="tag">' + esc(e.equipo) + '</span><span class="tag">' + esc(e.nivel) + '</span></div>' +
        '<p style="color:var(--text)">' + esc(e.cue) + '</p>' +
      '</div>', false);
  }

  /* ---------- alta / edición de alumno ---------- */
  function studentForm(id) {
    const a = id ? STATE.alumnos.find(x => x.id === id) : null;
    const v = a || { nombre: '', codigo: '', nivel: 'Principiante', objetivo: '', notas: '' };
    openModal(
      '<div class="modal-head"><h3>' + (a ? 'Editar alumno' : 'Nuevo alumno') + '</h3><button class="modal-x" data-close>✕</button></div>' +
      '<div class="modal-body"><form id="stForm">' +
        '<div class="field"><label>Nombre y apellido</label><input name="nombre" value="' + esc(v.nombre) + '" required></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Código de acceso</label><input name="codigo" value="' + esc(v.codigo) + '" placeholder="EJ: JUAN" style="text-transform:uppercase" required></div>' +
          '<div class="field"><label>Nivel</label><select name="nivel">' +
            ['Principiante', 'Intermedio', 'Avanzado'].map(n => '<option' + (v.nivel === n ? ' selected' : '') + '>' + n + '</option>').join('') +
          '</select></div>' +
        '</div>' +
        '<div class="field"><label>Objetivo</label><input name="objetivo" value="' + esc(v.objetivo) + '" placeholder="Hipertrofia, fuerza, bajar grasa…"></div>' +
        '<div class="field"><label>Notas internas</label><textarea name="notas" placeholder="Lesiones, observaciones…">' + esc(v.notas || '') + '</textarea></div>' +
        (a ? '<button type="button" class="btn btn-danger btn-sm" data-del="' + a.id + '">Eliminar alumno</button>' : '') +
      '</form></div>' +
      '<div class="modal-foot"><button class="btn btn-solid" data-close>Cancelar</button>' +
        '<button class="btn btn-primary" id="stSave">' + (a ? 'Guardar' : 'Crear alumno') + '</button></div>', false);

    $('#stSave').onclick = () => {
      const f = $('#stForm');
      const d = {
        nombre: f.nombre.value.trim(),
        codigo: f.codigo.value.trim().toUpperCase(),
        nivel: f.nivel.value, objetivo: f.objetivo.value.trim(), notas: f.notas.value.trim(),
      };
      if (!d.nombre || !d.codigo) { toast('Completá nombre y código'); return; }
      const dup = STATE.alumnos.find(x => x.codigo.toUpperCase() === d.codigo && x.id !== (a && a.id));
      if (dup) { toast('Ese código ya está en uso'); return; }
      if (a) { Object.assign(a, d); toast('Alumno actualizado'); }
      else { STATE.alumnos.push({ id: uid('a'), plan: [], ...d }); toast('Alumno creado'); }
      saveState(); closeModal(); renderProfe();
    };
  }

  /* ---------- constructor de plan ---------- */
  let builder = { id: null, day: 0, picking: false };
  function openBuilder(id) {
    builder = { id, day: 0, picking: false };
    renderBuilder();
  }
  function renderBuilder() {
    const a = STATE.alumnos.find(x => x.id === builder.id); if (!a) return;
    a.plan = a.plan || [];
    if (builder.day >= a.plan.length) builder.day = Math.max(0, a.plan.length - 1);

    const dayTabs = a.plan.map((d, i) =>
      '<button class="' + (i === builder.day ? 'on' : '') + '" data-bday="' + i + '">' + esc(d.nombre.replace(/^D[ií]a\s*\d+\s*[—-]\s*/i, '') || ('Día ' + (i + 1))) + '</button>').join('') +
      '<button data-baddday>+ Día</button>';

    let body;
    if (!a.plan.length) {
      body = '<div class="empty"><h3>Sin días todavía</h3><p>Agregá el primer día de entrenamiento.</p>' +
        '<button class="btn btn-primary btn-sm" data-baddday style="margin-top:10px">+ Agregar día</button></div>';
    } else if (builder.picking) {
      body = pickerView();
    } else {
      body = dayEditor(a);
    }

    openModal(
      '<div class="modal-head"><h3>Plan · ' + esc(a.nombre) + '</h3><button class="modal-x" data-close>✕</button></div>' +
      (a.plan.length ? '<div style="padding:14px 24px 0"><div class="segmented" style="display:flex;flex-wrap:wrap">' + dayTabs + '</div></div>' : '') +
      '<div class="modal-body" id="builderBody">' + body + '</div>' +
      '<div class="modal-foot">' +
        (builder.picking ? '<button class="btn btn-solid" data-backpick>← Volver al día</button>' :
          '<button class="btn btn-solid" data-close>Listo</button>') +
      '</div>', true);
  }
  function dayEditor(a) {
    const day = a.plan[builder.day];
    const rows = (day.ejercicios || []).map((p, i) => {
      const ex = EX_BY_ID[p.exId] || { nombre: p.exId, grupo: '', fotoA: '' };
      return '<div class="arow" data-exrow="' + i + '">' +
        '<img src="' + (ex.fotoA || '') + '" onerror="_imgErr(this,\'' + p.exId + '\',\'A\')" alt="">' +
        '<div class="info"><b>' + esc(ex.nombre) + '</b><span>' + esc(ex.grupo) + '</span></div>' +
        '<div class="nums">' +
          numIn(i, 'series', p.series, 'Series') + numIn(i, 'reps', p.reps, 'Reps') +
          numIn(i, 'peso', p.peso, 'Carga') + numIn(i, 'descanso', p.descanso, 'Desc.') +
        '</div>' +
        '<button class="del" data-delex="' + i + '" title="Quitar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
      '</div>' +
      '<div class="field" style="margin:0 0 4px"><input data-notex="' + i + '" value="' + esc(p.nota || '') + '" placeholder="Nota para el alumno (opcional)…" style="background:var(--surface);font-size:.85rem"></div>';
    }).join('');

    return '<div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px">' +
        '<input id="dayNameIn" value="' + esc(day.nombre) + '" style="flex:1;min-width:180px;background:var(--surface2);border:1px solid var(--border2);border-radius:10px;padding:10px 13px;color:var(--text);font-family:var(--disp);font-weight:700">' +
        '<button class="btn btn-danger btn-sm" data-delday>Borrar día</button>' +
      '</div>' +
      '<div class="assigned">' + (rows || '<p style="color:var(--muted);padding:8px 0">Todavía no hay ejercicios en este día.</p>') + '</div>' +
      '<button class="btn btn-primary btn-block" data-openpick style="margin-top:16px">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="width:18px;height:18px"><path d="M12 5v14M5 12h14"/></svg> Agregar ejercicio de la biblioteca</button>';
  }
  function numIn(i, field, val, lbl) {
    return '<div><span class="mini-lbl">' + lbl + '</span><input data-num="' + i + '" data-field="' + field + '" value="' + esc(val || '') + '"></div>';
  }
  let pickQuery = '', pickFilter = 'Todos';
  function pickerView() {
    const q = pickQuery.toLowerCase();
    const items = (window.EXERCISES || []).filter(e =>
      (pickFilter === 'Todos' || e.grupo === pickFilter) &&
      (!q || e.nombre.toLowerCase().includes(q) || (e.musculos || []).join(' ').toLowerCase().includes(q)));
    const filters = ['Todos', ...GRUPOS].map(g =>
      '<span class="tag' + (g === pickFilter ? ' on' : '') + '" data-pfilter="' + esc(g) + '">' + esc(g) + '</span>').join('');
    const cards = items.map(e =>
      '<div class="pick" data-pick="' + e.id + '"><img src="' + e.fotoA + '" onerror="_imgErr(this,\'' + e.id + '\',\'A\')" alt="">' +
      '<div class="nm"><span>' + esc(e.grupo) + '</span>' + esc(e.nombre) + '</div></div>').join('');
    return '<div class="searchbar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4-4" stroke-linecap="round"/></svg>' +
        '<input id="pickSearch" placeholder="Buscar ejercicio…" value="' + esc(pickQuery) + '"></div>' +
      '<div class="filters">' + filters + '</div>' +
      '<div class="picker">' + (cards || '<p style="color:var(--muted)">Sin resultados.</p>') + '</div>';
  }

  function currentAlumno() { return STATE.alumnos.find(x => x.id === builder.id); }

  /* ══════════════ EVENTOS ══════════════ */
  // landing
  $('#goAlumno').onclick = () => openLogin('alumno');
  $('#goProfe').onclick = () => openLogin('profe');
  $('#loginBack').onclick = () => show('landing');
  $('#brandHome').onclick = e => { e.preventDefault(); };

  // login
  $('#loginForm').addEventListener('submit', e => { e.preventDefault(); tryLogin($('#codeInput').value); });
  $('#demoCodes').addEventListener('click', e => {
    const c = e.target.closest('[data-code]'); if (!c) return;
    $('#codeInput').value = c.dataset.code; tryLogin(c.dataset.code);
  });

  // logout
  $('#logoutBtn').onclick = () => { setSession(null); show('landing'); toast('Sesión cerrada'); };

  // rutina day change
  $('#dayBar').addEventListener('click', e => {
    const p = e.target.closest('[data-day]'); if (!p) return;
    curDay = +p.dataset.day;
    const al = STATE.alumnos.find(a => a.id === loadSession().alumnoId);
    renderDayBar(al); renderExList(al);
  });

  // profe tabs
  $('#profeTabs').addEventListener('click', e => {
    const b = e.target.closest('[data-tab]'); if (!b) return;
    $$('#profeTabs button').forEach(x => x.classList.toggle('on', x === b));
    const tab = b.dataset.tab;
    $('#tab-alumnos').classList.toggle('hidden', tab !== 'alumnos');
    $('#tab-biblioteca').classList.toggle('hidden', tab !== 'biblioteca');
    if (tab === 'biblioteca') { renderLibFilters(); renderLib(); }
  });

  // student grid
  $('#addStudentBtn').onclick = () => studentForm(null);
  $('#studentGrid').addEventListener('click', e => {
    const copy = e.target.closest('[data-copy]');
    if (copy) { navigator.clipboard && navigator.clipboard.writeText(copy.dataset.copy); toast('Código copiado: ' + copy.dataset.copy); return; }
    const plan = e.target.closest('[data-plan]'); if (plan) return openBuilder(plan.dataset.plan);
    const edit = e.target.closest('[data-edit]'); if (edit) return studentForm(edit.dataset.edit);
    const prev = e.target.closest('[data-preview]'); if (prev) return previewStudent(prev.dataset.preview);
  });

  // biblioteca
  $('#libFilters').addEventListener('click', e => {
    const f = e.target.closest('[data-filter]'); if (!f) return;
    libFilter = f.dataset.filter; renderLibFilters(); renderLib();
  });
  $('#libSearch').addEventListener('input', e => { libQuery = e.target.value; renderLib(); });
  $('#libGrid').addEventListener('click', e => {
    const c = e.target.closest('[data-ex]'); if (c) exerciseDetail(c.dataset.ex);
  });

  // vista previa (lo que ve el alumno)
  function previewStudent(id) {
    const a = STATE.alumnos.find(x => x.id === id); if (!a) return;
    const days = (a.plan || []).map((d, di) =>
      '<h3 style="margin:22px 0 12px;font-size:1.15rem">' + esc(d.nombre) + '</h3>' +
      '<div class="ex-list">' + (d.ejercicios || []).map((p, i) => exCard(p, i)).join('') + '</div>').join('');
    openModal(
      '<div class="modal-head"><h3>Ficha de ' + esc(a.nombre) + '</h3><button class="modal-x" data-close>✕</button></div>' +
      '<div class="modal-body"><p style="margin-bottom:6px">Así ve el alumno su rutina al entrar con el código <b class="text-accent" style="font-family:var(--num);letter-spacing:.1em">' + esc(a.codigo) + '</b>.</p>' +
      (days || '<p style="color:var(--muted)">Sin plan cargado.</p>') + '</div>', true);
  }

  // modal global (delegación)
  $('#modalBg').addEventListener('click', e => {
    if (e.target === $('#modalBg')) return closeModal();
    if (e.target.closest('[data-close]')) return closeModal();

    // eliminar alumno
    const del = e.target.closest('[data-del]');
    if (del) {
      if (confirm('¿Eliminar este alumno y su plan?')) {
        STATE.alumnos = STATE.alumnos.filter(x => x.id !== del.dataset.del);
        saveState(); closeModal(); renderProfe(); toast('Alumno eliminado');
      }
      return;
    }
    // detalle ejercicio (no en builder)
    // --- builder actions ---
    const a = currentAlumno();
    if (e.target.closest('[data-bday]')) { builder.day = +e.target.closest('[data-bday]').dataset.bday; builder.picking = false; return renderBuilder(); }
    if (e.target.closest('[data-baddday]')) {
      a.plan = a.plan || []; a.plan.push({ nombre: 'Día ' + (a.plan.length + 1), ejercicios: [] });
      builder.day = a.plan.length - 1; builder.picking = false; saveState(); renderBuilder(); return;
    }
    if (e.target.closest('[data-delday]')) {
      if (confirm('¿Borrar este día completo?')) { a.plan.splice(builder.day, 1); saveState(); renderBuilder(); renderStudents(); }
      return;
    }
    if (e.target.closest('[data-openpick]')) { builder.picking = true; pickQuery = ''; pickFilter = 'Todos'; return renderBuilder(); }
    if (e.target.closest('[data-backpick]')) { builder.picking = false; return renderBuilder(); }
    const delex = e.target.closest('[data-delex]');
    if (delex) { a.plan[builder.day].ejercicios.splice(+delex.dataset.delex, 1); saveState(); renderBuilder(); renderStudents(); return; }
    const pick = e.target.closest('[data-pick]');
    if (pick) {
      a.plan[builder.day].ejercicios.push({ exId: pick.dataset.pick, series: 3, reps: '10-12', peso: '—', descanso: '60s', nota: '' });
      saveState(); builder.picking = false; renderBuilder(); renderStudents(); toast('Ejercicio agregado'); return;
    }
    const pf = e.target.closest('[data-pfilter]');
    if (pf) { pickFilter = pf.dataset.pfilter; return renderBuilder(); }
  });

  // inputs dentro del builder (delegación de input/change)
  $('#modalBg').addEventListener('input', e => {
    const a = currentAlumno(); if (!a) return;
    if (e.target.id === 'pickSearch') { pickQuery = e.target.value; const b = $('#builderBody'); if (b) b.innerHTML = pickerView(); return; }
    if (e.target.id === 'dayNameIn') { a.plan[builder.day].nombre = e.target.value; saveState(); return; }
    const num = e.target.closest('[data-num]');
    if (num) {
      const i = +num.dataset.num, field = num.dataset.field;
      a.plan[builder.day].ejercicios[i][field] = e.target.value; saveState(); return;
    }
    const note = e.target.closest('[data-notex]');
    if (note) { a.plan[builder.day].ejercicios[+note.dataset.notex].nota = e.target.value; saveState(); return; }
  });
  // refrescar day pills/stud cards al cerrar builder
  const _close = closeModal;
  closeModal = function () { _close(); if (loadSession() && loadSession().role === 'profe') renderProfe(); };

  // esc para cerrar modal
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#modalBg').classList.contains('open')) closeModal(); });

  /* ---------- init ---------- */
  renderLanding();
  route();
})();
