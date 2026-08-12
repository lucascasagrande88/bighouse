/* ============================================================================
   Chimichurri · Real Estate — interacciones
   Cada módulo está aislado en su try/catch: si uno falla, el resto sigue.
   three.js se importa dinámicamente sólo al entrar al recorrido.
   ========================================================================== */
(function () {
  'use strict';
  var RE = window.RE || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isTouch = window.matchMedia && window.matchMedia('(hover: none)').matches;

  /* ── Analítica (sin proveedor externo: dataLayer + CustomEvent) ────────── */
  var fired = {};
  function track(name, props) {
    if (!name) return;
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push(Object.assign({ event: name }, props || {}));
      document.dispatchEvent(new CustomEvent('re:' + name, { detail: props || {} }));
      if (window.console && console.debug) console.debug('[analytics]', name, props || '');
    } catch (e) {}
  }
  function trackOnce(name, props) { if (fired[name]) return; fired[name] = 1; track(name, props); }

  /* ── WhatsApp ──────────────────────────────────────────────────────────── */
  function waLink(msg) {
    var w = RE.whatsapp || {};
    var text = encodeURIComponent(msg || (w.baseMessage || ''));
    return 'https://wa.me/' + (w.number || '') + (text ? '?text=' + text : '');
  }

  /* ── Utils ─────────────────────────────────────────────────────────────── */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function fmtPrice(p) {
    try { return p.moneda + ' ' + p.precio.toLocaleString('es-AR') + (p.per || ''); }
    catch (e) { return p.moneda + ' ' + p.precio + (p.per || ''); }
  }
  function fitCanvas(cv) {
    var r = cv.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: r.width, h: r.height };
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  /* ══ Escenas procedurales (SVG/CSS — NO son fotos de propiedades reales) ══ */
  function miniScene(p) {
    // Fondo de ficha de propiedad: degradé cálido + horizonte arquitectónico
    var s = 'linear-gradient(160deg,' + p.c1 + ',' + p.c2 + ')';
    var hint = (p.amb || 1) % 3;
    return '<div class="scene" style="background:' + s + '">' +
      '<svg viewBox="0 0 200 150" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;opacity:.5">' +
      '<rect x="20" y="' + (60 + hint * 8) + '" width="70" height="70" fill="rgba(255,255,255,.05)"/>' +
      '<rect x="100" y="' + (45 + hint * 6) + '" width="60" height="85" fill="rgba(255,255,255,.07)"/>' +
      '<line x1="0" y1="118" x2="200" y2="118" stroke="rgba(227,183,120,.35)" stroke-width="1"/>' +
      '<rect x="112" y="' + (58 + hint * 6) + '" width="16" height="20" fill="rgba(227,183,120,.25)"/>' +
      '</svg></div>';
  }
  function reelPoster(r) {
    return '<div class="scene" style="background:radial-gradient(120% 80% at 30% 20%,' + r.c1 + ',' + r.c2 + ')">' +
      '<svg viewBox="0 0 120 240" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%;opacity:.55">' +
      '<line x1="0" y1="170" x2="120" y2="150" stroke="rgba(227,183,120,.3)" stroke-width="1.2"/>' +
      '<rect x="16" y="60" width="40" height="110" fill="rgba(255,255,255,.05)"/>' +
      '<rect x="66" y="40" width="42" height="130" fill="rgba(255,255,255,.06)"/>' +
      '<circle cx="30" cy="30" r="14" fill="rgba(227,183,120,.18)"/>' +
      '</svg></div>';
  }
  function cinemaScene() {
    return '<div class="scene" style="background:linear-gradient(120deg,#221c14,#0b0907 60%)">' +
      '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">' +
      '<defs><linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(255,224,168,.5)"/><stop offset="1" stop-color="rgba(255,224,168,0)"/></linearGradient></defs>' +
      '<rect width="320" height="200" fill="rgba(0,0,0,.15)"/>' +
      '<polygon points="0,150 320,120 320,200 0,200" fill="rgba(120,96,64,.28)"/>' +
      '<rect x="188" y="34" width="96" height="96" fill="url(#win)"/>' +
      '<rect x="40" y="96" width="86" height="46" rx="6" fill="rgba(255,255,255,.06)"/>' +
      '<line x1="0" y1="150" x2="320" y2="120" stroke="rgba(227,183,120,.4)" stroke-width="1"/>' +
      '</svg></div>';
  }

  // Piezas reutilizables de la habitación (ilustración editorial, demo)
  function roomBase() {
    return '<defs>' +
      '<linearGradient id="rWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#efe7d8"/><stop offset="1" stop-color="#d9cfbe"/></linearGradient>' +
      '<linearGradient id="rFloor" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b79b78"/><stop offset="1" stop-color="#8f7355"/></linearGradient>' +
      '<linearGradient id="rWin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff4d9"/><stop offset="1" stop-color="#ffe6b0"/></linearGradient>' +
      '</defs>' +
      '<rect width="400" height="300" fill="url(#rWall)"/>' +
      '<polygon points="0,205 400,205 400,300 0,300" fill="url(#rFloor)"/>' +
      '<polygon points="0,205 400,205 330,300 70,300" fill="rgba(0,0,0,.05)"/>' +
      // window with warm light
      '<rect x="34" y="52" width="96" height="120" rx="2" fill="url(#rWin)" stroke="#c9bda6" stroke-width="3"/>' +
      '<line x1="82" y1="52" x2="82" y2="172" stroke="#c9bda6" stroke-width="3"/>' +
      '<line x1="34" y1="112" x2="130" y2="112" stroke="#c9bda6" stroke-width="3"/>' +
      // rug + sofa + plant (base furniture)
      '<ellipse cx="238" cy="250" rx="140" ry="30" fill="rgba(227,183,120,.22)"/>' +
      '<rect x="176" y="150" width="150" height="64" rx="12" fill="#3b3a3c"/>' +
      '<rect x="176" y="132" width="150" height="34" rx="12" fill="#48474a"/>' +
      '<rect x="188" y="150" width="58" height="26" rx="8" fill="#545356"/>' +
      '<rect x="256" y="150" width="58" height="26" rx="8" fill="#545356"/>' +
      '<rect x="342" y="120" width="10" height="96" fill="#5a4a38"/>' +
      '<path d="M347 120 q-26 -20 -34 6 q30 -6 34 -6 q4 -22 30 -10 q-24 8 -30 10Z" fill="#6f7d4e"/>';
  }
  function roomClutter() {
    return '<g class="clutter">' +
      '<rect x="120" y="238" width="34" height="30" rx="3" fill="#7a6a52" transform="rotate(-8 137 253)"/>' +
      '<rect x="150" y="250" width="26" height="22" rx="3" fill="#9a8a6e"/>' +
      '<path d="M300 150 q20 -10 34 6 q-14 20 -34 12Z" fill="#8c5b4b"/>' + // jacket on sofa
      '<circle cx="96" cy="262" r="9" fill="#6b6b6b"/>' +
      '<rect x="60" y="250" width="18" height="26" rx="2" fill="#57616b"/>' +
      '<rect x="214" y="196" width="40" height="8" rx="2" fill="#7d715a"/>' + // stuff on rug
      '</g>';
  }
  function roomFrame(privacy) {
    // "family photo" frame — con o sin difuminado de privacidad
    var face = '<circle cx="196" cy="86" r="10" fill="#caa27a"/><rect x="184" y="98" width="24" height="16" rx="6" fill="#6b7f9a"/>';
    var g = '<g><rect x="172" y="60" width="48" height="60" rx="2" fill="#efe7d8" stroke="#b7a888" stroke-width="3"/>' + face + '</g>';
    if (privacy) {
      g += '<g class="privacy-blur"><rect x="172" y="60" width="48" height="60" rx="2" fill="#d9cfbe"/>' +
        '<rect x="180" y="74" width="32" height="6" rx="3" fill="#c3b79e"/><rect x="180" y="88" width="24" height="6" rx="3" fill="#c3b79e"/>' +
        '<text x="196" y="112" text-anchor="middle" font-family="Inter" font-size="7" fill="#8b8781">privado</text></g>';
    }
    return g;
  }
  function roomNeutralArt() {
    return '<g><rect x="172" y="60" width="48" height="60" rx="2" fill="#e6ddcb" stroke="#c9bda6" stroke-width="3"/>' +
      '<circle cx="196" cy="82" r="9" fill="rgba(227,183,120,.5)"/><path d="M176 116 l16 -20 12 12 12 -16 v24Z" fill="rgba(120,96,64,.4)"/></g>';
  }
  function baScene(before) {
    var inner = roomBase();
    inner += before ? (roomClutter() + roomFrame(false)) : roomNeutralArt();
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">' + inner + '</svg>';
  }
  function declutterScene() {
    var inner = roomBase() + roomClutter() + roomFrame(true);
    return '<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" style="width:100%;height:100%">' + inner + '</svg>';
  }

  /* ═════════════════════════════════════════════════════════════════════
     INIT
     ═════════════════════════════════════════════════════════════════════ */
  ready(function () {
    safe(initChrome);
    safe(initReveal);
    safe(initHero);
    safe(initWeb);
    safe(initReels);
    safe(initToolkit);
    safe(initBeforeAfter);
    safe(initDeclutter);
    safe(initVideo);
    safe(init360);
    safe(initWalkthrough);
    safe(initSystemMap);
    safe(initWhatsApp);
    trackOnce('real_estate_view');
  });
  function safe(fn) { try { fn(); } catch (e) { if (window.console) console.warn('[re] módulo falló:', e); } }

  /* ── Nav, progreso, data-ev ────────────────────────────────────────────── */
  function initChrome() {
    var toggle = $('#navToggle'), menu = $('#navMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', function () { menu.classList.toggle('open'); });
      $$('#navMenu a').forEach(function (a) { a.addEventListener('click', function () { menu.classList.remove('open'); }); });
    }
    var bar = $('#reProgress');
    if (bar) {
      var onScroll = function () {
        var h = document.documentElement;
        var max = h.scrollHeight - h.clientHeight;
        bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-ev]');
      if (el) track(el.getAttribute('data-ev'));
    });
  }

  /* ── Reveal on scroll ──────────────────────────────────────────────────── */
  function initReveal() {
    var els = $$('.re-reveal');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      els.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ── Hero: escena arquitectónica sintética con parallax ───────────────── */
  function initHero() {
    var cv = $('#reHeroCanvas');
    if (!cv) return;
    var ctx, W, H, raf = 0, t = 0, visible = true;
    var px = 0, py = 0, tx = 0, ty = 0;

    function resize() { var f = fitCanvas(cv); ctx = f.ctx; W = f.w; H = f.h; }
    resize();
    window.addEventListener('resize', resize);

    if (!isTouch) {
      window.addEventListener('pointermove', function (e) {
        tx = (e.clientX / window.innerWidth - 0.5);
        ty = (e.clientY / window.innerHeight - 0.5);
      }, { passive: true });
    }

    function draw() {
      if (!ctx) return;
      px += (tx - px) * 0.05; py += (ty - py) * 0.05;
      ctx.clearRect(0, 0, W, H);
      // fondo cálido
      var g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#0c0b09'); g.addColorStop(0.55, '#0a0908'); g.addColorStop(1, '#060605');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // bloom champagne
      var bg = ctx.createRadialGradient(W * (0.82 + px * 0.05), H * 0.16, 0, W * 0.82, H * 0.16, Math.max(W, H) * 0.7);
      bg.addColorStop(0, 'rgba(227,183,120,0.16)'); bg.addColorStop(1, 'rgba(227,183,120,0)');
      ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

      var vpx = W * (0.62 + px * 0.06);
      var vpy = H * (0.42 + py * 0.05);
      // piso en perspectiva
      ctx.strokeStyle = 'rgba(227,183,120,0.12)'; ctx.lineWidth = 1;
      var i;
      for (i = -6; i <= 6; i++) {
        var fx = W * 0.5 + i * (W * 0.14);
        ctx.beginPath(); ctx.moveTo(vpx, vpy); ctx.lineTo(fx, H + 2); ctx.stroke();
      }
      for (i = 1; i <= 7; i++) {
        var yy = vpy + (H - vpy) * Math.pow(i / 7, 2.1);
        ctx.globalAlpha = 1 - i / 9;
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // paneles verticales (fachada / mullions) con profundidad
      var panels = [0.16, 0.30, 0.72, 0.86];
      for (i = 0; i < panels.length; i++) {
        var xx = W * panels[i] + px * (i < 2 ? -30 : 30);
        var depth = i < 2 ? i : (panels.length - 1 - i);
        var top = vpy * (0.35 - depth * 0.05);
        ctx.fillStyle = 'rgba(255,255,255,' + (0.02 + depth * 0.012) + ')';
        ctx.fillRect(xx, top, Math.max(2, W * 0.018), H - top);
        ctx.strokeStyle = 'rgba(227,183,120,' + (0.10 - depth * 0.02) + ')';
        ctx.beginPath(); ctx.moveTo(xx, top); ctx.lineTo(xx, H); ctx.stroke();
      }
      // línea de horizonte acentuada
      ctx.strokeStyle = 'rgba(227,183,120,0.35)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(0, vpy); ctx.lineTo(W, vpy); ctx.stroke();
    }

    if (reduceMotion) { draw(); return; }
    var io = new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible) loop(); }, { threshold: 0.02 });
    io.observe(cv);
    function loop() { if (!visible) { raf = 0; return; } t += 0.01; draw(); raf = requestAnimationFrame(loop); }
    loop();
  }

  /* ── Web/CRM demo ─────────────────────────────────────────────────────── */
  function initWeb() {
    var props = RE.properties || [];
    var grid = $('#reProps');
    if (!grid) return;
    var picks = [];

    // CRM chips
    var crmWrap = $('#reCrmChips');
    if (crmWrap) crmWrap.innerHTML = (RE.crm || []).map(function (c) { return '<span>' + c + '</span>'; }).join('');

    // Filtros
    var fOp = $('#fOp'), fTipo = $('#fTipo'), fAmb = $('#fAmb'), fPrecio = $('#fPrecio'), fPrecioOut = $('#fPrecioOut'), count = $('#reCount');
    function render() {
      var op = fOp && fOp.value, tipo = fTipo && fTipo.value, amb = fAmb && fAmb.value ? parseInt(fAmb.value, 10) : 0;
      var max = fPrecio ? parseInt(fPrecio.value, 10) : Infinity;
      if (fPrecioOut) fPrecioOut.textContent = 'USD ' + (fPrecio ? parseInt(fPrecio.value, 10).toLocaleString('es-AR') : '');
      var list = props.filter(function (p) {
        if (op && p.op !== op) return false;
        if (tipo && p.tipo !== tipo) return false;
        if (amb && p.amb < amb) return false;
        // el precio de alquiler (mensual) no se filtra por el tope de venta
        if (p.op === 'Venta' && p.precio > max) return false;
        return true;
      });
      if (count) count.innerHTML = '<b>' + list.length + '</b> propiedades';
      if (!list.length) { grid.innerHTML = '<div class="re-empty">No hay propiedades con esos filtros. Probá ampliar el rango.</div>'; return; }
      grid.innerHTML = list.map(cardHTML).join('');
      bindCards();
    }
    function cardHTML(p) {
      var picked = picks.indexOf(p.id) > -1;
      return '<article class="re-prop' + (picked ? ' picked' : '') + '" data-id="' + p.id + '">' +
        '<div class="re-prop-media">' + miniScene(p) +
        '<span class="re-prop-op">' + p.op + '</span>' +
        '<button class="re-cmp-toggle" data-cmp="' + p.id + '" aria-pressed="' + picked + '"><span class="bx"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="4 12 10 18 20 6"/></svg></span>Comparar</button>' +
        '</div>' +
        '<div class="re-prop-info"><h4>' + p.title + '</h4><div class="re-prop-hood">' + p.barrio + ' · ' + p.tipo + '</div>' +
        '<div class="re-prop-facts"><span><b>' + p.m2 + '</b> m²</span><span><b>' + p.amb + '</b> amb</span><span><b>' + p.banos + '</b> baño' + (p.banos > 1 ? 's' : '') + '</span></div>' +
        '<div class="re-prop-foot"><span class="re-prop-price">' + fmtPrice(p) + '</span>' +
        '<a class="re-prop-wa" href="' + waLink('Hola, me interesa ' + p.title + ' (' + p.barrio + ').') + '" target="_blank" rel="noopener" data-wa="1"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.7-.9-2-1s-.5-.1-.7.2-.7.9-.9 1.1-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.5.3-.5c0-.2 0-.4-.1-.5L9 6.8c-.2-.6-.5-.5-.7-.5H7.8c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3 2.1 3.2 5 4.5c1.9.8 2.6.9 3.5.7.6-.1 1.7-.7 2-1.4s.3-1.3.2-1.4z"/></svg>Consultar</a>' +
        '</div></div></article>';
    }
    function bindCards() {
      $$('.re-cmp-toggle', grid).forEach(function (btn) {
        btn.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          var id = btn.getAttribute('data-cmp');
          togglePick(id);
        });
      });
      $$('[data-wa]', grid).forEach(function (a) {
        a.addEventListener('click', function () { trackOnce('web_demo_interaction'); track('whatsapp_real_estate', { where: 'card' }); });
      });
    }
    function togglePick(id) {
      trackOnce('web_demo_interaction');
      var i = picks.indexOf(id);
      if (i > -1) picks.splice(i, 1);
      else { if (picks.length >= 2) picks.shift(); picks.push(id); }
      syncPicks();
    }
    function syncPicks() {
      $$('.re-prop', grid).forEach(function (c) {
        var on = picks.indexOf(c.getAttribute('data-id')) > -1;
        c.classList.toggle('picked', on);
        var b = $('.re-cmp-toggle', c); if (b) b.setAttribute('aria-pressed', on);
      });
      var bar = $('#reCmpBar'), cc = $('#reCmpCount'), chips = $('#reCmpChips'), go = $('#reCmpGo');
      if (bar) bar.hidden = picks.length === 0;
      if (cc) cc.textContent = picks.length;
      if (chips) chips.innerHTML = picks.map(function (id) { var p = byId(id); return '<span class="chip">' + (p ? p.title : id) + '</span>'; }).join('');
      if (go) go.disabled = picks.length !== 2;
    }
    function byId(id) { for (var i = 0; i < props.length; i++) if (props[i].id === id) return props[i]; return null; }

    [fOp, fTipo, fAmb].forEach(function (el) { if (el) el.addEventListener('change', function () { trackOnce('web_demo_interaction'); render(); }); });
    if (fPrecio) fPrecio.addEventListener('input', function () { trackOnce('web_demo_interaction'); render(); });
    var clear = $('#reCmpClear'); if (clear) clear.addEventListener('click', function () { picks = []; syncPicks(); });
    var go = $('#reCmpGo'); if (go) go.addEventListener('click', openCompare);

    function openCompare() {
      if (picks.length !== 2) return;
      var a = byId(picks[0]), b = byId(picks[1]);
      var modal = $('#reCmpModal'), wrap = $('#reCmpTableWrap');
      if (!a || !b || !modal || !wrap) return;
      var maxM2 = Math.max(a.m2, b.m2);
      function row(label, va, vb, winA, winB, bar) {
        var barA = bar ? '<div class="bar" style="width:' + (a.m2 / maxM2 * 100) + '%"></div>' : '';
        var barB = bar ? '<div class="bar" style="width:' + (b.m2 / maxM2 * 100) + '%"></div>' : '';
        return '<tr><th>' + label + '</th>' +
          '<td class="' + (winA ? 're-cmp-win' : '') + '">' + va + barA + '</td>' +
          '<td class="' + (winB ? 're-cmp-win' : '') + '">' + vb + barB + '</td></tr>';
      }
      var priceWinA = a.op === 'Venta' && b.op === 'Venta' && a.precio < b.precio;
      var priceWinB = a.op === 'Venta' && b.op === 'Venta' && b.precio < a.precio;
      wrap.innerHTML = '<table class="re-cmp-table"><thead><tr><th>Propiedad</th><th>' + a.title + '</th><th>' + b.title + '</th></tr></thead><tbody>' +
        row('Barrio', a.barrio, b.barrio) +
        row('Operación', a.op, b.op) +
        row('m²', a.m2 + ' m²', b.m2 + ' m²', a.m2 > b.m2, b.m2 > a.m2, true) +
        row('Ambientes', a.amb, b.amb, a.amb > b.amb, b.amb > a.amb) +
        row('Baños', a.banos, b.banos, a.banos > b.banos, b.banos > a.banos) +
        row('Cochera', a.coch ? 'Sí' : 'No', b.coch ? 'Sí' : 'No') +
        row('Precio', fmtPrice(a), fmtPrice(b), priceWinA, priceWinB) +
        '</tbody></table>';
      modal.classList.add('open');
      track('property_compare', { a: a.id, b: b.id });
    }
    var mClose = $('#reCmpClose'), mModal = $('#reCmpModal');
    if (mClose) mClose.addEventListener('click', function () { mModal.classList.remove('open'); });
    if (mModal) mModal.addEventListener('click', function (e) { if (e.target === mModal) mModal.classList.remove('open'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && mModal) mModal.classList.remove('open'); });

    render();
    initChat();
  }

  function initChat() {
    var box = $('#reChat'); if (!box) return;
    var script = [
      { who: 'bot', t: 'Hola 👋 ¿Qué estás buscando?' },
      { who: 'user', t: 'Un 2 ambientes en Palermo hasta USD 200.000' },
      { who: 'typing' },
      { who: 'bot', t: 'Tengo el Loft Palermo: 62 m², 2 amb, USD 189.000. ¿Coordinamos una visita?' },
      { who: 'user', t: 'Dale, coordinemos' },
      { who: 'bot', t: 'Genial, te derivo con un asesor por WhatsApp ahora.' }
    ];
    function run() {
      box.innerHTML = ''; var i = 0;
      function step() {
        if (i >= script.length) return;
        var m = script[i++];
        if (m.who === 'typing') {
          var t = document.createElement('div'); t.className = 're-typing'; t.innerHTML = '<i></i><i></i><i></i>';
          box.appendChild(t);
          setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); step(); }, reduceMotion ? 250 : 1100);
        } else {
          var d = document.createElement('div'); d.className = 're-msg ' + m.who; d.textContent = m.t;
          box.appendChild(d);
          requestAnimationFrame(function () { d.classList.add('show'); });
          setTimeout(step, reduceMotion ? 300 : 900);
        }
      }
      step();
    }
    if (!('IntersectionObserver' in window)) { run(); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) { run(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(box);
  }

  /* ── Reels ─────────────────────────────────────────────────────────────── */
  function initReels() {
    var rail = $('#reReels'); if (!rail) return;
    var reels = RE.reels || [];
    rail.innerHTML = reels.map(function (r, i) {
      return '<div class="re-phone" role="listitem" tabindex="0" data-i="' + i + '" aria-label="Reel: ' + r.title + '">' +
        '<div class="re-phone-screen">' + reelPoster(r) +
        '<div class="re-phone-grad"></div><div class="re-phone-notch"></div>' +
        '<span class="re-phone-tag">' + r.tag + '</span>' +
        '<div class="re-phone-play"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg></div>' +
        '<div class="re-phone-ui"><i></i><i></i><i></i></div>' +
        '<div class="re-phone-title">' + r.title + '</div>' +
        '</div></div>';
    }).join('');

    var modal = $('#reReelModal'), stage = $('#reReelStage');
    var cur = 0;
    function open(i) {
      cur = i; renderReel(); modal.classList.add('open'); document.body.style.overflow = 'hidden';
      track('reel_play', { id: (reels[i] || {}).id });
    }
    function close() { modal.classList.remove('open'); document.body.style.overflow = ''; clearVideos(); }
    function clearVideos() { $$('video', stage).forEach(function (v) { try { v.pause(); } catch (e) {} }); }
    function renderReel() {
      var r = reels[cur]; if (!r) return;
      clearVideos();
      // limpiar sólo el contenido (dejar los botones nav/close)
      $$('.re-reel-fill', stage).forEach(function (n) { n.remove(); });
      var host = document.createElement('div'); host.className = 're-reel-fill'; host.style.cssText = 'position:absolute;inset:0';
      if (r.src) {
        host.innerHTML = '<video src="' + r.src + '" playsinline controls autoplay style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover"></video>';
      } else {
        host.innerHTML = reelPoster(r) + '<div class="re-phone-grad"></div>' +
          '<span class="re-phone-tag" style="top:16px;left:14px">' + r.tag + '</span>' +
          '<div class="re-reel-demo"><span class="badge">Reel de demostración</span><p>' + r.title + '</p>' +
          '<p style="font-size:.78rem;color:#a9a6a0">Acá se reproduce el reel final.</p></div>';
      }
      stage.appendChild(host);
    }
    function move(d) { cur = (cur + d + reels.length) % reels.length; renderReel(); track('reel_play', { id: (reels[cur] || {}).id }); }

    rail.addEventListener('click', function (e) { var ph = e.target.closest('.re-phone'); if (ph) open(parseInt(ph.getAttribute('data-i'), 10)); });
    rail.addEventListener('keydown', function (e) { var ph = e.target.closest('.re-phone'); if (ph && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); open(parseInt(ph.getAttribute('data-i'), 10)); } });
    var c = $('#reReelClose'), pv = $('#reReelPrev'), nx = $('#reReelNext');
    if (c) c.addEventListener('click', close);
    if (pv) pv.addEventListener('click', function () { move(-1); });
    if (nx) nx.addEventListener('click', function () { move(1); });
    if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
    document.addEventListener('keydown', function (e) {
      if (!modal || !modal.classList.contains('open')) return;
      if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') move(-1); else if (e.key === 'ArrowRight') move(1);
    });
  }

  /* ── Property Media: toolkit ──────────────────────────────────────────── */
  function initToolkit() {
    var wrap = $('#reToolkit'); if (!wrap) return;
    var items = RE.toolkit || [];
    wrap.innerHTML = items.map(function (it, i) {
      return '<div class="re-tool"><div class="n">' + ('0' + (i + 1)).slice(-2) + '</div>' +
        '<h4>' + it.k + '</h4><p>' + it.d + '</p></div>';
    }).join('');
  }

  /* ── Antes / Después ───────────────────────────────────────────────────── */
  function initBeforeAfter() {
    var ba = $('#reBA'); if (!ba) return;
    var before = $('#reBAbefore'), after = $('#reBAafter');
    if (after) after.innerHTML = '<div class="re-room">' + baScene(false) + '</div>';
    if (before) before.innerHTML = '<div class="re-room">' + baScene(true) + '</div>';
    var pos = 50, dragging = false;
    function set(p, ev) {
      pos = clamp(p, 0, 100);
      ba.style.setProperty('--pos', pos + '%');
      ba.setAttribute('aria-valuenow', Math.round(pos));
      if (ev) trackOnce('before_after_interaction');
    }
    function fromX(clientX) { var r = ba.getBoundingClientRect(); return ((clientX - r.left) / r.width) * 100; }
    ba.addEventListener('pointerdown', function (e) { dragging = true; ba.setPointerCapture(e.pointerId); set(fromX(e.clientX), true); });
    ba.addEventListener('pointermove', function (e) { if (dragging) set(fromX(e.clientX), true); });
    ba.addEventListener('pointerup', function () { dragging = false; });
    ba.addEventListener('pointercancel', function () { dragging = false; });
    ba.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { set(pos - 4, true); e.preventDefault(); }
      else if (e.key === 'ArrowRight') { set(pos + 4, true); e.preventDefault(); }
      else if (e.key === 'Home') { set(0, true); e.preventDefault(); }
      else if (e.key === 'End') { set(100, true); e.preventDefault(); }
    });
    set(50, false);
  }

  /* ── Declutter / Privacidad ────────────────────────────────────────────── */
  function initDeclutter() {
    var dc = $('#reDeclutter'); if (!dc) return;
    dc.innerHTML = '<div class="re-room">' + declutterScene() + '</div>';
    $$('[data-declutter]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('[data-declutter]').forEach(function (b) { b.classList.remove('on'); });
        btn.classList.add('on');
        dc.classList.toggle('clean', btn.getAttribute('data-declutter') === 'clean');
        trackOnce('before_after_interaction');
      });
    });
  }

  /* ── Video tour ────────────────────────────────────────────────────────── */
  function initVideo() {
    var box = $('#reVideo'); if (!box) return;
    var src = RE.media && RE.media.video && RE.media.video.src;
    // escena de portada
    var poster = $('#reVideoPoster');
    if (poster) poster.insertAdjacentHTML('afterbegin', cinemaScene());
    var ctrl = $('#reVideoCtrl');
    var playBtn = $('#reVideoPlay');

    if (!src) {
      if (ctrl) ctrl.style.display = 'none';
      if (playBtn) playBtn.addEventListener('click', function () {
        box.classList.add('playing', 'demo-on'); trackOnce('virtual_tour_play');
      });
      return;
    }
    // Video real
    var video = document.createElement('video');
    video.src = src; video.playsInline = true; video.preload = 'none';
    if (RE.media.video.poster) video.poster = RE.media.video.poster;
    video.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:1';
    box.insertBefore(video, box.firstChild);
    var toggle = $('#reVideoToggle'), fill = $('#reVideoFill'), time = $('#reVideoTime'), track_ = $('#reVideoTrack'), mute = $('#reVideoMute'), fs = $('#reVideoFs');
    function fmt(s) { s = Math.max(0, s | 0); return (s / 60 | 0) + ':' + ('0' + (s % 60)).slice(-2); }
    function playPause() { if (video.paused) { video.play(); trackOnce('virtual_tour_play'); } else video.pause(); }
    if (playBtn) playBtn.addEventListener('click', playPause);
    if (toggle) toggle.addEventListener('click', playPause);
    video.addEventListener('play', function () { box.classList.add('playing'); });
    video.addEventListener('pause', function () { });
    video.addEventListener('timeupdate', function () {
      if (video.duration) { if (fill) fill.style.width = (video.currentTime / video.duration * 100) + '%'; if (time) time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration); }
    });
    if (track_) track_.addEventListener('click', function (e) { var r = track_.getBoundingClientRect(); if (video.duration) video.currentTime = ((e.clientX - r.left) / r.width) * video.duration; });
    if (mute) mute.addEventListener('click', function () { video.muted = !video.muted; mute.style.opacity = video.muted ? 0.5 : 1; });
    if (fs) fs.addEventListener('click', function () { reqFull(box); });
  }

  function reqFull(el) {
    try { if (el.requestFullscreen) el.requestFullscreen(); else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen(); } catch (e) {}
  }

  /* ── 360 panorama sintético ───────────────────────────────────────────── */
  function init360() {
    var box = $('#re360'), cv = $('#re360Canvas'); if (!box || !cv) return;
    var OW = 2048, OH = 1024;
    var off = document.createElement('canvas'); off.width = OW; off.height = OH;
    paintPano(off.getContext('2d'), OW, OH);

    var yaw = 0, pitchOff = 0, vw, vh, dpr, drift = !reduceMotion, touched = false;
    var ctx = cv.getContext('2d');
    function resize() { var r = cv.getBoundingClientRect(); dpr = Math.min(window.devicePixelRatio || 1, 2); cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); vw = r.width; vh = r.height; render(); }
    function render() {
      if (!vw) return;
      var fov = 100 / 360; var sw = OW * fov; var sh = sw * (vh / vw); if (sh > OH) { sh = OH; sw = sh * (vw / vh); }
      var maxOff = (OH - sh) / 2; var sy = maxOff + clamp(pitchOff, -1, 1) * maxOff;
      var sx = ((yaw % OW) + OW) % OW;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, vw, vh);
      if (sx + sw <= OW) { ctx.drawImage(off, sx, sy, sw, sh, 0, 0, vw, vh); }
      else {
        var w1 = OW - sx; var p1 = (w1 / sw) * vw;
        ctx.drawImage(off, sx, sy, w1, sh, 0, 0, p1, vh);
        ctx.drawImage(off, 0, sy, sw - w1, sh, p1, 0, vw - p1, vh);
      }
    }
    resize(); window.addEventListener('resize', resize);

    var dragging = false, lx = 0, ly = 0;
    cv.addEventListener('pointerdown', function (e) { dragging = true; drift = false; touched = true; box.classList.add('touched', 'dragging'); lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); trackOnce('360_interaction'); });
    cv.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      yaw -= (e.clientX - lx) * (OW / 900); pitchOff -= (e.clientY - ly) * 0.004;
      pitchOff = clamp(pitchOff, -1, 1); lx = e.clientX; ly = e.clientY; render();
    });
    cv.addEventListener('pointerup', function () { dragging = false; box.classList.remove('dragging'); });
    cv.addEventListener('pointercancel', function () { dragging = false; box.classList.remove('dragging'); });
    var full = $('#re360Full'); if (full) full.addEventListener('click', function () { reqFull(box); setTimeout(resize, 120); });

    // drift lento hasta la primera interacción
    var visible = false;
    if ('IntersectionObserver' in window) { new IntersectionObserver(function (en) { visible = en[0].isIntersecting; if (visible && drift) loop(); }, { threshold: 0.2 }).observe(box); }
    else { visible = true; }
    var raf = 0;
    function loop() { if (!visible || !drift) { raf = 0; return; } yaw += 0.25; render(); raf = requestAnimationFrame(loop); }
    if (drift && visible) loop();
  }
  function paintPano(c, W, H) {
    // Cielo/techo → pared → piso (cilíndrico), con ventanas cálidas repetidas
    var g = c.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#1a1f27'); g.addColorStop(0.42, '#20232a'); g.addColorStop(0.52, '#2b2620'); g.addColorStop(1, '#12100c');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    // horizonte
    c.strokeStyle = 'rgba(227,183,120,0.25)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, H * 0.55); c.lineTo(W, H * 0.55); c.stroke();
    // ventanas / vanos cálidos repetidos alrededor
    var n = 8, ww = W / n;
    for (var i = 0; i < n; i++) {
      var x = i * ww + ww * 0.28;
      var lit = i % 2 === 0;
      var wg = c.createLinearGradient(0, H * 0.2, 0, H * 0.52);
      if (lit) { wg.addColorStop(0, 'rgba(255,236,196,0.6)'); wg.addColorStop(1, 'rgba(255,214,150,0.05)'); }
      else { wg.addColorStop(0, 'rgba(255,255,255,0.06)'); wg.addColorStop(1, 'rgba(255,255,255,0)'); }
      c.fillStyle = wg; c.fillRect(x, H * 0.2, ww * 0.44, H * 0.3);
      c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 4; c.strokeRect(x, H * 0.2, ww * 0.44, H * 0.3);
      c.beginPath(); c.moveTo(x + ww * 0.22, H * 0.2); c.lineTo(x + ww * 0.22, H * 0.5); c.stroke();
      // reflejo en piso
      c.fillStyle = lit ? 'rgba(227,183,120,0.06)' : 'rgba(255,255,255,0.02)';
      c.fillRect(x, H * 0.6, ww * 0.44, H * 0.1);
    }
    // vetas de piso
    c.strokeStyle = 'rgba(0,0,0,0.18)'; c.lineWidth = 1;
    for (var y = H * 0.6; y < H; y += 26) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
  }

  /* ══ Recorrido interactivo (crown jewel) — three.js lazy ═══════════════ */
  function initWalkthrough() {
    var stage = $('#reStage'); if (!stage) return;
    var plan = $('#rePlan'), loader = $('#reLoader'), hud = $('#reHud'), joy = $('#reJoy'), fb = $('#reFallback');
    var enter = $('#reEnter'), exit = $('#reExit');
    var wk = null; // instancia activa

    function showFallback() {
      if (plan) plan.classList.add('hide');
      if (loader) loader.classList.remove('on');
      if (fb) fb.classList.add('on');
    }
    function hasWebGL() {
      try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
      catch (e) { return false; }
    }

    if (enter) enter.addEventListener('click', function () {
      track('walkthrough_start');
      if (!hasWebGL()) { showFallback(); return; }
      if (plan) plan.classList.add('hide');
      if (loader) loader.classList.add('on');
      import('three').then(function (THREE) {
        try { wk = buildWalkthrough(THREE, stage, hud, joy); }
        catch (e) { if (window.console) console.warn('[re] walkthrough build error', e); showFallback(); return; }
        if (loader) loader.classList.remove('on');
        stage.classList.add('live');
        document.body.classList.add('re-hide-fab');
      }).catch(function (e) {
        if (window.console) console.warn('[re] three load failed', e);
        showFallback();
      });
    });

    if (exit) exit.addEventListener('click', function () {
      if (wk) { wk.dispose(); wk = null; }
      stage.classList.remove('live');
      document.body.classList.remove('re-hide-fab');
      if (plan) plan.classList.remove('hide');
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && wk) { if (exit) exit.click(); }
    });
  }

  function buildWalkthrough(THREE, stage, hud, joy) {
    var W = stage.clientWidth, H = stage.clientHeight;
    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    if ('outputColorSpace' in renderer) renderer.outputColorSpace = THREE.SRGBColorSpace;
    if ('toneMapping' in renderer) { renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; }
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:1';
    stage.insertBefore(renderer.domElement, stage.firstChild);

    var scene = new THREE.Scene();
    scene.background = new THREE.Color('#141210');

    var camera = new THREE.PerspectiveCamera(72, W / H, 0.05, 100);
    camera.rotation.order = 'YXZ';

    // Materiales
    var matWall = new THREE.MeshStandardMaterial({ color: '#efe7d8', roughness: 0.95, metalness: 0 });
    var matFloor = new THREE.MeshStandardMaterial({ color: '#8a6f52', roughness: 0.8, metalness: 0 });
    var matCeil = new THREE.MeshStandardMaterial({ color: '#f3ede2', roughness: 1, metalness: 0 });

    var EW = 9, ED = 6, HGT = 2.6, T = 0.14;
    // Piso + techo
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(EW, ED), matFloor);
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    var ceil = new THREE.Mesh(new THREE.PlaneGeometry(EW, ED), matCeil);
    ceil.rotation.x = Math.PI / 2; ceil.position.y = HGT; scene.add(ceil);

    var walls = []; // AABB de colisión {x1,x2,z1,z2}
    function addWall(cx, cz, w, d, mat) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, HGT, d), mat || matWall);
      m.position.set(cx, HGT / 2, cz); scene.add(m);
      walls.push({ x1: cx - w / 2, x2: cx + w / 2, z1: cz - d / 2, z2: cz + d / 2 });
      return m;
    }
    // Exterior
    addWall(0, -ED / 2, EW, T);          // norte (con ventana visual)
    addWall(0, ED / 2, EW, T);           // sur
    addWall(-EW / 2, 0, T, ED);          // oeste
    addWall(EW / 2, 0, T, ED);           // este
    // Interior: vertical en x=0.8 con vano z[0.2,1.4]
    addWall(0.8, (-ED / 2 + 0.2) / 2 - 0.0, T, (0.2 - (-ED / 2)));      // v-top: z -3..0.2
    addWall(0.8, (1.4 + ED / 2) / 2, T, (ED / 2 - 1.4));               // v-bottom: z 1.4..3
    // Interior: horizontal en z=0 lado derecho con vano x[2.4,3.6]
    addWall((0.8 + 2.4) / 2, 0, (2.4 - 0.8), T);                        // h-left: x0.8..2.4
    addWall((3.6 + EW / 2) / 2, 0, (EW / 2 - 3.6), T);                  // h-right: x3.6..4.5

    // Ventana (panel luminoso en pared norte, lado living)
    var winMat = new THREE.MeshBasicMaterial({ color: '#ffe9be' });
    var win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.5), winMat);
    win.position.set(-2.2, 1.35, -ED / 2 + T / 2 + 0.01); scene.add(win);
    var frame = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.7), new THREE.MeshStandardMaterial({ color: '#cabfa8', roughness: 1 }));
    frame.position.set(-2.2, 1.35, -ED / 2 + T / 2); scene.add(frame);

    // Muebles (algunos con colisión)
    function box(cx, cy, cz, w, h, d, color, collide) {
      var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshStandardMaterial({ color: color, roughness: 0.85 }));
      m.position.set(cx, cy, cz); scene.add(m);
      if (collide) walls.push({ x1: cx - w / 2, x2: cx + w / 2, z1: cz - d / 2, z2: cz + d / 2 });
      return m;
    }
    // Living (izquierda)
    box(-3.2, 0.35, 1.4, 1.9, 0.7, 0.9, '#3b3a3c', true);   // sofá
    box(-2.0, 0.22, 1.4, 0.9, 0.44, 0.5, '#5a4a38', true);  // mesa baja
    box(-3.9, 0.02, 1.4, 2.2, 0.04, 1.4, '#c8a06a', false); // alfombra (champagne)
    box(-3.9, 1.1, -0.2, 0.06, 0.9, 1.2, '#e6ddcb', false); // cuadro pared oeste
    // Cocina (arriba derecha z<0)
    box(3.6, 0.45, -0.55, 2.0, 0.9, 0.6, '#2c2c2e', true);  // isla/mesada
    box(3.6, 0.92, -0.55, 2.0, 0.05, 0.6, '#c8a06a', false);// tapa champagne
    // Dormitorio (abajo derecha z>0)
    box(3.4, 0.3, 2.0, 2.2, 0.5, 1.6, '#d9d2c6', true);     // cama
    box(3.4, 0.55, 2.75, 2.2, 0.1, 0.2, '#efe7d8', false);  // respaldo

    // Luces
    scene.add(new THREE.HemisphereLight('#fff3df', '#3a352c', 0.75));
    scene.add(new THREE.AmbientLight('#ffffff', 0.28));
    var sun = new THREE.DirectionalLight('#ffedcf', 0.9);
    sun.position.set(-3, 3.2, -3.5); scene.add(sun);
    var warm = new THREE.PointLight('#ffd9a0', 0.5, 8); warm.position.set(-2.2, 2.1, -1.5); scene.add(warm);

    // Estado jugador (punto de partida despejado en el living, mirando a la ventana)
    var pos = { x: -1.0, z: -1.2 };
    var yaw = 0.5, pitch = -0.02;
    var vx = 0, vz = 0;
    var R = 0.32, SPEED = 2.5;
    camera.position.set(pos.x, 1.62, pos.z);

    var keys = {};
    function isMoveKey(k) { return ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) > -1; }
    function onKeyDown(e) { var k = e.key.toLowerCase(); if (isMoveKey(k) || k === ' ') { keys[k] = 1; if (isMoveKey(k)) e.preventDefault(); markMoved(); } }
    function onKeyUp(e) { keys[e.key.toLowerCase()] = 0; }
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mirar (drag sobre canvas)
    var lookId = null, lastX = 0, lastY = 0;
    var cv = renderer.domElement;
    cv.addEventListener('pointerdown', function (e) { if (lookId !== null) return; lookId = e.pointerId; lastX = e.clientX; lastY = e.clientY; try { cv.setPointerCapture(e.pointerId); } catch (er) {} });
    cv.addEventListener('pointermove', function (e) {
      if (e.pointerId !== lookId) return;
      yaw -= (e.clientX - lastX) * 0.0032; pitch -= (e.clientY - lastY) * 0.0032;
      pitch = clamp(pitch, -0.55, 0.55); lastX = e.clientX; lastY = e.clientY;
    });
    function endLook(e) { if (e.pointerId === lookId) lookId = null; }
    cv.addEventListener('pointerup', endLook);
    cv.addEventListener('pointercancel', endLook);

    // Joystick
    var joyVec = { x: 0, y: 0 }, joyId = null, joyThumb = $('#reJoyThumb'), maxR = 44;
    var help = $('#reHelp');
    var moved = false;
    function markMoved() { if (moved) return; moved = true; if (help) help.classList.add('gone'); if (joy) joy.classList.add('fade'); }
    if (joy) {
      joy.addEventListener('pointerdown', function (e) {
        e.preventDefault(); e.stopPropagation(); joyId = e.pointerId; try { joy.setPointerCapture(e.pointerId); } catch (er) {} joyMove(e); markMoved();
      });
      joy.addEventListener('pointermove', function (e) { if (e.pointerId === joyId) joyMove(e); });
      var jend = function (e) {
        if (e.pointerId !== joyId) return; joyId = null; joyVec.x = 0; joyVec.y = 0;
        if (joyThumb) joyThumb.style.transform = 'translate(0,0)';
      };
      joy.addEventListener('pointerup', jend); joy.addEventListener('pointercancel', jend);
    }
    function joyMove(e) {
      var r = joy.getBoundingClientRect(); var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var dx = e.clientX - cx, dy = e.clientY - cy; var d = Math.hypot(dx, dy);
      if (d > maxR) { dx = dx / d * maxR; dy = dy / d * maxR; }
      if (joyThumb) joyThumb.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      joyVec.x = dx / maxR; joyVec.y = dy / maxR;
    }

    function blocked(x, z) {
      for (var i = 0; i < walls.length; i++) { var w = walls[i]; if (x > w.x1 - R && x < w.x2 + R && z > w.z1 - R && z < w.z2 + R) return true; }
      return false;
    }

    function resize() {
      var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
      renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', resize);

    var raf = 0, last = performance.now(), running = true, started = Date.now();
    function frame(now) {
      if (!running) return;
      var dt = Math.min(0.05, (now - last) / 1000); last = now;
      // input
      var f = 0, s = 0;
      if (keys['w'] || keys['arrowup']) f += 1;
      if (keys['s'] || keys['arrowdown']) f -= 1;
      if (keys['a'] || keys['arrowleft']) s -= 1;
      if (keys['d'] || keys['arrowright']) s += 1;
      f += -joyVec.y; s += joyVec.x;
      f = clamp(f, -1, 1); s = clamp(s, -1, 1);
      if (f || s) markMoved();
      // dirección mundo
      var fwdX = -Math.sin(yaw), fwdZ = -Math.cos(yaw);
      var rgtX = Math.cos(yaw), rgtZ = -Math.sin(yaw);
      var tvx = (fwdX * f + rgtX * s) * SPEED;
      var tvz = (fwdZ * f + rgtZ * s) * SPEED;
      var kk = Math.min(1, dt * 9);
      vx += (tvx - vx) * kk; vz += (tvz - vz) * kk;
      var nx = pos.x + vx * dt; if (!blocked(nx, pos.z)) pos.x = nx; else vx = 0;
      var nz = pos.z + vz * dt; if (!blocked(pos.x, nz)) pos.z = nz; else vz = 0;
      camera.position.x = pos.x; camera.position.z = pos.z; camera.position.y = 1.62;
      camera.rotation.y = yaw; camera.rotation.x = pitch;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      dispose: function () {
        running = false; cancelAnimationFrame(raf);
        window.removeEventListener('keydown', onKeyDown); window.removeEventListener('keyup', onKeyUp);
        window.removeEventListener('resize', resize);
        track('walkthrough_duration', { seconds: Math.round((Date.now() - started) / 1000) });
        try {
          scene.traverse(function (o) { if (o.geometry) o.geometry.dispose(); if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach(function (m) { m.dispose && m.dispose(); }); } });
          renderer.dispose(); if (renderer.forceContextLoss) renderer.forceContextLoss();
          if (renderer.domElement && renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
        } catch (e) {}
        if (joyThumb) joyThumb.style.transform = 'translate(0,0)';
        if (help) help.classList.remove('gone');
        if (joy) joy.classList.remove('fade');
      }
    };
  }

  /* ── System map: encender nodos al entrar ─────────────────────────────── */
  function initSystemMap() {
    var flow = $('#reFlow'); if (!flow) return;
    var nodes = $$('.re-node', flow);
    if (reduceMotion || !('IntersectionObserver' in window)) { nodes.forEach(function (n) { n.classList.add('lit'); }); return; }
    var io = new IntersectionObserver(function (en) {
      if (en[0].isIntersecting) {
        nodes.forEach(function (n, i) { setTimeout(function () { n.classList.add('lit'); }, i * 260); });
        io.disconnect();
      }
    }, { threshold: 0.3 });
    io.observe(flow);
  }

  /* ── WhatsApp links ────────────────────────────────────────────────────── */
  function initWhatsApp() {
    var href = waLink();
    ['#reWaCta', '#reWaFooter', '#reWaFab'].forEach(function (sel) {
      var el = $(sel); if (el) el.href = href;
    });
  }

})();
