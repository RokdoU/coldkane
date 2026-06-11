// Cron (quotidien) : si la saison active est arrivée à échéance, la clôture —
// badges du podium, désactivation, création de la saison suivante avec
// report partiel des points (placement).

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { SEASON_CARRYOVER } from "@/lib/config";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: "Supabase non configuré" });
  }

  const db = supabaseAdmin();
  const { data: season } = await db
    .from("seasons")
    .select("id, number, ends_at")
    .eq("is_active", true)
    .single();

  if (!season || new Date(season.ends_at).getTime() > Date.now()) {
    return NextResponse.json({ skipped: "saison en cours" });
  }

  const { data: nextSeasonId, error } = await db.rpc("close_season", {
    p_carryover: SEASON_CARRYOVER,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ closed: season.number, nextSeasonId });
}
