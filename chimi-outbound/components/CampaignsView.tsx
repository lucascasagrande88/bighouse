"use client";

import type { Campaign } from "../lib/types";

export type CampaignTab = "Todas" | "Activas" | "Pausadas";

type Props = {
  campaigns: Campaign[];
  tab: CampaignTab;
  onTab: (tab: CampaignTab) => void;
  onOpenWizard: () => void;
  onToggleCampaign: (id: number) => void;
};

export default function CampaignsView({ campaigns, tab, onTab, onOpenWizard, onToggleCampaign }: Props) {
  const shown = campaigns.filter((campaign) => tab === "Todas" || (tab === "Activas" && campaign.status === "active") || (tab === "Pausadas" && campaign.status === "paused"));
  return (
    <>
      <section className="page-heading compact-heading"><div><div className="eyebrow">OUTBOUND CONTROL</div><h1>Campañas</h1><p>Un objetivo, un segmento y una secuencia medible.</p></div><button className="primary-button" onClick={onOpenWizard}>＋ Nueva campaña</button></section>
      <div className="segmented-control">{(["Todas", "Activas", "Pausadas"] as const).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => onTab(item)}>{item} <span>{item === "Todas" ? campaigns.length : campaigns.filter((c) => c.status === (item === "Activas" ? "active" : "paused")).length}</span></button>)}</div>
      <section className="campaign-list">
        {shown.map((campaign) => {
          const progress = Math.round((campaign.sent / campaign.total) * 100);
          const rate = campaign.sent ? ((campaign.replies / campaign.sent) * 100).toFixed(1) : "0.0";
          return <article className="panel campaign-row-card" key={campaign.id}>
            <div className="campaign-identity"><span className={campaign.status === "active" ? "campaign-orb active" : "campaign-orb"}>↗</span><div><div className="campaign-title-line"><h2>{campaign.name}</h2><span className={campaign.status === "active" ? "status-pill status-green" : "status-pill status-neutral"}>{campaign.status === "active" ? "Activa" : "Pausada"}</span></div><p>{campaign.segment} · {campaign.channel}</p></div></div>
            <div className="campaign-kpis"><div><strong>{campaign.sent}</strong><span>Enviados</span></div><div><strong>{rate}%</strong><span>Respuestas</span></div><div><strong>{campaign.meetings}</strong><span>Reuniones</span></div></div>
            <div className="campaign-progress"><div><span style={{ width: `${progress}%` }} /></div><small>{progress}% procesado</small></div>
            <div className="campaign-actions"><button className="secondary-button" onClick={() => onToggleCampaign(campaign.id)}>{campaign.status === "active" ? "Pausar" : "Reanudar"}</button></div>
          </article>;
        })}
      </section>
    </>
  );
}
