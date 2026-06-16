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
  Omit<CallerProfile, "badges" | "pitchVideoUrl"> & {
    points: number;
    meetings: number;
    noShows: number;
    bestStreak: number;
    badgeSlugs: string[];
    pitchVideoUrl?: string | null;
  }
> = [
  { id: "c1", username: "sashaclose", fullName: "Sasha M.", avatarUrl: null, headline: "SaaS B2B • 7 ans d'outbound", bio: "Ex-SDR manager. Je booke, je ne raconte pas.", lifetimePoints: 3120, lifetimeMeetingsValidated: 27, points: 3120, meetings: 27, noShows: 1, bestStreak: 9, badgeSlugs: ["first-blood", "streak-5", "top-week"], pitchVideoUrl: "https://www.tiktok.com/@sashaclose/video/7300000000000000000" },
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
      pitchVideoUrl: c.pitchVideoUrl ?? null,
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
      "Nexa CRM est un SaaS de gestion de la relation client pensé pour les PME françaises. Ticket moyen 8 000 €/an, engagement annuel, intégrations natives avec Sellsy et Pennylane. Le budget est séquestré — tu es payé dès validation de l'entreprise, pas avant.",
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
    targetPersona:
      "DAF, DG ou directeur commercial de PME — secteur industrie, négoce ou services B2B. Entreprise entre 20 et 200 salariés, France métropolitaine. Priorité aux boîtes qui utilisent encore Excel ou un vieux CRM (Salesforce à 3 licences compte).",
    meetingType: "Démo produit de 30 min sur Google Meet avec un account executive Nexa — lien Calendly fourni après acceptation de ta candidature.",
    pitchNotes:
      "Accroche qui marche : \"Vous gérez vos clients sur quoi en ce moment ?\" — si la réponse mentionne Excel, un tableau partagé ou un outil qu'ils n'aiment pas, tu tiens le fil. Objection fréquente : \"On a déjà Salesforce.\" Réponse : \"On s'intègre dessus, mais pour les PME qui n'ont pas d'admin Salesforce à plein temps, on divise le coût par 4.\" Ne promets pas de tarif — dirige vers la démo.",
  },
  {
    id: "m2",
    companyName: "Hexalift",
    title: "10 RDV qualifiés secteur logistique avant dimanche",
    description:
      "Hexalift fabrique des monte-charges connectés pour entrepôts. Leur solution réduit de 40 % les accidents de manutention et s'intègre dans les WMS existants. Fenêtre courte, prime majorée : c'est le moment d'attaquer fort.",
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
    targetPersona:
      "Directeur d'exploitation ou responsable logistique d'un entrepôt > 5 000 m². Secteurs ciblés : e-commerce, distribution alimentaire, pièces auto. Évite les entrepôts frigorifiques (contrainte technique). Zone : France + Benelux.",
    meetingType: "Appel découverte de 20 min avec le directeur commercial Hexalift — qualification budget + planning travaux.",
    pitchNotes:
      "Angle sécurité en premier : \"La CNAM renforce les contrôles manutention en 2026 — vous êtes à jour sur vos équipements ?\". Si oui, angle productivité : \"On a un benchmark secteur qui montre un gain moyen de 12 min par rotation de palette.\". Évite de parler installation : ils veulent savoir si ça vaut la peine d'aller plus loin, pas signer maintenant.",
  },
  {
    id: "m3",
    companyName: "Talvio",
    title: "Prospection cabinets comptables — outil de pré-compta IA",
    description:
      "Talvio automatise la saisie comptable des pièces justificatives par IA (OCR + classification + intégration directe dans ACD, Cegid, Sage). Tarif cabinet : 200 à 800 €/mois selon volume de dossiers. Aucune concurrence directe sur ce créneau prix/intégration.",
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
    targetPersona:
      "Expert-comptable associé ou responsable de pôle dans un cabinet de 5 à 50 collaborateurs. Cabinets indépendants en priorité (pas les réseaux type Fiducial qui ont leurs outils maison). Le bon interlocuteur dit \"on saisit encore beaucoup\" ou \"on cherche à gagner du temps sur la pièce\". Zone : France entière.",
    meetingType: "Démo live de 30 min sur Zoom — l'expert-comptable branche une vraie liasse, on lui montre le résultat en temps réel.",
    pitchNotes:
      "Opener : \"Combien d'heures par semaine vos collaborateurs passent à saisir des justificatifs ?\" — si > 5h, tu as un lead. Objection principale : \"On a déjà un scanner.\" Réponse : \"On ne remplace pas le scan, on élimine ce qui vient après.\" Autre objection : \"Nos clients n'enverront jamais leurs documents numériquement.\" Réponse : \"80 % des cabinets qui le disent ont 60 % de leurs clients qui le font déjà via leur banque.\"",
  },
  {
    id: "m4",
    companyName: "Studio Karma",
    title: "RDV pour agence SMMA — e-commerçants > 50k€/mois",
    description:
      "Studio Karma gère les campagnes Meta + TikTok Ads pour des marques DTC. Preuve sociale solide : 14 clients actifs, ROAS moyen 4,2. Ils cherchent 5 nouveaux clients à fort potentiel — donc des RDV très qualifiés, pas du volume.",
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
    targetPersona:
      "Fondateur ou directeur marketing d'une marque e-commerce DTC réalisant plus de 50 000 €/mois de CA. Secteurs idéaux : mode, beauté, compléments alimentaires, maison. La marque doit déjà faire de la pub payante (même mauvaise). Évite les marketplaces pures (Amazon-only, pas de site propre).",
    meetingType: "Appel stratégique de 30 min avec le fondateur de Studio Karma — audit gratuit des campagnes actuelles pendant l'appel.",
    pitchNotes:
      "Opener qui qualifie direct : \"Vous êtes à combien de CA mensuel en ce moment, et quelle part vient des ads ?\". Si la réponse est > 50k et < 30 % en ads, c'est un lead chaud (gros potentiel non exploité). Cas clients à mentionner : marque beauté passée de 30k à 120k/mois en 4 mois. Ne promets pas de résultats chiffrés — dis \"ils ont fait un audit gratuit et décidé de suite\".",
  },
];

export function mockCallerByUsername(username: string) {
  return mockLadder.find((e) => e.caller.username === username) ?? null;
}
