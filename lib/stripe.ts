// Escrow via Stripe Connect Express.
// Flux : l'entreprise paie le budget (PaymentIntent, fonds chez la plateforme)
// → chaque RDV validé déclenche un Transfer vers le compte Connect du caller
// → la commission reste sur le solde plateforme. Anti-désintermédiation by design.

import Stripe from "stripe";
import { COMMISSION_RATE } from "./config";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function stripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY manquante");
  return new Stripe(key);
}

// 1. Dépôt escrow : l'entreprise séquestre le budget de la mission
export async function createEscrowDeposit(params: {
  missionId: string;
  budgetCents: number;
  companyCustomerId?: string;
}) {
  return stripe().paymentIntents.create({
    amount: params.budgetCents,
    currency: "eur",
    customer: params.companyCustomerId,
    metadata: { mission_id: params.missionId, kind: "escrow_deposit" },
    // les fonds restent sur le solde plateforme jusqu'à validation des RDV
    automatic_payment_methods: { enabled: true },
  });
}

// 2. Onboarding caller : compte Express + lien d'onboarding hébergé
export async function createCallerAccount(email: string) {
  const account = await stripe().accounts.create({
    type: "express",
    email,
    capabilities: { transfers: { requested: true } },
    business_type: "individual",
  });
  return account;
}

export async function createOnboardingLink(accountId: string, origin: string) {
  return stripe().accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/payouts?refresh=1`,
    return_url: `${origin}/dashboard/payouts?done=1`,
    type: "account_onboarding",
  });
}

// 3. Libération : RDV validé → transfer du payout net vers le caller
export async function releaseMeetingPayout(params: {
  meetingId: string;
  missionId: string;
  callerStripeAccountId: string;
  pricePerMeetingCents: number;
}) {
  const commission = Math.round(params.pricePerMeetingCents * COMMISSION_RATE);
  const payout = params.pricePerMeetingCents - commission;
  const transfer = await stripe().transfers.create({
    amount: payout,
    currency: "eur",
    destination: params.callerStripeAccountId,
    metadata: {
      meeting_id: params.meetingId,
      mission_id: params.missionId,
      commission_cents: String(commission),
    },
  });
  return { transfer, payout, commission };
}

// 4. Remboursement du budget non consommé (mission annulée/expirée)
export async function refundRemainingBudget(paymentIntentId: string, amountCents: number) {
  return stripe().refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
  });
}
