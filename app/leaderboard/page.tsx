import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { getActiveSeason, getLadder } from "@/lib/data";
import { LEGENDE_TOP_N, TIER_THRESHOLDS, TIER_LABELS } from "@/lib/ranking";
import { Star, Timer } from "@/components/icons";

export const metadata: Metadata = {
  title: "Classement",
  description: "Le ladder en temps réel des meilleurs cold callers.",
};

export default async function LeaderboardPage() {
  const [season, ladder] = await Promise.all([getActiveSeason(), getLadder()]);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.endsAt).getTime() - Date.now()) / 86_400_000),
  );

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-4xl tracking-wide">Classement</h1>
            <p className="mt-2 flex items-center gap-2 text-foreground/50">
              {season.name} ·
              <span className="inline-flex items-center gap-1 font-semibold text-ember-400">
                <Timer className="h-4 w-4" />
                {daysLeft} jours restants
              </span>
            </p>
          </div>
          <p className="cut-sm flex items-center gap-2 border border-tier-legende/40 bg-tier-legende/10 px-4 py-2 text-sm font-semibold text-tier-legende">
            <Star className="h-4 w-4 fill-current" />
            Top {LEGENDE_TOP_N} = Légende — cash + missions premium en fin de saison
          </p>
        </div>

        <div className="mt-8">
          <LadderTable entries={ladder} />
        </div>

        <section className="cut mt-12 border border-night-600 bg-night-800 p-6">
          <h2 className="display tracking-wide">Les tiers de la saison</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {[...TIER_THRESHOLDS].reverse().map(({ tier, min }) => (
              <div key={tier} className="cut-sm bg-night-700 p-3">
                <p className="display text-sm tracking-wider">{TIER_LABELS[tier]}</p>
                <p className="mt-1 text-foreground/50">{min.toLocaleString("fr-FR")}+ pts</p>
              </div>
            ))}
            <div className="cut-sm bg-tier-legende/10 p-3">
              <p className="display flex items-center gap-1 text-sm tracking-wider text-tier-legende">
                <Star className="h-3 w-3 fill-current" />
                Légende
              </p>
              <p className="mt-1 text-foreground/50">Top {LEGENDE_TOP_N} du ladder</p>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-foreground/40">
            RDV validé : 100 pts (+10 par RDV consécutif, max +50). No-show : −30 pts et streak
            remis à zéro. Reset partiel à chaque saison : tu repars avec 20% de tes points.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
