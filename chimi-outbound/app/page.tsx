"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type View = "pulse" | "prospects" | "campaigns" | "sequence" | "templates";
type Campaign = {
  id: number;
  name: string;
  segment: string;
  channel: string;
  status: "active" | "paused";
  sent: number;
  replies: number;
  meetings: number;
  total: number;
  createdAt: string;
};
type Prospect = {
  id: number;
  name: string;
  role: string;
  company: string;
  industry: string;
  source: string;
  status: "Nuevo" | "Investigado" | "Contactado" | "Respondió" | "Reunión";
  score: number;
  email: string;
};
type SequenceStep = {
  id: number;
  day: number;
  channel: "Email" | "LinkedIn";
  title: string;
  enabled: boolean;
};

const seedProspects: Prospect[] = [
  { id: 1, name: "Carla Méndez", role: "Fundadora", company: "Norte Estudio", industry: "Arquitectura", source: "LinkedIn", status: "Reunión", score: 96, email: "carla@norteestudio.com" },
  { id: 2, name: "Martín Acosta", role: "Director comercial", company: "Hormigón Sur", industry: "Construcción", source: "Google Maps", status: "Respondió", score: 92, email: "martin@hormigonsur.com" },
  { id: 3, name: "Paula Ibarra", role: "Marketing Lead", company: "Flip Foods", industry: "Gastronomía", source: "LinkedIn", status: "Contactado", score: 89, email: "paula@flipfoods.com" },
  { id: 4, name: "Nicolás Reinoso", role: "Socio", company: "R3 Desarrollos", industry: "Real Estate", source: "Apollo", status: "Investigado", score: 86, email: "nicolas@r3desarrollos.com" },
  { id: 5, name: "Julieta Massi", role: "CEO", company: "Clínica Aura", industry: "Salud", source: "Referido", status: "Nuevo", score: 83, email: "julieta@clinicaaura.com" },
  { id: 6, name: "Tomás Vidal", role: "E-commerce Manager", company: "Casa Zeta", industry: "Retail", source: "Instagram", status: "Contactado", score: 81, email: "tomas@casazeta.com" },
  { id: 7, name: "Sofía Naón", role: "Co-fundadora", company: "Calma Lab", industry: "Wellness", source: "LinkedIn", status: "Investigado", score: 78, email: "sofia@calmalab.com" },
  { id: 8, name: "Diego Ferreyra", role: "Gerente general", company: "Punto Motor", industry: "Automotriz", source: "Google Maps", status: "Nuevo", score: 74, email: "diego@puntomotor.com" },
];

const seedCampaigns: Campaign[] = [
  { id: 1, name: "Comercios GBA Sur — Branding", segment: "Dueños de comercios · 5–30 empleados", channel: "Email + LinkedIn", status: "active", sent: 486, replies: 62, meetings: 14, total: 800, createdAt: "18 jul" },
  { id: 2, name: "Constructoras sin web", segment: "Construcción · Buenos Aires", channel: "Email", status: "paused", sent: 218, replies: 29, meetings: 7, total: 350, createdAt: "12 jul" },
];

const seedSteps: SequenceStep[] = [
  { id: 1, day: 0, channel: "Email", title: "Primer contacto personalizado", enabled: true },
  { id: 2, day: 2, channel: "LinkedIn", title: "Visita + conexión", enabled: true },
  { id: 3, day: 4, channel: "Email", title: "Caso relevante + quick win", enabled: true },
  { id: 4, day: 8, channel: "Email", title: "Cierre elegante", enabled: true },
];

const templates = [
  { id: 1, name: "Problema visible", tag: "Primer contacto", reply: "18,4%", body: "Vi que {{company}} está creciendo, pero su presencia digital todavía no refleja el nivel del negocio. Encontré dos mejoras concretas que podrían aumentar consultas sin cambiar toda la marca." },
  { id: 2, name: "Caso cercano", tag: "Social proof", reply: "15,9%", body: "Trabajamos con una empresa de {{industry}} que tenía un desafío parecido: mucho valor real, poca claridad al comunicarlo. Ordenamos el sistema y las consultas empezaron a llegar con mejor calidad." },
  { id: 3, name: "Último intento", tag: "Break-up", reply: "11,2%", body: "No quiero perseguirte ni llenar tu bandeja. Cierro por acá. Si mejorar cómo {{company}} se presenta y vende vuelve a ser prioridad, te comparto el diagnóstico que preparé." },
];

