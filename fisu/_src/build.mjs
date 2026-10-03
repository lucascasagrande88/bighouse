// FISÚ — generador estático.  Uso:  node fisu/_src/build.mjs
// Genera: fisu/index.html, fisu/productos/<slug>/index.html, fisu/sitemap.xml
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, PRODUCTS, CATEGORIES, bySlug } from './data.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const IMG = JSON.parse(readFileSync(join(ROOT, 'assets/img/manifest.json'), 'utf8'));
const V = '8'; // versión de assets (cache busting)
const B = SITE.base;
const abs = p => SITE.url + p;

/* ---------------------------------------------------------------- helpers */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// Generador de formas orgánicas determinístico (curvas suaves cerradas)
function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
function blobPath(seed, { n = 7, irr = .2, sx = 1, sy = 1 } = {}) {
  const r = rng(seed * 7919 + 13), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + (r() - .5) * .35;
    const rad = 92 * (1 - irr * r());
    pts.push([100 + Math.cos(a) * rad * sx, 100 + Math.sin(a) * rad * sy]);
  }
  const P = i => pts[(i + n) % n];
  let d = `M${P(0)[0].toFixed(1)},${P(0)[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}

/* Componente: OrganicBlob */
const OrganicBlob = ({ seed = 1, cls = '', style = '', color = 'currentColor', irr = .2, n = 7, anim = 'drift', dur }) =>
  `<div class="blob ${anim} ${cls}" style="${style}${dur ? `;--dur:${dur}s` : ''}" aria-hidden="true"><svg viewBox="0 0 200 200" preserveAspectRatio="none"><path fill="${color}" d="${blobPath(seed, { irr, n })}"/></svg></div>`;
const blobSvg = (seed, irr = .2, n = 7) => `<svg viewBox="0 0 200 200" aria-hidden="true"><path fill="currentColor" d="${blobPath(seed, { irr, n })}"/></svg>`;

/* Gotas / splash del brand book */
const DROP = 'M0,-14C4.5,-6 8,-1.5 8,3.5A8,8 0 0 1 -8,3.5C-8,-1.5 -4.5,-6 0,-14Z';
const Splash = ({ cls = '', style = '', color = 'currentColor', rot = 0 } = {}) =>
  `<div class="splash ${cls}" style="${style}" aria-hidden="true"><svg viewBox="0 0 100 100"><g fill="${color}" transform="rotate(${rot} 50 50)">
    <path d="${DROP}" transform="translate(50 26) scale(1.25)"/><path d="${DROP}" transform="translate(76 42) rotate(55) scale(1)"/><path d="${DROP}" transform="translate(24 44) rotate(-55) scale(.85)"/></g></svg></div>`;
const splashSvg = (rot = 0) => `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="currentColor" transform="rotate(${rot} 50 50)"><path d="${DROP}" transform="translate(50 26) scale(1.25)"/><path d="${DROP}" transform="translate(76 42) rotate(55)"/><path d="${DROP}" transform="translate(24 44) rotate(-55) scale(.85)"/></g></svg>`;

const ARROW = '<svg class="arr" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
const ARROW_UR = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 17 17 7M9 7h8v8"/></svg>';
const SWIPE = '<svg viewBox="0 0 40 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h34M30 2l6 6-6 6"/></svg>';

/* Imagen de producto responsive (AVIF + WebP, dimensiones explícitas → CLS 0) */
function Pic(name, { alt = '', cls = '', sizes = '50vw', eager = false, style = '' } = {}) {
  const m = IMG[name];
  if (!m) throw new Error('Imagen faltante: ' + name);
  const set = ext => m.sizes.map(w => `${B}/assets/img/${name}-${w}.${ext} ${w}w`).join(', ');
  const big = Math.max(...m.sizes);
  return `<picture class="${cls}" style="${style}"><source type="image/avif" srcset="${set('avif')}" sizes="${sizes}"><img src="${B}/assets/img/${name}-${big}.webp" srcset="${set('webp')}" sizes="${sizes}" width="${m.w}" height="${m.h}" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
const altOf = p => `${p.name} FISÚ: ${p.flavorLine.toLowerCase()}`;

/* Componente: BrandHeading — títulos que entran por palabras */
function BrandHeading(tag, html, cls = '', attrs = '') {
  let i = 0;
  // Envuelve cada palabra; respeta <span class=..>…</span> y <br>
  const out = html.replace(/(<[^>]+>)|([^<\s]+)/g, (m, t, w) => t ? t : `<span class="w"><span style="--i:${i++}">${w}</span></span>`);
  return `<${tag} class="bh ${cls}" data-reveal ${attrs}>${out}</${tag}>`;
}

/* Componente: FloatingIngredient */
const FloatingIngredient = (name, { x, y, w, r = 0, i = 0, sp = 40, cls = '' }) =>
  `<div class="flv-ing ${cls}" style="--x:${x};--y:${y};--w:${w};--ir:${r}deg;--i:${i};--sp:${sp}px" aria-hidden="true"><div class="float" style="--dur:${6 + (i % 3)}s">${Pic(name, { sizes: '160px' })}</div></div>`;

/* ---------------------------------------------------------------- layout */
const LOGO = `${B}/assets/logo.svg`;
const LOGO_W = `${B}/assets/logo-white.svg`;

const NAV = [
  ['Productos', '#productos'], ['Sabores', '#sabores'], ['FISÚ', '#fisu'], ['Dónde encontrar', '#donde'], ['Contacto', '#contacto'],
];
const navHref = (h, home) => home ? h : `${B}/${h}`;

