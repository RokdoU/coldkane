"use client";

// Formulaire de dépôt : calcul du budget en direct, soumission via server
// action → création de la mission puis redirection vers le checkout Stripe.

import { useActionState, useMemo, useState } from "react";
import { COMMISSION_RATE } from "@/lib/config";
import { formatEuros } from "@/lib/ranking";
import { createMission, type ActionState } from "@/lib/actions/missions";

const SECTORS = [
  "SaaS B2B",
  "Fintech",
  "Agence / SMMA",
  "Industrie / Logistique",
  "RH / Recrutement",
  "Cybersécurité",
  "Immobilier pro",
  "Autre",
];

const inputCls =
  "mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition-colors duration-200 focus:border-slate-900";

export function MissionForm() {
  const [pricePerMeeting, setPricePerMeeting] = useState(120);
  const [meetingsTarget, setMeetingsTarget] = useState(10);
  const [state, action, pending] = useActionState<ActionState, FormData>(createMission, {
    error: null,
  });

  const budget = useMemo(
    () => pricePerMeeting * meetingsTarget * 100,
    [pricePerMeeting, meetingsTarget],
  );

  return (
    <form action={action} className="mt-10 space-y-8">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold">
          Titre de la mission
        </label>
        <input
          id="title"
          name="title"
          required
          placeholder="Ex : RDV démo pour notre CRM — cible DAF de PME"
          className={inputCls}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sector" className="block text-sm font-semibold">
            Secteur
          </label>
          <select id="sector" name="sector" className={inputCls}>
            {SECTORS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-3 text-sm">
            <input type="checkbox" name="isBounty" className="h-4 w-4" />
            <span>
              <span className="font-semibold">Mode bounty</span>
              <span className="block text-slate-500">
                Fenêtre de 7 jours, visibilité maximale
              </span>
            </span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold">
          Cible & contexte
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Qui faut-il joindre (poste, taille d'entreprise, zone) ? Qu'est-ce qui qualifie un bon RDV ?"
          className={inputCls}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="pricePerMeeting" className="block text-sm font-semibold">
            Prix par RDV validé (€)
          </label>
          <input
            id="pricePerMeeting"
            name="pricePerMeeting"
            type="number"
            min={30}
            required
            value={pricePerMeeting}
            onChange={(e) => setPricePerMeeting(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="meetingsTarget" className="block text-sm font-semibold">
            Nombre de RDV souhaités
          </label>
          <input
            id="meetingsTarget"
            name="meetingsTarget"
            type="number"
            min={1}
            max={500}
            required
            value={meetingsTarget}
            onChange={(e) => setMeetingsTarget(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
          Récapitulatif
        </h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-600">Budget à séquestrer</dt>
            <dd className="font-bold tabular-nums">{formatEuros(budget)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-600">
              Dont commission plateforme ({Math.round(COMMISSION_RATE * 100)}%)
            </dt>
            <dd className="tabular-nums">{formatEuros(Math.round(budget * COMMISSION_RATE))}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2">
            <dt className="text-slate-600">Remboursé si objectif non atteint</dt>
            <dd className="font-semibold text-emerald-600">au prorata, automatique</dd>
          </div>
        </dl>
      </div>

      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full cursor-pointer rounded-md bg-slate-900 px-6 py-3.5 font-semibold text-white transition-colors duration-200 hover:bg-slate-700 disabled:cursor-default disabled:opacity-50"
      >
        {pending ? "Création…" : "Continuer vers le paiement sécurisé"}
      </button>
    </form>
  );
}
