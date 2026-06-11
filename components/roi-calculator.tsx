"use client";

// Calculateur ROI : l'argument que les directeurs commerciaux partagent en
// interne pour vendre le projet à leur boss. Sobre — c'est la face entreprise.

import { useMemo, useState } from "react";
import { formatEuros } from "@/lib/ranking";

const CHARGES_RATE = 1.45; // coût chargé employeur ≈ brut × 1,45
const TOOLS_MONTHLY = 30000; // licences (séquenceur, data, téléphonie) ~300 €/mois

export function RoiCalculator() {
  const [grossSalary, setGrossSalary] = useState(2800); // brut mensuel SDR
  const [meetingsPerMonth, setMeetingsPerMonth] = useState(12);
  const [pricePerMeeting, setPricePerMeeting] = useState(150);

  const { internalCost, coldkaneCost, savings } = useMemo(() => {
    const monthlyCost = grossSalary * 100 * CHARGES_RATE + TOOLS_MONTHLY;
    const internal = Math.round(monthlyCost / Math.max(meetingsPerMonth, 1));
    const ck = pricePerMeeting * 100;
    return {
      internalCost: internal,
      coldkaneCost: ck,
      savings: internal - ck,
    };
  }, [grossSalary, meetingsPerMonth, pricePerMeeting]);

  const inputCls =
    "mt-2 w-full rounded-lg border border-slate-300 px-4 py-2.5 tabular-nums outline-none transition-colors duration-200 focus:border-slate-900";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-8">
      <h2 className="text-2xl font-bold">Combien vous coûte un RDV aujourd&apos;hui ?</h2>
      <p className="mt-2 text-slate-600">
        Comparez le coût réel d&apos;un RDV obtenu par un SDR interne avec le
        paiement au résultat.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="roi-salary" className="block text-sm font-semibold">
            Salaire brut mensuel SDR (€)
          </label>
          <input
            id="roi-salary"
            type="number"
            min={1500}
            max={10000}
            step={100}
            value={grossSalary}
            onChange={(e) => setGrossSalary(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="roi-meetings" className="block text-sm font-semibold">
            RDV qualifiés obtenus / mois
          </label>
          <input
            id="roi-meetings"
            type="number"
            min={1}
            max={60}
            value={meetingsPerMonth}
            onChange={(e) => setMeetingsPerMonth(Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="roi-price" className="block text-sm font-semibold">
            Prix par RDV sur ColdKane (€)
          </label>
          <input
            id="roi-price"
            type="number"
            min={30}
            max={1000}
            step={10}
            value={pricePerMeeting}
            onChange={(e) => setPricePerMeeting(Number(e.target.value))}
            className={inputCls}
          />
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Coût interne / RDV
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
            {formatEuros(internalCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            salaire chargé (×{CHARGES_RATE}) + outils
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Coût ColdKane / RDV
          </p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-900">
            {formatEuros(coldkaneCost)}
          </p>
          <p className="mt-1 text-xs text-slate-500">uniquement si le RDV a lieu</p>
        </div>
        <div
          className={`rounded-xl p-5 ${
            savings > 0
              ? "border border-emerald-200 bg-emerald-50"
              : "border border-slate-200 bg-slate-50"
          }`}
        >
          <p
            className={`text-xs font-bold uppercase tracking-wider ${
              savings > 0 ? "text-emerald-600" : "text-slate-400"
            }`}
          >
            {savings > 0 ? "Économie / RDV" : "Différence / RDV"}
          </p>
          <p
            className={`mt-2 text-2xl font-bold tabular-nums ${
              savings > 0 ? "text-emerald-700" : "text-slate-900"
            }`}
          >
            {savings > 0 ? formatEuros(savings) : formatEuros(Math.abs(savings))}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {savings > 0
              ? `soit ${formatEuros(savings * meetingsPerMonth)} / mois`
              : "à ce volume, l'interne reste compétitif"}
          </p>
        </div>
      </div>

      <p className="mt-6 text-xs leading-relaxed text-slate-400">
        Estimation indicative : coût chargé employeur ×{CHARGES_RATE}, outils de
        prospection ≈ {formatEuros(TOOLS_MONTHLY)}/mois. Sans compter le
        recrutement, l&apos;onboarding et le management.
      </p>
    </div>
  );
}
