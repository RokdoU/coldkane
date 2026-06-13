"use client";

// Partage des wins : la carte du dernier payout, prête à poster.
// L'UGC vit sur les réseaux — on fournit l'image, le caller fait le reste.

import { useState } from "react";
import { formatEuros } from "@/lib/ranking";
import { Check, Copy, LinkedInLogo, XLogo } from "./icons";

export function WinShareCard({
  username,
  amountCents,
  eventId,
}: {
  username: string;
  amountCents: number;
  eventId: string;
}) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  // La carte référence l'événement réel en base : l'URL fonctionne = le payout existe
  const cardUrl = `${origin}/api/og/event/${eventId}`;
  const profileUrl = `${origin}/c/${username}`;
  const shareText = `+${formatEuros(amountCents)} encaissés sur ColdKane. RDV validé, payé à la validation. Le ladder ne ment pas.`;

  const copy = async () => {
    await navigator.clipboard.writeText(`${shareText} ${profileUrl}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;

  const btnCls =
    "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-2.5 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground";

  return (
    <div className="rounded-xl border border-night-600 bg-night-800 p-6">
      <h2 className="display text-lg">Partage tes wins</h2>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
        Ton dernier payout, en carte. Télécharge-la, poste-la — chaque win
        partagé est une preuve publique de plus.
      </p>

      {/* Aperçu de la carte événement (image OG, ratio 1200×630) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={cardUrl}
        alt={`Carte payout +${formatEuros(amountCents)} de @${username}`}
        width={1200}
        height={630}
        className="mt-5 w-full rounded-lg border border-night-600"
      />

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <XLogo className="h-3.5 w-3.5" />
          Partager sur X
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <LinkedInLogo className="h-3.5 w-3.5" />
          LinkedIn
        </a>
        <a href={cardUrl} download={`coldkane-payout-${username}.png`} className={btnCls}>
          Télécharger la carte
        </a>
        <button onClick={copy} className={btnCls}>
          {copied ? <Check className="h-3.5 w-3.5 text-ice-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier le texte"}
        </button>
      </div>
    </div>
  );
}
