/* ============================================================
   PÖLCHER — App de pedidos (carrito + cierre por WhatsApp)
   ============================================================ */
(function () {
  "use strict";

  /* ⚠️ REEMPLAZÁ por el WhatsApp real del local (formato internacional, sin +, sin espacios).
     Ej: Argentina 11 5555-4444  ->  5491155554444 */
  var WHATSAPP = "5491100000000";

  var MENU = window.POLCHER_MENU || { burgers: [], birras: [] };
  var money = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  var fmt = function (n) { return (n == null) ? "a confirmar" : money.format(n); };

  var byId = {};
  ["burgers", "birras"].forEach(function (cat) {
    (MENU[cat] || []).forEach(function (p) { byId[p.id] = Object.assign({ cat: cat }, p); });
  });

  /* ---------- Estado del carrito (persistente) ---------- */
  var cart = {};
  try { cart = JSON.parse(localStorage.getItem("polcher_cart") || "{}") || {}; } catch (e) { cart = {}; }
  // limpiar ids que ya no existen
  Object.keys(cart).forEach(function (id) { if (!byId[id]) delete cart[id]; });

  function save() { try { localStorage.setItem("polcher_cart", JSON.stringify(cart)); } catch (e) {} }
  function qtyOf(id) { return cart[id] || 0; }
  function setQty(id, q) {
    q = Math.max(0, q);
    if (q === 0) delete cart[id]; else cart[id] = q;
    save(); renderCart(); syncCard(id);
  }
  function totalCount() { return Object.keys(cart).reduce(function (s, id) { return s + cart[id]; }, 0); }
  function totalPrice() {
    return Object.keys(cart).reduce(function (s, id) {
      var p = byId[id]; return s + (p && p.price ? p.price * cart[id] : 0);
    }, 0);
  }

  /* ---------- Placeholder de imagen de producto ---------- */
  var hexSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>';
  function media(p) {
    if (p.img) return '<img src="' + p.img + '" alt="' + esc(p.name) + '" loading="lazy" />';
    return '<div class="prod-ph">' + hexSvg + '<span class="ph-name">' + esc(p.name) + "</span></div>";
  }
  function specChips(p) {
    if (p.cat !== "birras") return "";
    var chips = [];
    if (p.style) chips.push(p.style);
    if (p.ibu != null) chips.push(p.ibu + " IBU");
    if (p.abv != null) chips.push(p.abv + "% vol");
    return chips.length ? '<div class="prod-meta">' + chips.map(function (c) { return '<span class="spec">' + esc(c) + "</span>"; }).join("") + "</div>" : "";
  }

  /* ---------- Render de productos ---------- */
  var grid = document.getElementById("prodGrid");
  var currentCat = "burgers";

  function controlHtml(p) {
    var q = qtyOf(p.id);
    if (q === 0) return '<button class="add-btn" data-add="' + p.id + '">Agregar</button>';
    return '<div class="stepper" data-stepper="' + p.id + '">' +
             '<button data-dec="' + p.id + '" aria-label="Quitar uno">−</button>' +
             '<span class="qty">' + q + "</span>" +
             '<button data-inc="' + p.id + '" aria-label="Sumar uno">+</button>' +
           "</div>";
  }

  function cardHtml(p) {
    return '<article class="prod" data-card="' + p.id + '">' +
      '<div class="prod-media">' + media(p) +
        (p.tag ? '<span class="prod-tag">' + esc(p.tag) + "</span>" : "") +
      "</div>" +
      '<div class="prod-body">' +
        "<h3>" + esc(p.name) + "</h3>" +
        '<p class="prod-desc">' + esc(p.notes || p.desc || "") + "</p>" +
        specChips(p) +
        '<div class="prod-foot">' +
          '<span class="prod-price">' + fmt(p.price) + (p.cat === "birras" ? " <small>pinta</small>" : "") + "</span>" +
          '<span class="prod-ctrl">' + controlHtml(p) + "</span>" +
        "</div>" +
      "</div>" +
    "</article>";
  }

  function renderGrid() {
    grid.innerHTML = (MENU[currentCat] || []).map(cardHtml).join("");
  }

  function syncCard(id) {
    var card = grid.querySelector('[data-card="' + id + '"]');
    if (!card) return;
    var ctrl = card.querySelector(".prod-ctrl");
    if (ctrl) ctrl.innerHTML = controlHtml(byId[id]);
  }

  /* delegación de clicks en la grilla */
  grid.addEventListener("click", function (e) {
    var add = e.target.closest("[data-add]");
    var inc = e.target.closest("[data-inc]");
    var dec = e.target.closest("[data-dec]");
    if (add) setQty(add.getAttribute("data-add"), qtyOf(add.getAttribute("data-add")) + 1);
    else if (inc) setQty(inc.getAttribute("data-inc"), qtyOf(inc.getAttribute("data-inc")) + 1);
    else if (dec) setQty(dec.getAttribute("data-dec"), qtyOf(dec.getAttribute("data-dec")) - 1);
  });

  /* tabs de categoría */
  document.querySelectorAll(".cat-tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      currentCat = tab.getAttribute("data-cat");
      document.querySelectorAll(".cat-tab").forEach(function (t) {
        var a = t === tab; t.classList.toggle("is-active", a); t.setAttribute("aria-selected", a ? "true" : "false");
      });
      renderGrid();
    });
  });

  /* ---------- Carrito (drawer) ---------- */
  var cartEl = document.getElementById("cart");
  var overlay = document.getElementById("cartOverlay");
  var cartBody = document.getElementById("cartBody");
  var checkoutForm = document.getElementById("checkoutForm");
  var cartCount = document.getElementById("cartCount");
  var fab = document.getElementById("cartFab");
  var fabCount = document.getElementById("fabCount");
  var fabTotal = document.getElementById("fabTotal");
  var cartTotalEl = document.getElementById("cartTotal");

  function openCart() {
    cartEl.classList.add("open"); cartEl.setAttribute("aria-hidden", "false");
    overlay.hidden = false; document.body.style.overflow = "hidden";
  }
  function closeCart() {
    cartEl.classList.remove("open"); cartEl.setAttribute("aria-hidden", "true");
    overlay.hidden = true; document.body.style.overflow = "";
  }
  document.getElementById("cartBtn").addEventListener("click", openCart);
  document.getElementById("cartClose").addEventListener("click", closeCart);
  overlay.addEventListener("click", closeCart);
  fab.addEventListener("click", openCart);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCart(); });

  var emptyHtml =
    '<div class="cart-empty">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.2 12.4a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.3L21 7H5.5"/></svg>' +
      "<p>Tu pedido está vacío.<br>Sumá unas burgers y unas birras 🍔🍺</p>" +
    "</div>";

  function renderCart() {
    var ids = Object.keys(cart);
    var count = totalCount();
    var total = totalPrice();

    // badges
    cartCount.hidden = count === 0; cartCount.textContent = count;
    if (count > 0) { fab.hidden = false; fabCount.textContent = count; fabTotal.textContent = money.format(total); }
    else fab.hidden = true;

    if (ids.length === 0) {
      cartBody.innerHTML = emptyHtml;
      checkoutForm.hidden = true;
      return;
    }
    checkoutForm.hidden = false;
    cartBody.innerHTML = ids.map(function (id) {
      var p = byId[id], q = cart[id];
      return '<div class="ci">' +
        '<div class="ci-info">' +
          "<h4>" + esc(p.name) + "</h4>" +
          '<span class="ci-unit">' + fmt(p.price) + " c/u</span>" +
        "</div>" +
        '<div class="ci-right">' +
          '<div class="stepper">' +
            '<button data-dec="' + id + '" aria-label="Quitar uno">−</button>' +
            '<span class="qty">' + q + "</span>" +
            '<button data-inc="' + id + '" aria-label="Sumar uno">+</button>' +
          "</div>" +
          '<span class="ci-price">' + fmt(p.price ? p.price * q : null) + "</span>" +
        "</div>" +
      "</div>";
    }).join("");
    cartTotalEl.textContent = money.format(total);
  }

  cartBody.addEventListener("click", function (e) {
    var inc = e.target.closest("[data-inc]");
    var dec = e.target.closest("[data-dec]");
    if (inc) setQty(inc.getAttribute("data-inc"), qtyOf(inc.getAttribute("data-inc")) + 1);
    else if (dec) setQty(dec.getAttribute("data-dec"), qtyOf(dec.getAttribute("data-dec")) - 1);
  });

  /* ---------- Checkout ---------- */
  var addrField = document.getElementById("addrField");
  checkoutForm.addEventListener("change", function (e) {
    if (e.target.name === "mode") {
      var delivery = e.target.value === "Delivery";
      addrField.hidden = !delivery;
      document.getElementById("fAddr").required = delivery;
    }
  });

  checkoutForm.addEventListener("submit", function (e) {
    e.preventDefault();
    if (totalCount() === 0) return;
    var name = document.getElementById("fName").value.trim();
    var mode = (checkoutForm.querySelector('input[name="mode"]:checked') || {}).value || "Retiro en el local";
    var addr = document.getElementById("fAddr").value.trim();
    var notes = document.getElementById("fNotes").value.trim();

    var lines = ["¡Hola Pölcher! 🍔🍺 Te hago un pedido:", ""];
    Object.keys(cart).forEach(function (id) {
      var p = byId[id], q = cart[id];
      lines.push("• " + q + "x " + p.name + " — " + fmt(p.price ? p.price * q : null));
    });
    lines.push("");
    lines.push("Total: " + money.format(totalPrice()));
    lines.push("Entrega: " + mode);
    if (mode === "Delivery" && addr) lines.push("Dirección: " + addr);
    if (name) lines.push("Nombre: " + name);
    if (notes) lines.push("Aclaraciones: " + notes);

    var url = "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(lines.join("\n"));
    window.open(url, "_blank", "noopener");
  });

  /* ---------- util ---------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ---------- init ---------- */
  renderGrid();
  renderCart();
})();
