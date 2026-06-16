"use client";

import { useActionState } from "react";
import { submitDisputeEvidence } from "@/lib/actions/missions";
import type { ActionState } from "@/lib/actions/missions";

// Le caller fournit sa preuve sur un RDV contesté. Sans preuve avant l'échéance
// du litige, le RDV est annulé automatiquement (faveur entreprise).
export function DisputeEvidenceForm({
  meetingId,
  prospectCompany,
  reason,
  existingEvidence,
}: {
  meetingId: string;
  prospectCompany: string;
  reason: string | null;
  existingEvidence: string | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(
    submitDisputeEvidence,
    { error: null },
  );

  return (
    <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-4">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium">{prospectCompany}</p>
        <span className="micro text-amber-400/80">EN LITIGE</span>
      </div>
      {reason && (
        <p className="mt-1.5 text-xs leading-relaxed text-foreground/45">
          Motif entreprise : {reason}
        </p>
      )}

      {existingEvidence || state.success ? (
        <p className="mt-3 text-xs leading-relaxed text-ice-400">
          {state.success ??
            "Preuve enregistrée. Sans escalade de l'entreprise, le RDV sera validé à l'échéance."}
        </p>
      ) : (
        <form action={action} className="mt-3 flex flex-col gap-2">
          <input type="hidden" name="meetingId" value={meetingId} />
          <textarea
            name="evidence"
            rows={2}
            required
            placeholder="Lien d'agenda, capture d'échange, enregistrement…"
            className="w-full resize-none rounded-md border border-night-500 bg-night-900 px-3 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:border-night-400 focus:outline-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
            >
              {pending ? "Envoi…" : "Envoyer ma preuve"}
            </button>
            {state.error && <p className="text-xs text-red-400">{state.error}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
