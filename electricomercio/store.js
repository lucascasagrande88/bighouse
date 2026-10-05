/* ===========================================================================
   ELECTRICOMERCIO — Almacenamiento (DEMO)
   Productos, lista de cotización y datos del pedido en localStorage, bajo un
   namespace propio (EC_CONFIG.storageNs) para no chocar con otros demos.
   =========================================================================== */
window.ECStore = (function () {
  "use strict";
  var CFG = window.EC_CONFIG || {};
  var NS = CFG.storageNs || "electricomercio_demo_v1";
  var PKEY = NS + "_products", LKEY = NS + "_list", MKEY = NS + "_meta", VKEY = NS + "_seed";
  var COLS = ["id", "n", "d", "cat", "unit", "tags", "img", "active", "order"];
  var subs = [];
  var bc = null;
  try { bc = ("BroadcastChannel" in window) ? new BroadcastChannel(NS) : null; } catch (e) { bc = null; }

  function get(k, fb) { try { var v = JSON.parse(localStorage.getItem(k)); return v == null ? fb : v; } catch (e) { return fb; } }
  function set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch (e) { return false; }
  }
  function clean(r, i) {
    var o = {};
    COLS.forEach(function (k) { o[k] = r[k]; });
    o.id = String(o.id || ("p-" + Date.now().toString(36)));
    o.n = String(o.n || "").trim();
    o.d = String(o.d || "");
    o.unit = String(o.unit || "Unidad");
    o.tags = Array.isArray(o.tags) ? o.tags : [];
    o.img = o.img || "";
    o.active = o.active !== false;
    if (o.order == null) o.order = i == null ? 999 : i;
    return o;
  }

  /* ---------- productos ---------- */
  function seed() {
    var list = (window.EC_DEFAULT_PRODUCTS || []).map(clean);
    set(PKEY, list); set(VKEY, window.EC_DATA_VERSION || "1");
    return list;
  }
  function products() {
    var p = get(PKEY, null);
    if (!Array.isArray(p)) p = seed();
    return p.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
  }
  function saveProducts(list) {
    var ok = set(PKEY, list.map(clean));
    if (!ok) alert("No se pudo guardar: el navegador se quedó sin espacio. Probá con fotos más livianas.");
    ping(); return ok;
  }
  function putProduct(rec) {
    var list = products(), r = clean(rec), i = list.findIndex(function (x) { return x.id === r.id; });
    if (i > -1) list[i] = r; else { r.order = list.length; list.push(r); }
    return saveProducts(list);
  }
  function deleteProduct(id) { return saveProducts(products().filter(function (x) { return x.id !== id; })); }
  function resetProducts() { seed(); ping(); }
  function importProducts(arr) {
    if (!Array.isArray(arr)) throw new Error("El archivo no es una lista de productos.");
    var list = arr.filter(function (p) { return p && p.n; }).map(clean);
    if (!list.length) throw new Error("No se encontraron productos válidos.");
    saveProducts(list); return list.length;
  }

  /* ---------- lista de cotización ---------- */
  function list() { var l = get(LKEY, []); return Array.isArray(l) ? l : []; }
  function saveList(l) { set(LKEY, l); ping(); }
  function meta() { return get(MKEY, { project: "", note: "" }) || { project: "", note: "" }; }
  function saveMeta(m) { set(MKEY, m); }

  /* ---------- sincronización entre pestañas (tienda <-> panel) ---------- */
  function ping() { if (bc) { try { bc.postMessage("change"); } catch (e) {} } }
  function fire() { subs.forEach(function (cb) { try { cb(); } catch (e) {} }); }
  function subscribe(cb) { subs.push(cb); }
  window.addEventListener("storage", function (e) { if (e.key && e.key.indexOf(NS) === 0) fire(); });
  if (bc) bc.onmessage = fire;

  function waLink(text) {
    return "https://wa.me/" + ((CFG.contact && CFG.contact.whatsapp) || "") + "?text=" + encodeURIComponent(text);
  }

  return {
    NS: NS, products: products, putProduct: putProduct, deleteProduct: deleteProduct,
    saveProducts: saveProducts, resetProducts: resetProducts, importProducts: importProducts,
    list: list, saveList: saveList, meta: meta, saveMeta: saveMeta, subscribe: subscribe, waLink: waLink
  };
})();

/* Íconos SVG de respaldo por categoría (sin dependencias externas). */
window.EC_ICONS = {
  cable:  '<path d="M4 18c3 0 3-4 6-4s3 4 6 4 3-4 4-4"/><path d="M4 10c3 0 3-4 6-4s3 4 6 4 3-4 4-4"/>',
  breaker:'<rect x="6" y="3" width="12" height="18" rx="2"/><rect x="9.5" y="7" width="5" height="6" rx="1"/><path d="M12 16v2"/>',
  socket: '<rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="9" cy="11" r="1.2"/><circle cx="15" cy="11" r="1.2"/><path d="M12 15v1.5"/>',
  box:    '<path d="M3 8l9-5 9 5v8l-9 5-9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/>',
  bulb:   '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
  plug:   '<path d="M9 2v5M15 2v5"/><path d="M6 7h12v4a6 6 0 0 1-12 0z"/><path d="M12 17v5"/>',
  bolt:   '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  meter:  '<rect x="5" y="2" width="14" height="20" rx="2"/><rect x="8" y="5" width="8" height="5" rx="1"/><circle cx="12" cy="16" r="2.5"/>'
};
window.ecIcon = function (name, size) {
  var p = window.EC_ICONS[name] || window.EC_ICONS.bolt;
  return '<svg viewBox="0 0 24 24" width="' + (size || 24) + '" height="' + (size || 24) + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>';
};
