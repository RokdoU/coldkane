"use client";

// Lien d'affiliation copiable + partage. L'ambassadeur poste son lien, le clic
// est tracké, l'inscription devient un filleul. On lui donne les armes ; la
// carte OG /api/og/ambassador/<username> s'affiche quand le lien est collé.

import { useState } from "react";
import { Check, Copy, LinkedInLogo, XLogo } from "./icons";

export function AmbassadorLink({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/?ref=${encodeURIComponent(username)}`;
  const shareText =
    "Je passe au niveau au-dessus sur ColdKane. Rejoins-moi : RDV bookés, payés à la validation, classement public que personne ne truque.";

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(link)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`;

  const btnCls =
    "flex cursor-pointer items-center justify-center gap-2 rounded-md border border-night-500 px-4 py-2.5 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground";

  return (
    <div>
      <div className="flex gap-2">
        <p className="tnum min-w-0 flex-1 truncate rounded-md border border-night-600 bg-night-700 px-3.5 py-2.5 text-xs text-foreground/50">
          {link}
        </p>
        <button
          onClick={copy}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-night-500 px-3.5 py-2 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-ice-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <a href={xUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <XLogo className="h-3.5 w-3.5" />
          Partager sur X
        </a>
        <a href={linkedinUrl} target="_blank" rel="noopener noreferrer" className={btnCls}>
          <LinkedInLogo className="h-3.5 w-3.5" />
          LinkedIn
        </a>
      </div>
    </div>
  );
}
