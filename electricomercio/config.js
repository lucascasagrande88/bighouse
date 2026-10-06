/* ===========================================================================
   ELECTRICOMERCIO — DEMO (Chimichurri)
   Configuración central: marca, contacto, categorías y proyectos.
   Todo lo que sea dato del negocio vive acá, separado de la interfaz.
   =========================================================================== */
window.EC_CONFIG = {
  storageNs: "electricomercio_demo_v1",
  brand: {
    name: "ELECTRICOMERCIO",
    formerly: "ex-ElectroFlores",
    tagline: "Electricidad + Iluminación"
  },
  contact: {
    // Teléfono público observado: +54 9 11 4582-9911.
    // Formato wa.me sin "+", espacios ni guiones. Pendiente confirmar que la
    // línea tenga WhatsApp activo (ver FINAL_RECEIPT.md).
    whatsapp: "5491145829911",
    phonePretty: "+54 9 11 4582-9911",
    email: "electricomercio@gmail.com",
    address: "Av. Gaona 3307, C1416, Buenos Aires",
    mapsUrl: "https://www.google.com/maps/search/?api=1&query=Av.+Gaona+3307,+C1416,+Buenos+Aires",
    mapsEmbed: "https://www.google.com/maps?q=Av.+Gaona+3307,+C1416,+Buenos+Aires&z=16&output=embed",
    instagram: "https://www.instagram.com/electricomercio/",
    instagramHandle: "@electricomercio"
  },
  quoteSource: "Demo web"
};

/* Categorías del catálogo. k = clave interna, label = nombre visible,
   icon = ícono de respaldo cuando el producto no tiene foto. */
window.EC_CATS = [
  { k: "cables",       label: "Cables",                    icon: "cable",  desc: "Unipolares, subterráneos, tipo taller y cordones." },
  { k: "protecciones", label: "Protecciones",              icon: "breaker",desc: "Termomagnéticas, disyuntores y protección de tableros." },
  { k: "tomas",        label: "Tomas y llaves",            icon: "socket", desc: "Módulos de toma, teclas, bastidores y tapas." },
  { k: "cajas",        label: "Cajas y canalización",      icon: "box",    desc: "Cajas, caños, cablecanal, bandejas y accesorios." },
  { k: "iluminacion",  label: "Iluminación",               icon: "bulb",   desc: "Lámparas LED, paneles, reflectores y emergencia." },
  { k: "conectores",   label: "Conectores",                icon: "plug",   desc: "Borneras, terminales, fichas y empalmes." },
  { k: "fuentes",      label: "Alimentación / fuentes",    icon: "bolt",   desc: "Fuentes, drivers y alimentación para LED." },
  { k: "herramientas", label: "Herramientas e instrumental",icon: "meter", desc: "Medición, pelacables, buscapolos y cinta." }
];

/* Proyectos: lista base EDITABLE para arrancar. Es una curación de demo,
   no una afirmación de inventario ni una receta técnica. */
window.EC_PROJECTS = [
  {
    k: "residencial",
    label: "Residencial",
    desc: "Casa, departamento, reforma o instalación nueva.",
    bundle: [
      ["cable-unip-25", 2], ["cable-unip-15", 2], ["termica-1p-20", 2], ["termica-1p-10", 2],
      ["disyuntor-2p-40", 1], ["tablero-8", 1], ["caja-rect", 12], ["modulo-toma-10", 12],
      ["modulo-tecla", 8], ["bastidor-tapa", 12], ["cano-corrugado-34", 3], ["lampara-led-9", 10]
    ]
  },
  {
    k: "comercial",
    label: "Comercial",
    desc: "Locales, oficinas, depósitos y espacios de atención.",
    bundle: [
      ["cable-unip-25", 4], ["cable-unip-4", 2], ["termica-2p-25", 4], ["disyuntor-2p-40", 2],
      ["tablero-24", 1], ["modulo-toma-20", 10], ["cablecanal", 20], ["panel-led-60", 12],
      ["luz-emergencia", 4], ["cartel-salida", 2], ["bornera-riel", 2]
    ]
  },
  {
    k: "industrial",
    label: "Industrial",
    desc: "Instalaciones de mayor escala, protección, canalización y soporte técnico.",
    bundle: [
      ["cable-subt-4x6", 2], ["cable-unip-6", 4], ["termica-4p-32", 3], ["disyuntor-4p-63", 1],
      ["contactor-25", 2], ["tablero-estanco", 1], ["bandeja-portacable", 10], ["toma-industrial", 4],
      ["reflector-led-100", 6], ["terminal-ojal", 2], ["pinza-amperometrica", 1]
    ]
  }
];

/* Unidades sugeridas para el panel (se puede escribir otra). */
window.EC_UNITS = ["Unidad", "Rollo x 100 m", "Metro", "Barra x 3 m", "Pack x 10", "Bolsa x 100", "Caja"];
