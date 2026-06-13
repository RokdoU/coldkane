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
