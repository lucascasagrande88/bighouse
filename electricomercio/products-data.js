/* ===========================================================================
   ELECTRICOMERCIO — Catálogo de ejemplo (DEMO)
   Productos GENÉRICOS de material eléctrico para mostrar el sistema.
   Sin precios, sin stock y sin marcas: el catálogo real lo carga el comercio
   desde el panel (admin.html) o importando un JSON.
   Campos: id, n (nombre), d (descripción), cat, unit, tags (proyectos), img, active
   =========================================================================== */
window.EC_DATA_VERSION = "2026-10-05-1";
window.EC_DEFAULT_PRODUCTS = [
  // ——— Cables ———
  { id:"cable-unip-15",   n:"Cable unipolar 1,5 mm²",            d:"Para circuitos de iluminación.",                         cat:"cables", unit:"Rollo x 100 m", tags:["residencial","comercial"] },
  { id:"cable-unip-25",   n:"Cable unipolar 2,5 mm²",            d:"Para circuitos de tomacorrientes.",                      cat:"cables", unit:"Rollo x 100 m", tags:["residencial","comercial"] },
  { id:"cable-unip-4",    n:"Cable unipolar 4 mm²",              d:"Para alimentación de tableros y cargas mayores.",        cat:"cables", unit:"Rollo x 100 m", tags:["comercial","industrial"] },
  { id:"cable-unip-6",    n:"Cable unipolar 6 mm²",              d:"Para líneas de alimentación y puesta a tierra.",         cat:"cables", unit:"Rollo x 100 m", tags:["industrial"] },
  { id:"cable-subt-4x6",  n:"Cable subterráneo 4 × 6 mm²",       d:"Tetrapolar para tendidos enterrados o en bandeja.",      cat:"cables", unit:"Metro",         tags:["industrial"] },
  { id:"cable-taller-2x15",n:"Cable tipo taller 2 × 1,5 mm²",    d:"Cordón flexible para prolongaciones y equipos.",         cat:"cables", unit:"Rollo x 100 m", tags:["residencial"] },

  // ——— Protecciones ———
  { id:"termica-1p-10",   n:"Térmica 1P 10 A",                   d:"Interruptor termomagnético para iluminación.",           cat:"protecciones", unit:"Unidad", tags:["residencial"] },
  { id:"termica-1p-20",   n:"Térmica 1P 20 A",                   d:"Interruptor termomagnético para tomas.",                 cat:"protecciones", unit:"Unidad", tags:["residencial"] },
  { id:"termica-2p-25",   n:"Térmica 2P 25 A",                   d:"Bipolar para circuitos de uso general.",                 cat:"protecciones", unit:"Unidad", tags:["comercial"] },
  { id:"termica-4p-32",   n:"Térmica 4P 32 A",                   d:"Tetrapolar para circuitos trifásicos.",                  cat:"protecciones", unit:"Unidad", tags:["industrial"] },
  { id:"disyuntor-2p-40", n:"Disyuntor diferencial 2P 40 A 30 mA",d:"Protección de personas en monofásico.",                 cat:"protecciones", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"disyuntor-4p-63", n:"Disyuntor diferencial 4P 63 A 30 mA",d:"Protección diferencial trifásica.",                     cat:"protecciones", unit:"Unidad", tags:["industrial"] },
  { id:"contactor-25",    n:"Contactor 25 A bobina 220 V",       d:"Para comando de motores y cargas.",                      cat:"protecciones", unit:"Unidad", tags:["industrial"] },

  // ——— Tomas y llaves ———
  { id:"modulo-toma-10",  n:"Módulo toma 10 A",                  d:"Toma doble uso con tierra.",                             cat:"tomas", unit:"Unidad", tags:["residencial"] },
  { id:"modulo-toma-20",  n:"Módulo toma 20 A",                  d:"Para equipos de mayor consumo.",                         cat:"tomas", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"modulo-tecla",    n:"Módulo tecla de punto",             d:"Interruptor unipolar para iluminación.",                 cat:"tomas", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"bastidor-tapa",   n:"Bastidor + tapa 3 módulos",         d:"Para caja rectangular estándar.",                        cat:"tomas", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"toma-industrial", n:"Tomacorriente industrial 3P+N+T 32 A",d:"Toma de aplicar para uso industrial.",                 cat:"tomas", unit:"Unidad", tags:["industrial"] },

  // ——— Cajas y canalización ———
  { id:"caja-rect",       n:"Caja rectangular de embutir",       d:"Para tomas y llaves en pared.",                          cat:"cajas", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"tablero-8",       n:"Tablero de embutir 8 módulos",      d:"Para protecciones de vivienda.",                         cat:"cajas", unit:"Unidad", tags:["residencial"] },
  { id:"tablero-24",      n:"Tablero de aplicar 24 módulos",     d:"Para locales y oficinas.",                               cat:"cajas", unit:"Unidad", tags:["comercial"] },
  { id:"tablero-estanco", n:"Gabinete estanco metálico",         d:"Para comando y protección en planta.",                   cat:"cajas", unit:"Unidad", tags:["industrial"] },
  { id:"cano-corrugado-34",n:"Caño corrugado 3/4\"",            d:"Canalización flexible para embutir.",                    cat:"cajas", unit:"Rollo x 25 m", tags:["residencial"] },
  { id:"cablecanal",      n:"Cablecanal 20 × 10 mm",             d:"Canalización a la vista con tapa.",                      cat:"cajas", unit:"Barra x 2 m",  tags:["comercial"] },
  { id:"bandeja-portacable",n:"Bandeja portacable perforada 100 mm",d:"Para tendidos de potencia y control.",              cat:"cajas", unit:"Barra x 3 m",  tags:["industrial"] },

  // ——— Iluminación ———
  { id:"lampara-led-9",   n:"Lámpara LED 9 W E27",               d:"Luz cálida o fría, rosca común.",                        cat:"iluminacion", unit:"Unidad", tags:["residencial"] },
  { id:"panel-led-60",    n:"Panel LED 60 × 60",                 d:"Para cielorraso de oficinas y locales.",                 cat:"iluminacion", unit:"Unidad", tags:["comercial"] },
  { id:"reflector-led-100",n:"Reflector LED 100 W",              d:"Para naves, depósitos y exteriores.",                    cat:"iluminacion", unit:"Unidad", tags:["industrial","comercial"] },
  { id:"luz-emergencia",  n:"Luz de emergencia LED",             d:"Autónoma, con batería recargable.",                      cat:"iluminacion", unit:"Unidad", tags:["comercial","industrial"] },
  { id:"cartel-salida",   n:"Cartel SALIDA LED",                 d:"Señalización de evacuación.",                            cat:"iluminacion", unit:"Unidad", tags:["comercial"] },

  // ——— Conectores ———
  { id:"bornera-riel",    n:"Bornera para riel DIN",             d:"Para distribución ordenada en tablero.",                 cat:"conectores", unit:"Pack x 10",  tags:["comercial","industrial"] },
  { id:"terminal-ojal",   n:"Terminal a compresión tipo ojal",   d:"Para conexiones firmes en tablero.",                     cat:"conectores", unit:"Bolsa x 100",tags:["industrial"] },
  { id:"ficha-macho-10",  n:"Ficha macho 10 A",                  d:"Con toma de tierra.",                                    cat:"conectores", unit:"Unidad",     tags:["residencial"] },

  // ——— Alimentación / fuentes ———
  { id:"fuente-12v",      n:"Fuente switching 12 V 5 A",         d:"Para tiras LED y equipos de bajo voltaje.",              cat:"fuentes", unit:"Unidad", tags:["comercial"] },
  { id:"tira-led",        n:"Tira LED 12 V",                     d:"Para iluminación de vidrieras y muebles.",               cat:"fuentes", unit:"Rollo x 5 m", tags:["comercial","residencial"] },

  // ——— Herramientas e instrumental ———
  { id:"pinza-amperometrica",n:"Pinza amperométrica digital",     d:"Medición de corriente, tensión y continuidad.",          cat:"herramientas", unit:"Unidad", tags:["industrial"] },
  { id:"buscapolo",       n:"Buscapolo / detector de tensión",   d:"Verificación rápida antes de intervenir.",               cat:"herramientas", unit:"Unidad", tags:["residencial","comercial"] },
  { id:"cinta-aisladora", n:"Cinta aisladora",                   d:"PVC para aislación y marcado.",                          cat:"herramientas", unit:"Unidad", tags:["residencial","comercial","industrial"] }
];
