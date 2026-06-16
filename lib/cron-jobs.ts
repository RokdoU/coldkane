// Logique des crons transactionnels, extraite pour être appelable de deux façons :
//   - individuellement (routes /api/cron/* — pratiques pour un test manuel)
//   - groupée en un seul passage (/api/cron/daily)
// Contrainte Vercel Hobby : 2 crons max, fréquence quotidienne uniquement. On
// regroupe donc les 3 boucles transactionnelles dans un seul cron quotidien.
// (Passage au plan Pro = repasser chaque boucle en horaire, voir vercel.json.)

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isStripeConfigured,
  releaseMeetingPayout,
  createReferralTransfer,
  createApporteurTransfer,
} from "./stripe";
import {
  isEmailConfigured,
  sendAutoValidationReminderEmail,
  sendMeetingValidatedEmails,
  sendDisputeReminderEmails,
  sendDisputeResolvedEmails,
} from "./email";
import { COMMISSION_RATE, DISPUTE, REFERRAL, APPORTEUR } from "./config";

function addMonths(iso: string, months: number): number {
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  return d.getTime();
}

// Paie un RDV validé si le compte Connect du caller est prêt. Idempotent côté
// Stripe (idempotency key = meeting id) : peut être rejoué sans double paie.
// No-op si déjà payé, compte non prêt, ou Stripe non configuré.
async function payMeetingById(db: SupabaseClient, meetingId: string): Promise<boolean> {
  if (!isStripeConfigured()) return false;
  const { data: meeting } = await db
    .from("meetings")
    .select(
      "id, mission_id, stripe_transfer_id, callers!inner(stripe_account_id, payouts_enabled), missions!inner(price_per_meeting_cents)",
    )
    .eq("id", meetingId)
    .single();
  if (!meeting || meeting.stripe_transfer_id) return false;
  const caller = meeting.callers as unknown as {
    stripe_account_id: string | null;
    payouts_enabled: boolean;
  } | null;
  if (!caller?.stripe_account_id || !caller.payouts_enabled) return false;

  try {
    const { transfer } = await releaseMeetingPayout({
      meetingId: meeting.id,
      missionId: meeting.mission_id,
      callerStripeAccountId: caller.stripe_account_id,
      pricePerMeetingCents: (
        meeting.missions as unknown as { price_per_meeting_cents: number }
      ).price_per_meeting_cents,
    });
    await db.from("meetings").update({ stripe_transfer_id: transfer.id }).eq("id", meeting.id);
    return true;
  } catch (err) {
    console.error(`payout différé (meeting ${meetingId}) :`, err);
    return false;
  }
}

// Rappel ~48h avant auto-validation, validation des RDV échus, payouts associés.
export async function runAutoValidate(db: SupabaseClient) {
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
        prospectCompany: meeting.prospect_company as string,
        scheduledAt: meeting.scheduled_at as string,
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

  const { data: validatedIds, error } = await db.rpc("auto_validate_due_meetings");
  if (error) throw new Error(error.message);

  let paid = 0;
  for (const meetingId of (validatedIds ?? []) as string[]) {
    if (await payMeetingById(db, meetingId)) paid++;
    if (isEmailConfigured()) {
      const { data: meeting } = await db
        .from("meetings")
        .select("mission_id, caller_id, prospect_company, payout_cents")
        .eq("id", meetingId)
        .single();
      if (meeting) await sendMeetingValidatedEmails(meeting);
    }
  }

  return { reminded, validated: validatedIds?.length ?? 0, paid };
}

// Rappel imminent + résolution par défaut des litiges échus + payouts associés.
export async function runAutoResolveDisputes(db: SupabaseClient) {
  const now = Date.now();

  let reminded = 0;
  if (isEmailConfigured()) {
    const reminderThreshold = new Date(
      now - (DISPUTE.slaHours - DISPUTE.reminderBeforeHours) * 3_600_000,
    ).toISOString();
    const dueThreshold = new Date(now - DISPUTE.slaHours * 3_600_000).toISOString();
    const { data: approaching } = await db
      .from("meetings")
      .select("id")
      .eq("status", "disputed")
      .is("caller_evidence", null)
      .is("dispute_reminder_sent_at", null)
      .lte("disputed_at", reminderThreshold)
      .gt("disputed_at", dueThreshold);
    for (const m of approaching ?? []) {
      const sent = await sendDisputeReminderEmails(m.id);
      if (sent) {
        await db
          .from("meetings")
          .update({ dispute_reminder_sent_at: new Date().toISOString() })
          .eq("id", m.id);
        reminded++;
      }
    }
  }

  const { data: resolved, error } = await db.rpc("auto_resolve_due_disputes", {
    p_sla_hours: DISPUTE.slaHours,
    p_commission_rate: COMMISSION_RATE,
  });
  if (error) throw new Error(error.message);

  let paid = 0;
  for (const row of (resolved ?? []) as { meeting_id: string; outcome: string }[]) {
    if (row.outcome === "validated" && (await payMeetingById(db, row.meeting_id))) paid++;
    await sendDisputeResolvedEmails(row.meeting_id, row.outcome as "validated" | "cancelled");
  }

  return { reminded, resolved: resolved?.length ?? 0, paid };
}

// Rattrapage : RDV validés encore impayés (compte Connect devenu prêt depuis).
export async function runRetryPayouts(db: SupabaseClient) {
  const { data: orphans, error } = await db
    .from("meetings")
    .select("id")
    .eq("status", "validated")
    .is("stripe_transfer_id", null);
  if (error) throw new Error(error.message);

  let paid = 0;
  for (const meeting of orphans ?? []) {
    if (await payMeetingById(db, meeting.id)) paid++;
  }
  return { retried: orphans?.length ?? 0, paid };
}

