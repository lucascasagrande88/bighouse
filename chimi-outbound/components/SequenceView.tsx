"use client";

import type { SequenceStep } from "../lib/types";

type Props = {
  steps: SequenceStep[];
  onAddStep: () => void;
  onRenameStep: (id: number, title: string) => void;
  onToggleStep: (id: number) => void;
  onRemoveStep: (id: number) => void;
};

export default function SequenceView({ steps, onAddStep, onRenameStep, onToggleStep, onRemoveStep }: Props) {
  return (
    <>
      <section className="page-heading compact-heading"><div><div className="eyebrow">AUTOMATIZACIÓN</div><h1>Secuencia maestra</h1><p>El agente adapta cada paso al contexto del prospecto.</p></div><button className="primary-button" onClick={onAddStep}>＋ Agregar paso</button></section>
      <section className="sequence-layout">
        <div className="sequence-canvas">
          <div className="start-node"><span>✦</span><div><strong>Entrada</strong><small>Prospecto con score mayor a 70</small></div></div>
          {steps.map((step, index) => <div className="sequence-wrap" key={step.id}>
            <div className="connector-line"><span>Día {step.day}</span></div>
            <article className={`sequence-card ${!step.enabled ? "disabled" : ""}`}>
              <div className={`channel-icon ${step.channel.toLowerCase()}`}>{step.channel === "Email" ? "M" : "in"}</div>
              <div className="sequence-copy"><span>{step.channel} · Paso {index + 1}</span><input aria-label={`Nombre del paso ${index + 1}`} value={step.title} onChange={(e) => onRenameStep(step.id, e.target.value)} /><small>{index === 0 ? "Investiga y reescribe antes de enviar" : "Se cancela si el prospecto responde"}</small></div>
              <button className={`toggle ${step.enabled ? "on" : ""}`} onClick={() => onToggleStep(step.id)} aria-label={step.enabled ? "Desactivar paso" : "Activar paso"}><i /></button>
              <button className="delete-step" onClick={() => onRemoveStep(step.id)} aria-label="Eliminar paso">×</button>
            </article>
          </div>)}
          <div className="connector-line end-line"><span>Fin</span></div>
        </div>
        <aside className="panel rules-panel"><span className="section-kicker">REGLAS DEL AGENTE</span><h2>Antes de cada envío</h2><div className="rule-list"><div><span>01</span><p><strong>Tomar un contacto</strong><small>Lee el perfil y la empresa</small></p></div><div><span>02</span><p><strong>Investigar señales</strong><small>Web, rol, industria y contexto</small></p></div><div><span>03</span><p><strong>Elegir plantilla</strong><small>Según etapa e intención</small></p></div><div><span>04</span><p><strong>Reescribir para esa persona</strong><small>Con tu tono y tus casos</small></p></div><div><span>05</span><p><strong>Enviar y clasificar</strong><small>Positiva, neutral o no interesado</small></p></div></div><div className="safety-box"><span>✓</span><p><strong>Protección de reputación activa</strong><small>Límite diario y pausas inteligentes.</small></p></div></aside>
      </section>
    </>
  );
}
