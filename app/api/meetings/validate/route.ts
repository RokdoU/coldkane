// POST /api/meetings/validate
// La transaction cœur du produit : un RDV prouvé (calendrier + présence)
// déclenche atomiquement le payout Stripe, la commission, le score et le ladder.
// Protégé par un secret interne : seul le système de validation (cron de
// vérification calendrier ou back-office) peut l'appeler.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";
import { isStripeConfigured, releaseMeetingPayout } from "@/lib/stripe";
import { COMMISSION_RATE } from "@/lib/config";

export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Supabase non configuré (mode démo)" },
      { status: 503 },
    );
  }

  const { meetingId, validatedBy } = await req.json();
  if (!meetingId) {
    return NextResponse.json({ error: "meetingId requis" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 1. Transaction SQL atomique : statut, score, streak, ledger, compteurs
  const { data: meeting, error } = await db.rpc("validate_meeting", {
    p_meeting_id: meetingId,
    p_validated_by: validatedBy ?? null,
    p_commission_rate: COMMISSION_RATE,
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  // 2. Payout Stripe vers le compte Connect du caller
  if (isStripeConfigured()) {
    const { data: caller } = await db
      .from("callers")
      .select("stripe_account_id")
      .eq("profile_id", meeting.caller_id)
      .single();
    const { data: mission } = await db
      .from("missions")
      .select("price_per_meeting_cents")
      .eq("id", meeting.mission_id)
      .single();

    if (caller?.stripe_account_id && mission) {
      const { transfer } = await releaseMeetingPayout({
        meetingId,
        missionId: meeting.mission_id,
        callerStripeAccountId: caller.stripe_account_id,
        pricePerMeetingCents: mission.price_per_meeting_cents,
      });
      await db
        .from("meetings")
        .update({ stripe_transfer_id: transfer.id })
        .eq("id", meetingId);
    }
  }

  return NextResponse.json({ ok: true, meeting });
}
