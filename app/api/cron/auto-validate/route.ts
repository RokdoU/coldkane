// Cron (toutes les heures) : valide automatiquement les RDV passés depuis 72h
// sans contestation, puis déclenche les payouts Stripe correspondants.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured, releaseMeetingPayout } from "@/lib/stripe";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: "Supabase non configuré" });
  }

  const db = supabaseAdmin();

  // La RPC valide en boucle (score + ledger, atomique par RDV) et renvoie les ids
  const { data: validatedIds, error } = await db.rpc("auto_validate_due_meetings");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Payouts Stripe pour les RDV tout juste validés
  let paid = 0;
  if (isStripeConfigured() && validatedIds?.length) {
    for (const meetingId of validatedIds as string[]) {
      const { data: meeting } = await db
        .from("meetings")
        .select(
          "id, caller_id, mission_id, callers!inner(stripe_account_id), missions!inner(price_per_meeting_cents)",
        )
        .eq("id", meetingId)
        .single();
      const accountId = (
        meeting?.callers as unknown as { stripe_account_id: string | null } | null
      )?.stripe_account_id;
      if (meeting && accountId) {
        const { transfer } = await releaseMeetingPayout({
          meetingId,
          missionId: meeting.mission_id,
          callerStripeAccountId: accountId,
          pricePerMeetingCents: (
            meeting.missions as unknown as { price_per_meeting_cents: number }
          ).price_per_meeting_cents,
        });
        await db
          .from("meetings")
          .update({ stripe_transfer_id: transfer.id })
          .eq("id", meetingId);
        paid++;
      }
    }
  }

  return NextResponse.json({ validated: validatedIds?.length ?? 0, paid });
}
