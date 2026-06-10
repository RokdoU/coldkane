import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { LadderTable } from "@/components/ladder-table";
import { MissionCard } from "@/components/mission-card";
import { getActiveSeason, getLadder, getOpenMissions } from "@/lib/data";
import { BRAND } from "@/lib/config";

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
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgb(14_165_233/0.15),transparent_60%)]" />
          <div className="mx-auto max-w-6xl px-4 pb-20 pt-24 text-center">
            <p className="mx-auto w-fit rounded-full border border-ice-500/30 bg-ice-500/10 px-4 py-1.5 text-sm font-semibold text-ice-300">
              {season.name} · fin le {seasonEnd}
            </p>
            <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-black leading-tight tracking-tight sm:text-6xl">
              Ton téléphone.
              <br />
              <span className="text-ice-400">Ton rang.</span>{" "}
              <span className="text-ember-400">Ta réputation.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-xl text-lg text-foreground/60">
              {BRAND.description} Chaque RDV validé est payé via escrow et
              gravé dans ton profil. Personne ne peut tricher. Personne ne peut
              te le retirer.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link
                href="/missions"
                className="glow-ice rounded-xl bg-ice-500 px-6 py-3 font-bold text-night-800 transition hover:bg-ice-400"
              >
                Prendre une mission
              </Link>
              <Link
                href="/leaderboard"
                className="rounded-xl border border-night-600 px-6 py-3 font-semibold text-foreground/80 transition hover:border-ice-500/50"
              >
                Voir le classement
              </Link>
            </div>
            <div className="mx-auto mt-14 grid max-w-2xl grid-cols-3 gap-4 text-center">
              {[
                ["100 pts", "par RDV validé"],
                ["15%", "de commission, zéro fixe"],
                ["6 sem.", "par saison, reset partiel"],
              ].map(([big, small]) => (
                <div key={small} className="rounded-2xl border border-night-600 bg-night-800/60 p-4">
                  <p className="text-2xl font-black text-ice-300">{big}</p>
                  <p className="mt-1 text-xs text-foreground/50">{small}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bounties FOMO */}
        {bounties.length > 0 && (
          <section className="mx-auto max-w-6xl px-4 py-12">
            <div className="flex items-baseline justify-between">
              <h2 className="text-2xl font-black">
                <span className="text-ember-400">⚡ Bounties</span> en cours
              </h2>
              <Link href="/missions" className="text-sm font-semibold text-ice-400 hover:text-ice-300">
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
        <section className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex items-baseline justify-between">
            <h2 className="text-2xl font-black">Top du ladder</h2>
            <Link href="/leaderboard" className="text-sm font-semibold text-ice-400 hover:text-ice-300">
              Classement complet →
            </Link>
          </div>
          <div className="mt-6">
            <LadderTable entries={ladder.slice(0, 5)} compact />
          </div>
        </section>

        {/* Comment ça marche */}
        <section className="border-t border-night-600 bg-night-800/40">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <h2 className="text-center text-2xl font-black">Comment ça marche</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {[
                {
                  step: "01",
                  title: "Prends une mission",
                  text: "Des entreprises déposent missions et bounties, budget séquestré en escrow. Tu choisis, tu attaques.",
                },
                {
                  step: "02",
                  title: "Booke des RDV qualifiés",
                  text: "Chaque RDV est vérifié : calendrier + présence du prospect. Pas de preuve, pas de paiement — le ladder reste propre.",
                },
                {
                  step: "03",
                  title: "Encaisse et grimpe",
                  text: "RDV validé = cash libéré instantanément + points + rang. Ta réputation devient ton actif : publique, vérifiée, infalsifiable.",
                },
              ].map((s) => (
                <div key={s.step} className="rounded-2xl border border-night-600 bg-night-800 p-6">
                  <p className="font-mono text-sm font-bold text-ice-400">{s.step}</p>
                  <h3 className="mt-2 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/60">{s.text}</p>
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
