/* ============================================================
   DONATA · JS
   - Cablea enlaces (WhatsApp con mensajes precargados, tel:, Maps)
     desde /data/restaurant.js
   - Renderiza contenido repetible (menú, destacados, galería,
     experiencias, reseñas) desde /data/*.js
   - Interacciones: preloader, nav, menú mobile, carrusel,
     tabs de menú, lightbox, revelados de scroll, partículas de
     fuego, barra de acción mobile, analítica.
   Todo respeta prefers-reduced-motion.
   ============================================================ */
(function () {
  'use strict';

  var D = window.DONATA_DATA || {};
  var MENU = window.DONATA_MENU || { categories: [] };
  var GALLERY = window.DONATA_GALLERY || { items: [], featured: [] };
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---- Helpers ------------------------------------------------
  function q(s, c) { return (c || document).querySelector(s); }
  function qa(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function primaryPhone() { return (D.phones && D.phones[D.primaryPhoneIndex || 0]) || { tel: '', wa: '' }; }
  function waLink(kind) {
    var msg = (D.whatsappMessages && D.whatsappMessages[kind]) || (D.whatsappMessages && D.whatsappMessages.general) || '';
    return 'https://wa.me/' + primaryPhone().wa + '?text=' + encodeURIComponent(msg);
  }

  // Analytics: empuja al dataLayer (GTM/GA4-ready) sin romper si no existe.
  window.dataLayer = window.dataLayer || [];
  function track(event, detail) {
    try { window.dataLayer.push(Object.assign({ event: 'donata_' + event }, detail || {})); } catch (e) {}
  }

  // SVG icons
  var ICON = {
    pin: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
    wa: '<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>',
    ig: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>',
    clock: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    flame: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 4 4 5 4 9a4 4 0 0 1-8 0c0-1 .5-2 1-2.5C9 10 9 8 12 2Z"/><path d="M12 22a6 6 0 0 0 6-6c0-2-1-3.5-2-5 .2 3-2 4-2 4 .5-3-2-5-2-5 0 5-3 4-3 7a3 3 0 0 0 3 5Z" opacity=".5"/></svg>',
    play: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    arrow: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  // Placeholder de foto: slot editorial claramente identificado.
  function photoSlot(label, tag, src, alt) {
    if (src) {
      return '<img src="' + src + '" alt="' + (alt || label) + '" loading="lazy">';
    }
    return '<div class="photo-slot">' +
      '<span class="ps-ico">' + ICON.flame + '</span>' +
      '<span class="ps-label">' + label + '</span>' +
      '<span class="ps-tag">' + (tag || 'Foto real de Donata') + '</span>' +
      '</div>';
  }
  // Variante de fondo (para tarjetas/escenas con titular en primer plano).
  function photoCover(caption, src, alt) {
    if (src) return '<img src="' + src + '" alt="' + (alt || caption) + '" loading="lazy">';
    return '<div class="photo-slot cover"><span class="ps-corner">' + caption + '</span></div>';
  }

  // ---- Wire de enlaces globales -------------------------------
  function wireLinks() {
    qa('[data-wa]').forEach(function (a) {
      a.href = waLink(a.getAttribute('data-wa'));
      a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function () { track('whatsapp_click', { action: a.getAttribute('data-wa') }); });
    });
    qa('[data-tel]').forEach(function (a) {
      var p = primaryPhone();
      a.href = 'tel:' + p.tel;
      a.addEventListener('click', function () { track('phone_click', { number: p.tel }); });
    });
    qa('[data-maps]').forEach(function (a) {
      a.href = (D.address && D.address.mapsUrl) || '#';
      a.target = '_blank'; a.rel = 'noopener';
      a.addEventListener('click', function () { track('maps_click', {}); });
    });
    qa('[data-ig]').forEach(function (a) {
      a.href = (D.instagram && D.instagram.url) || '#';
      a.target = '_blank'; a.rel = 'noopener';
    });
  }

  // ---- Franja marquee -----------------------------------------
  function renderMarquee() {
    var host = q('#marqueeTrack');
    if (!host || !D.marquee) return;
    var chunk = D.marquee.map(function (t) { return '<span>' + t + '</span>'; }).join('');
    host.innerHTML = chunk + chunk; // duplicado para loop continuo
  }

  // ---- Quick info: dirección + estado horario -----------------
  function renderQuickInfo() {
    var addr = q('#qiAddress');
    if (addr && D.address) addr.textContent = D.address.full;
    var status = q('#qiStatus');
    if (status) {
      // Solo mostramos "Abierto ahora" si hay horarios confirmados.
      if (D.hours && D.hours.confirmed) {
        // (Cálculo real de apertura se implementa al confirmar horarios.)
        status.querySelector('.qi-txt').textContent = 'Ver horarios';
      } else {
        status.querySelector('.qi-txt').textContent = 'Consultá horarios';
      }
    }
  }

  // ---- Carrusel de destacados ---------------------------------
  function renderFeatured() {
    var rail = q('#featuredRail');
    if (!rail) return;
    var items = GALLERY.featured || [];
    rail.innerHTML = items.map(function (it) {
      return '<article class="dish">' +
        '<div class="dish-img">' + photoSlot(it.label, 'Foto de plato', it.src) + '</div>' +
        '<div class="dish-body">' +
        '<div class="dish-cat">' + (it.category || '') + '</div>' +
        '<h3 class="dish-name">' + it.label + '</h3>' +
        '<p class="dish-desc">' + (it.desc || '') + '</p>' +
        '<div class="dish-foot">' +
        (it.price ? '<span class="dish-price">' + it.price + '</span>' : '<span></span>') +
        '<a class="btn btn-sm btn-ghost" data-wa="pedir">Consultar</a>' +
        '</div></div></article>';
    }).join('');
    setupRailDrag(rail);
    setupRailDots(rail, items.length);
  }

  function setupRailDrag(rail) {
    var down = false, startX, startScroll, moved;
    rail.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // touch usa scroll nativo
      down = true; moved = false; startX = e.clientX; startScroll = rail.scrollLeft;
      rail.classList.add('dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved = true;
      rail.scrollLeft = startScroll - dx;
    });
    window.addEventListener('pointerup', function () { down = false; rail.classList.remove('dragging'); });
    rail.addEventListener('click', function (e) { if (moved) { e.preventDefault(); } }, true);
  }

  function setupRailDots(rail, n) {
    var dots = q('#railDots');
    if (!dots || !n) return;
    dots.innerHTML = Array.apply(null, { length: n }).map(function () { return '<i></i>'; }).join('');
    var marks = qa('i', dots);
    rail.addEventListener('scroll', function () {
      var idx = Math.round(rail.scrollLeft / (rail.scrollWidth / n));
      marks.forEach(function (m, i) { m.classList.toggle('active', i === Math.min(idx, n - 1)); });
    }, { passive: true });
    if (marks[0]) marks[0].classList.add('active');
  }

  // ---- Menú ----------------------------------------------------
  function renderMenu() {
    var tabsHost = q('#menuTabs');
    var panelsHost = q('#menuPanels');
    if (!tabsHost || !panelsHost) return;
    var cats = MENU.categories || [];

    tabsHost.innerHTML = cats.map(function (c, i) {
      return '<button class="menu-tab' + (i === 0 ? ' active' : '') + '" data-cat="' + c.id + '" role="tab" aria-selected="' + (i === 0) + '">' + c.name + '</button>';
    }).join('');

    panelsHost.innerHTML = cats.map(function (c, i) {
      var items = (c.items || []).map(function (it) {
        var tags = (it.tags || []).map(function (t) { return '<span class="tag ' + t + '">' + t + '</span>'; }).join('');
        return '<div class="menu-item">' +
          '<div class="mi-main">' +
          '<div class="mi-name">' + it.name + tags + '</div>' +
          (it.desc ? '<div class="mi-desc">' + it.desc + '</div>' : '') +
          '</div>' +
          (it.price ? '<span class="mi-dots"></span><span class="mi-price">' + it.price + '</span>' : '') +
          '</div>';
      }).join('');
      return '<div class="menu-panel' + (i === 0 ? ' active' : '') + '" data-cat="' + c.id + '" role="tabpanel">' +
        (c.blurb ? '<p class="menu-blurb">' + c.blurb + '</p>' : '') +
        '<div class="menu-list">' + items + '</div></div>';
    }).join('');

    var note = q('#menuNote');
    if (note && MENU.note) note.textContent = MENU.note;

    // PDF opcional
    var pdfBtn = q('#menuPdf');
    if (pdfBtn) {
      if (MENU.pdfUrl) { pdfBtn.href = MENU.pdfUrl; pdfBtn.style.display = ''; }
      else { pdfBtn.style.display = 'none'; }
    }

    tabsHost.addEventListener('click', function (e) {
      var btn = e.target.closest('.menu-tab');
      if (!btn) return;
      var id = btn.getAttribute('data-cat');
      qa('.menu-tab', tabsHost).forEach(function (t) { var on = t === btn; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); });
      qa('.menu-panel', panelsHost).forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-cat') === id); });
      track('menu_view', { category: id });
    });
    track('menu_view', { category: cats[0] && cats[0].id });
  }

  // ---- Experiencias -------------------------------------------
  function renderExperiences() {
    var host = q('#expGrid');
    if (!host || !(D.copy && D.copy.experiences)) return;
    host.innerHTML = D.copy.experiences.map(function (x) {
      return '<article class="exp-card">' +
        photoCover('Foto / video real de Donata', x.img || '') +
        '<div class="exp-kicker">' + x.kicker + '</div>' +
        '<h3>' + x.title + '</h3>' +
        '<p>' + x.text + '</p>' +
        '<a class="btn btn-sm btn-primary" data-wa="' + x.action + '">' + x.cta + '</a>' +
        '</article>';
    }).join('');
  }

  // ---- Galería + lightbox -------------------------------------
  function renderGallery() {
    var host = q('#galleryGrid');
    if (!host) return;
    host.innerHTML = (GALLERY.items || []).map(function (g, i) {
      var badge = g.kind === 'reel' ? '<span class="reel-badge">' + ICON.play + '</span>' : '';
      return '<figure class="gitem ' + (g.span || 'sq') + '" data-i="' + i + '" tabindex="0" role="button" aria-label="Ver: ' + g.label + '">' +
        badge +
        photoSlot(g.label, g.kind === 'reel' ? 'Reel vertical' : 'Foto real', g.src) +
        '<figcaption class="g-cap">' + g.label + '</figcaption>' +
        '</figure>';
    }).join('');

    var lb = q('#lightbox');
    var lbBody = q('#lbBody');
    var lbCap = q('#lbCap');
    function open(i) {
      var g = GALLERY.items[i]; if (!g) return;
      lbBody.innerHTML = g.src ? '<img src="' + g.src + '" alt="' + g.label + '">' : '<div class="photo-slot" style="position:relative;aspect-ratio:4/3;border-radius:var(--r-lg)"><span class="ps-ico">' + ICON.flame + '</span><span class="ps-label">' + g.label + '</span><span class="ps-tag">Foto real de Donata</span></div>';
      lbCap.textContent = g.label;
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
      track('gallery_open', { item: g.label });
    }
    function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); }
    host.addEventListener('click', function (e) { var f = e.target.closest('.gitem'); if (f) open(+f.getAttribute('data-i')); });
    host.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('gitem')) { e.preventDefault(); open(+e.target.getAttribute('data-i')); } });
    q('#lbClose').addEventListener('click', close);
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  }

  // ---- Reseñas -------------------------------------------------
  function renderReviews() {
    var host = q('#reviewsHost');
    if (!host) return;
    var revs = D.reviews || [];
    if (!revs.length) {
      host.innerHTML = '<div class="reviews-empty">' +
        '<div class="g-logo tint-crema">Google</div>' +
        '<p>Todavía no cargamos reseñas acá. Mientras tanto, podés ver lo que dice la gente directo en Google.</p>' +
        '<a class="btn btn-fuego" data-maps>Ver reseñas en Google ' + ICON.arrow + '</a>' +
        '</div>';
    } else {
      host.innerHTML = '<div class="reviews-grid">' + revs.map(function (r) {
        var stars = '';
        for (var i = 0; i < (r.rating || 5); i++) stars += '★';
        return '<article class="review"><div class="stars">' + stars + '</div>' +
          '<p class="r-text">' + r.text + '</p>' +
          '<div class="r-name">' + r.name + ' · ' + (r.source || 'Google') + '</div></article>';
      }).join('') + '</div>' +
      '<div style="margin-top:24px"><a class="btn btn-ghost" data-maps>Ver todas en Google ' + ICON.arrow + '</a></div>';
    }
  }

  // ---- Contacto / footer --------------------------------------
  function renderContact() {
    var info = q('#contactInfo');
    if (info && D.address) {
      var phones = (D.phones || []).map(function (p) {
        return '<a class="ci-val" style="display:block" href="tel:' + p.tel + '" onclick="window.dataLayer&&window.dataLayer.push({event:\'donata_phone_click\'})">' + p.label + '</a>';
      }).join('');
      var hoursHtml = (D.hours && D.hours.confirmed && D.hours.schedule.length)
        ? D.hours.schedule.map(function (h) { return h.days + ': ' + h.open + '–' + h.close; }).join('<br>')
        : 'A confirmar. Escribinos y te decimos.';
      info.innerHTML =
        row(ICON.pin, 'Dirección', '<a class="ci-val" data-maps>' + D.address.full + '</a>') +
        row(ICON.phone, 'Teléfonos', phones) +
        row(ICON.clock, 'Horarios', '<span class="ci-val">' + hoursHtml + '</span>') +
        row(ICON.ig, 'Instagram', '<a class="ci-val" data-ig>' + (D.instagram && D.instagram.handle) + '</a>');
    }
    function row(ico, label, val) {
      return '<div class="ci-row">' + ico + '<div><div class="ci-label">' + label + '</div>' + val + '</div></div>';
    }

    // Footer
    var fAddr = q('#footAddress'); if (fAddr && D.address) fAddr.textContent = D.address.full;
    var fPhones = q('#footPhones');
    if (fPhones) fPhones.innerHTML = (D.phones || []).map(function (p) { return '<a href="tel:' + p.tel + '" style="display:block">' + p.label + '</a>'; }).join('');
    var fCredit = q('#footCredit'); if (fCredit && D.credits) fCredit.innerHTML = D.credits.replace('Chimichurri', '<a href="' + (D.creditsUrl || '/') + '">Chimichurri</a>');
    var yr = q('#footYear'); if (yr) yr.textContent = new Date().getFullYear();
  }

  // ---- Preloader ----------------------------------------------
  function initPreloader() {
    var pre = q('#preloader');
    if (!pre) return;
    if (REDUCED || sessionStorage.getItem('donata_seen')) { pre.parentNode.removeChild(pre); return; }
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
      pre.classList.add('done');
      document.body.style.overflow = '';
      sessionStorage.setItem('donata_seen', '1');
      setTimeout(function () { if (pre.parentNode) pre.parentNode.removeChild(pre); }, 650);
    }, 1500);
  }

  // ---- Nav + mobile menu --------------------------------------
  function initNav() {
    var nav = q('#nav');
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 30); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });

    var mm = q('#mobileMenu');
    q('#navToggle').addEventListener('click', function () { mm.classList.add('open'); document.body.style.overflow = 'hidden'; });
    q('#mmClose').addEventListener('click', closeMM);
    qa('#mobileMenu a').forEach(function (a) { a.addEventListener('click', closeMM); });
    function closeMM() { mm.classList.remove('open'); document.body.style.overflow = ''; }

    // Barra de acción mobile: aparece después del hero.
    var bar = q('#actionBar');
    var hero = q('#hero');
    if (bar && hero && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        bar.classList.toggle('show', !ents[0].isIntersecting);
      }, { rootMargin: '-60% 0px 0px 0px' }).observe(hero);
    }
  }

  // ---- Revelados de scroll ------------------------------------
  function initReveal() {
    var els = qa('.reveal');
    if (REDUCED || !('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  // ---- Manifiesto palabra por palabra -------------------------
  function initManifesto() {
    var host = q('#manifestoText');
    if (!host) return;
    var text = host.textContent.trim();
    host.innerHTML = text.split(/\s+/).map(function (w) { return '<span class="word">' + w + '</span>'; }).join(' ');
    var words = qa('.word', host);
    if (REDUCED || !('IntersectionObserver' in window)) { words.forEach(function (w) { w.classList.add('lit'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) {
          words.forEach(function (w, i) { setTimeout(function () { w.classList.add('lit'); }, i * 55); });
          io.disconnect();
        }
      });
    }, { threshold: 0.4 });
    io.observe(host);
  }

  // ---- Partículas de brasa (canvas) ---------------------------
  function initFire() {
    var cv = q('#fireCanvas');
    if (!cv) return;
    // Desactivar en baja potencia / reduced motion.
    var lowPower = REDUCED || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || window.innerWidth < 480;
    if (lowPower) { cv.style.display = 'none'; return; }
    var ctx = cv.getContext('2d');
    var W, H, parts = [], raf, running = false;
    function resize() { W = cv.width = cv.offsetWidth; H = cv.height = cv.offsetHeight; }
    function spawn() { return { x: Math.random() * W, y: H + 10, vy: -(0.3 + Math.random() * 0.9), vx: (Math.random() - 0.5) * 0.4, r: Math.random() * 2 + 0.6, life: 0, max: 120 + Math.random() * 120 }; }
    function loop() {
      ctx.clearRect(0, 0, W, H);
      if (parts.length < 70) parts.push(spawn());
      for (var i = parts.length - 1; i >= 0; i--) {
        var p = parts[i]; p.life++; p.x += p.vx; p.y += p.vy; p.vy -= 0.002;
        var a = Math.max(0, 1 - p.life / p.max);
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.28);
        ctx.fillStyle = 'rgba(255,' + (120 + Math.floor(a * 90)) + ',43,' + (a * 0.9) + ')';
        ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(255,106,43,' + a + ')';
        ctx.fill();
        if (p.life > p.max || p.y < -10) parts.splice(i, 1);
      }
      raf = requestAnimationFrame(loop);
    }
    resize(); window.addEventListener('resize', resize);
    // Solo animar cuando la sección es visible (ahorro de batería).
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting && !running) { running = true; loop(); }
        else if (!ents[0].isIntersecting && running) { running = false; cancelAnimationFrame(raf); }
      }, { threshold: 0.05 }).observe(cv);
    } else { loop(); }
  }

  // ---- Init ----------------------------------------------------
  function init() {
    renderMarquee();
    renderQuickInfo();
    renderFeatured();
    renderMenu();
    renderExperiences();
    renderGallery();
    renderReviews();
    renderContact();
    wireLinks(); // después de renderizar (para cablear enlaces inyectados)
    initPreloader();
    initNav();
    initReveal();
    initManifesto();
    initFire();
    track('page_view', { page: 'donata_home' });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