function Header({ home }) {
  const links = NAV.map(([t, h]) => `<a href="${navHref(h, home)}">${t}</a>`).join('');
  return `
<a class="skip-link" href="#main">Saltar al contenido</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand-link" href="${B}/" aria-label="FISÚ helados, inicio"><img class="logo-c" src="${LOGO}" width="790" height="436" alt="FISÚ helados"><img class="logo-w" src="${LOGO_W}" width="790" height="436" alt=""></a>
    <nav class="main-nav" aria-label="Principal">${links}<a class="btn" href="${navHref('#catalogo', home)}">Ver productos</a></nav>
    <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="mobile-menu" aria-label="Abrir menú">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h11"/></svg>
    </button>
  </div>
</header>
<div class="mobile-menu" id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menú" aria-hidden="true" inert>
  ${OrganicBlob({ seed: 41, cls: 'mm-blob', style: 'width:90vw;height:70vw;right:-38vw;bottom:-14vw', color: 'var(--fisu-yellow)', anim: 'drift' })}
  ${OrganicBlob({ seed: 42, cls: 'mm-blob', style: 'width:60vw;height:60vw;left:-30vw;bottom:22vh', color: 'var(--fisu-lilac)', anim: 'drift-b' })}
  ${OrganicBlob({ seed: 43, cls: 'mm-blob', style: 'width:46vw;height:46vw;right:-16vw;top:26vh', color: 'var(--fisu-blue)', anim: 'drift' })}
  <div class="mm-top"><img src="${LOGO_W}" width="790" height="436" alt="FISÚ helados">
    <button class="mm-close" type="button" aria-label="Cerrar menú"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
  <nav aria-label="Menú mobile">
    ${NAV.map(([t, h], i) => `<a href="${navHref(h, home)}" style="--i:${i}">${t}</a>`).join('')}
    <a href="${navHref('#catalogo', home)}" style="--i:${NAV.length}"><span>Ver productos</span></a>
  </nav>
  <div class="mm-foot"><p>Ese momento pide FISÚ.</p><a class="btn btn-white pinkfg" href="${SITE.instagram}" rel="noopener" target="_blank">Seguinos en Instagram</a></div>
</div>`;
}

const ICON_IG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor" stroke="none"/></svg>';
const ICON_WA = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.5 14.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.7.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35M12.05 21.8a9.9 9.9 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88a9.9 9.9 0 0 1 9.88 9.9c0 5.45-4.44 9.87-9.89 9.87M20.46 3.5A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45c6.55 0 11.89-5.34 11.89-11.9 0-3.17-1.24-6.16-3.48-8.4"/></svg>';
const ICON_MAIL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="4"/><path d="m4 8 8 5.5L20 8"/></svg>';

function Footer() {
  const prod = PRODUCTS.slice(0, 6).map(p => `<li><a href="${B}/productos/${p.slug}/">${esc(p.name)}</a></li>`).join('');
  return `
<footer class="site-footer on-color" id="contacto">
  <img class="f-giant" src="${LOGO_W}" alt="" aria-hidden="true" width="790" height="436" loading="lazy">
  <div class="wrap">
    <div class="f-top">
      <div class="f-brand">
        <img class="f-logo" src="${LOGO_W}" width="790" height="436" alt="FISÚ helados" loading="lazy">
        <p class="f-claim">Ese momento pide FISÚ.</p>
        <div class="f-social">
          <a href="${SITE.instagram}" target="_blank" rel="noopener" aria-label="Instagram de FISÚ">${ICON_IG}</a>
          <a href="${SITE.whatsapp}" target="_blank" rel="noopener" aria-label="WhatsApp de FISÚ">${ICON_WA}</a>
          <a href="mailto:${SITE.email}" aria-label="Escribir un email a FISÚ">${ICON_MAIL}</a>
        </div>
      </div>
      <div><h3>Productos</h3><ul>${prod}<li><a href="${B}/#catalogo">Ver todos</a></li></ul></div>
      <div><h3>FISÚ</h3><ul><li><a href="${B}/#sabores">Sabores</a></li><li><a href="${B}/#fisu">La marca</a></li><li><a href="${B}/#momentos">Momentos</a></li><li><a href="${B}/#donde">Dónde encontrar</a></li></ul></div>
      <div><h3>Contacto</h3><ul>
        <li><a href="${SITE.whatsapp}" target="_blank" rel="noopener">WhatsApp</a></li>
        <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li><a href="${SITE.instagram}" target="_blank" rel="noopener">${SITE.instagramHandle}</a></li>
        <li><a href="mailto:${SITE.email}?subject=Quiero%20vender%20FIS%C3%9A">Vender FISÚ en tu comercio</a></li>
      </ul></div>
    </div>
    <div class="f-bottom">
      <p>© ${new Date().getFullYear()} FISÚ Helados. Todos los derechos reservados.</p>
      <p>Imágenes de referencia. Los productos pueden variar según disponibilidad.</p>
    </div>
  </div>
</footer>`;
}

function Doc({ title, desc, path, body, jsonld = [], ogImage = 'og-fisu.jpg', preload = [], headerColor = false, home = false, themeColor = '#F81F86' }) {
  return `<!doctype html>
<html lang="es-AR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${abs(path)}">
<meta name="theme-color" content="${themeColor}">
<meta property="og:type" content="website">
<meta property="og:locale" content="es_AR">
<meta property="og:site_name" content="FISÚ Helados">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${abs(path)}">
<meta property="og:image" content="${abs(`${B}/assets/img/${ogImage}`)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${B}/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="${B}/assets/img/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" href="${B}/assets/fonts/poppins-800.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${B}/assets/fonts/lexend.woff2" crossorigin>
${preload.map(p => `<link rel="preload" as="image" type="image/avif" imagesrcset="${p.srcset}" imagesizes="${p.sizes}">`).join('\n')}
<link rel="stylesheet" href="${B}/assets/css/fisu.css?v=${V}">
${jsonld.map(j => `<script type="application/ld+json">${JSON.stringify(j)}</script>`).join('\n')}
</head>
<body>
${Header({ home }).replace('class="site-header"', `class="site-header${headerColor ? ' ' + headerColor : ''}"`)}
<main id="main">
${body}
</main>
${Footer()}
<script src="${B}/assets/js/fisu.js?v=${V}" defer></script>
</body>
</html>
`;
}

const avifSet = name => IMG[name].sizes.map(w => `${B}/assets/img/${name}-${w}.avif ${w}w`).join(', ');

/* ================================================================ HOME */

