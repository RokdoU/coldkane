"use client";

// Ajout de comptes cibles à une mission (sourcing hybride). Un compte par ligne,
// format souple : "Nom du compte | indice | notes" (les | sont optionnels).
// Niveau compte uniquement — pas de contact perso en clair (RGPD).

import { useActionState, useState } from "react";
import { addLeads } from "@/lib/actions/leads";
import type { ActionState } from "@/lib/actions/missions";

export function AddLeadsForm({
  missionId,
  missionTitle,
  leadsTotal,
  leadsAvailable,
}: {
  missionId: string;
  missionTitle: string;
  leadsTotal: number;
  leadsAvailable: number;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(addLeads, {
    error: null,
  });

  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">{missionTitle}</p>
          <p className="mt-0.5 text-xs text-slate-500">
            {leadsTotal} lead{leadsTotal > 1 ? "s" : ""} ·{" "}
            <span className="font-medium text-emerald-600">{leadsAvailable} dispo</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="cursor-pointer rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors duration-200 hover:border-slate-400"
        >
          {open ? "Fermer" : "Ajouter des comptes"}
        </button>
      </div>

      {open && (
        <form action={action} className="mt-4">
          <input type="hidden" name="missionId" value={missionId} />
          <textarea
            name="leads"
            rows={5}
            required
            placeholder={"Un compte par ligne :\nGroupe Méridien | DAF | utilise encore Excel\nAtelier Nord SAS | DG\nFoncia Lyon"}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10"
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Format : <code>Nom du compte | indice | notes</code> — les deux derniers sont optionnels.
            Pas d&apos;email ni de donnée perso en clair.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-md bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition-colors duration-200 hover:bg-slate-700 disabled:opacity-50"
            >
              {pending ? "Ajout…" : "Ajouter au pool"}
            </button>
            {state.error && <span className="text-xs text-red-600">{state.error}</span>}
            {state.success && <span className="text-xs text-emerald-600">{state.success}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
