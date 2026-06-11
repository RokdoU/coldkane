import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { MissionCard } from "@/components/mission-card";
import { MissionDetailModal } from "@/components/mission-detail-modal";
import { getOpenMissions } from "@/lib/data";
import { getSessionProfile } from "@/lib/supabase-server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { formatEuros } from "@/lib/ranking";
import { Lock } from "@/components/icons";

export const metadata: Metadata = {
  title: "Missions & bounties",
  description: "Missions payées à la performance, budget séquestré en escrow.",
};

export default async function MissionsPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const { id: selectedId } = await searchParams;

  const [missions, profile] = await Promise.all([getOpenMissions(), getSessionProfile()]);

  const totalEscrow = missions.reduce((sum, m) => sum + m.budgetCents, 0);
  const bounties = missions.filter((m) => m.isBounty);
  const regular = missions.filter((m) => !m.isBounty);

  const selectedMission = selectedId ? (missions.find((m) => m.id === selectedId) ?? null) : null;

  let hasApplied = false;
  if (selectedMission && profile?.role === "caller" && isSupabaseConfigured()) {
    const db = supabaseAdmin();
    const { data } = await db
      .from("assignments")
      .select("id")
      .eq("mission_id", selectedMission.id)
      .eq("caller_id", profile.id)
      .maybeSingle();
    hasApplied = !!data;
  }

  return (
    <>
      <Nav />

      {selectedMission && (
        <MissionDetailModal
          mission={selectedMission}
          profile={profile}
          hasApplied={hasApplied}
        />
      )}

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
                <MissionCard key={m.id} mission={m} />
              ))}
            </div>
          </section>
        )}

        <section className="mt-10">
          <h2 className="micro text-foreground/40">Missions ouvertes</h2>
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
