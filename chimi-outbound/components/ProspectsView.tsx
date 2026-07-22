"use client";

import type { Prospect } from "../lib/types";
import { statusClass } from "../lib/data";
import { filterProspects, initials } from "../lib/logic";

type Props = {
  prospects: Prospect[];
  search: string;
  statusFilter: string;
  onSearch: (value: string) => void;
  onStatusFilter: (value: string) => void;
  onAdd: () => void;
  onImport: () => void;
  onPersonalize: (prospect: Prospect) => void;
};

export default function ProspectsView({ prospects, search, statusFilter, onSearch, onStatusFilter, onAdd, onImport, onPersonalize }: Props) {
  const filtered = filterProspects(prospects, search, statusFilter);
  return (
    <>
      <section className="page-heading compact-heading">
        <div><div className="eyebrow">BASE DE CONTACTOS</div><h1>Prospectos <span>{prospects.length}</span></h1><p>Priorizados por encaje, intención y señales de crecimiento.</p></div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onImport}>⇪ Importar CSV</button>
          <button className="primary-button" onClick={onAdd}>＋ Agregar contacto</button>
        </div>
      </section>
      <section className="panel table-panel">
        <div className="table-toolbar">
          <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => onSearch(e.target.value)} placeholder="Buscar nombre, empresa o industria…" /></label>
          <div className="filter-chips">{["Todos", "Nuevo", "Investigado", "Contactado", "Respondió", "Reunión"].map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => onStatusFilter(status)}>{status}</button>)}</div>
        </div>
        <div className="prospect-table" role="table" aria-label="Prospectos">
          <div className="table-row table-header" role="row"><span>Persona</span><span>Empresa</span><span>Fuente</span><span>Score</span><span>Estado</span><span /></div>
          {filtered.map((p) => <div className="table-row" role="row" key={p.id}>
            <div className="person-cell"><span className="person-avatar">{initials(p.name)}</span><p><strong>{p.name}</strong><small>{p.role}</small></p></div>
            <div><strong>{p.company}</strong><small>{p.industry}</small></div>
            <span>{p.source}</span>
            <div className="score-cell"><strong>{p.score}</strong><span><i style={{ width: `${p.score}%` }} /></span></div>
            <span className={`status-pill ${statusClass[p.status]}`}>{p.status}</span>
            <button className="row-action" onClick={() => onPersonalize(p)}>Personalizar →</button>
          </div>)}
          {filtered.length === 0 && <div className="empty-state"><span>⌕</span><h3>No encontramos prospectos</h3><p>Probá con otra búsqueda o quitá un filtro.</p></div>}
        </div>
      </section>
    </>
  );
}