/* 01 · HERO — composición de campaña */
function Hero() {
  const L = (name, o) => `<div class="p ${o.cls || ''}" style="--x:${o.x};--y:${o.y};--w:${o.w};--r:${o.r || 0}deg;--z:${o.z || 2}">
      <div class="par" style="--depth:${o.depth || 10}"><div class="pop" style="--d:${o.d || 0}s;--r0:${o.r0 || -6}deg"><div class="${o.float ? 'float' : ''}" style="--dur:${o.dur || 7}s">${Pic(name, { alt: o.alt || '', sizes: o.sizes || '(max-width: 860px) 60vw, 30vw', eager: o.eager })}</div></div></div></div>`;
  return `
<section class="hero" data-mouse aria-labelledby="hero-title">
  <div class="hero-bg">
    <div class="blob drift" style="--dur:24s;right:-9%;top:0%;width:60%;height:60%;color:var(--fisu-pink)" aria-hidden="true">${blobSvg(3, .16, 8)}</div>
    <div class="blob drift-b hb-side" style="--dur:28s;right:-14%;top:30%;width:34%;height:58%;color:var(--fisu-blue)" aria-hidden="true">${blobSvg(9, .12, 6)}</div>
    <div class="blob drift" style="--dur:30s;right:19%;top:6%;width:40%;height:50%;color:var(--fisu-yellow)" aria-hidden="true">${blobSvg(17, .26, 7)}</div>
    <div class="blob drift-b" style="--dur:26s;right:6%;top:26%;width:30%;height:44%;color:var(--fisu-lilac)" aria-hidden="true">${blobSvg(5, .2, 7)}</div>
    <div class="blob drift hb-side" style="--dur:32s;left:-12%;bottom:-22%;width:30%;height:40%;color:var(--fisu-lilac)" aria-hidden="true">${blobSvg(23, .2, 7)}</div>
  </div>
  <div class="wrap">
    <div class="hero-copy">
      <p class="kicker">Postres y productos helados</p>
      ${BrandHeading('h1', 'Todo empieza<br>con un <span class="c-pink">antojo.</span>', 't-hero', 'id="hero-title"')}
      <p class="hero-sub fade-up" data-reveal style="--d:.35s">Postres helados listos para disfrutar. <b>Cercanos, coloridos y muy difíciles de ignorar.</b></p>
      <div class="hero-ctas fade-up" data-reveal style="--d:.5s">
        <a class="btn" href="#productos">Descubrí nuestros productos ${ARROW}</a>
        <a class="btn btn-line" href="#catalogo">Ver catálogo</a>
      </div>
      <p class="hero-note fade-up" data-reveal style="--d:.65s"><span class="c-pink" style="width:30px;display:block">${splashSvg(0)}</span>Sí, te estamos tentando.</p>
    </div>
    <div class="hero-stage stage" data-reveal aria-label="Composición de productos FISÚ: pote de tres sabores, barra crocante, torta de frutilla, almendrado y bombón helado" role="img">
      <div class="podium pink" style="--x:14%;--y:58%;--w:72%;--z:1"></div>
      <div class="podium cream" style="--x:-6%;--y:83%;--w:48%;--z:4"></div>
      <div class="podium blue" style="--x:54%;--y:84%;--w:44%;--z:4"></div>
      ${L('bombon-pack', { x: '6%', y: '4%', w: '29%', r: -9, z: 1, depth: -10, d: .3, float: true, dur: 8, alt: '' })}
      ${L('barra-crocante-b', { x: '60%', y: '-2%', w: '38%', r: 6, z: 2, depth: -18, d: .4, float: true, dur: 6.5 })}
      ${L('pote-trio', { x: '6%', y: '30%', w: '88%', z: 3, depth: 6, d: .1, eager: true, sizes: '(max-width: 860px) 96vw, 46vw' })}
      ${L('torta-frutilla-b', { x: '-8%', y: '70%', w: '52%', z: 5, depth: 14, d: .5 })}
      ${L('almendrado-b', { x: '55%', y: '74%', w: '42%', z: 5, depth: 18, d: .6 })}
      ${L('ing-choco-fly', { x: '40%', y: '14%', w: '9%', r: 24, z: 6, depth: -26, d: .75, float: true, dur: 5, cls: 'float-only-desktop' })}
      ${Splash({ style: 'left:86%;top:30%;width:11%;height:11%;z-index:6', color: 'var(--fisu-pink)', rot: 30 })}
    </div>
  </div>
  <a class="scroll-cue" href="#productos" aria-label="Bajar a productos"><i></i></a>
</section>`;
}

/* 02 · PRODUCTOS — módulos grandes (ProductCard grande) */
const MODULES = [
  { slug: 'pote-fisu', theme: 't-pink', cat: 'Potes', title: 'Pote FISÚ', flavor: 'Frutilla, chocolate y vainilla.', desc: 'Tres sabores. Una cuchara.', img: 'pote-trio', iw: '80%', ix: '-2%', iy: '13%', ir: -4, seed: 11, sx: '8%', sy: '18%' },
  { slug: 'barra-crocante', theme: 't-blue', cat: 'Barras', title: 'Barra crocante', flavor: 'Chocolate con crocante.', desc: 'Crocante en cada mordida.', img: 'barra-crocante-b', iw: '66%', ix: '6%', iy: '13%', ir: 4, seed: 12, sx: '12%', sy: '26%' },
  { slug: 'torta-helada-frutilla', theme: 't-yellow', cat: 'Tortas', title: 'Torta de frutilla', flavor: 'Frutilla y crema, base de galleta.', desc: 'Uno más y listo.', img: 'torta-frutilla-b', iw: '92%', ix: '-8%', iy: '17%', ir: -3, seed: 13, sx: '70%', sy: '36%' },
  { slug: 'postre-tricolor', theme: 't-lilac', cat: 'Postres', title: 'Postre tricolor', flavor: 'Chocolate, frutilla y vainilla.', desc: 'Para no elegir.', img: 'tricolor', iw: '96%', ix: '-10%', iy: '16%', ir: -5, seed: 14, sx: '68%', sy: '34%' },
  { slug: 'bombon-helado', theme: 't-choco', cat: 'Bombones', title: 'Bombón helado', flavor: 'Vainilla con baño de chocolate.', desc: 'La primera mordida.', img: 'bombon-pack', iw: '58%', ix: '8%', iy: '14%', ir: 5, seed: 15, sx: '66%', sy: '30%' },
];
function ProductModules() {
  return `
<section class="section" id="productos" aria-labelledby="productos-title">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">Productos</p>${BrandHeading('h2', 'Elegí tu próximo <span class="c-pink">antojo.</span>', 't-section', 'id="productos-title"')}</div>
      <p class="fade-up" data-reveal>Potes, barras, tortas y postres helados. Difícil elegir uno solo.</p>
    </div>
    <div class="modules">
      ${MODULES.map((m, i) => {
        const p = bySlug[m.slug];
        return `<a class="module ${m.theme} on-color" href="${B}/productos/${p.slug}/" data-tilt data-reveal>
        <div class="m-blob" aria-hidden="true">${blobSvg(m.seed, .22, 7)}</div>
        <span class="m-cat">${m.cat}</span>
        <h3>${esc(m.title)}</h3>
        <p class="m-flavor">${esc(m.flavor)}</p>
        <div class="m-img pop" style="--iw:${m.iw};--ix:${m.ix};--iy:${m.iy};--ir:${m.ir}deg;--d:${.1 + i * .05}s">${Pic(m.img, { alt: altOf(p), sizes: i < 2 ? '(max-width: 860px) 80vw, 40vw' : '(max-width: 860px) 80vw, 30vw' })}</div>
        <span class="m-splash" style="--sx:${m.sx};--sy:${m.sy}">${splashSvg(i * 30)}</span>
        <div class="m-foot"><p class="m-desc">${esc(m.desc)}</p><span class="m-go" aria-hidden="true">${ARROW_UR}</span></div>
      </a>`;
      }).join('')}
    </div>
    <p class="modules-hint" aria-hidden="true">Deslizá para ver más ${SWIPE}</p>
  </div>
</section>`;
}

