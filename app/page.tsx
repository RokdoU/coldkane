import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { MissionCard } from "@/components/mission-card";
import { KillFeed } from "@/components/kill-feed";
import { Countdown } from "@/components/countdown";
import { PayoutCounter, getPlatformStats } from "@/components/payout-counter";
import {
  getActiveSeason,
  getLadder,
  getOpenMissions,
  getRecentValidations,
} from "@/lib/data";
import { formatEuros } from "@/lib/ranking";
import { Crosshair, Lock, Phone, ShieldCheck, TrendingUp, Zap } from "@/components/icons";

// La home garde le titre par défaut du layout (« ColdKane — tagline »). On
// précise une description orientée conversion et l'URL canonique du site.
export const metadata: Metadata = {
  description:
    "La marketplace gamifiée des cold callers : booke des RDV qualifiés, encaisse à la validation et grimpe un classement public vérifié par escrow.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [season, ladder, missions, validations, stats] = await Promise.all([
    getActiveSeason(),
    getLadder(),
    getOpenMissions(),
    getRecentValidations(),
    getPlatformStats(),
  ]);
  const bounties = missions.filter((m) => m.isBounty);
  const liveBounty = bounties[0] ?? null;
  const seasonEnd = new Date(season.endsAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Nav />

      {/* Bandeau bounty : un event, pas une bannière pub */}
      {liveBounty && liveBounty.bountyDeadline && (
        <Link
          href={`/missions/${liveBounty.id}`}
          className="block border-b border-ember-500/20 bg-ember-500/[0.06] transition-colors duration-200 hover:bg-ember-500/[0.1]"
        >
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-4 gap-y-1 px-4 py-2.5 text-sm">
            <span className="micro flex items-center gap-1 text-ember-400">
              <Zap className="h-3 w-3" />
              Bounty actif
            </span>
            <span className="text-foreground/70">
              {formatEuros(liveBounty.pricePerMeetingCents)}/RDV — {liveBounty.companyName}
            </span>
            <Countdown deadline={liveBounty.bountyDeadline} />
          </div>
        </Link>
      )}

      <main className="flex-1">
        {/* Hero : la promesse, puis tout de suite la preuve — l'argent versé et le feed live */}
        <section className="relative overflow-hidden border-b border-night-600">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgb(110_195_212/0.07),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-24">
            <p className="micro mx-auto w-fit rounded-full border border-night-600 bg-night-800 px-4 py-1.5 text-foreground/55">
              {season.name} — fin le {seasonEnd}
            </p>
            <h1 className="display mx-auto mt-8 max-w-3xl text-center text-5xl leading-[1.08] tracking-tight sm:text-6xl">
              Pas de CV. Pas de diplôme.
              <br />
              <span className="bg-gradient-to-r from-ice-300 via-ice-400 to-ice-300 bg-clip-text text-transparent animate-gradient-pan">
                Que des résultats.
              </span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-foreground/55">
              Des entreprises paient pour des RDV, budget séquestré. Tu bookes,
              tu encaisses à la validation, le classement enregistre. Personne
              ne te demande d&apos;où tu viens — le ladder dit qui tu es.
            </p>
            <div className="mt-9 flex justify-center gap-3">
              <Link
                href="/missions"
                className="cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
              >
                Prendre une mission
              </Link>
              <Link
                href="/leaderboard"
                className="cursor-pointer rounded-md border border-night-500 px-6 py-3 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-500 hover:text-foreground"
              >
                Voir le classement
              </Link>
            </div>

            {/* La preuve avant le discours : le total versé, puis le feed en direct */}
            <div className="mx-auto mt-12 max-w-xl">
              <PayoutCounter stats={stats} />
              <div className="mt-6">
                <KillFeed events={validations} />
              </div>
            </div>

            {/* Stats clés */}
            <div className="mx-auto mt-10 grid max-w-3xl grid-cols-3 divide-x divide-night-600 rounded-xl border border-night-600 bg-night-800">
              {[
                { icon: Crosshair, big: "100 pts", small: "par RDV validé" },
                { icon: Lock, big: "15 %", small: "de commission, zéro fixe" },
                { icon: TrendingUp, big: "6 sem.", small: "par saison, reset partiel" },
              ].map(({ icon: Icon, big, small }) => (
                <div key={small} className="p-5 text-center">
                  <Icon className="mx-auto h-4 w-4 text-foreground/35" />
                  <p className="display tnum mt-2.5 text-xl">{big}</p>
                  <p className="mt-1 text-xs text-foreground/45">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bounties */}
        {bounties.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex items-baseline justify-between">
              <h2 className="display text-2xl tracking-tight">Bounties en cours</h2>
              <Link
                href="/missions"
                className="cursor-pointer text-sm font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
              >
                Toutes les missions →
              </Link>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {bounties.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>
        )}

        {/* Top ladder */}
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl tracking-tight">Top du ladder</h2>
            <Link
              href="/leaderboard"
              className="cursor-pointer text-sm font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
            >
              Classement complet →
            </Link>
          </div>
          <div className="mt-6">
            <LadderTable entries={ladder.slice(0, 5)} compact />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t border-night-600">
          <div className="mx-auto max-w-6xl px-4 py-20">
            <h2 className="display text-center text-2xl tracking-tight">Comment ça marche</h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-night-600 bg-night-600 md:grid-cols-3">
              {[
                {
                  icon: Crosshair,
                  step: "01",
                  title: "Prends une mission",
                  text: "Des entreprises déposent missions et bounties, budget séquestré en escrow. Pas de candidature à rallonge : tu choisis, tu attaques.",
                },
                {
                  icon: Phone,
                  step: "02",
                  title: "Booke des RDV qualifiés",
                  text: "Chaque RDV est vérifié : calendrier + présence du prospect. Pas de preuve, pas de paiement — le ladder reste propre.",
                },
                {
                  icon: ShieldCheck,
                  step: "03",
                  title: "Encaisse et grimpe",
                  text: "RDV validé = cash libéré instantanément + points + rang. Chaque euro encaissé est une ligne de ton palmarès : public, vérifié, infalsifiable.",
                },
              ].map(({ icon: Icon, step, title, text }) => (
                <div key={step} className="bg-night-800 p-7">
                  <div className="flex items-center justify-between">
                    <Icon className="h-4 w-4 text-ice-400" />
                    <p className="micro text-foreground/25">{step}</p>
                  </div>
                  <h3 className="display mt-5 text-base">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/50">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Entreprises : le même chiffre rassure l'autre face du marché */}
        <section className="border-t border-night-600">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <div className="flex flex-col items-start justify-between gap-8 rounded-xl border border-night-600 bg-night-800 p-8 sm:flex-row sm:items-center">
              <div className="max-w-xl">
                <p className="micro text-foreground/40">Vous êtes une entreprise ?</p>
                <h2 className="display mt-3 text-2xl tracking-tight">
                  Vous ne payez que les RDV qui ont eu lieu.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-foreground/50">
                  <span className="tnum font-semibold text-ice-300">
                    {formatEuros(stats.totalPaidCents)}
                  </span>{" "}
                  déjà versés aux callers — chaque euro correspond à un RDV
                  validé, preuve calendrier à l&apos;appui. Budget séquestré,
                  solde non consommé remboursé.
                </p>
              </div>
              <Link
                href="/entreprises"
                className="shrink-0 cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
              >
                Déposer une mission
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
