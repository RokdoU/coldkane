"use client";

// Kill feed : les dernières validations défilent une par une — preuve sociale
// permanente que la plateforme est vivante. Sobre : une ligne, pas un carrousel.

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ValidationEvent } from "@/lib/data";
import { formatEuros } from "@/lib/ranking";

function timeAgo(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  return `il y a ${Math.round(hours / 24)} j`;
}

export function KillFeed({ events }: { events: ValidationEvent[] }) {
  const [index, setIndex] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (reduced || events.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % events.length), 4000);
    return () => clearInterval(t);
  }, [reduced, events.length]);

  if (events.length === 0) return null;
  const e = events[index];

  return (
    <div className="flex items-center gap-3 overflow-hidden rounded-lg border border-night-600 bg-night-800 px-4 py-2.5">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-ice-400 opacity-60 motion-reduce:hidden" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-ice-400" />
      </span>
      <p
        key={e.id}
        className="min-w-0 truncate text-sm text-foreground/60"
        style={{ animation: reduced ? undefined : "feed-in 0.3s ease-out" }}
      >
        <Link
          href={`/c/${e.callerUsername}`}
          className="cursor-pointer font-medium text-foreground/85 transition-colors duration-200 hover:text-ice-300"
        >
          @{e.callerUsername}
        </Link>{" "}
        vient de locker un RDV pour {e.companyName}
        {" — "}
        <span className="tnum font-semibold text-ice-300">
          +{formatEuros(e.payoutCents)}
        </span>
        <span className="ml-2 text-xs text-foreground/30">{timeAgo(e.validatedAt)}</span>
      </p>
    </div>
  );
}
