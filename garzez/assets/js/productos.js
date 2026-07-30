/* ══════════════════════════════════════════════════
   GARZEZ — Catálogo
   Fuente única de verdad: la usan la tienda, el
   detalle de producto, el carrito y el generador de
   imágenes (tools/generar-imagenes.js).

   Para cargar una prenda nueva: copiá un objeto,
   cambiá slug/sku/nombre/precio y corré
   `node garzez/tools/generar-imagenes.js`.
   ══════════════════════════════════════════════════ */

window.GARZEZ_CONFIG = {
  moneda: 'USD',
  simbolo: '$',
  whatsapp: '5491100000000',           // ← reemplazar por el número real de la marca
  instagram: '_garzez_',
  envioGratisDesde: 120,
  costoEnvio: 12,
  cupones: {
    TUKI10:   { tipo: 'porcentaje', valor: 10, texto: '10% off' },
    DROP04:   { tipo: 'porcentaje', valor: 15, texto: '15% off drop 04' },
    PANA:     { tipo: 'monto',      valor: 20, texto: '$20 off' }
  }
};

window.GARZEZ_CATEGORIAS = [
  { slug: 'franelas',    nombre: 'Franelas' },
  { slug: 'sudaderas',   nombre: 'Sudaderas' },
  { slug: 'chaquetas',   nombre: 'Chaquetas' },
  { slug: 'pantalones',  nombre: 'Pantalones' },
  { slug: 'accesorios',  nombre: 'Accesorios' }
];

window.GARZEZ_COLECCIONES = [
  { slug: 'drop-04',     nombre: 'Drop 04' },
  { slug: 'brandalismo', nombre: 'Brandalismo' },
  { slug: 'tuki',        nombre: 'Tuki' },
  { slug: 'basicos',     nombre: 'Básicos' }
];

