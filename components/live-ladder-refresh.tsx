"use client";

// Rafraîchit le classement en temps réel : à chaque changement de score
// (Supabase Realtime), le server component est re-rendu. Throttle 3s pour
// éviter le spam pendant les pics de fin de saison.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

export function LiveLadderRefresh() {
  const router = useRouter();
  const lastRefresh = useRef(0);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createClient(url, key);
    const channel = supabase
      .channel("ladder")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "season_scores" },
        () => {
          const now = Date.now();
          if (now - lastRefresh.current > 3000) {
            lastRefresh.current = now;
            router.refresh();
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
