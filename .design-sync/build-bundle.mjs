// Hand-authored Claude Design bundle builder for the Chimichurri Diseño
// static HTML/CSS design system. Reads assets/css/style.css (the source of
// truth) and emits ds-bundle/: styles.css (the design closure) + one
// self-contained @dsCard preview per component family.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const ROOT = resolve(new URL('..', import.meta.url).pathname);
const OUT = resolve(ROOT, 'ds-bundle');
const css = readFileSync(resolve(ROOT, 'assets/css/style.css'), 'utf8');

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

const WA = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>`;

// Write the design closure (verbatim DS stylesheet).
writeFileSync(resolve(OUT, 'styles.css'), css);

// Each card inlines the full stylesheet so it renders standalone in the
// Design System pane, while the root styles.css above feeds new designs.
function card({ slug, group, body, theme = 'diseno', pad = '48px 40px', center = false }) {
  const wrapStyle = `padding:${pad};${center ? 'display:flex;flex-wrap:wrap;gap:16px;align-items:center;' : ''}`;
  const html = `<!-- @dsCard group="${group}" -->
<!doctype html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
${css}
body { min-height: auto; }
</style>
</head>
<body class="${theme}">
<div class="wrap" style="${wrapStyle}">
${body}
</div>
</body>
</html>`;
  const path = resolve(OUT, 'components', slug, 'index.html');
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
}

const cards = [
  // ─── Foundations ───
  {
    slug: 'foundations/colors', group: 'Foundations', theme: 'diseno', pad: '40px',
    body: `
<div class="label">Tokens · Color</div>
<h3 style="margin-bottom:24px">Superficies & acentos</h3>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px">
  ${[['--bg','#080808','bg'],['--surface','#0f0f0f','surface'],['--surface2','#161616','surface2'],['--text','#f2f2f2','text'],['--text-muted','#6e6e6e','text-muted']].map(([v,hex,n])=>`
  <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden">
    <div style="height:64px;background:${hex}"></div>
    <div style="padding:10px 12px"><div style="font-weight:700;font-size:.8rem">${n}</div><div style="color:var(--text-muted);font-size:.72rem">${v} · ${hex}</div></div>
  </div>`).join('')}
</div>
<h3 style="margin:28px 0 14px">Temas de acento</h3>
<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:14px">
  ${[['.diseno','#D4FF00','Diseño'],['.fisico','#FF7A3D','Físico'],['.experiencias','#A78BFA','Experiencias'],['.portal-page','#38BDF8','Portal']].map(([cls,hex,n])=>`
  <div style="border:1px solid var(--border);border-radius:12px;overflow:hidden">
    <div style="height:64px;background:${hex}"></div>
    <div style="padding:10px 12px"><div style="font-weight:700;font-size:.8rem">${n}</div><div style="color:var(--text-muted);font-size:.72rem">${cls} · ${hex}</div></div>
  </div>`).join('')}
</div>`
  },
  {
    slug: 'foundations/typography', group: 'Foundations', theme: 'diseno', pad: '40px',
    body: `
<div class="label">Tokens · Tipografía</div>
<h1 style="margin-bottom:12px">Diseño que <em style="font-style:normal;color:var(--accent)">vende.</em></h1>
<h2 style="margin-bottom:12px">Un hub para cada necesidad</h2>
<h3 style="margin-bottom:12px">Identidad visual, branding y redes</h3>
<p style="margin-bottom:6px">Cuerpo de texto en Inter. Chimichurri transforma negocios comunes en marcas que se ven serias, claras y vendibles.</p>
<p style="color:var(--text-muted);font-size:.8rem">Headings: Syne 800 · Body: Inter · line-height 1.65</p>`
  },
  // ─── Components ───
  {
    slug: 'components/buttons', group: 'Components', theme: 'diseno', pad: '48px 40px', center: true,
    body: `
<a class="btn btn-primary">Primary</a>
<a class="btn btn-ghost">Ghost</a>
<a class="btn btn-wa">${WA} WhatsApp</a>
<a class="btn btn-outline-accent">Outline</a>
<a class="btn btn-primary btn-lg">Large</a>
<a class="btn btn-primary btn-sm">Small</a>`
  },
  {
    slug: 'components/labels-pills', group: 'Components', theme: 'diseno', pad: '48px 40px',
    body: `
<div class="label">Studio de diseño · Buenos Aires</div>
<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:16px">
  <span class="pill">Nuevo</span>
  <span class="pill">Destacado</span>
  <span class="pill">Pack completo</span>
