/* ══════════════════════════════════════════════════
   GARZEZ — Generador de imágenes provisorias
   Crea los SVG de producto, lookbook y hero a partir
   del catálogo. Cuando lleguen las fotos reales de la
   marca, se reemplazan los archivos de assets/img/
   y no hay que tocar nada más.

   Uso:  node garzez/tools/generar-imagenes.js
   ══════════════════════════════════════════════════ */

const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const DIR_PROD = path.join(RAIZ, 'assets/img/productos');
const DIR_EDIT = path.join(RAIZ, 'assets/img/editorial');

/* ─── Catálogo (fuente única compartida con la web) ─── */
const src = fs.readFileSync(path.join(RAIZ, 'assets/js/productos.js'), 'utf8');
const productos = new Function('window', `${src}; return window.GARZEZ_PRODUCTOS;`)({});

/* ─── Utilidades de color ─── */
function luminancia(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function mezclar(hex, hacia, cantidad) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(hacia.slice(1), 16);
  const canal = (desp) => {
    const ca = (a >> desp) & 255, cb = (b >> desp) & 255;
    return Math.round(ca + (cb - ca) * cantidad);
  };
  return '#' + [16, 8, 0].map(d => canal(d).toString(16).padStart(2, '0')).join('');
}
const oscurecer = (hex, k = 0.22) => mezclar(hex, '#000000', k);
const aclarar = (hex, k = 0.22) => mezclar(hex, '#ffffff', k);
const contraste = (hex) => (luminancia(hex) > 0.62 ? '#0A0A0A' : '#F4F1EA');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ─── Siluetas de prenda (dibujadas sobre un área de 600×700) ─── */
const siluetas = {
  tee: () => `
    M242 98 Q300 142 358 98 L446 126 L512 174 L476 254 L434 210
    L444 602 L156 602 L166 210 L124 254 L88 174 L154 126 Z`,
  mangalarga: () => `
    M242 98 Q300 142 358 98 L446 126 L528 210 L556 396 L496 412 L434 216
    L444 602 L156 602 L166 216 L104 412 L44 396 L72 210 L154 126 Z`,
  crew: () => `
    M238 106 Q300 152 362 106 L450 134 L532 218 L560 400 L500 416 L448 222
    L448 594 L152 594 L152 222 L100 416 L40 400 L68 218 L150 134 Z`,
  hoodie: () => `
    M232 112 Q300 158 368 112 L456 140 L538 224 L566 406 L506 422 L450 228
    L450 604 L150 604 L150 228 L94 422 L34 406 L62 224 L144 140 Z`,
  chaqueta: () => `
    M230 104 L300 142 L370 104 L456 132 L534 216 L558 396 L500 412 L450 222
    L450 596 L150 596 L150 222 L100 412 L42 396 L66 216 L144 132 Z`,
  pantalon: () => `
    M172 92 L428 92 L444 178 L416 610 L318 610 L300 300 L282 610 L184 610 L156 178 Z`,
  short: () => `
    M172 110 L428 110 L442 190 L420 448 L322 448 L300 300 L278 448 L180 448 L158 190 Z`,
  gorra: () => `
    M150 400 C150 250 210 176 300 176 C390 176 450 250 450 400 Z`,
  tote: () => `
    M160 250 L440 250 L468 620 L132 620 Z`,
  medias: () => `
    M206 142 L294 142 L294 402 C294 438 316 452 352 456 L398 462
    C420 464 426 478 426 496 C426 516 410 530 390 530
    L250 530 C222 530 206 512 206 486 Z`
};