// Rev-share parrain : pour chaque RDV validé d'un filleul (dans sa fenêtre de
// REFERRAL.months), verse REFERRAL.rate du payout au parrain. referral_transfer_id
// garantit un seul versement par RDV ; sentinelle 'out_of_window' pour ne pas
// re-scanner indéfiniment les RDV hors fenêtre. Versement seulement si le compte
// Connect du parrain est prêt (sinon retenté au prochain passage).
export async function runReferralPayouts(db: SupabaseClient) {
  if (!isStripeConfigured()) return { eligible: 0, paid: 0 };

  // RDV validés non encore traités. caller_id = profiles.id (les sentinelles
  // bornent le scan : un RDV traité ou sans parrain n'est plus repris).
  const { data: rows, error } = await db
    .from("meetings")
    .select("id, caller_id, payout_cents, validated_at")
    .eq("status", "validated")
    .is("referral_transfer_id", null);
  if (error) throw new Error(error.message);

  const seal = (id: string, value: string) =>
    db.from("meetings").update({ referral_transfer_id: value }).eq("id", id);

  let paid = 0;
  for (const row of rows ?? []) {
    const { data: filleul } = await db
      .from("profiles")
      .select("referred_by, created_at")
      .eq("id", row.caller_id)
      .single();

    // Pas de parrain → sentinelle, plus jamais re-scanné
    if (!filleul?.referred_by) {
      await seal(row.id as string, "no_referral");
      continue;
    }
    const payout = (row.payout_cents as number) ?? 0;
    const amount = Math.round(payout * REFERRAL.rate);

    // Hors fenêtre de parrainage ou montant nul → sentinelle
    if (
      !row.validated_at ||
      amount <= 0 ||
      new Date(row.validated_at as string).getTime() > addMonths(filleul.created_at, REFERRAL.months)
    ) {
      await seal(row.id as string, "out_of_window");
      continue;
    }

    const { data: parrain } = await db
      .from("callers")
      .select("stripe_account_id, payouts_enabled")
      .eq("profile_id", filleul.referred_by)
      .single();
    if (!parrain?.stripe_account_id || !parrain.payouts_enabled) continue; // retenté plus tard

    try {
      const transfer = await createReferralTransfer({
        meetingId: row.id as string,
        parrainStripeAccountId: parrain.stripe_account_id,
        amountCents: amount,
      });
      await seal(row.id as string, transfer.id);
      paid++;
    } catch (err) {
      console.error(`rev-share différé (meeting ${row.id}) :`, err);
    }
  }
  return { eligible: rows?.length ?? 0, paid };
}

// Prime d'apport : une entreprise ramenée (brought_by) qui a déposé un escrow
// suffisant dans sa fenêtre d'attribution active l'apporteur. Versement unique
// (apporteur_rewarded_at), badge « Génération Fondatrice » en saison 0-1.
export async function runApporteurPayouts(db: SupabaseClient) {
  if (!isStripeConfigured()) return { eligible: 0, paid: 0 };

  const { data: companies, error } = await db
    .from("companies")
    .select("profile_id, brought_by, created_at")
    .not("brought_by", "is", null)
    .is("apporteur_rewarded_at", null);
  if (error) throw new Error(error.message);

  let paid = 0;
  for (const company of companies ?? []) {
    const windowEnd = new Date(company.created_at as string).getTime() +
      APPORTEUR.attributionWindowDays * 86_400_000;

    // L'entreprise a-t-elle déposé un escrow suffisant dans la fenêtre ?
    const { data: deposits } = await db
      .from("transactions")
      .select("amount_cents, created_at, missions!inner(company_id)")
      .eq("type", "deposit")
      .eq("missions.company_id", company.profile_id);
    const activated = (deposits ?? []).some(
      (d) =>
        (d.amount_cents as number) >= APPORTEUR.minEscrowCents &&
        new Date(d.created_at as string).getTime() <= windowEnd,
    );
    if (!activated) continue;

    const { data: apporteur } = await db
      .from("callers")
      .select("stripe_account_id, payouts_enabled")
      .eq("profile_id", company.brought_by)
      .single();
    if (!apporteur?.stripe_account_id || !apporteur.payouts_enabled) continue; // retenté plus tard

    try {
      await createApporteurTransfer({
        companyId: company.profile_id as string,
        apporteurStripeAccountId: apporteur.stripe_account_id,
        amountCents: APPORTEUR.activationBonusCents,
      });
      await db
        .from("companies")
        .update({ apporteur_rewarded_at: new Date().toISOString() })
        .eq("profile_id", company.profile_id);
      await awardFoundingBadge(db, company.brought_by as string);
      paid++;
    } catch (err) {
      console.error(`prime apporteur différée (company ${company.profile_id}) :`, err);
    }
  }
  return { eligible: companies?.length ?? 0, paid };
}

// Badge « Génération Fondatrice » : décerné uniquement si la saison active est
// la saison 0 ou 1 (rareté temporelle). No-op au-delà.
async function awardFoundingBadge(db: SupabaseClient, callerId: string) {
  const { data: season } = await db
    .from("seasons")
    .select("id, number")
    .eq("is_active", true)
    .single();
  if (!season || (season.number as number) > 1) return;
  const { data: badge } = await db
    .from("badges")
    .select("id")
    .eq("slug", "founding-generation")
    .single();
  if (!badge) return;
  await db
    .from("caller_badges")
    .upsert(
      { caller_id: callerId, badge_id: badge.id, season_id: season.id },
      { onConflict: "caller_id,badge_id", ignoreDuplicates: true },
    );
}
