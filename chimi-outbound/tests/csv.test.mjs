import assert from "node:assert/strict";
import test from "node:test";
import { campaignsToCsv, parseCsv, prospectsFromCsv } from "../lib/csv.ts";

test("parseCsv separa filas y celdas, con comillas y separador coma", () => {
  const rows = parseCsv('a,b,"c, con coma"\n1,2,"dice ""hola"""\n');
  assert.deepEqual(rows, [["a", "b", "c, con coma"], ["1", "2", 'dice "hola"']]);
});

test("parseCsv detecta punto y coma como separador", () => {
  const rows = parseCsv("nombre;email\nAna;ana@acme.com");
  assert.deepEqual(rows, [["nombre", "email"], ["Ana", "ana@acme.com"]]);
});

test("prospectsFromCsv mapea encabezados en español", () => {
  const csv = "nombre,empresa,cargo,industria,email\nAna López,Acme,CEO,Retail,ana@acme.com";
  const result = prospectsFromCsv(csv, [], 1000);
  assert.equal(result.prospects.length, 1);
  const [p] = result.prospects;
  assert.equal(p.name, "Ana López");
  assert.equal(p.company, "Acme");
  assert.equal(p.role, "CEO");
  assert.equal(p.industry, "Retail");
  assert.equal(p.email, "ana@acme.com");
  assert.equal(p.source, "CSV");
  assert.equal(p.status, "Nuevo");
});

test("prospectsFromCsv deduplica contra la base y dentro del archivo", () => {
  const existing = [{ id: 1, name: "Ana", role: "CEO", company: "Acme", industry: "Retail", source: "Manual", status: "Nuevo", score: 70, email: "ana@acme.com" }];
  const csv = "nombre,email\nAna,ANA@acme.com\nBeto,beto@zeta.com\nBeto otra vez,beto@zeta.com";
  const result = prospectsFromCsv(csv, existing);
  assert.equal(result.prospects.length, 1);
  assert.equal(result.prospects[0].email, "beto@zeta.com");
  assert.equal(result.skipped, 2);
});

test("prospectsFromCsv reporta filas con email inválido", () => {
  const csv = "nombre,email\nSin Mail,\nMal Mail,no-es-mail\nBien,ok@ok.com";
  const result = prospectsFromCsv(csv, []);
  assert.equal(result.prospects.length, 1);
  assert.equal(result.errors.length, 2);
});

test("prospectsFromCsv exige columna de email", () => {
  const result = prospectsFromCsv("nombre,empresa\nAna,Acme", []);
  assert.equal(result.prospects.length, 0);
  assert.equal(result.errors.length, 1);
});

test("campaignsToCsv genera encabezado y escapa comas", () => {
  const csv = campaignsToCsv([{ id: 1, name: "Comercios, GBA", segment: "Seg", channel: "Email", status: "active", sent: 10, replies: 2, meetings: 1, total: 100, createdAt: "hoy" }]);
  const lines = csv.split("\n");
  assert.equal(lines[0], "campaña,segmento,canal,estado,enviados,respuestas,reuniones,total");
  assert.ok(lines[1].startsWith('"Comercios, GBA",Seg,Email,Activa,10,2,1,100'));
});
