// Données de démo : l'app tourne sans Supabase configuré (mode vitrine).
// Remplacées automatiquement par les vraies données dès que les env vars sont posées.

import type { CallerProfile, LadderEntry, Mission, Season } from "./types";
import { tierForPoints } from "./ranking";

export const mockSeason: Season = {
  id: "season-1",
  number: 1,
  name: "Saison 1 — Premier Sang",
  startsAt: "2026-06-01T00:00:00Z",
  endsAt: "2026-07-13T00:00:00Z",
  isActive: true,
};

const callers: Array<
  Omit<CallerProfile, "badges"> & {
    points: number;
    meetings: number;
    noShows: number;
    bestStreak: number;
    badgeSlugs: string[];
  }
> = [
  { id: "c1", username: "sashaclose", fullName: "Sasha M.", avatarUrl: null, headline: "SaaS B2B • 7 ans d'outbound", bio: "Ex-SDR manager. Je booke, je ne raconte pas.", lifetimePoints: 3120, lifetimeMeetingsValidated: 27, points: 3120, meetings: 27, noShows: 1, bestStreak: 9, badgeSlugs: ["first-blood", "streak-5", "top-week"] },
  { id: "c2", username: "karim_dial", fullName: "Karim B.", avatarUrl: null, headline: "Fintech & assurance", bio: null, lifetimePoints: 2870, lifetimeMeetingsValidated: 25, points: 2870, meetings: 25, noShows: 0, bestStreak: 11, badgeSlugs: ["streak-10", "zero-noshow"] },
  { id: "c3", username: "lea.outbound", fullName: "Léa R.", avatarUrl: null, headline: "Recrutement & RH tech", bio: null, lifetimePoints: 2640, lifetimeMeetingsValidated: 24, points: 2640, meetings: 24, noShows: 2, bestStreak: 7, badgeSlugs: ["first-blood"] },
  { id: "c4", username: "tomdialer", fullName: "Tom V.", avatarUrl: null, headline: "Agences & SMMA", bio: null, lifetimePoints: 2210, lifetimeMeetingsValidated: 20, points: 2210, meetings: 20, noShows: 1, bestStreak: 6, badgeSlugs: [] },
  { id: "c5", username: "ninacalls", fullName: "Nina K.", avatarUrl: null, headline: "Logistique / industrie", bio: null, lifetimePoints: 1980, lifetimeMeetingsValidated: 18, points: 1980, meetings: 18, noShows: 0, bestStreak: 8, badgeSlugs: ["zero-noshow"] },
  { id: "c6", username: "maxgrind", fullName: "Max D.", avatarUrl: null, headline: "Rookie — saison 1", bio: null, lifetimePoints: 1640, lifetimeMeetingsValidated: 15, points: 1640, meetings: 15, noShows: 3, bestStreak: 4, badgeSlugs: ["rookie-spotlight"] },
  { id: "c7", username: "jbsetter", fullName: "JB L.", avatarUrl: null, headline: "Cybersécurité", bio: null, lifetimePoints: 1310, lifetimeMeetingsValidated: 12, points: 1310, meetings: 12, noShows: 1, bestStreak: 5, badgeSlugs: [] },
  { id: "c8", username: "saracold", fullName: "Sara T.", avatarUrl: null, headline: "Immobilier pro", bio: null, lifetimePoints: 920, lifetimeMeetingsValidated: 9, points: 920, meetings: 9, noShows: 0, bestStreak: 4, badgeSlugs: [] },
  { id: "c9", username: "drisspipe", fullName: "Driss A.", avatarUrl: null, headline: "Énergie & green tech", bio: null, lifetimePoints: 610, lifetimeMeetingsValidated: 6, points: 610, meetings: 6, noShows: 2, bestStreak: 3, badgeSlugs: [] },
  { id: "c10", username: "chloe_sdr", fullName: "Chloé P.", avatarUrl: null, headline: "Rookie — saison 1", bio: null, lifetimePoints: 340, lifetimeMeetingsValidated: 3, points: 340, meetings: 3, noShows: 0, bestStreak: 3, badgeSlugs: [] },
];

