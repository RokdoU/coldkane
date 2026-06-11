import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { MissionCard } from "@/components/mission-card";
import { getOpenMissions } from "@/lib/data";
import { formatEuros } from "@/lib/ranking";
import { Lock } from "@/components/icons";

export const metadata: Metadata = {
  title: "Missions & bounties",
  description: "Missions payées à la performance, budget séquestré en escrow.",
};

export default async function MissionsPage() {
  const missions = await getOpenMissions();
  const totalEscrow = missions.reduce((sum, m) => sum + m.budgetCents, 0);
  const bounties = missions.filter((m) => m.isBounty);
  const regular = missions.filter((m) => !m.isBounty);

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-14">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="display text-3xl tracking-tight">Missions</h1>
            <p className="mt-2 text-sm text-foreground/45">
              Paiement à la performance. L&apos;argent est déjà séquestré — tu vois ce que tu chasses.
            </p>
          </div>
          <p className="tnum flex items-center gap-2 rounded-lg border border-night-600 bg-night-800 px-4 py-2 text-sm font-medium text-foreground/70">
            <Lock className="h-3.5 w-3.5 text-ice-400" />
            {formatEuros(totalEscrow)} actuellement en escrow
          </p>
        </div>

        {bounties.length > 0 && (
          <section className="mt-10">
            <h2 className="micro text-ember-400">Bounties — fenêtre courte, prime majorée</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {bounties.map((m) => (
                <MissionCard key={m.id} mission={m}  />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="micro text-foreground/40">Missions ouvertes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {regular.map((m) => (
              <MissionCard key={m.id} mission={m}  />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