/* Detalles por tipo: costuras, puños, bolsillos */
function detalles(tipo, c, sombra, vista = 'frente') {
  const linea = `stroke="${sombra}" stroke-width="3" fill="none" stroke-linecap="round"`;
  /* La espalda de una chaqueta no lleva botonadura ni bolsillos frontales */
  if (tipo === 'chaqueta' && vista === 'espalda') {
    return `<path d="M230 104 L300 142 L370 104" ${linea} opacity="0.45"/>
            <path d="M168 232 L432 232" ${linea} opacity="0.28"/>
            <rect x="150" y="562" width="300" height="34" fill="${sombra}" opacity="0.24"/>
            <path d="M500 412 L558 396 M100 412 L42 396" ${linea} opacity="0.32"/>`;
  }
  switch (tipo) {
    case 'tee':
      return `<path d="M242 98 Q300 142 358 98 Q300 126 242 98" fill="${sombra}" opacity="0.85"/>
              <path d="M162 566 L438 566" ${linea} opacity="0.32"/>
              <path d="M476 254 L434 210 M124 254 L166 210" ${linea} opacity="0.28"/>`;
    case 'mangalarga':
      return `<path d="M242 98 Q300 142 358 98 Q300 126 242 98" fill="${sombra}" opacity="0.85"/>
              <path d="M496 412 L556 396 M104 412 L44 396" ${linea} opacity="0.35"/>
              <path d="M162 566 L438 566" ${linea} opacity="0.32"/>`;
    case 'crew':
      return `<path d="M238 106 Q300 152 362 106 Q300 130 238 106" fill="${sombra}" opacity="0.85"/>
              <rect x="152" y="558" width="296" height="36" fill="${sombra}" opacity="0.26"/>
              <path d="M500 416 L560 400 M100 416 L40 400" ${linea} opacity="0.35"/>`;
    case 'hoodie':
      return `<path d="M232 112 C256 202 344 202 368 112 C338 154 262 154 232 112" fill="${sombra}" opacity="0.65"/>
              <path d="M246 122 C246 200 354 200 354 122" ${linea} opacity="0.45"/>
              <path d="M214 448 L386 448 L374 524 L226 524 Z" fill="${sombra}" opacity="0.2"/>
              <rect x="150" y="566" width="300" height="38" fill="${sombra}" opacity="0.26"/>
              <path d="M506 422 L566 406 M94 422 L34 406" ${linea} opacity="0.35"/>
              <circle cx="274" cy="182" r="6" fill="${sombra}"/><circle cx="326" cy="182" r="6" fill="${sombra}"/>`;
    case 'chaqueta':
      return `<path d="M300 142 L300 596" ${linea} opacity="0.5"/>
              <path d="M230 104 L300 142 L370 104" ${linea} opacity="0.45"/>
              <path d="M168 232 L262 232 M338 232 L432 232" ${linea} opacity="0.32"/>
              <rect x="198" y="286" width="64" height="50" fill="none" stroke="${sombra}" stroke-width="3" opacity="0.38"/>
              <rect x="338" y="286" width="64" height="50" fill="none" stroke="${sombra}" stroke-width="3" opacity="0.38"/>
              <rect x="150" y="562" width="300" height="34" fill="${sombra}" opacity="0.24"/>
              <path d="M500 412 L558 396 M100 412 L42 396" ${linea} opacity="0.32"/>
              ${[190, 258, 326, 394, 462, 530].map(y => `<circle cx="300" cy="${y}" r="5.5" fill="${sombra}"/>`).join('')}`;
    case 'pantalon':
      return `<path d="M172 92 L428 92" stroke="${sombra}" stroke-width="14" opacity="0.4" fill="none"/>
              <path d="M300 120 L300 300" ${linea} opacity="0.4"/>
              <path d="M186 300 L214 300 M386 300 L414 300" ${linea} opacity="0.3"/>
              <rect x="176" y="300" width="72" height="80" fill="none" stroke="${sombra}" stroke-width="3" opacity="0.4"/>
              <rect x="352" y="300" width="72" height="80" fill="none" stroke="${sombra}" stroke-width="3" opacity="0.4"/>`;
    case 'short':
      return `<path d="M172 110 L428 110" stroke="${sombra}" stroke-width="14" opacity="0.4" fill="none"/>
              <path d="M300 140 L300 300" ${linea} opacity="0.4"/>
              <path d="M180 416 L278 416 M322 416 L420 416" ${linea} opacity="0.3"/>`;
    case 'gorra':
      return `<path d="M150 400 L470 400 C470 452 420 470 300 470 C210 470 150 448 150 400 Z" fill="${sombra}" opacity="0.32"/>
              <path d="M300 176 L300 400" ${linea} opacity="0.35"/>
              <circle cx="300" cy="186" r="9" fill="${sombra}"/>`;
    case 'tote':
      return `<path d="M212 252 C212 168 250 132 300 132 C350 132 388 168 388 252" stroke="${sombra}" stroke-width="16" fill="none" opacity="0.75"/>
              <path d="M140 300 L460 300" ${linea} opacity="0.25"/>`;
    case 'medias':
      return `<rect x="206" y="142" width="88" height="40" fill="${sombra}" opacity="0.35"/>
              <path d="M294 402 C294 438 316 452 352 456" ${linea} opacity="0.3"/>
              <path d="M352 456 L352 528" ${linea} opacity="0.25"/>`;
    default: return '';
  }
}

