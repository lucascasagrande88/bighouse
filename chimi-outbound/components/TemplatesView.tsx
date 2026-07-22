"use client";

import type { Prospect, Template } from "../lib/types";

type Props = {
  templates: Template[];
  currentTemplate: Template;
  prospects: Prospect[];
  selectedProspect: Prospect;
  message: string;
  onSelectTemplate: (id: number) => void;
  onSelectProspect: (prospect: Prospect) => void;
  onCopy: () => void;
  onCycleMessage: () => void;
};

export default function TemplatesView({ templates, currentTemplate, prospects, selectedProspect, message, onSelectTemplate, onSelectProspect, onCopy, onCycleMessage }: Props) {
  return (
    <>
      <section className="page-heading compact-heading"><div><div className="eyebrow">LABORATORIO DE MENSAJES</div><h1>Plantillas que no parecen plantillas.</h1><p>La estrategia es tuya. El agente la adapta a cada persona.</p></div><button className="primary-button" onClick={onCopy}>Copiar mensaje</button></section>
      <section className="template-layout">
        <aside className="template-list">
          {templates.map((template) => <button key={template.id} onClick={() => onSelectTemplate(template.id)} className={currentTemplate.id === template.id ? "template-option active" : "template-option"}><span className="template-number">0{template.id}</span><div><strong>{template.name}</strong><small>{template.tag}</small></div><em>{template.reply}</em></button>)}
        </aside>
        <article className="panel composer-panel">
          <div className="composer-toolbar"><div><span className="section-kicker">VISTA PREVIA PERSONALIZADA</span><h2>{currentTemplate.name}</h2></div><select value={selectedProspect.id} onChange={(e) => { const next = prospects.find((p) => p.id === Number(e.target.value)); if (next) onSelectProspect(next); }} aria-label="Elegir prospecto">{prospects.map((p) => <option value={p.id} key={p.id}>{p.name} · {p.company}</option>)}</select></div>
          <div className="email-shell">
            <div className="email-meta"><span className="person-avatar orange-avatar">LC</span><div><strong>Lucas de Chimichurri</strong><small>Para: {selectedProspect.name} &lt;{selectedProspect.email}&gt;</small></div><span className="ai-chip">✦ PERSONALIZADO</span></div>
            <div className="email-subject"><span>Asunto</span><strong>Una idea concreta para {selectedProspect.company}</strong></div>
            <div className="email-body"><p>Hola {selectedProspect.name.split(" ")[0]},</p><p>{message}</p><p>Si te sirve, te muestro los tres puntos en una llamada de 15 minutos.</p><p>Lucas<br /><strong>Chimichurri — Diseño que vende</strong></p></div>
          </div>
          <div className="composer-actions"><div><span className="quality-dot" /><p><strong>96% alineado a tu voz</strong><small>Directo · Específico · Sin frases genéricas</small></p></div><button className="secondary-button" onClick={onCycleMessage}>↻ Generar otro ángulo</button></div>
        </article>
      </section>
    </>
  );
}
