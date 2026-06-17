// Carte de stat "degen" pour les callers : sombre, énergique, chiffre en
// dégradé lumineux, halo qui dérive et balayage diagonal. CSS only (pas de
// dépendance d'animation), respecte prefers-reduced-motion (cf. globals.css).
// Inspiration : StatCard animée (21st.dev), réimplémentée sur les tokens ColdKane.

import type { ComponentType } from "react";

type Accent = "ice" | "ember" | "legende";

const ACCENT: Record<Accent, { text: string; glow: string; ring: string }> = {
  ice: {
    text: "from-ice-300 via-foreground to-ice-400",
    glow: "bg-ice-400/20",
    ring: "group-hover:border-ice-500/40",
  },
  ember: {
    text: "from-ember-400 via-foreground to-ember-500",
    glow: "bg-ember-500/20",
    ring: "group-hover:border-ember-500/40",
  },
  legende: {
    text: "from-tier-legende via-foreground to-tier-legende",
    glow: "bg-tier-legende/20",
    ring: "group-hover:border-tier-legende/40",
  },
};

export function DegenStatCard({
  label,
  value,
  hint,
  accent = "ice",
  icon: Icon,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: Accent;
  icon?: ComponentType<{ className?: string }>;
}) {
  const a = ACCENT[accent];
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-night-600 bg-night-800 p-5 transition-colors duration-300">
      {/* Halo qui dérive */}
      <div
        className={`pointer-events-none absolute -left-6 -top-6 h-20 w-20 rounded-full blur-2xl ${a.glow} animate-halo-drift`}
        aria-hidden
      />
      {/* Balayage diagonal */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-sweep"
        aria-hidden
      />
      {/* Bord qui s'allume au survol */}
      <div
        className={`pointer-events-none absolute inset-0 rounded-2xl border border-transparent transition-colors duration-300 ${a.ring}`}
        aria-hidden
      />

      <div className="relative flex items-center justify-between">
        <span className="micro text-foreground/40">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-foreground/30" />}
      </div>

      <p
        className={`tnum relative mt-3 bg-gradient-to-r bg-clip-text text-3xl font-bold leading-none text-transparent ${a.text}`}
        style={{ fontFamily: "var(--font-grotesk), sans-serif", letterSpacing: "-0.02em" }}
      >
        {value}
      </p>

      {hint && (
        <p className="relative mt-2 text-xs text-foreground/45">
          <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${a.glow} animate-pulse-glow`} />
          {hint}
        </p>
      )}
    </div>
  );
}
