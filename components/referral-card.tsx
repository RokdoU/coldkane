"use client";

import { useState } from "react";
import Link from "next/link";
import { REFERRAL } from "@/lib/config";
import { ArrowRight, Check, Copy, Users } from "./icons";

export function ReferralCard({ username }: { username: string }) {
  const [copied, setCopied] = useState(false);

  const referralUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/inscription?ref=${username}`;

  const copy = async () => {
    await navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-night-600 bg-night-800 p-6">
      <h2 className="display flex items-center gap-2 text-lg">
        <Users className="h-4 w-4 text-ice-400" />
        Recrute ton équipe
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-foreground/45">
        Touche{" "}
        <span className="font-semibold text-ice-300">
          {Math.round(REFERRAL.rate * 100)}% des gains
        </span>{" "}
        de chaque caller que tu recrutes pendant ses {REFERRAL.months} premiers
        mois. Les bons callers connaissent des bons callers.
      </p>
      <div className="mt-4 flex gap-2">
        <p className="tnum min-w-0 flex-1 truncate rounded-md border border-night-600 bg-night-700 px-3.5 py-2.5 text-xs text-foreground/50">
          {referralUrl}
        </p>
        <button
          onClick={copy}
          className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border border-night-500 px-3.5 py-2 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:border-night-400 hover:text-foreground"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-ice-400" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copié" : "Copier"}
        </button>
      </div>

      {/* Espace dédié : suivi des filleuls, gains générés, commission cumulée */}
      <Link
        href="/ambassadeur"
        className="mt-4 inline-flex cursor-pointer items-center gap-1.5 text-sm font-medium text-ice-400 transition-colors duration-200 hover:text-ice-300"
      >
        Voir mon espace ambassadeur
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