/* ─── Zona de estampa por tipo de prenda ─── */
const zonaEstampa = {
  tee:        { x: 300, y: 340, w: 230 },
  mangalarga: { x: 300, y: 340, w: 230 },
  crew:       { x: 300, y: 340, w: 230 },
  hoodie:     { x: 300, y: 306, w: 200 },
  chaqueta:   { x: 230, y: 272, w: 96 },
  pantalon:   { x: 300, y: 470, w: 120 },
  short:      { x: 300, y: 300, w: 120 },
  gorra:      { x: 300, y: 300, w: 170 },
  tote:       { x: 300, y: 430, w: 220 },
  medias:     { x: 250, y: 300, w: 80 }
};

/* Encuadre: centra y escala la prenda dentro del lienzo de 800×1000 */
const encuadre = {
  tee:        { s: 1.24, cx: 300, cy: 350 },
  mangalarga: { s: 1.16, cx: 300, cy: 350 },
  crew:       { s: 1.14, cx: 300, cy: 350 },
  hoodie:     { s: 1.12, cx: 300, cy: 358 },
  chaqueta:   { s: 1.14, cx: 300, cy: 350 },
  pantalon:   { s: 1.24, cx: 300, cy: 351 },
  short:      { s: 1.55, cx: 300, cy: 279 },
  gorra:      { s: 1.90, cx: 310, cy: 323 },
  tote:       { s: 1.40, cx: 300, cy: 376 },
  medias:     { s: 1.60, cx: 316, cy: 336 }
};
const transformar = (tipo) => {
  const e = encuadre[tipo] || encuadre.tee;
  return `translate(400 512) scale(${e.s}) translate(${-e.cx} ${-e.cy})`;
};

/* ─── Lienzo de producto ─── */
function svgProducto(p, color, vista) {
  const base = color.hex;
  const sombra = oscurecer(base, luminancia(base) > 0.5 ? 0.2 : 0.42);
  const tinta = contraste(base);
  const fondo = luminancia(base) > 0.55 ? '#E2DED1' : '#EFECE3';
  const tipo = p.tipo;
  const frente = vista === 'frente';
  /* La chaqueta lleva el logo chico al pecho y la estampa grande centrada atrás */
  const z = (!frente && tipo === 'chaqueta')
    ? { x: 300, y: 356, w: 230 }
    : (zonaEstampa[tipo] || zonaEstampa.tee);

  /* Estampa: al frente el nombre corto, atrás el sello de colección */
  const titulo = frente ? p.estampa.frente : p.estampa.espalda;
  /* Ajusta el cuerpo tipográfico para que la estampa no se salga de la prenda */
  const escalaTexto = Math.min(1, z.w / (titulo.length * 36));

  /* La chaqueta lleva solo un logo chico al pecho, sin bajada */
  const cuerpoEstampa = (frente && tipo === 'chaqueta')
    ? `<text x="${z.x}" y="${z.y}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif"
             font-size="30" fill="${tinta}" letter-spacing="-0.5">${esc(titulo)}</text>`
    : frente
    ? `<text x="${z.x}" y="${z.y}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif"
             font-size="${Math.round(58 * escalaTexto)}" fill="${tinta}" letter-spacing="-1">${esc(titulo)}</text>
       <text x="${z.x}" y="${z.y + 26}" text-anchor="middle" font-family="Space Mono, monospace"
             font-size="13" fill="${tinta}" opacity="0.75" letter-spacing="4">${esc(p.coleccion.toUpperCase())}</text>`
    : `<text x="${z.x}" y="${z.y - 30}" text-anchor="middle" font-family="Space Mono, monospace"
             font-size="13" fill="${tinta}" opacity="0.7" letter-spacing="6">GARZEZ · CARACAS</text>
       <text x="${z.x}" y="${z.y + 14}" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif"
             font-size="${Math.round(44 * escalaTexto)}" fill="${tinta}" letter-spacing="-1">${esc(titulo)}</text>
       <g transform="translate(${z.x - 51}, ${z.y + 40})">
         <rect width="34" height="9" fill="#FFC700"/><rect x="34" width="34" height="9" fill="#0B3CC1"/><rect x="68" width="34" height="9" fill="#E02B1D"/>
       </g>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img"
     aria-label="${esc(p.nombre)} — ${esc(color.nombre)}, vista ${esc(vista)}">
  <defs>
    <filter id="grano"><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.05"/></feComponentTransfer></filter>
    <linearGradient id="luz" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.14"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.12"/>
    </linearGradient>
  </defs>

  <rect width="800" height="1000" fill="${fondo}"/>
  <text x="400" y="620" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif"
        font-size="240" fill="#0A0A0A" opacity="0.045" letter-spacing="-8">GARZEZ</text>
  <g opacity="0.5">
    <rect x="0" y="0" width="800" height="4" fill="#FFC700"/>
    <rect x="0" y="996" width="800" height="4" fill="#E02B1D"/>
  </g>

  <g transform="${transformar(tipo)}">
    <path d="${siluetas[tipo]()}" fill="${base}"/>
    <path d="${siluetas[tipo]()}" fill="url(#luz)"/>
    ${detalles(tipo, base, sombra, vista)}
    <g>${cuerpoEstampa}</g>
  </g>

  <rect width="800" height="1000" filter="url(#grano)" opacity="0.55"/>
  <text x="34" y="52" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.55" letter-spacing="3">${esc(p.sku)}</text>
  <text x="766" y="52" text-anchor="end" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.55" letter-spacing="3">${vista.toUpperCase()}</text>
  <text x="34" y="962" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.55" letter-spacing="3">${esc(color.nombre.toUpperCase())}</text>
  <text x="766" y="962" text-anchor="end" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.55" letter-spacing="3">${esc(p.coleccion.toUpperCase())}</text>
</svg>`;
}

