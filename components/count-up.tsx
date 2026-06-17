"use client";

// Compteur animé (count-up) au montage. Respecte prefers-reduced-motion :
// affiche directement la valeur finale si l'utilisateur réduit les animations.
// mode "euros" : la valeur est en centimes ; "count" : un entier brut.

import { useEffect, useRef, useState } from "react";
import { formatEuros } from "@/lib/ranking";

export function CountUp({
  value,
  mode = "count",
  durationMs = 1100,
  className,
}: {
  value: number;
  mode?: "euros" | "count";
  durationMs?: number;
  className?: string;
}) {
  const [n, setN] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      setN(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min((t - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      setN(Math.round(value * eased));
      if (p < 1) ref.current = requestAnimationFrame(tick);
    };
    ref.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(ref.current);
  }, [value, durationMs]);

  return (
    <span className={className}>
      {mode === "euros" ? formatEuros(n) : n.toLocaleString("fr-FR")}
    </span>
  );
}
