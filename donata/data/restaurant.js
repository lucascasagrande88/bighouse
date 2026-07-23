/* ============================================================
   DONATA · DATOS DEL NEGOCIO
   ------------------------------------------------------------
   TODO el contenido de negocio vive acá. Ningún dato de
   contacto, texto de marca o enlace está hardcodeado en los
   componentes. Editá este archivo para actualizar el sitio.

   ⚠️  Los campos marcados con  // PENDIENTE  deben confirmarse
       con Donata antes de publicar. Ver /donata/PENDIENTE.md
   ============================================================ */

window.DONATA_DATA = {

  // ── Identidad ──────────────────────────────────────────────
  name: 'DONATA',
  tagline: 'Restaurante · Parrilla · Minutas',
  concept: 'Fuego de barrio',
  claim: 'ACÁ SE VIENE A COMER DE VERDAD.',
  heroSubtitle: 'Parrilla encendida, platos abundantes y una mesa lista para compartir en Quilmes.',

  // ── Contacto ───────────────────────────────────────────────
  address: {
    street: 'Av. Calchaquí 2539',
    area: 'Quilmes Oeste',
    city: 'Buenos Aires',
    full: 'Av. Calchaquí 2539, Quilmes Oeste, Buenos Aires',
    // Preview de mapa: link directo a Google Maps (búsqueda por dirección).
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Av.+Calchaqu%C3%AD+2539+Quilmes+Oeste',
    // PENDIENTE: reemplazar por el enlace del perfil de Google Business real
    // (para reseñas y "Cómo llegar" exacto con Place ID).
  },

  phones: [
    { label: '11 2113-5677', tel: '+541121135677', wa: '5491121135677' },
    { label: '11 5496-7268', tel: '+541154967268', wa: '5491154967268' },
  ],
  // Teléfono/WhatsApp principal usado en los CTA (índice del array de arriba).
  primaryPhoneIndex: 0,

  instagram: {
    handle: '@donataquilmes',
    url: 'https://www.instagram.com/donataquilmes/',
  },

  // ── Horarios ───────────────────────────────────────────────
  // PENDIENTE: confirmar horarios reales. NO se inventan.
  // Mientras 'confirmed' sea false: no se muestra "Abierto ahora"
  // ni horarios exactos; se muestra "Consultá horarios".
  hours: {
    confirmed: false,
    schedule: [
      // Ejemplo de estructura (rellenar cuando se confirmen):
      // { days: 'Lunes a Jueves', open: '12:00', close: '15:30' },
      // { days: 'Viernes y Sábado', open: '20:00', close: '00:30' },
    ],
  },

  // ── Servicios que se comunican ─────────────────────────────
  services: [
    'Restaurante y salón',
    'Parrilla y asador criollo',
    'Minutas',
    'Platos abundantes',
    'Comida para compartir',
    'Reservas',
    'Delivery',
    'Pedidos para retirar',
    'Menús especiales',
    'Eventos y celebraciones',
  ],

  // Franja/marquee informativa
  marquee: ['Quilmes Oeste', 'Parrilla', 'Minutas', 'Delivery', 'Eventos', 'Reservas', 'Para compartir'],

  // ── WhatsApp: mensajes precargados por acción ──────────────
  whatsappMessages: {
    reservar: 'Hola Donata, quisiera consultar disponibilidad para reservar una mesa.',
    pedir: 'Hola Donata, quisiera consultar el menú y hacer un pedido.',
    evento: 'Hola Donata, quisiera consultar por un evento o celebración.',
    general: 'Hola Donata, quería hacerles una consulta.',
  },

  // ── Textos editoriales (claims / manifiesto) ───────────────
  copy: {
    featuredTitle: 'LOS QUE NO FALLAN.',
    manifestoTitle: ['NO HACEMOS PLATOS PARA LA FOTO.', 'HACEMOS PLATOS PARA QUE VUELVAS.'],
    manifestoBody: 'Donata es ese lugar donde siempre hay algo rico saliendo de la cocina, una mesa que se agranda y una excusa para quedarse un rato más.',
    fireTitle: 'TODO EMPIEZA EN EL FUEGO.',
    galleryTitle: 'DE LA COCINA AL SALÓN.',
    reviewsTitle: 'LO DICE LA MESA DE AL LADO.',
    locationTitle: 'ESTAMOS ACÁ NOMÁS.',
    closingTitle: 'LA MESA ESTÁ LISTA.',
    experiences: [
      {
        key: 'comer',
        kicker: '01',
        title: 'Vení a comer',
        text: 'Salón, familia, amigos y platos para compartir. Vení con hambre.',
        cta: 'Reservar mesa',
        action: 'reservar',
      },
      {
        key: 'delivery',
        kicker: '02',
        title: 'Te lo llevamos',
        text: 'Delivery o lo retirás por el local. Lo mismo de siempre, en tu mesa.',
        cta: 'Pedir por WhatsApp',
        action: 'pedir',
      },
      {
        key: 'eventos',
        kicker: '03',
        title: 'Festejalo acá',
        text: 'Cumpleaños, reuniones, eventos y menús especiales. Nos encargamos nosotros.',
        cta: 'Consultar evento',
        action: 'evento',
      },
    ],
  },

  // ── Prueba social ──────────────────────────────────────────
  // PENDIENTE: cargar reseñas REALES de Google cuando se provean.
  // NUNCA inventar nombres, estrellas ni testimonios.
  // Si el array está vacío, la sección muestra un CTA honesto a Google.
  reviews: [
    // { name: '', rating: 5, text: '', source: 'Google' },
  ],

  // ── Créditos ───────────────────────────────────────────────
  credits: 'Diseño y desarrollo por Chimichurri.',
  creditsUrl: '/',
};