/* 03 · SABORES — escena sticky (FlavorSection) */
const FLAVORS = [
  { id: 'frutilla', word: 'FRUTILLA', title: 'Rosa por fuera.<br>Frutilla por dentro.', text: 'Torta helada de frutilla: capa frutal, centro cremoso y base de galleta.', slug: 'torta-helada-frutilla', img: 'torta-frutilla-b', w: 'min(60vw, 820px)', pr: -3,
    ings: [], blob: { seed: 31, style: 'left:52%;top:46%;width:52vw;height:52vw;margin:-26vw 0 0 -26vw' } },
  { id: 'chocolate', word: 'CHOCOLATE', title: 'Chocolate<br>por todos lados.', text: 'Barra crocante bañada en chocolate. Mirar bajo tu propio riesgo.', slug: 'barra-crocante', img: 'barra-crocante-b', w: 'min(44vw, 620px)', pr: 6,
    ings: [['ing-choco', { x: '70%', y: '62%', w: '10vw', r: 10 }], ['ing-choco-fly', { x: '20%', y: '18%', w: '7vw', r: -20 }], ['ing-choco-fly', { x: '76%', y: '14%', w: '5vw', r: 40 }]], blob: { seed: 32, style: 'left:50%;top:50%;width:44vw;height:44vw;margin:-22vw 0 0 -22vw' } },
  { id: 'vainilla', word: 'VAINILLA', title: 'Vainilla, crocante<br>y almendras.', text: 'Almendrado: el clásico de sobremesa que nunca falla.', slug: 'almendrado', img: 'almendrado', w: 'min(52vw, 720px)', pr: -4,
    ings: [], blob: { seed: 33, style: 'left:50%;top:50%;width:50vw;height:42vw;margin:-21vw 0 0 -25vw' } },
  { id: 'mix', word: 'MIX', title: '¿Para qué<br>elegir uno?', text: 'Postre tricolor: chocolate, frutilla y vainilla en capas, con salsa de chocolate.', slug: 'postre-tricolor', img: 'tricolor', w: 'min(58vw, 800px)', pr: -3,
    ings: [['ing-choco-fly', { x: '18%', y: '20%', w: '6vw', r: -14 }]], blob: { seed: 34, style: 'left:50%;top:50%;width:48vw;height:48vw;margin:-24vw 0 0 -24vw' } },
];
const FLAVOR_NAMES = { frutilla: 'Frutilla', chocolate: 'Chocolate', vainilla: 'Vainilla', mix: 'Mix' };
function Flavors() {
  return `
<section class="flavors on-color" id="sabores" aria-labelledby="sabores-title" style="--steps:${FLAVORS.length}" data-active="0">
  <div class="pin">
    <h2 class="sr-only" id="sabores-title">Sabores FISÚ</h2>
    <p class="flv-intro kicker">Sabores</p>
    ${FLAVORS.map((f, i) => {
      const p = bySlug[f.slug];
      return `<article class="flv-step${i === 0 ? ' is-active' : ''}" data-flavor="${f.id}" aria-label="${FLAVOR_NAMES[f.id]}">
      <div class="flv-giant" aria-hidden="true">${f.word}</div>
      <div class="flv-blob" style="${f.blob.style}" aria-hidden="true">${blobSvg(f.blob.seed, .18, 8)}</div>
      <div class="flv-prod" style="--pr:${f.pr}deg;--pw:${f.w}">${Pic(f.img, { alt: altOf(p), sizes: '(max-width: 860px) 92vw, 56vw' })}</div>
      ${f.ings.map(([n, o], k) => FloatingIngredient(n, { ...o, w: o.w, i: k, sp: 60 + k * 30 })).join('')}
      <div class="flv-ing" style="--x:18%;--y:16%;--w:7vw;--ir:-20deg;--i:3;--sp:50px;color:var(--fg)" aria-hidden="true">${splashSvg(-20)}</div>
      <div class="flv-ing" style="--x:76%;--y:70%;--w:5vw;--ir:150deg;--i:4;--sp:90px;color:var(--fg)" aria-hidden="true">${splashSvg(0)}</div>
      <div class="flv-copy">
        <p class="n" style="--i:0">0${i + 1} / ${FLAVOR_NAMES[f.id]}</p>
        <h3 style="--i:1">${f.title}</h3>
        <p style="--i:2">${esc(f.text)}</p>
        <a class="link-arrow" style="--i:3" href="${B}/productos/${p.slug}/">Ver ${esc(p.short.toLowerCase())} ${ARROW}</a>
      </div>
    </article>`;
    }).join('')}
    <nav class="flv-nav" aria-label="Sabores">${FLAVORS.map((f, i) => `<a href="#sabores" class="${i === 0 ? 'is-active' : ''}"><span>${FLAVOR_NAMES[f.id]}</span><i></i></a>`).join('')}</nav>
    <div class="flv-progress" aria-hidden="true"><i></i></div>
  </div>
</section>`;
}

