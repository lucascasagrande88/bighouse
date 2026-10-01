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

/* Parallax suave en imágenes marcadas */
const floats = [...document.querySelectorAll('[data-float]')];
if (!reduceMotion && floats.length) {
  let ticking = false;
  const update = () => {
    const vh = window.innerHeight;
    floats.forEach((node) => {
      const rect = node.getBoundingClientRect();
      if (rect.bottom < -100 || rect.top > vh + 100) return;
      const center = rect.top + rect.height / 2 - vh / 2;
      const amount = Number(node.dataset.float || 8);
      node.style.setProperty('--float', `${(-center / vh * amount).toFixed(2)}px`);
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(update); }
  }, { passive: true });
  update();
}

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
