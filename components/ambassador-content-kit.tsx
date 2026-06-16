"use client";

// Kit de contenu : des accroches prêtes à poster, déjà au bon ton. L'UGC vit
// sur les réseaux — on enlève la friction « quoi écrire » à l'ambassadeur.
// Chaque accroche embarque le lien d'affiliation (?ref=) pour l'attribution.

import { useState } from "react";
import { Check, Copy } from "./icons";

export function AmbassadorContentKit({ username }: { username: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = `${origin}/?ref=${encodeURIComponent(username)}`;

  // Accroches courtes, sobres, dans le ton du produit. Le lien clôt chaque post.
  const snippets = [
    `Le seul truc qui compte en cold call, c'est le résultat. ColdKane paie à la validation du RDV et affiche un classement que personne ne peut truquer. Tu veux te mesurer ? ${link}`,
    `Pas de CV, pas de diplôme. Tu bookes, c'est validé, tu encaisses. C'est tout. Viens voir où tu te situes : ${link}`,
    `J'ai arrêté de vendre mes RDV à l'aveugle. Sur ColdKane c'est sous escrow, payé direct à la validation. Rejoins-moi : ${link}`,
  ];

  const copy = async (text: string, i: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(i);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="mt-4 flex flex-col gap-3">
      {snippets.map((text, i) => (
        <div
          key={i}
          className="rounded-md border border-night-600 bg-night-700 p-3.5"
        >
          <p className="text-xs leading-relaxed text-foreground/55">{text}</p>
          <button
            onClick={() => copy(text, i)}
            className="mt-2.5 flex cursor-pointer items-center gap-1.5 text-xs font-medium text-foreground/60 transition-colors duration-200 hover:text-foreground"
          >
            {copiedIndex === i ? (
              <Check className="h-3 w-3 text-ice-400" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
            {copiedIndex === i ? "Copié" : "Copier le post"}
          </button>
        </div>
      ))}
    </div>
  );
}
