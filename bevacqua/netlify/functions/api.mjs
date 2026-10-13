import { getStore, getDeployStore } from "@netlify/blobs";

// ───────────────────────── storage ─────────────────────────
const isProd = () => Netlify.context?.deploy?.context === "production";
const store = (name) =>
  isProd() ? getStore({ name, consistency: "strong" }) : getDeployStore({ name, consistency: "strong" });

const DATA = "bevacqua";
const MEDIA = "bevacqua-media";
const CHUNK = 4 * 1024 * 1024; // 4MB per stored part (stays under function payload limits)

// ───────────────────────── helpers ─────────────────────────
const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", ...headers },
  });
const bad = (msg, status = 400) => json({ error: msg }, status);

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d, 12);
};
const addDays = (s, n) => {
  const d = parseYmd(s);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
const toHHMM = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const todayAR = () => {
  // Argentina is UTC-3 all year
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};
const nowMinAR = () => {
  const d = new Date(Date.now() - 3 * 3600 * 1000);
  return d.getUTCHours() * 60 + d.getUTCMinutes();
};
const code = (prefix) => {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `${prefix}-${s}`;
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clean = (v, max = 200) => String(v ?? "").trim().slice(0, max);
const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || "");

// ───────────────────────── defaults ─────────────────────────
function seedDays() {
  const days = {};
  const start = todayAR();
  for (let i = 0; i < 150; i++) {
    const s = addDays(start, i);
    const d = parseYmd(s);
    const dow = d.getDay();
    if (dow === 0) continue; // domingos cerrado
    // Ciclo de 4 semanas: 3 en Buenos Aires, 1 en Bariloche
    const week = Math.floor(i / 7) % 4;
    if (week === 3) {
      if (dow === 1) continue;
      days[s] = { loc: "brc", start: "11:00", end: "20:00" };
    } else {
      if (dow === 1) continue;
      days[s] = { loc: "bue", start: "10:00", end: "19:00" };
    }
  }
  return days;
}

const IMG = (n) => `/img/${n}.jpg`;
const V3 = (corto, medio, largo) => [
  { label: "Corto", price: corto },
  { label: "Medio", price: medio },
  { label: "Largo", price: largo },
];

function defaultServices() {
  return [
    { id: "corte", cat: "Cortes", name: "Corte", note: "Incluye lavado y secado", duration: 40, price: 50000, variants: [], active: true },
    { id: "flequillo", cat: "Cortes", name: "Flequillo", note: "", duration: 20, price: 25000, variants: [], active: true },
    { id: "color", cat: "Coloraciones", name: "Color L'Oréal · Igora · Alfaparf", note: "", duration: 40, price: 105000, variants: V3(105000, 121000, 137000), active: true },
    { id: "color-inoa", cat: "Coloraciones", name: "Color Inoa", note: "", duration: 40, price: 115000, variants: V3(115000, 131000, 147000), active: true },
    { id: "mechas", cat: "Coloraciones", name: "Mechas", note: "", duration: 120, price: 116000, variants: V3(116000, 131000, 146000), active: true },
    { id: "balayage", cat: "Coloraciones", name: "Balayage", note: "", duration: 120, price: 122000, variants: V3(122000, 137000, 152000), active: true },
    { id: "decoloracion", cat: "Decoloración", name: "Decoloración", note: "", duration: 120, price: 106000, variants: V3(106000, 121000, 136000), active: true },
    { id: "fantasia", cat: "Color fantasía", name: "Color fantasía", note: "Precio desde, según diseño", duration: 120, price: 90000, from: true, variants: [], active: true },
    { id: "botox", cat: "Botox", name: "Botox", note: "", duration: 60, price: 104000, variants: V3(104000, 119000, 134000), active: true },
  ];
}

function defaultConfig() {
  return {
    version: 3,
    brand: {
      heroKicker: "Estudio de estilismo · Buenos Aires — Patagonia",
      heroSub: "Imagen, corte, color y experiencia. Un estudio que se mueve entre la ciudad y la montaña.",
      manifesto:
        "No somos una peluquería. Somos un estudio de imagen: cortes, color y asesoramiento pensados como una pieza editorial. Cada cliente es una historia, cada look es un escenario propio.",
      about:
        "Esteban Bevacqua trabaja entre Buenos Aires y Bariloche, llevando el estudio a donde está la gente. Estilismo, imagen y comunicación en un mismo lugar.",
      experiencia: [
        "Bevacqua Look & More cuenta más de 22 años de experiencia, con una trayectoria atravesada por la moda, la cultura visual y la evolución de las tendencias.",
        "Una mirada construida desde el oficio, mucho antes de la era digital, donde la creatividad y la vanguardia nacen de una visión propia: no se replican. Se observan, se interpretan y se transforman.",
        "Un espacio donde la búsqueda va más allá. Donde cada persona encuentra una imagen que dialoga con su identidad, su estilo de vida y su rutina.",
        "Porque no se trata solamente de crear un look, sino de encontrar una manera auténtica de expresarse.",
      ].join("\n\n"),
      turnosTitle: "Reservá",
      turnosSub: "Sé parte de esta experiencia",
      serviciosNote: "10% OFF abonando en efectivo",
      serviciosBrands: "L'Oréal · Igora · Alfaparf",
      coworkingIntro: "Un espacio para crear, compartir y desarrollar tu identidad.",
      coworkingText: [
        "En el corazón de Villa Crespo, frente a una plaza y ubicado en un séptimo piso, Bevacqua Look & More propone una nueva forma de trabajar: un espacio privado, tranquilo y confortable, pensado para profesionales que buscan libertad, creatividad y una experiencia diferente.",
        "Un lugar donde cada profesional puede expresar su identidad, desarrollar su mirada artística, explorar nuevas ideas y trabajar a su manera, brindando a cada cliente una atención personalizada, lejos del ruido y del movimiento de los espacios tradicionales.",
        "Más que un lugar de trabajo, una comunidad creativa donde compartir experiencias, conectar con otros profesionales y encontrar nuevas formas de expresión.",
        "Un espacio abierto al mundo, pensado para profesionales locales e internacionales que buscan un lugar propio para crear, trabajar y desarrollar sus proyectos en Buenos Aires.",
      ].join("\n\n"),
      coworkingRental: "Alquiler por hora, por día o por mes.",
      coworkingClaim: "Tu espacio de trabajo. Tu identidad. Tu forma de crear.",
      contactText: "Envianos tu consulta a través de Facebook Messenger, WhatsApp, Instagram, teléfono o e-mail.",
    },
    images: {
      tebi: IMG("tebi"),
      turnos: IMG("turnos"),
      turnosMobile: IMG("turnos-mobile"),
      coworking: IMG("coworking"),
    },
    contact: {
      whatsapp: "5491100000000",
      phone: "",
      email: "hola@bevacqua.com.ar",
      instagram: "tebi.bevacqua",
      messenger: "",
    },
    locations: [
      { id: "bue", name: "Buenos Aires", short: "BUE", address: "Villa Crespo, CABA", color: "#2BFF88" },
      { id: "brc", name: "Bariloche", short: "BRC", address: "Centro Cívico, San Carlos de Bariloche", color: "#FFFFFF" },
    ],
    slotStep: 40,
    services: defaultServices(),
    days: seedDays(),
    studio: {
      stations: 3,
      prices: { hour: 12000, day: 50000, week: 250000, month: 800000 },
      plans: ["hora", "dia", "mes"],
      open: "09:00",
      close: "21:00",
      address: "Villa Crespo, CABA · 7º piso, frente a la plaza",
      openDays: [1, 2, 3, 4, 5, 6],
      blocked: [],
      perks: ["Sillón y espejo profesional", "Lavacabezas compartido", "Wi-Fi + música", "Productos de cortesía", "Espacio para contenido"],
    },
    posts: [
      { id: "p6", type: "video", src: "/media/v6.mp4", poster: "/media/v6.jpg", title: "Still Summer", tag: "Experiencia", place: "Buenos Aires", text: "Un día abierto, piezas favoritas y ningún apuro.", size: "wide" },
      { id: "p4", type: "video", src: "/media/v4.mp4", poster: "/media/v4.jpg", title: "Freedom of Form", tag: "Editorial", place: "Patagonia", text: "Libertad de movimiento, de combinaciones, de elección.", size: "tall" },
      { id: "p2", type: "video", src: "/media/v2.mp4", poster: "/media/v2.jpg", title: "Autumn Cut", tag: "Cortes", place: "Bariloche", text: "Texturas para el frío. Cortes que se mueven con el viento.", size: "normal" },
      { id: "p5", type: "video", src: "/media/v5.mp4", poster: "/media/v5.jpg", title: "New In", tag: "Transformación", place: "Estudio", text: "Piezas pensadas para ser parte de tu historia.", size: "tall" },
      { id: "p3", type: "video", src: "/media/v3.mp4", poster: "/media/v3.jpg", title: "Born to Disobey", tag: "Vanguardia", place: "Ruta 40", text: "Decisiones espontáneas. Escenarios propios.", size: "wide" },
      { id: "p1", type: "video", src: "/media/v1.mp4", poster: "/media/v1.jpg", title: "Backstage", tag: "Estudio", place: "Buenos Aires", text: "Detrás del sillón: el proceso.", size: "normal" },
    ],
  };
}

// Rebuilds older configs on top of the current defaults without losing the agenda or uploaded content.
function migrate(cfg) {
  if (cfg.version === 3) return { cfg, changed: false };
  const next = defaultConfig();
  if (cfg.days) next.days = cfg.days;
  if (cfg.slotStep) next.slotStep = Math.max(cfg.slotStep, 20);
  const uploaded = (cfg.posts || []).filter((p) => String(p.src || "").startsWith("/api/media/"));
  next.posts = [...uploaded, ...next.posts];
  for (const k of ["whatsapp", "email"]) if (cfg.contact?.[k] && !/0000000|hola@bevacqua/.test(cfg.contact[k])) next.contact[k] = cfg.contact[k];
  if (cfg.studio) {
    next.studio.stations = cfg.studio.stations || 3;
    next.studio.blocked = cfg.studio.blocked || [];
    next.studio.openDays = cfg.studio.openDays || next.studio.openDays;
    next.studio.prices = { ...next.studio.prices, ...cfg.studio.prices };
  }
  return { cfg: next, changed: true };
}

async function getConfig() {
  const s = store(DATA);
  let cfg = await s.get("config", { type: "json" });
  if (!cfg) {
    cfg = defaultConfig();
    await s.setJSON("config", cfg);
    return cfg;
  }
  const m = migrate(cfg);
  if (m.changed) await s.setJSON("config", m.cfg);
  return m.cfg;
}
const getList = async (key) => (await store(DATA).get(key, { type: "json" })) || [];
const setList = (key, val) => store(DATA).setJSON(key, val);

// ───────────────────────── availability logic ─────────────────────────
const ACTIVE = (b) => b.status !== "cancelada" && b.status !== "rechazada";

function freeSlots(cfg, bookings, date, duration) {
  const day = cfg.days[date];
  if (!day) return [];
  const step = cfg.slotStep || 40;
  const start = toMin(day.start);
  const end = toMin(day.end);
  const taken = bookings.filter((b) => b.date === date && ACTIVE(b)).map((b) => [toMin(b.time), toMin(b.time) + b.duration]);
  const isToday = date === todayAR();
  const out = [];
  for (let t = start; t + duration <= end; t += step) {
    if (isToday && t <= nowMinAR() + 60) continue;
    if (taken.some(([a, z]) => t < z && t + duration > a)) continue;
    out.push(toHHMM(t));
  }
  return out;
}

// Resolves the requested services (with their length variant) into a priced, timed list.
function resolveItems(cfg, body) {
  const raw = Array.isArray(body.items) ? body.items : body.serviceId ? [{ serviceId: body.serviceId }] : [];
  const items = [];
  for (const it of raw.slice(0, 6)) {
    const s = cfg.services.find((x) => x.id === it.serviceId && x.active);
    if (!s) return null;
    let price = s.price;
    let variant = "";
    if (s.variants && s.variants.length) {
      const v = s.variants.find((x) => x.label === it.variant);
      if (!v) return null;
      price = v.price;
      variant = v.label;
    }
    items.push({ serviceId: s.id, name: s.name, variant, price, duration: s.duration, from: !!s.from });
  }
  return items.length ? items : null;
}

const PLAN = {
  hora: { len: 1, key: "hour" },
  dia: { len: 1, key: "day" },
  semana: { len: 7, key: "week" },
  mes: { len: 30, key: "month" },
};
function proRange(type, start) {
  return { start, end: addDays(start, PLAN[type].len - 1) };
}
// Two rentals collide when their dates overlap and, if both are hourly, their hours overlap too.
function collides(a, b) {
  if (!(a.start <= b.end && b.start <= a.end)) return false;
  if (a.tFrom && b.tFrom) return toMin(a.tFrom) < toMin(b.tTo) && toMin(b.tFrom) < toMin(a.tTo);
  return true;
}
function freeStations(cfg, pros, range) {
  const all = Array.from({ length: cfg.studio.stations }, (_, i) => i + 1);
  return all.filter((st) => !pros.some((p) => ACTIVE(p) && p.station === st && collides(p, range)));
}

// ───────────────────────── handlers ─────────────────────────
async function publicData() {
  const [cfg, clients, pros] = await Promise.all([getConfig(), getList("clients"), getList("pros")]);
  const today = todayAR();
  return json({
    today,
    brand: cfg.brand,
    images: cfg.images,
    contact: cfg.contact,
    locations: cfg.locations,
    services: cfg.services.filter((s) => s.active),
    slotStep: cfg.slotStep,
    days: Object.fromEntries(Object.entries(cfg.days).filter(([d]) => d >= today)),
    busy: clients.filter((b) => b.date >= today && ACTIVE(b)).map((b) => ({ date: b.date, time: b.time, duration: b.duration })),
    studio: cfg.studio,
    proBusy: pros
      .filter((p) => p.end >= today && ACTIVE(p))
      .map((p) => ({ start: p.start, end: p.end, station: p.station, status: p.status, tFrom: p.tFrom, tTo: p.tTo })),
    posts: cfg.posts,
  });
}

async function bookClient(req) {
  const body = await req.json().catch(() => ({}));
  const cfg = await getConfig();
  const items = resolveItems(cfg, body);
  if (!items) return bad("Elegí al menos un servicio válido.");
  if (!isDate(body.date) || body.date < todayAR()) return bad("Fecha inválida.");
  const day = cfg.days[body.date];
  if (!day) return bad("Esteban no atiende ese día.");
  if (body.locationId && body.locationId !== day.loc) return bad("Ese día Esteban está en otra ciudad.");
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 40);
  if (name.length < 2 || phone.length < 6) return bad("Completá nombre y teléfono.");
  const duration = items.reduce((a, i) => a + i.duration, 0);
  const clients = await getList("clients");
  if (!freeSlots(cfg, clients, body.date, duration).includes(body.time)) return bad("Ese horario ya no está disponible. Elegí otro.", 409);
  const loc = cfg.locations.find((l) => l.id === day.loc);
  const booking = {
    id: code("BV"),
    kind: "cliente",
    date: body.date,
    time: body.time,
    duration,
    items,
    serviceName: items.map((i) => i.name + (i.variant ? ` (${i.variant})` : "")).join(" + "),
    price: items.reduce((a, i) => a + i.price, 0),
    priceFrom: items.some((i) => i.from),
    locationId: day.loc,
    locationName: loc?.name || day.loc,
    address: loc?.address || "",
    name,
    phone,
    email: clean(body.email, 120),
    notes: clean(body.notes, 500),
    status: "confirmada",
    createdAt: new Date().toISOString(),
  };
  clients.push(booking);
  await setList("clients", clients);
  return json({ ok: true, booking });
}

