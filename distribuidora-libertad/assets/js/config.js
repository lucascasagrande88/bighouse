/* =========================================================================
   Distribuidora Libertad · configuración base
   - SUPABASE: proyecto propio de Libertad (lo usan web, catálogo y tablero).
   - AJUSTES: valores por defecto. Desde el Tablero > Sitio se pisan.
   ========================================================================= */
window.LIB_SUPABASE = {
  url: "",
  key: ""
};

window.LIB_DEFAULTS = {
  whatsapp: "5492657557780",
  whatsapp_visible: "2657 55-7780",
  telefono: "02657 435525",
  email: "ventas@distrilibertad.com.ar",
  direccion: "Edison 666",
  localidad: "Villa Mercedes (5732), San Luis",
  horario: "",
  lista_nombre: "Agosto 2026",
  nota_precios: "Precios de lista mayorista. Pueden variar sin previo aviso; confirmamos el total al recibir tu pedido.",
  aviso: "",
  hero_titulo: "Ferretería por mayor, con palabra.",
  hero_bajada: "Hace 24 años abastecemos ferreterías, comercios y profesionales de toda la provincia de San Luis desde Villa Mercedes.",
  anios: "24",
  instagram: "",
  facebook: "",
  zonas: "Villa Mercedes\nSan Luis Capital\nValle del Conlara\nZona norte\nZona sur"
};

/* Rubros: id estable (se guarda en la base), nombre visible y bajada corta. */
window.LIB_RUBROS = [
  { id: "corte",        nombre: "Herramientas eléctricas y corte", corto: "Eléctricas y corte", bajada: "Amoladoras, discos, mechas, sierras copa." },
  { id: "manuales",     nombre: "Herramientas manuales",           corto: "Manuales",           bajada: "Llaves, pinzas, martillos, destornilladores." },
  { id: "fijaciones",   nombre: "Tornillería y fijaciones",        corto: "Fijaciones",         bajada: "Tornillos, bulones, tarugos, remaches." },
  { id: "electricidad", nombre: "Electricidad e iluminación",      corto: "Electricidad",       bajada: "Cables, tomas, térmicas, lámparas LED." },
  { id: "plomeria",     nombre: "Plomería y sanitarios",           corto: "Plomería",           bajada: "Canillas, flexibles, conexiones, caños." },
  { id: "pintureria",   nombre: "Pinturería",                      corto: "Pinturería",         bajada: "Rodillos, pinceles, lijas, accesorios." },
  { id: "quimicos",     nombre: "Adhesivos, químicos y cintas",    corto: "Químicos y cintas",  bajada: "Siliconas, adhesivos, cintas, lubricantes." },
  { id: "riego",        nombre: "Riego y jardín",                  corto: "Riego y jardín",     bajada: "Mangueras, aspersores, herramientas de jardín." },
  { id: "gas",          nombre: "Gas y calefacción",               corto: "Gas",                bajada: "Llaves de paso, reguladores, flexibles." },
  { id: "herrajes",     nombre: "Ruedas, herrajes y soportes",     corto: "Herrajes",           bajada: "Ruedas, bisagras, ménsulas, cadenas." },
  { id: "seguridad",    nombre: "Cerrajería y seguridad",          corto: "Cerrajería",         bajada: "Candados, cerraduras, elementos de seguridad." },
  { id: "mallas",       nombre: "Mallas, tejidos y alambres",      corto: "Mallas y alambres",  bajada: "Tejido romboidal, alambre, mallas." },
  { id: "general",      nombre: "Ferretería general",              corto: "General",            bajada: "Todo lo que una ferretería necesita." }
];

/* Destacados de arranque (luego se manejan desde el Tablero). */
window.LIB_DESTACADOS_BASE = [
  ["EVO115TF", "assets/img/productos/disco.webp"],
  ["HUS-SO996067", "assets/img/productos/copas.webp"],
  ["EVOL3661", "assets/img/productos/tijera.webp"],
  ["HUS-BRIP08", "assets/img/productos/pinza.webp"],
  ["EVOL1210", "assets/img/productos/tubos.webp"],
  ["HUS-JPLA1000", "assets/img/productos/llavetubo.webp"],
  ["EVOL1422", "assets/img/productos/machete.webp"],
  ["HUS-R015", "assets/img/productos/rodillo.webp"],
  ["HUS-AB12226", "assets/img/productos/flexible.webp"],
  ["HUS-AB9020", "assets/img/productos/canilla.webp"],
  ["EVOL2470", "assets/img/productos/cadena.webp"],
  ["EVOL1710", "assets/img/productos/porta.webp"],
  ["EVOL1143", "assets/img/productos/pelacables.webp"],
  ["EVOL6770", "assets/img/productos/tejido.webp"]
];

/* Imágenes generadas disponibles (poner en true a medida que se suben a assets/img/). */
window.LIB_ASSETS = {
  hero: true,         // assets/img/hero-desktop.webp + hero-mobile.webp
  // rubros con ícono 3D listo (assets/img/rubros/rubro-<id>.webp); el resto usa ícono de línea
  rubros: ["corte", "manuales", "fijaciones", "electricidad", "plomeria", "pintureria", "quimicos", "riego"],
  covers: false,      // assets/img/rubros/cover-<id>.webp
  historia: false,    // assets/img/historia-1..3.webp
  clientes: false,    // assets/img/cliente-*.webp
  cobertura: false,   // assets/img/cobertura-ruta.webp
  contacto: false,    // assets/img/contacto.webp
  sinfoto: false      // assets/img/sin-foto.webp
};
