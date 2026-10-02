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

function defaultConfig() {
  return {
    version: 1,
    brand: {
      heroKicker: "Estudio de estilismo · Buenos Aires — Patagonia",
      heroTitle: "Look & More",
      heroSub: "Imagen, corte, color y experiencia. Un estudio que se mueve entre la ciudad y la montaña.",
      manifesto:
        "No somos una peluquería. Somos un estudio de imagen: cortes, color y asesoramiento pensados como una pieza editorial. Cada cliente es una historia, cada look es un escenario propio.",
      about:
        "Esteban Bevacqua trabaja entre Buenos Aires y Bariloche, llevando el estudio a donde está la gente. Estilismo, imagen y comunicación en un mismo lugar.",
    },
    contact: {
      whatsapp: "5491100000000",
      email: "hola@bevacqua.com.ar",
      instagram: "bevacqua.lookandmore",
    },
    locations: [
      { id: "bue", name: "Buenos Aires", short: "BUE", address: "Palermo, CABA", color: "#2BFF88" },
      { id: "brc", name: "Bariloche", short: "BRC", address: "Centro Cívico, San Carlos de Bariloche", color: "#FFFFFF" },
    ],
    slotStep: 30,
    services: [
      { id: "corte", name: "Corte", duration: 60, price: 35000, desc: "Corte de autor, lavado y styling final.", active: true },
      { id: "color", name: "Color", duration: 120, price: 70000, desc: "Color, decoloración o matiz. Incluye diagnóstico.", active: true },
      { id: "corte-color", name: "Corte + Color", duration: 150, price: 95000, desc: "El servicio completo. Transformación total.", active: true },
      { id: "experiencia", name: "Experiencia de imagen", duration: 90, price: 80000, desc: "Asesoramiento de imagen, estilo y tendencia. Sesión 1 a 1.", active: true },
    ],
    days: seedDays(),
    studio: {
      stations: 3,
      prices: { day: 50000, week: 250000, month: 800000 },
      hours: "09:00 — 21:00",
      address: "Palermo, CABA",
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

async function getConfig() {
  const s = store(DATA);
  let cfg = await s.get("config", { type: "json" });
  if (!cfg) {
    cfg = defaultConfig();
    await s.setJSON("config", cfg);
  }
  return cfg;
}
const getList = async (key) => (await store(DATA).get(key, { type: "json" })) || [];
const setList = (key, val) => store(DATA).setJSON(key, val);

// ───────────────────────── availability logic ─────────────────────────
const ACTIVE = (b) => b.status !== "cancelada" && b.status !== "rechazada";

function freeSlots(cfg, bookings, date, duration) {
  const day = cfg.days[date];
  if (!day) return [];
  const step = cfg.slotStep || 30;
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

function proRange(type, start) {
  const len = type === "dia" ? 1 : type === "semana" ? 7 : 30;
  return { start, end: addDays(start, len - 1), len };
}
const overlaps = (a, b) => a.start <= b.end && b.start <= a.end;

function freeStations(cfg, pros, range) {
  const all = Array.from({ length: cfg.studio.stations }, (_, i) => i + 1);
  return all.filter((st) => !pros.some((p) => ACTIVE(p) && p.station === st && overlaps(p, range)));
}

// ───────────────────────── handlers ─────────────────────────
async function publicData() {
  const [cfg, clients, pros] = await Promise.all([getConfig(), getList("clients"), getList("pros")]);
  const today = todayAR();
  return json({
    today,
    brand: cfg.brand,
    contact: cfg.contact,
    locations: cfg.locations,
    services: cfg.services.filter((s) => s.active),
    slotStep: cfg.slotStep,
    days: Object.fromEntries(Object.entries(cfg.days).filter(([d]) => d >= today)),
    busy: clients.filter((b) => b.date >= today && ACTIVE(b)).map((b) => ({ date: b.date, time: b.time, duration: b.duration })),
    studio: cfg.studio,
    proBusy: pros.filter((p) => p.end >= today && ACTIVE(p)).map((p) => ({ start: p.start, end: p.end, station: p.station, status: p.status })),
    posts: cfg.posts,
  });
}

async function bookClient(req) {
  const body = await req.json().catch(() => ({}));
  const cfg = await getConfig();
  const service = cfg.services.find((s) => s.id === body.serviceId && s.active);
  if (!service) return bad("Elegí un servicio válido.");
  if (!isDate(body.date) || body.date < todayAR()) return bad("Fecha inválida.");
  const day = cfg.days[body.date];
  if (!day) return bad("Esteban no atiende ese día.");
  if (body.locationId && body.locationId !== day.loc) return bad("Ese día Esteban está en otra ciudad.");
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 40);
  if (name.length < 2 || phone.length < 6) return bad("Completá nombre y teléfono.");
  const clients = await getList("clients");
  if (!freeSlots(cfg, clients, body.date, service.duration).includes(body.time)) return bad("Ese horario ya no está disponible. Elegí otro.", 409);
  const loc = cfg.locations.find((l) => l.id === day.loc);
  const booking = {
    id: code("BV"),
    kind: "cliente",
    date: body.date,
    time: body.time,
    duration: service.duration,
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
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
  if (!["dia", "semana", "mes"].includes(body.type)) return bad("Tipo de alquiler inválido.");
  if (!isDate(body.start) || body.start < todayAR()) return bad("Fecha inválida.");
  const range = proRange(body.type, body.start);
  if (body.type === "dia") {
    const dow = parseYmd(body.start).getDay();
    if (!cfg.studio.openDays.includes(dow) || cfg.studio.blocked.includes(body.start)) return bad("El estudio está cerrado ese día.");
  }
  const station = Number(body.station);
  const pros = await getList("pros");
  if (!freeStations(cfg, pros, range).includes(station)) return bad("Ese puesto ya no está disponible para el período.", 409);
  const name = clean(body.name, 80);
  const phone = clean(body.phone, 40);
  if (name.length < 2 || phone.length < 6) return bad("Completá nombre y teléfono.");
  const priceKey = body.type === "dia" ? "day" : body.type === "semana" ? "week" : "month";
  const booking = {
    id: code("PR"),
    kind: "profesional",
    type: body.type,
    start: range.start,
    end: range.end,
    station,
    price: cfg.studio.prices[priceKey],
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
