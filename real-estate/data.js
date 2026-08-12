/* ============================================================================
   Chimichurri · Real Estate — Contenido centralizado
   ----------------------------------------------------------------------------
   TODO EL CONTENIDO EDITABLE VIVE ACÁ. El equipo puede reemplazar copys,
   videos, fotos y ejemplos sin tocar la lógica de la página.

   · reels[].src        → cuando exista el .mp4 real, poné la ruta y el reel
                          se reproduce solo. Si es null, se muestra la portada
                          de demostración.
   · media.video.src    → video tour real (.mp4). null = placeholder.
   · media.beforeAfter  → fotos reales (before/after). null = escena demo SVG.
   · panorama.src        → equirectangular real (.jpg). null = panorama demo.
   · properties          → datos de ejemplo para el demo de web/CRM y comparador.

   Nada de lo que hay acá inventa una propiedad, reseña o métrica real:
   son datos de DEMOSTRACIÓN, claramente etiquetados en la interfaz.
   ========================================================================== */
window.RE = {

  /* Canal de conversión real del sitio (mismo placeholder que el resto del
     sitio Chimichurri — reemplazar por el número real en un solo lugar). */
  whatsapp: {
    number: '5491100000000',
    baseMessage: 'Hola Chimichurri, quiero llevar esto a mi inmobiliaria.'
  },

  /* ── REELS ────────────────────────────────────────────────────────────── */
  reels: [
    { id: 'walk',   tag: 'Recorrido',   title: 'Un 3 ambientes que se recorre en 30 segundos', c1: '#3a3226', c2: '#0c0a07', src: null },
    { id: 'market', tag: 'Mercado',     title: 'Qué está pasando con los precios del barrio',   c1: '#26302f', c2: '#080b0a', src: null },
    { id: 'invest', tag: 'Inversión',   title: 'El 2 ambientes que se paga solo',               c1: '#332a26', c2: '#0b0806', src: null },
    { id: 'dev',    tag: 'Desarrollo',  title: 'Avance de obra: piso 8 y contrafrente',         c1: '#2b2d34', c2: '#08090c', src: null },
    { id: 'broker', tag: 'A cámara',    title: 'Tres preguntas antes de firmar un boleto',      c1: '#342630', c2: '#0b070a', src: null },
    { id: 'hood',   tag: 'Barrio',      title: 'Cómo se vive a tres cuadras del parque',         c1: '#2a3226', c2: '#080b07', src: null }
  ],

  /* ── PROPIEDADES (datos de ejemplo para el demo web + comparador) ──────── */
  properties: [
    { id: 'A', title: 'Loft Palermo',        op: 'Venta',    tipo: 'Departamento', barrio: 'Palermo',     m2: 62,  amb: 2, banos: 1, coch: 0, precio: 189000, moneda: 'USD', per: '',      c1: '#2f2a22', c2: '#0b0906' },
    { id: 'B', title: 'PH Villa Crespo',     op: 'Venta',    tipo: 'PH',           barrio: 'Villa Crespo', m2: 78,  amb: 3, banos: 1, coch: 0, precio: 165000, moneda: 'USD', per: '',      c1: '#2b2f2a', c2: '#080a08' },
    { id: 'C', title: 'Studio Belgrano',     op: 'Venta',    tipo: 'Departamento', barrio: 'Belgrano',    m2: 41,  amb: 1, banos: 1, coch: 0, precio: 118000, moneda: 'USD', per: '',      c1: '#2a2d33', c2: '#08090c' },
    { id: 'D', title: 'Casa Saavedra',       op: 'Venta',    tipo: 'Casa',         barrio: 'Saavedra',    m2: 140, amb: 4, banos: 2, coch: 1, precio: 320000, moneda: 'USD', per: '',      c1: '#332c26', c2: '#0b0806' },
    { id: 'E', title: 'Oficina Microcentro', op: 'Alquiler', tipo: 'Oficina',      barrio: 'Microcentro', m2: 55,  amb: 1, banos: 1, coch: 0, precio: 1200,   moneda: 'USD', per: '/mes',  c1: '#292d2e', c2: '#080a0a' },
    { id: 'F', title: 'Dúplex Núñez',        op: 'Venta',    tipo: 'Dúplex',       barrio: 'Núñez',       m2: 95,  amb: 3, banos: 2, coch: 1, precio: 245000, moneda: 'USD', per: '',      c1: '#302a30', c2: '#0a070a' }
  ],

  /* Capacidades del producto web (se muestran, no se prometen de más) */
  webFeatures: [
    { k: 'Inventario', d: 'Fichas de propiedad conectadas a tu inventario.' },
    { k: 'Búsqueda',   d: 'Filtros por operación, tipo, ambientes y precio.' },
    { k: 'Comparador', d: 'Dos propiedades, lado a lado, en un toque.' },
    { k: 'WhatsApp',   d: 'Siempre a mano, en cada ficha.' },
    { k: 'Asistente',  d: 'Chat que responde y deriva la consulta.' },
    { k: 'Mapa',       d: 'Ubicación y entorno de cada propiedad.' },
    { k: 'Reseñas',    d: 'Se conecta con tu perfil de Google.' },
    { k: 'SEO + GEO',  d: 'Estructura pensada para búsqueda y descubrimiento.' }
  ],

  /* Mecanismos de integración con CRM (responsable, sin logos falsos) */
  crm: ['API', 'Feeds', 'Webhooks', 'Imports', 'Embeds', 'Middleware'],

  /* Property Media */
  media: {
    /* Antes / Después. Si beforeImg/afterImg son null → escena demo (SVG+CSS). */
    beforeAfter: { beforeImg: null, afterImg: null },
    /* Video tour. src null → poster + placeholder de demostración. */
    video: { src: null, poster: null }
  },

  /* Panorama 360. src null → panorama sintético de demostración. */
  panorama: { src: null },

  /* Toolkit de Property Media (encabezados de la sección) */
  toolkit: [
    { k: 'Retoque profesional',   d: 'Color, exposición, balance de blancos y perspectiva.' },
    { k: 'Vaciado virtual',       d: 'Quitamos objetos temporales para leer el espacio.' },
    { k: 'Privacidad',            d: 'Sacamos datos y objetos personales del propietario.' },
    { k: 'Álbum profesional',     d: 'Set de fotos listo para portales y redes.' },
    { k: 'Video tour cinematográfico', d: 'Un recorrido que se mira hasta el final.' },
    { k: '360° inmersivo',        d: 'La propiedad se explora desde el teléfono.' }
  ]
};
