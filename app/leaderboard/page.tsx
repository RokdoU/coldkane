import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { LiveLadderRefresh } from "@/components/live-ladder-refresh";
import { KillFeed } from "@/components/kill-feed";
import { getActiveSeason, getLadder, getRecentValidations } from "@/lib/data";
import { LEGENDE_TOP_N, TIER_THRESHOLDS, TIER_LABELS } from "@/lib/ranking";
import { Star, Timer } from "@/components/icons";

export const metadata: Metadata = {
  title: "Classement",
  description: "Le ladder en temps réel des meilleurs cold callers.",
};

export default async function LeaderboardPage() {
  const [season, ladder, validations] = await Promise.all([
    getActiveSeason(),
    getLadder(),
    getRecentValidations(),
  ]);
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(season.endsAt).getTime() - Date.now()) / 86_400_000),
  );

  return (
    <>
      <Nav />
      <LiveLadderRefresh />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-3xl tracking-tight">Classement</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-foreground/45">
              {season.name} ·
              <span className="tnum inline-flex items-center gap-1 font-medium text-ember-400">
                <Timer className="h-3.5 w-3.5" />
                {daysLeft} jours restants
              </span>
            </p>
          </div>
          <p className="flex items-center gap-2 rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm text-foreground/60">
            <Star className="h-3.5 w-3.5 fill-current text-tier-legende" />
            Top {LEGENDE_TOP_N} = Légende — cash + missions premium en fin de saison
          </p>
        </div>

        <div className="mt-6">
          <KillFeed events={validations} />
        </div>

        <div className="mt-4">
          <LadderTable entries={ladder} />
        </div>

        <section className="mt-10 rounded-xl border border-night-600 bg-night-800 p-6">
          <h2 className="micro text-foreground/40">Les tiers de la saison</h2>
          <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
            {[...TIER_THRESHOLDS].reverse().map(({ tier, min }) => (
              <div key={tier} className="rounded-lg border border-night-600 p-3.5">
                <p className="display text-sm">{TIER_LABELS[tier]}</p>
                <p className="tnum mt-1 text-xs text-foreground/45">
                  {min.toLocaleString("fr-FR")}+ pts
                </p>
              </div>
            ))}
            <div className="rounded-lg border border-tier-legende/25 p-3.5">
              <p className="display flex items-center gap-1.5 text-sm text-tier-legende">
                <Star className="h-3 w-3 fill-current" />
                Légende
              </p>
              <p className="mt-1 text-xs text-foreground/45">Top {LEGENDE_TOP_N} du ladder</p>
            </div>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-foreground/35">
            RDV validé : 100 pts (+10 par RDV consécutif, max +50). No-show : −30 pts et streak
            remis à zéro. Reset partiel à chaque saison : tu repars avec 20 % de tes points.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
