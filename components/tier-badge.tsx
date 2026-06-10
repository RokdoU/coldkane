import type { Tier } from "@/lib/types";
import { TIER_LABELS } from "@/lib/ranking";
import { Star } from "./icons";

const TIER_STYLES: Record<Tier, string> = {
  bronze: "text-tier-bronze border-tier-bronze/30",
  argent: "text-tier-argent border-tier-argent/30",
  or: "text-tier-or border-tier-or/30",
  platine: "text-tier-platine border-tier-platine/30",
  diamant: "text-tier-diamant border-tier-diamant/30",
  legende: "text-tier-legende border-tier-legende/40 bg-tier-legende/5",
};

export function TierBadge({ tier, size = "md" }: { tier: Tier; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "px-2 py-0.5",
    md: "px-2.5 py-1",
    lg: "px-3.5 py-1.5",
  };
  return (
    <span
      className={`micro inline-flex items-center gap-1 rounded-full border ${TIER_STYLES[tier]} ${sizes[size]}`}
    >
      {tier === "legende" && <Star className="h-2.5 w-2.5 fill-current" />}
      {TIER_LABELS[tier]}
    </span>
  );
}
