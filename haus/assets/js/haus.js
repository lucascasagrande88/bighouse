/* ============================================================
   HAUS SELECCIONADOS — JS base
   ============================================================ */
'use strict';

/* Nav scroll */
(function () {
  const nav = document.getElementById('nav');
  if (!nav) return;
  const upd = () => nav.classList.toggle('scrolled', window.scrollY > 40);
  window.addEventListener('scroll', upd, { passive: true });
  upd();
})();

/* Mobile nav */
(function () {
  const btn    = document.getElementById('navToggle');
  const mobile = document.getElementById('navMobile');
  if (!btn || !mobile) return;
  btn.addEventListener('click', () => {
    const open = mobile.classList.toggle('open');
    btn.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  mobile.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      mobile.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    })
  );
})();

/* Strip hero — selección de ángulo */
(function () {
  const strip = document.querySelector('.hero-strip');
  if (!strip) return;
  strip.querySelectorAll('.hero-strip-item').forEach((item, i, all) => {
    item.addEventListener('click', () => {
      all.forEach(s => s.classList.remove('active'));
      item.classList.add('active');
    });
  });
})();

/* Selector 360° — tabs y thumbs */
(function () {
  document.querySelectorAll('.selector360-tab').forEach((tab, i, all) => {
    tab.addEventListener('click', () => {
      all.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
  document.querySelectorAll('.selector360-thumb').forEach((th, i, all) => {
    th.addEventListener('click', () => {
      all.forEach(t => t.classList.remove('active'));
      th.classList.add('active');
    });
  });
})();

/* Ficha thumbs */
(function () {
  document.querySelectorAll('.ficha-thumb').forEach((th, i, all) => {
    th.addEventListener('click', () => {
      all.forEach(t => t.classList.remove('active'));
      th.classList.add('active');
    });
  });
})();

/* Galería sidebar */
(function () {
  document.querySelectorAll('.galeria-sidebar-item').forEach((item, i, all) => {
    item.addEventListener('click', () => {
      all.forEach(t => t.classList.remove('active'));
      item.classList.add('active');
    });
  });
})();

/* Chips / filtros */
(function () {
  document.querySelectorAll('.chip[data-filter]').forEach(chip => {
    chip.addEventListener('click', () => {
      const group = chip.dataset.group;
      if (group) {
        document.querySelectorAll(`.chip[data-group="${group}"]`)
          .forEach(c => c.classList.remove('active'));
      }
      chip.classList.toggle('active');
    });
  });
})();

/* Simulador de financiación */
(function () {
  const form = document.getElementById('simulador');
  if (!form) return;

  const sliders = {
    valor:    { el: form.querySelector('[data-sim="valor"]'),    val: form.querySelector('[data-val="valor"]'),    def: 52900 },
    anticipo: { el: form.querySelector('[data-sim="anticipo"]'), val: form.querySelector('[data-val="anticipo"]'), def: 30 },
    plazo:    { el: form.querySelector('[data-sim="plazo"]'),    val: form.querySelector('[data-val="plazo"]'),    def: 36 },
    cuota0:   { el: form.querySelector('[data-sim="cuota0"]'),   val: form.querySelector('[data-val="cuota0"]'),   def: 2000 },
  };

  const cuotaEl   = document.getElementById('simCuota');
  const financEl  = document.getElementById('simFinanc');
  const tasaEl    = document.getElementById('simTasa');
  const plazoEl   = document.getElementById('simPlazo');
  const totalEl   = document.getElementById('simTotal');

  function calcular () {
    const valor    = +(sliders.valor.el?.value    || 52900);
    const anticPorc= +(sliders.anticipo.el?.value || 30);
    const plazo    = +(sliders.plazo.el?.value    || 36);
    const cuota0   = +(sliders.cuota0.el?.value   || 0);
    const tasa     = 12.9;

    const anticipo = valor * anticPorc / 100;
    const financiar= valor - anticipo - cuota0;
    const r        = tasa / 100 / 12;
    const cuota    = r === 0
      ? financiar / plazo
      : financiar * r / (1 - Math.pow(1 + r, -plazo));
    const total    = cuota * plazo + anticipo + cuota0;

    if (sliders.valor.val)    sliders.valor.val.textContent    = `USD ${valor.toLocaleString('es-AR')}`;
    if (sliders.anticipo.val) sliders.anticipo.val.textContent = `USD ${Math.round(anticipo).toLocaleString('es-AR')} (${anticPorc}%)`;
    if (sliders.plazo.val)    sliders.plazo.val.textContent    = `${plazo} meses`;
    if (sliders.cuota0.val)   sliders.cuota0.val.textContent   = `USD ${cuota0.toLocaleString('es-AR')}`;

    if (cuotaEl)  cuotaEl.textContent  = `USD ${Math.round(cuota).toLocaleString('es-AR')}`;
    if (financEl) financEl.textContent = `USD ${Math.round(financiar).toLocaleString('es-AR')}`;
    if (tasaEl)   tasaEl.textContent   = `${tasa} %`;
    if (plazoEl)  plazoEl.textContent  = `${plazo} meses`;
    if (totalEl)  totalEl.textContent  = `USD ${Math.round(total).toLocaleString('es-AR')}`;
  }

  Object.values(sliders).forEach(({ el }) => {
    if (el) el.addEventListener('input', calcular);
  });
  calcular();
})();

/* Números animados */
(function () {
  const nums = document.querySelectorAll('[data-target]');
  if (!nums.length) return;
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el     = e.target;
      const target = parseInt(el.dataset.target, 10);
      const suffix = el.dataset.suffix || '';
      const dur = 1200;
      const steps = dur / 16;
      let cur = 0;
      const tick = () => {
        cur = Math.min(cur + target / steps, target);
        el.textContent = Math.round(cur).toLocaleString('es-AR') + suffix;
        if (cur < target) requestAnimationFrame(tick);
      };
      tick();
      io.unobserve(el);
    });
  }, { threshold: .5 });
  nums.forEach(n => io.observe(n));
})();

/* Lazy imgs */
(function () {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      if (el.dataset.src) { el.src = el.dataset.src; delete el.dataset.src; }
      obs.unobserve(el);
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll('[data-src]').forEach(el => io.observe(el));
})();

/* Formularios */
(function () {
  document.querySelectorAll('form[data-validate]').forEach(form => {
    form.addEventListener('submit', e => {
      let ok = true;
      form.querySelectorAll('[required]').forEach(el => {
        const blank = !el.value.trim();
        el.classList.toggle('error', blank);
        if (blank) ok = false;
      });
      if (!ok) e.preventDefault();
    });
    form.querySelectorAll('[required]').forEach(el =>
      el.addEventListener('input', () => el.classList.remove('error'))
    );
  });
})();

/* IA chat: quick replies */
(function () {
  document.querySelectorAll('.ia-qr').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = document.querySelector('.ia-input');
      if (input) { input.value = btn.textContent; input.focus(); }
    });
  });
})();