/* ─── Piezas editoriales: modernismo caraqueño + tricolor ─── */
function svgEditorial(pieza, i) {
  const { titulo, epigrafe, tono, w = 900, h = 1100 } = pieza;
  const cielo = tono;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(titulo)}">
  <defs>
    <filter id="g${i}"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.06"/></feComponentTransfer></filter>
    <linearGradient id="c${i}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${aclarar(cielo, 0.3)}"/><stop offset="1" stop-color="${oscurecer(cielo, 0.25)}"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#c${i})"/>
  <circle cx="${w * 0.74}" cy="${h * 0.2}" r="${w * 0.17}" fill="#FFC700" opacity="0.9"/>
  <!-- edificios: geometría del boom del 50 -->
  <g fill="#0A0A0A" opacity="0.88">
    <rect x="${w * 0.06}" y="${h * 0.42}" width="${w * 0.2}" height="${h * 0.58}"/>
    <rect x="${w * 0.3}" y="${h * 0.3}" width="${w * 0.16}" height="${h * 0.7}"/>
    <rect x="${w * 0.5}" y="${h * 0.5}" width="${w * 0.22}" height="${h * 0.5}"/>
    <rect x="${w * 0.76}" y="${h * 0.38}" width="${w * 0.18}" height="${h * 0.62}"/>
  </g>
  <g fill="${aclarar(cielo, 0.55)}" opacity="0.5">
    ${Array.from({ length: 40 }, (_, k) => {
      const col = [0.08, 0.32, 0.52, 0.78][k % 4];
      const fila = Math.floor(k / 4);
      return `<rect x="${w * col}" y="${h * (0.53 + fila * 0.05)}" width="${w * 0.045}" height="${h * 0.026}"/>`;
    }).join('')}
  </g>
  <g transform="translate(${w * 0.06}, ${h * 0.1})">
    <rect width="${w * 0.1}" height="10" fill="#E02B1D"/>
    <text y="${Math.round(w * 0.098)}" font-family="Archivo Black, Arial Black, sans-serif" font-size="${Math.round(w * 0.075)}" fill="#0A0A0A" letter-spacing="-2">${esc(titulo)}</text>
    <text y="${Math.round(w * 0.098) + 36}" font-family="Space Mono, monospace" font-size="${Math.round(w * 0.021)}" fill="#0A0A0A" opacity="0.7" letter-spacing="5">${esc(epigrafe)}</text>
  </g>
  <rect width="${w}" height="${h}" filter="url(#g${i})" opacity="0.6"/>
