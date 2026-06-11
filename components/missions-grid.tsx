"use client";

import { useState } from "react";
import type { Mission } from "@/lib/types";
import type { SessionProfile } from "@/lib/supabase-server";
import { MissionCard } from "./mission-card";
import { MissionDetailPanel } from "./mission-detail-panel";

export function MissionsGrid({
  bounties,
  regular,
  profile,
  appliedMissionIds,
}: {
  bounties: Mission[];
  regular: Mission[];
  profile: SessionProfile | null;
  appliedMissionIds: string[];
}) {
  const [selected, setSelected] = useState<Mission | null>(null);

  const close = () => setSelected(null);

  return (
    <>
      {selected && (
        <MissionDetailPanel
          mission={selected}
          profile={profile}
          hasApplied={appliedMissionIds.includes(selected.id)}
          onClose={close}
        />
      )}

      {bounties.length > 0 && (
        <section className="mt-10">
          <h2 className="micro text-ember-400">Bounties — fenêtre courte, prime majorée</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {bounties.map((m) => (
              <MissionCard key={m.id} mission={m} onSelect={setSelected} />
            ))}
          </div>
        </section>
      )}

      {regular.length > 0 && (
        <section className="mt-10">
          <h2 className="micro text-foreground/40">Missions ouvertes</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {regular.map((m) => (
              <MissionCard key={m.id} mission={m} onSelect={setSelected} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
