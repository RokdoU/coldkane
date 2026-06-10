import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { MissionCard } from "@/components/mission-card";
import { getActiveSeason, getLadder, getOpenMissions } from "@/lib/data";
import { Crosshair, Flame, Lock, Phone, ShieldCheck, TrendingUp } from "@/components/icons";

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
        <section className="scanlines bg-grid relative overflow-hidden border-b border-night-600">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgb(34_211_238/0.13),transparent)]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-24">
            <p className="display cut-sm mx-auto flex w-fit items-center gap-2 border border-ice-500/30 bg-ice-500/10 px-4 py-1.5 text-xs tracking-[0.2em] text-ice-300">
              <Flame className="h-3.5 w-3.5 text-ember-400" />
              {season.name} — fin le {seasonEnd}
            </p>
            <h1 className="display mx-auto mt-8 max-w-4xl text-center text-5xl leading-[1.05] sm:text-7xl">
              Ton téléphone.
              <br />
              <span className="text-glow text-ice-400">Ton rang.</span>{" "}
              <span className="text-ember-400">Ta réputation.</span>
            </h1>
            <p className="mx-auto mt-7 max-w-xl text-center text-lg leading-relaxed text-foreground/60">
              Booke des RDV pour des entreprises. Chaque RDV validé est payé
              via escrow, compté au classement et gravé dans ton profil.
              Personne ne peut tricher. Personne ne peut te le retirer.
            </p>
            <div className="mt-9 flex justify-center gap-3">
              <Link
                href="/missions"
                className="cut display glow-ice cursor-pointer bg-ice-400 px-7 py-3.5 text-sm tracking-wider text-night-900 transition-colors duration-200 hover:bg-ice-300"
              >
                Prendre une mission
              </Link>
              <Link
                href="/leaderboard"
                className="cut display cursor-pointer border border-night-500 px-7 py-3.5 text-sm tracking-wider text-foreground/80 transition-colors duration-200 hover:border-ice-500/60 hover:text-ice-300"
              >
                Le classement
              </Link>
            </div>

            {/* Stats HUD */}
            <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-3">
              {[
                { icon: Crosshair, big: "100 pts", small: "par RDV validé" },
                { icon: Lock, big: "15%", small: "de commission, zéro fixe" },
                { icon: TrendingUp, big: "6 sem.", small: "par saison, reset partiel" },
              ].map(({ icon: Icon, big, small }) => (
                <div key={small} className="cut border border-night-600 bg-night-800/80 p-4 text-center">
                  <Icon className="mx-auto h-4 w-4 text-ice-400" />
                  <p className="display mt-2 text-2xl text-foreground">{big}</p>
                  <p className="mt-1 text-xs text-foreground/45">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bounties FOMO */}
        {bounties.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex items-baseline justify-between">
              <h2 className="display text-2xl tracking-wide">
                <span className="text-ember-400">Bounties</span> en cours
              </h2>
              <Link
                href="/missions"
                className="cursor-pointer text-sm font-semibold text-ice-400 transition-colors duration-200 hover:text-ice-300"
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
        <section className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-2xl tracking-wide">Top du ladder</h2>
            <Link
              href="/leaderboard"
              className="cursor-pointer text-sm font-semibold text-ice-400 transition-colors duration-200 hover:text-ice-300"
            >
              Classement complet →
            </Link>
          </div>
          <div className="mt-6">
            <LadderTable entries={ladder.slice(0, 5)} compact />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t border-night-600 bg-night-800/50">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="display text-center text-2xl tracking-wide">Comment ça marche</h2>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
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
                <div key={step} className="cut border border-night-600 bg-night-800 p-6">
                  <div className="flex items-center justify-between">
                    <span className="cut-sm flex h-9 w-9 items-center justify-center bg-ice-500/10 text-ice-400">
                      <Icon className="h-4 w-4" />
                    </span>
                    <p className="display text-3xl text-night-500">{step}</p>
                  </div>
                  <h3 className="display mt-4 text-base tracking-wide">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/55">{text}</p>
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
