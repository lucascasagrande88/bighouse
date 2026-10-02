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

  // Contorno simplificado de la provincia de San Luis (lon, lat).
  var PROV = [[-67.12,-32.35],[-66.9,-32.02],[-66.4,-31.95],[-66.0,-32.05],[-65.62,-32.0],[-65.25,-32.1],[-64.98,-32.25],[-65.02,-32.55],[-64.95,-32.9],[-65.0,-33.3],[-64.98,-33.7],[-65.05,-34.1],[-65.1,-34.5],[-65.15,-34.9],[-65.25,-35.4],[-65.4,-35.98],[-66.62,-35.98],[-66.6,-35.4],[-66.75,-34.9],[-66.9,-34.4],[-67.05,-33.9],[-67.25,-33.4],[-67.3,-32.9]];
  var VM = [-65.46, -33.67], SL = [-66.34, -33.30];
  var OTRAS = [[-65.01,-32.35],[-65.24,-32.56],[-65.62,-33.05],[-65.18,-33.86],[-65.25,-34.76],[-65.8,-32.23],[-65.98,-35.15],[-65.37,-32.92]];
  function xy(p) { return [((p[0] + 67.5) * 150 * 0.83 + 20).toFixed(1), ((-31.85 - p[1]) * 150 + 20).toFixed(1)]; }
  function mapa() {
    var d = "M" + PROV.map(function (p) { return xy(p).join(","); }).join("L") + "Z";
    var v = xy(VM), s = xy(SL);
    var rutas = [SL].concat(OTRAS).map(function (p) {
      var q = xy(p), mx = (Number(v[0]) + Number(q[0])) / 2, my = (Number(v[1]) + Number(q[1])) / 2 - 30;
      return '<path class="ruta" d="M' + v.join(",") + 'Q' + mx + "," + my + " " + q.join(",") + '"/>';
    }).join("");
    var otras = OTRAS.map(function (p) { var q = xy(p); return '<circle cx="' + q[0] + '" cy="' + q[1] + '" r="3.5" fill="rgba(255,255,255,.7)"/>'; }).join("");
    $("#mapa").innerHTML =
      '<svg viewBox="0 0 340 670" role="img"><title>Mapa de la provincia de San Luis</title>' +
      '<path class="prov" d="' + d + '"/>' + rutas + otras +
      '<g class="pin"><circle class="onda" cx="' + s[0] + '" cy="' + s[1] + '" r="9"/><circle cx="' + s[0] + '" cy="' + s[1] + '" r="6"/></g>' +
      '<text x="' + (s[0] - 12) + '" y="' + (s[1] - 14) + '" text-anchor="end">San Luis</text>' +
      '<text class="sub" x="' + (s[0] - 12) + '" y="' + (Number(s[1]) - 1) + '" text-anchor="end">CAPITAL</text>' +
      '<g class="pin base"><circle class="onda" cx="' + v[0] + '" cy="' + v[1] + '" r="11"/><circle cx="' + v[0] + '" cy="' + v[1] + '" r="8"/></g>' +
      '<text x="' + (Number(v[0]) + 16) + '" y="' + (Number(v[1]) + 4) + '">Villa Mercedes</text>' +
      '<text class="sub" x="' + (Number(v[0]) + 16) + '" y="' + (Number(v[1]) + 19) + '">BASE · EDISON 666</text>' +
      '</svg>';
  }

  function heroTitulo() {
    var t = LIB.ajustes.hero_titulo, def = (window.LIB_DEFAULTS || {}).hero_titulo;
    if (t && t !== def) $("#hero-titulo").textContent = t;
  }

  mapa();
  LIB.ready.then(function () {
    rubros(); destacados(); zonas(); heroTitulo();
    U.reveal();
  });
})();
