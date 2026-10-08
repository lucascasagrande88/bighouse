/* Distribuidora Libertad · catálogo */
(function () {
  "use strict";
  var LIB = window.LIB, U = window.LIBU, A = window.LIB_ASSETS || {};
  var $ = U.$, $$ = U.$$, esc = U.esc;
  var PAGE = 60;

  var params = new URLSearchParams(location.search);
  var st = {
    q: params.get("q") || "",
    rubro: params.get("rubro") || "",
    precio: false, foto: false,
    orden: "rel",
    vista: (function () { try { return localStorage.getItem("lib-vista") || "lista"; } catch (e) { return "lista"; } })(),
    mostrar: PAGE
  };
  var idx = [], res = [];

  $("#q").value = st.q;

  function indexar() {
    idx = LIB.productos.map(function (p) {
      return { p: p, t: LIB.norm(p.n + " " + p.a), n: LIB.norm(p.n), a: LIB.norm(p.a) };
    });
  }

  function filtrar() {
    var toks = LIB.norm(st.q).split(/\s+/).filter(Boolean);
    var qn = LIB.norm(st.q).trim();
    res = [];
    for (var i = 0; i < idx.length; i++) {
      var it = idx[i], p = it.p;
      if (st.rubro && p.c !== st.rubro) continue;
      if (st.precio && p.p == null) continue;
      if (st.foto && !p.foto) continue;
      var ok = true;
      for (var j = 0; j < toks.length; j++) if (it.t.indexOf(toks[j]) === -1) { ok = false; break; }
      if (!ok) continue;
      var score = 0;
      if (toks.length) {
        if (it.a === qn) score += 1000;
        else if (it.a.indexOf(qn) === 0) score += 300;
        if (it.n.indexOf(qn) === 0) score += 200;
        if (it.n.indexOf(toks[0]) === 0) score += 80;
        score -= it.n.length * 0.05;
      }
      if (p.foto) score += 5;
      res.push({ p: p, s: score });
    }
    var cmpNom = function (a, b) { return a.p.n.localeCompare(b.p.n, "es"); };
    if (st.orden === "az") res.sort(cmpNom);
    else if (st.orden === "pa" || st.orden === "pd") {
      var dir = st.orden === "pa" ? 1 : -1;
      res.sort(function (a, b) {
        if (a.p.p == null && b.p.p == null) return cmpNom(a, b);
        if (a.p.p == null) return 1; if (b.p.p == null) return -1;
        return (a.p.p - b.p.p) * dir;
      });
    } else if (toks.length) res.sort(function (a, b) { return b.s - a.s || cmpNom(a, b); });
    else res.sort(cmpNom);
  }

  function precioHtml(p, cls) {
    return p.p != null ? '<span class="' + cls + '">' + LIB.precio(p.p) + '</span>' : '<span class="' + cls + ' consultar">Consultar</span>';
  }
  function btnAdd(p) {
    return '<button class="btn-add' + (window.LIBPedido.tiene(p.a) ? ' en' : '') + '" type="button" data-add="' + esc(p.a) + '" aria-label="Agregar ' + esc(p.n) + ' al pedido">' + U.icono("mas") + 'Agregar</button>';
  }
  function marcar(txt) {
    var toks = LIB.norm(st.q).split(/\s+/).filter(Boolean);
    if (!toks.length) return esc(txt);
    // resaltado tolerante a acentos: comparamos sobre la versión normalizada
    var n = LIB.norm(txt), marks = new Array(txt.length).fill(false);
    toks.forEach(function (t) { var i = n.indexOf(t); while (i !== -1) { for (var k = i; k < i + t.length; k++) marks[k] = true; i = n.indexOf(t, i + t.length); } });
    var out = "", on = false;
    for (var i = 0; i < txt.length; i++) {
      if (marks[i] && !on) { out += '<mark style="background:#D9EFDF;color:inherit;border-radius:2px">'; on = true; }
      if (!marks[i] && on) { out += "</mark>"; on = false; }
      out += esc(txt[i]);
    }
    return out + (on ? "</mark>" : "");
  }

  function fila(p) {
    var r = LIB.rubro(p.c);
    return '<div class="fila-p" data-ver="' + esc(p.a) + '" role="button" tabindex="0">' +
      '<div class="fila-p__img">' + (p.foto ? '<img src="' + esc(p.foto) + '" alt="" loading="lazy">' : U.icono(p.c)) + '</div>' +
      '<div class="fila-p__cod">' + marcar(p.a) + '</div>' +
      '<div class="fila-p__nom">' + marcar(p.n) + (st.rubro ? '' : '<small>' + esc(r.corto) + '</small>') + '</div>' +
      precioHtml(p, "fila-p__precio") +
      '<div class="fila-p__acc">' + btnAdd(p) + '</div></div>';
  }
  function tarjeta(p) {
    var r = LIB.rubro(p.c);
    return '<article class="prod" data-ver="' + esc(p.a) + '" role="button" tabindex="0" style="cursor:pointer">' +
      '<div class="prod__img"><span class="prod__rubro">' + esc(r.corto) + '</span>' + U.foto(p) + '</div>' +
      '<div class="prod__body"><span class="prod__cod">' + marcar(p.a) + '</span><h3 class="prod__nom">' + marcar(p.n) + '</h3>' +
      '<div class="prod__pie">' + precioHtml(p, "prod__precio") + btnAdd(p) + '</div></div></article>';
  }

  function pintar() {
    var cont = $("#resultados");
    var total = res.length, vis = res.slice(0, st.mostrar);
    $("#n-res").innerHTML = "<b>" + total.toLocaleString("es-AR") + "</b> artículo" + (total === 1 ? "" : "s") +
      (st.q ? " para “" + esc(st.q) + "”" : "") + (st.rubro ? " en " + esc(LIB.rubro(st.rubro).corto) : "");
    if (!total) {
      cont.innerHTML = '<div class="sin-res"><h3>No encontramos ese artículo.</h3><p>Probá con otra palabra o con el código. Si no está en la lista, consultanos: muchas veces lo conseguimos.</p>' +
        '<a class="btn btn--wa" target="_blank" rel="noopener" href="' + LIB.waLink("Hola, estoy buscando: " + st.q) + '">' + U.icono("wa") + 'Consultar por WhatsApp</a></div>';
      $("#btn-mas").hidden = true; return;
    }
    if (st.vista === "grilla") cont.innerHTML = '<div class="grilla">' + vis.map(function (r) { return tarjeta(r.p); }).join("") + '</div>';
    else cont.innerHTML = '<div class="lista"><div class="lista-cab"><span></span><span>Código</span><span>Artículo</span><span>Precio</span><span></span></div>' + vis.map(function (r) { return fila(r.p); }).join("") + '</div>';
    var faltan = total - vis.length;
    $("#btn-mas").hidden = faltan <= 0;
    $("#btn-mas").textContent = "Ver " + Math.min(PAGE, faltan) + " más (quedan " + faltan.toLocaleString("es-AR") + ")";
  }

  function rubros() {
    var cnt = LIB.porRubro();
    var html = '<li><button type="button" data-rubro="" aria-pressed="' + (!st.rubro) + '"><span>Todos</span><span>' + LIB.productos.length.toLocaleString("es-AR") + '</span></button></li>';
    html += LIB.rubros.map(function (r) {
      return '<li><button type="button" data-rubro="' + r.id + '" aria-pressed="' + (st.rubro === r.id) + '"><span>' + esc(r.corto) + '</span><span>' + (cnt[r.id] || 0).toLocaleString("es-AR") + '</span></button></li>';
    }).join("");
    $("#f-rubros").innerHTML = html;
    var sel = $('#f-rubros [aria-pressed="true"]'), ul = $("#f-rubros");
    if (sel && ul.scrollWidth > ul.clientWidth) ul.scrollLeft = sel.parentNode.offsetLeft - 16;
  }

  function cabecera() {
    var r = st.rubro ? LIB.rubro(st.rubro) : null;
    var ct = $("#cat-titulo"), nt = r ? r.nombre : "Catálogo y lista de precios";
    if (ct.textContent.replace(/\s+/g, " ").trim() !== nt) {
      ct.textContent = nt; ct.__split = false; ct.classList.remove("in", "split");
      U.split(ct); requestAnimationFrame(function () { requestAnimationFrame(function () { ct.classList.add("in"); }); });
    }
    var mg = $("#miga-rubro"); mg.hidden = !r; if (r) mg.textContent = "/ " + r.corto;
    var canon = document.querySelector('link[rel="canonical"]');
    if (canon) canon.href = "https://distribuidora-libertad.netlify.app/catalogo" + (r ? "?rubro=" + r.id : "");
    document.title = (r ? r.nombre + " · " : "Catálogo y lista de precios · ") + "Distribuidora Libertad";
    if (A.covers && r) $("#cat-bg").innerHTML = '<img src="assets/img/rubros/cover-' + r.id + '.webp" alt="" style="filter:none">';
    var chips = [];
    if (st.q) chips.push('<button class="chip" type="button" data-quitar="q">“' + esc(st.q) + '” ×</button>');
    if (r) chips.push('<button class="chip" type="button" data-quitar="rubro">' + esc(r.corto) + ' ×</button>');
    $("#chips").innerHTML = chips.join("");
  }

  function url() {
    var p = new URLSearchParams();
    if (st.q) p.set("q", st.q);
    if (st.rubro) p.set("rubro", st.rubro);
    var s = p.toString();
    history.replaceState(null, "", location.pathname + (s ? "?" + s : ""));
  }

  function actualizar(resetScroll) {
    st.mostrar = PAGE;
    filtrar(); pintar(); rubros(); cabecera(); url();
    if (resetScroll) {
      var top = $(".cat").getBoundingClientRect().top + window.scrollY - 90;
      if (window.scrollY > top) window.scrollTo({ top: top, behavior: "smooth" });
    }
  }

  /* ---------- modal ---------- */
  var actual = null;
  function verProd(a) {
    var p = LIB.productos.find(function (x) { return x.a === a; }); if (!p) return;
    actual = p;
    var r = LIB.rubro(p.c);
    $("#m-img").innerHTML = p.foto ? '<img src="' + esc(p.foto) + '" alt="' + esc(p.n) + '">' : '<div style="width:120px;color:var(--verde)">' + U.icono(p.c) + '</div>';
    $("#m-rubro").textContent = r.nombre;
    $("#m-nom").textContent = p.n;
    $("#m-cod").textContent = p.a;
    $("#m-nota").textContent = p.nota || ""; $("#m-nota").hidden = !p.nota;
    $("#m-precio").innerHTML = p.p != null ? LIB.precio(p.p) + ' <small style="font-size:13px;font-weight:500;color:var(--gris)">c/u</small>' : '<span style="font-size:20px;color:var(--gris)">Precio a consultar</span>';
    $("#m-q").value = 1;
    $("#m-wa").href = LIB.waLink("Hola, quería consultar por: " + p.n + " [" + p.a + "]");
    $("#modal").classList.add("on");
    document.body.style.overflow = "hidden";
    setTimeout(function () { $("#m-add").focus(); }, 50);
  }
  function cerrarModal() {
    if (!$("#modal").classList.contains("on")) return;
    $("#modal").classList.remove("on");
    if (!$("#drawer.on")) document.body.style.overflow = "";
  }

  /* ---------- eventos ---------- */
  var tDeb;
  $("#q").addEventListener("input", function (e) {
    clearTimeout(tDeb); tDeb = setTimeout(function () { st.q = e.target.value.trim(); actualizar(false); }, 160);
  });
  $("#f-buscar").addEventListener("submit", function (e) { e.preventDefault(); st.q = $("#q").value.trim(); actualizar(true); $("#q").blur(); });
  $("#f-rubros").addEventListener("click", function (e) {
    var b = e.target.closest("[data-rubro]"); if (!b) return;
    st.rubro = b.getAttribute("data-rubro"); actualizar(true);
  });
  $("#chips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-quitar]"); if (!b) return;
    var k = b.getAttribute("data-quitar"); st[k] = ""; if (k === "q") $("#q").value = ""; actualizar(false);
  });
  $("#f-precio").addEventListener("change", function (e) { st.precio = e.target.checked; actualizar(false); });
  $("#f-foto").addEventListener("change", function (e) { st.foto = e.target.checked; actualizar(false); });
  $("#orden").addEventListener("change", function (e) { st.orden = e.target.value; actualizar(false); });
  $$("[data-vista]").forEach(function (b) {
    b.addEventListener("click", function () {
      st.vista = b.getAttribute("data-vista");
      try { localStorage.setItem("lib-vista", st.vista); } catch (e) {}
      $$("[data-vista]").forEach(function (x) { x.setAttribute("aria-pressed", x === b); });
      pintar();
    });
  });
  $$("[data-vista]").forEach(function (x) { x.setAttribute("aria-pressed", x.getAttribute("data-vista") === st.vista); });
  $("#btn-mas").addEventListener("click", function () { st.mostrar += PAGE; pintar(); });
  $("#resultados").addEventListener("click", function (e) {
    if (e.target.closest("[data-add]")) return;
    var v = e.target.closest("[data-ver]"); if (v) verProd(v.getAttribute("data-ver"));
  });
  $("#resultados").addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("[data-ver]")) { e.preventDefault(); verProd(e.target.getAttribute("data-ver")); }
  });
  $$("[data-cerrar-modal]").forEach(function (b) { b.addEventListener("click", cerrarModal); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarModal(); });
  $("#m-menos").addEventListener("click", function () { $("#m-q").value = Math.max(1, (+$("#m-q").value || 1) - 1); });
  $("#m-mas").addEventListener("click", function () { $("#m-q").value = (+$("#m-q").value || 0) + 1; });
  $("#m-add").addEventListener("click", function () {
    if (!actual) return;
    window.LIBPedido.agregar(actual, Math.max(1, parseInt($("#m-q").value, 10) || 1));
    cerrarModal(); pintar();
  });
  // re-pintar estado "en pedido" de los botones
  document.addEventListener("click", function (e) { if (e.target.closest("[data-add]")) setTimeout(function () {
    $$("[data-add]").forEach(function (b) { b.classList.toggle("en", window.LIBPedido.tiene(b.getAttribute("data-add"))); });
  }, 0); });

  LIB.ready.then(function () {
    indexar();
    actualizar(false);
    var art = params.get("art"); if (art) verProd(art);
  });
})();
