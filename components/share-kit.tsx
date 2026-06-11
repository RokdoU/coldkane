"use client";

// Kit de partage : le profil est l'actif du caller — on lui donne les armes
// pour le poster partout. La carte OG fait le reste quand le lien est collé.

import { useState } from "react";
import { Check, Copy, LinkedInLogo, XLogo, ShieldCheck } from "./icons";

export function ShareKit({
  username,
  rank,
  tierLabel,
  meetingsValidated,
}: {
  username: string;
  rank: number;
  tierLabel: string;
  meetingsValidated: number;
}) {
  const [copied, setCopied] = useState<"link" | "badge" | null>(null);

  const profileUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${username}`;
  const shareText = `Rang #${rank} sur ColdKane cette saison. ${meetingsValidated} RDV validés, vérifiés par escrow. Viens me déloger.`;
  const badgeText = `ColdKane ${tierLabel} · ${meetingsValidated} RDV vérifiés → ${profileUrl}`;

  const copy = async (text: string, what: "link" | "badge") => {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  const btnCls =
    "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-2.5 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground";

  return (
    <div className="rounded-xl border border-night-600 bg-night-800 p-6">
      <h2 className="display text-lg">Flexe ton rang</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
        Ta carte joueur s&apos;affiche automatiquement quand tu colles ton lien
        sur X ou LinkedIn. Stats vérifiées par escrow — personne ne peut en dire autant.
      </p>

      <div className="mt-5 grid grid-cols-2 gap-2.5">
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <XLogo className="h-3.5 w-3.5" />
          Partager sur X
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <LinkedInLogo className="h-3.5 w-3.5" />
          LinkedIn
        </a>
        <button onClick={() => copy(profileUrl, "link")} className={btnCls}>
          {copied === "link" ? (
            <Check className="h-3.5 w-3.5 text-ice-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied === "link" ? "Copié" : "Copier le lien"}
        </button>
        <button onClick={() => copy(badgeText, "badge")} className={btnCls}>
          {copied === "badge" ? (
            <Check className="h-3.5 w-3.5 text-ice-400" />
          ) : (
            <ShieldCheck className="h-3.5 w-3.5" />
          )}
          {copied === "badge" ? "Copié" : "Badge bio LinkedIn"}
        </button>
      </div>

      <p className="mt-4 rounded-md border border-night-600 bg-night-700 px-3.5 py-2.5 text-xs leading-relaxed text-foreground/40">
        {badgeText}
      </p>
    </div>
  );
}