/* 04 · FAMILY SHOT (ProductGallery) */
const FAMILY = [
  // [slug, img, x, y, w, z, podium]
  ['postre-tricolor', 'tricolor', '1%', '30%', '22%', 3],
  ['bombon-helado', 'bombon-pack', '17%', '6%', '15%', 2],
  ['pote-fisu', 'pote-trio', '33%', '4%', '30%', 4],
  ['barra-crocante', 'barra-crocante-b', '62%', '0%', '17%', 3],
  ['almendrado', 'almendrado', '76%', '22%', '21%', 2],
  ['canastitas', 'bochas', '20%', '52%', '20%', 6],
  ['bombon-con-crema', 'bombon-crema', '42%', '55%', '17%', 7],
  ['torta-helada-frutilla', 'torta-frutilla-b', '59%', '52%', '24%', 6],
  ['canasta-chocolate', 'canasta-choco', '83%', '50%', '17%', 6],
  ['panqueque-helado', 'panqueque', '-1%', '66%', '22%', 7],
];
function Family() {
  return `
<section class="section family" id="familia" aria-labelledby="familia-title">
  <div class="wrap">
    <div class="sec-head">
      <p class="kicker">La familia</p>
      ${BrandHeading('h2', 'Hay un FISÚ para <span class="c-pink">cada momento.</span>', 't-section', 'id="familia-title"')}
      <p class="fade-up" data-reveal>Tocá cualquiera para conocerlo de cerca.</p>
    </div>
    <div class="family-scroll">
      <div class="family-stage stage" data-reveal>
        <div class="fam-bg" aria-hidden="true">
          <div class="blob drift" style="--dur:30s;left:4%;top:0;width:52%;height:96%;color:var(--fisu-cream)">${blobSvg(51, .14, 8)}</div>
          <div class="blob drift-b" style="--dur:26s;right:2%;top:6%;width:46%;height:88%;color:#FFE3EF">${blobSvg(52, .16, 8)}</div>
          <div class="blob drift" style="--dur:34s;left:34%;top:-12%;width:22%;height:36%;color:var(--fisu-yellow)">${blobSvg(53, .2, 6)}</div>
          <div class="blob drift-b" style="--dur:28s;right:-3%;top:58%;width:14%;height:30%;color:var(--fisu-lilac)">${blobSvg(54, .2, 6)}</div>
        </div>
        ${FAMILY.map(([slug, img, x, y, w, z], i) => {
          const p = bySlug[slug];
          return `<a class="fam-item pop" href="${B}/productos/${slug}/" style="--x:${x};--y:${y};--w:${w};--z:${z};--d:${.05 * i}s;--r0:${i % 2 ? 6 : -6}deg"><span class="fam-tag">${esc(p.name)}</span>${Pic(img, { alt: altOf(p), sizes: '(max-width: 860px) 260px, 22vw' })}</a>`;
        }).join('')}
      </div>
    </div>
    <p class="family-hint" aria-hidden="true">Deslizá ${SWIPE}</p>
    <div class="family-cta"><a class="btn btn-blue" href="#catalogo">Ver el catálogo completo ${ARROW}</a></div>
  </div>
</section>`;
}

/* 05 · MOMENTOS */
const MOMENTS = [
  { q: 'Ese postre <em>después de comer.</em>', chip: 'Sobremesa', p: 'Cuando la comida terminó pero la mesa no.', slug: 'bombon-con-crema', img: 'bombon-crema', c: 'var(--fisu-yellow)', w: '70%', r: -4, seed: 61 },
  { q: 'Ese antojo <em>de las once.</em>', chip: '11:00 h', p: 'No es hambre. Es antojo. Es distinto.', slug: 'barra-crocante', img: 'crocante-duo', c: 'var(--fisu-blue)', w: '80%', r: 6, seed: 62 },
  { q: 'Ese <em>“dame un pedacito”</em> que termina siendo media torta.', chip: 'Para compartir', p: 'Nadie pide una porción entera. Nadie deja de comerla.', slug: 'torta-helada-frutilla', img: 'torta-frutilla-b', c: 'var(--fisu-pink)', w: '96%', r: -3, seed: 63 },
  { q: 'Ese freezer que <em>siempre tiene algo bueno.</em>', chip: 'Siempre', p: 'Abrís, mirás, sonreís. Ya sabés lo que viene.', slug: 'pote-fisu', img: 'pote-solo', c: 'var(--fisu-lilac)', w: '64%', r: 4, seed: 64 },
];
const CLOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>';
function Moments() {
  return `
<section class="section moments" id="momentos" aria-labelledby="momentos-title">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">Momentos</p>${BrandHeading('h2', 'Ese momento <span class="c-pink">pide FISÚ.</span>', 't-section', 'id="momentos-title"')}</div>
    </div>
    <div class="moments-list">
      ${MOMENTS.map((m, i) => {
        const p = bySlug[m.slug];
        return `<div class="moment" data-reveal>
        <div class="mo-text fade-up">
          <span class="mo-time">${CLOCK}${m.chip}</span>
          <q>${m.q}</q>
          <p>${esc(m.p)} <a class="link-arrow c-blue" href="${B}/productos/${p.slug}/">${esc(p.name)} ${ARROW}</a></p>
        </div>
        <div class="mo-visual" style="--c:${m.c}">
          <div class="mo-blob drift" style="--dur:${22 + i * 3}s" aria-hidden="true">${blobSvg(m.seed, .2, 7)}</div>
          <div class="mo-img" style="--w:${m.w};--r:${m.r}deg"><div class="pop" style="--d:.15s" data-speed="-.25">${Pic(m.img, { alt: altOf(p), sizes: '(max-width: 860px) 86vw, 40vw' })}</div></div>
          ${Splash({ style: `right:${i % 2 ? '70%' : '8%'};top:4%;width:16%;height:16%`, color: i === 3 ? 'var(--fisu-pink)' : 'var(--fisu-blue)', rot: i % 2 ? -30 : 20 })}
        </div>
      </div>`;
      }).join('')}
    </div>
  </div>
</section>`;
}

