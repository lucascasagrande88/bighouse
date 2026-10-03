/* FISÚ Helados — interacción. Sin dependencias. */
(() => {
  const doc = document.documentElement;
  doc.classList.add('js');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  /* ---------- Header ---------- */
  const header = $('.site-header');
  let scrolled = null;
  const onScrollHeader = () => { const s = window.scrollY > 24; if (header && s !== scrolled) { header.classList.toggle('is-scrolled', s); scrolled = s; } };
  onScrollHeader();
  window.addEventListener('scroll', onScrollHeader, { passive: true });

  /* ---------- Menú mobile full-screen ---------- */
  const menu = $('#mobile-menu');
  const toggle = $('.menu-toggle');
  if (menu && toggle) {
    const close = $('.mm-close', menu);
    let lastFocus = null;
    const focusables = () => $$('a, button', menu);
    const open = () => {
      lastFocus = document.activeElement;
      menu.classList.add('is-open');
      menu.removeAttribute('inert');
      menu.setAttribute('aria-hidden', 'false');
      toggle.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => close.focus(), 60);
    };
    const shut = () => {
      menu.classList.remove('is-open');
      menu.setAttribute('inert', '');
      menu.setAttribute('aria-hidden', 'true');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      (lastFocus || toggle).focus();
    };
    toggle.addEventListener('click', open);
    close.addEventListener('click', shut);
    $$('nav a', menu).forEach(a => a.addEventListener('click', () => { if (a.hash) shut(); }));
    menu.addEventListener('keydown', e => {
      if (e.key === 'Escape') shut();
      if (e.key === 'Tab') {
        const f = focusables(); const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
  }

  /* ---------- Reveals ---------- */
  const revealEls = $$('[data-reveal]');
  if ('IntersectionObserver' in window && !reduce.matches) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.05 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-in'));
  }

  /* ---------- Parallax de mouse en el hero ---------- */
  const heroes = $$('[data-mouse]');
  if (finePointer.matches && !reduce.matches) {
    heroes.forEach(h => {
      let raf = 0, tx = 0, ty = 0;
      h.addEventListener('pointermove', e => {
        const r = h.getBoundingClientRect();
        tx = ((e.clientX - r.left) / r.width - .5) * 2;
        ty = ((e.clientY - r.top) / r.height - .5) * 2;
        if (!raf) raf = requestAnimationFrame(() => { h.style.setProperty('--mx', tx.toFixed(3)); h.style.setProperty('--my', ty.toFixed(3)); raf = 0; });
      });
      h.addEventListener('pointerleave', () => { h.style.setProperty('--mx', 0); h.style.setProperty('--my', 0); });
    });
  }

  /* ---------- Parallax de scroll (muy suave) ---------- */
  const speedEls = $$('[data-speed]');
  let vh = window.innerHeight;
  const flavors = $('.flavors');
  const steps = flavors ? $$('.flv-step', flavors) : [];
  const navLinks = flavors ? $$('.flv-nav a', flavors) : [];
  const progressBar = flavors ? $('.flv-progress', flavors) : null;
  let active = -1;
  let lastProg = '';

  const setActive = i => {
    if (i === active) return;
    active = i;
    flavors.dataset.active = i;
    steps.forEach((s, k) => s.classList.toggle('is-active', k === i));
    navLinks.forEach((a, k) => { a.classList.toggle('is-active', k === i); a.setAttribute('aria-current', k === i ? 'step' : 'false'); });
  };

  // Parallax interpolado: cada elemento se acerca a su destino un 10% por cuadro (ease-out continuo)
  const pos = new Map();
  let looping = false;
  const parallax = () => {
    let moving = false;
    // 1) todas las lecturas
    const reads = speedEls.map(el => [el, el.getBoundingClientRect()]);
    // 2) todas las escrituras (sin forzar layout entre medio)
    for (const [el, r] of reads) {
      const st = pos.get(el) || { cur: 0 };
      pos.set(el, st);
      if (r.bottom < -300 || r.top > vh + 300) continue;
      const c = (r.top - st.cur + r.height / 2 - vh / 2) / vh;
      const target = c * parseFloat(el.dataset.speed) * 100;
      st.cur += (target - st.cur) * 0.1;
      if (Math.abs(target - st.cur) > 0.05) moving = true;
      el.style.transform = `translate3d(0, ${st.cur.toFixed(2)}px, 0)`;
    }
    if (moving) requestAnimationFrame(parallax); else looping = false;
  };
  const kickParallax = () => { if (!looping && !reduce.matches && speedEls.length) { looping = true; requestAnimationFrame(parallax); } };

  const tick = () => {
    kickParallax();
    if (flavors) {
      const r = flavors.getBoundingClientRect();
      const total = r.height - vh;
      const p = Math.min(1, Math.max(0, -r.top / total));
      const n = steps.length;
      setActive(Math.min(n - 1, Math.floor(p * n * 0.999)));
      const pr = p.toFixed(3);
      if (progressBar && pr !== lastProg) { progressBar.style.setProperty('--prog', pr); lastProg = pr; }
    }
  };
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { tick(); ticking = false; }); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => { vh = window.innerHeight; onScroll(); });
  if (flavors) setActive(0);
  tick();

  /* Navegación por sabor: lleva al tramo de scroll de cada paso */
  navLinks.forEach((a, k) => a.addEventListener('click', e => {
    e.preventDefault();
    const r = flavors.getBoundingClientRect();
    const total = r.height - vh;
    const y = window.scrollY + r.top + total * ((k + .5) / steps.length);
    window.scrollTo({ top: y, behavior: reduce.matches ? 'auto' : 'smooth' });
  }));

  /* ---------- Módulos que responden al cursor ---------- */
  if (finePointer.matches && !reduce.matches) {
    $$('[data-tilt]').forEach(el => {
      const img = $('.m-img, .pc-img', el);
      if (!img) return;
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        img.style.translate = `${(x * 18).toFixed(1)}px ${(y * 14).toFixed(1)}px`;
      });
      el.addEventListener('pointerleave', () => { img.style.translate = '0 0'; });
    });
  }

  /* ---------- Filtros del catálogo ---------- */
  const filterBar = $('.filters');
  if (filterBar) {
    const cards = $$('.catalog-grid .pcard');
    const status = $('.catalog-status');
    filterBar.addEventListener('click', e => {
      const b = e.target.closest('button[data-filter]');
      if (!b) return;
      const f = b.dataset.filter;
      $$('button', filterBar).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      let k = 0;
      cards.forEach(c => {
        const show = f === 'todos' || c.dataset.cats.split(' ').includes(f);
        c.hidden = !show;
        c.classList.remove('is-filtering');
        if (show) { void c.offsetWidth; c.style.setProperty('--k', k++); c.classList.add('is-filtering'); }
      });
      if (status) status.textContent = `${k} ${k === 1 ? 'producto' : 'productos'}${f === 'todos' ? '' : ' en ' + b.dataset.label}.`;
    });
  }

  /* Pausar animaciones decorativas fuera de pantalla (ahorra batería en mobile) */
  if ('IntersectionObserver' in window) {
    const pio = new IntersectionObserver(entries => entries.forEach(en => {
      en.target.style.setProperty('--play', en.isIntersecting ? 'running' : 'paused');
      $$('.drift, .drift-b, .float, .marquee-track', en.target).forEach(x => { x.style.animationPlayState = en.isIntersecting ? 'running' : 'paused'; });
    }));
    $$('section, footer').forEach(s => pio.observe(s));
  }
})();
