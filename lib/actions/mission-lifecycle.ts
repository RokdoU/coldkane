"use server";

// Clôture de mission côté entreprise : remboursement du budget non consommé
// puis passage en 'completed' (ou 'cancelled' si aucun RDV validé).
// missions.status est verrouillé par RLS (006) : écriture via service role
// après vérification explicite de l'ownership — pattern companyValidateMeeting.

import { revalidatePath } from "next/cache";
import { getSessionProfile } from "../supabase-server";
import { isSupabaseConfigured, supabaseAdmin } from "../supabase";
import { isStripeConfigured, refundRemainingBudget } from "../stripe";
import { formatEuros } from "../ranking";
import type { ActionState } from "./missions";

export async function closeMission(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!isSupabaseConfigured()) {
    return { error: "Mode démo : cette action sera activée à la mise en production." };
  }
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "company") return { error: "Non autorisé." };

  const missionId = String(formData.get("missionId") ?? "");
  if (!missionId) return { error: "Mission introuvable." };

  // Ownership vérifié explicitement avant tout appel service-role
  const db = supabaseAdmin();
  const { data: mission } = await db
    .from("missions")
    .select("id, company_id, status, budget_cents, escrow_payment_intent_id")
    .eq("id", missionId)
    .single();
  if (!mission || mission.company_id !== profile.id) {
    return { error: "Mission introuvable." };
  }
  if (!["funded", "active"].includes(mission.status)) {
    return { error: "Seule une mission financée ou active peut être clôturée." };
  }

  // Pas de clôture tant que des RDV sont en suspens : un 'booked' peut encore
  // être validé (payout dû), un 'disputed' attend l'arbitrage de l'équipe.
  const { count: openCount } = await db
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .in("status", ["booked", "disputed"]);
  if ((openCount ?? 0) > 0) {
    return {
      error:
        "Des RDV sont encore en attente ou contestés. Validez-les ou attendez l'arbitrage avant de clôturer.",
    };
  }

  // Budget consommé d'après le ledger : releases + commissions, et refunds
  // déjà émis (idempotence si une clôture précédente a échoué à mi-chemin).
  const { data: txs, error: txError } = await db
    .from("transactions")
    .select("amount_cents, type")
    .eq("mission_id", missionId)
    .in("type", ["release", "commission", "refund"]);
  if (txError) return { error: txError.message };
  const consumedCents = (txs ?? []).reduce((sum, t) => sum + t.amount_cents, 0);
  const remainingCents = mission.budget_cents - consumedCents;

  // Remboursement du solde non consommé sur le PaymentIntent escrow
  let refundedCents = 0;
  if (remainingCents > 0 && isStripeConfigured() && mission.escrow_payment_intent_id) {
    try {
      const refund = await refundRemainingBudget(
        mission.escrow_payment_intent_id,
        remainingCents,
      );
      await db.from("transactions").insert({
        mission_id: missionId,
        type: "refund",
        amount_cents: remainingCents,
        stripe_ref: refund.id,
      });
      refundedCents = remainingCents;
    } catch (err) {
      // Mission laissée ouverte : la clôture pourra être retentée
      console.error(`refund échoué (mission ${missionId}) :`, err);
      return { error: "Le remboursement Stripe a échoué. Réessayez dans quelques minutes." };
    }
  }

  // 'completed' si au moins un RDV a été validé, sinon 'cancelled'
  const { count: validatedCount } = await db
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("mission_id", missionId)
    .eq("status", "validated");
  const finalStatus = (validatedCount ?? 0) > 0 ? "completed" : "cancelled";

  const { error: updateError } = await db
    .from("missions")
    .update({ status: finalStatus })
    .eq("id", missionId);
  if (updateError) return { error: updateError.message };

  revalidatePath("/entreprises/dashboard");

  if (refundedCents > 0) {
    return {
      error: null,
      success: `Mission clôturée. ${formatEuros(refundedCents)} de budget non consommé remboursés sur votre moyen de paiement.`,
    };
  }
  if (remainingCents > 0) {
    // Stripe non configuré ou pas d'escrow : clôture sans remboursement
    return {
      error: null,
      success:
        "Mission clôturée. Le remboursement du solde sera traité dès que le paiement Stripe sera actif.",
    };
  }
  return { error: null, success: "Mission clôturée. Budget entièrement consommé, rien à rembourser." };
}
