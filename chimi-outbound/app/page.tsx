"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import type { Prospect, View } from "../lib/types";
import { defaultCampaignDraft, navItems, seedCampaigns, seedProspects, seedSteps, templates } from "../lib/data";
import { appendStep, buildCampaign, buildProspect, campaignMetrics, personalize, removeStep, renameStep, simulateBatch, toggleCampaignStatus, toggleStep } from "../lib/logic";
import { campaignsToCsv } from "../lib/csv";
import { loadState, saveState } from "../lib/storage";
import PulseView from "../components/PulseView";
import ProspectsView from "../components/ProspectsView";
import CampaignsView, { CampaignTab } from "../components/CampaignsView";
import SequenceView from "../components/SequenceView";
import TemplatesView from "../components/TemplatesView";
import CampaignWizard from "../components/CampaignWizard";
import AddProspectModal from "../components/AddProspectModal";
import ImportCsvModal from "../components/ImportCsvModal";

export default function Home() {
  const [view, setView] = useState<View>("pulse");
  const [prospects, setProspects] = useState(seedProspects);
  const [campaigns, setCampaigns] = useState(seedCampaigns);
  const [steps, setSteps] = useState(seedSteps);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos");
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newCampaign, setNewCampaign] = useState(defaultCampaignDraft);
  const [toast, setToast] = useState("");
  const [selectedProspect, setSelectedProspect] = useState(seedProspects[1]);
  const [templateId, setTemplateId] = useState(1);
  const [messageVersion, setMessageVersion] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [campaignTab, setCampaignTab] = useState<CampaignTab>("Todas");

  useEffect(() => {
    // Hidratación post-montaje: localStorage no existe en SSR y leerlo antes
    // provocaría un mismatch de hidratación.
    const saved = loadState();
    if (!saved) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved.prospects) setProspects(saved.prospects);
    if (saved.campaigns) setCampaigns(saved.campaigns);
    if (saved.steps) setSteps(saved.steps);
  }, []);

  useEffect(() => {
    saveState({ prospects, campaigns, steps });
  }, [prospects, campaigns, steps]);

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timeout);
  }, [toast]);

  const metrics = useMemo(() => campaignMetrics(campaigns), [campaigns]);
  const currentTemplate = templates.find((t) => t.id === templateId) ?? templates[0];
  const messageAngles = [
    personalize(currentTemplate.body, selectedProspect),
    `Hola ${selectedProspect.name.split(" ")[0]}, estuve mirando ${selectedProspect.company}. La propuesta se entiende, pero hoy hay fricción entre lo que hacen y cómo se percibe. Te grabé un análisis de 90 segundos con tres cambios concretos. ¿Te lo mando?`,
    `${selectedProspect.name.split(" ")[0]}, voy directo: en ${selectedProspect.company} hay una oportunidad clara de convertir mejor la atención que ya generan. Desde Chimichurri podemos resolverlo con un sistema de diseño, contenido y pauta medible. ¿Tiene sentido verlo esta semana?`,
  ];
  const message = messageAngles[messageVersion];

  function navigate(next: View) {
    setView(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function toggleCampaign(id: number) {
    setCampaigns((all) => toggleCampaignStatus(all, id));
    setToast("Estado de campaña actualizado");
  }

  function launchCampaign() {
    setCampaigns((all) => [buildCampaign(newCampaign, Date.now()), ...all]);
    setWizardOpen(false);
    setWizardStep(1);
    setView("campaigns");
    setToast("Campaña activada: 120 prospectos en cola");
  }

  function simulateRun() {
    setCampaigns((all) => simulateBatch(all));
    setToast("Simulación ejecutada: +24 envíos, +3 respuestas, +1 reunión");
  }

  function addProspect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const fullName = String(data.get("name") || "Nuevo contacto");
    const prospect = buildProspect({
      id: Date.now(),
      name: fullName,
      role: String(data.get("role") || "Decisor"),
      company: String(data.get("company") || "Empresa"),
      industry: String(data.get("industry") || "Servicios"),
      email: String(data.get("email") || ""),
    });
    setProspects((all) => [prospect, ...all]);
    setAddOpen(false);
    setToast(`${fullName} agregado a prospectos`);
  }

  function importProspects(imported: Prospect[]) {
    setProspects((all) => [...imported, ...all]);
    setImportOpen(false);
    setToast(`${imported.length} prospectos importados desde CSV`);
  }

  function cycleMessage() {
    setMessageVersion((v) => (v + 1) % messageAngles.length);
  }

  function exportCampaigns() {
    const blob = new Blob([campaignsToCsv(campaigns)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "chimi-campanas.csv";
    link.click();
    URL.revokeObjectURL(url);
    setToast("Campañas exportadas a CSV");
  }

  function renderContent() {
    if (view === "prospects") return <ProspectsView
      prospects={prospects}
      search={search}
      statusFilter={statusFilter}
      onSearch={setSearch}
      onStatusFilter={setStatusFilter}
      onAdd={() => setAddOpen(true)}
      onImport={() => setImportOpen(true)}
      onPersonalize={(p) => { setSelectedProspect(p); setView("templates"); }}
    />;
    if (view === "campaigns") return <CampaignsView
      campaigns={campaigns}
      tab={campaignTab}
      onTab={setCampaignTab}
      onOpenWizard={() => setWizardOpen(true)}
      onToggleCampaign={toggleCampaign}
    />;
    if (view === "sequence") return <SequenceView
      steps={steps}
      onAddStep={() => { setSteps((all) => appendStep(all, Date.now())); setToast("Paso agregado"); }}
      onRenameStep={(id, title) => setSteps((all) => renameStep(all, id, title))}
      onToggleStep={(id) => setSteps((all) => toggleStep(all, id))}
      onRemoveStep={(id) => setSteps((all) => removeStep(all, id))}
    />;
    if (view === "templates") return <TemplatesView
      templates={templates}
      currentTemplate={currentTemplate}
      prospects={prospects}
      selectedProspect={selectedProspect}
      message={message}
      onSelectTemplate={(id) => { setTemplateId(id); setMessageVersion(0); }}
      onSelectProspect={setSelectedProspect}
      onCopy={() => { navigator.clipboard?.writeText(message); setToast("Mensaje copiado"); }}
      onCycleMessage={cycleMessage}
    />;
    return <PulseView
      campaigns={campaigns}
      metrics={metrics}
      selectedProspect={selectedProspect}
      message={message}
      onOpenWizard={() => setWizardOpen(true)}
      onSimulate={simulateRun}
      onToggleCampaign={toggleCampaign}
      onNavigate={navigate}
      onCycleMessage={cycleMessage}
      onExport={exportCampaigns}
    />;
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => navigate("pulse")} aria-label="Ir al inicio"><span className="brand-mark">C</span><div><strong>CHIMI</strong><small>OUTBOUND</small></div><em>BETA</em></button>
        <nav aria-label="Navegación principal">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span>{item.label}{item.id === "campaigns" && metrics.activeCampaigns > 0 && <i>{metrics.activeCampaigns}</i>}</button>)}</nav>
        <div className="agent-status"><div className="agent-status-top"><span className="agent-orb">✦</span><p><strong>Agente activo</strong><small>Procesando contactos</small></p><i /></div><div className="agent-load"><span><i style={{ width: "68%" }} /></span><small>68% del lote diario</small></div></div>
        <div className="sidebar-user"><span>LC</span><p><strong>Lucas Casagrande</strong><small>Director Creativo</small></p></div>
      </aside>

      <div className="main-column">
        <header className="topbar"><button className="mobile-brand" onClick={() => navigate("pulse")}><span>C</span> CHIMI<small>OUTBOUND</small></button><div className="topbar-right"><span className="data-live"><i /> Datos actualizados</span></div></header>
        <div className="content">{renderContent()}</div>
      </div>

      <nav className="mobile-nav" aria-label="Navegación móvil">{navItems.slice(0, 4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}<button className={wizardOpen ? "active mobile-create" : "mobile-create"} onClick={() => setWizardOpen(true)}><span>＋</span><small>Crear</small></button></nav>

      {wizardOpen && <CampaignWizard
        step={wizardStep}
        draft={newCampaign}
        onDraft={setNewCampaign}
        onStep={setWizardStep}
        onClose={() => setWizardOpen(false)}
        onLaunch={launchCampaign}
      />}
      {addOpen && <AddProspectModal onClose={() => setAddOpen(false)} onSubmit={addProspect} />}
      {importOpen && <ImportCsvModal existing={prospects} onClose={() => setImportOpen(false)} onImport={importProspects} />}
      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </main>
  );
}
