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

const MEETING_TYPES = [
  "Démo produit de 30 min (visio)",
  "Appel découverte de 20 min (téléphone)",
  "Rendez-vous physique chez le prospect",
  "Rendez-vous physique chez nous",
  "Démo + qualification budget (45 min)",
  "Autre",
];

const inputCls =
  "mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition-all duration-200 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/10";

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
        <label htmlFor="targetPersona" className="block text-sm font-semibold">
          Qui appeler <span className="font-normal text-slate-400">(affiché aux callers)</span>
        </label>
        <textarea
          id="targetPersona"
          name="targetPersona"
          rows={3}
          placeholder="Ex : DAF et DG de PME 20-200 salariés, secteur industrie ou négoce, France métropolitaine."
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="meetingType" className="block text-sm font-semibold">
          Type de RDV attendu
        </label>
        <select id="meetingType" name="meetingType" className={inputCls}>
          {MEETING_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold">
          Contexte de la mission <span className="font-normal text-slate-400">(affiché aux callers)</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          placeholder="Décris ton produit/service, le problème résolu, le ticket moyen. Les callers s'en serviront pour pitcher."
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="pitchNotes" className="block text-sm font-semibold">
          Notes de pitch <span className="font-normal text-slate-400">(optionnel — visibles après acceptation)</span>
        </label>
        <textarea
          id="pitchNotes"
          name="pitchNotes"
          rows={4}
          placeholder="Objections fréquentes et réponses, accroche qui marche, cas clients à mentionner..."
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

      <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 text-white">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-sky-500/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Budget à séquestrer
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">
              {formatEuros(budget)}
            </p>
          </div>
          <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
            Solde non consommé remboursé
          </span>
        </div>
        <dl className="relative mt-5 space-y-2 border-t border-white/10 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-slate-400">
              Dont commission plateforme ({Math.round(COMMISSION_RATE * 100)}%)
            </dt>
            <dd className="tabular-nums text-slate-200">
              {formatEuros(Math.round(budget * COMMISSION_RATE))}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-slate-400">Reversé aux callers (RDV validés)</dt>
            <dd className="tabular-nums text-slate-200">
              {formatEuros(budget - Math.round(budget * COMMISSION_RATE))}
            </dd>
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
