export type View = "pulse" | "prospects" | "campaigns" | "sequence" | "templates";

export type CampaignStatus = "active" | "paused";

export type Campaign = {
  id: number;
  name: string;
  segment: string;
  channel: string;
  status: CampaignStatus;
  sent: number;
  replies: number;
  meetings: number;
  total: number;
  createdAt: string;
};

export type ProspectStatus = "Nuevo" | "Investigado" | "Contactado" | "Respondió" | "Reunión";

export type Prospect = {
  id: number;
  name: string;
  role: string;
  company: string;
  industry: string;
  source: string;
  status: ProspectStatus;
  score: number;
  email: string;
};

export type SequenceStep = {
  id: number;
  day: number;
  channel: "Email" | "LinkedIn";
  title: string;
  enabled: boolean;
};

export type Template = {
  id: number;
  name: string;
  tag: string;
  reply: string;
  body: string;
};

export type CampaignDraft = {
  name: string;
  industry: string;
  location: string;
  size: string;
  channel: string;
  tone: string;
  offer: string;
};

export type PersistedState = {
  prospects: Prospect[];
  campaigns: Campaign[];
  steps: SequenceStep[];
};
