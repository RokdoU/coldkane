import { describe, expect, it } from "vitest";
import {
  mockMissions,
  mockLadder,
  mockSeason,
  mockCallerByUsername,
} from "./mock-data";
import { TIER_ORDER } from "./ranking";
import type { Mission, Tier } from "./types";

// Les données de démo sont la vitrine quand Supabase n'est pas configuré.
// Elles doivent respecter exactement la forme des interfaces, sinon l'app
// affiche des trous (ou crash) en mode sans-backend.

// Clés attendues de l'interface Mission, avec le type primitif/nullable visé.
const MISSION_FIELDS: Record<
  keyof Mission,
  "string" | "number" | "boolean" | "string|null" | "tier|null"
> = {
  id: "string",
  companyName: "string",
  title: "string",
  description: "string",
  sector: "string",
  status: "string",
  pricePerMeetingCents: "number",
  meetingsTarget: "number",
  meetingsValidated: "number",
  budgetCents: "number",
  isBounty: "boolean",
  bountyDeadline: "string|null",
  minTier: "tier|null",
  createdAt: "string",
  targetPersona: "string|null",
  meetingType: "string|null",
  pitchNotes: "string|null",
  qualificationCriteria: "string|null",
  bookingUrl: "string|null",
};

describe("mockMissions", () => {
  it("contient au moins une mission", () => {
    expect(mockMissions.length).toBeGreaterThan(0);
  });

  it("chaque mission possède toutes les clés de l'interface Mission", () => {
    for (const m of mockMissions) {
      for (const key of Object.keys(MISSION_FIELDS)) {
        expect(m, `mission ${m.id} — clé ${key}`).toHaveProperty(key);
      }
    }
  });

  it("chaque champ a le type attendu (y compris les nullables)", () => {
    for (const m of mockMissions) {
      for (const [key, kind] of Object.entries(MISSION_FIELDS)) {
        const value = (m as unknown as Record<string, unknown>)[key];
        const label = `mission ${m.id} — ${key}`;
        switch (kind) {
          case "string":
            expect(typeof value, label).toBe("string");
            break;
          case "number":
            expect(typeof value, label).toBe("number");
            expect(Number.isFinite(value as number), label).toBe(true);
            break;
          case "boolean":
            expect(typeof value, label).toBe("boolean");
            break;
          case "string|null":
            expect(value === null || typeof value === "string", label).toBe(
              true,
            );
            break;
          case "tier|null":
            expect(
              value === null || TIER_ORDER.includes(value as Tier),
              label,
            ).toBe(true);
            break;
        }
      }
    }
  });

  it("budgetCents === pricePerMeetingCents * meetingsTarget", () => {
    for (const m of mockMissions) {
      expect(m.budgetCents, `mission ${m.id}`).toBe(
        m.pricePerMeetingCents * m.meetingsTarget,
      );
    }
  });

  it("les compteurs de RDV sont cohérents (validés <= cible, valeurs >= 0)", () => {
    for (const m of mockMissions) {
      expect(m.meetingsTarget, `mission ${m.id}`).toBeGreaterThan(0);
      expect(m.meetingsValidated, `mission ${m.id}`).toBeGreaterThanOrEqual(0);
      expect(m.meetingsValidated, `mission ${m.id}`).toBeLessThanOrEqual(
        m.meetingsTarget,
      );
      expect(m.pricePerMeetingCents, `mission ${m.id}`).toBeGreaterThan(0);
    }
  });

  it("une mission bounty a une deadline, une non-bounty n'en a pas", () => {
    for (const m of mockMissions) {
      if (m.isBounty) {
        expect(m.bountyDeadline, `mission ${m.id}`).not.toBeNull();
      } else {
        expect(m.bountyDeadline, `mission ${m.id}`).toBeNull();
      }
    }
  });

  it("les identifiants de mission sont uniques", () => {
    const ids = mockMissions.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("mockLadder", () => {
  it("contient des entrées classées", () => {
    expect(mockLadder.length).toBeGreaterThan(0);
  });

  it("chaque entrée a un caller bien formé (username non vide, tier valide)", () => {
    for (const entry of mockLadder) {
      expect(entry.caller.username.trim().length, `caller ${entry.caller.id}`)
        .toBeGreaterThan(0);
      expect(entry.caller.fullName.trim().length, `caller ${entry.caller.id}`)
        .toBeGreaterThan(0);
      expect(TIER_ORDER, `tier de ${entry.caller.username}`).toContain(
        entry.tier,
      );
    }
  });

  it("le classement est ordonné : rangs consécutifs et points décroissants", () => {
    for (let i = 0; i < mockLadder.length; i++) {
      expect(mockLadder[i].rank).toBe(i + 1);
      if (i > 0) {
        expect(mockLadder[i].points).toBeLessThanOrEqual(
          mockLadder[i - 1].points,
        );
      }
    }
  });

  it("les compteurs d'une entrée sont positifs ou nuls", () => {
    for (const entry of mockLadder) {
      expect(entry.points, entry.caller.username).toBeGreaterThanOrEqual(0);
      expect(entry.meetingsValidated, entry.caller.username)
        .toBeGreaterThanOrEqual(0);
      expect(entry.noShows, entry.caller.username).toBeGreaterThanOrEqual(0);
      expect(entry.bestStreak, entry.caller.username).toBeGreaterThanOrEqual(0);
    }
  });

  it("les usernames sont uniques (clé de lookup)", () => {
    const usernames = mockLadder.map((e) => e.caller.username);
    expect(new Set(usernames).size).toBe(usernames.length);
  });
});

describe("mockCallerByUsername", () => {
  it("retrouve un caller existant du ladder", () => {
    const first = mockLadder[0].caller.username;
    expect(mockCallerByUsername(first)?.caller.username).toBe(first);
  });

  it("retourne null pour un username inconnu", () => {
    expect(mockCallerByUsername("__inexistant__")).toBeNull();
  });
});

describe("mockSeason", () => {
  it("la fin est postérieure au début", () => {
    expect(new Date(mockSeason.endsAt).getTime()).toBeGreaterThan(
      new Date(mockSeason.startsAt).getTime(),
    );
  });

  it("les dates sont des ISO valides", () => {
    expect(Number.isNaN(new Date(mockSeason.startsAt).getTime())).toBe(false);
    expect(Number.isNaN(new Date(mockSeason.endsAt).getTime())).toBe(false);
  });

  it("la saison a un nom et un numéro cohérents", () => {
    expect(mockSeason.name.trim().length).toBeGreaterThan(0);
    expect(mockSeason.number).toBeGreaterThan(0);
  });
});
