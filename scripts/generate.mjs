/* ─────────────────────────────────────────────────────────────
   Static generator for Lucas Casagrande's portfolio.
   Single source of truth = PROJECTS below.
   Produces:  /work/<slug>/index.html   (one page per project)
              /work/index.html          (all-work index)
              /sitemap.xml
              /data/projects.json       (machine-readable mirror)

   Run:  node scripts/generate.mjs
   To wire a project's real video: add its numeric Vimeo id as `vid`.
   No id -> the page falls back to the Vimeo profile (never a dead link).
──────────────────────────────────────────────────────────────*/
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SITE = "https://lucascasagrande.netlify.app";
const PROFILE = "https://vimeo.com/lucascasagrande";
const IMG = n => `https://framerusercontent.com/images/${n}`;

const PROJECTS = [
  {slug:"reel-2026",num:"01",title:"REEL 2026",sub:"Showreel",tags:["Motion Direction","3D","CGI"],img:IMG("YrJyTlynlK9JahFSr5rX0OWxnQ.jpg"),vid:"850730171",body:"A compilation of recent 3D motion work spanning brand campaigns, CGI production and motion direction across global clients — the through-line of a decade-and-a-half turning briefs into moving images."},
  {slug:"noorus-fill",num:"02",title:"NOORUS FILL+",sub:"CGI Product Visualization",tags:["3D","CGI","Product"],img:IMG("Ry0legV6ZdMtJ33X265OMneSo.jpg"),body:"Full 3D CGI product visualization for NOORUS — from modeling and shading through to final compositing."},
  {slug:"lamicell-v22",num:"03",title:"LAMICELL V22",sub:"Motion Design & Brand Film",tags:["Motion","3D","Brand"],img:IMG("UzzUtXoyoU3tIMkiuQWxpXlPsV8.png"),body:"Motion design and brand film for the Lamicell V22 product line. A clean, technical aesthetic carried by precision 3D animation."},
  {slug:"pandora",num:"04",title:"PANDORA",sub:"Luxury CGI Campaign",tags:["Jewelry","CGI","Luxury"],img:IMG("9HJsvaIulWgfdnHvFmG4RvQNZI.jpg"),body:"Luxury jewelry campaign built on photo-real CGI, with meticulous attention to light, material translucency and motion storytelling."},
  {slug:"youtopia-vitacura",num:"05",title:"YOUTOPIA VITACURA",sub:"Architectural Visualization",tags:["Arch Viz","3D","Environment"],img:IMG("gfKIAHznDJ3G9q3Vt07U8BBDk.png"),body:"Architectural visualization for Youtopia's Vitacura development — space, natural light and a lifestyle narrative rendered in 3D."},
  {slug:"toyota",num:"06",title:"TOYOTA",sub:"Full CGI Automotive TVC",tags:["Automotive","CGI","TVC"],img:IMG("RnrQ4NhU80PUisTYATbmJ4Nwuzs.png"),body:"A full-CGI automotive TVC for Toyota, driven by dynamic motion direction and photorealistic vehicle rendering."},
  {slug:"viva-one",num:"07",title:"VIVA ONE",sub:"Telecom Motion Campaign · Ogilvy Bahrain",tags:["Motion","Telecom","Ogilvy"],img:IMG("TXyn0nLFS5eLridXanzqiN5Uu4.png"),body:"Motion campaign for VIVA's ONE product — dynamic visual systems communicating connectivity and innovation, produced through Ogilvy Bahrain."},
  {slug:"claro-cgi",num:"08",title:"CLARO CGI SHOTS",sub:"CGI Product Campaign",tags:["CGI","Product","Telecom"],img:IMG("PWHIuuC48syU1NW2S0DaBuacGY.png"),body:"CGI product visualization campaign for Claro. A sleek, modern aesthetic with photo-real rendering and precise motion."},
  {slug:"gillette-j20",num:"09",title:"GILLETTE J20",sub:"TVC · MPC Shanghai",tags:["TVC","MPC Shanghai","VFX"],img:IMG("aECR4ibIPeFyGqYrSkfWdndlq0.jpg"),body:"Global TVC for Gillette produced at MPC Shanghai — 3D integration with live-action footage for an international campaign."},
  {slug:"lamicell",num:"10",title:"LAMICELL",sub:"Brand Motion System",tags:["Motion","3D","Brand"],img:IMG("Q906Xny6im8J5TaHR3JqFtCS298.png"),body:"A brand motion system for Lamicell — technical 3D animation expressing material precision and product quality."},
  {slug:"stc-film",num:"11",title:"STC FILM",sub:"TVC · Ogilvy",tags:["TVC","Ogilvy","Direction"],img:IMG("GoHCG3W3x7w1xQcf0mzGbROD8.png"),body:"TVC motion direction for STC Film, produced with Ogilvy — cinematic storytelling that fuses live action with 3D motion design."},
  {slug:"snapdragon-pro",num:"12",title:"SNAPDRAGON PRO",sub:"Superunion · Qualcomm",tags:["Superunion","Tech","Esports"],img:IMG("kkU08YO6FBR4dUxIr2ZKwM4vSRQ.jpeg"),body:"Motion and 3D direction for Qualcomm's Snapdragon Pro Series esports platform, produced with Superunion."},
  {slug:"cctv-esports",num:"13",title:"CCTV ESPORTS",sub:"Broadcast Motion Package",tags:["Broadcast","Esports","Motion"],img:IMG("f2k0CKpZ0lXBPluW681cmq8H2CI.png"),body:"Broadcast motion package for CCTV Esports — high-energy visual design for live broadcast with real-time 3D graphics."},
  {slug:"viva-fiber",num:"14",title:"VIVA FIBER",sub:"Ogilvy · Telecom",tags:["Motion","Telecom","CGI"],img:IMG("x13vZEAFyNCZgovQztriYQrZdQw.png"),body:"Visual campaign for VIVA Fiber — dynamic CGI visualization of connectivity and digital infrastructure, through Ogilvy."},
  {slug:"creepshow",num:"15",title:"CREEPSHOW",sub:"Entertainment Motion Design",tags:["Motion","Entertainment","Identity"],img:IMG("os4ky1HUKF9CSl8xvuPr0tPf5YE.jpeg"),body:"Motion identity for Creepshow — a dark, cinematic visual language with expressive 3D animation and textural compositing."},
  {slug:"stc-invest",num:"16",title:"STC INVEST",sub:"Ogilvy · Finance",tags:["Motion","Finance","STC"],img:IMG("bvUXFyWh9Be18d0csdtRrAi04U.png"),body:"Motion design for STC Invest, visualizing financial concepts through clean, authoritative 3D animation."},
  {slug:"cctv9",num:"17",title:"CCTV9",sub:"Broadcast Identity",tags:["Broadcast","Identity","Motion"],img:IMG("q5QDeU2HALgMWfWX7yoQ2jGsTU.png"),body:"Broadcast identity design for the CCTV9 documentary channel — an authoritative visual language with cinematic motion."},
  {slug:"caterpillar",num:"18",title:"CATERPILLAR",sub:"CGI Industrial Campaign",tags:["CGI","Industrial","Campaign"],img:IMG("nujs4JabOQ7y4zy4wtqaJtDmmc.png"),body:"A full-CGI industrial campaign for Caterpillar — a powerful visual language emphasizing engineering strength and precision."},
  {slug:"f1-2022",num:"19",title:"F1 2022",sub:"GP Bahrain Campaign",tags:["F1","Sports","Broadcast"],img:IMG("abFGLaxvQjVaaewslXFzdjEiA.png"),body:"Motion direction and broadcast graphics for the 2022 Formula 1 Bahrain Grand Prix campaign.",year:"2022"},
  {slug:"viva-network",num:"20",title:"VIVA NETWORK",sub:"Ogilvy · Campaign",tags:["Motion","Telecom","Ogilvy"],img:IMG("zcExtjkaMtmvRU8UdyqnlIGQ9bI.jpg"),body:"Telecom campaign for VIVA Network through Ogilvy Bahrain — motion storytelling communicating network reach and reliability."},
  {slug:"crystal-light",num:"21",title:"CRYSTAL LIGHT",sub:"CGI Beverage Campaign",tags:["CGI","Beverage","Product"],img:IMG("MUaXdygxW6taz5Ja6x86VYZcQes.png"),body:"Photo-real CGI product campaign for Crystal Light — luminous liquid simulations with precise lighting and compositing."},
  {slug:"stc-card",num:"22",title:"STC CARD",sub:"Motion · STC",tags:["Motion","Brand","STC"],img:IMG("MY9zf9fej694kxUj6NKwKCHc20.png"),body:"Motion design for the STC Card product launch — a clean, premium visual language communicating financial brand values."},
  {slug:"saint-bodhi",num:"23",title:"SAINT BODHI",sub:"Universal Music",tags:["Music","Motion","Identity"],img:IMG("1rLQcl5Mfu1YcJ1ZyVRHPR0qr8Q.jpg"),body:"Motion identity for Saint Bodhi, produced for Universal Music — atmospheric visual storytelling for a contemporary artist."},
  {slug:"f1-2019",num:"24",title:"F1 2019",sub:"GP Bahrain · Ogilvy",tags:["F1","Sports","Ogilvy"],img:IMG("o3QjqqvnYVLReardrSjUvdwYcw.jpg"),body:"Motion direction for the 2019 Formula 1 Bahrain Grand Prix campaign, through Ogilvy Bahrain.",year:"2019"},
];

