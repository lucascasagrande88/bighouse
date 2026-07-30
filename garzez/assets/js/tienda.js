/* ══════════════════════════════════════════════════
   GARZEZ — Motor de tienda
   Carrito en localStorage, grilla, filtros, detalle
   de producto y checkout por WhatsApp.
   Sin dependencias, sin build.
   ══════════════════════════════════════════════════ */

(function () {
  'use strict';

  const CFG = window.GARZEZ_CONFIG;
  const PRODUCTOS = window.GARZEZ_PRODUCTOS;
  const BASE = window.GARZEZ_BASE || '';
  const CLAVE = 'garzez_carrito_v1';

  /* ─────────── Utilidades ─────────── */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const precio = (n) => CFG.simbolo + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const porSlug = (slug) => PRODUCTOS.find(p => p.slug === slug);
  const imagen = (p, colorSlug, vista) => `${BASE}assets/img/productos/${p.slug}-${colorSlug}-${vista}.svg`;

  const stockDe = (p, colorSlug, talle) => {
    const c = p.colores.find(c => c.slug === colorSlug);
    return c ? (c.stock[talle] || 0) : 0;
  };
  const stockTotal = (p) => p.colores.reduce((t, c) => t + Object.values(c.stock).reduce((a, b) => a + b, 0), 0);
  const tallesConStock = (p) => p.talles.filter(t => p.colores.some(c => (c.stock[t] || 0) > 0));

  function toast(msg) {
    let el = $('.toast');
    if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove('show'), 2600);
  }

  /* ─────────── Carrito ─────────── */
  const Carrito = {
    items: [],

    cargar() {
      try { this.items = JSON.parse(localStorage.getItem(CLAVE)) || []; }
      catch (e) { this.items = []; }
      // Descarta líneas de productos que ya no existen en el catálogo
      this.items = this.items.filter(i => porSlug(i.slug));
      return this.items;
    },
    guardar() {
      try { localStorage.setItem(CLAVE, JSON.stringify(this.items)); } catch (e) { /* modo privado */ }
      this.pintarContador();
      pintarDrawer();
      if ($('#cartPage')) pintarPaginaCarrito();
    },
    id: (slug, color, talle) => `${slug}|${color}|${talle}`,

    agregar(slug, color, talle, cant = 1) {
      const p = porSlug(slug);
      if (!p) return;
      const disponible = stockDe(p, color, talle);
      const id = this.id(slug, color, talle);
      const linea = this.items.find(i => i.id === id);
      const yaEnCarrito = linea ? linea.cant : 0;

      if (yaEnCarrito + cant > disponible) {
        const resto = disponible - yaEnCarrito;
        if (resto <= 0) { toast('No queda más stock de ese talle'); return false; }
        cant = resto;
        toast(`Solo quedan ${resto} unidades`);
      }
      if (linea) linea.cant += cant;
      else this.items.push({ id, slug, color, talle, cant });
      this.guardar();
      return true;
    },
    cambiarCantidad(id, delta) {
      const linea = this.items.find(i => i.id === id);
      if (!linea) return;
      const p = porSlug(linea.slug);
      const disponible = stockDe(p, linea.color, linea.talle);
      const nueva = linea.cant + delta;
      if (nueva <= 0) return this.quitar(id);
      if (nueva > disponible) { toast('Llegaste al stock disponible'); return; }
      linea.cant = nueva;
      this.guardar();
    },
    quitar(id) {
      this.items = this.items.filter(i => i.id !== id);
      this.guardar();
    },
    vaciar() { this.items = []; this.guardar(); },

    cantidad() { return this.items.reduce((t, i) => t + i.cant, 0); },
    subtotal() {
      return this.items.reduce((t, i) => {
        const p = porSlug(i.slug);
        return t + (p ? p.precio * i.cant : 0);
      }, 0);
    },
    envio() {
      if (!this.items.length) return 0;
      return this.subtotal() >= CFG.envioGratisDesde ? 0 : CFG.costoEnvio;
    },
    descuento() {
      const cupon = this.cuponActivo();
      if (!cupon) return 0;
      const sub = this.subtotal();
      const monto = cupon.tipo === 'porcentaje' ? sub * cupon.valor / 100 : cupon.valor;
      return Math.min(monto, sub);
    },
    cuponActivo() {
      const cod = localStorage.getItem('garzez_cupon');
      return cod && CFG.cupones[cod] ? Object.assign({ codigo: cod }, CFG.cupones[cod]) : null;
    },
    total() { return Math.max(0, this.subtotal() - this.descuento()) + this.envio(); },

    pintarContador() {
      const n = this.cantidad();
      $$('[data-cart-count]').forEach(el => {
        el.textContent = n;
        el.dataset.empty = n === 0 ? 'true' : 'false';
      });
    }
  };

  /* ─────────── Mensaje de WhatsApp ─────────── */
  function enlaceWhatsApp() {
    if (!Carrito.items.length) return null;
    const lineas = Carrito.items.map(i => {
      const p = porSlug(i.slug);
      const c = p.colores.find(c => c.slug === i.color);
      return `• ${p.nombre} — ${c ? c.nombre : i.color} / Talle ${i.talle} × ${i.cant} — ${precio(p.precio * i.cant)}`;
    });
    const cupon = Carrito.cuponActivo();
    const texto = [
      '¡Hola Garzez! Quiero cerrar este pedido:',
      '',
      ...lineas,
      '',
      `Subtotal: ${precio(Carrito.subtotal())}`,
      cupon ? `Cupón ${cupon.codigo}: -${precio(Carrito.descuento())}` : null,
      `Envío: ${Carrito.envio() === 0 ? 'Gratis' : precio(Carrito.envio())}`,
      `Total: ${precio(Carrito.total())}`,
      '',
      'Mis datos para el envío:',
      'Nombre:',
      'Dirección:',
      'Ciudad / país:'
    ].filter(Boolean).join('\n');
    return `https://wa.me/${CFG.whatsapp}?text=${encodeURIComponent(texto)}`;
  }

  /* ─────────── Drawer del carrito ─────────── */
  function montarDrawer() {
    if ($('#cartDrawer')) return;
    const html = `
      <div class="drawer-scrim" id="cartScrim"></div>
      <aside class="drawer" id="cartDrawer" aria-label="Carrito" aria-hidden="true">
        <div class="drawer-head">
          <h3>Tu carrito <span class="mono" data-cart-count>0</span></h3>
          <button class="drawer-close" data-cart-close aria-label="Cerrar carrito">&times;</button>
        </div>
        <div class="drawer-body" id="cartLines"></div>
        <div class="drawer-foot" id="cartFoot"></div>
      </aside>`;
    document.body.insertAdjacentHTML('beforeend', html);

    $('#cartScrim').addEventListener('click', cerrarDrawer);
    $('[data-cart-close]').addEventListener('click', cerrarDrawer);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarDrawer(); });
  }
  function abrirDrawer() {
    montarDrawer(); pintarDrawer();
    $('#cartDrawer').classList.add('open');
    $('#cartDrawer').setAttribute('aria-hidden', 'false');
    $('#cartScrim').classList.add('open');
  }
  function cerrarDrawer() {
    const d = $('#cartDrawer');
    if (!d) return;
    d.classList.remove('open');
    d.setAttribute('aria-hidden', 'true');
    $('#cartScrim').classList.remove('open');
  }

  function lineaHTML(i) {
    const p = porSlug(i.slug);
    const c = p.colores.find(c => c.slug === i.color);
    return `
      <div class="line">
        <a class="line-media" href="${BASE}producto/?p=${p.slug}&c=${i.color}">
          <img src="${imagen(p, i.color, 'frente')}" alt="${p.nombre}" loading="lazy">
        </a>
        <div>
          <div class="line-top">
            <a class="line-name" href="${BASE}producto/?p=${p.slug}&c=${i.color}">${p.nombre}</a>
            <span class="line-price">${precio(p.precio * i.cant)}</span>
          </div>
          <div class="line-meta">${c ? c.nombre : i.color} · Talle ${i.talle}</div>
          <div class="line-actions">
            <div class="line-qty">
              <button data-qty="-1" data-id="${i.id}" aria-label="Restar uno">−</button>
              <span>${i.cant}</span>
              <button data-qty="1" data-id="${i.id}" aria-label="Sumar uno">+</button>
            </div>
            <button class="line-remove" data-remove="${i.id}">Quitar</button>
          </div>
        </div>
      </div>`;
  }

  function pintarDrawer() {
    const cuerpo = $('#cartLines'), pie = $('#cartFoot');
    if (!cuerpo) return;

    if (!Carrito.items.length) {
      cuerpo.innerHTML = `
        <div class="drawer-empty">
          <h3>Carrito vacío</h3>
          <p>Todavía no elegiste nada. El Drop 04 está online.</p>
          <a href="${BASE}tienda/" class="btn btn-solid btn-block">Ver la tienda</a>
        </div>`;
      pie.innerHTML = '';
      return;
    }

    cuerpo.innerHTML = Carrito.items.map(lineaHTML).join('');
    const falta = CFG.envioGratisDesde - Carrito.subtotal();
    pie.innerHTML = `
      <div class="totals">
        <div><span>Subtotal</span><span>${precio(Carrito.subtotal())}</span></div>
        ${Carrito.descuento() ? `<div><span>Cupón ${Carrito.cuponActivo().codigo}</span><span>−${precio(Carrito.descuento())}</span></div>` : ''}
        <div><span>Envío</span><span>${Carrito.envio() === 0 ? 'Gratis' : precio(Carrito.envio())}</span></div>
        <div class="grand"><span>Total</span><span>${precio(Carrito.total())}</span></div>
      </div>
      ${falta > 0 ? `<p class="ship-note">Te faltan ${precio(falta)} para el envío gratis.</p>` : ''}
      <a href="${BASE}carrito/" class="btn btn-solid btn-block" style="margin-top:14px">Ir al carrito</a>`;

    cuerpo.onclick = manejarAccionesLinea;
  }

  function manejarAccionesLinea(e) {
    const btnQty = e.target.closest('[data-qty]');
    if (btnQty) { Carrito.cambiarCantidad(btnQty.dataset.id, Number(btnQty.dataset.qty)); return; }
    const btnDel = e.target.closest('[data-remove]');
    if (btnDel) { Carrito.quitar(btnDel.dataset.remove); }
  }

  /* ─────────── Tarjeta de producto ─────────── */
  function tarjetaHTML(p) {
    const color = p.colores[0];
    const sinStock = stockTotal(p) === 0;
    const talleUnico = p.talles.length === 1;
    const etiquetas = [];
    if (p.nuevo) etiquetas.push('<span class="tag yellow">Nuevo</span>');
    if (p.edicionLimitada) etiquetas.push('<span class="tag red">Edición limitada</span>');
    if (p.precioAnterior) etiquetas.push('<span class="tag blue">Oferta</span>');
    if (sinStock) etiquetas.push('<span class="tag ghost">Agotado</span>');
    else if (stockTotal(p) <= 6) etiquetas.push('<span class="tag ghost">Últimas unidades</span>');

    return `
      <article class="card ${sinStock ? 'agotado' : ''}">
        <a href="${BASE}producto/?p=${p.slug}" class="card-media">
          <img class="main" src="${imagen(p, color.slug, 'frente')}" alt="${p.nombre} ${color.nombre}" loading="lazy" width="800" height="1000">
          <img class="alt" src="${imagen(p, color.slug, 'espalda')}" alt="" loading="lazy" width="800" height="1000">
          ${etiquetas.length ? `<div class="card-tags">${etiquetas.join('')}</div>` : ''}
          ${sinStock ? '' : `<div class="card-quick">
            ${talleUnico
              ? `<button class="btn" data-add-rapido="${p.slug}">Agregar — ${precio(p.precio)}</button>`
              : `<span class="btn">Elegir talle</span>`}
          </div>`}
        </a>
        <div class="card-body">
          <div>
            <a href="${BASE}producto/?p=${p.slug}" class="card-name">${p.nombre}</a>
            <div class="card-meta">${p.coleccion}</div>
            <div class="card-swatches">${p.colores.map(c => `<i style="background:${c.hex}" title="${c.nombre}"></i>`).join('')}</div>
          </div>
          <div class="card-price">${p.precioAnterior ? `<s>${precio(p.precioAnterior)}</s>` : ''}${precio(p.precio)}</div>
        </div>
      </article>`;
  }

  function pintarGrilla(contenedor, lista) {
    contenedor.innerHTML = lista.map(tarjetaHTML).join('');
  }

  /* ─────────── Home ─────────── */
  function iniciarHome() {
    const destacados = $('#gridDestacados');
    if (destacados) pintarGrilla(destacados, PRODUCTOS.filter(p => p.destacado).slice(0, 4));

    const nuevos = $('#gridNuevos');
    if (nuevos) {
      const lista = PRODUCTOS.filter(p => p.nuevo);
      const relleno = PRODUCTOS.filter(p => !p.nuevo && stockTotal(p) > 0);
      pintarGrilla(nuevos, lista.concat(relleno).slice(0, 8));
    }
  }

  /* ─────────── Tienda ─────────── */
  const estado = { cat: [], col: [], talle: [], precio: [], soloStock: false, orden: 'destacados' };

  function leerURL() {
    const q = new URLSearchParams(location.search);
    if (q.get('cat')) estado.cat = q.get('cat').split(',');
    if (q.get('col')) estado.col = q.get('col').split(',');
    if (q.get('orden')) estado.orden = q.get('orden');
  }
  function escribirURL() {
    const q = new URLSearchParams();
    if (estado.cat.length) q.set('cat', estado.cat.join(','));
    if (estado.col.length) q.set('col', estado.col.join(','));
    if (estado.orden !== 'destacados') q.set('orden', estado.orden);
    const s = q.toString();
    history.replaceState(null, '', s ? `?${s}` : location.pathname);
  }

  const RANGOS = {
    '0-60':   p => p.precio < 60,
    '60-100': p => p.precio >= 60 && p.precio < 100,
    '100-150': p => p.precio >= 100 && p.precio < 150,
    '150+':   p => p.precio >= 150
  };

  function filtrar() {
    let lista = PRODUCTOS.slice();
    if (estado.cat.length) lista = lista.filter(p => estado.cat.includes(p.categoria));
    if (estado.col.length) lista = lista.filter(p => estado.col.includes(p.coleccionSlug));
    if (estado.talle.length) lista = lista.filter(p => estado.talle.some(t => tallesConStock(p).includes(t)));
    if (estado.precio.length) lista = lista.filter(p => estado.precio.some(r => RANGOS[r](p)));
    if (estado.soloStock) lista = lista.filter(p => stockTotal(p) > 0);

    const orden = {
      'destacados': (a, b) => (b.destacado - a.destacado) || (b.nuevo - a.nuevo),
      'nuevos': (a, b) => (b.nuevo - a.nuevo) || a.nombre.localeCompare(b.nombre),
      'precio-asc': (a, b) => a.precio - b.precio,
      'precio-desc': (a, b) => b.precio - a.precio,
      'nombre': (a, b) => a.nombre.localeCompare(b.nombre)
    }[estado.orden];
    return lista.sort(orden);
  }

  function pintarTienda() {
    const lista = filtrar();
    const grid = $('#gridTienda');
    const conteo = $('#shopCount');
    if (conteo) conteo.textContent = `${lista.length} ${lista.length === 1 ? 'pieza' : 'piezas'}`;

    if (!lista.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h3>Nada con esos filtros</h3>
          <p>Probá sacando alguna condición o mirá todo el catálogo.</p>
          <button class="btn btn-outline btn-sm" id="resetVacio" style="margin-top:18px">Limpiar filtros</button>
        </div>`;
      const b = $('#resetVacio');
      if (b) b.addEventListener('click', limpiarFiltros);
      return;
    }
    pintarGrilla(grid, lista);
  }

  function limpiarFiltros() {
    estado.cat = []; estado.col = []; estado.talle = []; estado.precio = []; estado.soloStock = false;
    $$('#filtros input[type=checkbox]').forEach(i => { i.checked = false; });
    $$('#filtros .size-chip').forEach(c => c.setAttribute('aria-pressed', 'false'));
    escribirURL(); pintarTienda();
  }

  function iniciarTienda() {
    const grid = $('#gridTienda');
    if (!grid) return;
    leerURL();

    /* Talles únicos presentes en el catálogo, en orden lógico */
    const ORDEN_TALLE = ['S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '35-39', '40-44', 'ÚNICO'];
    const talles = [...new Set(PRODUCTOS.flatMap(p => p.talles))]
      .sort((a, b) => ORDEN_TALLE.indexOf(a) - ORDEN_TALLE.indexOf(b));

    $('#filtroCategorias').innerHTML = window.GARZEZ_CATEGORIAS.map(c => `
      <label class="filter-opt">
        <input type="checkbox" value="${c.slug}" data-filtro="cat" ${estado.cat.includes(c.slug) ? 'checked' : ''}>
        <span>${c.nombre}</span>
        <small>${PRODUCTOS.filter(p => p.categoria === c.slug).length}</small>
      </label>`).join('');

    $('#filtroColecciones').innerHTML = window.GARZEZ_COLECCIONES.map(c => `
      <label class="filter-opt">
        <input type="checkbox" value="${c.slug}" data-filtro="col" ${estado.col.includes(c.slug) ? 'checked' : ''}>
        <span>${c.nombre}</span>
        <small>${PRODUCTOS.filter(p => p.coleccionSlug === c.slug).length}</small>
      </label>`).join('');

    $('#filtroTalles').innerHTML = talles.map(t =>
      `<button class="size-chip" data-talle="${t}" aria-pressed="false">${t}</button>`).join('');

    $('#filtros').addEventListener('change', (e) => {
      const inp = e.target.closest('input[data-filtro]');
      if (inp) {
        const clave = inp.dataset.filtro;
        estado[clave] = $$(`#filtros input[data-filtro="${clave}"]:checked`).map(i => i.value);
      }
      if (e.target.id === 'soloStock') estado.soloStock = e.target.checked;
      escribirURL(); pintarTienda();
    });

    $('#filtros').addEventListener('click', (e) => {
      const chip = e.target.closest('[data-talle]');
      if (!chip) return;
      const activo = chip.getAttribute('aria-pressed') === 'true';
      chip.setAttribute('aria-pressed', String(!activo));
      estado.talle = $$('#filtros [data-talle][aria-pressed="true"]').map(c => c.dataset.talle);
      pintarTienda();
    });

    $('#shopSort').value = estado.orden;
    $('#shopSort').addEventListener('change', (e) => {
      estado.orden = e.target.value; escribirURL(); pintarTienda();
    });
    $('#limpiarFiltros').addEventListener('click', limpiarFiltros);
    $('#abrirFiltros').addEventListener('click', () => $('#filtros').classList.toggle('open'));

    pintarTienda();
  }

  /* ─────────── Detalle de producto ─────────── */
  function iniciarProducto() {
    const cont = $('#pdp');
    if (!cont) return;

    const q = new URLSearchParams(location.search);
    const p = porSlug(q.get('p')) || PRODUCTOS[0];
    let color = p.colores.find(c => c.slug === q.get('c')) || p.colores[0];
    let talle = tallesConStock(p).find(t => stockDe(p, color.slug, t) > 0) || p.talles[0];
    let cant = 1;
    let vista = 'frente';

    document.title = `${p.nombre} — Garzez`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', p.descripcion.slice(0, 155));

    function nivelStock() {
      const s = stockDe(p, color.slug, talle);
      if (s === 0) return { clase: 'out', texto: 'Agotado en este talle' };
      if (s <= 3) return { clase: 'low', texto: `Últimas ${s} unidades` };
      return { clase: '', texto: 'Disponible · sale en 48 h' };
    }

    function pintar() {
      const s = nivelStock();
      const agotado = stockDe(p, color.slug, talle) === 0;

      cont.innerHTML = `
        <div class="pdp-gallery">
          <div class="pdp-thumbs">
            ${['frente', 'espalda'].map(v => `
              <button data-vista="${v}" aria-current="${v === vista}" aria-label="Ver ${v}">
                <img src="${imagen(p, color.slug, v)}" alt="${p.nombre} ${v}" loading="lazy">
              </button>`).join('')}
          </div>
          <div class="pdp-main">
            <img src="${imagen(p, color.slug, vista)}" alt="${p.nombre} — ${color.nombre}" width="800" height="1000">
          </div>
        </div>

        <div class="pdp-info">
          <span class="eyebrow">${p.coleccion} · ${p.sku}</span>
          <h1>${p.nombre}</h1>
          <div class="pdp-price">
            ${p.precioAnterior ? `<s>${precio(p.precioAnterior)}</s>` : ''}
            <span>${precio(p.precio)}</span>
          </div>
          <p class="pdp-tax">Precio final. Impuestos incluidos. Envío calculado en el carrito.</p>
          <p class="pdp-desc">${p.descripcion}</p>

          <div class="opt-block">
            <div class="opt-head">
              <h4>Color</h4><span class="sel">${color.nombre}</span>
            </div>
            <div class="color-row">
              ${p.colores.map(c => `
                <button class="color-dot" data-color="${c.slug}" style="background:${c.hex}"
                        aria-pressed="${c.slug === color.slug}" aria-label="${c.nombre}" title="${c.nombre}"></button>`).join('')}
            </div>
          </div>

          <div class="opt-block">
            <div class="opt-head">
              <h4>Talle</h4>
              <button data-guia>Guía de talles</button>
            </div>
            <div class="size-row">
              ${p.talles.map(t => `
                <button class="size-chip" data-talle="${t}" aria-pressed="${t === talle}"
                        ${stockDe(p, color.slug, t) === 0 ? 'disabled' : ''}>${t}</button>`).join('')}
            </div>
            <p class="pdp-stock"><i class="dot ${s.clase}"></i>${s.texto}</p>
          </div>

          <div class="opt-block">
            <div class="opt-head"><h4>Cantidad</h4></div>
            <div class="qty">
              <button data-cant="-1" aria-label="Restar">−</button>
              <span id="pdpCant">${cant}</span>
              <button data-cant="1" aria-label="Sumar">+</button>
            </div>
          </div>

          <div class="pdp-cta">
            <button class="btn btn-solid btn-lg btn-block" id="pdpAdd" ${agotado ? 'disabled' : ''}>
              ${agotado ? 'Sin stock en este talle' : `Agregar al carrito — ${precio(p.precio * cant)}`}
            </button>
            <a class="btn btn-outline btn-block" id="pdpWa" href="#">Consultar por WhatsApp</a>
          </div>

          <div class="acc">
            <div class="acc-item">
              <button class="acc-btn" aria-expanded="true">Detalles y materiales <i>+</i></button>
              <div class="acc-panel open">
                <ul>${p.detalles.map(d => `<li>${d}</li>`).join('')}</ul>
                <p style="margin-top:12px"><strong>Composición:</strong> ${p.composicion}<br><strong>Calce:</strong> ${p.calce}</p>
              </div>
            </div>
            <div class="acc-item">
              <button class="acc-btn" aria-expanded="false">Envíos <i>+</i></button>
              <div class="acc-panel">
                <ul>
                  <li>Despacho en 48 h hábiles desde Caracas</li>
                  <li>Envío gratis en compras desde ${precio(CFG.envioGratisDesde)}</li>
                  <li>Envío nacional 3 a 5 días · internacional 7 a 15 días</li>
                  <li>Seguimiento por WhatsApp hasta que llega</li>
                </ul>
              </div>
            </div>
            <div class="acc-item">
              <button class="acc-btn" aria-expanded="false">Cambios y devoluciones <i>+</i></button>
              <div class="acc-panel">
                <ul>
                  <li>30 días para cambiar talle sin costo (primer cambio)</li>
                  <li>La prenda debe estar sin uso y con etiqueta</li>
                  <li>Las piezas teñidas a mano son únicas y solo se cambian por falla</li>
                </ul>
              </div>
            </div>
          </div>
        </div>`;

      /* Interacciones */
      $$('[data-vista]', cont).forEach(b => b.addEventListener('click', () => { vista = b.dataset.vista; pintar(); }));
      $$('[data-color]', cont).forEach(b => b.addEventListener('click', () => {
        color = p.colores.find(c => c.slug === b.dataset.color);
        if (stockDe(p, color.slug, talle) === 0) {
          talle = p.talles.find(t => stockDe(p, color.slug, t) > 0) || talle;
        }
        cant = 1;
        history.replaceState(null, '', `?p=${p.slug}&c=${color.slug}`);
        pintar();
      }));
      $$('.size-row [data-talle]', cont).forEach(b => b.addEventListener('click', () => {
        talle = b.dataset.talle; cant = 1; pintar();
      }));
      $$('[data-cant]', cont).forEach(b => b.addEventListener('click', () => {
        const max = stockDe(p, color.slug, talle);
        cant = Math.min(Math.max(1, cant + Number(b.dataset.cant)), Math.max(1, max));
        pintar();
      }));
      const add = $('#pdpAdd', cont);
      if (add) add.addEventListener('click', () => {
        if (Carrito.agregar(p.slug, color.slug, talle, cant)) {
          toast(`${p.nombre} · talle ${talle} agregado`);
          abrirDrawer();
        }
      });
      const wa = $('#pdpWa', cont);
      if (wa) wa.href = `https://wa.me/${CFG.whatsapp}?text=` + encodeURIComponent(
        `Hola Garzez, quiero consultar por ${p.nombre} (${p.sku}) en ${color.nombre}, talle ${talle}.`);

      const guia = $('[data-guia]', cont);
      if (guia) guia.addEventListener('click', () => $('#modalTalles').classList.add('open'));

      activarAcordeones(cont);
    }

    pintar();

    /* Relacionados: misma colección primero, después misma categoría */
    const rel = $('#gridRelacionados');
    if (rel) {
      const otros = PRODUCTOS.filter(x => x.slug !== p.slug);
      const lista = otros.filter(x => x.coleccionSlug === p.coleccionSlug)
        .concat(otros.filter(x => x.categoria === p.categoria && x.coleccionSlug !== p.coleccionSlug));
      pintarGrilla(rel, [...new Set(lista)].slice(0, 4));
    }
  }

  /* ─────────── Página de carrito ─────────── */
  function pintarPaginaCarrito() {
    const cont = $('#cartPage');
    if (!cont) return;
    const resumen = $('#cartSummary');

    if (!Carrito.items.length) {
      cont.innerHTML = `
        <div class="empty-state">
          <h3>Tu carrito está vacío</h3>
          <p>Todavía no hay nada acá. El Drop 04 está online y con stock.</p>
          <a href="${BASE}tienda/" class="btn btn-solid" style="margin-top:20px">Ver la tienda</a>
        </div>`;
      resumen.innerHTML = '';
      return;
    }

    cont.innerHTML = Carrito.items.map(lineaHTML).join('');
    cont.onclick = manejarAccionesLinea;

    const cupon = Carrito.cuponActivo();
    const falta = CFG.envioGratisDesde - Carrito.subtotal();
    resumen.innerHTML = `
      <div class="cart-box">
        <h3>Resumen</h3>
        <div class="coupon">
          <input type="text" id="inputCupon" placeholder="Código de descuento" value="${cupon ? cupon.codigo : ''}">
          <button class="btn btn-outline btn-sm" id="aplicarCupon">${cupon ? 'Quitar' : 'Aplicar'}</button>
        </div>
        <p class="coupon-msg ${cupon ? 'ok' : ''}" id="cuponMsg">${cupon ? `Cupón ${cupon.codigo} aplicado (${cupon.texto})` : ''}</p>
        <div class="totals">
          <div><span>Subtotal</span><span>${precio(Carrito.subtotal())}</span></div>
          ${Carrito.descuento() ? `<div><span>Descuento</span><span>−${precio(Carrito.descuento())}</span></div>` : ''}
          <div><span>Envío</span><span>${Carrito.envio() === 0 ? 'Gratis' : precio(Carrito.envio())}</span></div>
          <div class="grand"><span>Total</span><span>${precio(Carrito.total())}</span></div>
        </div>
        ${falta > 0 ? `<p class="ship-note">Te faltan ${precio(falta)} para el envío gratis.</p>` : ''}
        <a class="btn btn-wa btn-lg btn-block" style="margin-top:18px" id="btnCheckout" href="#" target="_blank" rel="noopener">Finalizar por WhatsApp</a>
        <a class="btn btn-outline btn-block" style="margin-top:10px" href="${BASE}tienda/">Seguir comprando</a>
        <p class="ship-note">Coordinamos pago y envío por WhatsApp: transferencia, Zelle, Pago Móvil o efectivo en el showroom de Caracas.</p>
      </div>`;

    $('#btnCheckout').href = enlaceWhatsApp() || '#';

    $('#aplicarCupon').addEventListener('click', () => {
      const msg = $('#cuponMsg');
      if (Carrito.cuponActivo()) {
        localStorage.removeItem('garzez_cupon');
        Carrito.guardar();
        return;
      }
      const cod = $('#inputCupon').value.trim().toUpperCase();
      if (CFG.cupones[cod]) {
        localStorage.setItem('garzez_cupon', cod);
        Carrito.guardar();
      } else {
        msg.textContent = 'Ese código no existe o venció.';
        msg.className = 'coupon-msg bad';
      }
    });
  }

  /* ─────────── Acordeones ─────────── */
  function activarAcordeones(ctx = document) {
    $$('.acc-btn', ctx).forEach(btn => {
      if (btn._ok) return;
      btn._ok = true;
      btn.addEventListener('click', () => {
        const abierto = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!abierto));
        btn.nextElementSibling.classList.toggle('open', !abierto);
      });
    });
  }

  /* ─────────── Navegación y varios ─────────── */
  function iniciarChrome() {
    const toggle = $('#navToggle'), menu = $('#navLinks');
    if (toggle && menu) {
      toggle.addEventListener('click', () => menu.classList.toggle('open'));
      $$('a', menu).forEach(a => a.addEventListener('click', () => menu.classList.remove('open')));
    }

    $$('[data-cart-open]').forEach(b => b.addEventListener('click', (e) => { e.preventDefault(); abrirDrawer(); }));

    /* Agregar rápido desde la grilla (solo talle único) */
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add-rapido]');
      if (!b) return;
      e.preventDefault();
      const p = porSlug(b.dataset.addRapido);
      const c = p.colores.find(c => (c.stock[p.talles[0]] || 0) > 0) || p.colores[0];
      if (Carrito.agregar(p.slug, c.slug, p.talles[0], 1)) {
        toast(`${p.nombre} agregado`);
        abrirDrawer();
      }
    });

    /* Modal guía de talles */
    const modal = $('#modalTalles');
    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-modal-close]')) modal.classList.remove('open');
      });
      $$('[data-abrir-guia]').forEach(b => b.addEventListener('click', () => modal.classList.add('open')));
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') modal.classList.remove('open'); });
    }

    /* Newsletter (sin backend: deja el mail listo para enviar) */
    const news = $('#newsForm');
    if (news) news.addEventListener('submit', (e) => {
      e.preventDefault();
      toast('¡Listo! Te avisamos antes que a nadie.');
      news.reset();
    });

    activarAcordeones();
  }

  /* ─────────── Arranque ─────────── */
  document.addEventListener('DOMContentLoaded', () => {
    Carrito.cargar();
    montarDrawer();
    iniciarChrome();
    Carrito.pintarContador();
    pintarDrawer();
    iniciarHome();
    iniciarTienda();
    iniciarProducto();
    pintarPaginaCarrito();
  });

  /* Expuesto para depurar desde la consola */
  window.GARZEZ = { Carrito, PRODUCTOS, abrirDrawer };
})();