window.GARZEZ_PRODUCTOS = [

  {
    slug: 'malandro', sku: 'GZ-001', nombre: 'Malandro',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Brandalismo', coleccionSlug: 'brandalismo',
    precio: 58, precioAnterior: null, destacado: true, nuevo: false, iconico: true,
    estampa: { frente: 'MALANDRO', espalda: 'BRANDALISMO' },
    talles: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [
      { slug: 'negro', nombre: 'Negro', hex: '#111111', stock: { S: 6, M: 9, L: 12, XL: 5, XXL: 2 } },
      { slug: 'hueso', nombre: 'Hueso', hex: '#EDE7DA', stock: { S: 3, M: 7, L: 8, XL: 4, XXL: 0 } },
      { slug: 'rojo',  nombre: 'Rojo',  hex: '#C7261B', stock: { S: 0, M: 4, L: 6, XL: 2, XXL: 0 } }
    ],
    descripcion: 'La pieza que puso a Garzez en el mapa. Tipografía prestada del imaginario publicitario y devuelta a la calle que siempre la habitó. Corte oversize, hombro caído y algodón pesado que aguanta lavadas sin perder forma.',
    detalles: [
      'Corte oversize, hombro caído',
      'Cuello acanalado 2x2 reforzado',
      'Serigrafía a mano en Caracas',
      'Etiqueta tejida en el ruedo'
    ],
    composicion: '100% algodón peinado 220 g/m²',
    calce: 'Oversize. Si buscás un calce regular, pedí un talle menos.'
  },

  {
    slug: 'noike', sku: 'GZ-002', nombre: 'Noike',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Brandalismo', coleccionSlug: 'brandalismo',
    precio: 52, precioAnterior: 64, destacado: true, nuevo: false, iconico: true,
    estampa: { frente: 'NOIKE', espalda: 'NO ES' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'hueso', nombre: 'Hueso', hex: '#EDE7DA', stock: { S: 4, M: 6, L: 3, XL: 1 } },
      { slug: 'azul',  nombre: 'Azul',  hex: '#12358F', stock: { S: 2, M: 5, L: 7, XL: 3 } }
    ],
    descripcion: 'Un logo que todo el mundo reconoce, dicho al revés. Ironía sin explicación: la broma funciona sola. Algodón medio, calce recto, para usar todos los días.',
    detalles: ['Calce regular', 'Cuello redondo acanalado', 'Estampa frontal + guiño en la espalda', 'Costura lateral cerrada'],
    composicion: '100% algodón 180 g/m²',
    calce: 'Regular. Talle real.'
  },

  {
    slug: 'tuki-tuki', sku: 'GZ-003', nombre: 'Tuki Tuki',
    tipo: 'mangalarga', categoria: 'franelas', coleccion: 'Tuki', coleccionSlug: 'tuki',
    precio: 64, precioAnterior: null, destacado: true, nuevo: true,
    estampa: { frente: 'TUKI', espalda: 'CERRO 1998' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'azul',     nombre: 'Azul eléctrico', hex: '#1B4BD8', stock: { S: 5, M: 8, L: 6, XL: 2 } },
      { slug: 'amarillo', nombre: 'Amarillo',       hex: '#F2C10D', stock: { S: 3, M: 4, L: 4, XL: 1 } }
    ],
    descripcion: 'Homenaje directo a la subcultura tuki que nació en los cerros de Caracas en los 90: logos importados, colores imposibles y una manera de vestir que nadie pidió permiso para inventar. Manga larga con estampa en pecho y sello en la espalda.',
    detalles: ['Manga larga con puño acanalado', 'Estampa pecho + espalda', 'Colores saturados de la paleta tuki', 'Preencogido'],
    composicion: '100% algodón 210 g/m²',
    calce: 'Regular amplio.'
  },

  {
    slug: 'chevere', sku: 'GZ-004', nombre: 'Chévere',
    tipo: 'hoodie', categoria: 'sudaderas', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 110, precioAnterior: null, destacado: true, nuevo: true,
    estampa: { frente: 'CHÉVERE', espalda: 'MODERNISMO' },
    talles: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [
      { slug: 'gris',  nombre: 'Gris jaspeado', hex: '#8E8E88', stock: { S: 4, M: 6, L: 9, XL: 4, XXL: 2 } },
      { slug: 'negro', nombre: 'Negro',         hex: '#141414', stock: { S: 2, M: 5, L: 7, XL: 3, XXL: 1 } },
      { slug: 'verde', nombre: 'Verde militar', hex: '#4B5540', stock: { S: 0, M: 2, L: 3, XL: 1, XXL: 0 } }
    ],
    descripcion: 'La palabra más venezolana que existe, en frisa pesada de 400 g. Capucha forrada, bolsillo canguro profundo y puños que no se aflojan. La pieza de abrigo del Drop 04.',
    detalles: ['Frisa perchada 400 g/m²', 'Capucha doble forro con cordón mate', 'Bolsillo canguro', 'Puños y ruedo acanalados'],
    composicion: '80% algodón / 20% poliéster',
    calce: 'Oversize suave.'
  },

  {
    slug: 'cerro-arriba', sku: 'GZ-005', nombre: 'Cerro Arriba',
    tipo: 'crew', categoria: 'sudaderas', coleccion: 'Tuki', coleccionSlug: 'tuki',
    precio: 95, precioAnterior: 118, destacado: false, nuevo: false,
    estampa: { frente: 'CERRO', espalda: 'ARRIBA' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'amarillo', nombre: 'Amarillo', hex: '#F5C518', stock: { S: 3, M: 5, L: 4, XL: 2 } },
      { slug: 'hueso',    nombre: 'Hueso',    hex: '#E9E3D5', stock: { S: 1, M: 3, L: 2, XL: 0 } }
    ],
    descripcion: 'Buzo sin capucha con la vista que se ve subiendo: casas una encima de otra, color sobre color. Un clásico de la casa reeditado en amarillo bandera.',
    detalles: ['Cuello redondo acanalado', 'Frisa 340 g/m²', 'Estampa en dos posiciones', 'Interior perchado'],
    composicion: '70% algodón / 30% poliéster',
    calce: 'Regular.'
  },

  {
    slug: 'guachiman', sku: 'GZ-006', nombre: 'Guachimán',
    tipo: 'chaqueta', categoria: 'chaquetas', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 165, precioAnterior: null, destacado: true, nuevo: true,
    estampa: { frente: 'GZ', espalda: 'GUACHIMÁN' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'denim', nombre: 'Denim crudo', hex: '#3F5B84', stock: { S: 2, M: 4, L: 5, XL: 2 } },
      { slug: 'negro', nombre: 'Negro lavado', hex: '#242424', stock: { S: 1, M: 3, L: 3, XL: 1 } }
    ],
    descripcion: 'Chaqueta trucker en denim de 12 oz con estampa grande en la espalda. El que cuida la esquina, el que sabe todo lo que pasa en la cuadra: ese es el guachimán.',
    detalles: ['Denim 12 oz', 'Botones metálicos grabados', 'Dos bolsillos de pecho con tapa', 'Estampa espalda serigrafiada'],
    composicion: '100% algodón denim',
    calce: 'Regular con espacio para capas.'
  },

  {
    slug: 'barquisimeto-92', sku: 'GZ-007', nombre: 'Barquisimeto 92',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 88, precioAnterior: null, destacado: false, nuevo: true,
    estampa: { frente: 'BQTO 92', espalda: '92' },
    talles: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [
      { slug: 'blanco', nombre: 'Blanco', hex: '#F2F0EA', stock: { S: 4, M: 6, L: 6, XL: 3, XXL: 1 } },
      { slug: 'rojo',   nombre: 'Rojo',   hex: '#CE2A1F', stock: { S: 2, M: 4, L: 5, XL: 2, XXL: 0 } }
    ],
    descripcion: 'Camiseta tipo jersey inspirada en el uniforme de un equipo que nunca existió, de la ciudad donde nació la marca. Tejido técnico con caída deportiva y numeración en la espalda.',
    detalles: ['Tejido tipo jersey, secado rápido', 'Número aplicado en la espalda', 'Cuello con ribete a contratono', 'Ruedo curvo'],
    composicion: '100% poliéster reciclado',
    calce: 'Regular deportivo.'
  },

  {
    slug: 'pana', sku: 'GZ-008', nombre: 'Pana',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Básicos', coleccionSlug: 'basicos',
    precio: 52, precioAnterior: null, destacado: false, nuevo: false,
    estampa: { frente: 'PANA', espalda: 'MI PANA' },
    talles: ['S', 'M', 'L', 'XL', 'XXL'],
    colores: [
      { slug: 'rojo',  nombre: 'Rojo',  hex: '#D2321F', stock: { S: 5, M: 8, L: 8, XL: 4, XXL: 2 } },
      { slug: 'negro', nombre: 'Negro', hex: '#121212', stock: { S: 4, M: 7, L: 9, XL: 5, XXL: 2 } },
      { slug: 'hueso', nombre: 'Hueso', hex: '#EDE7DA', stock: { S: 3, M: 5, L: 5, XL: 2, XXL: 1 } }
    ],
    descripcion: 'La franela que regalás. Una palabra, cero explicación, todo el afecto. Base de algodón peinado con estampa mínima al frente.',
    detalles: ['Calce regular', 'Estampa pequeña al pecho', 'Cuello redondo', 'Producción continua'],
    composicion: '100% algodón peinado 190 g/m²',
    calce: 'Regular. Talle real.'
  },

  {
    slug: 'bochinche', sku: 'GZ-009', nombre: 'Bochinche',
    tipo: 'pantalon', categoria: 'pantalones', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 125, precioAnterior: null, destacado: true, nuevo: true,
    estampa: { frente: 'GZ', espalda: 'BOCHINCHE' },
    talles: ['28', '30', '32', '34', '36'],
    colores: [
      { slug: 'arena', nombre: 'Arena', hex: '#B9A88A', stock: { 28: 2, 30: 5, 32: 6, 34: 4, 36: 1 } },
      { slug: 'negro', nombre: 'Negro', hex: '#191919', stock: { 28: 1, 30: 4, 32: 7, 34: 3, 36: 2 } }
    ],
    descripcion: 'Cargo de pierna amplia con seis bolsillos y refuerzo en rodilla. Pensado para moverse mucho y cargar de todo. El pantalón del Drop 04.',
    detalles: ['Seis bolsillos con cierre', 'Cintura ajustable con cordón interno', 'Refuerzo doble en rodilla', 'Ruedo con traba regulable'],
    composicion: '98% algodón / 2% elastano',
    calce: 'Amplio, tiro medio.'
  },

  {
    slug: 'sifrino', sku: 'GZ-010', nombre: 'Sifrino',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Brandalismo', coleccionSlug: 'brandalismo',
    precio: 78, precioAnterior: null, destacado: false, nuevo: false,
    estampa: { frente: 'SIFRINO', espalda: 'CLUB' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'verde',  nombre: 'Verde club', hex: '#255C43', stock: { S: 2, M: 4, L: 3, XL: 1 } },
      { slug: 'blanco', nombre: 'Blanco',     hex: '#F1EFE8', stock: { S: 3, M: 3, L: 4, XL: 2 } }
    ],
    descripcion: 'Chomba tejida con el código visual del club privado, usada por quien nunca fue socio. La ironía favorita de la casa, en punto piqué.',
    detalles: ['Punto piqué', 'Placket de tres botones', 'Escudo bordado al pecho', 'Ruedo con aberturas laterales'],
    composicion: '100% algodón piqué',
    calce: 'Regular.'
  },

  {
    slug: 'coroto', sku: 'GZ-011', nombre: 'Coroto',
    tipo: 'tote', categoria: 'accesorios', coleccion: 'Básicos', coleccionSlug: 'basicos',
    precio: 38, precioAnterior: null, destacado: false, nuevo: false,
    estampa: { frente: 'COROTO', espalda: 'GARZEZ' },
    talles: ['ÚNICO'],
    colores: [
      { slug: 'crudo', nombre: 'Lona cruda', hex: '#D9D0BA', stock: { 'ÚNICO': 18 } },
      { slug: 'negro', nombre: 'Negro',      hex: '#161616', stock: { 'ÚNICO': 11 } }
    ],
    descripcion: 'Bolso de lona pesada para meter todos tus corotos. Asas reforzadas, bolsillo interno y fondo cuadrado que se para solo.',
    detalles: ['Lona de algodón 12 oz', 'Asas reforzadas de 70 cm', 'Bolsillo interno con cierre', '40 × 42 × 12 cm'],
    composicion: '100% algodón lona',
    calce: 'Talle único.'
  },

  {
    slug: 'bolivar', sku: 'GZ-012', nombre: 'Bolívar',
    tipo: 'gorra', categoria: 'accesorios', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 42, precioAnterior: null, destacado: false, nuevo: true,
    estampa: { frente: 'GZ', espalda: 'BOLÍVAR' },
    talles: ['ÚNICO'],
    colores: [
      { slug: 'negro',    nombre: 'Negro',    hex: '#141414', stock: { 'ÚNICO': 14 } },
      { slug: 'amarillo', nombre: 'Amarillo', hex: '#F3C317', stock: { 'ÚNICO': 6 } },
      { slug: 'azul',     nombre: 'Azul',     hex: '#123C9E', stock: { 'ÚNICO': 0 } }
    ],
    descripcion: 'Gorra de seis paneles con logo bordado al frente y cierre metálico regulable. Visera curva pre-formada.',
    detalles: ['Seis paneles con ojales bordados', 'Logo bordado 3D', 'Cierre metálico regulable', 'Visera curva'],
    composicion: '100% algodón sarga',
    calce: 'Talle único regulable.'
  },

  {
    slug: 'perico', sku: 'GZ-013', nombre: 'Perico',
    tipo: 'short', categoria: 'pantalones', coleccion: 'Tuki', coleccionSlug: 'tuki',
    precio: 68, precioAnterior: 84, destacado: false, nuevo: false,
    estampa: { frente: 'PERICO', espalda: 'GZ' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'celeste', nombre: 'Celeste', hex: '#5FB4D6', stock: { S: 3, M: 5, L: 4, XL: 2 } },
      { slug: 'negro',   nombre: 'Negro',   hex: '#171717', stock: { S: 2, M: 4, L: 5, XL: 2 } }
    ],
    descripcion: 'Short de frisa liviana con cintura elástica y cordón. Largo por encima de la rodilla, calce suelto, para el calor de verdad.',
    detalles: ['Frisa liviana 280 g/m²', 'Cintura elástica con cordón', 'Bolsillos laterales', 'Estampa en pierna'],
    composicion: '80% algodón / 20% poliéster',
    calce: 'Suelto.'
  },

  {
    slug: 'modernismo-1950', sku: 'GZ-014', nombre: 'Modernismo 1950',
    tipo: 'chaqueta', categoria: 'chaquetas', coleccion: 'Drop 04', coleccionSlug: 'drop-04',
    precio: 210, precioAnterior: null, destacado: true, nuevo: true, edicionLimitada: true,
    estampa: { frente: '1950', espalda: 'MODERNISMO' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'crema', nombre: 'Crema', hex: '#DCD3BE', stock: { S: 1, M: 2, L: 2, XL: 1 } },
      { slug: 'azul',  nombre: 'Azul',  hex: '#1E3F7A', stock: { S: 0, M: 2, L: 3, XL: 1 } }
    ],
    descripcion: 'Bomber de edición limitada inspirada en la arquitectura del boom petrolero venezolano: líneas rectas, celosías y optimismo de concreto. Serie numerada de 80 unidades.',
    detalles: ['Serie numerada de 80', 'Forro interior estampado', 'Puños, cuello y ruedo acanalados', 'Bordado arquitectónico en la espalda'],
    composicion: 'Exterior 100% nylon / forro 100% viscosa',
    calce: 'Regular.'
  },

  {
    slug: 'cachicamo', sku: 'GZ-015', nombre: 'Cachicamo',
    tipo: 'tee', categoria: 'franelas', coleccion: 'Tuki', coleccionSlug: 'tuki',
    precio: 60, precioAnterior: null, destacado: false, nuevo: false,
    estampa: { frente: 'CACHICAMO', espalda: 'GZ 015' },
    talles: ['S', 'M', 'L', 'XL'],
    colores: [
      { slug: 'lila', nombre: 'Lila teñido', hex: '#A585C4', stock: { S: 2, M: 3, L: 2, XL: 0 } },
      { slug: 'verde', nombre: 'Verde teñido', hex: '#7FA96B', stock: { S: 1, M: 2, L: 3, XL: 1 } }
    ],
    descripcion: 'Cada pieza teñida a mano: no hay dos iguales. El cachicamo se arma su propia coraza y ninguna se parece a otra.',
    detalles: ['Teñido artesanal, pieza única', 'Estampa descargada sobre el teñido', 'Lavado previo', 'Puede variar respecto de la foto'],
    composicion: '100% algodón 200 g/m²',
    calce: 'Regular amplio.'
  },

  {
    slug: 'vergatario', sku: 'GZ-016', nombre: 'Vergatario',
    tipo: 'medias', categoria: 'accesorios', coleccion: 'Básicos', coleccionSlug: 'basicos',
    precio: 22, precioAnterior: null, destacado: false, nuevo: false,
    estampa: { frente: 'GZ', espalda: 'GZ' },
    talles: ['35-39', '40-44'],
    colores: [
      { slug: 'blanco', nombre: 'Blanco', hex: '#F0EEE7', stock: { '35-39': 12, '40-44': 15 } },
      { slug: 'negro',  nombre: 'Negro',  hex: '#151515', stock: { '35-39': 9, '40-44': 10 } }
    ],
    descripcion: 'Pack de dos pares de medias altas con logo tejido en el puño y tricolor en la caña. Algodón con refuerzo en talón y punta.',
    detalles: ['Pack de 2 pares', 'Logo tejido en el puño', 'Refuerzo en talón y punta', 'Caña alta'],
    composicion: '78% algodón / 20% poliamida / 2% elastano',
    calce: 'Elástico.'
  }

];
