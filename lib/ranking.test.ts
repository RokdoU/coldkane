import { describe, expect, it } from "vitest";
import {
  tierForPoints,
  nextTierProgress,
  formatEuros,
  TIER_THRESHOLDS,
  LEGENDE_TOP_N,
  TIER_ORDER,
  TIER_LABELS,
} from "./ranking";
import type { Tier } from "./types";

describe("tierForPoints", () => {
  it("attribue bronze à 0 point", () => {
    expect(tierForPoints(0)).toBe("bronze");
  });

  // Chaque seuil est testé exactement, juste en dessous et juste au-dessus :
  // une régression d'un point de chaque côté est attrapée.
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

  it("juste au-dessus de chaque seuil reste dans le même tier", () => {
    expect(tierForPoints(1)).toBe("bronze");
    expect(tierForPoints(301)).toBe("argent");
    expect(tierForPoints(801)).toBe("or");
    expect(tierForPoints(1501)).toBe("platine");
    expect(tierForPoints(2501)).toBe("diamant");
  });

  it("les points négatifs retombent sur bronze (garde-fou)", () => {
    expect(tierForPoints(-1)).toBe("bronze");
    expect(tierForPoints(-9999)).toBe("bronze");
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

  it("Légende exige le seuil diamant exact (2500), pas juste en dessous", () => {
    // rang éligible mais 1 point sous le seuil diamant → pas légende
    expect(tierForPoints(2499, 1)).toBe("platine");
    // pile au seuil diamant et rang 1 → légende
    expect(tierForPoints(2500, 1)).toBe("legende");
  });

  it("rang 0 est éligible à la Légende (rank <= top N)", () => {
    // un rang 0 satisfait rank <= LEGENDE_TOP_N
    expect(tierForPoints(2500, 0)).toBe("legende");
  });
});

describe("nextTierProgress", () => {
  it("calcule les points restants vers le tier suivant", () => {
    const p = nextTierProgress(100);
    expect(p.next).toBe("argent");
    expect(p.remaining).toBe(200);
  });

  it("à 0 point, vise argent avec progression nulle", () => {
    const p = nextTierProgress(0);
    expect(p.next).toBe("argent");
    expect(p.remaining).toBe(300);
    expect(p.progress).toBe(0);
  });

  it("pile sur un seuil, la progression du tier courant repart de 0", () => {
    // À 300 (argent), le prochain est or (800) ; progression argent = 0
    const p = nextTierProgress(300);
    expect(p.next).toBe("or");
    expect(p.remaining).toBe(500);
    expect(p.progress).toBe(0);
  });

  it("au milieu d'un tier, la progression est cohérente", () => {
    // 550 dans argent [300,800) : (550-300)/(800-300) = 0.5
    const p = nextTierProgress(550);
    expect(p.next).toBe("or");
    expect(p.remaining).toBe(250);
    expect(p.progress).toBeCloseTo(0.5, 5);
  });

  it("désigne le bon tier suivant à chaque palier", () => {
    expect(nextTierProgress(0).next).toBe("argent");
    expect(nextTierProgress(300).next).toBe("or");
    expect(nextTierProgress(800).next).toBe("platine");
    expect(nextTierProgress(1500).next).toBe("diamant");
  });

  it("progress est borné entre 0 et 1 sur tout le spectre", () => {
    for (const points of [
      -50, 0, 1, 150, 299, 300, 301, 550, 799, 800, 1200, 1499, 1500,
      2000, 2499, 2500, 99999,
    ]) {
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

  it("pile au dernier seuil (diamant), plus de tier suivant", () => {
    // 2500 est le min diamant : aucun seuil au-dessus
    const p = nextTierProgress(2500);
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

  it("remaining est toujours >= 0", () => {
    for (const points of [0, 300, 799, 1500, 2500, 99999]) {
      expect(nextTierProgress(points).remaining).toBeGreaterThanOrEqual(0);
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

  it("zéro affiche 0 € sans décimales", () => {
    expect(formatEuros(0)).toMatch(/^0\s?€$/);
  });

  it("un seul centime force les deux décimales", () => {
    expect(formatEuros(1)).toMatch(/0,01\s?€/);
  });

  it("les grands nombres utilisent le séparateur de milliers français", () => {
    // 1 234 567 centimes = 12 345,67 € ; espace insécable comme séparateur
    expect(formatEuros(1234567)).toMatch(/12\s?345,67\s?€/);
  });

  it("un montant rond à six chiffres reste sans décimales", () => {
    // 1 000 000 centimes = 10 000 €
    expect(formatEuros(1000000)).toMatch(/10\s?000\s?€/);
  });

  it("toujours en euros (symbole €)", () => {
    expect(formatEuros(500)).toContain("€");
  });
});

describe("constantes de ranking", () => {
  it("TIER_ORDER liste les 6 tiers du plus bas au plus haut", () => {
    expect(TIER_ORDER).toEqual([
      "bronze",
      "argent",
      "or",
      "platine",
      "diamant",
      "legende",
    ]);
  });

  it("TIER_LABELS couvre chaque tier de TIER_ORDER avec un libellé non vide", () => {
    for (const tier of TIER_ORDER) {
      const label = TIER_LABELS[tier as Tier];
      expect(label).toBeTruthy();
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("chaque tier seuillé (hors légende) figure dans TIER_ORDER", () => {
    for (const { tier } of TIER_THRESHOLDS) {
      expect(TIER_ORDER).toContain(tier);
    }
  });
});
