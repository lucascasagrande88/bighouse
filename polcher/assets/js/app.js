/* ============================================================
   PÖLCHER — interacciones del sitio
   Vanilla JS + GSAP (opcional, mejora progresiva)
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Año en el footer ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ============================================================
     HERO — titular rotativo (cambia en cada visita)
     Frases basadas en el copy aprobado del Brand OS de Pölcher.
     ============================================================ */
  var HERO_VARIANTS = [
    { title: [{ t: "Te esperamos" }, { t: "en Pölcher.", a: "accent" }],
      sub: "La esquina más cervecera de Quilmes." },
    { title: [{ t: "La esquina" }, { t: "más cervecera", a: "accent" }, { t: "de Quilmes." }],
      sub: "Birra, burger y barrio." },
    { title: [{ t: "Ya sabés:" }, { t: "nos vemos" }, { t: "en Pölcher.", a: "accent" }],
      sub: "Punto de encuentro de amigos." },
    { title: [{ t: "Birra, burger" }, { t: "y barrio.", a: "accent-m" }],
      sub: "La mejor burger y la mejor birra." },
    { title: [{ t: "¿Dónde más?" }, { t: "Pölcher.", a: "accent" }],
      sub: "Beer bar, burgers y buena música." }
  ];

  function pickHeroIndex() {
    var last = -1;
    try { last = parseInt(sessionStorage.getItem("polcher_hero"), 10); } catch (e) {}
    var i = Math.floor(Math.random() * HERO_VARIANTS.length);
    if (HERO_VARIANTS.length > 1 && i === last) i = (i + 1) % HERO_VARIANTS.length;
    try { sessionStorage.setItem("polcher_hero", String(i)); } catch (e) {}
    return i;
  }

  var titleEl = document.getElementById("heroTitle");
  var subEl = document.getElementById("heroSub");
  if (titleEl && subEl) {
    var v = HERO_VARIANTS[pickHeroIndex()];
    titleEl.innerHTML = v.title
      .map(function (line) {
        var cls = "l" + (line.a ? " " + line.a : "");
        return '<span class="' + cls + '">' + line.t + "</span>";
      })
      .join("");
    subEl.textContent = v.sub;

    // Animación de entrada de las líneas del titular
    if (!reduce) {
      var lines = titleEl.querySelectorAll(".l");
      lines.forEach(function (l, i) {
        l.style.opacity = "0";
        l.style.transform = "translateY(28px)";
        l.style.transition = "opacity .8s cubic-bezier(.16,1,.3,1), transform .8s cubic-bezier(.16,1,.3,1)";
        l.style.transitionDelay = 120 + i * 110 + "ms";
      });
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          lines.forEach(function (l) { l.style.opacity = "1"; l.style.transform = "none"; });
        });
      });
    }
  }

  /* ============================================================
     NAV — scrolled + menú mobile
     ============================================================ */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("navMenu");

  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 20);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  function closeMenu() {
    if (!menu) return;
    menu.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Abrir menú");
    document.body.classList.remove("nav-open");
  }
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
      document.body.classList.toggle("nav-open", open);
    });
    menu.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
  }

  /* ============================================================
     CARTA — datos + tabs
     ⚠️ CONTENIDO DE EJEMPLO / EDITABLE.
     Según el Brand OS de Pölcher, NO se inventan precios,
     ingredientes exactos, IBU, graduación ni variedades: reemplazá
     estos ítems por la carta real antes de publicar definitivamente.
     ============================================================ */
  var MENU = {
    burgers: [
      { name: "La Clásica",   tag: "La de siempre",   desc: "La que nunca falla. Simple, directa, al punto." },
      { name: "La Doble",     tag: "Doble medallón",  desc: "Doble motivo para venir. Para el hambre en serio." },
      { name: "La del Barrio",tag: "La especial",     desc: "Nuestra especial de la casa. La que te hace volver." },
      { name: "La Veggie",    tag: "Sin carne",       desc: "Sin carne y con toda la actitud Pölcher." },
      { name: "Smash",        tag: "Bien crocante",   desc: "Medallón smasheado, bordes crocantes, puro sabor." },
      { name: "Sides & Papas",tag: "Para compartir",  desc: "Papas y para picar, ideales para bajar la birra." }
    ],
    birras: [
      { name: "Rubia / Golden", tag: "Fácil",       desc: "Fresca y suave. La puerta de entrada a la birra." },
      { name: "Roja / Amber",   tag: "Maltosa",     desc: "Con cuerpo y carácter. Para la sobremesa." },
      { name: "IPA",            tag: "Lupulada",    desc: "Aromática e intensa. Para los que buscan más." },
      { name: "Negra / Stout",  tag: "Tostada",     desc: "Profunda y cremosa, de las que abrazan." },
      { name: "Trigo / Weiss",  tag: "Refrescante", desc: "Suave y frutada. Siempre cae bien." },
      { name: "Barril rotativo",tag: "Del día",     desc: "Preguntá qué hay tirado hoy. Siempre cambia." }
    ]
  };

  function renderMenu(key, panel) {
    if (!panel) return;
    var html = '<div class="menu-items">';
    MENU[key].forEach(function (it) {
      html +=
        '<article class="menu-item">' +
          '<div class="mi-top">' +
            "<h3>" + it.name + "</h3>" +
            '<span class="mi-tag">' + it.tag + "</span>" +
          "</div>" +
          "<p>" + it.desc + "</p>" +
        "</article>";
    });
    html += "</div>";
    panel.innerHTML = html;
  }

  var panelBurgers = document.getElementById("panel-burgers");
  var panelBirras = document.getElementById("panel-birras");
  renderMenu("burgers", panelBurgers);
  renderMenu("birras", panelBirras);

  var tabs = Array.prototype.slice.call(document.querySelectorAll(".menu-tab"));
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      tabs.forEach(function (t) {
        var active = t === tab;
        t.classList.toggle("is-active", active);
        t.setAttribute("aria-selected", active ? "true" : "false");
      });
      if (panelBurgers) { panelBurgers.hidden = key !== "burgers"; panelBurgers.classList.toggle("is-active", key === "burgers"); }
      if (panelBirras) { panelBirras.hidden = key !== "birras"; panelBirras.classList.toggle("is-active", key === "birras"); }
    });
  });

  /* ============================================================
     FAQ — datos + acordeón (coincide con el JSON-LD del <head>)
     ============================================================ */
  var FAQ = [
    { q: "¿Dónde queda Pölcher?",
      a: "Estamos en Quilmes, provincia de Buenos Aires. La dirección exacta y el mapa los tenés siempre actualizados en nuestro Instagram." },
    { q: "¿Qué es Pölcher?",
      a: "Un beer bar de barrio: birra, burgers y buena música. Punto de encuentro de amigos y la esquina más cervecera de Quilmes." },
    { q: "¿Tienen birra de barril?",
      a: "Trabajamos con una buena selección de cervezas, con barril rotativo y botellas. Preguntá qué hay tirado el día que venís." },
    { q: "¿Tienen opciones veggie?",
      a: "Sí, tenemos opción veggie en la carta. Consultá las variantes del día por Instagram." },
    { q: "¿Se puede ir con grupos grandes?",
      a: "Obvio. Pölcher es punto de encuentro: venite con la banda. Escribinos por Instagram para coordinar mesas para grupos." },
    { q: "¿Qué días y horarios abren?",
      a: "Consultá los días y horarios actualizados en nuestro Instagram, así siempre tenés la info del momento." }
  ];

  var faqList = document.getElementById("faqList");
  if (faqList) {
    FAQ.forEach(function (item, i) {
      var wrap = document.createElement("div");
      wrap.className = "faq-item";
      wrap.innerHTML =
        '<button class="faq-q" aria-expanded="false" id="faq-q-' + i + '" aria-controls="faq-a-' + i + '">' +
          "<span>" + item.q + "</span>" +
          '<span class="ic" aria-hidden="true">' +
            '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
          "</span>" +
        "</button>" +
        '<div class="faq-a" id="faq-a-' + i + '" role="region" aria-labelledby="faq-q-' + i + '">' +
          '<div class="faq-a-inner">' + item.a + "</div>" +
        "</div>";
      faqList.appendChild(wrap);
    });

    faqList.addEventListener("click", function (e) {
      var btn = e.target.closest(".faq-q");
      if (!btn) return;
      var item = btn.parentElement;
      var ans = item.querySelector(".faq-a");
      var isOpen = item.classList.contains("open");

      // cerrar los demás (comportamiento acordeón)
      faqList.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) {
          o.classList.remove("open");
          o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
          o.querySelector(".faq-a").style.maxHeight = "0px";
        }
      });

      item.classList.toggle("open", !isOpen);
      btn.setAttribute("aria-expanded", isOpen ? "false" : "true");
      ans.style.maxHeight = isOpen ? "0px" : ans.scrollHeight + "px";
    });

    // recalcular altura al redimensionar
    window.addEventListener("resize", function () {
      var open = faqList.querySelector(".faq-item.open .faq-a");
      if (open) open.style.maxHeight = open.scrollHeight + "px";
    });
  }

  /* ============================================================
     REVEAL — IntersectionObserver (núcleo confiable, sin CDN)
     ============================================================ */
  var reveals = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
  // stagger entre hermanos
  reveals.forEach(function (el) {
    var parent = el.parentElement;
    if (!parent) return;
    var sibs = Array.prototype.slice.call(parent.children).filter(function (c) {
      return c.classList && c.classList.contains("reveal");
    });
    var idx = sibs.indexOf(el);
    if (idx > 0) el.style.transitionDelay = Math.min(idx * 80, 400) + "ms";
  });

  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     GSAP (opcional) — parallax del hero + foto Nosotros
     Si el CDN no carga, el sitio funciona igual.
     ============================================================ */
  function initGsap() {
    if (!window.gsap || reduce) return;
    var gsap = window.gsap;
    if (window.ScrollTrigger) gsap.registerPlugin(window.ScrollTrigger);

    var heroImg = document.querySelector(".hero-bg img");
    if (heroImg && window.ScrollTrigger) {
      gsap.to(heroImg, {
        yPercent: 16, scale: 1.08, ease: "none",
        scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
      });
    }
    var aboutPhoto = document.querySelector(".about-photo img");
    if (aboutPhoto && window.ScrollTrigger) {
      gsap.fromTo(aboutPhoto, { yPercent: 8 }, {
        yPercent: -8, ease: "none",
        scrollTrigger: { trigger: ".about-photo", start: "top bottom", end: "bottom top", scrub: true }
      });
    }
  }
  // GSAP se carga con defer; esperamos a que exista.
  if (document.readyState === "complete") initGsap();
  else window.addEventListener("load", initGsap);
})();
