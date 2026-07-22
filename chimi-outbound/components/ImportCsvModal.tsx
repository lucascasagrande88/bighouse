"use client";

import { ChangeEvent, useState } from "react";
import type { Prospect } from "../lib/types";
import { CsvImportResult, prospectsFromCsv } from "../lib/csv";

type Props = {
  existing: Prospect[];
  onClose: () => void;
  onImport: (prospects: Prospect[]) => void;
};

export default function ImportCsvModal({ existing, onClose, onImport }: Props) {
  const [raw, setRaw] = useState("");
  const [fileName, setFileName] = useState("");
  const result: CsvImportResult | null = raw.trim() ? prospectsFromCsv(raw, existing) : null;

  function readFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => setRaw(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="import-csv-title">
      <section className="small-modal">
        <div className="wizard-header"><div><span className="section-kicker">IMPORTAR PROSPECTOS</span><h2 id="import-csv-title">Importar desde CSV</h2></div><button type="button" onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="small-modal-body import-body">
          <label className="file-drop">
            {fileName ? `Archivo: ${fileName}` : "Elegir archivo CSV"}
            <input type="file" accept=".csv,text/csv" onChange={readFile} />
          </label>
          <label>O pegá el contenido acá
            <textarea rows={6} value={raw} onChange={(e) => { setRaw(e.target.value); setFileName(""); }} placeholder={"nombre,empresa,cargo,industria,email\nCarla Méndez,Norte Estudio,Fundadora,Arquitectura,carla@norteestudio.com"} />
          </label>
          <p className="import-hint">La primera fila debe tener encabezados. Se aceptan: nombre, empresa, cargo, industria, email y fuente. Los emails repetidos se omiten.</p>
          {result && <div className={result.prospects.length ? "import-summary ok" : "import-summary"}>
            <strong>{result.prospects.length} para importar</strong>
            {result.skipped > 0 && <span>{result.skipped} duplicados omitidos</span>}
            {result.errors.slice(0, 3).map((error) => <span key={error}>{error}</span>)}
            {result.errors.length > 3 && <span>y {result.errors.length - 3} filas más con errores</span>}
          </div>}
        </div>
        <div className="wizard-footer">
          <button type="button" className="secondary-button" onClick={onClose}>Cancelar</button>
          <button type="button" className="primary-button" disabled={!result || result.prospects.length === 0} onClick={() => result && onImport(result.prospects)}>Importar {result?.prospects.length || ""} prospectos</button>
        </div>
      </section>
    </div>
  );
}
