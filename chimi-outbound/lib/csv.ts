import type { Campaign, Prospect } from "./types.ts";
import { buildProspect } from "./logic.ts";

export function campaignsToCsv(campaigns: Campaign[]): string {
  const escape = (value: string | number) => {
    const text = String(value);
    return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
  };
  const header = "campaña,segmento,canal,estado,enviados,respuestas,reuniones,total";
  const rows = campaigns.map((c) => [c.name, c.segment, c.channel, c.status === "active" ? "Activa" : "Pausada", c.sent, c.replies, c.meetings, c.total].map(escape).join(","));
  return [header, ...rows].join("\n");
}

// Parser CSV mínimo con soporte de comillas dobles, separador coma o punto y coma.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  const separator = detectSeparator(text);
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += char;
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === separator) {
      row.push(cell.trim()); cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      row.push(cell.trim()); cell = "";
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
    } else cell += char;
  }
  row.push(cell.trim());
  if (row.some((value) => value !== "")) rows.push(row);
  return rows;
}

function detectSeparator(text: string) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return (firstLine.match(/;/g)?.length ?? 0) > (firstLine.match(/,/g)?.length ?? 0) ? ";" : ",";
}

const headerAliases: Record<string, keyof Prospect> = {
  nombre: "name", "nombre y apellido": "name", name: "name", contacto: "name",
  empresa: "company", company: "company", negocio: "company",
  cargo: "role", rol: "role", role: "role", puesto: "role",
  industria: "industry", rubro: "industry", industry: "industry", sector: "industry",
  email: "email", "e-mail": "email", correo: "email", mail: "email",
  fuente: "source", origen: "source", source: "source",
};

export type CsvImportResult = {
  prospects: Prospect[];
  skipped: number;
  errors: string[];
};

// Convierte filas CSV en prospectos. Deduplica por email contra la base existente
// y dentro del propio archivo. La primera fila debe ser el encabezado.
export function prospectsFromCsv(text: string, existing: Prospect[], now = Date.now()): CsvImportResult {
  const rows = parseCsv(text);
  if (rows.length === 0) return { prospects: [], skipped: 0, errors: ["El archivo está vacío."] };

  const header = rows[0].map((cell) => cell.toLowerCase());
  const columns = new Map<number, keyof Prospect>();
  header.forEach((cell, index) => {
    const field = headerAliases[cell];
    if (field) columns.set(index, field);
  });
  if (!Array.from(columns.values()).includes("email")) {
    return { prospects: [], skipped: 0, errors: ["Falta la columna de email. Encabezados aceptados: nombre, empresa, cargo, industria, email, fuente."] };
  }

  const knownEmails = new Set(existing.map((p) => p.email.toLowerCase()).filter(Boolean));
  const prospects: Prospect[] = [];
  let skipped = 0;
  const errors: string[] = [];

  rows.slice(1).forEach((row, rowIndex) => {
    const fields: Partial<Record<keyof Prospect, string>> = {};
    columns.forEach((field, index) => {
      const value = row[index];
      if (value) fields[field] = value;
    });
    const email = (fields.email ?? "").toLowerCase();
    if (!email || !email.includes("@")) {
      errors.push(`Fila ${rowIndex + 2}: email inválido.`);
      return;
    }
    if (knownEmails.has(email)) {
      skipped++;
      return;
    }
    knownEmails.add(email);
    prospects.push(buildProspect({
      id: now + rowIndex,
      name: fields.name ?? email.split("@")[0],
      role: fields.role ?? "Decisor",
      company: fields.company ?? "Empresa",
      industry: fields.industry ?? "Servicios",
      source: fields.source ?? "CSV",
      email: fields.email ?? "",
    }));
  });

  return { prospects, skipped, errors };
}
