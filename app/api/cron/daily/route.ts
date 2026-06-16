// Cron quotidien groupé (contrainte Vercel Hobby : 2 crons max, quotidiens).
// Enchaîne les 3 boucles transactionnelles dans l'ordre qui se rattrape :
//   1. auto-validation des RDV échus (+ rappels + payouts)
//   2. résolution par défaut des litiges échus (+ payouts)
//   3. rattrapage des payouts encore orphelins (filet final)
// Sur plan Pro, repasser chaque boucle en cron horaire dédié (vercel.json).

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import {
  runAutoValidate,
  runAutoResolveDisputes,
  runRetryPayouts,
  runReferralPayouts,
  runApporteurPayouts,
} from "@/lib/cron-jobs";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: "Supabase non configuré" });
  }

  const db = supabaseAdmin();
  try {
    const autoValidate = await runAutoValidate(db);
    const disputes = await runAutoResolveDisputes(db);
    const retry = await runRetryPayouts(db);
    const referral = await runReferralPayouts(db);
    const apporteur = await runApporteurPayouts(db);
    return NextResponse.json({ autoValidate, disputes, retry, referral, apporteur });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
