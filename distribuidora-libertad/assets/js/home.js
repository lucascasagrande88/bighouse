/* Distribuidora Libertad · home */
(function () {
  "use strict";
  var LIB = window.LIB, U = window.LIBU, A = window.LIB_ASSETS || {};
  var $ = U.$, esc = U.esc;

  /* ---------- imágenes generadas (si ya están cargadas) ---------- */
  if (A.historia) {
    $("#collage").innerHTML = [1, 2, 3].map(function (i) {
      return '<figure><img src="assets/img/historia-' + i + '.webp" alt="" loading="lazy"></figure>';
    }).join("");
  } else {
    $("#collage").innerHTML =
      '<figure><img src="assets/img/herramientas-bn.webp" alt="" loading="lazy" style="object-position:30% 50%"></figure>' +
      '<figure style="background:var(--verde);display:grid;place-items:center"><img src="assets/img/isotipo.png" alt="" style="width:46%;height:auto;object-fit:contain;filter:brightness(0) invert(1);opacity:.9"></figure>' +
      '<figure style="background:var(--kraft-claro);display:flex;flex-direction:column;justify-content:flex-end;padding:20px"><span class="mono" style="font-size:12px;color:var(--gris)">MÁS DE</span><b style="font-size:52px;font-weight:900;font-stretch:115%;line-height:1">' + esc(LIB.ajustes.anios || "24") + '</b><span style="font-weight:650">años en Villa Mercedes</span></figure>';
  }
  if (A.clientes) {
    U.$$("#clientes-grid .cliente").forEach(function (c) {
      c.insertAdjacentHTML("afterbegin", '<img src="assets/img/' + c.getAttribute("data-img") + '.webp" alt="" loading="lazy">');
      var ic = c.querySelector(".ph-ic"); if (ic) ic.remove();
    });
  }
  if (A.cobertura) $("#cobertura-bg").innerHTML = '<img src="assets/img/cobertura-ruta.webp" alt="" loading="lazy">';
  var an = document.getElementById("anio"); if (an) an.textContent = new Date().getFullYear();

  /* ---------- rubros ---------- */
  function rubros() {
    var cnt = LIB.porRubro();
    var html = LIB.rubros.map(function (r, i) {
      var n = cnt[r.id] || 0;
      return '<a class="rubro rv" href="catalogo.html?rubro=' + r.id + '">' +
        '<span class="rubro__cod"><span>R-' + String(i + 1).padStart(2, "0") + '</span><span>' + n.toLocaleString("es-AR") + '</span></span>' +
        '<span class="rubro__ic">' + U.rubroIcono(r.id) + '</span>' +
        '<span class="rubro__nom">' + esc(r.nombre) + '</span>' +
        '<span class="rubro__n">' + esc(r.bajada) + '</span></a>';
    }).join("");
    html += '<a class="rubro rubro--todo rv" href="catalogo.html"><span class="rubro__cod"><span>TODO</span><span>' +
      LIB.productos.length.toLocaleString("es-AR") + '</span></span><span class="rubro__ic">' + U.icono("todo") +
      '</span><span class="rubro__nom">Ver todo el catálogo</span><span class="rubro__n">Buscá por nombre o código.</span></a>';
    $("#grid-rubros").innerHTML = html;
  }

  /* ---------- destacados ---------- */
  function tarjeta(p) {
    var r = LIB.rubro(p.c);
    return '<article class="prod">' +
      '<div class="prod__img"><span class="prod__rubro">' + esc(r.corto) + '</span>' + U.foto(p) + '</div>' +
      '<div class="prod__body"><span class="prod__cod">' + esc(p.a) + '</span>' +
      '<h3 class="prod__nom">' + esc(p.n) + '</h3>' +
      '<div class="prod__pie">' + (p.p != null ? '<span class="prod__precio">' + LIB.precio(p.p) + '</span>' : '<span class="prod__consultar">Consultar</span>') +
      '<button class="btn-add" type="button" data-add="' + esc(p.a) + '" aria-label="Agregar ' + esc(p.n) + ' al pedido">' + U.icono("mas") + 'Agregar</button></div></div></article>';
  }
  function destacados() {
    var d = LIB.destacados();
    var sec = $("#destacados");
    if (!d.length) { sec.hidden = true; return; }
    $("#carr-dest").innerHTML = d.map(tarjeta).join("");
    U.$$("[data-carr]").forEach(function (b) {
      b.onclick = function () {
        var c = $("#carr-dest");
        c.scrollBy({ left: c.clientWidth * 0.9 * Number(b.getAttribute("data-carr")), behavior: "smooth" });
      };
    });
  }

  /* ---------- zonas + mapa ---------- */
  function zonas() {
    var z = String(LIB.ajustes.zonas || "").split(/\n|,/).map(function (s) { return s.trim(); }).filter(Boolean);
    $("#zonas").innerHTML = z.map(function (s, i) { return '<li' + (i === 0 ? ' class="base"' : '') + '>' + esc(s) + '</li>'; }).join("");
  }

  // Mapa: render 3D de la provincia (assets/img/mapa-san-luis.webp) + pines en SVG encima.
  // Coordenadas en el sistema del render original (1086×1448), calibradas contra
  // el mapa político de la provincia (bordes a la misma latitud).
  var BASE = [827, 603], CAPITAL = [541, 501];
  var LOCALIDADES = [[756, 400], [840, 259], [839, 187], [853, 959], [507, 268]]; // La Toma, Concarán, Sta. Rosa del Conlara, Buena Esperanza, Va. Gral. Roca
  function mapa() {
    var rutas = [CAPITAL].concat(LOCALIDADES).map(function (q) {
      var mx = (BASE[0] + q[0]) / 2 + (q[1] < BASE[1] ? -40 : 40), my = (BASE[1] + q[1]) / 2;
      return '<path class="ruta" d="M' + BASE.join(",") + "Q" + mx + "," + my + " " + q.join(",") + '"/>';
    }).join("");
    var puntos = LOCALIDADES.map(function (q) { return '<circle class="loc" cx="' + q[0] + '" cy="' + q[1] + '" r="9"/>'; }).join("");
    $("#mapa").innerHTML =
      '<img src="assets/img/mapa-san-luis.webp" alt="Mapa en relieve de la provincia de San Luis" loading="lazy" width="900" height="1200">' +
      '<svg viewBox="0 0 1086 1448" aria-hidden="true">' + rutas + puntos +
      '<g class="pin"><circle class="onda" cx="' + CAPITAL[0] + '" cy="' + CAPITAL[1] + '" r="16"/><circle cx="' + CAPITAL[0] + '" cy="' + CAPITAL[1] + '" r="13"/></g>' +
      '<text x="' + (CAPITAL[0] - 26) + '" y="' + (CAPITAL[1] - 8) + '" text-anchor="end">San Luis</text>' +
      '<text class="sub" x="' + (CAPITAL[0] - 26) + '" y="' + (CAPITAL[1] + 30) + '" text-anchor="end">CAPITAL</text>' +
      '<g class="pin base"><circle class="onda" cx="' + BASE[0] + '" cy="' + BASE[1] + '" r="20"/><circle cx="' + BASE[0] + '" cy="' + BASE[1] + '" r="17"/></g>' +
      '<g class="etiqueta"><rect x="' + (BASE[0] - 300) + '" y="' + (BASE[1] + 34) + '" width="360" height="100" rx="16"/>' +
      '<text x="' + (BASE[0] - 278) + '" y="' + (BASE[1] + 80) + '">Villa Mercedes</text>' +
      '<text class="sub" x="' + (BASE[0] - 278) + '" y="' + (BASE[1] + 116) + '">BASE · EDISON 666</text></g>' +
      '</svg>';
  }

  function heroTitulo() {
    var t = LIB.ajustes.hero_titulo, def = (window.LIB_DEFAULTS || {}).hero_titulo;
    if (t && t !== def) { var h = $("#hero-titulo"); h.textContent = t; h.__split = false; U.split(h); }
  }

  /* ---------- hero: entrada escalonada ---------- */
  requestAnimationFrame(function () { requestAnimationFrame(function () { var h = $(".hero"); if (h) h.classList.add("listo"); }); });

  /* ---------- FAQ: abrir y cerrar con ease-in-out ---------- */
  var EASE = "cubic-bezier(.65,0,.35,1)";
  U.$$(".faq details").forEach(function (d) {
    var sum = d.querySelector("summary"), resp = d.querySelector(".faq__resp");
    sum.addEventListener("click", function (e) {
      e.preventDefault();
      if (!resp.animate) { d.open = !d.open; return; }
      if (d.open) {
        var a = resp.animate([{ height: resp.offsetHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }], { duration: 450, easing: EASE });
        d.classList.add("cerrando");
        a.onfinish = function () { d.open = false; d.classList.remove("cerrando"); };
      } else {
        d.open = true;
        var h = resp.offsetHeight;
        resp.animate([{ height: "0px", opacity: 0 }, { height: h + "px", opacity: 1 }], { duration: 550, easing: EASE });
      }
    });
  });

  mapa();
  LIB.ready.then(function () {
    rubros(); destacados(); zonas(); heroTitulo();
    U.reveal();
  });
})();
