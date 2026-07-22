import assert from "node:assert/strict";
import test from "node:test";
import {
  appendStep,
  buildCampaign,
  buildProspect,
  campaignMetrics,
  filterProspects,
  personalize,
  removeStep,
  renameStep,
  simulateBatch,
  toggleCampaignStatus,
  toggleStep,
} from "../lib/logic.ts";

const baseCampaign = {
  id: 1, name: "Test", segment: "Seg", channel: "Email",
  status: "active", sent: 100, replies: 10, meetings: 2, total: 200, createdAt: "hoy",
};

test("creación de campaña desde el wizard", () => {
  const draft = { name: "", industry: "Construcción", location: "Buenos Aires", size: "5–30", channel: "Email", tone: "Directo", offer: "Diagnóstico" };
  const campaign = buildCampaign(draft, 99);
  assert.equal(campaign.id, 99);
  assert.equal(campaign.name, "Construcción — Buenos Aires");
  assert.equal(campaign.segment, "Construcción · Buenos Aires · 5–30 empleados");
  assert.equal(campaign.status, "active");
  assert.equal(campaign.sent, 0);

  const named = buildCampaign({ ...draft, name: "Mi campaña" }, 100);
  assert.equal(named.name, "Mi campaña");
});

test("pausa y reanudación de campañas", () => {
  const paused = toggleCampaignStatus([baseCampaign], 1);
  assert.equal(paused[0].status, "paused");
  const resumed = toggleCampaignStatus(paused, 1);
  assert.equal(resumed[0].status, "active");
  const untouched = toggleCampaignStatus([baseCampaign], 999);
  assert.equal(untouched[0].status, "active");
});

test("ejecución simulada de lote avanza sólo la primera campaña", () => {
  const second = { ...baseCampaign, id: 2, sent: 50 };
  const result = simulateBatch([baseCampaign, second]);
  assert.equal(result[0].sent, 124);
  assert.equal(result[0].replies, 13);
  assert.equal(result[0].meetings, 3);
  assert.equal(result[1].sent, 50);
});

test("la simulación no supera el total de la campaña", () => {
  const nearDone = { ...baseCampaign, sent: 195, total: 200 };
  const result = simulateBatch([nearDone]);
  assert.equal(result[0].sent, 200);
});

test("métricas agregadas de campañas", () => {
  const metrics = campaignMetrics([baseCampaign, { ...baseCampaign, id: 2, status: "paused", sent: 100, replies: 5 }]);
  assert.equal(metrics.totalSent, 200);
  assert.equal(metrics.totalReplies, 15);
  assert.equal(metrics.activeCampaigns, 1);
  assert.equal(metrics.replyRate, "7.5");
  assert.equal(campaignMetrics([]).replyRate, "0.0");
});

test("personalización de plantillas reemplaza variables", () => {
  const prospect = buildProspect({ id: 1, name: "Ana López", company: "Acme", industry: "Retail", email: "ana@acme.com" });
  const result = personalize("Hola {{name}} de {{company}} ({{industry}})", prospect);
  assert.equal(result, "Hola Ana de Acme (Retail)");
});

test("filtro de prospectos por búsqueda y estado", () => {
  const prospects = [
    buildProspect({ id: 1, name: "Ana", company: "Acme", email: "a@a.com", status: "Nuevo" }),
    buildProspect({ id: 2, name: "Beto", company: "Zeta", email: "b@b.com", status: "Contactado" }),
  ];
  assert.equal(filterProspects(prospects, "acme", "Todos").length, 1);
  assert.equal(filterProspects(prospects, "", "Contactado")[0].name, "Beto");
  assert.equal(filterProspects(prospects, "acme", "Contactado").length, 0);
});

test("edición de secuencia: alta, renombre, toggle y borrado", () => {
  const steps = [{ id: 1, day: 0, channel: "Email", title: "Primero", enabled: true }];
  const added = appendStep(steps, 2);
  assert.equal(added.length, 2);
  assert.equal(added[1].day, 3);
  const renamed = renameStep(added, 2, "Seguimiento corto");
  assert.equal(renamed[1].title, "Seguimiento corto");
  const toggled = toggleStep(renamed, 2);
  assert.equal(toggled[1].enabled, false);
  const removed = removeStep(toggled, 1);
  assert.equal(removed.length, 1);
  assert.equal(removed[0].id, 2);
});