/* 06 · BRAND EXPLOSION */
function Explosion() {
  const P = (name, o) => `<div class="ex-p ${o.cls || ''}" style="--x:${o.x};--y:${o.y};--w:${o.w};--r:${o.r}deg" aria-hidden="true"><div data-speed="${o.s}"><div class="float" style="--dur:${o.dur || 7}s">${Pic(name, { sizes: '(max-width: 860px) 32vw, 22vw' })}</div></div></div>`;
  return `
<section class="explosion on-color on-pink" id="fisu" aria-labelledby="fisu-title">
  <div class="pattern" aria-hidden="true" style="background-image:url(${B}/assets/img/pattern-gotas.svg)"></div>
  <div class="ex-shape blob drift" style="--dur:26s;left:-10%;top:-12%;width:42vw;height:34vw;color:var(--fisu-yellow)" aria-hidden="true">${blobSvg(71, .24, 7)}</div>
  <div class="ex-shape blob drift-b" style="--dur:30s;right:-12%;top:8%;width:30vw;height:38vw;color:var(--fisu-lilac)" aria-hidden="true">${blobSvg(72, .2, 7)}</div>
  <div class="ex-shape blob drift" style="--dur:28s;right:6%;bottom:-16%;width:36vw;height:30vw;color:var(--fisu-blue)" aria-hidden="true">${blobSvg(73, .18, 7)}</div>
  <div class="ex-shape blob drift-b" style="--dur:34s;left:8%;bottom:-8%;width:22vw;height:22vw;color:var(--fisu-strawberry)" aria-hidden="true">${blobSvg(74, .2, 6)}</div>
  ${P('crocante-duo', { x: '4%', y: '8%', w: '20vw', r: -14, s: -.5 })}
  ${P('pote-solo', { x: '78%', y: '6%', w: '15vw', r: 10, s: .4, cls: 'ex-hide-m' })}
  ${P('canasta-choco', { x: '76%', y: '56%', w: '20vw', r: 8, s: -.35, cls: 'ex-low r' })}
  ${P('bochas', { x: '3%', y: '60%', w: '19vw', r: -6, s: .45, cls: 'ex-low' })}
  ${P('ing-choco-fly', { x: '26%', y: '22%', w: '5vw', r: 30, s: -.8, dur: 5, cls: 'ex-hide-m' })}
  <div class="ex-center">
    <h2 class="sr-only" id="fisu-title">FISÚ: más sabor, más color, más momentos</h2>
    <img class="ex-logo pop" data-reveal src="${LOGO_W}" width="790" height="436" alt="" aria-hidden="true" loading="lazy">
    <p class="ex-words fade-up" data-reveal style="--d:.2s" aria-hidden="true"><span>Más sabor.</span> <span>Más color.</span> <span>Más momentos.</span></p>
    <p class="ex-line fade-up" data-reveal style="--d:.35s">Postres helados listos para disfrutar: cercanos, coloridos y memorables.</p>
  </div>
  <div class="marquee" aria-hidden="true"><div class="marquee-track">${Array.from({ length: 2 }, () => `<span>Más sabor ${splashSvg(0)} <b>Más color</b> ${splashSvg(40)} Más momentos ${splashSvg(80)} <b>Más FISÚ</b> ${splashSvg(120)}</span><span>Más sabor ${splashSvg(0)} <b>Más color</b> ${splashSvg(40)} Más momentos ${splashSvg(80)} <b>Más FISÚ</b> ${splashSvg(120)}</span>`).join('')}</div></div>
</section>`;
}

/* 07 · CATÁLOGO (ProductCard) */
function ProductCard(p, { k = 0, heading = 'h3', sizes = '(max-width: 860px) 46vw, 26vw' } = {}) {
  return `<a class="pcard tint-${p.tint}" href="${B}/productos/${p.slug}/" data-cats="${p.cats.join(' ')}" data-tilt style="--k:${k}">
    <div class="pc-vis"><div class="pc-blob" aria-hidden="true">${blobSvg(100 + p.slug.length * 3 + k, .2, 7)}</div>
      <div class="pc-img">${Pic(p.img, { alt: altOf(p), sizes })}</div>
      <div class="pc-tags"><span>${p.tag}</span>${p.cats.includes('familiares') && p.tag !== 'Familiar' ? '<span>Familiar</span>' : ''}</div></div>
    <div class="pc-body"><${heading}>${esc(p.name)}</${heading}><p class="pc-flavor">${esc(p.flavorLine)}</p><p class="pc-desc">${esc(p.desc)}</p><span class="pc-go" aria-hidden="true">${ARROW_UR}</span></div>
  </a>`;
}
function Catalog() {
  const count = id => id === 'todos' ? PRODUCTS.length : PRODUCTS.filter(p => p.cats.includes(id)).length;
  return `
<section class="section" id="catalogo" aria-labelledby="catalogo-title">
  <div class="wrap">
    <div class="sec-head">
      <div><p class="kicker">Catálogo</p>${BrandHeading('h2', 'Difícil elegir <span class="c-pink">uno solo.</span>', 't-section', 'id="catalogo-title"')}</div>
      <div class="filters" role="group" aria-label="Filtrar productos">
        ${CATEGORIES.map((c, i) => `<button type="button" data-filter="${c.id}" data-label="${c.label.toLowerCase()}" aria-pressed="${i === 0}">${c.label}<span class="ct">${count(c.id)}</span></button>`).join('')}
      </div>
    </div>
    <div class="catalog-grid">${PRODUCTS.map((p, k) => ProductCard(p, { k })).join('')}</div>
    <p class="catalog-status sr-only" aria-live="polite"></p>
  </div>
</section>`;
}

