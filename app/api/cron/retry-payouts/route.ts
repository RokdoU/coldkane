// Rattrapage des payouts orphelins. Logique dans lib/cron-jobs.ts.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured } from "@/lib/stripe";
import { runRetryPayouts } from "@/lib/cron-jobs";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ skipped: "non configuré" });
  }
  try {
    return NextResponse.json(await runRetryPayouts(supabaseAdmin()));
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
