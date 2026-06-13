// Cron (toutes les heures) : envoie le rappel « validation automatique dans
// ~48h » aux entreprises, valide automatiquement les RDV passés depuis 72h
// sans contestation, puis déclenche les payouts Stripe correspondants.

import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured, supabaseAdmin } from "@/lib/supabase";
import { isStripeConfigured, releaseMeetingPayout } from "@/lib/stripe";
import {
  isEmailConfigured,
  sendAutoValidationReminderEmail,
  sendMeetingValidatedEmails,
} from "@/lib/email";

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  }
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ skipped: "Supabase non configuré" });
  }

  const db = supabaseAdmin();

  // Rappel avant auto-validation : RDV encore "booked" qui basculeront dans
  // les 48h. reminder_sent_at garantit un seul envoi par RDV ; un échec
  // d'envoi laisse la colonne à null, le prochain passage du cron réessaie.
  let reminded = 0;
  if (isEmailConfigured()) {
    const { data: upcoming } = await db
      .from("meetings")
      .select(
        "id, prospect_company, scheduled_at, missions!inner(title, company_id, price_per_meeting_cents)",
      )
      .eq("status", "booked")
      .is("reminder_sent_at", null)
      .gte("auto_validate_at", new Date().toISOString())
      .lte("auto_validate_at", new Date(Date.now() + 48 * 3_600_000).toISOString());
    for (const meeting of upcoming ?? []) {
      const mission = meeting.missions as unknown as {
        title: string;
        company_id: string;
        price_per_meeting_cents: number;
      };
      const sent = await sendAutoValidationReminderEmail({
        companyId: mission.company_id,
        missionTitle: mission.title,
        prospectCompany: meeting.prospect_company,
        scheduledAt: meeting.scheduled_at,
        amountCents: mission.price_per_meeting_cents,
      });
      if (sent) {
        await db
          .from("meetings")
          .update({ reminder_sent_at: new Date().toISOString() })
          .eq("id", meeting.id);
        reminded++;
      }
    }
  }

  // La RPC valide en boucle (score + ledger, atomique par RDV) et renvoie les ids
  const { data: validatedIds, error } = await db.rpc("auto_validate_due_meetings");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Payouts Stripe pour les RDV tout juste validés. Un échec sur un RDV
  // n'arrête pas la boucle : le cron retry-payouts rattrape les manqués
  // (idempotency key Stripe = pas de double paie).
  let paid = 0;
  if (isStripeConfigured() && validatedIds?.length) {
    for (const meetingId of validatedIds as string[]) {
      const { data: meeting } = await db
        .from("meetings")
        .select(
          "id, caller_id, mission_id, callers!inner(stripe_account_id, payouts_enabled), missions!inner(price_per_meeting_cents)",
        )
        .eq("id", meetingId)
        .single();
      const caller = meeting?.callers as unknown as {
        stripe_account_id: string | null;
        payouts_enabled: boolean;
      } | null;
      if (meeting && caller?.stripe_account_id && caller.payouts_enabled) {
        try {
          const { transfer } = await releaseMeetingPayout({
            meetingId,
            missionId: meeting.mission_id,
            callerStripeAccountId: caller.stripe_account_id,
            pricePerMeetingCents: (
              meeting.missions as unknown as { price_per_meeting_cents: number }
            ).price_per_meeting_cents,
          });
          await db
            .from("meetings")
            .update({ stripe_transfer_id: transfer.id })
            .eq("id", meetingId);
          paid++;
        } catch (err) {
          console.error(`payout différé (meeting ${meetingId}) :`, err);
        }
      }
    }
  }

  // Notification « RDV validé » aux deux parties — l'auto-validation aussi :
  // le caller doit savoir qu'il a encaissé sans attendre de se reconnecter.
  if (isEmailConfigured() && validatedIds?.length) {
    for (const meetingId of validatedIds as string[]) {
      const { data: meeting } = await db
        .from("meetings")
        .select("mission_id, caller_id, prospect_company, payout_cents")
        .eq("id", meetingId)
        .single();
      if (meeting) await sendMeetingValidatedEmails(meeting);
    }
  }

  return NextResponse.json({ reminded, validated: validatedIds?.length ?? 0, paid });
}
