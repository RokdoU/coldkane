"use client";

// Formulaire de dépôt de mission : calcule le budget escrow en direct.
// Le submit créera la mission (draft) puis redirigera vers le paiement Stripe
// une fois l'auth entreprise branchée — pour l'instant il prévisualise le récap.

import { useMemo, useState } from "react";
import { COMMISSION_RATE } from "@/lib/config";
import { formatEuros } from "@/lib/ranking";

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

export default function PosterMissionPage() {
  const [title, setTitle] = useState("");
  const [sector, setSector] = useState(SECTORS[0]);
  const [description, setDescription] = useState("");
  const [pricePerMeeting, setPricePerMeeting] = useState(120);
  const [meetingsTarget, setMeetingsTarget] = useState(10);
  const [isBounty, setIsBounty] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const budget = useMemo(
    () => pricePerMeeting * meetingsTarget * 100,
    [pricePerMeeting, meetingsTarget],
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-bold">Déposer une mission</h1>
      <p className="mt-2 text-slate-600">
        Décrivez votre cible, fixez votre prix par RDV. Le budget sera séquestré —
        vous ne payez que les RDV qui ont réellement lieu.
      </p>

      <form
        className="mt-10 space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label htmlFor="title" className="block text-sm font-semibold">
            Titre de la mission
          </label>
          <input
            id="title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex : RDV démo pour notre CRM — cible DAF de PME"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-900"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="sector" className="block text-sm font-semibold">
              Secteur
            </label>
            <select
              id="sector"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-900"
            >
              {SECTORS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex cursor-pointer items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={isBounty}
                onChange={(e) => setIsBounty(e.target.checked)}
                className="h-4 w-4"
              />
              <span>
                <span className="font-semibold">Mode bounty</span>
                <span className="block text-slate-500">
                  Fenêtre courte, prime majorée, visibilité maximale
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
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Qui faut-il joindre (poste, taille d'entreprise, zone) ? Qu'est-ce qui qualifie un bon RDV ?"
            className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-900"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="price" className="block text-sm font-semibold">
              Prix par RDV validé (€)
            </label>
            <input
              id="price"
              type="number"
              min={30}
              required
              value={pricePerMeeting}
              onChange={(e) => setPricePerMeeting(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-900"
            />
          </div>
          <div>
            <label htmlFor="target" className="block text-sm font-semibold">
              Nombre de RDV souhaités
            </label>
            <input
              id="target"
              type="number"
              min={1}
              required
              value={meetingsTarget}
              onChange={(e) => setMeetingsTarget(Number(e.target.value))}
              className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 outline-none transition focus:border-slate-900"
            />
          </div>
        </div>

        {/* Récap budget */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400">
            Récapitulatif
          </h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-600">Budget à séquestrer</dt>
              <dd className="font-bold">{formatEuros(budget)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-600">
                Dont commission plateforme ({Math.round(COMMISSION_RATE * 100)}%)
              </dt>
              <dd>{formatEuros(Math.round(budget * COMMISSION_RATE))}</dd>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2">
              <dt className="text-slate-600">Remboursé si objectif non atteint</dt>
              <dd className="font-semibold text-emerald-600">au prorata, automatique</dd>
            </div>
          </dl>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-6 py-3.5 font-semibold text-white transition hover:bg-slate-700"
        >
          Continuer vers le paiement sécurisé
        </button>

        {submitted && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            🚧 Le paiement escrow sera activé à la mise en production (Stripe Connect).
            Votre mission est prête : « {title} » — {meetingsTarget} RDV à{" "}
            {formatEuros(pricePerMeeting * 100)} ({sector}
            {isBounty ? ", bounty" : ""}).
          </p>
        )}
      </form>
    </main>
  );
}