/* 08 · CTA FINAL + Dónde encontrar */
function iconImg(name) { return Pic(name, { cls: 'ic', sizes: '64px', alt: '' }); }
function CTAFinal({ home = true } = {}) {
  const cat = home ? '#catalogo' : `${B}/#catalogo`;
  return `
<section class="cta-final on-color on-pink" id="donde" aria-labelledby="cta-title">
  <div class="blob drift" style="--dur:28s;right:-14%;top:-20%;width:52vw;height:46vw;color:var(--fisu-yellow)" aria-hidden="true">${blobSvg(81, .2, 7)}</div>
  <div class="blob drift-b" style="--dur:30s;right:14%;top:14%;width:30vw;height:30vw;color:var(--fisu-lilac)" aria-hidden="true">${blobSvg(82, .2, 7)}</div>
  <div class="blob drift" style="--dur:34s;left:-14%;bottom:-6%;width:34vw;height:30vw;color:var(--fisu-blue)" aria-hidden="true">${blobSvg(83, .2, 7)}</div>
  <div class="wrap">
    <div>
      ${BrandHeading('h2', 'Bueno.<br><span class="c-yellow">¿Qué se te antojó?</span>', '', 'id="cta-title"')}
      <div class="ctas fade-up" data-reveal style="--d:.3s">
        <a class="btn btn-white pinkfg" href="${cat}">Ver productos ${ARROW}</a>
        <a class="btn btn-line on-dark" href="#donde-cards">Encontrá tu FISÚ</a>
      </div>
    </div>
    <div class="cta-stage stage" data-reveal aria-hidden="true">
      <div class="podium white" style="--x:13%;--y:47%;--w:74%"></div>
      <div class="p" style="--x:8%;--y:6%;--w:84%;--z:3"><div class="pop" style="--d:.1s"><div class="float" style="--dur:8s">${Pic('pote-trio', { sizes: '(max-width: 860px) 90vw, 40vw' })}</div></div></div>
      ${Splash({ style: 'left:4%;top:2%;width:16%;height:16%;z-index:5', color: '#fff', rot: -20 })}
    </div>
  </div>
  <div class="wrap where-wrap">
    <div class="where" id="donde-cards">
      <div class="where-card fade-up" data-reveal>${iconImg('icon-tienda')}<h3>¿Dónde comprar?</h3><p>Escribinos y te contamos cuál es el punto de venta FISÚ más cerca tuyo.</p><a class="link-arrow" href="${SITE.whatsapp}" target="_blank" rel="noopener">Consultar por WhatsApp ${ARROW}</a></div>
      <div class="where-card fade-up" data-reveal style="--d:.1s">${iconImg('icon-delivery')}<h3>¿Tenés un comercio?</h3><p>Sumá FISÚ a tu freezer. Te contamos cómo trabajar con nosotros.</p><a class="link-arrow" href="mailto:${SITE.email}?subject=Quiero%20vender%20FIS%C3%9A">Quiero vender FISÚ ${ARROW}</a></div>
      <div class="where-card fade-up" data-reveal style="--d:.2s">${iconImg('icon-redes')}<h3>Seguinos</h3><p>Lanzamientos, sabores y antojos diarios. Avisados quedan.</p><a class="link-arrow" href="${SITE.instagram}" target="_blank" rel="noopener">${SITE.instagramHandle} ${ARROW}</a></div>
    </div>
  </div>
</section>`;
}

function homeJsonLd() {
  return [
    { '@context': 'https://schema.org', '@type': 'Organization', name: 'FISÚ Helados', alternateName: 'FISÚ', url: abs(`${B}/`), logo: abs(`${B}/assets/img/logo-512.png`), sameAs: [SITE.instagram], description: 'Marca de postres y productos helados.' },
    { '@context': 'https://schema.org', '@type': 'WebSite', name: 'FISÚ Helados', url: abs(`${B}/`), inLanguage: 'es-AR' },
    { '@context': 'https://schema.org', '@type': 'ItemList', name: 'Productos FISÚ', itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(`${B}/productos/${p.slug}/`), name: p.name })) },
  ];
}

function buildHome() {
  const body = [Hero(), ProductModules(), Flavors(), Family(), Moments(), Explosion(), Catalog(), CTAFinal()].join('\n');
  return Doc({
    title: 'FISÚ Helados — Postres helados que dan ganas de mirar dos veces',
    desc: 'FISÚ Helados: postres helados, potes, barras, tortas y bombones. Sabores de frutilla, chocolate y vainilla listos para disfrutar. Elegí tu próximo antojo.',
    path: `${B}/`, body, jsonld: homeJsonLd(), home: true,
    preload: [{ srcset: avifSet('pote-trio'), sizes: '(max-width: 860px) 96vw, 46vw' }],
  });
}

