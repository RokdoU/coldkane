// Rivalité personnelle : une cible nommée vaut mieux qu'un chiffre abstrait.

import Link from "next/link";
import type { RivalInfo } from "@/lib/data";
import { Crosshair } from "./icons";

export function RivalCard({ rival }: { rival: RivalInfo }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-ice-500/20 bg-ice-500/5 p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ice-500/10">
        <Crosshair className="h-4 w-4 text-ice-400" />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-foreground/75">
          Tu es à{" "}
          <span className="tnum font-semibold text-ice-300">
            {rival.pointsGap.toLocaleString("fr-FR")} pts
          </span>{" "}
          de dépasser{" "}
          <Link
            href={`/c/${rival.rivalUsername}`}
            className="cursor-pointer font-semibold text-foreground transition-colors duration-200 hover:text-ice-300"
          >
            @{rival.rivalUsername}
          </Link>
          {" — "}il reste{" "}
          <span className="tnum font-semibold">{rival.daysLeft} jours</span> dans la
          saison.
        </p>
        <p className="micro mt-1 text-foreground/35">
          Rang actuel : #{rival.myRank} · un RDV validé = 100 pts minimum
        </p>
      </div>
    </div>
  );
}
