const pptxgen = require("pptxgenjs");

const P = {
  ink:    "0E2A22",
  green:  "1B5E43",
  gold:   "E8B44A",
  red:    "C4553D",
  white:  "FFFFFF",
  paper:  "F4F6F3",
  line:   "DCE3DD",
  muted:  "6B7C74",
  dark2:  "16382D",
};
const HEAD = "Cambria";
const BODY = "Calibri";
const W = 13.333, H = 7.5, M = 0.62;

const fmt = n => (n < 0 ? "-" : "") + Math.abs(n).toLocaleString("de-DE");
const ars = n => "ARS " + fmt(n);

const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "Chimichurri";
pres.title = "Finanzas Agosto-Septiembre 2026";

const shadow = () => ({ type: "outer", color: "0E2A22", blur: 10, offset: 2, angle: 90, opacity: 0.1 });

// card helper
function card(s, x, y, w, h, fill, opts = {}) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: fill },
    line: opts.line ? { color: opts.line, width: 1 } : { color: fill, width: 0 },
    shadow: opts.shadow === false ? undefined : shadow(),
  });
}

function titleSlide(s, kicker, title, sub) {
  s.addText(kicker, { x: M, y: 0.42, w: 9, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: P.gold, charSpacing: 2, margin: 0 });
  s.addText(title, { x: M, y: 0.72, w: 11.4, h: 0.72, fontFace: HEAD, fontSize: 34, bold: true, color: P.ink, margin: 0 });
  if (sub) s.addText(sub, { x: M, y: 1.44, w: 11.4, h: 0.34, fontFace: BODY, fontSize: 14, color: P.muted, margin: 0 });
}

function pageNum(s, n) {
  s.addText(String(n), { x: W - M - 0.6, y: H - 0.44, w: 0.6, h: 0.28, fontFace: BODY, fontSize: 10, color: P.muted, align: "right", margin: 0 });
}

