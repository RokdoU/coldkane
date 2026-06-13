// Cron (toutes les heures) : retente les payouts pour les RDV validés
// sans stripe_transfer_id — callers dont l'onboarding Connect n'était pas
// terminé au moment de la validation. L'idempotency key Stripe garantit
// qu'un même RDV n'est jamais payé deux fois même si le cron tourne plusieurs fois.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured, releaseMeetingPayout } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured() || !isStripeConfigured()) {
    return NextResponse.json({ skipped: "non configuré" });
  }

  const db = supabaseAdmin();

  const { data: orphans, error } = await db
    .from("meetings")
    .select(
      "id, mission_id, callers!inner(stripe_account_id, payouts_enabled), missions!inner(price_per_meeting_cents)",
    )
    .eq("status", "validated")
    .is("stripe_transfer_id", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let paid = 0;
  for (const meeting of orphans ?? []) {
    const caller = meeting.callers as unknown as {
      stripe_account_id: string | null;
      payouts_enabled: boolean;
    } | null;
    if (!caller?.payouts_enabled || !caller?.stripe_account_id) continue;

    // Un échec (solde plateforme indispo, réseau…) ne bloque pas les autres :
    // ce RDV sera retenté au prochain run, l'idempotency key protège du double.
    try {
      const { transfer } = await releaseMeetingPayout({
        meetingId: meeting.id,
        missionId: meeting.mission_id,
        callerStripeAccountId: caller.stripe_account_id,
        pricePerMeetingCents: (
          meeting.missions as unknown as { price_per_meeting_cents: number }
        ).price_per_meeting_cents,
      });
      await db
        .from("meetings")
        .update({ stripe_transfer_id: transfer.id })
        .eq("id", meeting.id);
      paid++;
    } catch (err) {
      console.error(`retry payout échoué (meeting ${meeting.id}) :`, err);
    }
  }

  return NextResponse.json({ retried: orphans?.length ?? 0, paid });
}
