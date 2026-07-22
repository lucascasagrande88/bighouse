"use client";

import type { Campaign, Prospect, View } from "../lib/types";
import { initials } from "../lib/logic";

type Props = {
  campaigns: Campaign[];
  metrics: { totalSent: number; totalReplies: number; totalMeetings: number; activeCampaigns: number; replyRate: string };
  selectedProspect: Prospect;
  message: string;
  onOpenWizard: () => void;
  onSimulate: () => void;
  onToggleCampaign: (id: number) => void;
  onNavigate: (view: View) => void;
  onCycleMessage: () => void;
  onExport: () => void;
};

export default function PulseView({ campaigns, metrics, selectedProspect, message, onOpenWizard, onSimulate, onToggleCampaign, onNavigate, onCycleMessage, onExport }: Props) {
  const { totalSent, totalReplies, totalMeetings, activeCampaigns, replyRate } = metrics;
  const leadCampaign = campaigns[0];
  const campaignProgress = leadCampaign ? Math.round((leadCampaign.sent / leadCampaign.total) * 100) : 0;
  return (
    <>
      <section className="page-heading hero-heading">
        <div>
          <div className="eyebrow"><span className="live-dot" /> Sistema operativo</div>
          <h1>Buenas, Lucas.<br /><span>Tu agente está vendiendo.</span></h1>
          <p>Investigá, personalizá y contactá prospectos sin perder la voz de Chimichurri.</p>
        </div>
        <button className="primary-button desktop-cta" onClick={onOpenWizard}><span>＋</span> Nueva campaña</button>
      </section>

      <section className="metric-grid" aria-label="Resumen de rendimiento">
        <article className="metric-card">
          <div className="metric-top"><span>Enviados</span><span className="metric-icon">↗</span></div>
          <strong>{totalSent.toLocaleString("es-AR")}</strong>
          <p><b>+18%</b> vs. período anterior</p>
          <div className="mini-bars">{[32, 48, 42, 58, 52, 75, 82, 68, 88, 94].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div>
        </article>
        <article className="metric-card orange-card">
          <div className="metric-top"><span>Tasa de respuesta</span><span className="metric-icon">↳</span></div>
          <strong>{replyRate}%</strong>
          <p><b>+4,2 pts</b> por personalización</p>
          <div className="rate-ring" style={{ "--rate": `${Math.min(100, Number(replyRate) * 4)}%` } as React.CSSProperties}><span>{totalReplies}</span><small>respuestas</small></div>
        </article>
        <article className="metric-card">
          <div className="metric-top"><span>Reuniones</span><span className="metric-icon">◫</span></div>
          <strong>{totalMeetings}</strong>
          <p><b>7 confirmadas</b> esta semana</p>
          <div className="avatar-row"><span>CM</span><span>MA</span><span>PI</span><span>+{Math.max(0, totalMeetings - 3)}</span></div>
        </article>
        <article className="metric-card dark-card">
          <div className="metric-top"><span>Campañas activas</span><span className="metric-icon">◉</span></div>
          <strong>{activeCampaigns}</strong>
          <p>Todo funcionando correctamente</p>
          <button onClick={onSimulate}>Simular siguiente lote <span>→</span></button>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="panel campaign-focus">
          <div className="panel-head">
            <div><span className="section-kicker">EN CURSO</span><h2>{leadCampaign?.name ?? "Sin campañas"}</h2></div>
            {leadCampaign && <button className="icon-button" onClick={() => onToggleCampaign(leadCampaign.id)} aria-label={leadCampaign.status === "active" ? "Pausar campaña" : "Reanudar campaña"}>{leadCampaign.status === "active" ? "Ⅱ" : "▶"}</button>}
          </div>
          {leadCampaign && <>
            <div className="progress-copy"><span>{leadCampaign.sent} de {leadCampaign.total} contactos procesados</span><strong>{campaignProgress}%</strong></div>
            <div className="progress-track"><span style={{ width: `${campaignProgress}%` }} /></div>
            <div className="campaign-stats">
              <div><strong>{leadCampaign.sent}</strong><span>Enviados</span></div>
              <div><strong>{leadCampaign.replies}</strong><span>Respondieron</span></div>
              <div><strong>{leadCampaign.meetings}</strong><span>Reuniones</span></div>
            </div>
            <button className="text-button" onClick={() => onNavigate("campaigns")}>Ver campaña completa <span>→</span></button>
          </>}
        </article>

        <article className="panel activity-panel">
          <div className="panel-head"><div><span className="section-kicker">AGENTE EN VIVO</span><h2>Actividad reciente</h2></div><span className="live-pill"><i /> LIVE</span></div>
          <div className="activity-list">
            <div><span className="activity-icon violet">⌕</span><p><strong>Investigó a R3 Desarrollos</strong><small>Encontró 4 señales de crecimiento</small></p><time>Ahora</time></div>
            <div><span className="activity-icon orange">✦</span><p><strong>Reescribió un mensaje</strong><small>Adaptado al tono del fundador</small></p><time>2m</time></div>
            <div><span className="activity-icon blue">↗</span><p><strong>Envió 24 contactos</strong><small>Secuencia «Constructoras»</small></p><time>8m</time></div>
            <div><span className="activity-icon green">✓</span><p><strong>Detectó una respuesta positiva</strong><small>Reunión sugerida para el viernes</small></p><time>12m</time></div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid lower-grid">
        <article className="panel funnel-panel">
          <div className="panel-head"><div><span className="section-kicker">ÚLTIMOS 30 DÍAS</span><h2>Funnel de conversión</h2></div><button className="subtle-button" onClick={onExport}>Exportar ↗</button></div>
          <div className="funnel-row">
            {[{ n: totalSent, l: "Enviados", w: 100 }, { n: totalReplies, l: "Respuestas", w: 68 }, { n: Math.max(totalMeetings * 2, 1), l: "Positivas", w: 45 }, { n: totalMeetings, l: "Reuniones", w: 29 }].map((stage, index) => <div key={stage.l} className="funnel-stage" style={{ "--w": `${stage.w}%` } as React.CSSProperties}><span>{index + 1}</span><strong>{stage.n}</strong><small>{stage.l}</small></div>)}
          </div>
        </article>
        <article className="panel ai-preview">
          <div className="panel-head"><div><span className="section-kicker">MENSAJE GENERADO</span><h2>Suena a vos, no a un bot.</h2></div><button className="icon-button" onClick={onCycleMessage} aria-label="Generar otro ángulo">↻</button></div>
          <div className="message-bubble"><span className="quote-mark">“</span><p>{message}</p></div>
          <div className="message-footer"><div className="mini-profile"><span>{initials(selectedProspect.name)}</span><p><strong>{selectedProspect.name}</strong><small>{selectedProspect.company}</small></p></div><button className="text-button" onClick={() => onNavigate("templates")}>Abrir laboratorio →</button></div>
        </article>
      </section>
    </>
  );
}