async function bookPro(req) {
  const body = await req.json().catch(() => ({}));
  const cfg = await getConfig();
  const st = cfg.studio;
  if (!PLAN[body.type] || !(st.plans || []).includes(body.type)) return bad("Tipo de alquiler inválido.");
  if (!isDate(body.start) || body.start < todayAR()) return bad("Fecha inválida.");
  const range = proRange(body.type, body.start);
  let hours = 0;
  if (body.type === "hora" || body.type === "dia") {
    const dow = parseYmd(body.start).getDay();
    if (!st.openDays.includes(dow) || st.blocked.includes(body.start)) return bad("El estudio está cerrado ese día.");
  }
  if (body.type === "hora") {
    hours = Math.round(Number(body.hours));
    if (!/^\d{2}:\d{2}$/.test(body.from || "") || !(hours >= 1 && hours <= 12)) return bad("Elegí horario y cantidad de horas.");
    const a = toMin(body.from);
    const z = a + hours * 60;
    if (a < toMin(st.open) || z > toMin(st.close)) return bad("Fuera del horario del estudio.");
    if (body.start === todayAR() && a <= nowMinAR()) return bad("Ese horario ya pasó.");
    range.tFrom = toHHMM(a);
    range.tTo = toHHMM(z);
  }
  const station = Number(body.station);
  const pros = await getList("pros");
  if (!freeStations(cfg, pros, range).includes(station)) return bad("Ese puesto ya no está disponible para el período.", 409);
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 40);
  if (name.length < 2 || phone.length < 6) return bad("Completá nombre y teléfono.");
  const unit = st.prices[PLAN[body.type].key] || 0;
  const booking = {
    id: code("PR"),
    kind: "profesional",
    type: body.type,
    start: range.start,
    end: range.end,
    ...(range.tFrom ? { tFrom: range.tFrom, tTo: range.tTo, hours } : {}),
    station,
    price: body.type === "hora" ? unit * hours : unit,
    name,
    phone,
    email: clean(body.email, 120),
    specialty: clean(body.specialty, 80),
    instagram: clean(body.instagram, 80),
    notes: clean(body.notes, 500),
    status: "pendiente",
    createdAt: new Date().toISOString(),
  };
  pros.push(booking);
  await setList("pros", pros);
  return json({ ok: true, booking });
}

