"use client";

import { useActionState, useState } from "react";
import { companyDisputeMeeting, type ActionState } from "@/lib/actions/missions";

export function DisputeForm({ meetingId }: { meetingId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ActionState, FormData>(
    companyDisputeMeeting,
    { error: null },
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:border-red-300 hover:text-red-600"
      >
        Contester
      </button>
    );
  }

  return (
    <form action={action} className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <input type="hidden" name="meetingId" value={meetingId} />
      <input
        name="reason"
        required
        autoFocus
        placeholder="Raison (ex : prospect absent)"
        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition-colors duration-200 focus:border-slate-900 sm:w-56"
      />
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors duration-200 hover:bg-red-500 disabled:cursor-default disabled:opacity-50"
      >
        {pending ? "…" : "Confirmer"}
      </button>
      <button
        type="button"
        onClick={() => setOpen(false)}
        className="cursor-pointer px-2 py-2 text-sm text-slate-400 transition-colors duration-200 hover:text-slate-600"
      >
        Annuler
      </button>
      {state.error && <p className="w-full text-sm text-red-600">{state.error}</p>}
      {state.success && <p className="w-full text-sm text-emerald-600">{state.success}</p>}
    </form>
  );
}
