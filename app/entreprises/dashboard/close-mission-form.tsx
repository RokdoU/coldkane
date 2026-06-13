"use client";

import { useActionState, useState } from "react";
import { closeMission } from "@/lib/actions/mission-lifecycle";
import type { ActionState } from "@/lib/actions/missions";
import { formatEuros } from "@/lib/ranking";

// Clôture avec confirmation : affiche le solde restant estimé avant d'agir.
export function CloseMissionForm({
  missionId,
  remainingCents,
}: {
  missionId: string;
  remainingCents: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    closeMission,
    { error: null },
  );

  if (state.success) {
    return <p className="text-xs text-emerald-600">{state.success}</p>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-xs font-medium text-slate-400 underline-offset-2 transition-colors duration-200 hover:text-slate-700 hover:underline"
      >
        Clôturer la mission
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-col items-end gap-2">
      <input type="hidden" name="missionId" value={missionId} />
      <p className="text-xs text-slate-500">
        {remainingCents > 0 ? (
          <>
            Solde restant estimé : <span className="font-semibold text-slate-700">{formatEuros(remainingCents)}</span>, remboursé à la clôture.
          </>
        ) : (
          "Budget entièrement consommé, rien à rembourser."
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={pending}
          className="cursor-pointer rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-700 disabled:cursor-default disabled:opacity-50"
        >
          {pending ? "Clôture…" : "Confirmer la clôture"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="cursor-pointer px-2 py-1.5 text-xs text-slate-400 transition-colors duration-200 hover:text-slate-600"
        >
          Annuler
        </button>
      </div>
      {state.error && <p className="text-xs text-red-600">{state.error}</p>}
    </form>
  );
}
