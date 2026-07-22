import type { Campaign, CampaignDraft, Prospect, SequenceStep } from "./types.ts";

export function initials(name: string) {
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("");
}

export function personalize(body: string, prospect: Prospect) {
  return body
    .replaceAll("{{company}}", prospect.company)
    .replaceAll("{{industry}}", prospect.industry)
    .replaceAll("{{name}}", prospect.name.split(" ")[0]);
}

export function campaignMetrics(campaigns: Campaign[]) {
  const totalSent = campaigns.reduce((acc, c) => acc + c.sent, 0);
  const totalReplies = campaigns.reduce((acc, c) => acc + c.replies, 0);
  const totalMeetings = campaigns.reduce((acc, c) => acc + c.meetings, 0);
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const replyRate = totalSent ? ((totalReplies / totalSent) * 100).toFixed(1) : "0.0";
  return { totalSent, totalReplies, totalMeetings, activeCampaigns, replyRate };
}

export function toggleCampaignStatus(campaigns: Campaign[], id: number): Campaign[] {
  return campaigns.map((campaign) => campaign.id === id
    ? { ...campaign, status: campaign.status === "active" ? "paused" : "active" }
    : campaign);
}

export function buildCampaign(draft: CampaignDraft, id: number): Campaign {
  return {
    id,
    name: draft.name || `${draft.industry} — ${draft.location}`,
    segment: `${draft.industry} · ${draft.location} · ${draft.size} empleados`,
    channel: draft.channel,
    status: "active",
    sent: 0,
    replies: 0,
    meetings: 0,
    total: 120,
    createdAt: "Ahora",
  };
}

export function simulateBatch(campaigns: Campaign[]): Campaign[] {
  return campaigns.map((campaign, index) => index === 0 ? {
    ...campaign,
    sent: Math.min(campaign.total, campaign.sent + 24),
    replies: campaign.replies + 3,
    meetings: campaign.meetings + 1,
  } : campaign);
}

export function buildProspect(fields: Partial<Prospect> & { id: number }): Prospect {
  return {
    name: "Nuevo contacto",
    role: "Decisor",
    company: "Empresa",
    industry: "Servicios",
    source: "Manual",
    status: "Nuevo",
    score: 70,
    email: "",
    ...fields,
  };
}

export function filterProspects(prospects: Prospect[], search: string, statusFilter: string) {
  return prospects.filter((p) => {
    const matchesSearch = `${p.name} ${p.company} ${p.role} ${p.industry}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "Todos" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });
}

export function appendStep(steps: SequenceStep[], id: number): SequenceStep[] {
  return [...steps, { id, day: (steps.at(-1)?.day ?? 0) + 3, channel: "Email", title: "Nuevo seguimiento", enabled: true }];
}

export function renameStep(steps: SequenceStep[], id: number, title: string): SequenceStep[] {
  return steps.map((step) => step.id === id ? { ...step, title } : step);
}

export function toggleStep(steps: SequenceStep[], id: number): SequenceStep[] {
  return steps.map((step) => step.id === id ? { ...step, enabled: !step.enabled } : step);
}

export function removeStep(steps: SequenceStep[], id: number): SequenceStep[] {
  return steps.filter((step) => step.id !== id);
}
