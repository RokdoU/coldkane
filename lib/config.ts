// Identité & règles business — un seul endroit à modifier.

export const BRAND = {
  name: "ColdKane",
  tagline: "Pas de CV. Pas de diplôme. Que des résultats.",
  description:
    "Booke des RDV, encaisse à la validation, grimpe un classement public impossible à truquer.",
} as const;

// Commission plateforme sur chaque montant libéré de l'escrow (brief : 15-20%)
export const COMMISSION_RATE = 0.15;

// Durée d'une saison (brief : 4-6 semaines)
export const SEASON_WEEKS = 6;

// Reset partiel entre saisons : part des points conservée au placement
export const SEASON_CARRYOVER = 0.2;

// Points
export const POINTS = {
  meetingValidated: 100,
  streakBonusPerMeeting: 10, // +10 par RDV consécutif…
  streakBonusCap: 50, // …plafonné à +50
  noShowPenalty: -30,
} as const;

// Parrainage : part des gains des filleuls reversée au parrain, durée limitée
export const REFERRAL = {
  rate: 0.05, // 5% des gains du filleul
  months: 3, // pendant ses 3 premiers mois
} as const;

// Démarrage progressif (earn-as-you-go) : un nouveau caller a peu de RDV
// ouverts simultanés, débloqués par sa performance (RDV validés). Filtre
// qualité 100% autonome — les bons montent en accès, les mauvais se tarissent.
// Valeurs de départ à affiner avec les premiers volumes réels.
export const EARN_AS_YOU_GO = {
  baseOpenMeetings: 3, // plafond de RDV ouverts (booked + disputed) au départ
  unlockPerValidated: 1, // +1 au plafond par RDV validé à vie
  maxOpenMeetings: 25, // plafond maximum
} as const;

// Apport d'affaires : un caller qui ramène une entreprise déposant de l'escrow
// touche une prime à l'activation (1er dépôt). Le rev-share sur la commission
// générée est prévu en phase 2 (non câblé ici). Valeurs à affiner.
export const APPORTEUR = {
  activationBonusCents: 5000, // 50 € à l'activation
  minEscrowCents: 30000, // dépôt minimum de l'entreprise pour déclencher (anti-abus)
  attributionWindowDays: 90, // l'entreprise doit déposer dans les 90j après son inscription
} as const;

// Anti-fraude : seuils de détection automatique (flag + alerte, pas blocage
// silencieux). Valeurs de départ à affiner avec les premiers volumes réels.
export const FRAUD = {
  maxLoginAttemptsPerHour: 10, // par email/IP avant throttle
  maxDeclarationsPerDay: 20, // RDV déclarés par caller / 24h
  maxSignupsPerIpPerDay: 3, // multi-comptes au signup
  rapidValidationSeconds: 60, // entreprise qui valide < 60s = signal collusion
} as const;

// Litiges : résolution automatique par défaut (la plateforme tourne seule).
// Passé le SLA sans arbitrage manuel, le cron tranche selon la règle par défaut :
//   - caller sans preuve fournie → annulation (faveur entreprise)
//   - caller avec preuve, entreprise non escaladée → validation (faveur caller)
export const DISPUTE = {
  slaHours: 72, // délai avant résolution automatique
  reminderBeforeHours: 24, // rappel envoyé quand il reste ≤ 24h (nudge preuve)
} as const;
