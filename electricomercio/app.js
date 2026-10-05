/* ===========================================================================
   ELECTRICOMERCIO — DEMO · Tienda / lista de cotización
   =========================================================================== */
(function () {
  "use strict";
  var S = window.ECStore;
  var CFG = window.EC_CONFIG || {};
  var CONTACT = CFG.contact || {};
  var CATS = window.EC_CATS || [];
  var PROJECTS = window.EC_PROJECTS || [];
  var CMAP = {}; CATS.forEach(function (c) { CMAP[c.k] = c; });
  var PMAP_PROJ = {}; PROJECTS.forEach(function (p) { PMAP_PROJ[p.k] = p; });
  var MAXQ = 9999;

  var products = [], pmap = {};
  var list = S.list();
  var meta = S.meta();
  var state = { q: "", cat: "todas", use: "todos" };

  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function norm(s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[²]/g, "2"); }
  function catOf(k) { return CMAP[k] || { label: k || "Otros", icon: "bolt" }; }
  function plural(n, a, b) { return n + " " + (n === 1 ? a : b); }

  /* ---------- imágenes (manifiesto generado por tools/build-media.py) ---------- */
  var MEDIA = window.EC_MEDIA || {};
  function img(name, sizes, cls, eager) {
    var m = MEDIA[name]; if (!m || !m.src) return "";
    return '<img class="' + (cls || "") + '" src="' + m.src + '" srcset="' + m.srcset + '" sizes="' + (sizes || "100vw") +
      '" width="' + m.w + '" height="' + m.h + '" alt="" ' + (eager ? 'fetchpriority="high"' : 'loading="lazy"') + ' decoding="async">';
  }

  /* ---------- datos de contacto desde config ---------- */
  document.querySelectorAll("[data-cfg]").forEach(function (el) { el.textContent = CONTACT[el.getAttribute("data-cfg")] || ""; });
  document.querySelectorAll("[data-wa-plain]").forEach(function (a) {
    a.href = S.waLink("Hola, te escribo desde la web de Electricomercio."); a.target = "_blank"; a.rel = "noopener";
  });
  document.querySelectorAll("[data-maps]").forEach(function (a) { a.href = CONTACT.mapsUrl || "#"; });
  document.querySelectorAll("[data-mail]").forEach(function (a) { a.href = "mailto:" + (CONTACT.email || ""); });

  /* ---------- proyectos ---------- */
  var PROJ_ICON = {
    residencial: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    comercial:   '<path d="M3 9l1.5-5h15L21 9"/><path d="M3 9h18v2a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z"/><path d="M5 13v7h14v-7"/><path d="M10 20v-4h4v4"/>',
    industrial:  '<path d="M3 21V10l6 4V10l6 4V4h4v17z"/><path d="M7 17h2M12 17h2"/>'
  };
  function projIcon(k) {
    return '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (PROJ_ICON[k] || "") + '</svg>';
  }
  function bundleIds(p) { return p.bundle.filter(function (b) { return pmap[b[0]] && pmap[b[0]].active !== false; }); }
  function renderProjects() {
    var host = $("projectGrid");
    host.innerHTML = PROJECTS.map(function (p, i) {
      var items = bundleIds(p);
      var preview = items.slice(0, 4).map(function (b) { return esc(shortName(pmap[b[0]].n)); }).join(" · ");
      var ph = img("proyecto-" + p.k, "(max-width: 760px) 92vw, 33vw", "pc-img");
      return '<button type="button" class="pcardp reveal' + (ph ? " has-img" : "") + '" data-project="' + p.k + '" style="--d:' + i * 90 + 'ms">' +
        (ph ? '<span class="pc-media" data-parallax="0.08">' + ph + '</span>' : '') +
        '<span class="pc-top"><span class="pc-ic">' + projIcon(p.k) + '</span><span class="pc-n">0' + (i + 1) + '</span></span>' +
        '<span class="pc-title">' + esc(p.label) + '</span>' +
        '<span class="pc-desc">' + esc(p.desc) + '</span>' +
        '<span class="pc-prev">' + preview + (items.length > 4 ? " …" : "") + '</span>' +
        '<span class="pc-go"><span>Arrancar lista base · ' + plural(items.length, "producto", "productos") + '</span>' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>' +
        '</button>';
    }).join("");
    $("heroQuick").innerHTML = '<span>Arrancá por</span>' + PROJECTS.map(function (p) {
      return '<button type="button" data-project="' + p.k + '">' + esc(p.label) + '</button>';
    }).join("");
    $("emptyProjects").innerHTML = PROJECTS.map(function (p) {
      return '<button type="button" class="chip" data-project="' + p.k + '">' + esc(p.label) + '</button>';
    }).join("");
    var sel = $("projectSel");
    sel.innerHTML = '<option value="">Sin especificar</option>' + PROJECTS.map(function (p) {
      return '<option value="' + p.k + '">' + esc(p.label) + '</option>';
    }).join("");
    sel.value = meta.project || "";
  }
  function shortName(n) { return String(n).replace(/\s*\(.*\)/, "").split(" ").slice(0, 3).join(" "); }

  function startProject(k) {
    var p = PMAP_PROJ[k]; if (!p) return;
    var prev = { list: list.slice(), project: meta.project };
    list = bundleIds(p).map(function (b) { return { id: b[0], qty: b[1] }; });
    meta.project = k; S.saveMeta(meta); saveList();
    $("projectSel").value = k;
    setUse(k);
    openList();
    if (prev.list.length) {
      toast("Cargamos la lista base " + p.label + ".", "Deshacer", function () {
        list = prev.list; meta.project = prev.project; S.saveMeta(meta); saveList();
        $("projectSel").value = meta.project || "";
      });
    } else {
      toast("Lista base " + p.label + " cargada. Ajustala a tu obra.");
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-project]"); if (b) { startProject(b.getAttribute("data-project")); }
  });

  /* ---------- categorías ---------- */
  function renderCats() {
    var counts = {};
    products.forEach(function (p) { if (p.active !== false) counts[p.cat] = (counts[p.cat] || 0) + 1; });
    $("catGrid").innerHTML = CATS.map(function (c, i) {
      var ph = img("rubro-" + c.k, "(max-width: 760px) 50vw, 25vw", "cc-img");
      return '<button type="button" class="catcard reveal' + (ph ? " has-img" : "") + '" data-cat="' + c.k + '" style="--d:' + (i % 4) * 70 + 'ms">' +
        (ph ? '<span class="cc-media">' + ph + '</span>' : '') +
        '<span class="cc-ic">' + ecIcon(c.icon, 26) + '</span>' +
        '<span class="cc-t"><b>' + esc(c.label) + '</b><small>' + esc(c.desc || "") + '</small></span>' +
        '<span class="cc-n">' + (counts[c.k] || 0) + '</span></button>';
    }).join("");
    $("catChips").innerHTML = '<button type="button" class="chip" data-chip="todas">Todas</button>' +
      CATS.map(function (c) { return '<button type="button" class="chip" data-chip="' + c.k + '">' + esc(c.label) + '</button>'; }).join("");
    $("useSeg").innerHTML = '<button type="button" data-use="todos">Todos</button>' +
      PROJECTS.map(function (p) { return '<button type="button" data-use="' + p.k + '">' + esc(p.label) + '</button>'; }).join("");
    syncFilterUI();
  }
  $("catGrid").addEventListener("click", function (e) {
    var b = e.target.closest("[data-cat]"); if (!b) return;
    state.cat = b.getAttribute("data-cat"); state.q = ""; $("q").value = ""; render(); scrollToCatalog();
  });
  $("catChips").addEventListener("click", function (e) {
    var b = e.target.closest("[data-chip]"); if (!b) return; state.cat = b.getAttribute("data-chip"); render();
  });
  $("useSeg").addEventListener("click", function (e) {
    var b = e.target.closest("[data-use]"); if (!b) return; setUse(b.getAttribute("data-use"));
  });
  function setUse(u) { state.use = u; render(); }
  function syncFilterUI() {
    document.querySelectorAll("#catChips .chip").forEach(function (c) {
      var on = c.getAttribute("data-chip") === state.cat; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
    });
    document.querySelectorAll("#useSeg button").forEach(function (c) {
      var on = c.getAttribute("data-use") === state.use; c.classList.toggle("on", on); c.setAttribute("aria-pressed", on);
    });
  }

  /* ---------- catálogo ---------- */
  function matches(p, words) {
    if (!words.length) return true;
    var hay = norm([p.n, p.d, catOf(p.cat).label, p.unit].join(" "));
    return words.every(function (w) { return hay.indexOf(w) > -1; });
  }
  function filtered() {
    var words = norm(state.q).split(/\s+/).filter(Boolean);
    return products.filter(function (p) {
      if (p.active === false) return false;
      if (state.cat !== "todas" && p.cat !== state.cat) return false;
      if (state.use !== "todos" && (p.tags || []).indexOf(state.use) < 0) return false;
      return matches(p, words);
    });
  }
  function qtyOf(id) { var it = list.find(function (x) { return x.id === id; }); return it ? it.qty : 0; }
  function thumb(p, size) {
    if (p.img) return '<img src="' + esc(p.img) + '" alt="" loading="lazy">';
    return ecIcon(catOf(p.cat).icon, size || 26);
  }
  function stepper(id, q, name) {
    return '<div class="stepper" data-id="' + esc(id) + '">' +
      '<button type="button" class="st-dec" aria-label="Quitar uno de ' + esc(name) + '">−</button>' +
      '<input type="number" inputmode="numeric" min="0" max="' + MAXQ + '" value="' + q + '" aria-label="Cantidad de ' + esc(name) + '">' +
      '<button type="button" class="st-inc" aria-label="Sumar uno de ' + esc(name) + '">+</button></div>';
  }
  function actionHTML(p) {
    var q = qtyOf(p.id);
    if (q > 0) return stepper(p.id, q, p.n);
    return '<button type="button" class="btn btn-add" data-add="' + esc(p.id) + '" aria-label="Agregar ' + esc(p.n) + ' a la lista">' +
      '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>Agregar</button>';
  }
  function tagsHTML(p) {
    return (p.tags || []).filter(function (t) { return PMAP_PROJ[t]; }).map(function (t) {
      return '<span class="tag">' + esc(PMAP_PROJ[t].label) + '</span>';
    }).join("");
  }
  function render() {
    syncFilterUI();
    var rows = filtered();
    $("productList").innerHTML = rows.map(function (p) {
      var c = catOf(p.cat);
      return '<article class="prow' + (qtyOf(p.id) ? " in" : "") + '" data-pid="' + esc(p.id) + '">' +
        '<div class="pr-th">' + thumb(p) + '</div>' +
        '<div class="pr-main"><span class="pr-cat">' + esc(c.label) + '</span>' +
        '<h3>' + esc(p.n) + '</h3>' +
        '<p>' + esc(p.d) + '</p>' +
        '<div class="pr-meta"><span class="unit">' + esc(p.unit) + '</span>' + tagsHTML(p) + '</div></div>' +
        '<div class="pr-act">' + actionHTML(p) + '</div></article>';
    }).join("");
    var cb = $("catBanner"), cc = CMAP[state.cat];
    if (cc) {
      cb.hidden = false;
      cb.classList.toggle("has-img", !!MEDIA["rubro-" + cc.k]);
      cb.innerHTML = img("rubro-" + cc.k, "(max-width: 760px) 100vw, 1200px", "cb-img") +
        '<div class="cb-t"><span class="kicker kicker-light">Rubro</span><b>' + esc(cc.label) + '</b><span>' + esc(cc.desc || "") + '</span></div>';
    } else { cb.hidden = true; cb.innerHTML = ""; }
    var any = state.q || state.cat !== "todas" || state.use !== "todos";
    $("resultCount").textContent = plural(rows.length, "producto", "productos") + (any ? " con este filtro" : " en el catálogo demo");
    $("clearFilters").hidden = !any;
    $("catalogEmpty").hidden = rows.length > 0;
    $("emptyTerm").textContent = state.q.trim();
    $("emptyCustom").hidden = !state.q.trim();
  }
  function refreshRow(id) {
    var row = document.querySelector('.prow[data-pid="' + cssEsc(id) + '"]'); if (!row || !pmap[id]) return;
    var act = row.querySelector(".pr-act");
    var focused = document.activeElement && act.contains(document.activeElement) ? document.activeElement.className : "";
    act.innerHTML = actionHTML(pmap[id]);
    row.classList.toggle("in", qtyOf(id) > 0);
    if (focused) { var f = act.querySelector("." + focused.split(" ")[0]) || act.querySelector(".st-inc") || act.querySelector("button"); if (f) f.focus(); }
  }
  function cssEsc(s) { return window.CSS && CSS.escape ? CSS.escape(s) : String(s).replace(/"/g, '\\"'); }

  var deb;
  $("q").addEventListener("input", function () { state.q = this.value; clearTimeout(deb); deb = setTimeout(render, 120); });
  $("headerSearch").addEventListener("submit", function (e) { e.preventDefault(); goSearch(); });
  $("hq").addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); goSearch(); } });
  function goSearch() {
    var v = $("hq").value; state.q = v; $("q").value = v; state.cat = "todas"; render(); scrollToCatalog();
  }
  function resetFilters() { state.q = ""; state.cat = "todas"; state.use = "todos"; $("q").value = ""; $("hq").value = ""; render(); }
  $("clearFilters").addEventListener("click", resetFilters);
  $("emptyReset").addEventListener("click", resetFilters);
  $("emptyCustom").addEventListener("click", function () {
    var name = state.q.trim(); if (!name) return;
    var id = "libre-" + norm(name).replace(/[^a-z0-9]+/g, "-").slice(0, 40);
    if (!list.find(function (x) { return x.id === id; })) list.push({ id: id, qty: 1, name: name, custom: true });
    saveList(); toast("“" + name + "” sumado a tu lista como pedido libre.");
  });
  function scrollToCatalog() {
    var el = $("catalogo"); window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: "smooth" });
  }

  /* ---------- cantidades (catálogo y lista comparten la lógica) ---------- */
  function setQty(id, q) {
    q = Math.max(0, Math.min(MAXQ, Math.floor(Number(q) || 0)));
    var it = list.find(function (x) { return x.id === id; });
    if (q === 0) list = list.filter(function (x) { return x.id !== id; });
    else if (it) it.qty = q;
    else list.push({ id: id, qty: q });
    saveList(id);
  }
  function bindQty(host) {
    host.addEventListener("click", function (e) {
      var add = e.target.closest("[data-add]");
      if (add) { var id = add.getAttribute("data-add"); setQty(id, 1); toast((pmap[id] ? pmap[id].n : "Producto") + " agregado a tu lista.", "Ver lista", openList); return; }
      var st = e.target.closest(".stepper"); if (!st) return;
      var sid = st.getAttribute("data-id");
      if (e.target.closest(".st-inc")) setQty(sid, qtyOf(sid) + 1);
      else if (e.target.closest(".st-dec")) setQty(sid, qtyOf(sid) - 1);
    });
    host.addEventListener("change", function (e) {
      var inp = e.target.closest(".stepper input"); if (!inp) return;
      setQty(inp.closest(".stepper").getAttribute("data-id"), inp.value);
    });
    host.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && e.target.matches(".stepper input")) { e.target.blur(); }
    });
  }
  bindQty($("productList"));
  bindQty($("listItems"));
  $("listItems").addEventListener("click", function (e) {
    var rm = e.target.closest("[data-rm]"); if (!rm) return;
    var id = rm.getAttribute("data-rm"), prev = list.slice(), name = itemName(list.find(function (x) { return x.id === id; }) || { id: id });
    setQty(id, 0);
    toast(name + " quitado.", "Deshacer", function () { list = prev; saveList(); });
  });

  /* ---------- lista ---------- */
  function liveList() { return list.filter(function (x) { return x.custom || pmap[x.id]; }); }
  function itemName(x) { return x.custom ? x.name : (pmap[x.id] ? pmap[x.id].n : x.id); }
  function saveList(changedId) {
    S.saveList(list);
    renderList(); renderBadge();
    if (changedId) refreshRow(changedId); else render();
  }
  function renderBadge() {
    var items = liveList(), n = items.length, units = items.reduce(function (a, x) { return a + x.qty; }, 0);
    $("listCount").textContent = n;
    $("listCount").classList.toggle("on", n > 0);
    $("mbarCount").textContent = n ? plural(n, "ítem", "ítems") + " · " + units + " u." : "Tu lista está vacía";
    var p = PMAP_PROJ[meta.project];
    $("mbarProject").textContent = p ? "Proyecto " + p.label : (n ? "Lista de materiales" : "Elegí un proyecto o sumá productos");
  }
  function renderList() {
    var items = liveList();
    $("listEmpty").hidden = items.length > 0;
    $("addMore").hidden = items.length === 0;
    $("sendWa").disabled = items.length === 0;
    $("copyList").disabled = items.length === 0;
    $("clearList").disabled = items.length === 0;
    var units = items.reduce(function (a, x) { return a + x.qty; }, 0);
    $("listSummary").textContent = items.length
      ? plural(items.length, "producto", "productos") + " · " + plural(units, "unidad", "unidades") + " en total"
      : "Sumá lo que necesitás, ajustá cantidades y mandá todo junto para cotizar.";
    var ae = document.activeElement, keep = null;
    if (ae && $("listItems").contains(ae) && ae.closest(".stepper")) keep = { id: ae.closest(".stepper").getAttribute("data-id"), cls: ae.className || "inp" };
    $("listItems").innerHTML = items.map(function (x) {
      var p = pmap[x.id], name = itemName(x);
      return '<div class="li">' +
        '<div class="li-th">' + (p ? thumb(p, 20) : ecIcon("bolt", 20)) + '</div>' +
        '<div class="li-main"><b>' + esc(name) + '</b><small>' + (p ? esc(p.unit) : "Pedido libre") + '</small></div>' +
        stepper(x.id, x.qty, name) +
        '<button type="button" class="iconbtn sm" data-rm="' + esc(x.id) + '" aria-label="Quitar ' + esc(name) + '">' +
        '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div>';
    }).join("");
    if (keep) {
      var st = $("listItems").querySelector('.stepper[data-id="' + cssEsc(keep.id) + '"]');
      var t = st && (keep.cls === "inp" ? st.querySelector("input") : st.querySelector("." + keep.cls));
      if (t) t.focus();
    }
    $("msgPreview").textContent = buildMessage();
  }

  function buildMessage() {
    var items = liveList(), p = PMAP_PROJ[meta.project];
    var head = p ? "Hola, quiero cotizar un proyecto " + p.label + ":" : "Hola, quiero cotizar esta lista de materiales:";
    var lines = items.map(function (x) {
      var pr = pmap[x.id];
      return "- " + itemName(x) + (pr && pr.unit ? " (" + pr.unit + ")" : "") + " × " + x.qty;
    });
    var out = [head].concat(lines);
    var note = (meta.note || "").trim();
    out.push("");
    out.push("Observaciones: " + (note || "—"));
    out.push("Origen: " + (CFG.quoteSource || "Demo web"));
    return out.join("\n");
  }

  $("projectSel").addEventListener("change", function () { meta.project = this.value; S.saveMeta(meta); renderList(); renderBadge(); });
  $("note").value = meta.note || "";
  $("note").addEventListener("input", function () { meta.note = this.value; S.saveMeta(meta); $("msgPreview").textContent = buildMessage(); });

  $("sendWa").addEventListener("click", function () {
    if (!liveList().length) return;
    window.open(S.waLink(buildMessage()), "_blank", "noopener");
    toast("Abrimos WhatsApp con tu lista. Tu lista queda guardada acá.");
  });
  $("copyList").addEventListener("click", function () {
    var txt = buildMessage();
    function done() { toast("Lista copiada. Pegala donde quieras."); }
    function fallback() {
      var ta = document.createElement("textarea"); ta.value = txt; ta.setAttribute("readonly", "");
      ta.style.position = "fixed"; ta.style.opacity = "0"; document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(ta);
      if (ok) done(); else { $("listDrawer").querySelector(".preview").open = true; toast("No pudimos copiar automáticamente: seleccioná el mensaje de abajo."); }
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(done, fallback); else fallback();
  });
  $("clearList").addEventListener("click", function () {
    if (!list.length) return;
    var prev = { list: list.slice(), project: meta.project };
    list = []; meta.project = ""; S.saveMeta(meta); $("projectSel").value = ""; saveList();
    toast("Lista vaciada.", "Deshacer", function () {
      list = prev.list; meta.project = prev.project; S.saveMeta(meta); $("projectSel").value = meta.project || ""; saveList();
    });
  });

  /* ---------- drawer ---------- */
  var drawer = $("listDrawer"), lastFocus = null;
  function openList() {
    if (!drawer.hidden) return;
    lastFocus = document.activeElement;
    renderList(); drawer.hidden = false; document.body.classList.add("locked");
    requestAnimationFrame(function () { drawer.classList.add("open"); drawer.querySelector(".dh .iconbtn").focus(); });
  }
  function closeList() {
    drawer.classList.remove("open"); document.body.classList.remove("locked");
    setTimeout(function () { drawer.hidden = true; }, 220);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $("listBtn").addEventListener("click", openList);
  document.querySelectorAll("[data-open-list]").forEach(function (b) { b.addEventListener("click", openList); });
  drawer.addEventListener("click", function (e) {
    if (e.target.closest("[data-close]")) closeList();
    if (e.target.closest("[data-goto-catalog]")) { closeList(); setTimeout(scrollToCatalog, 60); }
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !drawer.hidden) closeList();
    if (e.key === "Tab" && !drawer.hidden) {
      var f = drawer.querySelectorAll("button:not([disabled]):not([hidden]), select, textarea, input, summary");
      f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  /* ---------- toast ---------- */
  var tt, toastCb = null;
  function toast(msg, actionLabel, cb) {
    $("toastMsg").textContent = msg;
    var a = $("toastAction"); a.hidden = !actionLabel; a.textContent = actionLabel || ""; toastCb = cb || null;
    $("toast").classList.add("show"); clearTimeout(tt);
    tt = setTimeout(function () { $("toast").classList.remove("show"); }, actionLabel ? 5000 : 2600);
  }
  $("toastAction").addEventListener("click", function () {
    var cb = toastCb; toastCb = null; $("toast").classList.remove("show"); if (cb) cb();
  });

  /* ---------- header ---------- */
  var header = $("header");
  function onScroll() { header.classList.toggle("shrink", window.scrollY > 40); }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- recorrido visual: slots, parallax, historia, reveals ---------- */
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  function fillSlots() {
    var hero = $("hero").querySelector("[data-media-slot=hero]");
    var hd = MEDIA["hero-desktop"], hm = MEDIA["hero-mobile"], hv = MEDIA["video-hero-loop"], hvm = MEDIA["video-hero-loop-mobile"];
    if (hd || hm) {
      var main = hd || hm, alt = hm || hd;
      var html = '<picture><source media="(max-width: 760px)" srcset="' + alt.srcset + '" sizes="100vw">' +
        '<img src="' + main.src + '" srcset="' + main.srcset + '" sizes="100vw" width="' + main.w + '" height="' + main.h + '" alt="" fetchpriority="high" decoding="async"></picture>';
      var mobile = window.matchMedia("(max-width: 760px)").matches, vid = mobile ? (hvm || hv) : hv;
      if (vid && vid.video && !reduce) html += '<video autoplay muted loop playsinline preload="metadata" poster="' + (mobile ? alt : main).src + '"><source src="' + vid.video + '" type="video/mp4"></video>';
      hero.innerHTML = html;
      $("hero").classList.add("has-img");
    }
    var cut = document.querySelector("[data-media-slot=cutout]");
    if (cut) cut.innerHTML = img("hero-cable-cutout", "(max-width: 760px) 70vw, 38vw");
    var lista = document.querySelector("[data-media-slot=lista]");
    var lh = img("lista-manos", "(max-width: 900px) 100vw, 50vw");
    if (lista) { lista.innerHTML = lh ? '<span data-parallax="0.1">' + lh + '</span>' : ""; lista.hidden = !lh; lista.parentNode.classList.toggle("has-img", !!lh); }
    var ct = document.querySelector("[data-media-slot=contacto]");
    var ch = img("contacto-mostrador", "100vw");
    if (ct && ch) { ct.innerHTML = ch; $("contacto").classList.add("has-img"); }
    // historia: los cuadros que existan, en orden
    var frames = ["banda-1-apagado", "banda-2-cableado", "banda-3-encendido"].filter(function (n) { return MEDIA[n]; });
    $("storyFrames").innerHTML = frames.map(function (n, i) {
      return '<div class="sf" data-step="' + ["banda-1-apagado", "banda-2-cableado", "banda-3-encendido"].indexOf(n) + '">' + img(n, "100vw") + '</div>';
    }).join("");
    $("recorrido").classList.toggle("has-img", frames.length > 0);
  }

  var parallaxEls = [], storyEl = $("recorrido"), ticking = false;
  function collectParallax() { parallaxEls = reduce ? [] : Array.prototype.slice.call(document.querySelectorAll("[data-parallax]")); }
  function onFrame() {
    ticking = false;
    var vh = window.innerHeight;
    parallaxEls.forEach(function (el) {
      var r = el.parentNode.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      var sp = parseFloat(el.getAttribute("data-parallax")) || 0;
      var off = (r.top + r.height / 2 - vh / 2) * sp;
      el.style.transform = "translate3d(0," + off.toFixed(1) + "px,0)";
    });
    // historia: progreso dentro de la sección fijada
    var r2 = storyEl.getBoundingClientRect(), total = r2.height - vh;
    var p = total > 0 ? Math.min(1, Math.max(0, -r2.top / total)) : 0;
    var step = Math.min(2, Math.floor(p * 3));
    if (storyEl._step !== step) {
      storyEl._step = step;
      document.querySelectorAll("#storySteps li").forEach(function (li, i) { li.classList.toggle("on", i === step); li.classList.toggle("done", i < step); });
      var frames = document.querySelectorAll("#storyFrames .sf"), best = null;
      frames.forEach(function (f) { if (+f.getAttribute("data-step") <= step) best = f; });
      if (!best) best = frames[0];
      frames.forEach(function (f) { f.classList.toggle("on", f === best); });
    }
    $("storyBar").style.transform = "scaleX(" + p.toFixed(3) + ")";
  }
  function requestFrame() { if (!ticking) { ticking = true; requestAnimationFrame(onFrame); } }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);

  var io = ("IntersectionObserver" in window) ? new IntersectionObserver(function (ents) {
    ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
  }, { threshold: .12, rootMargin: "0px 0px -6% 0px" }) : null;
  function observeReveals() {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) { if (io && !reduce) io.observe(el); else el.classList.add("in"); });
  }

  /* ---------- carga ---------- */
  function load() {
    products = S.products(); pmap = {}; products.forEach(function (p) { pmap[p.id] = p; });
    renderProjects(); renderCats(); render(); renderList(); renderBadge();
    collectParallax(); observeReveals(); requestFrame();
  }
  fillSlots();
  load();
  S.subscribe(function () { list = S.list(); meta = S.meta(); load(); });
})();
