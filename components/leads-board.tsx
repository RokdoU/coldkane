"use client";

// Pool de leads côté caller : réserver un compte disponible (lock anti-doublon)
// ou relâcher un lead réservé. Sourcing hybride — l'entreprise alimente le pool.

import { useState, useTransition } from "react";
import type { Lead } from "@/lib/types";
import { claimLead, releaseLead } from "@/lib/actions/leads";

function LeadCard({ lead }: { lead: Lead }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const mine = lead.status === "claimed" || lead.status === "contacted";

  const act = (fn: (id: string) => Promise<{ error: string | null }>) =>
    startTransition(async () => {
      const r = await fn(lead.id);
      setError(r?.error ?? null);
    });

  return (
    <div
      className={`rounded-lg border p-4 ${
        mine ? "border-ice-500/25 bg-ice-500/5" : "border-night-600 bg-night-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">{lead.accountName}</p>
          {lead.contactHint && (
            <p className="mt-0.5 text-xs text-foreground/45">{lead.contactHint}</p>
          )}
        </div>
        {lead.status === "contacted" ? (
          <span className="micro shrink-0 text-ice-400/80">RDV DÉCLARÉ</span>
        ) : mine ? (
          <span className="micro shrink-0 text-ice-400/80">RÉSERVÉ</span>
        ) : (
          <span className="micro shrink-0 text-foreground/30">LIBRE</span>
        )}
      </div>

      <p className="mt-1.5 text-xs text-foreground/30">{lead.missionTitle}</p>
      {lead.notes && (
        <p className="mt-2 text-xs leading-relaxed text-foreground/50">{lead.notes}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        {lead.status === "available" && (
          <button
            onClick={() => act(claimLead)}
            disabled={pending}
            className="cursor-pointer rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background transition-opacity duration-200 hover:opacity-85 disabled:opacity-50"
          >
            {pending ? "…" : "Réserver"}
          </button>
        )}
        {lead.status === "claimed" && (
          <button
            onClick={() => act(releaseLead)}
            disabled={pending}
            className="cursor-pointer text-xs text-foreground/40 underline-offset-2 transition-colors duration-200 hover:text-foreground/70 hover:underline disabled:opacity-50"
          >
            {pending ? "…" : "Relâcher"}
          </button>
        )}
        {error && <span className="text-xs text-red-400">{error}</span>}
      </div>
    </div>
  );
}

export function LeadsBoard({ leads }: { leads: Lead[] }) {
  if (leads.length === 0) return null;
  const available = leads.filter((l) => l.status === "available");
  const mine = leads.filter((l) => l.status === "claimed" || l.status === "contacted");

  return (
    <section className="mt-6 rounded-xl border border-night-600 bg-night-800 p-6">
      <h2 className="display text-lg">Comptes à appeler</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
        Les comptes fournis par l&apos;entreprise. Réserve-en un avant d&apos;appeler —
        personne d&apos;autre ne pourra le travailler tant qu&apos;il est à toi.
      </p>

      {mine.length > 0 && (
        <>
          <h3 className="micro mt-5 text-foreground/40">Mes leads réservés</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {mine.map((l) => (
              <LeadCard key={l.id} lead={l} />
            ))}
          </div>
        </>
      )}

      {available.length > 0 && (
        <>
          <h3 className="micro mt-5 text-foreground/40">À réserver ({available.length})</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {available.map((l) => (
              <LeadCard key={l.id} lead={l} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
