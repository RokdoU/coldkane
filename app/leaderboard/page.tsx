import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { getActiveSeason, getLadder } from "@/lib/data";
import { LEGENDE_TOP_N, TIER_THRESHOLDS, TIER_LABELS } from "@/lib/ranking";

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
            <h1 className="text-3xl font-black">Classement</h1>
            <p className="mt-1 text-foreground/50">
              {season.name} · <span className="font-semibold text-ember-400">{daysLeft} jours restants</span>
            </p>
          </div>
          <p className="rounded-xl border border-tier-legende/30 bg-tier-legende/10 px-4 py-2 text-sm font-semibold text-tier-legende">
            ★ Top {LEGENDE_TOP_N} = Légende — cash + accès missions premium en fin de saison
          </p>
        </div>

        <div className="mt-8">
          <LadderTable entries={ladder} />
        </div>

        <section className="mt-12 rounded-2xl border border-night-600 bg-night-800 p-6">
          <h2 className="font-bold">Les tiers de la saison</h2>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {[...TIER_THRESHOLDS].reverse().map(({ tier, min }) => (
              <div key={tier} className="rounded-xl bg-night-700 p-3">
                <p className="font-bold capitalize">{TIER_LABELS[tier]}</p>
                <p className="text-foreground/50">{min.toLocaleString("fr-FR")}+ pts</p>
              </div>
            ))}
            <div className="rounded-xl bg-tier-legende/10 p-3">
              <p className="font-bold text-tier-legende">★ Légende</p>
              <p className="text-foreground/50">Top {LEGENDE_TOP_N} du ladder</p>
            </div>
          </div>
          <p className="mt-4 text-xs text-foreground/40">
            RDV validé : 100 pts (+10 par RDV consécutif, max +50). No-show : −30 pts et streak
            remis à zéro. Reset partiel à chaque saison : tu repars avec 20% de tes points.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