</svg>`;
}

/* ─── Hero ─── */
function svgHero() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 700 820" width="700" height="820" role="img" aria-label="Drop 04 — Modernismo Tropical">
  <defs>
    <filter id="gh"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3"/>
      <feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope="0.07"/></feComponentTransfer></filter>
  </defs>
  <rect width="700" height="820" fill="#FFC700"/>
  <g transform="translate(560 54)">
    <rect width="34" height="9" fill="#0A0A0A"/><rect x="40" width="34" height="9" fill="#0B3CC1"/><rect x="80" width="34" height="9" fill="#E02B1D"/>
  </g>
  <text x="52" y="66" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.65" letter-spacing="5">GZ-001 · MALANDRO</text>

  <g transform="translate(350 420) scale(1.18) translate(-300 -350)">
    <path d="${siluetas.tee()}" fill="#0A0A0A"/>
    ${detalles('tee', '#0A0A0A', '#333333')}
    <text x="300" y="340" text-anchor="middle" font-family="Archivo Black, Arial Black, sans-serif" font-size="46" fill="#F4F1EA" letter-spacing="-1">MALANDRO</text>
    <text x="300" y="366" text-anchor="middle" font-family="Space Mono, monospace" font-size="13" fill="#FFC700" letter-spacing="6">DROP 04</text>
    <g transform="translate(249, 386)">
      <rect width="34" height="9" fill="#FFC700"/><rect x="34" width="34" height="9" fill="#0B3CC1"/><rect x="68" width="34" height="9" fill="#E02B1D"/>
    </g>
  </g>

  <text x="52" y="772" font-family="Archivo Black, Arial Black, sans-serif" font-size="42" fill="#0A0A0A" letter-spacing="-1">DROP 04</text>
  <text x="648" y="772" text-anchor="end" font-family="Space Mono, monospace" font-size="15" fill="#0A0A0A" opacity="0.65" letter-spacing="4">MODERNISMO TROPICAL</text>
  <rect width="700" height="820" filter="url(#gh)" opacity="0.5"/>
</svg>`;
}

/* ─── Escritura ─── */
fs.mkdirSync(DIR_PROD, { recursive: true });
fs.mkdirSync(DIR_EDIT, { recursive: true });

let n = 0;
for (const p of productos) {
  for (const color of p.colores) {
    for (const vista of ['frente', 'espalda']) {
      const archivo = `${p.slug}-${color.slug}-${vista}.svg`;
      fs.writeFileSync(path.join(DIR_PROD, archivo), svgProducto(p, color, vista));
      n++;
    }
  }
}

const editoriales = [
  { archivo: 'look-01.svg', titulo: 'CARACAS 1950', epigrafe: 'MODERNISMO TROPICAL / 01', tono: '#4FB8D8', w: 1200, h: 800 },
  { archivo: 'look-02.svg', titulo: 'TUKI', epigrafe: 'SUBCULTURA / CARACAS 1990', tono: '#E86A9B', w: 800, h: 1000 },
  { archivo: 'look-03.svg', titulo: 'BRANDALISMO', epigrafe: 'ARCHIVO / 2017-2025', tono: '#F0A33C', w: 800, h: 1000 },
  { archivo: 'look-04.svg', titulo: 'BARQUISIMETO', epigrafe: 'DONDE EMPEZO TODO', tono: '#7FBF6A', w: 800, h: 620 },
  { archivo: 'look-05.svg', titulo: 'EL CERRO', epigrafe: 'COLOR SOBRE COLOR', tono: '#C46FE0', w: 800, h: 620 },
  { archivo: 'look-06.svg', titulo: 'DROP 04', epigrafe: 'DISPONIBLE AHORA', tono: '#4B7BE5', w: 1200, h: 700 }
];
editoriales.forEach((e, i) => fs.writeFileSync(path.join(DIR_EDIT, e.archivo), svgEditorial(e, i)));
fs.writeFileSync(path.join(DIR_EDIT, 'hero.svg'), svgHero());

console.log(`✓ ${n} imágenes de producto en assets/img/productos/`);
console.log(`✓ ${editoriales.length + 1} piezas editoriales en assets/img/editorial/`);
