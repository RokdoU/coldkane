// Validation d'un RDV : RPC atomique (score + ledger) puis payout Stripe.
// Utilisée par l'action de validation entreprise, le cron d'auto-validation
// et la route API interne.

import { supabaseAdmin } from "./supabase";
import { isStripeConfigured, releaseMeetingPayout } from "./stripe";
import { COMMISSION_RATE } from "./config";

export async function validateMeetingAndPay(
  meetingId: string,
  validatedBy: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = supabaseAdmin();

  const { data: meeting, error } = await db.rpc("validate_meeting", {
    p_meeting_id: meetingId,
    p_validated_by: validatedBy,
    p_commission_rate: COMMISSION_RATE,
  });
  if (error) return { ok: false, error: error.message };

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
    // Pas de compte Connect : le RDV est validé et compté, le payout
    // partira quand le caller aura terminé son onboarding Stripe.
  }

  return { ok: true };
}
