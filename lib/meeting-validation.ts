// Validation d'un RDV : RPC atomique (score + ledger) puis payout Stripe.
// Utilisée par l'action de validation entreprise, le cron d'auto-validation
// et la route API interne.

import { supabaseAdmin } from "./supabase";
import { isStripeConfigured, releaseMeetingPayout } from "./stripe";
import { sendMeetingValidatedEmails } from "./email";
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
      .select("stripe_account_id, payouts_enabled")
      .eq("profile_id", meeting.caller_id)
      .single();
    const { data: mission } = await db
      .from("missions")
      .select("price_per_meeting_cents")
      .eq("id", meeting.mission_id)
      .single();

    // Payout immédiat seulement si le compte Connect est prêt. Sinon, ou si
    // le transfer échoue (solde plateforme indispo ~J+7 après un dépôt,
    // réseau…), le RDV reste validé avec stripe_transfer_id null : le cron
    // retry-payouts le rattrape, idempotency key Stripe = pas de double paie.
    if (caller?.stripe_account_id && caller.payouts_enabled && mission) {
      try {
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
      } catch (err) {
        console.error(`payout différé (meeting ${meetingId}) :`, err);
      }
    }
  }

  // Notifications caller (payout net) + entreprise (récap) — jamais bloquant
  await sendMeetingValidatedEmails(meeting);

  return { ok: true };
}
