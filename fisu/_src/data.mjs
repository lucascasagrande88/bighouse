// FISÚ — fuente única de contenido.

export const SITE = {
  // Dominio oficial (delegado en NIC.ar; DNS todavía sin apuntar a Netlify). Se usa para canonical, OG y sitemap.
  url: 'https://www.fisu.com.ar',
  base: '/fisu',
  name: 'FISÚ Helados',
  // Contacto: SOLO datos confirmados por el cliente. null = no se muestra en la web.
  whatsapp: null,
  email: null,
  instagram: null,
  instagramHandle: null,
};

export const CATEGORIES = [
  { id: 'todos', label: 'Todos' },
  { id: 'bombones', label: 'Bombones' },
  { id: 'bochas', label: 'Bochas' },
  { id: 'tortas', label: 'Tortas' },
  { id: 'postres', label: 'Postres' },
];

// 14 variantes reales (fuente: TXT del cliente, tabulado en FISU_CATALOGO_REAL_CANON_Y_QA_2026-10-20.json).
// Descripciones textuales del TXT: no agregar ingredientes, precios, formatos ni gramajes.
export const PRODUCTS = [
  { slug: 'bombon-escoces', name: 'Bombón escocés', short: 'Bombón escocés', family: 'Bombones', cats: ['bombones'], tag: 'Bombón', theme: 'chocolate', tint: 'choco',
    flavorLine: 'Americana y dulce de leche', flavors: ['Americana', 'Dulce de leche', 'Chocolate'], desc: 'Americana con centro de dulce de leche, baño de chocolate, copo de crema y cereza.', long: 'Americana con centro de dulce de leche, baño de chocolate, copo de crema y cereza.', img: 'p-bombon-escoces' },
  { slug: 'bombon-suizo', name: 'Bombón suizo', short: 'Bombón suizo', family: 'Bombones', cats: ['bombones'], tag: 'Bombón', theme: 'chocolate', tint: 'choco',
    flavorLine: 'Dulce de leche', flavors: ['Dulce de leche', 'Chocolate'], desc: 'Helado de dulce de leche bañado en chocolate, copo de mousse de dulce de leche y cereza. Más grande que el escocés.', long: 'Helado de dulce de leche bañado en chocolate, copo de mousse de dulce de leche y cereza. Más grande que el escocés.', img: 'p-bombon-suizo' },
  { slug: 'bocha-americana', name: 'Bocha americana', short: 'Bocha americana', family: 'Bochas', cats: ['bochas'], tag: 'Bocha', theme: 'vainilla', tint: 'yellow',
    flavorLine: 'Americana', flavors: ['Americana'], desc: 'Bocha de helado de americana.', long: 'Bocha de helado de americana.', img: 'p-bocha-americana' },
  { slug: 'bocha-chocolate', name: 'Bocha chocolate', short: 'Bocha chocolate', family: 'Bochas', cats: ['bochas'], tag: 'Bocha', theme: 'chocolate', tint: 'choco',
    flavorLine: 'Chocolate', flavors: ['Chocolate'], desc: 'Bocha de helado de chocolate.', long: 'Bocha de helado de chocolate.', img: 'p-bocha-chocolate' },
  { slug: 'bocha-frutilla', name: 'Bocha frutilla', short: 'Bocha frutilla', family: 'Bochas', cats: ['bochas'], tag: 'Bocha', theme: 'pink', tint: 'pink',
    flavorLine: 'Frutilla', flavors: ['Frutilla'], desc: 'Bocha de helado de frutilla.', long: 'Bocha de helado de frutilla.', img: 'p-bocha-frutilla' },
  { slug: 'bocha-dulce-de-leche', name: 'Bocha dulce de leche', short: 'Bocha dulce de leche', family: 'Bochas', cats: ['bochas'], tag: 'Bocha', theme: 'vainilla', tint: 'cream',
    flavorLine: 'Dulce de leche', flavors: ['Dulce de leche'], desc: 'Bocha de helado de dulce de leche.', long: 'Bocha de helado de dulce de leche.', img: 'p-bocha-dulce-de-leche' },
  { slug: 'torta-helada-chocolate', name: 'Torta helada de chocolate', short: 'Torta de chocolate', family: 'Tortas', cats: ['tortas'], tag: 'Torta', theme: 'chocolate', tint: 'choco',
    flavorLine: 'Chocolate', flavors: ['Chocolate', 'Americana'], desc: 'Base de pionono, helado de chocolate, decoración de americana, salsa de chocolate y cerezas.', long: 'Base de pionono, helado de chocolate, decoración de americana, salsa de chocolate y cerezas.', img: 'p-torta-helada-chocolate' },
  { slug: 'torta-helada-frutilla', name: 'Torta helada de frutilla', short: 'Torta de frutilla', family: 'Tortas', cats: ['tortas'], tag: 'Torta', theme: 'pink', tint: 'pink',
    flavorLine: 'Frutilla', flavors: ['Frutilla', 'Americana'], desc: 'Base de pionono, helado de frutilla, decoración de americana, cerezas y salsa de chocolate.', long: 'Base de pionono, helado de frutilla, decoración de americana, cerezas y salsa de chocolate.', img: 'p-torta-helada-frutilla' },
  { slug: 'torta-helada-dulce-de-leche', name: 'Torta helada de dulce de leche', short: 'Torta de dulce de leche', family: 'Tortas', cats: ['tortas'], tag: 'Torta', theme: 'vainilla', tint: 'cream',
    flavorLine: 'Dulce de leche', flavors: ['Dulce de leche', 'Americana'], desc: 'Base de pionono, helado de dulce de leche, decoración de americana, cerezas y salsa de chocolate.', long: 'Base de pionono, helado de dulce de leche, decoración de americana, cerezas y salsa de chocolate.', img: 'p-torta-helada-dulce-de-leche' },
  { slug: 'tricolor', name: 'Tricolor', short: 'Tricolor', family: 'Postres', cats: ['postres'], tag: 'Postre', theme: 'mix', tint: 'lilac',
    flavorLine: 'Frutilla, americana y chocolate', flavors: ['Frutilla', 'Americana', 'Chocolate'], desc: 'Helados de frutilla, americana y chocolate.', long: 'Helados de frutilla, americana y chocolate.', img: 'p-tricolor' },
  { slug: 'alfajor-helado', name: 'Alfajor helado', short: 'Alfajor', family: 'Postres', cats: ['postres'], tag: 'Postre', theme: 'chocolate', tint: 'blue',
    flavorLine: 'Chocolate y dulce de leche', flavors: ['Chocolate', 'Dulce de leche', 'Vainilla'], desc: 'Dos tapas de vainilla bañadas en chocolate, helado de chocolate y centro de dulce de leche.', long: 'Dos tapas de vainilla bañadas en chocolate, helado de chocolate y centro de dulce de leche.', img: 'p-alfajor-helado' },
  { slug: 'omele', name: 'Omele', short: 'Omele', family: 'Postres', cats: ['postres'], tag: 'Postre', theme: 'pink', tint: 'pink',
    flavorLine: 'Americana y frutilla', flavors: ['Americana', 'Frutilla'], desc: 'Pionono en media caña con helados de americana y frutilla.', long: 'Pionono en media caña con helados de americana y frutilla.', img: 'p-omele' },
  { slug: 'cuadrado-americana', name: 'Cuadrado de americana', short: 'Cuadrado', family: 'Postres', cats: ['postres'], tag: 'Postre', theme: 'pink', tint: 'pink',
    flavorLine: 'Americana con frutillas', flavors: ['Americana', 'Frutillas'], desc: 'Helado de americana con frutillas naturales y salsa.', long: 'Helado de americana con frutillas naturales y salsa.', img: 'p-cuadrado-americana' },
  { slug: 'almendrado', name: 'Almendrado', short: 'Almendrado', family: 'Postres', cats: ['postres'], tag: 'Postre', theme: 'vainilla', tint: 'yellow',
    flavorLine: 'Almendrado', flavors: ['Almendrado', 'Almendras'], desc: 'Helado almendrado con crocante de almendras.', long: 'Helado almendrado con crocante de almendras.', img: 'p-almendrado' },
];

// Slugs anteriores (productos del brand book que no están en el TXT). Redirigen al catálogo
// hasta que el cliente confirme si siguen a la venta.
export const OLD_SLUGS = ['pote-fisu', 'bombon-helado', 'barra-crocante', 'postre-tricolor', 'almendrado-chocolate', 'bombon-con-crema', 'canasta-chocolate', 'panqueque-helado', 'canastitas'];

export const bySlug = Object.fromEntries(PRODUCTS.map(p => [p.slug, p]));