const navItems: { id: View; label: string; icon: string }[] = [
  { id: "pulse", label: "Pulse", icon: "◉" },
  { id: "prospects", label: "Prospectos", icon: "◎" },
  { id: "campaigns", label: "Campañas", icon: "↗" },
  { id: "sequence", label: "Secuencias", icon: "⌁" },
  { id: "templates", label: "Plantillas", icon: "▱" },
];

const statusClass: Record<Prospect["status"], string> = {
  Nuevo: "status-neutral",
  Investigado: "status-violet",
  Contactado: "status-blue",
  Respondió: "status-orange",
  Reunión: "status-green",
};

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
}

function personalize(body: string, prospect: Prospect) {
  return body
    .replaceAll("{{company}}", prospect.company)
    .replaceAll("{{industry}}", prospect.industry)
    .replaceAll("{{name}}", prospect.name.split(" ")[0]);
}

export default function Home() {
  const [view, setView] = useState<View>("pulse");
  const [prospects, setProspects] = useState<Prospect[]>(seedProspects);
  const [campaigns, setCampaigns] = useState<Campaign[]>(seedCampaigns);
  const [steps, setSteps] = useState<SequenceStep[]>(seedSteps);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState({ name: "", industry: "Construcción", location: "Buenos Aires", size: "5–30", channel: "Email + LinkedIn", tone: "Directo", offer: "Diagnóstico visual gratuito de 3 puntos" });
  const [toast, setToast] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(seedProspects[1]);
  const [templateId, setTemplateId] = useState(1);
  const [messageVersion, setMessageVersion] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [campaignTab, setCampaignTab] = useState<"Todas" | "Activas" | "Pausadas">("Todas");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("chimi-outbound-state");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.prospects) setProspects(parsed.prospects);
        if (parsed.campaigns) setCampaigns(parsed.campaigns);
        if (parsed.steps) setSteps(parsed.steps);
      }
    } catch { /* keep seeded demo */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("chimi-outbound-state", JSON.stringify({ prospects, campaigns, steps }));
  }, [prospects, campaigns, steps]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const filteredProspects = useMemo(() => prospects.filter((p) => {
    const matchesSearch = `${p.name} ${p.company} ${p.role} ${p.industry}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [prospects, search, statusFilter]);

  const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + c.replies, 0);
  const totalMeetings = campaigns.reduce((acc, c) => acc + c.meetings, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const replyRate = totalSent ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0";
  const currentTemplate = templates.find((t) => t.id === templateId) ?? templates[0];
  const messageAngles = [
    personalize(currentTemplate.body, selectedProspect),
    `Hola ${selectedProspect.name.split(" ")[0]}, estuve mirando ${selectedProspect.company}. La propuesta se entiende, pero hoy hay fricción entre lo que hacen y cómo se percibe. Te grabé un análisis de 90 segundos con tres cambios concretos. ¿Te lo mando?`,
    `${selectedProspect.name.split(" ")[0]}, voy directo: en ${selectedProspect.company} hay una oportunidad clara de convertir mejor la atención que ya generan. Desde Chimichurri podemos resolverlo con un sistema de diseño, contenido y pauta medible. ¿Tiene sentido verlo esta semana?`,
  ];

  function showToast(text: string) {
    setToast(text);
  }

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCampaign(id: number) {
    setCampaigns((all) => all.map((campaign) => campaign.id === id ? { ...campaign, status: campaign.status === "active" ? "paused" : "active" } : campaign));
    showToast("Estado de campaña actualizado");
  }

  function launchCampaign() {
    const campaign: Campaign = {
      id: Date.now(),
      name: newCampaign.name || `${newCampaign.industry} — ${newCampaign.location}`,
      segment: `${newCampaign.industry} · ${newCampaign.location} · ${newCampaign.size} empleados`,
      channel: newCampaign.channel,
      status: "active",
      sent: 0,
      replies: 0,
      meetings: 0,
      total: 120,
      createdAt: "Ahora",
    };
    setCampaigns((all) => [campaign, ...all]);
    setWizardOpen(false);
    setWizardStep(1);
    setView("campaigns");
    showToast("Campaña activada: 120 prospectos en cola");
  }

  function simulateRun() {
    setCampaigns((all) => all.map((campaign, index) => index === 0 ? {
      ...campaign,
      sent: Math.min(campaign.total, campaign.sent + 24),
      replies: campaign.replies + 3,
      meetings: campaign.meetings + 1,
    } : campaign));
    showToast("Simulación ejecutada: +24 envíos, +3 respuestas, +1 reunión");
  }

  function addProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("name") || "Nuevo contacto");
    const prospect: Prospect = {
      id: Date.now(),
      name: fullName,
      role: String(data.get("role") || "Decisor"),
      company: String(data.get("company") || "Empresa"),
      industry: String(data.get("industry") || "Servicios"),
      source: "Manual",
      status: "Nuevo",
      score: 70,
      email: String(data.get("email") || ""),
    };
    setProspects((all) => [prospect, ...all]);
    setAddOpen(false);
    showToast(`${fullName} agregado a prospectos`);
  }

  function renderPulse() {
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
          <button className="primary-button desktop-cta" onClick={() => setWizardOpen(true)}><span>＋</span> Nueva campaña</button>
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
            <button onClick={simulateRun}>Simular siguiente lote <span>→</span></button>
          </article>
        </section>

        <section className="dashboard-grid">
          <article className="panel campaign-focus">
            <div className="panel-head">
              <div><span className="section-kicker">EN CURSO</span><h2>{leadCampaign?.name ?? "Sin campañas"}</h2></div>
              {leadCampaign && <button className="icon-button" onClick={() => toggleCampaign(leadCampaign.id)} aria-label={leadCampaign.status === "active" ? "Pausar campaña" : "Reanudar campaña"}>{leadCampaign.status === "active" ? "Ⅱ" : "▶"}</button>}
            </div>
            {leadCampaign && <>
              <div className="progress-copy"><span>{leadCampaign.sent} de {leadCampaign.total} contactos procesados</span><strong>{campaignProgress}%</strong></div>
              <div className="progress-track"><span style={{ width: `${campaignProgress}%` }} /></div>
              <div className="campaign-stats">
                <div><strong>{leadCampaign.sent}</strong><span>Enviados</span></div>
                <div><strong>{leadCampaign.replies}</strong><span>Respondieron</span></div>
                <div><strong>{leadCampaign.meetings}</strong><span>Reuniones</span></div>
              </div>
              <button className="text-button" onClick={() => navigate("campaigns")}>Ver campaña completa <span>→</span></button>
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
            <div className="panel-head"><div><span className="section-kicker">ÚLTIMOS 30 DÍAS</span><h2>Funnel de conversión</h2></div><button className="subtle-button">Exportar ↗</button></div>
            <div className="funnel-row">
              {[{ n: totalSent, l: "Enviados", w: 100 }, { n: totalReplies, l: "Respuestas", w: 68 }, { n: Math.max(totalMeetings * 2, 1), l: "Positivas", w: 45 }, { n: totalMeetings, l: "Reuniones", w: 29 }].map((stage, index) => <div key={stage.l} className="funnel-stage" style={{ "--w": `${stage.w}%` } as React.CSSProperties}><span>{index + 1}</span><strong>{stage.n}</strong><small>{stage.l}</small></div>)}
            </div>
          </article>
          <article className="panel ai-preview">
            <div className="panel-head"><div><span className="section-kicker">MENSAJE GENERADO</span><h2>Suena a vos, no a un bot.</h2></div><button className="icon-button" onClick={() => setMessageVersion((v) => (v + 1) % messageAngles.length)}>↻</button></div>
            <div className="message-bubble"><span className="quote-mark">“</span><p>{messageAngles[messageVersion]}</p></div>
            <div className="message-footer"><div className="mini-profile"><span>{initials(selectedProspect.name)}</span><p><strong>{selectedProspect.name}</strong><small>{selectedProspect.company}</small></p></div><button className="text-button" onClick={() => navigate("templates")}>Abrir laboratorio →</button></div>
          </article>
        </section>
      </>
    );
  }

  function renderProspects() {
    return (
      <>
        <section className="page-heading compact-heading"><div><div className="eyebrow">BASE DE CONTACTOS</div><h1>Prospectos <span>{prospects.length}</span></h1><p>Priorizados por encaje, intención y señales de crecimiento.</p></div><button className="primary-button" onClick={() => setAddOpen(true)}>＋ Agregar contacto</button></section>
        <section className="panel table-panel">
          <div className="table-toolbar">
            <label className="search-box"><span>⌕</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar nombre, empresa o industria…" /></label>
            <div className="filter-chips">{["Todos", "Nuevo", "Investigado", "Contactado", "Respondió", "Reunión"].map((status) => <button key={status} className={statusFilter === status ? "active" : ""} onClick={() => setStatusFilter(status)}>{status}</button>)}</div>
          </div>
          <div className="prospect-table" role="table" aria-label="Prospectos">
            <div className="table-row table-header" role="row"><span>Persona</span><span>Empresa</span><span>Fuente</span><span>Score</span><span>Estado</span><span /></div>
            {filteredProspects.map((p) => <div className="table-row" role="row" key={p.id}>
              <div className="person-cell"><span className="person-avatar">{initials(p.name)}</span><p><strong>{p.name}</strong><small>{p.role}</small></p></div>
              <div><strong>{p.company}</strong><small>{p.industry}</small></div>
              <span>{p.source}</span>
              <div className="score-cell"><strong>{p.score}</strong><span><i style={{ width: `${p.score}%` }} /></span></div>
              <span className={`status-pill ${statusClass[p.status]}`}>{p.status}</span>
              <button className="row-action" onClick={() => { setSelectedProspect(p); setView("templates"); }}>Personalizar →</button>
            </div>)}
            {filteredProspects.length === 0 && <div className="empty-state"><span>⌕</span><h3>No encontramos prospectos</h3><p>Probá con otra búsqueda o quitá un filtro.</p></div>}
          </div>
        </section>
      </>
    );
  }

  function renderCampaigns() {
    const shown = campaigns.filter((campaign) => campaignTab === "Todas" || (campaignTab === "Activas" && campaign.status === "active") || (campaignTab === "Pausadas" && campaign.status === "paused"));
    return (
      <>
        <section className="page-heading compact-heading"><div><div className="eyebrow">OUTBOUND CONTROL</div><h1>Campañas</h1><p>Un objetivo, un segmento y una secuencia medible.</p></div><button className="primary-button" onClick={() => setWizardOpen(true)}>＋ Nueva campaña</button></section>
        <div className="segmented-control">{(["Todas", "Activas", "Pausadas"] as const).map((tab) => <button key={tab} className={campaignTab === tab ? "active" : ""} onClick={() => setCampaignTab(tab)}>{tab} <span>{tab === "Todas" ? campaigns.length : campaigns.filter((c) => c.status === (tab === "Activas" ? "active" : "paused")).length}</span></button>)}</div>
        <section className="campaign-list">
          {shown.map((campaign) => {
            const progress = Math.round((campaign.sent / campaign.total) * 100);
            const rate = campaign.sent ? ((campaign.replies / campaign.sent) * 100).toFixed(1) : "0.0";
            return <article className="panel campaign-row-card" key={campaign.id}>
              <div className="campaign-identity"><span className={campaign.status === "active" ? "campaign-orb active" : "campaign-orb"}>↗</span><div><div className="campaign-title-line"><h2>{campaign.name}</h2><span className={campaign.status === "active" ? "status-pill status-green" : "status-pill status-neutral"}>{campaign.status === "active" ? "Activa" : "Pausada"}</span></div><p>{campaign.segment} · {campaign.channel}</p></div></div>
              <div className="campaign-kpis"><div><strong>{campaign.sent}</strong><span>Enviados</span></div><div><strong>{rate}%</strong><span>Respuestas</span></div><div><strong>{campaign.meetings}</strong><span>Reuniones</span></div></div>
              <div className="campaign-progress"><div><span style={{ width: `${progress}%` }} /></div><small>{progress}% procesado</small></div>
              <div className="campaign-actions"><button className="secondary-button" onClick={() => toggleCampaign(campaign.id)}>{campaign.status === "active" ? "Pausar" : "Reanudar"}</button><button className="icon-button">•••</button></div>
            </article>;
          })}
        </section>
      </>
    );
  }

  function renderSequence() {
    return (
      <>
        <section className="page-heading compact-heading"><div><div className="eyebrow">AUTOMATIZACIÓN</div><h1>Secuencia maestra</h1><p>El agente adapta cada paso al contexto del prospecto.</p></div><button className="primary-button" onClick={() => { setSteps((all) => [...all, { id: Date.now(), day: (all.at(-1)?.day ?? 0) + 3, channel: "Email", title: "Nuevo seguimiento", enabled: true }]); showToast("Paso agregado"); }}>＋ Agregar paso</button></section>
        <section className="sequence-layout">
          <div className="sequence-canvas">
            <div className="start-node"><span>✦</span><div><strong>Entrada</strong><small>Prospecto con score mayor a 70</small></div></div>
            {steps.map((step, index) => <div className="sequence-wrap" key={step.id}>
              <div className="connector-line"><span>Día {step.day}</span></div>
              <article className={`sequence-card ${!step.enabled ? "disabled" : ""}`}>
                <div className={`channel-icon ${step.channel.toLowerCase()}`}>{step.channel === "Email" ? "M" : "in"}</div>
                <div className="sequence-copy"><span>{step.channel} · Paso {index + 1}</span><input aria-label={`Nombre del paso ${index + 1}`} value={step.title} onChange={(e) => setSteps((all) => all.map((item) => item.id === step.id ? { ...item, title: e.target.value } : item))} /><small>{index === 0 ? "Investiga y reescribe antes de enviar" : "Se cancela si el prospecto responde"}</small></div>
                <button className={`toggle ${step.enabled ? "on" : ""}`} onClick={() => setSteps((all) => all.map((item) => item.id === step.id ? { ...item, enabled: !item.enabled } : item))} aria-label={step.enabled ? "Desactivar paso" : "Activar paso"}><i /></button>
                <button className="delete-step" onClick={() => setSteps((all) => all.filter((item) => item.id !== step.id))} aria-label="Eliminar paso">×</button>
              </article>
            </div>)}
            <div className="connector-line end-line"><span>Fin</span></div>
          </div>
          <aside className="panel rules-panel"><span className="section-kicker">REGLAS DEL AGENTE</span><h2>Antes de cada envío</h2><div className="rule-list"><div><span>01</span><p><strong>Tomar un contacto</strong><small>Lee el perfil y la empresa</small></p></div><div><span>02</span><p><strong>Investigar señales</strong><small>Web, rol, industria y contexto</small></p></div><div><span>03</span><p><strong>Elegir plantilla</strong><small>Según etapa e intención</small></p></div><div><span>04</span><p><strong>Reescribir para esa persona</strong><small>Con tu tono y tus casos</small></p></div><div><span>05</span><p><strong>Enviar y clasificar</strong><small>Positiva, neutral o no interesado</small></p></div></div><div className="safety-box"><span>✓</span><p><strong>Protección de reputación activa</strong><small>Límite diario y pausas inteligentes.</small></p></div></aside>
        </section>
      </>
    );
  }

  function renderTemplates() {
    return (
      <>
        <section className="page-heading compact-heading"><div><div className="eyebrow">LABORATORIO DE MENSAJES</div><h1>Plantillas que no parecen plantillas.</h1><p>La estrategia es tuya. El agente la adapta a cada persona.</p></div><button className="primary-button" onClick={() => { navigator.clipboard?.writeText(messageAngles[messageVersion]); showToast("Mensaje copiado"); }}>Copiar mensaje</button></section>
        <section className="template-layout">
          <aside className="template-list">
            {templates.map((template) => <button key={template.id} onClick={() => { setTemplateId(template.id); setMessageVersion(0); }} className={templateId === template.id ? "template-option active" : "template-option"}><span className="template-number">0{template.id}</span><div><strong>{template.name}</strong><small>{template.tag}</small></div><em>{template.reply}</em></button>)}
          </aside>
          <article className="panel composer-panel">
            <div className="composer-toolbar"><div><span className="section-kicker">VISTA PREVIA PERSONALIZADA</span><h2>{currentTemplate.name}</h2></div><select value={selectedProspect.id} onChange={(e) => { const next = prospects.find((p) => p.id === Number(e.target.value)); if (next) setSelectedProspect(next); }} aria-label="Elegir prospecto">{prospects.map((p) => <option value={p.id} key={p.id}>{p.name} · {p.company}</option>)}</select></div>
            <div className="email-shell">
              <div className="email-meta"><span className="person-avatar orange-avatar">LC</span><div><strong>Lucas de Chimichurri</strong><small>Para: {selectedProspect.name} &lt;{selectedProspect.email}&gt;</small></div><span className="ai-chip">✦ PERSONALIZADO</span></div>
              <div className="email-subject"><span>Asunto</span><strong>Una idea concreta para {selectedProspect.company}</strong></div>
              <div className="email-body"><p>Hola {selectedProspect.name.split(" ")[0]},</p><p>{messageAngles[messageVersion]}</p><p>Si te sirve, te muestro los tres puntos en una llamada de 15 minutos.</p><p>Lucas<br /><strong>Chimichurri — Diseño que vende</strong></p></div>
            </div>
            <div className="composer-actions"><div><span className="quality-dot" /><p><strong>96% alineado a tu voz</strong><small>Directo · Específico · Sin frases genéricas</small></p></div><button className="secondary-button" onClick={() => setMessageVersion((v) => (v + 1) % messageAngles.length)}>↻ Generar otro ángulo</button></div>
          </article>
        </section>
      </>
    );
  }

  function renderContent() {
    if (view === "prospects") return renderProspects();
    if (view === "campaigns") return renderCampaigns();
    if (view === "sequence") return renderSequence();
    if (view === "templates") return renderTemplates();
    return renderPulse();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("pulse")} aria-label="Ir al inicio"><span className="brand-mark">C</span><div><strong>CHIMI</strong><small>OUTBOUND</small></div><em>BETA</em></button>
        <nav aria-label="Navegación principal">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}{item.id === "campaigns" && activeCampaigns > 0 && <i>{activeCampaigns}</i>}</button>)}</nav>
        <div className="agent-status"><div className="agent-status-top"><span className="agent-orb">✦</span><p><strong>Agente activo</strong><small>Procesando contactos</small></p><i /></div><div className="agent-load"><span><i style={{ width: "68%" }} /></span><small>68% del lote diario</small></div></div>
        <div className="sidebar-user"><span>LC</span><p><strong>Lucas Casagrande</strong><small>Director Creativo</small></p><button>•••</button></div>
      </aside>

      <div className="main-column">
        <header className="topbar"><button className="mobile-brand" onClick={() => navigate("pulse")}><span>C</span> CHIMI<small>OUTBOUND</small></button><div className="topbar-right"><span className="data-live"><i /> Datos actualizados</span><button className="top-icon" aria-label="Ayuda">?</button><button className="top-icon notification" aria-label="Notificaciones">♧<i /></button></div></header>
        <div className="content">{renderContent()}</div>
      </div>

      <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}<button className={wizardOpen ? "active mobile-create" : "mobile-create"} onClick={() => setWizardOpen(true)}><span>＋</span><small>Crear</small></button></nav>

      {wizardOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="campaign-wizard-title">
        <section className="wizard-modal">
          <div className="wizard-header"><div><span className="section-kicker">NUEVA CAMPAÑA</span><h2 id="campaign-wizard-title">Armemos una máquina de reuniones.</h2></div><button onClick={() => setWizardOpen(false)} aria-label="Cerrar">×</button></div>
          <div className="wizard-progress">{[1, 2, 3, 4].map((step) => <div key={step} className={wizardStep >= step ? "active" : ""}><span>{wizardStep > step ? "✓" : step}</span><small>{["Segmento", "Canales", "Mensaje", "Revisión"][step - 1]}</small></div>)}</div>
          <div className="wizard-body">
            {wizardStep === 1 && <div className="wizard-section"><h3>¿A quién queremos llegar?</h3><p>Definí un segmento específico. El agente prioriza los mejores prospectos.</p><label>Nombre de campaña<input autoFocus value={newCampaign.name} onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })} placeholder="Ej. Constructoras sin web" /></label><div className="form-grid"><label>Industria<select value={newCampaign.industry} onChange={(e) => setNewCampaign({ ...newCampaign, industry: e.target.value })}>{["Construcción", "Gastronomía", "Retail", "Salud", "Real Estate", "Servicios profesionales"].map((item) => <option key={item}>{item}</option>)}</select></label><label>Ubicación<select value={newCampaign.location} onChange={(e) => setNewCampaign({ ...newCampaign, location: e.target.value })}><option>Buenos Aires</option><option>GBA Sur</option><option>Argentina</option><option>Madrid</option></select></label><label>Tamaño<select value={newCampaign.size} onChange={(e) => setNewCampaign({ ...newCampaign, size: e.target.value })}><option>1–5</option><option>5–30</option><option>30–100</option><option>100+</option></select></label></div><div className="estimated-box"><span>◎</span><p><strong>≈ 120 prospectos compatibles</strong><small>88 con score superior a 75</small></p></div></div>}
            {wizardStep === 2 && <div className="wizard-section"><h3>Elegí los canales</h3><p>Combinarlos mejora la tasa de respuesta sin aumentar la presión.</p><div className="channel-options">{[{ name: "Email", desc: "4 toques · 12 días", icon: "M" }, { name: "Email + LinkedIn", desc: "4 emails + 1 conexión", icon: "in" }].map((item) => <button key={item.name} className={newCampaign.channel === item.name ? "active" : ""} onClick={() => setNewCampaign({ ...newCampaign, channel: item.name })}><span>{item.icon}</span><p><strong>{item.name}</strong><small>{item.desc}</small></p><i>{newCampaign.channel === item.name ? "✓" : ""}</i></button>)}</div><div className="safety-box wide"><span>✓</span><p><strong>Envío seguro</strong><small>Máximo 40 contactos por día, con horarios y pausas naturales.</small></p></div></div>}
            {wizardStep === 3 && <div className="wizard-section"><h3>Dale una estrategia al agente</h3><p>La IA personaliza; la propuesta de valor sigue siendo tuya.</p><label>Oferta o próxima acción<textarea value={newCampaign.offer} onChange={(e) => setNewCampaign({ ...newCampaign, offer: e.target.value })} rows={3} /></label><label>Tono<div className="choice-row">{["Directo", "Cálido", "Audaz"].map((tone) => <button key={tone} className={newCampaign.tone === tone ? "active" : ""} onClick={() => setNewCampaign({ ...newCampaign, tone })}>{tone}</button>)}</div></label><div className="generated-preview"><span>✦</span><p>“Vi que tu empresa está creciendo, pero hay una brecha entre el valor real del negocio y cómo se percibe online. Preparé un {newCampaign.offer.toLowerCase()}. ¿Te lo mando?”</p></div></div>}
            {wizardStep === 4 && <div className="wizard-section review-section"><div className="launch-orb">↗</div><h3>{newCampaign.name || `${newCampaign.industry} — ${newCampaign.location}`}</h3><p>Lista para activar.</p><div className="review-grid"><div><span>Segmento</span><strong>{newCampaign.industry}<br />{newCampaign.location}</strong></div><div><span>Alcance</span><strong>120 prospectos<br />{newCampaign.size} empleados</strong></div><div><span>Secuencia</span><strong>{newCampaign.channel}<br />12 días</strong></div><div><span>Voz</span><strong>{newCampaign.tone}<br />Personalizada</strong></div></div><div className="launch-note"><span>◷</span><p><strong>Primer lote: hoy, 10:30</strong><small>24 contactos revisados antes del envío.</small></p></div></div>}
          </div>
          <div className="wizard-footer"><button className="secondary-button" onClick={() => wizardStep === 1 ? setWizardOpen(false) : setWizardStep((s) => s - 1)}>{wizardStep === 1 ? "Cancelar" : "← Atrás"}</button><button className="primary-button" onClick={() => wizardStep === 4 ? launchCampaign() : setWizardStep((s) => s + 1)}>{wizardStep === 4 ? "Activar campaña ↗" : "Continuar →"}</button></div>
        </section>
      </div>}

      {addOpen && <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="add-prospect-title"><form className="small-modal" onSubmit={addProspect}><div className="wizard-header"><div><span className="section-kicker">NUEVO PROSPECTO</span><h2 id="add-prospect-title">Agregar contacto</h2></div><button type="button" onClick={() => setAddOpen(false)}>×</button></div><div className="small-modal-body"><label>Nombre y apellido<input name="name" required autoFocus placeholder="Carla Méndez" /></label><div className="form-grid"><label>Empresa<input name="company" required placeholder="Empresa" /></label><label>Cargo<input name="role" placeholder="Fundador/a" /></label><label>Industria<input name="industry" placeholder="Construcción" /></label><label>Email<input name="email" required type="email" placeholder="contacto@empresa.com" /></label></div></div><div className="wizard-footer"><button type="button" className="secondary-button" onClick={() => setAddOpen(false)}>Cancelar</button><button className="primary-button" type="submit">Guardar prospecto</button></div></form></div>}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
