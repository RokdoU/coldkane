"use client";

// Calculateur ROI : l'argument que les directeurs commerciaux partagent en
// interne pour vendre le projet à leur boss. Sliders + résultat mis en avant.

import { useMemo, useState } from "react";
import { formatEuros } from "@/lib/ranking";

const CHARGES_RATE = 1.45; // coût chargé employeur ≈ brut × 1,45
const TOOLS_MONTHLY = 30000; // licences (séquenceur, data, téléphonie) ~300 €/mois

function Slider({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  display: string;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="text-sm font-medium text-slate-600">
          {label}
        </label>
        <span className="text-sm font-bold tabular-nums text-slate-900">{display}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        aria-valuetext={display}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-600 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
      />
    </div>
  );
}

export function RoiCalculator() {
  const [grossSalary, setGrossSalary] = useState(2800);
  const [meetingsPerMonth, setMeetingsPerMonth] = useState(12);
  const [pricePerMeeting, setPricePerMeeting] = useState(150);

  const { internalCost, coldkaneCost, savings } = useMemo(() => {
    const monthlyCost = grossSalary * 100 * CHARGES_RATE + TOOLS_MONTHLY;
    const internal = Math.round(monthlyCost / Math.max(meetingsPerMonth, 1));
    const ck = pricePerMeeting * 100;
    return { internalCost: internal, coldkaneCost: ck, savings: internal - ck };
  }, [grossSalary, meetingsPerMonth, pricePerMeeting]);

  const positive = savings > 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="grid lg:grid-cols-2">
        {/* Entrées */}
        <div className="p-8">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Combien vous coûte un RDV aujourd&apos;hui ?
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Comparez le coût réel d&apos;un RDV obtenu par un SDR interne avec le
            paiement au résultat.
          </p>

          <div className="mt-8 space-y-7">
            <Slider
              id="roi-salary"
              label="Salaire brut mensuel SDR"
              value={grossSalary}
              min={1500}
              max={6000}
              step={100}
              display={formatEuros(grossSalary * 100)}
              onChange={setGrossSalary}
            />
            <Slider
              id="roi-meetings"
              label="RDV qualifiés obtenus / mois"
              value={meetingsPerMonth}
              min={1}
              max={40}
              display={`${meetingsPerMonth} RDV`}
              onChange={setMeetingsPerMonth}
            />
            <Slider
              id="roi-price"
              label="Prix par RDV sur ColdKane"
              value={pricePerMeeting}
              min={30}
              max={500}
              step={10}
              display={formatEuros(pricePerMeeting * 100)}
              onChange={setPricePerMeeting}
            />
          </div>
        </div>

        {/* Résultat mis en avant */}
        <div className="relative flex flex-col justify-center overflow-hidden border-t border-slate-200 bg-slate-900 p-8 text-white lg:border-l lg:border-t-0">
          <div
            className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/30 to-sky-500/20 blur-3xl"
            aria-hidden
          />
          <div className="relative grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Coût interne / RDV
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatEuros(internalCost)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Coût ColdKane / RDV
              </p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatEuros(coldkaneCost)}</p>
            </div>
          </div>

          <div className="relative mt-8 border-t border-white/10 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {positive ? "Économie par RDV" : "Différence par RDV"}
            </p>
            <p
              className={`mt-1 text-5xl font-bold tabular-nums ${
                positive
                  ? "bg-gradient-to-r from-emerald-300 to-sky-300 bg-clip-text text-transparent"
                  : "text-white"
              }`}
            >
              {formatEuros(Math.abs(savings))}
            </p>
            <p className="mt-2 text-sm text-slate-300">
              {positive
                ? `soit ${formatEuros(savings * meetingsPerMonth)} économisés chaque mois`
                : "à ce volume, l'interne reste compétitif"}
            </p>
          </div>

          <p className="relative mt-6 text-xs leading-relaxed text-slate-500">
            Estimation : coût chargé ×{CHARGES_RATE} + outils ≈{" "}
            {formatEuros(TOOLS_MONTHLY)}/mois. Hors recrutement, onboarding et management.
          </p>
        </div>
      </div>
    </div>
  );
}
