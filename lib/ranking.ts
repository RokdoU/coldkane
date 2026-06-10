import type { Tier } from "./types";

// Seuils de points par tier de saison. "Légende" n'est pas un seuil :
// c'est le top 10 du ladder actif — un statut qui se défend, pas qui s'acquiert.
export const TIER_THRESHOLDS: { tier: Exclude<Tier, "legende">; min: number }[] = [
  { tier: "diamant", min: 2500 },
  { tier: "platine", min: 1500 },
  { tier: "or", min: 800 },
  { tier: "argent", min: 300 },
  { tier: "bronze", min: 0 },
];

export const LEGENDE_TOP_N = 10;

export const TIER_LABELS: Record<Tier, string> = {
  bronze: "Bronze",
  argent: "Argent",
  or: "Or",
  platine: "Platine",
  diamant: "Diamant",
  legende: "Légende",
};

export const TIER_ORDER: Tier[] = [
  "bronze",
  "argent",
  "or",
  "platine",
  "diamant",
  "legende",
];

export function tierForPoints(points: number, rank?: number): Tier {
  if (rank !== undefined && rank <= LEGENDE_TOP_N && points >= TIER_THRESHOLDS[0].min) {
    return "legende";
  }
  for (const { tier, min } of TIER_THRESHOLDS) {
    if (points >= min) return tier;
  }
  return "bronze";
}

export function nextTierProgress(points: number): {
  next: Tier | null;
  remaining: number;
  progress: number; // 0..1 dans le tier courant
} {
  const above = [...TIER_THRESHOLDS].reverse().find((t) => t.min > points);
  if (!above) return { next: null, remaining: 0, progress: 1 };
  const current = TIER_THRESHOLDS.find((t) => points >= t.min) ?? TIER_THRESHOLDS.at(-1)!;
  const span = above.min - current.min;
  return {
    next: above.tier,
    remaining: above.min - points,
    progress: span > 0 ? (points - current.min) / span : 0,
  };
}

export function formatEuros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}
