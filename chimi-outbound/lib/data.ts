import type { Campaign, Prospect, ProspectStatus, SequenceStep, Template, View } from "./types.ts";

export const seedProspects: Prospect[] = [
  { id: 1, name: "Carla Méndez", role: "Fundadora", company: "Norte Estudio", industry: "Arquitectura", source: "LinkedIn", status: "Reunión", score: 96, email: "carla@norteestudio.com" },
  { id: 2, name: "Martín Acosta", role: "Director comercial", company: "Hormigón Sur", industry: "Construcción", source: "Google Maps", status: "Respondió", score: 92, email: "martin@hormigonsur.com" },
  { id: 3, name: "Paula Ibarra", role: "Marketing Lead", company: "Flip Foods", industry: "Gastronomía", source: "LinkedIn", status: "Contactado", score: 89, email: "paula@flipfoods.com" },
  { id: 4, name: "Nicolás Reinoso", role: "Socio", company: "R3 Desarrollos", industry: "Real Estate", source: "Apollo", status: "Investigado", score: 86, email: "nicolas@r3desarrollos.com" },
  { id: 5, name: "Julieta Massi", role: "CEO", company: "Clínica Aura", industry: "Salud", source: "Referido", status: "Nuevo", score: 83, email: "julieta@clinicaaura.com" },
  { id: 6, name: "Tomás Vidal", role: "E-commerce Manager", company: "Casa Zeta", industry: "Retail", source: "Instagram", status: "Contactado", score: 81, email: "tomas@casazeta.com" },
  { id: 7, name: "Sofía Naón", role: "Co-fundadora", company: "Calma Lab", industry: "Wellness", source: "LinkedIn", status: "Investigado", score: 78, email: "sofia@calmalab.com" },
  { id: 8, name: "Diego Ferreyra", role: "Gerente general", company: "Punto Motor", industry: "Automotriz", source: "Google Maps", status: "Nuevo", score: 74, email: "diego@puntomotor.com" },
];

export const seedCampaigns: Campaign[] = [
  { id: 1, name: "Comercios GBA Sur — Branding", segment: "Dueños de comercios · 5–30 empleados", channel: "Email + LinkedIn", status: "active", sent: 486, replies: 62, meetings: 14, total: 800, createdAt: "18 jul" },
  { id: 2, name: "Constructoras sin web", segment: "Construcción · Buenos Aires", channel: "Email", status: "paused", sent: 218, replies: 29, meetings: 7, total: 350, createdAt: "12 jul" },
];

export const seedSteps: SequenceStep[] = [
  { id: 1, day: 0, channel: "Email", title: "Primer contacto personalizado", enabled: true },
  { id: 2, day: 2, channel: "LinkedIn", title: "Visita + conexión", enabled: true },
  { id: 3, day: 4, channel: "Email", title: "Caso relevante + quick win", enabled: true },
  { id: 4, day: 8, channel: "Email", title: "Cierre elegante", enabled: true },
];

export const templates: Template[] = [
  { id: 1, name: "Problema visible", tag: "Primer contacto", reply: "18,4%", body: "Vi que {{company}} está creciendo, pero su presencia digital todavía no refleja el nivel del negocio. Encontré dos mejoras concretas que podrían aumentar consultas sin cambiar toda la marca." },
  { id: 2, name: "Caso cercano", tag: "Social proof", reply: "15,9%", body: "Trabajamos con una empresa de {{industry}} que tenía un desafío parecido: mucho valor real, poca claridad al comunicarlo. Ordenamos el sistema y las consultas empezaron a llegar con mejor calidad." },
  { id: 3, name: "Último intento", tag: "Break-up", reply: "11,2%", body: "No quiero perseguirte ni llenar tu bandeja. Cierro por acá. Si mejorar cómo {{company}} se presenta y vende vuelve a ser prioridad, te comparto el diagnóstico que preparé." },
];

export const navItems: { id: View; label: string; icon: string }[] = [
  { id: "pulse", label: "Pulse", icon: "◉" },
  { id: "prospects", label: "Prospectos", icon: "◎" },
  { id: "campaigns", label: "Campañas", icon: "↗" },
  { id: "sequence", label: "Secuencias", icon: "⌁" },
  { id: "templates", label: "Plantillas", icon: "▱" },
];

export const statusClass: Record<ProspectStatus, string> = {
  Nuevo: "status-neutral",
  Investigado: "status-violet",
  Contactado: "status-blue",
  Respondió: "status-orange",
  Reunión: "status-green",
};

export const defaultCampaignDraft = {
  name: "",
  industry: "Construcción",
  location: "Buenos Aires",
  size: "5–30",
  channel: "Email + LinkedIn",
  tone: "Directo",
  offer: "Diagnóstico visual gratuito de 3 puntos",
};
