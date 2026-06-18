import { describe, expect, it } from "vitest";
import {
  BRAND,
  COMMISSION_RATE,
  SEASON_WEEKS,
  SEASON_CARRYOVER,
  POINTS,
  REFERRAL,
  DISPUTE,
  EARN_AS_YOU_GO,
  APPORTEUR,
  FRAUD,
} from "./config";

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

  it("nom, tagline et description sont non vides", () => {
    expect(BRAND.name.trim().length).toBeGreaterThan(0);
    expect(BRAND.tagline.trim().length).toBeGreaterThan(0);
    expect(BRAND.description.trim().length).toBeGreaterThan(0);
  });
});

// La commission et les règles de points sont du contractuel : on fige les
// invariants pour qu'un changement soit toujours un acte explicite.
describe("règles business", () => {
  it("commission dans la fourchette du brief (15-20%)", () => {
    expect(COMMISSION_RATE).toBeGreaterThanOrEqual(0.15);
    expect(COMMISSION_RATE).toBeLessThanOrEqual(0.2);
  });

  it("la commission est une fraction valide (strictement entre 0 et 1)", () => {
    expect(COMMISSION_RATE).toBeGreaterThan(0);
    expect(COMMISSION_RATE).toBeLessThan(1);
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

  it("la saison dure dans la fourchette du brief (4-6 semaines)", () => {
    expect(SEASON_WEEKS).toBeGreaterThanOrEqual(4);
    expect(SEASON_WEEKS).toBeLessThanOrEqual(6);
  });
});

// Points : le cœur du scoring. Un RDV validé doit rapporter, le no-show doit
// punir, et le bonus de streak doit rester plafonné.
describe("points", () => {
  it("un RDV validé rapporte des points", () => {
    expect(POINTS.meetingValidated).toBeGreaterThan(0);
  });

  it("le no-show est une pénalité (négatif)", () => {
    expect(POINTS.noShowPenalty).toBeLessThan(0);
  });

  it("le bonus de streak par RDV est positif", () => {
    expect(POINTS.streakBonusPerMeeting).toBeGreaterThan(0);
  });

  it("le plafond de streak couvre au moins un palier de bonus", () => {
    expect(POINTS.streakBonusCap).toBeGreaterThanOrEqual(
      POINTS.streakBonusPerMeeting,
    );
  });

  it("le bonus de streak est plafonné sous la valeur d'un RDV", () => {
    expect(POINTS.streakBonusCap).toBeLessThanOrEqual(POINTS.meetingValidated);
  });
});

// Parrainage : rev-share borné dans le temps, taux raisonnable.
describe("parrainage", () => {
  it("le taux est une fraction valide (strictement entre 0 et 1)", () => {
    expect(REFERRAL.rate).toBeGreaterThan(0);
    expect(REFERRAL.rate).toBeLessThan(1);
  });

  it("le rev-share dure un nombre de mois positif", () => {
    expect(REFERRAL.months).toBeGreaterThan(0);
    expect(Number.isInteger(REFERRAL.months)).toBe(true);
  });
});

// Litiges : la résolution automatique repose sur un SLA cohérent avec son
// rappel — le nudge doit tomber avant l'échéance, pas après.
describe("litiges", () => {
  it("le rappel arrive strictement avant le SLA, et les deux sont positifs", () => {
    expect(DISPUTE.reminderBeforeHours).toBeGreaterThan(0);
    expect(DISPUTE.slaHours).toBeGreaterThan(DISPUTE.reminderBeforeHours);
  });
});

// Démarrage progressif : le plafond initial est plancher mais sous le max,
// et chaque RDV validé débloque au moins un cran.
describe("earn-as-you-go", () => {
  it("le plafond de départ vaut au moins 1 RDV ouvert", () => {
    expect(EARN_AS_YOU_GO.baseOpenMeetings).toBeGreaterThanOrEqual(1);
  });

  it("le plafond de départ ne dépasse pas le plafond max", () => {
    expect(EARN_AS_YOU_GO.baseOpenMeetings).toBeLessThanOrEqual(
      EARN_AS_YOU_GO.maxOpenMeetings,
    );
  });

  it("chaque RDV validé débloque au moins un cran", () => {
    expect(EARN_AS_YOU_GO.unlockPerValidated).toBeGreaterThanOrEqual(1);
  });
});

// Apport d'affaires : prime, plancher d'escrow et fenêtre d'attribution
// strictement positifs (sinon le mécanisme n'a pas de sens).
describe("apporteur d'affaires", () => {
  it("la prime d'activation est strictement positive", () => {
    expect(APPORTEUR.activationBonusCents).toBeGreaterThan(0);
  });

  it("le plancher d'escrow est strictement positif", () => {
    expect(APPORTEUR.minEscrowCents).toBeGreaterThan(0);
  });

  it("la fenêtre d'attribution est strictement positive", () => {
    expect(APPORTEUR.attributionWindowDays).toBeGreaterThan(0);
  });
});

// Anti-fraude : tous les seuils de détection doivent être positifs, sinon
// le filtre se déclencherait en permanence (ou jamais).
describe("anti-fraude", () => {
  it("tous les seuils sont strictement positifs", () => {
    expect(FRAUD.maxLoginAttemptsPerHour).toBeGreaterThan(0);
    expect(FRAUD.maxDeclarationsPerDay).toBeGreaterThan(0);
    expect(FRAUD.maxSignupsPerIpPerDay).toBeGreaterThan(0);
    expect(FRAUD.rapidValidationSeconds).toBeGreaterThan(0);
  });
});
