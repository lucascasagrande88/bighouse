/* Interacciones compartidas — Psicoanálisis en Barcelona / Sol Galiana / Nahuel Ponce */
document.documentElement.classList.add('js');

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(key) { try { return localStorage.getItem(key); } catch (e) { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch (e) { /* sin almacenamiento */ } }
};

/* Menú móvil */
const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');
function setMenu(open) {
  if (!navToggle || !nav) return;
  navToggle.setAttribute('aria-expanded', String(open));
  nav.dataset.open = String(open);
  document.body.classList.toggle('menu-open', open);
}
navToggle?.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setMenu(false); });

/* Cabecera compacta al hacer scroll + barra de contacto móvil */
const header = document.querySelector('.site-header');
const hero = document.querySelector('[data-hero]');
const dock = document.querySelector('[data-dock]');
const contact = document.querySelector('#contacto');
let contactVisible = false;
function onScroll() {
  const y = window.scrollY;
  header?.classList.toggle('is-scrolled', y > 24);
  if (dock) {
    const past = hero ? y > hero.offsetTop + hero.offsetHeight * 0.6 : y > 600;
    dock.classList.toggle('is-visible', past && !contactVisible);
  }
}
window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* Aparición progresiva */
const revealNodes = document.querySelectorAll('[data-reveal]');
if (!reduceMotion && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  revealNodes.forEach((node) => observer.observe(node));
} else {
  revealNodes.forEach((node) => node.classList.add('is-visible'));
}

if (contact && dock && 'IntersectionObserver' in window) {
  new IntersectionObserver(([entry]) => {
    contactVisible = entry.isIntersecting;
    onScroll();
  }, { threshold: 0.05 }).observe(contact);
}

/* Frases dinámicas */
document.querySelectorAll('[data-rotate]').forEach((holder) => {
  const items = [...holder.querySelectorAll('[data-rotate-item]')];
  if (items.length < 2) return;
  let index = 0;
  items.forEach((item, i) => item.classList.toggle('is-active', i === 0));
  if (reduceMotion) return;
  let timer = setInterval(next, 3400);
  function next() {
    items[index].classList.remove('is-active');
    items[index].classList.add('is-leaving');
    const leaving = items[index];
    setTimeout(() => leaving.classList.remove('is-leaving'), 700);
    index = (index + 1) % items.length;
    items[index].classList.add('is-active');
  }
  document.addEventListener('visibilitychange', () => {
    clearInterval(timer);
    if (!document.hidden) timer = setInterval(next, 3400);
  });
});

/* Vista previa del panel de control (/admin): el texto queda tal cual para poder editarlo */
const cmsPreview = /[?&]cms=original\b/.test(location.search);

/* Texto que se enciende palabra por palabra: [data-words] */
document.querySelectorAll(cmsPreview ? '[data-words-none]' : '[data-words]').forEach((node) => {
  const words = node.textContent.trim().split(/\s+/);
  node.setAttribute('aria-label', node.textContent.trim());
  node.textContent = '';
  words.forEach((word, i) => {
    const span = document.createElement('span');
    span.className = 'w';
    span.setAttribute('aria-hidden', 'true');
    span.style.setProperty('--i', i);
    span.textContent = word;
    node.append(span, ' ');
  });
  node.style.setProperty('--n', words.length);
});

/* Motor de scroll: escribe --p (0→1) en cada elemento animado.
   [data-scroll]  progreso mientras el elemento cruza la pantalla
   [data-pin]     progreso dentro de una sección alta con contenido sticky (+ data-step)
   [data-float]   parallax en px */
