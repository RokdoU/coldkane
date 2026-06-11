import { describe, expect, it } from "vitest";
import {
  tierForPoints,
  nextTierProgress,
  formatEuros,
  TIER_THRESHOLDS,
  LEGENDE_TOP_N,
} from "./ranking";

describe("tierForPoints", () => {
  it("attribue bronze à 0 point", () => {
    expect(tierForPoints(0)).toBe("bronze");
  });

  it("respecte chaque seuil exactement", () => {
    expect(tierForPoints(299)).toBe("bronze");
    expect(tierForPoints(300)).toBe("argent");
    expect(tierForPoints(799)).toBe("argent");
    expect(tierForPoints(800)).toBe("or");
    expect(tierForPoints(1499)).toBe("or");
    expect(tierForPoints(1500)).toBe("platine");
    expect(tierForPoints(2499)).toBe("platine");
    expect(tierForPoints(2500)).toBe("diamant");
  });

  it("Légende = top 10 ET niveau diamant minimum", () => {
    expect(tierForPoints(3000, 1)).toBe("legende");
    expect(tierForPoints(3000, LEGENDE_TOP_N)).toBe("legende");
    // top 10 mais pas le niveau : pas de Légende au rabais
    expect(tierForPoints(900, 5)).toBe("or");
    // le niveau mais pas le rang
    expect(tierForPoints(3000, LEGENDE_TOP_N + 1)).toBe("diamant");
    // sans rang fourni, jamais Légende
    expect(tierForPoints(99999)).toBe("diamant");
  });
});

describe("nextTierProgress", () => {
  it("calcule les points restants vers le tier suivant", () => {
    const p = nextTierProgress(100);
    expect(p.next).toBe("argent");
    expect(p.remaining).toBe(200);
  });

  it("progress est borné entre 0 et 1", () => {
    for (const points of [0, 150, 299, 300, 1200, 2400]) {
      const { progress } = nextTierProgress(points);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(1);
    }
  });

  it("au-delà du dernier seuil, plus de tier suivant", () => {
    const p = nextTierProgress(99999);
    expect(p.next).toBeNull();
    expect(p.remaining).toBe(0);
    expect(p.progress).toBe(1);
  });

  it("les seuils sont strictement croissants (cohérence du ladder)", () => {
    const mins = [...TIER_THRESHOLDS].reverse().map((t) => t.min);
    for (let i = 1; i < mins.length; i++) {
      expect(mins[i]).toBeGreaterThan(mins[i - 1]);
    }
  });
});

describe("formatEuros", () => {
  it("formate les montants ronds sans décimales", () => {
    expect(formatEuros(15000)).toMatch(/^150\s?€$/);
  });

  it("garde les centimes quand ils existent", () => {
    expect(formatEuros(12750)).toMatch(/127,50\s?€/);
  });
});
