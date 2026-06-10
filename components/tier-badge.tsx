import type { Tier } from "@/lib/types";
import { TIER_LABELS } from "@/lib/ranking";
import { Star } from "./icons";

const TIER_STYLES: Record<Tier, string> = {
  bronze: "bg-tier-bronze/10 text-tier-bronze border-tier-bronze/50",
  argent: "bg-tier-argent/10 text-tier-argent border-tier-argent/50",
  or: "bg-tier-or/10 text-tier-or border-tier-or/50",
  platine: "bg-tier-platine/10 text-tier-platine border-tier-platine/50",
  diamant: "bg-tier-diamant/10 text-tier-diamant border-tier-diamant/50",
  legende: "bg-tier-legende/15 text-tier-legende border-tier-legende/60",
};

export function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "px-2 py-0.5 text-[11px]",
    md: "px-2.5 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  };
  return (
    <span
      className={`cut-sm display inline-flex items-center gap-1 border font-medium tracking-wider ${TIER_STYLES[tier]} ${sizes[size]}`}
    >
      {tier === "legende" && <Star className="h-3 w-3 fill-current" />}
      {TIER_LABELS[tier]}
    </span>
  );
}
