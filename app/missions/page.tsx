import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { MissionCard } from "@/components/mission-card";
import { getOpenMissions } from "@/lib/data";
import { formatEuros } from "@/lib/ranking";

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
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black">Missions</h1>
            <p className="mt-1 text-foreground/50">
              Paiement à la performance. L&apos;argent est déjà séquestré — tu vois ce que tu chasses.
            </p>
          </div>
          <p className="rounded-xl border border-ice-500/30 bg-ice-500/10 px-4 py-2 text-sm font-semibold text-ice-300">
            {formatEuros(totalEscrow)} actuellement en escrow
          </p>
        </div>

        {bounties.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-black text-ember-400">⚡ Bounties — fenêtre courte, prime majorée</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {bounties.map((m) => (
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-black">Missions ouvertes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {regular.map((m) => (
              <MissionCard key={m.id} mission={m} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