async function contact(req) {
  const body = await req.json().catch(() => ({}));
  const name = clean(body.name, 80);
  const message = clean(body.message, 2000);
  if (name.length < 2 || message.length < 3) return bad("Completá nombre y mensaje.");
  const msgs = await getList("messages");
  msgs.unshift({ id: uid(), name, contact: clean(body.contact, 120), message, createdAt: new Date().toISOString(), read: false });
  await setList("messages", msgs.slice(0, 500));
  return json({ ok: true });
}

// ── media ──
async function serveMedia(req, id) {
  const s = store(MEDIA);
  const meta = await s.get(`${id}/meta`, { type: "json" });
  if (!meta || !meta.complete) return new Response("Not found", { status: 404 });
  const base = { "content-type": meta.type, "accept-ranges": "bytes", "cache-control": "public, max-age=31536000, immutable" };
  const range = req.headers.get("range");
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let startB = m && m[1] ? Number(m[1]) : 0;
    let endB = m && m[2] ? Number(m[2]) : meta.size - 1;
    if (m && !m[1] && m[2]) {
      startB = Math.max(0, meta.size - Number(m[2]));
      endB = meta.size - 1;
    }
    if (startB >= meta.size) return new Response(null, { status: 416, headers: { "content-range": `bytes */${meta.size}` } });
    // serve at most the remainder of the part that contains startB
    const part = Math.floor(startB / CHUNK);
    endB = Math.min(endB, meta.size - 1, (part + 1) * CHUNK - 1);
    const buf = await s.get(`${id}/${part}`, { type: "arrayBuffer" });
    const slice = buf.slice(startB - part * CHUNK, endB - part * CHUNK + 1);
    return new Response(slice, {
      status: 206,
      headers: { ...base, "content-range": `bytes ${startB}-${endB}/${meta.size}`, "content-length": String(slice.byteLength) },
    });
  }
  const stream = new ReadableStream({
    async start(controller) {
      for (let i = 0; i < meta.parts; i++) {
        const buf = await s.get(`${id}/${i}`, { type: "arrayBuffer" });
        controller.enqueue(new Uint8Array(buf));
      }
      controller.close();
    },
  });
  return new Response(stream, { headers: { ...base, "content-length": String(meta.size) } });
}