/* ───────────────────────── 1 · PORTADA ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.ink };
  s.addShape(pres.ShapeType.ellipse, { x: 9.4, y: -2.2, w: 6.4, h: 6.4, fill: { color: P.green }, line: { color: P.green, width: 0 } });
  s.addShape(pres.ShapeType.ellipse, { x: 11.3, y: 4.6, w: 3.4, h: 3.4, fill: { color: P.dark2 }, line: { color: P.dark2, width: 0 } });

  s.addText("CHIMICHURRI  ·  FINANZAS", { x: M, y: 1.5, w: 8, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: P.gold, charSpacing: 3, margin: 0 });
  s.addText("Cómo manejar\nla plata", { x: M, y: 1.95, w: 8.4, h: 2.1, fontFace: HEAD, fontSize: 52, bold: true, color: P.white, lineSpacing: 56, margin: 0 });
  s.addText("Agosto y septiembre 2026 · números corregidos", { x: M, y: 4.15, w: 8.4, h: 0.36, fontFace: BODY, fontSize: 16, color: "B9CCC2", margin: 0 });

  const stats = [
    ["Saldo agosto", ars(650000)],
    ["Saldo septiembre", ars(3350000)],
    ["Piso mensual sin animación", ars(1350000)],
  ];
  stats.forEach(([k, v], i) => {
    const x = M + i * 3.95;
    s.addShape(pres.ShapeType.roundRect, { x, y: 5.25, w: 3.65, h: 1.28, rectRadius: 0.1, fill: { color: P.dark2 }, line: { color: "2C5546", width: 1 } });
    s.addText(v, { x: x + 0.28, y: 5.45, w: 3.1, h: 0.52, fontFace: HEAD, fontSize: 23, bold: true, color: P.gold, margin: 0 });
    s.addText(k, { x: x + 0.28, y: 5.99, w: 3.1, h: 0.34, fontFace: BODY, fontSize: 11, color: "9FB6AA", margin: 0 });
  });
  s.addNotes("Deck de finanzas con los números corregidos: Fiat MP se va, Mariela se paga 50.000 por cliente recurrente, y el único costo fijo mensual es Mariela.");
}

/* ─────────────────── 2 · EL NEGOCIO EN UNA PÁGINA ─────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "PUNTO DE PARTIDA", "El negocio en una página", "Dos fuentes de ingreso y un solo costo que se mueve con las ventas");

  const srcs = [
    { n: "1", t: "Diseño · clientes recurrentes", v: ars(1700000), sub: "por mes", d: "7 clientes que pagan todos los meses.\nEs el piso: entra sí o sí.", c: P.green },
    { n: "2", t: "Animación Lucas Casagrande", v: ars(1600000), sub: "por mes mientras dure", d: "Trabajo por proyecto, no es sueldo.\nHoy es el 43% de lo que entra.", c: P.gold },
  ];
  srcs.forEach((o, i) => {
    const x = M + i * 6.2;
    card(s, x, 2.05, 5.9, 2.5, i === 0 ? P.green : P.ink);
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.38, y: 2.36, w: 0.6, h: 0.6, fill: { color: o.c === P.green ? P.gold : P.gold }, line: { color: P.gold, width: 0 } });
    s.addText(o.n, { x: x + 0.38, y: 2.44, w: 0.6, h: 0.44, fontFace: HEAD, fontSize: 20, bold: true, color: P.ink, align: "center", margin: 0 });
    s.addText(o.t, { x: x + 1.12, y: 2.42, w: 4.5, h: 0.44, fontFace: BODY, fontSize: 14, bold: true, color: P.white, margin: 0 });
    s.addText(o.v, { x: x + 0.38, y: 3.1, w: 4.9, h: 0.6, fontFace: HEAD, fontSize: 30, bold: true, color: P.gold, margin: 0 });
    s.addText(o.sub, { x: x + 0.38, y: 3.68, w: 4.9, h: 0.28, fontFace: BODY, fontSize: 11, color: "9FB6AA", margin: 0 });
    s.addText(o.d, { x: x + 0.38, y: 3.98, w: 5.1, h: 0.5, fontFace: BODY, fontSize: 11.5, color: "CFDCD4", lineSpacing: 15, margin: 0 });
  });

  card(s, M, 4.85, 12.1, 1.75, P.paper, { line: P.line });
  s.addText("EL ÚNICO COSTO FIJO", { x: M + 0.4, y: 5.08, w: 5, h: 0.28, fontFace: BODY, fontSize: 10.5, bold: true, color: P.muted, charSpacing: 2, margin: 0 });
  s.addText([
    { text: "Mariela: ", options: { bold: true, color: P.ink } },
    { text: "ARS 50.000 por cada cliente recurrente. Con 7 clientes son ", options: { color: P.ink } },
    { text: "ARS 350.000 por mes", options: { bold: true, color: P.green } },
    { text: ". Si entra un cliente sube; si se va uno, baja sola.", options: { color: P.ink } },
  ], { x: M + 0.4, y: 5.42, w: 11.3, h: 0.92, fontFace: BODY, fontSize: 15, lineSpacing: 22, margin: 0 });
  pageNum(s, 2);
  s.addNotes("El costo de Mariela es variable, no fijo: escala con la cantidad de clientes recurrentes.");
}

/* ───────────────────── 3 · QUÉ CAMBIÓ ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "CORRECCIONES", "Qué cambió respecto del plan anterior", "Tres ajustes que mueven los dos meses");

  const rows = [
    ["Fiat MP deja de ser cliente", "Cobra ARS 300.000 en agosto y no vuelve. Desde septiembre faltan 300.000 brutos por mes (250.000 netos)."],
    ["Mariela se calcula por cliente", "50.000 por recurrente. Agosto: 400.000 (incluye la última de Fiat MP, ya contemplada). Septiembre en adelante: 350.000."],
    ["No hay gastos fijos mensuales", "Financista, multa y tarjeta son gastos puntuales de agosto, no estructura. Fuera de Mariela, el mes no tiene costo fijo."],
  ];
  rows.forEach(([t, d], i) => {
    const y = 2.08 + i * 1.12;
    card(s, M, y, 7.55, 0.98, P.paper, { line: P.line, shadow: false });
    s.addShape(pres.ShapeType.ellipse, { x: M + 0.3, y: y + 0.24, w: 0.5, h: 0.5, fill: { color: P.green }, line: { color: P.green, width: 0 } });
    s.addText(String(i + 1), { x: M + 0.3, y: y + 0.31, w: 0.5, h: 0.36, fontFace: HEAD, fontSize: 16, bold: true, color: P.white, align: "center", margin: 0 });
    s.addText(t, { x: M + 0.98, y: y + 0.14, w: 6.3, h: 0.3, fontFace: BODY, fontSize: 14, bold: true, color: P.ink, margin: 0 });
    s.addText(d, { x: M + 0.98, y: y + 0.44, w: 6.4, h: 0.46, fontFace: BODY, fontSize: 11, color: P.muted, lineSpacing: 14, margin: 0 });
  });

  card(s, 8.55, 2.08, 4.16, 3.34, P.ink);
  s.addText("IMPACTO EN EL SALDO", { x: 8.85, y: 2.3, w: 3.6, h: 0.28, fontFace: BODY, fontSize: 10.5, bold: true, color: P.gold, charSpacing: 2, margin: 0 });
  const imp = [["Agosto", "450.000", "650.000"], ["Septiembre", "2.550.000", "3.350.000"]];
  imp.forEach(([m, a, b], i) => {
    const y = 2.75 + i * 1.28;
    s.addText(m, { x: 8.85, y, w: 3.6, h: 0.28, fontFace: BODY, fontSize: 12, bold: true, color: P.white, margin: 0 });
    s.addText("antes  ARS " + a, { x: 8.85, y: y + 0.3, w: 3.6, h: 0.28, fontFace: BODY, fontSize: 11.5, color: "8FA79A", strike: true, margin: 0 });
    s.addText("ARS " + b, { x: 8.85, y: y + 0.58, w: 3.6, h: 0.44, fontFace: HEAD, fontSize: 22, bold: true, color: P.gold, margin: 0 });
  });

  s.addText("Los dos meses cierran mejor: el ahorro en Mariela y la salida de la tarjeta pesan más que la pérdida de Fiat MP.", { x: M, y: 5.62, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: P.muted, margin: 0 });
  pageNum(s, 3);
}

/* ───────────────────── 4 · LOS 7 RECURRENTES ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "FUENTE 1", "Los 7 clientes recurrentes", "Lo que entra todos los meses y lo que queda después de pagarle a Mariela");

  const cli = [["Cementera", 500000], ["Macellaio Carnes", 300000], ["Muñoz", 200000], ["Flipar", 200000], ["RIFI Burger", 200000], ["RIFI comida árabe", 200000], ["Polcher social media", 100000]];
  const rows = [[
    { text: "Cliente", options: { bold: true, color: P.white, fontSize: 11.5 } },
    { text: "Cobra", options: { bold: true, color: P.white, fontSize: 11.5, align: "right" } },
    { text: "Mariela", options: { bold: true, color: P.white, fontSize: 11.5, align: "right" } },
    { text: "Queda", options: { bold: true, color: P.white, fontSize: 11.5, align: "right" } },
    { text: "Margen", options: { bold: true, color: P.white, fontSize: 11.5, align: "right" } },
  ]];
  cli.forEach(([n, v]) => {
    const flag = v === 100000;
    const col = flag ? P.red : P.ink;
    rows.push([
      { text: n, options: { color: col, fontSize: 12, bold: flag } },
      { text: fmt(v), options: { color: col, fontSize: 12, align: "right" } },
      { text: "-50.000", options: { color: P.muted, fontSize: 12, align: "right" } },
      { text: fmt(v - 50000), options: { color: col, fontSize: 12, bold: true, align: "right" } },
      { text: Math.round((v - 50000) / v * 100) + "%", options: { color: col, fontSize: 12, bold: flag, align: "right" } },
    ]);
  });
  rows.push([
    { text: "Total", options: { bold: true, color: P.white, fontSize: 12 } },
    { text: "1.700.000", options: { bold: true, color: P.white, fontSize: 12, align: "right" } },
    { text: "-350.000", options: { bold: true, color: P.white, fontSize: 12, align: "right" } },
    { text: "1.350.000", options: { bold: true, color: P.gold, fontSize: 12, align: "right" } },
    { text: "79%", options: { bold: true, color: P.white, fontSize: 12, align: "right" } },
  ]);
  s.addTable(rows, {
    x: M, y: 2.05, w: 8.1, colW: [2.9, 1.35, 1.35, 1.35, 1.15],
    rowH: 0.36, fontFace: BODY, valign: "middle",
    border: { type: "solid", color: P.line, pt: 1 },
    fill: { color: P.white },
    margin: [0, 8, 0, 8],
  });
  // header + footer row fills
  s.addShape(pres.ShapeType.rect, { x: M, y: 2.05, w: 8.1, h: 0.36, fill: { color: P.green }, line: { color: P.green, width: 0 } });
  s.addText([
    { text: "Cliente", options: { bold: true } }], { x: M + 0.1, y: 2.05, w: 2.8, h: 0.36, fontFace: BODY, fontSize: 11.5, color: P.white, valign: "middle", margin: 0 });
  ["Cobra", "Mariela", "Queda", "Margen"].forEach((t, i) => {
    const xs = [M + 2.9, M + 4.25, M + 5.6, M + 6.95];
    const ws = [1.35, 1.35, 1.35, 1.15];
    s.addText(t, { x: xs[i], y: 2.05, w: ws[i] - 0.12, h: 0.36, fontFace: BODY, fontSize: 11.5, bold: true, color: P.white, align: "right", valign: "middle", margin: 0 });
  });
  const yFoot = 2.05 + 0.36 * 8;
  s.addShape(pres.ShapeType.rect, { x: M, y: yFoot, w: 8.1, h: 0.36, fill: { color: P.ink }, line: { color: P.ink, width: 0 } });
  s.addText("Total", { x: M + 0.1, y: yFoot, w: 2.8, h: 0.36, fontFace: BODY, fontSize: 12, bold: true, color: P.white, valign: "middle", margin: 0 });
  [["1.700.000", P.white], ["-350.000", "9FB6AA"], ["1.350.000", P.gold], ["79%", P.white]].forEach(([t, c], i) => {
    const xs = [M + 2.9, M + 4.25, M + 5.6, M + 6.95];
    const ws = [1.35, 1.35, 1.35, 1.15];
    s.addText(t, { x: xs[i], y: yFoot, w: ws[i] - 0.12, h: 0.36, fontFace: BODY, fontSize: 12, bold: true, color: c, align: "right", valign: "middle", margin: 0 });
  });

  const side = [
    ["Neto recurrente", ars(1350000), "Lo que queda por mes sin tocar la animación", P.green],
    ["Cementera sola", "29,4%", "de todo lo recurrente. Es el cliente que no se puede perder", P.ink],
    ["Polcher", "50% de margen", "A 100.000 deja 50.000. Es el único abajo del 75%", P.red],
  ];
  side.forEach(([t, v, d, c], i) => {
    const y = 2.05 + i * 1.28;
    card(s, 9.05, y, 3.66, 1.12, i === 0 ? P.green : P.paper, { line: i === 0 ? undefined : P.line, shadow: i === 0 });
    const fg = i === 0 ? P.white : P.ink;
    s.addText(t, { x: 9.32, y: y + 0.13, w: 3.2, h: 0.26, fontFace: BODY, fontSize: 10.5, bold: true, color: i === 0 ? "BFD8CB" : P.muted, charSpacing: 1, margin: 0 });
    s.addText(v, { x: 9.32, y: y + 0.36, w: 3.2, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: i === 0 ? P.gold : c, margin: 0 });
    s.addText(d, { x: 9.32, y: y + 0.75, w: 3.2, h: 0.32, fontFace: BODY, fontSize: 9.5, color: i === 0 ? "CFDCD4" : P.muted, lineSpacing: 12, margin: 0 });
  });

  s.addText("Regla: cada cliente recurrente deja su precio menos 50.000. Por eso los chicos duelen más que los grandes.", { x: M, y: 5.75, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: P.muted, margin: 0 });
  pageNum(s, 4);
}

/* ─────────────── 5 y 6 · AGOSTO / SEPTIEMBRE ─────────────── */
function monthSlide(cfg, page) {
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, cfg.kicker, cfg.title, cfg.sub);

  const CH = 3.46, CB = 2.05 + CH, PITCH = 0.36, NY = 4.62;

  // Ingresos
  card(s, M, 2.05, 6.0, CH, P.paper, { line: P.line, shadow: false });
  s.addText("ENTRA", { x: M + 0.35, y: 2.24, w: 3, h: 0.28, fontFace: BODY, fontSize: 10.5, bold: true, color: P.green, charSpacing: 2, margin: 0 });
  cfg.inc.forEach(([n, v, note], i) => {
    const y = 2.62 + i * PITCH;
    s.addText(n, { x: M + 0.35, y, w: 3.75, h: 0.3, fontFace: BODY, fontSize: 12, color: note ? P.muted : P.ink, valign: "middle", margin: 0 });
    s.addText(fmt(v), { x: M + 4.05, y, w: 1.6, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: P.ink, align: "right", valign: "middle", margin: 0 });
  });
  const yIn = 2.62 + cfg.inc.length * PITCH + 0.08;
  s.addShape(pres.ShapeType.rect, { x: M + 0.35, y: yIn, w: 5.3, h: 0.012, fill: { color: P.line }, line: { color: P.line, width: 0 } });
  s.addText("Total", { x: M + 0.35, y: yIn + 0.1, w: 3, h: 0.34, fontFace: BODY, fontSize: 12.5, bold: true, color: P.ink, margin: 0 });
  s.addText(ars(cfg.inc.reduce((a, r) => a + r[1], 0)), { x: M + 3.05, y: yIn + 0.08, w: 2.6, h: 0.36, fontFace: HEAD, fontSize: 17, bold: true, color: P.green, align: "right", margin: 0 });
  if (cfg.incNote) s.addText(cfg.incNote, { x: M + 0.35, y: NY, w: 5.3, h: 0.72, fontFace: BODY, fontSize: 11, italic: true, color: P.muted, lineSpacing: 15, margin: 0 });

  // Egresos
  card(s, 6.85, 2.05, 5.86, CH, P.paper, { line: P.line, shadow: false });
  s.addText("SALE", { x: 7.2, y: 2.24, w: 3, h: 0.28, fontFace: BODY, fontSize: 10.5, bold: true, color: P.red, charSpacing: 2, margin: 0 });
  cfg.out.forEach(([n, v], i) => {
    const y = 2.62 + i * PITCH;
    s.addText(n, { x: 7.2, y, w: 3.6, h: 0.3, fontFace: BODY, fontSize: 12, color: P.ink, valign: "middle", margin: 0 });
    s.addText("-" + fmt(v), { x: 10.8, y, w: 1.6, h: 0.3, fontFace: BODY, fontSize: 12, bold: true, color: P.red, align: "right", valign: "middle", margin: 0 });
  });
  const yOut = 2.62 + cfg.out.length * PITCH + 0.08;
  s.addShape(pres.ShapeType.rect, { x: 7.2, y: yOut, w: 5.2, h: 0.012, fill: { color: P.line }, line: { color: P.line, width: 0 } });
  s.addText("Total", { x: 7.2, y: yOut + 0.1, w: 3, h: 0.34, fontFace: BODY, fontSize: 12.5, bold: true, color: P.ink, margin: 0 });
  s.addText("-" + ars(cfg.out.reduce((a, r) => a + r[1], 0)), { x: 9.8, y: yOut + 0.08, w: 2.6, h: 0.36, fontFace: HEAD, fontSize: 17, bold: true, color: P.red, align: "right", margin: 0 });
  if (cfg.outNote) s.addText(cfg.outNote, { x: 7.2, y: NY, w: 5.2, h: 0.72, fontFace: BODY, fontSize: 11, italic: true, color: P.muted, lineSpacing: 15, margin: 0 });

  // Saldo
  card(s, M, CB + 0.12, 12.1, 1.34, P.ink);
  s.addText(cfg.saldoLabel, { x: M + 0.42, y: CB + 0.31, w: 5.2, h: 0.36, fontFace: BODY, fontSize: 14, bold: true, color: P.white, margin: 0 });
  s.addText(cfg.note, { x: M + 0.42, y: CB + 0.67, w: 7.2, h: 0.6, fontFace: BODY, fontSize: 10.5, color: "9FB6AA", lineSpacing: 14, margin: 0 });
  s.addText(ars(cfg.saldo), { x: 8.2, y: CB + 0.45, w: 4.1, h: 0.66, fontFace: HEAD, fontSize: 32, bold: true, color: P.gold, align: "right", margin: 0 });
  pageNum(s, page);
  if (cfg.notes) s.addNotes(cfg.notes);
}

