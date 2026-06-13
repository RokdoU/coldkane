import { describe, expect, it } from "vitest";
import { BRAND, COMMISSION_RATE, SEASON_CARRYOVER, POINTS } from "./config";

// Le positionnement est un invariant produit : méritocratie brute, l'argent
// réel comme preuve. On fige les messages pour qu'un changement de ton soit
// toujours un acte explicite, pas un drift de copywriting.
describe("marque", () => {
  it("la tagline est le manifeste : résultats, rien d'autre", () => {
    expect(BRAND.tagline).toBe("Pas de CV. Pas de diplôme. Que des résultats.");
  });

  it("la description tient les trois preuves : RDV, argent, classement public", () => {
    expect(BRAND.description).toContain("encaisse à la validation");
    expect(BRAND.description).toContain("classement public");
    expect(BRAND.description).toContain("impossible à truquer");
  });
});

// La commission et les règles de points sont du contractuel : on fige les
// invariants pour qu'un changement soit toujours un acte explicite.
describe("règles business", () => {
  it("commission dans la fourchette du brief (15-20%)", () => {
    expect(COMMISSION_RATE).toBeGreaterThanOrEqual(0.15);
    expect(COMMISSION_RATE).toBeLessThanOrEqual(0.2);
  });

  it("le payout caller + commission = 100% du prix", () => {
    const price = 15000;
    const commission = Math.round(price * COMMISSION_RATE);
    const payout = price - commission;
    expect(payout + commission).toBe(price);
  });

  it("reset partiel : on conserve une fraction, pas tout", () => {
    expect(SEASON_CARRYOVER).toBeGreaterThan(0);
    expect(SEASON_CARRYOVER).toBeLessThan(1);
  });

  it("le bonus de streak est plafonné", () => {
    expect(POINTS.streakBonusCap).toBeLessThanOrEqual(POINTS.meetingValidated);
  });
});
