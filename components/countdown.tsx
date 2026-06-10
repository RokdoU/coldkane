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
  const [time, setTime] = useState(() => remaining(deadline));

  useEffect(() => {
    const id = setInterval(() => setTime(remaining(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (!time) return <span className="display text-sm text-foreground/40">Expiré</span>;

  return (
    <span className="display inline-flex items-center gap-1.5 text-sm text-ember-400">
      <Timer className="h-4 w-4" />
      {time.h}h {String(time.m).padStart(2, "0")}m {String(time.s).padStart(2, "0")}s
    </span>
  );
}