(() => {
  const root = document.documentElement;
  const scrolls = [...document.querySelectorAll('[data-scroll]')];
  const pins = [...document.querySelectorAll('[data-pin]')];
  const floats = [...document.querySelectorAll('[data-float]')];
  const clamp = (v) => Math.min(1, Math.max(0, v));

  if (reduceMotion) {
    [...scrolls, ...pins].forEach((n) => { n.style.setProperty('--p', 1); n.dataset.step = (n.dataset.steps || 1) - 1; });
    root.classList.add('scroll-static');
    return;
  }
  root.classList.add('scroll-live');
  if (!scrolls.length && !pins.length && !floats.length) return;

  let vh = window.innerHeight;
  let current = window.scrollY;
  let target = current;
  let running = false;
  let geometry = [];

  function measure() {
    vh = window.innerHeight;
    geometry = [];
    const y = window.scrollY;
    scrolls.forEach((n) => { const r = n.getBoundingClientRect(); geometry.push({ n, type: 's', top: r.top + y, h: r.height }); });
    pins.forEach((n) => { const r = n.getBoundingClientRect(); geometry.push({ n, type: 'p', top: r.top + y, h: n.offsetHeight }); });
    floats.forEach((n) => { const r = n.getBoundingClientRect(); geometry.push({ n, type: 'f', top: r.top + y, h: r.height }); });
  }

  function paint(y) {
    root.style.setProperty('--page', clamp(y / Math.max(1, document.documentElement.scrollHeight - vh)).toFixed(4));
    geometry.forEach((g) => {
      if (g.type === 'p') {
        const p = clamp((y - g.top) / Math.max(1, g.h - vh));
        g.n.style.setProperty('--p', p.toFixed(4));
        const steps = Number(g.n.dataset.steps || 0);
        if (steps) {
          const step = String(Math.min(steps - 1, Math.floor(p * steps)));
          if (g.n.dataset.step !== step) g.n.dataset.step = step;
        }
        return;
      }
      if (g.top - y > vh * 1.4 || g.top + g.h - y < -vh * .4) return;
      if (g.type === 's') {
        const start = Number(g.n.dataset.start || 1);   /* fracción de pantalla donde empieza */
        const span = Number(g.n.dataset.span || .8);    /* cuánto recorrido dura */
        const p = clamp((y + vh * start - g.top) / (vh * span));
        g.n.style.setProperty('--p', p.toFixed(4));
      } else {
        const center = g.top + g.h / 2 - y - vh / 2;
        g.n.style.setProperty('--float', `${(-center / vh * Number(g.n.dataset.float || 8)).toFixed(2)}px`);
      }
    });
  }

  function loop() {
    current += (target - current) * .14;
    if (Math.abs(target - current) < .3) current = target;
    paint(current);
    if (current !== target) requestAnimationFrame(loop); else running = false;
  }
  function kick() {
    target = window.scrollY;
    if (!running) { running = true; requestAnimationFrame(loop); }
  }

  measure();
  paint(current);
  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', () => { measure(); kick(); }, { passive: true });
  window.addEventListener('load', () => { measure(); kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(() => { measure(); kick(); }).observe(document.body);
})();

document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

/* Analítica (GA4) sólo con consentimiento */
const analyticsId = window.SITE_CONFIG?.analyticsMeasurementId || '';
const consent = document.querySelector('[data-consent]');
const validId = /^G-[A-Z0-9]+$/i.test(analyticsId);

function startAnalytics() {
  if (!validId || window.gtag) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', analyticsId, { anonymize_ip: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(analyticsId)}`;
  document.head.appendChild(script);
}

if (validId) {
  const choice = store.get('analytics-consent');
  if (choice === 'granted') startAnalytics();
  if (!choice && consent) consent.hidden = false;
}
document.querySelector('[data-consent-accept]')?.addEventListener('click', () => {
  store.set('analytics-consent', 'granted');
  if (consent) consent.hidden = true;
  startAnalytics();
});
document.querySelector('[data-consent-reject]')?.addEventListener('click', () => {
  store.set('analytics-consent', 'denied');
  if (consent) consent.hidden = true;
});

document.querySelectorAll('[data-track]').forEach((link) => {
  link.addEventListener('click', () => {
    if (window.gtag) window.gtag('event', 'contact_click', { method: link.dataset.track, page_language: document.documentElement.lang });
  });
});