monthSlide({
  kicker: "MES 1",
  title: "Agosto",
  sub: "El mes pesado: entra bien pero se va casi todo en gastos de una sola vez",
  inc: [
    ["Recurrentes (7 clientes)", 1700000],
    ["Fiat MP · último pago", 300000],
    ["San Pugliese Studio", 300000],
    ["Psicólogos branding", 100000],
    ["Animación · 15/08", 800000],
    ["Animación · 31/08", 800000],
  ],
  out: [
    ["Financista", 1600000],
    ["Tarjeta de tu vieja", 1000000],
    ["Mariela (8 × 50.000)", 400000],
    ["Multa", 350000],
  ],
  saldo: 650000,
  saldoLabel: "Queda en agosto",
  note: "Mariela cobra 400.000 porque agosto todavía incluye la última de Fiat MP. Los otros tres gastos son de una sola vez.",
  notes: "Agosto tiene 2.950.000 de gastos puntuales: financista, tarjeta y multa. Sin ellos el mes cerraba en 3.600.000.",
}, 5);

monthSlide({
  kicker: "MES 2",
  title: "Septiembre",
  sub: "Sin gastos puntuales, casi todo lo que entra queda",
  inc: [
    ["Recurrentes (7 clientes)", 1700000],
    ["Santander / Landia", 400000],
    ["Animación Lucas Casagrande", 1600000],
  ],
  out: [
    ["Mariela (7 × 50.000)", 350000],
  ],
  incNote: "Fiat MP ya no aparece: son 300.000 brutos menos por mes. Los 7 recurrentes quedan como el piso fijo.",
  outNote: "No hay financista, ni multa, ni tarjeta. Septiembre no tiene ningún gasto de una sola vez.",
  saldo: 3350000,
  saldoLabel: "Queda en septiembre",
  note: "Si la tarjeta de 1.000.000 vuelve a caer en septiembre, el saldo baja a ARS 2.350.000.",
  notes: "Fiat MP ya no aparece. El mes queda limpio: el único costo es Mariela.",
}, 6);

