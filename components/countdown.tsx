"use client";

import { useEffect, useState } from "react";
import { Timer } from "./icons";

function remaining(deadline: string) {
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  return { h, m, s };
}

export function Countdown({ deadline }: { deadline: string }) {
  // null avant montage : le SSR et le premier rendu client affichent le
  // placeholder, ce qui évite un mismatch d'hydratation sur les secondes.
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setTime(remaining(deadline));
    const id = setInterval(() => setTime(remaining(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!mounted) {
    return (
      <span className="tnum inline-flex items-center gap-1.5 text-sm font-medium text-ember-400">
        <Timer className="h-3.5 w-3.5" />
        --h --m --s
      </span>
    );
  }
  if (!time) return <span className="text-sm text-foreground/40">Expiré</span>;

  return (
    <span className="tnum inline-flex items-center gap-1.5 text-sm font-medium text-ember-400">
      <Timer className="h-3.5 w-3.5" />
      {time.h}h {String(time.m).padStart(2, "0")}m {String(time.s).padStart(2, "0")}s
    </span>
  );
}
