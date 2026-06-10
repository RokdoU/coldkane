import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { MissionCard } from "@/components/mission-card";
import { getActiveSeason, getLadder, getOpenMissions } from "@/lib/data";
import { Crosshair, Lock, Phone, ShieldCheck, TrendingUp } from "@/components/icons";

export default async function Home() {
  const [season, ladder, missions] = await Promise.all([
    getActiveSeason(),
    getLadder(),
    getOpenMissions(),
  ]);
  const bounties = missions.filter((m) => m.isBounty);
  const seasonEnd = new Date(season.endsAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
  });

  return (
    <>
      <Nav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-night-600">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_50%_0%,rgb(110_195_212/0.07),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-28">
            <p className="micro mx-auto w-fit rounded-full border border-night-600 bg-night-800 px-4 py-1.5 text-foreground/55">
              {season.name} — fin le {seasonEnd}
            </p>
            <h1 className="display mx-auto mt-8 max-w-3xl text-center text-5xl leading-[1.08] tracking-tight sm:text-6xl">
              Ton téléphone. Ton rang.
              <br />
              <span className="text-ice-400">Ta réputation.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-foreground/55">
              Booke des RDV pour des entreprises. Chaque RDV validé est payé
              via escrow, compté au classement et gravé dans ton profil.
              Personne ne peut tricher. Personne ne peut te le retirer.
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

            {/* Stats clés */}
            <div className="mx-auto mt-20 grid max-w-3xl grid-cols-3 divide-x divide-night-600 rounded-xl border border-night-600 bg-night-800">
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
                  text: "Des entreprises déposent missions et bounties, budget séquestré en escrow. Tu choisis, tu attaques.",
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
                  text: "RDV validé = cash libéré instantanément + points + rang. Ta réputation devient ton actif : publique, vérifiée, infalsifiable.",
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
      </main>
      <Footer />
    </>
  );
}