/* ───────────────────── 7 · FLUJO ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "PROYECCIÓN", "De agosto a octubre", "Octubre es el mes de verdad: sin puntuales y sin saber si sigue la animación");

  s.addChart(pres.ChartType.bar, [
    { name: "Entra", labels: ["Agosto", "Septiembre", "Octubre base"], values: [4000000, 3700000, 1700000] },
    { name: "Sale", labels: ["Agosto", "Septiembre", "Octubre base"], values: [3350000, 350000, 350000] },
    { name: "Queda", labels: ["Agosto", "Septiembre", "Octubre base"], values: [650000, 3350000, 1350000] },
  ], {
    x: M, y: 2.0, w: 7.9, h: 3.55,
    barDir: "col", barGapWidthPct: 45,
    chartColors: [P.green, P.red, P.gold],
    showLegend: true, legendPos: "t", legendFontSize: 11, legendFontFace: BODY, legendColor: P.muted,
    showValue: true, dataLabelPosition: "outEnd", dataLabelFormatCode: "#,##0,,\"M\"",
    dataLabelFontSize: 9, dataLabelFontFace: BODY, dataLabelColor: P.muted,
    catAxisLabelColor: P.ink, catAxisLabelFontSize: 11, catAxisLabelFontFace: BODY,
    valAxisLabelColor: P.muted, valAxisLabelFontSize: 10, valAxisLabelFontFace: BODY,
    valAxisMajorUnit: 1000000, valAxisLabelFormatCode: "#,##0,,\"M\"",
    valGridLine: { color: P.line, size: 1 },
    catGridLine: { style: "none" },
    border: { pt: 0, color: P.white },
  });

  const cards = [
    ["Octubre base", ars(1350000), "Solo los 7 recurrentes menos Mariela. Es el piso real del negocio.", P.ink],
    ["Octubre con animación", ars(2950000), "Si la animación sigue al mismo nivel.", P.green],
    ["Acumulado ago + sep", ars(4000000), "Plata en mano al cerrar septiembre, si la tarjeta no se repite.", P.gold],
  ];
  cards.forEach(([t, v, d, c], i) => {
    const y = 2.0 + i * 1.28;
    const dark = i !== 0;
    card(s, 8.85, y, 3.86, 1.12, i === 2 ? P.ink : (i === 1 ? P.green : P.paper), { line: i === 0 ? P.line : undefined, shadow: i !== 0 });
    s.addText(t, { x: 9.12, y: y + 0.13, w: 3.4, h: 0.26, fontFace: BODY, fontSize: 10.5, bold: true, color: i === 0 ? P.muted : "BFD8CB", charSpacing: 1, margin: 0 });
    s.addText(v, { x: 9.12, y: y + 0.36, w: 3.4, h: 0.4, fontFace: HEAD, fontSize: 20, bold: true, color: i === 0 ? P.ink : P.gold, margin: 0 });
    s.addText(d, { x: 9.12, y: y + 0.75, w: 3.4, h: 0.32, fontFace: BODY, fontSize: 9.5, color: i === 0 ? P.muted : "CFDCD4", lineSpacing: 12, margin: 0 });
  });

  s.addText("Entre septiembre y octubre el ingreso puede caer a la mitad. No es un problema de gastos: es que la animación se termina.", { x: M, y: 5.85, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 12, italic: true, color: P.muted, margin: 0 });
  pageNum(s, 7);
}

/* ───────────────────── 8 · RIESGOS ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "ALERTAS", "Dónde está el riesgo", "De dónde viene la plata de septiembre y qué pasa si falla una pata");

  s.addChart(pres.ChartType.doughnut, [{
    name: "Septiembre",
    labels: ["Recurrentes", "Animación", "Santander / Landia"],
    values: [1700000, 1600000, 400000],
  }], {
    x: M, y: 2.0, w: 4.7, h: 3.7,
    chartColors: [P.green, P.gold, P.ink],
    holeSize: 58,
    showLegend: true, legendPos: "b", legendFontSize: 11, legendFontFace: BODY, legendColor: P.muted,
    showValue: false, showPercent: true,
    dataLabelColor: P.white, dataLabelFontSize: 12, dataLabelFontFace: BODY, dataLabelFontBold: true,
    border: { pt: 0, color: P.white },
  });

  const risks = [
    ["La animación es el 43% de septiembre", "Si se corta y no entra nada en su lugar, el mes pasa de 3.700.000 a 2.100.000. Es el riesgo más grande y el más probable."],
    ["Cementera es el 29% de lo recurrente", "Un solo cliente sostiene casi un tercio del piso. Perderlo son 450.000 netos por mes."],
    ["Falta reemplazar a Fiat MP", "Desde septiembre faltan 250.000 netos por mes. Hace falta un recurrente de 300.000 para volver a donde estabas."],
    ["No hay gastos personales cargados", "El plan solo tiene costos del negocio. La tarjeta de 1.000.000 sugiere que la vida cuesta bastante más que Mariela."],
  ];
  risks.forEach(([t, d], i) => {
    const y = 2.0 + i * 0.95;
    card(s, 5.72, y, 6.99, 0.86, P.paper, { line: P.line, shadow: false });
    s.addShape(pres.ShapeType.ellipse, { x: 6.0, y: y + 0.28, w: 0.3, h: 0.3, fill: { color: i < 2 ? P.red : P.gold }, line: { color: i < 2 ? P.red : P.gold, width: 0 } });
    s.addText(t, { x: 6.45, y: y + 0.1, w: 6.0, h: 0.3, fontFace: BODY, fontSize: 13, bold: true, color: P.ink, margin: 0 });
    s.addText(d, { x: 6.45, y: y + 0.39, w: 6.0, h: 0.4, fontFace: BODY, fontSize: 10, color: P.muted, lineSpacing: 12, margin: 0 });
  });
  pageNum(s, 8);
}

/* ───────────────────── 9 · REGLAS ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.white };
  titleSlide(s, "MANUAL DE USO", "Cinco reglas para manejar la plata", "Simples, chequeables una vez por mes");

  const rules = [
    ["Separá las dos fuentes", "Lo recurrente paga la vida. La animación es capital, no sueldo: no la gastes como si entrara todos los meses."],
    ["Ningún recurrente abajo de 150.000", "Mariela se lleva 50.000 fijos por cliente. A 100.000 el margen es 50%; a 150.000 ya es 67%."],
    ["Reemplazá a Fiat MP antes de octubre", "Un recurrente de 300.000 te devuelve los 250.000 netos que perdiste. Es el objetivo comercial del trimestre."],
    ["Guardá 3 meses de piso", "Con el excedente de septiembre, apartá ARS 4.000.000 antes de gastar. Cubre tres meses sin animación."],
    ["Revisá Polcher", "O sube a 150.000 o libera el tiempo para un cliente que deje más. Hoy deja 50.000 por mes."],
  ];
  rules.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * 6.2, y = 2.05 + row * 1.42;
    const w = i === 4 ? 12.1 : 5.9;
    card(s, x, y, w, 1.24, i === 4 ? P.ink : P.paper, { line: i === 4 ? undefined : P.line, shadow: i === 4 });
    s.addShape(pres.ShapeType.ellipse, { x: x + 0.32, y: y + 0.36, w: 0.52, h: 0.52, fill: { color: i === 4 ? P.gold : P.green }, line: { color: i === 4 ? P.gold : P.green, width: 0 } });
    s.addText(String(i + 1), { x: x + 0.32, y: y + 0.44, w: 0.52, h: 0.38, fontFace: HEAD, fontSize: 17, bold: true, color: i === 4 ? P.ink : P.white, align: "center", margin: 0 });
    s.addText(t, { x: x + 1.04, y: y + 0.22, w: w - 1.4, h: 0.32, fontFace: BODY, fontSize: 14, bold: true, color: i === 4 ? P.white : P.ink, margin: 0 });
    s.addText(d, { x: x + 1.04, y: y + 0.56, w: w - 1.4, h: 0.56, fontFace: BODY, fontSize: 11, color: i === 4 ? "CFDCD4" : P.muted, lineSpacing: 14, margin: 0 });
  });
  pageNum(s, 9);
}

/* ───────────────────── 10 · CIERRE ───────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: P.ink };
  s.addShape(pres.ShapeType.ellipse, { x: -2.4, y: 3.6, w: 6.2, h: 6.2, fill: { color: P.dark2 }, line: { color: P.dark2, width: 0 } });

  s.addText("PARA CERRAR", { x: M, y: 0.75, w: 8, h: 0.3, fontFace: BODY, fontSize: 11, bold: true, color: P.gold, charSpacing: 3, margin: 0 });
  s.addText("Cuatro cosas que hay que confirmar", { x: M, y: 1.1, w: 11.4, h: 0.66, fontFace: HEAD, fontSize: 34, bold: true, color: P.white, margin: 0 });
  s.addText("Los números de arriba asumen estas respuestas. Si alguna cambia, cambia el plan.", { x: M, y: 1.82, w: 11.4, h: 0.34, fontFace: BODY, fontSize: 14, color: "9FB6AA", margin: 0 });

  const qs = [
    ["¿La tarjeta de 1.000.000 se repite todos los meses?", "Si es mensual, deja de ser un gasto puntual y el piso de octubre baja de 1.350.000 a 350.000."],
    ["¿Santander / Landia es puntual o queda como recurrente?", "Si queda, son 350.000 netos más por mes y el octavo cliente de Mariela."],
    ["¿La animación sigue después de septiembre?", "Es el 43% de lo que entra. Definir esto antes de comprometer gastos."],
    ["¿Cuánto te cuesta vivir por mes?", "Hoy el plan no tiene ningún gasto personal cargado. Sin ese número, el saldo no dice si alcanza."],
  ];
  qs.forEach(([t, d], i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = M + col * 6.2, y = 2.5 + row * 1.55;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.9, h: 1.36, rectRadius: 0.1, fill: { color: P.dark2 }, line: { color: "2C5546", width: 1 } });
    s.addText(t, { x: x + 0.34, y: y + 0.18, w: 5.25, h: 0.5, fontFace: BODY, fontSize: 13, bold: true, color: P.white, lineSpacing: 17, margin: 0 });
    s.addText(d, { x: x + 0.34, y: y + 0.72, w: 5.25, h: 0.5, fontFace: BODY, fontSize: 10.5, color: "9FB6AA", lineSpacing: 13, margin: 0 });
  });

  s.addText("Piso del negocio hoy: ARS 1.350.000 netos por mes, todos los meses, sin depender de nadie nuevo.", { x: M, y: 6.15, w: 12.1, h: 0.4, fontFace: BODY, fontSize: 13, italic: true, color: P.gold, margin: 0 });
  s.addNotes("Cerrar preguntando estas cuatro cosas; con las respuestas se rehace la proyección de octubre en adelante.");
}

pres.writeFile({ fileName: process.argv[2] || "finanzas.pptx" }).then(f => console.log("OK " + f));
