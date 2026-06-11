"use client";

import { useActionState } from "react";
import { declareMeeting, type ActionState } from "@/lib/actions/missions";
import type { CallerAssignment } from "@/lib/dashboard-data";
import { formatEuros } from "@/lib/ranking";

const inputCls =
  "mt-1.5 w-full rounded-md border border-night-500 bg-night-700 px-3.5 py-2.5 text-sm outline-none transition-colors duration-200 placeholder:text-foreground/25 focus:border-ice-500";

export function DeclareMeetingForm({ assignments }: { assignments: CallerAssignment[] }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(declareMeeting, {
    error: null,
  });

  return (
    <form action={action} className="mt-5 space-y-4">
      <div>
        <label htmlFor="assignmentId" className="text-sm font-medium">
          Mission
        </label>
        <select id="assignmentId" name="assignmentId" required className={inputCls}>
          {assignments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.missionTitle} — {formatEuros(a.pricePerMeetingCents)}/RDV
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prospectCompany" className="text-sm font-medium">
            Entreprise du prospect
          </label>
          <input
            id="prospectCompany"
            name="prospectCompany"
            required
            placeholder="Groupe Vidal"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="prospectEmail" className="text-sm font-medium">
            Email du prospect{" "}
            <span className="text-foreground/35">(haché, jamais affiché)</span>
          </label>
          <input
            id="prospectEmail"
            name="prospectEmail"
            type="email"
            required
            placeholder="contact@prospect.fr"
            className={inputCls}
          />
        </div>
      </div>
      <div>
        <label htmlFor="scheduledAt" className="text-sm font-medium">
          Date et heure du RDV
        </label>
        <input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          required
          className={inputCls}
        />
      </div>

      {state.error && (
        <p className="rounded-md border border-ember-500/30 bg-ember-500/5 px-4 py-3 text-sm text-ember-400">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-md border border-ice-500/30 bg-ice-500/5 px-4 py-3 text-sm text-ice-300">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:cursor-default disabled:opacity-50"
      >
        {pending ? "Déclaration…" : "Déclarer le RDV"}
      </button>
    </form>
  );
}
