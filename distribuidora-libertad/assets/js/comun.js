/* =========================================================================
   Distribuidora Libertad · comportamiento compartido (web + catálogo)
   Ajustes en el DOM, menú móvil, reveal, pedido (carrito → WhatsApp), toast.
   ========================================================================= */
(function () {
  "use strict";
  var LIB = window.LIB, IC = window.LIB_IC, A = window.LIB_ASSETS || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };

  /* ---------- helpers públicos ---------- */
  var U = window.LIBU = {
    $: $, $$: $$, esc: esc,
    icono: function (n, cls) { return IC.svg(n, cls); },
    rubroIcono: function (id) {
      return (A.rubros === true || (A.rubros && A.rubros.indexOf && A.rubros.indexOf(id) !== -1))
        ? '<img src="assets/img/rubros/rubro-' + id + '.webp" alt="" loading="lazy" width="84" height="84">'
        : IC.svg(id);
    },
    foto: function (p) {
      if (p.foto) return '<img src="' + esc(p.foto) + '" alt="' + esc(p.n) + '" loading="lazy">';
      if (A.sinfoto) return '<img src="assets/img/sin-foto.webp" alt="" loading="lazy">';
      return IC.svg(p.c);
    },
    toast: toast
  };

  function iconos(root) {
    $$("[data-ic]", root).forEach(function (el) { el.outerHTML = IC.svg(el.getAttribute("data-ic"), el.className); });
  }

  /* ---------- ajustes → DOM ---------- */
  function aplicarAjustes() {
    var aj = LIB.ajustes;
    $$("[data-aj]").forEach(function (el) {
      var v = aj[el.getAttribute("data-aj")];
      if (v != null && v !== "") el.textContent = v;
    });
    $$("[data-aj-if]").forEach(function (el) {
      var v = aj[el.getAttribute("data-aj-if")];
      el.hidden = !(v && String(v).trim());
    });
    $$("[data-wa]").forEach(function (el) {
      el.href = LIB.waLink(el.getAttribute("data-wa") || "Hola Distribuidora Libertad, quería hacer una consulta.");
      el.target = "_blank"; el.rel = "noopener";
    });
    $$("[data-tel]").forEach(function (el) { el.href = "tel:" + String(aj.telefono || "").replace(/[^\d+]/g, ""); });
    $$("[data-mail]").forEach(function (el) { el.href = "mailto:" + aj.email; });
    $$("[data-ig]").forEach(function (el) { el.href = aj.instagram; });
    $$("[data-fb]").forEach(function (el) { el.href = aj.facebook; });
    var av = $("#aviso");
    if (av) { av.hidden = !aj.aviso; av.textContent = aj.aviso || ""; }
    $$("[data-total-art]").forEach(function (el) { el.textContent = LIB.productos.length.toLocaleString("es-AR"); });
  }

  /* ---------- menú móvil ---------- */
  function menu() {
    var m = $("#menu-movil"); if (!m) return;
    $$("[data-menu-abrir]").forEach(function (b) { b.addEventListener("click", function () { m.classList.add("abierto"); document.body.style.overflow = "hidden"; }); });
    $$("[data-menu-cerrar], #menu-movil nav a").forEach(function (b) { b.addEventListener("click", function () { m.classList.remove("abierto"); document.body.style.overflow = ""; }); });
  }

  /* ---------- movimiento: entra y sale (ease-in-out) ---------- */
  var REDUCIR = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SCROLL_TL = window.CSS && CSS.supports && CSS.supports("animation-timeline: view()");

  // Parte un título en palabras para que suban de a una (conserva <em>, <br>)
  function split(el) {
    if (el.__split || REDUCIR) return;
    el.__split = true;
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (parte) {
            if (!parte) return;
            if (/^\s+$/.test(parte)) { frag.appendChild(document.createTextNode(" ")); return; }
            var w = document.createElement("span"); w.className = "w";
            var s = document.createElement("span"); s.textContent = parte; s.style.setProperty("--i", i++);
            w.appendChild(s); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") walk(n);
      });
    })(el);
    el.classList.add("split");
  }
  U.split = split;

  var io;
  function reveal() {
    $$(".display:not([data-no-split]), .h2:not([data-no-split])").forEach(split);
    var objetivos = $$(".split" + (SCROLL_TL ? "" : ", .rv") + ", .sube");
    if (REDUCIR || !("IntersectionObserver" in window)) { objetivos.forEach(function (e) { e.classList.add("in"); }); return; }
    if (!io) io = new IntersectionObserver(function (ents) {
      ents.forEach(function (e) {
        var el = e.target;
        if (e.isIntersecting) { el.classList.remove("out"); el.classList.add("in"); }
        else if (el.classList.contains("in")) {
          // salió por arriba: animación de salida; por abajo: se resetea para volver a entrar
          var arriba = e.boundingClientRect.top < 0;
          el.classList.remove("in");
          if (arriba && el.classList.contains("split")) el.classList.add("out");
        }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0 });
    objetivos.forEach(function (e) { if (!e.__obs) { e.__obs = true; io.observe(e); } });
  }
  U.reveal = reveal;

  /* ---------- toast ---------- */
  var tt;
  function toast(html) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = html; t.classList.add("on");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, 2600);
  }

  /* =========================================================================
     PEDIDO
     ========================================================================= */
  var KEY = "lib-pedido-v1", KEY_CLI = "lib-cliente-v1";
  var pedido = {};
  try { pedido = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { pedido = {}; }
  function guardar() { try { localStorage.setItem(KEY, JSON.stringify(pedido)); } catch (e) {} }
  function items() { return Object.keys(pedido).map(function (k) { return pedido[k]; }); }
  function cantidad() { return items().reduce(function (s, i) { return s + i.q; }, 0); }
  function total() { return items().reduce(function (s, i) { return s + (i.p ? i.p * i.q : 0); }, 0); }
  function sinPrecio() { return items().filter(function (i) { return !i.p; }).length; }

  var Pedido = window.LIBPedido = {
    agregar: function (p, q) {
      q = q || 1;
      var it = pedido[p.a];
      if (it) it.q += q; else pedido[p.a] = { a: p.a, n: p.n, p: p.p, q: q };
      guardar(); pintar();
      var b = $("#btn-pedido"); if (b) { b.classList.remove("pop"); void b.offsetWidth; b.classList.add("pop"); }
      toast(IC.svg("check") + ' Agregado al pedido · <b>' + cantidad() + ' u.</b>');
    },
    tiene: function (a) { return !!pedido[a]; },
    abrir: abrir
  };

  function setQ(a, q) {
    if (!pedido[a]) return;
    q = Math.max(0, Math.min(9999, parseInt(q, 10) || 0));
    if (q === 0) delete pedido[a]; else pedido[a].q = q;
    guardar(); pintar();
  }

  function pintar() {
    var n = cantidad();
    $$("[data-pedido-n]").forEach(function (el) { el.textContent = n; });
    $$("[data-add]").forEach(function (b) {
      var en = !!pedido[b.getAttribute("data-add")];
      b.classList.toggle("en", en);
    });
    var body = $("#drawer-body"); if (!body) return;
    var its = items();
    if (!its.length) {
      body.innerHTML = '<div class="vacio">' + IC.svg("caja") + '<p><b>Tu pedido está vacío.</b><br>Buscá en el catálogo y sumá artículos con el botón “Agregar”.</p><a class="btn btn--verde" href="catalogo.html">Ir al catálogo</a></div>';
      $("#drawer-pie").hidden = true; return;
    }
    $("#drawer-pie").hidden = false;
    body.innerHTML = its.map(function (i) {
      return '<div class="linea-p" data-a="' + esc(i.a) + '">' +
        '<div><div class="linea-p__nom">' + esc(i.n) + '</div><div class="linea-p__cod">' + esc(i.a) + (i.p ? ' · ' + LIB.precio(i.p) + ' c/u' : ' · precio a confirmar') + '</div></div>' +
        '<div class="linea-p__sub">' + (i.p ? LIB.precio(i.p * i.q) : '—') + '</div>' +
        '<div class="cant"><button type="button" data-menos aria-label="Restar">−</button><input type="number" inputmode="numeric" min="0" value="' + i.q + '" aria-label="Cantidad"><button type="button" data-mas aria-label="Sumar">+</button></div>' +
        '<button type="button" class="quitar" data-quitar>Quitar</button></div>';
    }).join("");
    $("#pedido-total").textContent = LIB.precio(total());
    var sp = sinPrecio();
    $("#pedido-nota").textContent = (sp ? sp + " artículo(s) sin precio: te lo confirmamos. " : "") + "Total estimado, sujeto a confirmación.";
  }

  function abrir() { $("#drawer").classList.add("on"); $("#velo").classList.add("on"); document.body.style.overflow = "hidden"; pintar(); }
  function cerrar() { $("#drawer").classList.remove("on"); $("#velo").classList.remove("on"); document.body.style.overflow = ""; }

  function montarDrawer() {
    var html =
      '<div class="velo" id="velo"></div>' +
      '<aside class="drawer" id="drawer" aria-label="Tu pedido" role="dialog" aria-modal="true">' +
      '<div class="drawer__cab"><h2>Tu pedido <span class="mono" style="font-size:13px;color:var(--gris);font-weight:500">(<span data-pedido-n>0</span> u.)</span></h2><button class="x" type="button" data-cerrar aria-label="Cerrar">×</button></div>' +
      '<div class="drawer__body" id="drawer-body"></div>' +
      '<form class="drawer__pie" id="drawer-pie" hidden>' +
      '<div class="total"><div><span style="font-weight:700">Total estimado</span><small id="pedido-nota"></small></div><b id="pedido-total"></b></div>' +
      '<div class="campos">' +
      '<div class="fila"><div class="campo"><label for="c-nom">Nombre *</label><input id="c-nom" name="nombre" required autocomplete="name"></div>' +
      '<div class="campo"><label for="c-neg">Comercio</label><input id="c-neg" name="negocio" autocomplete="organization"></div></div>' +
      '<div class="fila"><div class="campo"><label for="c-loc">Localidad *</label><input id="c-loc" name="localidad" required></div>' +
      '<div class="campo"><label for="c-tel">Teléfono</label><input id="c-tel" name="telefono" type="tel" autocomplete="tel"></div></div>' +
      '<div class="campo"><label for="c-nota">Nota (opcional)</label><textarea id="c-nota" name="nota" rows="2" placeholder="Forma de entrega, horario, CUIT…"></textarea></div>' +
      '</div>' +
      '<button class="btn btn--wa" type="submit">' + IC.svg("wa") + 'Enviar pedido por WhatsApp</button>' +
      '<button class="quitar" type="button" data-vaciar style="justify-self:center">Vaciar pedido</button>' +
      '</form></aside>';
    var d = document.createElement("div"); d.innerHTML = html;
    while (d.firstChild) document.body.appendChild(d.firstChild);

    try {
      var cli = JSON.parse(localStorage.getItem(KEY_CLI) || "{}");
      ["nombre", "negocio", "localidad", "telefono"].forEach(function (k) { if (cli[k]) $("#drawer-pie [name=" + k + "]").value = cli[k]; });
    } catch (e) {}

    $("#velo").addEventListener("click", cerrar);
    $("#drawer [data-cerrar]").addEventListener("click", cerrar);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrar(); });
    $("#drawer-body").addEventListener("click", function (e) {
      var row = e.target.closest(".linea-p"); if (!row) return;
      var a = row.getAttribute("data-a");
      if (e.target.closest("[data-mas]")) setQ(a, pedido[a].q + 1);
      else if (e.target.closest("[data-menos]")) setQ(a, pedido[a].q - 1);
      else if (e.target.closest("[data-quitar]")) setQ(a, 0);
    });
    $("#drawer-body").addEventListener("change", function (e) {
      var row = e.target.closest(".linea-p"); if (row && e.target.matches("input")) setQ(row.getAttribute("data-a"), e.target.value);
    });
    $("#drawer [data-vaciar]").addEventListener("click", function () {
      if (confirm("¿Vaciar el pedido?")) { pedido = {}; guardar(); pintar(); }
    });
    $("#drawer-pie").addEventListener("submit", enviar);
  }

  function enviar(e) {
    e.preventDefault();
    var f = e.target, cli = {};
    ["nombre", "negocio", "localidad", "telefono", "nota"].forEach(function (k) { cli[k] = f[k].value.trim(); });
    try { localStorage.setItem(KEY_CLI, JSON.stringify(cli)); } catch (er) {}
    var its = items(), tot = total();
    var lineas = its.map(function (i) {
      return "• " + i.q + " × " + i.n + " [" + i.a + "]" + (i.p ? " — " + LIB.precio(i.p * i.q) : " — a confirmar");
    });
    var msg = "*Pedido web · Distribuidora Libertad*\n\n" +
      "Cliente: " + cli.nombre + (cli.negocio ? " (" + cli.negocio + ")" : "") + "\n" +
      "Localidad: " + cli.localidad + (cli.telefono ? "\nTel: " + cli.telefono : "") + "\n\n" +
      lineas.join("\n") + "\n\n" +
      "*Total estimado: " + LIB.precio(tot) + "*" + (sinPrecio() ? " (+ artículos a confirmar)" : "") +
      (cli.nota ? "\n\nNota: " + cli.nota : "");
    // abrir WhatsApp en el mismo gesto (evita bloqueo de popups)
    var w = window.open(LIB.waLink(msg), "_blank");
    if (!w) location.href = LIB.waLink(msg);
    LIB.guardarPedido({
      cliente: cli.nombre, negocio: cli.negocio || null, localidad: cli.localidad,
      telefono: cli.telefono || null, nota: cli.nota || null,
      items: its, total: tot, unidades: cantidad()
    });
    toast(IC.svg("check") + " ¡Listo! Terminá de enviarlo en WhatsApp.");
    pedido = {}; guardar(); pintar(); cerrar();
  }

  /* delegación global para botones "Agregar" */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-add]"); if (!b) return;
    e.preventDefault(); e.stopPropagation();
    var a = b.getAttribute("data-add");
    var p = LIB.productos.find(function (x) { return x.a === a; });
    if (p) Pedido.agregar(p, 1);
  });

  /* ---------- init ---------- */
  iconos();
  menu();
  montarDrawer();
  $$("[data-pedido-abrir]").forEach(function (b) { b.addEventListener("click", abrir); });
  if (location.hash === "#pedido") setTimeout(abrir, 300);
  pintar();
  reveal();
  LIB.ready.then(function () { aplicarAjustes(); pintar(); });
})();