// ───────────────────────── admin ─────────────────────────
function authed(req) {
  const pass = Netlify.env.get("ADMIN_PASSWORD");
  return !!pass && req.headers.get("x-admin-key") === pass;
}

async function admin(req, parts) {
  if (!authed(req)) return bad("No autorizado", 401);
  const [, what, a, b] = parts; // ["admin", what, a, b]
  const method = req.method;

  if (what === "login") return json({ ok: true });

  if (what === "data" && method === "GET") {
    const [cfg, clients, pros, messages] = await Promise.all([getConfig(), getList("clients"), getList("pros"), getList("messages")]);
    return json({ today: todayAR(), config: cfg, clients, pros, messages });
  }

  if (what === "config" && method === "PUT") {
    const cfg = await req.json();
    if (!cfg || !cfg.brand || !Array.isArray(cfg.services) || !cfg.days || !cfg.studio) return bad("Config inválida");
    await store(DATA).setJSON("config", cfg);
    return json({ ok: true });
  }

  if (what === "reset" && method === "POST") {
    await store(DATA).setJSON("config", defaultConfig());
    return json({ ok: true });
  }

  if (what === "booking" && method === "PATCH") {
    const body = await req.json();
    const key = body.kind === "profesional" ? "pros" : "clients";
    const list = await getList(key);
    const item = list.find((x) => x.id === body.id);
    if (!item) return bad("No existe", 404);
    if (body.status) item.status = clean(body.status, 20);
    if (body.adminNote !== undefined) item.adminNote = clean(body.adminNote, 500);
    item.updatedAt = new Date().toISOString();
    await setList(key, list);
    return json({ ok: true, item });
  }

  if (what === "booking" && method === "DELETE") {
    const key = a === "profesional" ? "pros" : "clients";
    const list = await getList(key);
    await setList(key, list.filter((x) => x.id !== b));
    return json({ ok: true });
  }

  if (what === "messages" && method === "PUT") {
    await setList("messages", await req.json());
    return json({ ok: true });
  }

  if (what === "media" && method === "POST" && !a) {
    const body = await req.json();
    const size = Number(body.size);
    if (!size || size > 200 * 1024 * 1024) return bad("Archivo demasiado grande (máx 200MB).");
    const type = clean(body.type, 80) || "application/octet-stream";
    if (!/^(image|video)\//.test(type)) return bad("Solo imágenes o videos.");
    const id = uid();
    const parts = Math.ceil(size / CHUNK);
    await store(MEDIA).setJSON(`${id}/meta`, { id, type, size, parts, name: clean(body.name, 120), complete: false, received: [] });
    return json({ id, chunk: CHUNK, parts, url: `/api/media/${id}` });
  }

  if (what === "media" && method === "PUT" && a && b !== undefined) {
    const s = store(MEDIA);
    const meta = await s.get(`${a}/meta`, { type: "json" });
    if (!meta) return bad("Upload inexistente", 404);
    const n = Number(b);
    if (!(n >= 0 && n < meta.parts)) return bad("Parte inválida");
    const buf = await req.arrayBuffer();
    await s.set(`${a}/${n}`, buf);
    if (n === meta.parts - 1) {
      meta.complete = true;
      await s.setJSON(`${a}/meta`, meta);
    }
    return json({ ok: true, part: n, complete: meta.complete });
  }

  return bad("Ruta no encontrada", 404);
}

// ───────────────────────── router ─────────────────────────
export default async (req) => {
  const url = new URL(req.url);
  const parts = url.pathname.replace(/^\/api\/?/, "").split("/").filter(Boolean);
  try {
    if (parts[0] === "public" && req.method === "GET") return await publicData();
    if (parts[0] === "book" && req.method === "POST") return await bookClient(req);
    if (parts[0] === "pro-book" && req.method === "POST") return await bookPro(req);
    if (parts[0] === "contact" && req.method === "POST") return await contact(req);
    if (parts[0] === "media" && parts[1] && req.method === "GET") return await serveMedia(req, parts[1]);
    if (parts[0] === "admin") return await admin(req, parts);
    return bad("Not found", 404);
  } catch (err) {
    console.error(err);
    return bad("Error del servidor: " + err.message, 500);
  }
};

export const config = { path: "/api/*" };