const badgeCatalog = {
  "first-blood": { slug: "first-blood", label: "First Blood", description: "Premier RDV validé de la saison", icon: "🩸" },
  "streak-5": { slug: "streak-5", label: "Série de 5", description: "5 RDV validés d'affilée", icon: "🔥" },
  "streak-10": { slug: "streak-10", label: "Série de 10", description: "10 RDV validés d'affilée", icon: "⚡" },
  "zero-noshow": { slug: "zero-noshow", label: "Zéro no-show", description: "Aucun no-show sur la saison", icon: "🛡️" },
  "top-week": { slug: "top-week", label: "Top semaine", description: "Meilleur score hebdo", icon: "👑" },
  "rookie-spotlight": { slug: "rookie-spotlight", label: "Rookie Spotlight", description: "Meilleur débutant du mois", icon: "🌟" },
} as const;

export const mockLadder: LadderEntry[] = callers
  .sort((a, b) => b.points - a.points)
  .map((c, i) => ({
    rank: i + 1,
    caller: {
      id: c.id,
      username: c.username,
      fullName: c.fullName,
      avatarUrl: c.avatarUrl,
      headline: c.headline,
      bio: c.bio,
      lifetimePoints: c.lifetimePoints,
      lifetimeMeetingsValidated: c.lifetimeMeetingsValidated,
      badges: c.badgeSlugs.map((s) => badgeCatalog[s as keyof typeof badgeCatalog]),
    },
    points: c.points,
    meetingsValidated: c.meetings,
    noShows: c.noShows,
    bestStreak: c.bestStreak,
    tier: tierForPoints(c.points, i + 1),
  }));

export const mockMissions: Mission[] = [
  {
    id: "m1",
    companyName: "Nexa CRM",
    title: "RDV démo pour CRM SaaS — cible DAF de PME",
    description:
      "SaaS de gestion de la relation client, ticket moyen 8k€/an. Cible : DAF et DG de PME 20-200 salariés, France. Script et liste fournis, calendrier Calendly branché.",
    sector: "SaaS B2B",
    status: "active",
    pricePerMeetingCents: 15000,
    meetingsTarget: 20,
    meetingsValidated: 13,
    budgetCents: 300000,
    isBounty: false,
    bountyDeadline: null,
    minTier: "argent",
    createdAt: "2026-06-02T09:00:00Z",
  },
  {
    id: "m2",
    companyName: "Hexalift",
    title: "⚡ BOUNTY — 10 RDV qualifiés secteur logistique avant dimanche",
    description:
      "Solution de monte-charge connecté. Cible : directeurs d'exploitation, entrepôts > 5000 m². Prime majorée, fenêtre courte.",
    sector: "Industrie / Logistique",
    status: "active",
    pricePerMeetingCents: 25000,
    meetingsTarget: 10,
    meetingsValidated: 4,
    budgetCents: 250000,
    isBounty: true,
    bountyDeadline: "2026-06-14T22:00:00Z",
    minTier: "or",
    createdAt: "2026-06-09T14:00:00Z",
  },
  {
    id: "m3",
    companyName: "Talvio",
    title: "Prospection cabinets comptables — outil de pré-compta IA",
    description:
      "Cible : experts-comptables et responsables de pôle, cabinets 5-50 collaborateurs. Démo de 30 min. Bonne récurrence possible pour le caller retenu.",
    sector: "Fintech",
    status: "funded",
    pricePerMeetingCents: 12000,
    meetingsTarget: 15,
    meetingsValidated: 0,
    budgetCents: 180000,
    isBounty: false,
    bountyDeadline: null,
    minTier: null,
    createdAt: "2026-06-10T11:00:00Z",
  },
  {
    id: "m4",
    companyName: "Studio Karma",
    title: "RDV pour agence SMMA — e-commerçants > 50k€/mois",
    description:
      "Agence d'acquisition pour e-commerce. Cible : fondateurs de marques DTC. Pitch fourni, preuve sociale solide (cas clients).",
    sector: "Agence / SMMA",
    status: "active",
    pricePerMeetingCents: 9000,
    meetingsTarget: 25,
    meetingsValidated: 8,
    budgetCents: 225000,
    isBounty: false,
    bountyDeadline: null,
    minTier: null,
    createdAt: "2026-06-05T16:30:00Z",
  },
];

export function mockCallerByUsername(username: string) {
  return mockLadder.find((e) => e.caller.username === username) ?? null;
}
