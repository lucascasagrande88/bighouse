/* =========================================================================
   Distribuidora Libertad · capa de datos
   - Lee productos + ajustes desde Supabase.
   - Si Supabase no está configurado o no responde, usa el catálogo base
     (assets/data/catalogo-base.js) para que la web nunca quede vacía.
   Expone window.LIB = { sb, ready, productos, ajustes, rubro(), ... }
   ========================================================================= */
(function () {
  "use strict";

  var CFG = window.LIB_SUPABASE || {};
  var configured = !!(CFG.url && CFG.key && window.supabase && window.supabase.createClient);
  var sb = configured ? window.supabase.createClient(CFG.url, CFG.key, {
    auth: { persistSession: true, storageKey: "lib-tablero-auth" }
  }) : null;

  var RUBROS = window.LIB_RUBROS || [];
  var RUBRO_BY_ID = {};
  RUBROS.forEach(function (r) { RUBRO_BY_ID[r.id] = r; });

  function norm(s) {
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }

  function fromBase() {
    var base = (window.LIB_BASE && window.LIB_BASE.items) || [];
    var dest = {};
    (window.LIB_DESTACADOS_BASE || []).forEach(function (d, i) { dest[d[0]] = { foto: d[1], orden: i + 1 }; });
    return base.map(function (x) {
      var d = dest[x[0]];
      return { a: x[0], n: x[1], p: x[2], c: x[3], foto: d ? d.foto : "", dest: !!d, orden: d ? d.orden : null, nota: "" };
    });
  }

  /* El catálogo base (450 KB) solo se descarga si la base no responde. */
  function cargarBase() {
    if (window.LIB_BASE) return Promise.resolve();
    return new Promise(function (ok) {
      var sc = document.createElement("script");
      sc.src = (window.LIB_RAIZ || "") + "assets/data/catalogo-base.js";
      sc.onload = ok; sc.onerror = ok;
      document.head.appendChild(sc);
    });
  }

  function mapRow(r) {
    return {
      id: r.id, a: r.art, n: r.nombre, p: r.precio == null ? null : Number(r.precio),
      c: r.categoria || "general", foto: r.foto_url || "", dest: !!r.destacado,
      orden: r.orden, nota: r.nota || "", activo: r.activo !== false
    };
  }

  var COLS = "id,art,nombre,precio,categoria,foto_url,destacado,orden,nota,activo";

  /* Trae todas las filas paginando de a 1000 (límite de la API). */
  function fetchAll(table, cols, filter) {
    var PAGE = 1000, out = [];
    function page(from) {
      var q = sb.from(table).select(cols).order("nombre", { ascending: true }).order("art", { ascending: true }).range(from, from + PAGE - 1);
      if (filter) q = filter(q);
      return q.then(function (res) {
        if (res.error) throw res.error;
        out = out.concat(res.data || []);
        return (res.data || []).length === PAGE ? page(from + PAGE) : out;
      });
    }
    return page(0);
  }

  function loadAjustes() {
    var aj = Object.assign({}, window.LIB_DEFAULTS || {});
    if (!sb) return Promise.resolve(aj);
    return sb.from("ajustes").select("clave,valor").then(function (res) {
      if (!res.error && res.data) res.data.forEach(function (r) {
        if (r.valor != null && r.valor !== "") aj[r.clave] = r.valor;
      });
      return aj;
    }, function () { return aj; });
  }

  function withTimeout(p, ms) {
    return Promise.race([p, new Promise(function (_, rej) { setTimeout(function () { rej(new Error("timeout")); }, ms); })]);
  }

  var LIB = window.LIB = {
    sb: sb,
    configured: configured,
    productos: [],
    ajustes: Object.assign({}, window.LIB_DEFAULTS || {}),
    fuente: "base",
    rubros: RUBROS,
    rubro: function (id) { return RUBRO_BY_ID[id] || { id: id, nombre: id, corto: id, bajada: "" }; },
    norm: norm,
    fetchAll: fetchAll,
    cargarBase: cargarBase,
    fromBase: fromBase,
    mapRow: mapRow,
    COLS: COLS,

    precio: function (p) {
      if (p == null || isNaN(p)) return null;
      return "$ " + Number(p).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },

    destacados: function () {
      return LIB.productos.filter(function (p) { return p.dest; })
        .sort(function (a, b) { return (a.orden || 999) - (b.orden || 999); });
    },

    porRubro: function () {
      var m = {};
      LIB.productos.forEach(function (p) { m[p.c] = (m[p.c] || 0) + 1; });
      return m;
    },

    waLink: function (texto) {
      var n = String(LIB.ajustes.whatsapp || "").replace(/\D/g, "");
      return "https://wa.me/" + n + (texto ? "?text=" + encodeURIComponent(texto) : "");
    },

    guardarPedido: function (pedido) {
      if (!sb) return Promise.resolve({ ok: false });
      return sb.from("pedidos").insert(pedido).then(function (r) { return { ok: !r.error, error: r.error }; },
        function (e) { return { ok: false, error: e }; });
    }
  };

  LIB.ready = (function () {
    var aj = loadAjustes();
    var prods = !sb ? Promise.resolve(null) :
      withTimeout(fetchAll("productos", COLS, function (q) { return q.eq("activo", true); }), 12000)
        .then(function (rows) { return rows && rows.length ? rows.map(mapRow) : null; })
        .catch(function (e) { console.warn("[Libertad] base no disponible, uso catálogo local", e); return null; });
    return Promise.all([aj, prods]).then(function (r) {
      LIB.ajustes = r[0];
      if (r[1]) { LIB.productos = r[1]; LIB.fuente = "db"; return LIB; }
      return cargarBase().then(function () { LIB.productos = fromBase(); LIB.fuente = "base"; return LIB; });
    }).then(function () {
      try { window.dispatchEvent(new CustomEvent("lib:ready")); } catch (e) {}
      return LIB;
    });
  })();
})();