/* ================================================================ PRODUCTO (ProductHero) */
const THEME_COLOR = { pink: '#F81F86', chocolate: '#6B3A24', vainilla: '#F5C52D', mix: '#B796FF', blue: '#1147F5' };
const THEME_INGS = {
  pink: [],
  chocolate: [['ing-choco', { x: '80%', y: '62%', w: '14%', r: 10 }], ['ing-choco-fly', { x: '6%', y: '10%', w: '9%', r: -20 }]],
  vainilla: [['ing-choco-fly', { x: '80%', y: '12%', w: '9%', r: 16 }]],
  mix: [['ing-choco-fly', { x: '4%', y: '66%', w: '9%', r: -14 }]],
  blue: [['ing-choco-fly', { x: '82%', y: '10%', w: '10%', r: 20 }], ['ing-choco', { x: '2%', y: '64%', w: '13%', r: -10 }]],
};
function buildProduct(p) {
  const related = PRODUCTS.filter(x => x.slug !== p.slug).map(x => ({ x, s: x.cats.filter(c => p.cats.includes(c)).length + (x.theme === p.theme ? 1 : 0) }))
    .sort((a, b) => b.s - a.s).slice(0, 3).map(r => r.x);
  const giant = p.short.split(' ')[0].toUpperCase();
  const body = `
<div class="pp th-${p.theme}">
  <section class="pp-hero on-color${p.theme === 'vainilla' ? ' on-yellow' : ''}" data-mouse aria-labelledby="pp-title">
    <div class="pp-giant" aria-hidden="true">${esc(giant)}</div>
    <div class="blob drift" style="--dur:26s;right:-12%;top:-18%;width:44vw;height:40vw;color:var(--fisu-white);opacity:.14" aria-hidden="true">${blobSvg(91, .2, 7)}</div>
    <div class="wrap">
      <div class="pp-copy">
        <nav class="pp-crumbs" aria-label="Migas de pan"><a href="${B}/">FISÚ</a><span aria-hidden="true">/</span><a href="${B}/#catalogo">Productos</a><span aria-hidden="true">/</span><span aria-current="page">${esc(p.name)}</span></nav>
        ${BrandHeading('h1', esc(p.name), '', 'id="pp-title"')}
        <p class="pp-flavor fade-up" data-reveal style="--d:.2s">${p.flavors.map(f => `<span>${esc(f)}</span>`).join('')}</p>
        <p class="pp-desc fade-up" data-reveal style="--d:.3s">${esc(p.long)}</p>
        <ul class="pp-feels fade-up" data-reveal style="--d:.4s" aria-label="Sensaciones">${p.feels.map(f => `<li>${esc(f)}</li>`).join('')}</ul>
      </div>
      <div class="pp-vis" data-reveal>
        <div class="pp-blob drift" style="--dur:24s" aria-hidden="true">${blobSvg(p.slug.length * 7, .18, 8)}</div>
        <div class="pp-img par" style="--depth:8"><div class="pop" style="--d:.1s">${Pic(p.img, { alt: altOf(p), sizes: '(max-width: 860px) 100vw, 56vw', eager: true })}</div></div>
        ${THEME_INGS[p.theme].map(([n, o], k) => `<div class="flv-ing" style="--x:${o.x};--y:${o.y};--w:${o.w}" aria-hidden="true"><div class="pop" style="--d:${.4 + k * .1}s"><div class="float" style="--dur:${6 + k}s">${Pic(n, { sizes: '140px' })}</div></div></div>`).join('')}
      </div>
    </div>
  </section>

  <section class="pp-info" aria-labelledby="info-title">
    <div class="wrap">
      <div class="sec-head"><div><p class="kicker">Lo que tenés que saber</p>${BrandHeading('h2', 'Así es <span class="c-pink">por dentro.</span>', 't-section', 'id="info-title"')}</div></div>
      <div class="grid">
        <div class="info-tile fade-up" data-reveal><span class="lbl">Sabor</span><span class="val">${esc(p.flavorLine)}</span></div>
        <div class="info-tile fade-up" data-reveal style="--d:.08s"><span class="lbl">Formato</span><span class="val">${esc(p.format)}</span></div>
        <div class="info-tile fade-up" data-reveal style="--d:.16s"><span class="lbl">Ideal para</span><span class="val">${esc(p.ideal)}</span></div>
        <div class="info-tile fade-up" data-reveal style="--d:.24s"><span class="lbl">Conservación</span><span class="val">En freezer, a −18&nbsp;°C</span></div>
      </div>
    </div>
  </section>

  ${p.pack ? `<section class="pp-pack" aria-labelledby="pack-title"><div class="wrap"><div class="pack-box" data-reveal>
    <div class="blob drift" style="--dur:28s;right:-8%;top:-20%;width:46%;height:90%;color:#fff;opacity:.7" aria-hidden="true">${blobSvg(95, .2, 7)}</div>
    <div><p class="kicker">Packaging</p><h2 id="pack-title" style="margin-top:18px">${esc(p.pack.title)}</h2><p>${esc(p.pack.text)}</p></div>
    <div class="pack-img pop">${Pic(p.pack.img, { alt: `Packaging de ${p.name} FISÚ`, sizes: '(max-width: 860px) 80vw, 40vw' })}</div>
  </div></div></section>` : ''}

  <section class="pp-related" aria-labelledby="rel-title">
    <div class="wrap">
      <div class="sec-head"><div><p class="kicker">Uno más y listo</p>${BrandHeading('h2', 'También te puede <span class="c-pink">tentar.</span>', 't-section', 'id="rel-title"')}</div><a class="btn btn-line" href="${B}/#catalogo">Ver todo el catálogo</a></div>
      <div class="catalog-grid">${related.map((r, k) => ProductCard(r, { k })).join('')}</div>
    </div>
  </section>
</div>
${CTAFinal({ home: false })}`;
  const path = `${B}/productos/${p.slug}/`;
  const jsonld = [
    { '@context': 'https://schema.org', '@type': 'Product', name: `${p.name} FISÚ`, description: p.long, brand: { '@type': 'Brand', name: 'FISÚ' }, category: 'Postres helados', image: abs(`${B}/assets/img/${p.img}-${Math.max(...IMG[p.img].sizes)}.webp`), url: abs(path) },
    { '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'FISÚ', item: abs(`${B}/`) },
      { '@type': 'ListItem', position: 2, name: 'Productos', item: abs(`${B}/#catalogo`) },
      { '@type': 'ListItem', position: 3, name: p.name, item: abs(path) }] },
  ];
  return Doc({
    title: `${p.name} — ${p.flavorLine} | FISÚ Helados`,
    desc: `${p.name} FISÚ: ${p.flavorLine.toLowerCase()}. ${p.desc}`,
    path, body, jsonld, headerColor: ['vainilla', 'mix'].includes(p.theme) ? 'on-light-top' : 'on-color-top', themeColor: THEME_COLOR[p.theme],
    preload: [{ srcset: avifSet(p.img), sizes: '(max-width: 860px) 100vw, 56vw' }],
  });
}

/* ================================================================ escribir */
const write = (rel, s) => { const f = join(ROOT, rel); mkdirSync(dirname(f), { recursive: true }); writeFileSync(f, s); };
write('index.html', buildHome());
PRODUCTS.forEach(p => write(`productos/${p.slug}/index.html`, buildProduct(p)));
const urls = [`${B}/`, ...PRODUCTS.map(p => `${B}/productos/${p.slug}/`)];
write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${abs(`${B}/sitemap.xml`)}\n`);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${abs(u)}</loc></url>`).join('\n')}\n</urlset>\n`);
console.log(`OK · home + ${PRODUCTS.length} productos + sitemap`);
