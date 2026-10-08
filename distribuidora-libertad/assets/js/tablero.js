/* =========================================================================
   Distribuidora Libertad · Tablero
   Login (Supabase Auth) + ABM de productos, precios por Excel/CSV,
   destacados, pedidos web y datos del sitio.
   ========================================================================= */
(function () {
  "use strict";
  var CFG = window.LIB_SUPABASE || {};
  var IC = window.LIB_IC;
  var RUBROS = window.LIB_RUBROS || [];
  var DEF = window.LIB_DEFAULTS || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]; }); };
  var norm = function (s) { return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
  var plata = function (p) { return p == null || isNaN(p) ? "—" : "$ " + Number(p).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
  var rubroNom = function (id) { var r = RUBROS.find(function (x) { return x.id === id; }); return r ? r.corto : id; };
  var rubroOpts = function (todos) {
    return (todos ? '<option value="">' + todos + '</option>' : "") + RUBROS.map(function (r) { return '<option value="' + r.id + '">' + esc(r.nombre) + '</option>'; }).join("");
  };

  var configured = !!(CFG.url && CFG.key && window.supabase);
  var sb = configured ? window.supabase.createClient(CFG.url, CFG.key, { auth: { persistSession: true, storageKey: "lib-tablero-auth" } }) : null;

  var D = { prods: [], aj: {}, pedidos: [] };

  /* ---------- toast ---------- */
  var tt;
  function toast(msg, err) {
    var t = $("#toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.innerHTML = (err ? "⚠️ " : IC.svg("check")) + " " + msg; t.style.background = err ? "var(--rojo)" : "";
    t.classList.add("on"); clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("on"); }, err ? 5000 : 2400);
  }

  $$("[data-ic]").forEach(function (el) { el.outerHTML = IC.svg(el.getAttribute("data-ic"), el.className); });

  /* =====================================================================
     AUTH
     ===================================================================== */
  function verLogin() { $("#v-app").hidden = true; $("#v-login").hidden = false; }
  function verApp(user) {
    $("#v-login").hidden = true; $("#v-app").hidden = false;
    $("#usuario").textContent = user && user.email || "";
    cargarTodo();
  }

  if (!configured) {
    verLogin(); $("#login-cfg").hidden = false;
    $$("#f-login input, #f-login button").forEach(function (e) { e.disabled = true; });
  } else {
    sb.auth.getSession().then(function (r) { var s = r.data && r.data.session; if (s) verApp(s.user); else verLogin(); });
    sb.auth.onAuthStateChange(function (ev, s) {
      if (ev === "PASSWORD_RECOVERY") {
        var np = prompt("Escribí tu nueva contraseña (mínimo 8 caracteres):");
        if (np && np.length >= 8) sb.auth.updateUser({ password: np }).then(function (r) { toast(r.error ? r.error.message : "Contraseña actualizada", !!r.error); });
      }
      if (ev === "SIGNED_OUT") verLogin();
    });
  }

  $("#f-login").addEventListener("submit", function (e) {
    e.preventDefault();
    var err = $("#login-err"); err.hidden = true;
    var btn = $("#f-login [type=submit]"); btn.disabled = true; btn.textContent = "Entrando…";
    sb.auth.signInWithPassword({ email: $("#l-email").value.trim(), password: $("#l-pass").value }).then(function (r) {
      btn.disabled = false; btn.textContent = "Entrar";
      if (r.error) { err.textContent = /invalid/i.test(r.error.message) ? "Email o contraseña incorrectos." : r.error.message; err.hidden = false; return; }
      verApp(r.data.user);
    });
  });
  $("#btn-olvide").addEventListener("click", function () {
    var em = $("#l-email").value.trim();
    if (!em) { $("#login-err").textContent = "Escribí tu email arriba y tocá de nuevo."; $("#login-err").hidden = false; return; }
    sb.auth.resetPasswordForEmail(em, { redirectTo: location.origin + location.pathname }).then(function (r) {
      toast(r.error ? r.error.message : "Te mandamos un email para cambiar la contraseña.", !!r.error);
    });
  });
  $("#btn-salir").addEventListener("click", function () { sb.auth.signOut(); });

  /* =====================================================================
     NAVEGACIÓN
     ===================================================================== */
  function ir(tab) {
    $$("#nav [data-tab]").forEach(function (b) { b.toggleAttribute("aria-current", b.getAttribute("data-tab") === tab); if (b.getAttribute("data-tab") === tab) b.setAttribute("aria-current", "page"); });
    $$(".panel > section").forEach(function (s) { s.hidden = s.getAttribute("data-vista") !== tab; });
    try { history.replaceState(null, "", "#" + tab); } catch (e) {}
    window.scrollTo(0, 0);
    if (tab === "productos") pintarProds();
    if (tab === "destacados") pintarDest();
    if (tab === "pedidos") pintarPedidos();
  }
  $("#nav").addEventListener("click", function (e) { var b = e.target.closest("[data-tab]"); if (b) ir(b.getAttribute("data-tab")); });
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-ir]"); if (!b) return;
    ir(b.getAttribute("data-ir"));
    if (b.hasAttribute("data-nuevo")) abrirProd(null);
  });

  /* =====================================================================
     CARGA
     ===================================================================== */
  function fetchAll(table, cols, order) {
    var PAGE = 1000, out = [];
    function page(from) {
      return sb.from(table).select(cols).order(order, { ascending: true }).order("id", { ascending: true }).range(from, from + PAGE - 1).then(function (r) {
        if (r.error) throw r.error;
        out = out.concat(r.data || []);
        return (r.data || []).length === PAGE ? page(from + PAGE) : out;
      });
    }
    return page(0);
  }

  function cargarTodo() {
    $("#kpis").innerHTML = '<div class="kpi"><b>…</b><span>Cargando</span></div>';
    return Promise.all([
      fetchAll("productos", "id,art,nombre,precio,categoria,foto_url,activo,destacado,orden,nota,updated_at", "nombre"),
      sb.from("ajustes").select("clave,valor"),
      sb.from("pedidos").select("*").order("created_at", { ascending: false }).limit(300)
    ]).then(function (r) {
      var FOTOS = window.LIB_FOTOS || {};
      D.prods = r[0].map(function (p) {
        p.precio = p.precio == null ? null : Number(p.precio);
        if (!p.foto_url && FOTOS[p.art]) p.foto_url = FOTOS[p.art]; // foto de catálogo de proveedor
        return p;
      });
      D.aj = Object.assign({}, DEF);
      (r[1].data || []).forEach(function (x) { if (x.valor != null) D.aj[x.clave] = x.valor; });
      D.pedidos = r[2].data || [];
      init();
    }).catch(function (e) { toast("No se pudo cargar: " + (e.message || e), true); });
  }

  var iniciado = false;
  function init() {
    if (!iniciado) {
      $("#p-rubro").innerHTML = rubroOpts("Todos los rubros");
      $("#c-rub").innerHTML = rubroOpts();
      $("#c-rub").value = "general";
      $("#aum-rubro").innerHTML = rubroOpts("Todo el catálogo");
      $("#mp-cat").innerHTML = rubroOpts();
      iniciado = true;
    }
    pintarResumen(); pintarSitio(); badge();
    var h = location.hash.replace("#", "");
    ir(["resumen", "productos", "precios", "destacados", "pedidos", "sitio"].indexOf(h) !== -1 ? h : "resumen");
  }

  /* =====================================================================
     RESUMEN
     ===================================================================== */
  function pintarResumen() {
    var vis = D.prods.filter(function (p) { return p.activo; }).length;
    var sinP = D.prods.filter(function (p) { return p.activo && p.precio == null; }).length;
    var sinF = D.prods.filter(function (p) { return p.activo && !p.foto_url; }).length;
    var nuevos = D.pedidos.filter(function (p) { return p.estado === "nuevo"; }).length;
    $("#kpis").innerHTML =
      '<div class="kpi kpi--verde"><b>' + vis.toLocaleString("es-AR") + '</b><span>productos visibles</span></div>' +
      '<div class="kpi"><b>' + nuevos + '</b><span>pedidos nuevos</span></div>' +
      '<div class="kpi"><b>' + sinP.toLocaleString("es-AR") + '</b><span>sin precio (“Consultar”)</span></div>' +
      '<div class="kpi"><b>' + sinF.toLocaleString("es-AR") + '</b><span>sin foto</span></div>';
    var ult = D.pedidos.slice(0, 5);
    $("#res-pedidos").innerHTML = ult.length ? '<div class="pedidos" style="margin-bottom:14px">' + ult.map(pedidoHtml).join("") + '</div>' : '<p class="ayuda">Todavía no llegaron pedidos desde la web.</p>';
  }

  /* =====================================================================
     PRODUCTOS
     ===================================================================== */
  var pMostrar = 100, pRes = [];
  function filtrarProds() {
    var toks = norm($("#p-q").value).split(/\s+/).filter(Boolean);
    var rub = $("#p-rubro").value, est = $("#p-estado").value;
    pRes = D.prods.filter(function (p) {
      if (rub && p.categoria !== rub) return false;
      if (est === "activos" && !p.activo) return false;
      if (est === "ocultos" && p.activo) return false;
      if (est === "sinprecio" && p.precio != null) return false;
      if (est === "sinfoto" && p.foto_url) return false;
      if (est === "dest" && !p.destacado) return false;
      if (toks.length) { var t = norm(p.nombre + " " + p.art); for (var i = 0; i < toks.length; i++) if (t.indexOf(toks[i]) === -1) return false; }
      return true;
    });
  }
  function filaProd(p) {
    return '<tr data-id="' + p.id + '"' + (p.activo ? "" : ' class="oculto"') + '>' +
      '<td><div class="thumb">' + (p.foto_url ? '<img src="' + esc(p.foto_url) + '" alt="" loading="lazy">' : IC.svg(p.categoria)) + '</div></td>' +
      '<td class="cod">' + esc(p.art) + '</td>' +
      '<td class="nom">' + esc(p.nombre) + '</td>' +
      '<td>' + esc(rubroNom(p.categoria)) + '</td>' +
      '<td><input class="precio-inp" type="number" step="0.01" min="0" value="' + (p.precio == null ? "" : p.precio) + '" placeholder="Consultar" aria-label="Precio de ' + esc(p.nombre) + '"></td>' +
      '<td><div class="acc">' +
      '<button class="ib estrella' + (p.destacado ? " on" : "") + '" type="button" data-acc="dest" title="Destacado en portada" aria-label="Destacar">★</button>' +
      '<button class="ib' + (p.activo ? " on" : "") + '" type="button" data-acc="vis" title="' + (p.activo ? "Visible: tocá para ocultar" : "Oculto: tocá para mostrar") + '" aria-label="Mostrar u ocultar">' + (p.activo ? "👁" : "—") + '</button>' +
      '<button class="ib" type="button" data-acc="edit" title="Editar" aria-label="Editar">✎</button>' +
      '</div></td></tr>';
  }
  function pintarProds() {
    filtrarProds();
    $("#p-n").textContent = pRes.length.toLocaleString("es-AR") + " de " + D.prods.length.toLocaleString("es-AR") + " productos";
    $("#t-prod tbody").innerHTML = pRes.slice(0, pMostrar).map(filaProd).join("") ||
      '<tr><td colspan="6" style="padding:30px;text-align:center;color:var(--gris)">No hay productos con ese filtro.</td></tr>';
    var f = pRes.length - pMostrar; $("#p-mas").hidden = f <= 0; $("#p-mas").textContent = "Ver más (" + Math.max(0, f).toLocaleString("es-AR") + ")";
  }
  var deb;
  $("#p-q").addEventListener("input", function () { clearTimeout(deb); deb = setTimeout(function () { pMostrar = 100; pintarProds(); }, 150); });
  $("#p-rubro").addEventListener("change", function () { pMostrar = 100; pintarProds(); });
  $("#p-estado").addEventListener("change", function () { pMostrar = 100; pintarProds(); });
  $("#p-mas").addEventListener("click", function () { pMostrar += 200; pintarProds(); });
  $("#btn-nuevo").addEventListener("click", function () { abrirProd(null); });

  function prodPorId(id) { return D.prods.find(function (p) { return p.id === id; }); }
  function guardarCampo(p, cambios) {
    return sb.from("productos").update(cambios).eq("id", p.id).then(function (r) {
      if (r.error) { toast(r.error.message, true); return false; }
      Object.assign(p, cambios); return true;
    });
  }
  function maxOrden() { return D.prods.reduce(function (m, p) { return p.destacado && p.orden > m ? p.orden : m; }, 0); }

  $("#t-prod").addEventListener("click", function (e) {
    var tr = e.target.closest("tr[data-id]"); if (!tr) return;
    var p = prodPorId(tr.getAttribute("data-id")); var b = e.target.closest("[data-acc]"); if (!b || !p) return;
    var a = b.getAttribute("data-acc");
    if (a === "edit") abrirProd(p);
    if (a === "vis") guardarCampo(p, { activo: !p.activo }).then(function (ok) { if (ok) { tr.outerHTML = filaProd(p); toast(p.activo ? "Visible en la web" : "Oculto de la web"); } });
    if (a === "dest") guardarCampo(p, p.destacado ? { destacado: false } : { destacado: true, orden: maxOrden() + 1 }).then(function (ok) { if (ok) { tr.outerHTML = filaProd(p); toast(p.destacado ? "Agregado a destacados" : "Quitado de destacados"); } });
  });
  function guardarPrecio(inp) {
    var tr = inp.closest("tr[data-id]"); var p = prodPorId(tr.getAttribute("data-id"));
    var v = inp.value.trim() === "" ? null : Math.round(Number(inp.value) * 100) / 100;
    if (v !== null && (isNaN(v) || v < 0)) { inp.value = p.precio == null ? "" : p.precio; return; }
    if (v === p.precio) return;
    guardarCampo(p, { precio: v }).then(function (ok) {
      if (ok) { inp.classList.add("ok"); setTimeout(function () { inp.classList.remove("ok"); }, 1200); toast("Precio guardado: " + plata(v)); }
    });
  }
  $("#t-prod").addEventListener("change", function (e) { if (e.target.matches(".precio-inp")) guardarPrecio(e.target); });
  $("#t-prod").addEventListener("keydown", function (e) {
    if (e.target.matches(".precio-inp") && e.key === "Enter") {
      e.preventDefault();
      var all = $$(".precio-inp", $("#t-prod")); var i = all.indexOf(e.target);
      e.target.blur(); if (all[i + 1]) all[i + 1].focus();
    }
  });

  /* ---------- modal producto ---------- */
  var edit = null, fotoNueva;
  function abrirProd(p) {
    edit = p; fotoNueva = undefined;
    $("#mp-tit").textContent = p ? "Editar producto" : "Nuevo producto";
    $("#mp-art").value = p ? p.art : "";
    $("#mp-nombre").value = p ? p.nombre : "";
    $("#mp-precio").value = p && p.precio != null ? p.precio : "";
    $("#mp-cat").value = p ? p.categoria : "general";
    $("#mp-nota").value = p ? p.nota || "" : "";
    $("#mp-activo").checked = p ? p.activo : true;
    $("#mp-dest").checked = p ? p.destacado : false;
    $("#mp-borrar").hidden = !p;
    $("#mp-err").hidden = true;
    fotoPreview(p ? p.foto_url : "");
    $("#m-prod").classList.add("on"); document.body.style.overflow = "hidden";
    setTimeout(function () { (p ? $("#mp-precio") : $("#mp-art")).focus(); }, 60);
  }
  function cerrarProd() { $("#m-prod").classList.remove("on"); document.body.style.overflow = ""; }
  function fotoPreview(url) { $("#mp-img").innerHTML = url ? '<img src="' + esc(url) + '" alt="">' : IC.svg($("#mp-cat").value || "caja"); $("#mp-sinfoto").hidden = !url; }
  $$("#m-prod [data-cerrar]").forEach(function (b) { b.addEventListener("click", cerrarProd); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") cerrarProd(); });

  // Redimensiona en el navegador a WebP 900px antes de subir
  function optimizar(file) {
    return new Promise(function (ok, ko) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var M = 900, s = Math.min(1, M / Math.max(img.width, img.height));
        var c = document.createElement("canvas"); c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
        var ctx = c.getContext("2d"); ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height); ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        c.toBlob(function (b) { b ? ok(b) : ko(new Error("No se pudo procesar la imagen")); }, "image/webp", 0.86);
      };
      img.onerror = function () { ko(new Error("Formato de imagen no soportado")); };
      img.src = url;
    });
  }
  $("#mp-file").addEventListener("change", function (e) {
    var f = e.target.files[0]; if (!f) return;
    var art = ($("#mp-art").value || "sin-codigo").replace(/[^a-z0-9_-]/gi, "_");
    $("#mp-img").innerHTML = '<span class="ayuda">Subiendo…</span>';
    optimizar(f).then(function (blob) {
      var path = "productos/" + art + "-" + Date.now() + ".webp";
      return sb.storage.from("fotos").upload(path, blob, { contentType: "image/webp", upsert: true }).then(function (r) {
        if (r.error) throw r.error;
        fotoNueva = sb.storage.from("fotos").getPublicUrl(path).data.publicUrl;
        fotoPreview(fotoNueva);
      });
    }).catch(function (er) { toast(er.message || String(er), true); fotoPreview(edit ? edit.foto_url : ""); });
    e.target.value = "";
  });
  $("#mp-sinfoto").addEventListener("click", function () { fotoNueva = ""; fotoPreview(""); });
  $("#mp-cat").addEventListener("change", function () { if (!$("#mp-img img")) fotoPreview(""); });

  $("#f-prod").addEventListener("submit", function (e) {
    e.preventDefault();
    var pv = $("#mp-precio").value.trim();
    var row = {
      art: $("#mp-art").value.trim(), nombre: $("#mp-nombre").value.trim(),
      precio: pv === "" ? null : Math.round(Number(pv) * 100) / 100,
      categoria: $("#mp-cat").value, nota: $("#mp-nota").value.trim() || null,
      activo: $("#mp-activo").checked, destacado: $("#mp-dest").checked
    };
    if (fotoNueva !== undefined) row.foto_url = fotoNueva || null;
    if (row.destacado && !(edit && edit.destacado)) row.orden = maxOrden() + 1;
    var q = edit ? sb.from("productos").update(row).eq("id", edit.id).select().single()
                 : sb.from("productos").insert(row).select().single();
    q.then(function (r) {
      if (r.error) {
        $("#mp-err").textContent = /duplicate|unique/i.test(r.error.message) ? "Ya existe un producto con ese código." : r.error.message;
        $("#mp-err").hidden = false; return;
      }
      var p = r.data; p.precio = p.precio == null ? null : Number(p.precio);
      if (edit) Object.assign(edit, p); else D.prods.unshift(p);
      cerrarProd(); pintarProds(); pintarResumen(); toast("Producto guardado");
    });
  });
  $("#mp-borrar").addEventListener("click", function () {
    if (!edit || !confirm("¿Eliminar definitivamente “" + edit.nombre + "”?\nSi solo querés que no se vea, usá “Visible en la web”.")) return;
    sb.from("productos").delete().eq("id", edit.id).then(function (r) {
      if (r.error) return toast(r.error.message, true);
      D.prods = D.prods.filter(function (p) { return p !== edit; });
      cerrarProd(); pintarProds(); pintarResumen(); toast("Producto eliminado");
    });
  });

  /* =====================================================================
     ACTUALIZAR PRECIOS
     ===================================================================== */
  var hoja = null, headerRow = 0, plan = null;

  function numero(v) {
    if (v == null || v === "") return null;
    if (typeof v === "number") return isFinite(v) ? v : null;
    var s = String(v).replace(/[^\d.,-]/g, "");
    if (!s) return null;
    var c = s.lastIndexOf(","), d = s.lastIndexOf(".");
    if (c > -1 && d > -1) s = c > d ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
    else if (c > -1) s = s.replace(/\./g, "").replace(",", ".");
    else if ((s.match(/\./g) || []).length > 1) s = s.replace(/\./g, "");
    var n = parseFloat(s);
    return isNaN(n) ? null : n;
  }

  function leerArchivo(f) {
    $("#drop-nom").textContent = f.name;
    f.arrayBuffer().then(function (buf) {
      var wb;
      if (/\.csv$/i.test(f.name) || f.type === "text/csv") {
        // CSV: probar UTF-8 y si trae caracteres rotos, Windows-1252 (Excel en español)
        var txt = new TextDecoder("utf-8").decode(buf);
        if (txt.indexOf("\uFFFD") !== -1) txt = new TextDecoder("windows-1252").decode(buf);
        wb = XLSX.read(txt, { type: "string", raw: true });
      } else wb = XLSX.read(buf, { type: "array" });
      var ws = wb.Sheets[wb.SheetNames[0]];
      hoja = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "", raw: true });
      // detectar fila de encabezados
      headerRow = 0;
      for (var i = 0; i < Math.min(25, hoja.length); i++) {
        var t = norm(hoja[i].join(" | "));
        var celdas = hoja[i].map(norm);
        var tieneCod = celdas.some(function (c) { return /^(cod|codigo|cod\.|art|articulo|sku|ref|referencia)\b/.test(c.trim()) || /codigo/.test(c); });
        var tienePre = celdas.some(function (c) { return /precio|importe|valor|p\.? ?unit|lista/.test(c); });
        if (tieneCod && tienePre) { headerRow = i; break; }
      }
      var cab = hoja[headerRow] || [];
      var opts = cab.map(function (h, i) { return '<option value="' + i + '">' + esc(h || ("Columna " + (i + 1))) + '</option>'; }).join("");
      $("#c-cod").innerHTML = opts; $("#c-pre").innerHTML = opts;
      $("#c-nom").innerHTML = '<option value="">— No usar —</option>' + opts;
      var find = function (re) { for (var i = 0; i < cab.length; i++) if (re.test(norm(cab[i]))) return i; return -1; };
      var ic = find(/codigo|^cod|^art$|^art\.|sku|^ref/), ip = find(/precio|importe|valor|unit/);
      if (ip === -1) ip = find(/lista/);
      var inn = find(/desc|nombre|detalle|producto|^articulo/);
      if (ic === -1) ic = 0;
      if (ip === -1 || ip === ic) ip = Math.min(cab.length - 1, ic + 1);
      if (ic > -1) $("#c-cod").value = ic;
      if (ip > -1) $("#c-pre").value = ip;
      if (inn > -1 && inn !== ic) $("#c-nom").value = inn;
      $("#map-cols").hidden = false;
      muestra();
      toast((hoja.length - headerRow - 1).toLocaleString("es-AR") + " filas leídas. Revisá las columnas y tocá “Analizar”.");
    }).catch(function (e) { toast("No pude leer el archivo: " + e.message, true); });
  }
  function muestra() {
    var el = $("#muestra"); if (!el) { el = document.createElement("div"); el.id = "muestra"; el.className = "tabla-wrap"; el.style.marginTop = "6px"; $("#btn-analizar").before(el); }
    var ic = +$("#c-cod").value, ip = +$("#c-pre").value, inn = $("#c-nom").value === "" ? -1 : +$("#c-nom").value;
    var filas = hoja.slice(headerRow + 1).filter(function (r) { return String(r[ic] || "").trim(); }).slice(0, 4);
    el.innerHTML = '<table class="tabla"><thead><tr><th>Código</th><th>Precio leído</th>' + (inn > -1 ? '<th>Descripción</th>' : '') + '</tr></thead><tbody>' +
      filas.map(function (r) { return '<tr><td class="cod">' + esc(r[ic]) + '</td><td>' + plata(numero(r[ip])) + '</td>' + (inn > -1 ? '<td>' + esc(r[inn]) + '</td>' : '') + '</tr>'; }).join("") + '</tbody></table>';
  }
  ["#c-cod", "#c-pre", "#c-nom"].forEach(function (s) { $(s).addEventListener("change", muestra); });

  $("#f-lista").addEventListener("change", function (e) { if (e.target.files[0]) leerArchivo(e.target.files[0]); });
  var drop = $("#drop");
  ["dragenter", "dragover"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add("sobre"); }); });
  ["dragleave", "drop"].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove("sobre"); }); });
  drop.addEventListener("drop", function (e) { var f = e.dataTransfer.files[0]; if (f) leerArchivo(f); });

  function porArt() { var m = {}; D.prods.forEach(function (p) { m[String(p.art).trim().toUpperCase()] = p; }); return m; }

  $("#btn-analizar").addEventListener("click", function () {
    if (!hoja) return;
    var ic = +$("#c-cod").value, ip = +$("#c-pre").value, inn = $("#c-nom").value === "" ? -1 : +$("#c-nom").value;
    if (ic === ip) { toast("La columna de código y la de precio no pueden ser la misma.", true); return; }
    var m = porArt(), cambios = [], nuevos = [], iguales = 0, leidas = 0, vistos = {};
    for (var i = headerRow + 1; i < hoja.length; i++) {
      var row = hoja[i], cod = String(row[ic] == null ? "" : row[ic]).trim();
      if (!cod) continue;
      var pr = numero(row[ip]); if (pr == null) continue;
      pr = Math.round(pr * 100) / 100; leidas++;
      var key = cod.toUpperCase(); if (vistos[key]) continue; vistos[key] = 1;
      var p = m[key];
      if (p) { if (p.precio == null || Math.abs(p.precio - pr) > 0.004) cambios.push({ p: p, antes: p.precio, ahora: pr }); else iguales++; }
      else if (inn > -1 && String(row[inn]).trim()) nuevos.push({ art: cod, nombre: String(row[inn]).trim(), precio: pr });
    }
    plan = { tipo: "lista", cambios: cambios, nuevos: nuevos };
    mostrarPlan([
      ["Filas con precio", leidas], ["Cambian de precio", cambios.length], ["Sin cambios", iguales], ["Nuevos (no están)", nuevos.length]
    ]);
  });

  $("#btn-aum-prev").addEventListener("click", function () {
    var pct = Number($("#aum-pct").value); if (!pct) { toast("Poné un porcentaje (ej: 8 o -5).", true); return; }
    var rub = $("#aum-rubro").value, red = $("#aum-redondeo").checked;
    var cambios = D.prods.filter(function (p) { return p.precio != null && (!rub || p.categoria === rub); }).map(function (p) {
      var n = p.precio * (1 + pct / 100); n = red ? Math.round(n) : Math.round(n * 100) / 100;
      return { p: p, antes: p.precio, ahora: n };
    });
    plan = { tipo: "aumento", cambios: cambios, nuevos: [] };
    mostrarPlan([["Productos", cambios.length], ["Variación", (pct > 0 ? "+" : "") + pct + "%"], ["Rubro", rub ? rubroNom(rub) : "Todos"], ["Redondeo", red ? "Al peso" : "Centavos"]]);
  });

  function mostrarPlan(kpis) {
    $("#prev").hidden = false;
    $("#prev-tit").textContent = plan.tipo === "lista" ? "2 · Revisá y confirmá" : "Revisá el aumento y confirmá";
    $("#prev-kpis").innerHTML = kpis.map(function (k) { return '<div class="kpi"><b>' + (typeof k[1] === "number" ? k[1].toLocaleString("es-AR") : esc(k[1])) + '</b><span>' + esc(k[0]) + '</span></div>'; }).join("");
    var lista = plan.cambios.slice().sort(function (a, b) {
      var va = a.antes ? Math.abs(a.ahora / a.antes - 1) : 9, vb = b.antes ? Math.abs(b.ahora / b.antes - 1) : 9; return vb - va;
    }).slice(0, 400);
    $("#prev-body").innerHTML = lista.map(function (c) {
      var v = c.antes ? (c.ahora / c.antes - 1) * 100 : null;
      return '<tr><td class="cod">' + esc(c.p.art) + '</td><td>' + esc(c.p.nombre) + '</td><td style="text-align:right">' + plata(c.antes) + '</td><td style="text-align:right;font-weight:750">' + plata(c.ahora) + '</td><td style="text-align:right" class="' + (v > 0 ? "subida" : "bajada") + '">' + (v == null ? "nuevo" : (v > 0 ? "+" : "") + v.toFixed(1) + "%") + '</td></tr>';
    }).join("") + (plan.cambios.length > 400 ? '<tr><td colspan="5" class="ayuda" style="text-align:center">… y ' + (plan.cambios.length - 400).toLocaleString("es-AR") + ' más</td></tr>' : "") +
      (!plan.cambios.length ? '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--gris)">No hay precios para cambiar.</td></tr>' : "");
    $("#lbl-nuevos").hidden = !plan.nuevos.length;
    $("#n-nuevos").textContent = plan.nuevos.length.toLocaleString("es-AR");
    $("#chk-nuevos").checked = false;
    $("#lista-nom").value = plan.tipo === "lista" ? "" : "";
    $("#lista-nom").parentNode.hidden = plan.tipo !== "lista";
    $("#prev").scrollIntoView({ behavior: "smooth", block: "start" });
  }
  $("#btn-cancelar-prev").addEventListener("click", function () { $("#prev").hidden = true; plan = null; });

  function lotes(arr, n) { var o = []; for (var i = 0; i < arr.length; i += n) o.push(arr.slice(i, i + n)); return o; }

  $("#btn-aplicar").addEventListener("click", function () {
    if (!plan) return;
    var filas = plan.cambios.map(function (c) { return { art: c.p.art, nombre: c.p.nombre, categoria: c.p.categoria, precio: c.ahora }; });
    var nuevos = $("#chk-nuevos").checked ? plan.nuevos.map(function (n) { return { art: n.art, nombre: n.nombre, categoria: $("#c-rub").value || "general", precio: n.precio }; }) : [];
    var todo = filas.concat(nuevos);
    var lista = $("#lista-nom").value.trim();
    if (!todo.length && !lista) { toast("No hay nada para aplicar.", true); return; }
    if (!confirm("Se van a actualizar " + filas.length.toLocaleString("es-AR") + " precios" + (nuevos.length ? " y agregar " + nuevos.length + " productos" : "") + ". ¿Confirmás?")) return;
    var btn = $("#btn-aplicar"); btn.disabled = true;
    var bar = $("#prog"); bar.hidden = false; var barIn = bar.firstElementChild;
    var ls = lotes(todo, 400), hechos = 0;
    ls.reduce(function (pr, l) {
      return pr.then(function () {
        return sb.from("productos").upsert(l, { onConflict: "art" }).then(function (r) {
          if (r.error) throw r.error;
          hechos += l.length; barIn.style.width = Math.round(hechos / todo.length * 100) + "%";
        });
      });
    }, Promise.resolve()).then(function () {
      if (lista) return guardarAjustes({ lista_nombre: lista });
    }).then(function () {
      toast("Listo: " + filas.length.toLocaleString("es-AR") + " precios actualizados" + (nuevos.length ? " y " + nuevos.length + " productos nuevos" : ""));
      $("#prev").hidden = true; plan = null; bar.hidden = true; barIn.style.width = 0;
      return cargarTodo().then(function () { ir("precios"); });
    }).catch(function (e) { toast("Error: " + (e.message || e) + ". Lo que se alcanzó a guardar quedó guardado.", true); })
      .then(function () { btn.disabled = false; });
  });

  /* =====================================================================
     DESTACADOS
     ===================================================================== */
  function destacados() { return D.prods.filter(function (p) { return p.destacado; }).sort(function (a, b) { return (a.orden || 999) - (b.orden || 999); }); }
  function miniThumb(p) { return '<div class="thumb" style="width:46px;height:46px;border-radius:6px;background:var(--papel);display:grid;place-items:center;overflow:hidden">' + (p.foto_url ? '<img src="' + esc(p.foto_url) + '" alt="" style="width:100%;height:100%;object-fit:contain;background:#fff">' : IC.svg(p.categoria)) + '</div>'; }
  function pintarDest() {
    var d = destacados();
    $("#dest-lista").innerHTML = d.map(function (p, i) {
      return '<li data-id="' + p.id + '">' + miniThumb(p) + '<div class="dest-n">' + esc(p.nombre) + '<small>' + esc(p.art) + ' · ' + plata(p.precio) + (p.foto_url ? "" : ' · <span class="sin-foto-aviso">sin foto</span>') + (p.activo ? "" : ' · oculto') + '</small></div>' +
        '<div class="acc"><button class="ib" type="button" data-mv="-1" ' + (i === 0 ? "disabled" : "") + ' aria-label="Subir">↑</button><button class="ib" type="button" data-mv="1" ' + (i === d.length - 1 ? "disabled" : "") + ' aria-label="Bajar">↓</button><button class="ib" type="button" data-quitar aria-label="Quitar">×</button></div></li>';
    }).join("") || '<p class="ayuda">No hay destacados. Buscá productos a la derecha y agregalos.</p>';
    buscarDest();
  }
  function buscarDest() {
    var toks = norm($("#dest-q").value).split(/\s+/).filter(Boolean);
    var res = D.prods.filter(function (p) {
      if (p.destacado || !p.activo) return false;
      if (!toks.length) return !!p.foto_url;
      var t = norm(p.nombre + " " + p.art); return toks.every(function (k) { return t.indexOf(k) !== -1; });
    }).slice(0, 40);
    $("#dest-res").innerHTML = res.map(function (p) {
      return '<li data-id="' + p.id + '">' + miniThumb(p) + '<div class="dest-n">' + esc(p.nombre) + '<small>' + esc(p.art) + ' · ' + plata(p.precio) + '</small></div><button class="btn btn--verde btn--chico" type="button" data-sumar>Agregar</button></li>';
    }).join("") || '<li style="display:block" class="ayuda">' + (toks.length ? "Sin resultados." : "Escribí para buscar.") + '</li>';
  }
  var debD; $("#dest-q").addEventListener("input", function () { clearTimeout(debD); debD = setTimeout(buscarDest, 150); });
  $("#dest-res").addEventListener("click", function (e) {
    if (!e.target.closest("[data-sumar]")) return;
    var p = prodPorId(e.target.closest("li").getAttribute("data-id"));
    guardarCampo(p, { destacado: true, orden: maxOrden() + 1 }).then(function (ok) { if (ok) { pintarDest(); toast("Agregado a la portada"); } });
  });
  $("#dest-lista").addEventListener("click", function (e) {
    var li = e.target.closest("li[data-id]"); if (!li) return;
    var d = destacados(), p = prodPorId(li.getAttribute("data-id")), i = d.indexOf(p);
    if (e.target.closest("[data-quitar]")) { guardarCampo(p, { destacado: false }).then(pintarDest); return; }
    var mv = e.target.closest("[data-mv]"); if (!mv) return;
    var j = i + Number(mv.getAttribute("data-mv")); if (j < 0 || j >= d.length) return;
    var arr = d.slice(); arr.splice(j, 0, arr.splice(i, 1)[0]);
    // renumerar todo 1..n para que quede prolijo
    var ups = arr.map(function (x, k) { return x.orden === k + 1 ? null : guardarCampo(x, { orden: k + 1 }); }).filter(Boolean);
    Promise.all(ups).then(pintarDest);
  });

  /* =====================================================================
     PEDIDOS
     ===================================================================== */
  var ESTADOS = ["nuevo", "confirmado", "entregado", "cancelado"];
  function fecha(s) { var d = new Date(s); return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" }) + " " + d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); }
  function pedidoHtml(p) {
    var items = Array.isArray(p.items) ? p.items : [];
    return '<article class="pedido" data-id="' + p.id + '">' +
      '<div class="pedido__cab" data-toggle><div><b>' + esc(p.cliente) + (p.negocio ? ' · ' + esc(p.negocio) : '') + '</b><small>#' + p.id + ' · ' + fecha(p.created_at) + ' · ' + esc(p.localidad || "") + ' · ' + (p.unidades || items.length) + ' u.</small></div>' +
      '<select class="estado estado--' + p.estado + '" data-estado aria-label="Estado">' + ESTADOS.map(function (e) { return '<option value="' + e + '"' + (e === p.estado ? " selected" : "") + '>' + e + '</option>'; }).join("") + '</select>' +
      '<span class="pedido__total">' + plata(p.total) + '</span></div>' +
      '<div class="pedido__det" hidden><table>' + items.map(function (i) { return '<tr><td>' + i.q + ' × ' + esc(i.n) + ' <span class="cod" style="font-family:var(--f-mono);font-size:11.5px;color:var(--gris)">' + esc(i.a) + '</span></td><td>' + (i.p ? plata(i.p * i.q) : "a confirmar") + '</td></tr>'; }).join("") + '</table>' +
      (p.nota ? '<p><b>Nota:</b> ' + esc(p.nota) + '</p>' : '') +
      '<div class="pedido__acc">' + (p.telefono ? '<a class="btn btn--wa btn--chico" target="_blank" rel="noopener" href="https://wa.me/' + waNum(p.telefono) + '">' + IC.svg("wa") + 'Escribir a ' + esc(p.telefono) + '</a>' : '') +
      '<button class="btn btn--linea btn--chico" type="button" data-borrar style="color:var(--rojo)">Eliminar</button></div></div></article>';
  }
  function waNum(t) {
    var d = String(t).replace(/\D/g, "");
    if (d.indexOf("54") === 0) return d;
    d = d.replace(/^0/, "").replace(/^(\d{2,4})15/, "$1");
    return "549" + d;
  }
  function pintarPedidos() {
    var f = $("#ped-estado").value;
    var l = D.pedidos.filter(function (p) { return !f || p.estado === f; });
    $("#ped-lista").innerHTML = l.map(pedidoHtml).join("") || '<div class="tarjeta"><p class="ayuda" style="margin:0">No hay pedidos' + (f ? " en ese estado" : " todavía") + '.</p></div>';
  }
  function badge() { var n = D.pedidos.filter(function (p) { return p.estado === "nuevo"; }).length; $("#badge-pedidos").hidden = !n; $("#badge-pedidos").textContent = n; }
  $("#ped-estado").addEventListener("change", pintarPedidos);
  document.addEventListener("click", function (e) {
    var art = e.target.closest(".pedido"); if (!art) return;
    var p = D.pedidos.find(function (x) { return String(x.id) === art.getAttribute("data-id"); });
    if (e.target.closest("[data-estado]")) return;
    if (e.target.closest("[data-borrar]")) {
      if (!confirm("¿Eliminar el pedido #" + p.id + "?")) return;
      sb.from("pedidos").delete().eq("id", p.id).then(function (r) {
        if (r.error) return toast(r.error.message, true);
        D.pedidos = D.pedidos.filter(function (x) { return x !== p; }); pintarPedidos(); pintarResumen(); badge();
      });
      return;
    }
    if (e.target.closest("[data-toggle]")) { var d = art.querySelector(".pedido__det"); d.hidden = !d.hidden; }
  });
  document.addEventListener("change", function (e) {
    if (!e.target.matches("[data-estado]")) return;
    var art = e.target.closest(".pedido"); var p = D.pedidos.find(function (x) { return String(x.id) === art.getAttribute("data-id"); });
    var v = e.target.value;
    sb.from("pedidos").update({ estado: v }).eq("id", p.id).then(function (r) {
      if (r.error) return toast(r.error.message, true);
      p.estado = v; e.target.className = "estado estado--" + v; badge(); toast("Pedido #" + p.id + ": " + v);
    });
  });

  /* =====================================================================
     DATOS DEL SITIO
     ===================================================================== */
  var CAMPOS = [
    ["Contacto"],
    ["whatsapp", "WhatsApp para pedidos (con código de país, sin espacios)", "Ej: 5492657557780"],
    ["whatsapp_visible", "WhatsApp como se muestra en la web", "Ej: 2657 55-7780"],
    ["telefono", "Teléfono fijo"],
    ["email", "Email"],
    ["direccion", "Dirección"],
    ["localidad", "Localidad"],
    ["horario", "Horario de atención (vacío = no se muestra)", "Ej: Lunes a viernes de 8 a 17 hs"],
    ["instagram", "Instagram (link completo, opcional)"],
    ["facebook", "Facebook (link completo, opcional)"],
    ["Portada"],
    ["aviso", "Aviso destacado arriba de todo (vacío = sin aviso)", "Ej: Feriado: el lunes no hay entregas"],
    ["hero_titulo", "Título principal"],
    ["hero_bajada", "Bajada del título", "", true],
    ["anios", "Años de trayectoria"],
    ["Precios y cobertura"],
    ["lista_nombre", "Nombre de la lista vigente", "Ej: Octubre 2026"],
    ["nota_precios", "Aclaración de precios", "", true],
    ["zonas", "Zonas / localidades que atienden (una por línea)", "", true]
  ];
  function pintarSitio() {
    $("#f-sitio").innerHTML = CAMPOS.map(function (c) {
      if (c.length === 1) return "<h3>" + esc(c[0]) + "</h3>";
      var v = D.aj[c[0]] == null ? "" : D.aj[c[0]];
      var inp = c[3] ? '<textarea class="inp" id="s-' + c[0] + '" name="' + c[0] + '" rows="' + (c[0] === "zonas" ? 6 : 3) + '" placeholder="' + esc(c[2] || "") + '">' + esc(v) + '</textarea>'
                     : '<input class="inp" id="s-' + c[0] + '" name="' + c[0] + '" value="' + esc(v) + '" placeholder="' + esc(c[2] || "") + '">';
      return '<div class="campo"><label for="s-' + c[0] + '">' + esc(c[1]) + '</label>' + inp + '</div>';
    }).join("") + '<div style="display:flex;gap:10px;margin-top:8px"><button class="btn btn--verde" type="submit">Guardar cambios</button><a class="btn btn--linea" href="./" target="_blank" rel="noopener">Ver la web</a></div>';
  }
  function guardarAjustes(obj) {
    var rows = Object.keys(obj).map(function (k) { return { clave: k, valor: obj[k], updated_at: new Date().toISOString() }; });
    return sb.from("ajustes").upsert(rows, { onConflict: "clave" }).then(function (r) {
      if (r.error) throw r.error;
      Object.assign(D.aj, obj);
    });
  }
  $("#f-sitio").addEventListener("submit", function (e) {
    e.preventDefault();
    var obj = {};
    CAMPOS.forEach(function (c) { if (c.length > 1) obj[c[0]] = $("#s-" + c[0]).value.trim(); });
    obj.whatsapp = obj.whatsapp.replace(/\D/g, "");
    guardarAjustes(obj).then(function () { toast("Datos del sitio guardados"); }, function (er) { toast(er.message, true); });
  });
})();