</div>`
  },
  {
    slug: 'components/nav', group: 'Components', theme: 'diseno', pad: '0',
    body: `
<nav class="nav" style="position:relative">
  <div class="nav-inner">
    <a class="logo"><span class="logo-dot"></span>Chimichurri<span style="color:var(--text-muted);font-weight:400"> diseño</span></a>
    <div class="nav-menu">
      <a>Diseño</a><a class="active">Físico</a><a>Experiencias</a><a>Portal</a>
      <a class="nav-wa">WhatsApp</a>
    </div>
  </div>
</nav>`
  },
  {
    slug: 'components/cards', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="grid-3">
  <div class="card"><div class="card-icon">🎨</div><h3>Identidad visual</h3><p>Logo, sistema visual y branding coherente.</p></div>
  <div class="card"><div class="card-icon">📱</div><h3>Redes sociales</h3><p>Feed, posts, stories y reels gráficos.</p></div>
  <div class="card"><div class="card-icon">🖨️</div><h3>Piezas físicas</h3><p>Menús, carteles, flyers y señalética.</p></div>
</div>`
  },
  {
    slug: 'components/hub-cards', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="grid-2">
  <a class="hub-card">
    <div class="label">Catálogo diseño</div>
    <h3>Identidad visual, branding y redes</h3>
    <p>Logo, sistema visual, feed de Instagram, menú digital y web simple.</p>
    <div class="hub-chips"><span>Logo</span><span>Branding</span><span>Instagram</span><span>Web</span></div>
  </a>
  <a class="hub-card" style="--accent:#FF7A3D;--accent-dim:rgba(255,122,61,0.08);--accent-border:rgba(255,122,61,0.22)">
    <div class="label">Catálogo físico</div>
    <h3>Imprenta, cartelería y piezas de local</h3>
    <p>Menús físicos, carteles, flyers, stickers QR, lonas y señalética.</p>
    <div class="hub-chips"><span>Menús</span><span>Carteles</span><span>QR</span><span>Lonas</span></div>
  </a>
</div>`
  },
  {
    slug: 'components/chips', group: 'Components', theme: 'diseno', pad: '48px 40px',
    body: `
<div class="chips">
  <span class="chip">Logo</span><span class="chip">Branding</span><span class="chip">Instagram</span>
  <span class="chip">Stories</span><span class="chip">Menú digital</span><span class="chip">Web</span><span class="chip">Packaging</span>
</div>`
  },
  {
    slug: 'components/stats', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="stats-row">
  <div class="stat"><div class="stat-n">+80</div><div class="stat-label">Proyectos entregados</div></div>
  <div class="stat"><div class="stat-n">3</div><div class="stat-label">Catálogos de servicio</div></div>
  <div class="stat"><div class="stat-n">24h</div><div class="stat-label">Respuesta promedio</div></div>
  <div class="stat"><div class="stat-n">100%</div><div class="stat-label">Digital y físico</div></div>
</div>`
  },
  {
    slug: 'components/packs', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="grid-2">
  <div class="pack">
    <div class="pack-name">Básico</div>
    <div class="pack-title">Arranque</div>
    <div class="pack-desc">Para empezar a verte profesional.</div>
    <ul class="pack-list"><li>Logo + variantes</li><li>Paleta y tipografías</li><li>3 plantillas de post</li></ul>
    <a class="btn btn-ghost">Elegir pack</a>
  </div>
  <div class="pack featured">
    <div class="pack-name">Completo</div>
    <div class="pack-title">Marca 360°</div>
    <div class="pack-desc">Identidad + redes + piezas físicas.</div>
    <ul class="pack-list"><li>Todo lo del pack Arranque</li><li>Feed de 9 posts</li><li>Menú digital + físico</li><li>Cartelería del local</li></ul>
    <a class="btn btn-primary">Elegir pack</a>
  </div>
</div>`
  },
  {
    slug: 'components/before-after', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="ba-grid">
  <div class="ba-col before">
    <div class="ba-label">Antes</div>
    <div class="ba-items">
      <div class="ba-item"><i class="ico">✕</i>Logo hecho en el celular</div>
      <div class="ba-item"><i class="ico">✕</i>Fotos sin criterio</div>
      <div class="ba-item"><i class="ico">✕</i>Menú ilegible</div>
    </div>
  </div>
  <div class="ba-col after">
    <div class="ba-label">Después</div>
    <div class="ba-items">
      <div class="ba-item"><i class="ico">✓</i>Identidad coherente</div>
      <div class="ba-item"><i class="ico">✓</i>Feed que se ve serio</div>
      <div class="ba-item"><i class="ico">✓</i>Menú claro y vendible</div>
    </div>
  </div>
</div>`
  },
  {
    slug: 'components/steps', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="steps">
  <div class="step"><div class="step-n">01</div><div class="step-body"><h3>Nos contás</h3><p>Escribinos por WhatsApp qué necesita tu negocio.</p></div></div>
  <div class="step"><div class="step-n">02</div><div class="step-body"><h3>Diseñamos</h3><p>Armamos las piezas y te las mostramos para aprobar.</p></div></div>
  <div class="step"><div class="step-n">03</div><div class="step-body"><h3>Entregamos</h3><p>Recibís todo listo para imprimir o publicar.</p></div></div>
</div>`
  },
  {
    slug: 'components/quote', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="quote-block">
  <blockquote>No importa si tu negocio es bueno.<br>Si se ve mal, <em style="font-style:normal;color:var(--accent)">perdés ventas todos los días.</em></blockquote>
  <p class="quote-source">Chimichurri — Studio de diseño y comunicación visual</p>
</div>`
  },
  {
    slug: 'components/portal-options', group: 'Components', theme: 'portal-page', pad: '40px',
    body: `
<div style="display:flex;flex-direction:column;gap:14px">
  <a class="portal-opt"><div class="portal-opt-icon">📦</div><div><h3>Mis entregas</h3><p>Accedé a tus archivos finales.</p></div><span class="portal-opt-arrow">→</span></a>
  <a class="portal-opt"><div class="portal-opt-icon">✅</div><div><h3>Aprobar diseño</h3><p>Revisá y aprobá propuestas.</p></div><span class="portal-opt-arrow">→</span></a>
  <a class="portal-opt"><div class="portal-opt-icon">⬆️</div><div><h3>Enviar materiales</h3><p>Subí logos, fotos y textos.</p></div><span class="portal-opt-arrow">→</span></a>
</div>`
  },
  {
    slug: 'components/cta', group: 'Components', theme: 'diseno', pad: '40px',
    body: `
<div class="cta-block" style="padding:56px 0">
  <div class="label" style="justify-content:center">Empezá ahora</div>
  <h2>¿Qué necesita<br>tu negocio hoy?</h2>
  <p>Contanos por WhatsApp y te decimos qué pack te conviene.</p>
  <div class="cta-row"><a class="btn btn-wa btn-lg">${WA} Escribinos</a><a class="btn btn-ghost btn-lg">Ver catálogos</a></div>
</div>`
  },
  {
    slug: 'components/footer', group: 'Components', theme: 'diseno', pad: '0',
    body: `
<footer class="footer">
  <div class="footer-inner">
    <div class="footer-brand"><a class="logo"><span class="logo-dot"></span>Chimichurri<span style="color:var(--text-muted);font-weight:400"> diseño</span></a><p>Studio de diseño y comunicación visual. Diseño que vende.</p></div>
    <div class="footer-col"><h5>Catálogos</h5><ul><li><a>Diseño gráfico</a></li><li><a>Físico e imprenta</a></li><li><a>Experiencias</a></li></ul></div>
    <div class="footer-col"><h5>Clientes</h5><ul><li><a>Portal clientes</a></li><li><a>WhatsApp directo</a></li></ul></div>
    <div class="footer-col"><h5>Assets</h5><ul><li><a>PDF Diseño</a></li><li><a>PDF Físico</a></li></ul></div>
  </div>
  <div class="footer-bottom"><p>© 2025 Chimichurri Diseño.</p><p>chimichurridiseno.com</p></div>
</footer>`
  },
  {
    slug: 'components/whatsapp-fab', group: 'Components', theme: 'diseno', pad: '48px 40px', center: true,
    body: `
<div style="position:relative;width:100%;height:120px">
  <a class="wa-fab" style="position:absolute;bottom:16px;right:16px" aria-label="WhatsApp">
    <svg viewBox="0 0 24 24" fill="#000"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/></svg>
  </a>
</div>
<p style="color:var(--text-muted);font-size:.8rem">Floating action button — fijo abajo a la derecha (.wa-fab).</p>`
  },
];

for (const c of cards) card(c);

writeFileSync(resolve(OUT, 'MANIFEST.json'), JSON.stringify(cards.map(c => ({ slug: c.slug, group: c.group })), null, 2));
console.log(`Generated ${cards.length} cards + styles.css into ds-bundle/`);
