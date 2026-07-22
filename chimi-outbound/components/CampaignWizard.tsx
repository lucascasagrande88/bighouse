"use client";

import type { CampaignDraft } from "../lib/types";

type Props = {
  step: number;
  draft: CampaignDraft;
  onDraft: (draft: CampaignDraft) => void;
  onStep: (step: number) => void;
  onClose: () => void;
  onLaunch: () => void;
};

export default function CampaignWizard({ step, draft, onDraft, onStep, onClose, onLaunch }: Props) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="campaign-wizard-title">
      <section className="wizard-modal">
        <div className="wizard-header"><div><span className="section-kicker">NUEVA CAMPAÑA</span><h2 id="campaign-wizard-title">Armemos una máquina de reuniones.</h2></div><button onClick={onClose} aria-label="Cerrar">×</button></div>
        <div className="wizard-progress">{[1, 2, 3, 4].map((item) => <div key={item} className={step >= item ? "active" : ""}><span>{step > item ? "✓" : item}</span><small>{["Segmento", "Canales", "Mensaje", "Revisión"][item - 1]}</small></div>)}</div>
        <div className="wizard-body">
          {step === 1 && <div className="wizard-section"><h3>¿A quién queremos llegar?</h3><p>Definí un segmento específico. El agente prioriza los mejores prospectos.</p><label>Nombre de campaña<input autoFocus value={draft.name} onChange={(e) => onDraft({ ...draft, name: e.target.value })} placeholder="Ej. Constructoras sin web" /></label><div className="form-grid"><label>Industria<select value={draft.industry} onChange={(e) => onDraft({ ...draft, industry: e.target.value })}>{["Construcción", "Gastronomía", "Retail", "Salud", "Real Estate", "Servicios profesionales"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Ubicación<select value={draft.location} onChange={(e) => onDraft({ ...draft, location: e.target.value })}><option>Buenos Aires</option><option>GBA Sur</option><option>Argentina</option><option>Madrid</option></select></label><label>Tamaño<select value={draft.size} onChange={(e) => onDraft({ ...draft, size: e.target.value })}><option>1–5</option><option>5–30</option><option>30–100</option><option>100+</option></select></label></div><div className="estimated-box"><span>◎</span><p><strong>≈ 120 prospectos compatibles</strong><small>88 con score superior a 75</small></p></div></div>}
          {step === 2 && <div className="wizard-section"><h3>Elegí los canales</h3><p>Combinarlos mejora la tasa de respuesta sin aumentar la presión.</p><div className="channel-options">{[{ name: "Email", desc: "4 toques · 12 días", icon: "M" }, { name: "Email + LinkedIn", desc: "4 emails + 1 conexión", icon: "in" }].map((item) => <button key={item.name} className={draft.channel === item.name ? "active" : ""} onClick={() => onDraft({ ...draft, channel: item.name })}><span>{item.icon}</span><p><strong>{item.name}</strong><small>{item.desc}</small></p><i>{draft.channel === item.name ? "✓" : ""}</i></button>)}</div><div className="safety-box wide"><span>✓</span><p><strong>Envío seguro</strong><small>Máximo 40 contactos por día, con horarios y pausas naturales.</small></p></div></div>}
          {step === 3 && <div className="wizard-section"><h3>Dale una estrategia al agente</h3><p>La IA personaliza; la propuesta de valor sigue siendo tuya.</p><label>Oferta o próxima acción<textarea value={draft.offer} onChange={(e) => onDraft({ ...draft, offer: e.target.value })} rows={3} /></label><label>Tono<div className="choice-row">{["Directo", "Cálido", "Audaz"].map((tone) => <button key={tone} className={draft.tone === tone ? "active" : ""} onClick={() => onDraft({ ...draft, tone })}>{tone}</button>)}</div></label><div className="generated-preview"><span>✦</span><p>“Vi que tu empresa está creciendo, pero hay una brecha entre el valor real del negocio y cómo se percibe online. Preparé un {draft.offer.toLowerCase()}. ¿Te lo mando?”</p></div></div>}
          {step === 4 && <div className="wizard-section review-section"><div className="launch-orb">↗</div><h3>{draft.name || `${draft.industry} — ${draft.location}`}</h3><p>Lista para activar.</p><div className="review-grid"><div><span>Segmento</span><strong>{draft.industry}<br />{draft.location}</strong></div><div><span>Alcance</span><strong>120 prospectos<br />{draft.size} empleados</strong></div><div><span>Secuencia</span><strong>{draft.channel}<br />12 días</strong></div><div><span>Voz</span><strong>{draft.tone}<br />Personalizada</strong></div></div><div className="launch-note"><span>◷</span><p><strong>Primer lote: hoy, 10:30</strong><small>24 contactos revisados antes del envío.</small></p></div></div>}
        </div>
        <div className="wizard-footer"><button className="secondary-button" onClick={() => step === 1 ? onClose() : onStep(step - 1)}>{step === 1 ? "Cancelar" : "← Atrás"}</button><button className="primary-button" onClick={() => step === 4 ? onLaunch() : onStep(step + 1)}>{step === 4 ? "Activar campaña ↗" : "Continuar →"}</button></div>
      </section>
    </div>
  );
}
