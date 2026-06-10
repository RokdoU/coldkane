import type { Tier } from "@/lib/types";
import { TIER_LABELS } from "@/lib/ranking";

const TIER_STYLES: Record<Tier, string> = {
  bronze: "bg-tier-bronze/15 text-tier-bronze border-tier-bronze/40",
  argent: "bg-tier-argent/15 text-tier-argent border-tier-argent/40",
  or: "bg-tier-or/15 text-tier-or border-tier-or/40",
  platine: "bg-tier-platine/15 text-tier-platine border-tier-platine/40",
  diamant: "bg-tier-diamant/15 text-tier-diamant border-tier-diamant/40",
  legende: "bg-tier-legende/15 text-tier-legende border-tier-legende/40",
};

export function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-semibold uppercase tracking-wide ${TIER_STYLES[tier]} ${sizes[size]}`}
    >
      {tier === "legende" && "★ "}
      {TIER_LABELS[tier]}
    </span>
  );
}
