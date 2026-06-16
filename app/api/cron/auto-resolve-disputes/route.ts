// Résolution automatique par défaut des litiges échus. Logique dans
// lib/cron-jobs.ts pour être aussi appelable par le cron quotidien groupé.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { runAutoResolveDisputes } from "@/lib/cron-jobs";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: "Supabase non configuré" });
  }
  try {
    return NextResponse.json(await runAutoResolveDisputes(supabaseAdmin()));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