/* ── helpers ── */
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const link = p => p.vid ? `https://vimeo.com/${p.vid}` : PROFILE;
const HEAD_FONTS = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preconnect" href="https://framerusercontent.com">
<link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Playfair+Display:ital@0;1&family=Space+Mono:ital@0;1&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/project.css">`;

function footer(){
  return `<footer class="pv-foot">
  <div class="ct">Let's build something<em> worth watching</em></div>
  <a class="cmail" href="mailto:contacto@lucascasagrande.com">contacto@lucascasagrande.com</a>
  <div class="pv-links">
    <a href="${PROFILE}" target="_blank" rel="noopener">Vimeo</a>
    <a href="https://www.linkedin.com/in/lucascasagrande" target="_blank" rel="noopener">LinkedIn</a>
    <a href="https://www.behance.net/lucascasagrande" target="_blank" rel="noopener">Behance</a>
    <a href="https://www.instagram.com/lucas_bighouse/" target="_blank" rel="noopener">Instagram</a>
  </div>
  <div class="pv-copy">&copy; <span id="yr">2026</span> Lucas Casagrande — Buenos Aires, AR</div>
</footer>
<script>var y=document.getElementById("yr");if(y)y.textContent=new Date().getFullYear();</script>`;
}

function projectPage(p, i){
  const prev = PROJECTS[(i - 1 + PROJECTS.length) % PROJECTS.length];
  const next = PROJECTS[(i + 1) % PROJECTS.length];
  const url = `${SITE}/work/${p.slug}/`;
  const media = p.vid
    ? `<iframe src="https://player.vimeo.com/video/${p.vid}?title=0&byline=0&portrait=0&dnt=1" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen loading="lazy" title="${esc(p.title)}"></iframe>`
    : `<a class="pv-poster" href="${link(p)}" target="_blank" rel="noopener" aria-label="Watch ${esc(p.title)} on Vimeo">
        <img src="${p.img}" alt="${esc(p.title)}" loading="lazy">
        <span class="play"><svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg></span>
        <span class="cap">Watch on Vimeo ↗</span>
       </a>`;
  const info = [
    ["Focus", p.tags.join(" · ")],
    ["Context", p.sub],
    p.year ? ["Year", p.year] : null,
  ].filter(Boolean).map(([k,v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join("\n      ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>${esc(p.title)} — Lucas Casagrande</title>
<meta name="description" content="${esc(p.title)} — ${esc(p.sub)}. ${esc(p.body)}">
<link rel="canonical" href="${url}">
<meta name="theme-color" content="#080808">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(p.title)} — Lucas Casagrande">
<meta property="og:description" content="${esc(p.sub)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${p.img}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${p.img}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
${HEAD_FONTS}
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"CreativeWork","name":${JSON.stringify(p.title)},"headline":${JSON.stringify(p.sub)},"description":${JSON.stringify(p.body)},"image":${JSON.stringify(p.img)},"url":${JSON.stringify(url)},"creator":{"@type":"Person","name":"Lucas Casagrande","url":"${SITE}/"},"keywords":${JSON.stringify(p.tags.join(", "))}}
</script>
</head>
<body>
<nav class="pv-nav">
  <a href="/" class="pv-logo">LC<b>.</b></a>
  <a href="/work/" class="pv-back">← All work</a>
</nav>

<header class="pv-hero">
  <div class="pv-hero-bg"><img src="${p.img}" alt=""></div>
  <div class="pv-hero-in">
    <div class="pv-eyebrow">Project ${p.num} · ${esc(p.tags[0])}</div>
    <h1 class="pv-title">${esc(p.title)}</h1>
    <p class="pv-sub">${esc(p.sub)}</p>
    <div class="pv-tags">${p.tags.map(t=>`<span>${esc(t)}</span>`).join("")}</div>
  </div>
</header>

<section class="pv-media"><div class="pv-frame">${media}</div></section>

<section class="pv-body">
  <div class="pv-lead">
    <p>${esc(p.body)}</p>
    <a class="pv-cta" href="${link(p)}" target="_blank" rel="noopener">${p.vid ? "Watch on Vimeo" : "See more on Vimeo"} ↗</a>
  </div>
  <div class="pv-info">
    <dl>
      ${info}
    </dl>
  </div>
</section>

<nav class="pv-pager">
  <a class="pv" href="/work/${prev.slug}/"><span class="k">← Prev</span>${esc(prev.title)}</a>
  <a class="allwork" href="/work/">All work</a>
  <a class="nx" href="/work/${next.slug}/"><span class="k">Next →</span>${esc(next.title)}</a>
</nav>

${footer()}
</body>
</html>`;
}

function allWorkPage(){
  const cards = PROJECTS.map(p => `  <a class="aw-card" href="/work/${p.slug}/">
    <img src="${p.img}" alt="${esc(p.title)}" loading="lazy">
    <div class="aw-card-info">
      <div class="aw-card-num">${p.num}</div>
      <div class="aw-card-name">${esc(p.title)}</div>
      <div class="aw-card-tag">${esc(p.tags.join(" · "))}</div>
    </div>
  </a>`).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<title>All Work — Lucas Casagrande</title>
<meta name="description" content="Selected motion, 3D and CGI projects by Lucas Casagrande — Toyota, Pandora, Gillette, Snapdragon, Ogilvy, MPC and more.">
<link rel="canonical" href="${SITE}/work/">
<meta name="theme-color" content="#080808">
<meta property="og:title" content="All Work — Lucas Casagrande">
<meta property="og:image" content="${PROJECTS[0].img}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="manifest" href="/site.webmanifest">
${HEAD_FONTS}
</head>
<body>
<nav class="pv-nav">
  <a href="/" class="pv-logo">LC<b>.</b></a>
  <a href="/" class="pv-back">← Home</a>
</nav>
<header class="aw-head">
  <div class="pv-eyebrow">Selected Projects</div>
  <h1 class="aw-title">All<em>Work</em></h1>
</header>
<main class="aw-grid">
${cards}
</main>
${footer()}
</body>
</html>`;
}

function sitemap(){
  const today = new Date().toISOString().slice(0,10);
  const urls = [
    {loc:`${SITE}/`,pri:"1.0"},
    {loc:`${SITE}/work/`,pri:"0.8"},
    ...PROJECTS.map(p=>({loc:`${SITE}/work/${p.slug}/`,pri:"0.6"})),
  ];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(u=>`  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${u.pri}</priority>
  </url>`).join("\n")}
</urlset>
`;
}

/* ── write ── */
const workDir = resolve(ROOT, "work");
if (existsSync(workDir)) rmSync(workDir, { recursive: true, force: true });
mkdirSync(workDir, { recursive: true });

PROJECTS.forEach((p, i) => {
  const dir = resolve(workDir, p.slug);
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "index.html"), projectPage(p, i));
});
writeFileSync(resolve(workDir, "index.html"), allWorkPage());
writeFileSync(resolve(ROOT, "sitemap.xml"), sitemap());
mkdirSync(resolve(ROOT, "data"), { recursive: true });
writeFileSync(resolve(ROOT, "data", "projects.json"),
  JSON.stringify(PROJECTS.map(p => ({ ...p, url: `/work/${p.slug}/`, vimeo: link(p) })), null, 2));

// slug list for index.html (keep PJ order in sync)
console.log("Generated:");
console.log("  " + PROJECTS.length + " project pages under /work/<slug>/");
console.log("  /work/index.html, /sitemap.xml, /data/projects.json");
console.log("SLUGS = " + JSON.stringify(PROJECTS.map(p => p.slug)));
