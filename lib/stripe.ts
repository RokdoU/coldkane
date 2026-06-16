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

// 1. Dépôt escrow : l'entreprise séquestre le budget via Checkout hébergé.
// Les fonds restent sur le solde plateforme jusqu'à validation des RDV.
export async function createEscrowCheckout(params: {
  missionId: string;
  title: string;
  budgetCents: number;
  origin: string;
}) {
  return stripe().checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: params.budgetCents,
          product_data: {
            name: `Escrow mission — ${params.title}`,
            description:
              "Budget séquestré, libéré uniquement aux RDV validés. Solde non consommé remboursé.",
          },
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      metadata: { mission_id: params.missionId, kind: "escrow_deposit" },
    },
    metadata: { mission_id: params.missionId, kind: "escrow_deposit" },
    success_url: `${params.origin}/entreprises/dashboard?funded=1`,
    cancel_url: `${params.origin}/entreprises/dashboard?canceled=1`,
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
  const transfer = await stripe().transfers.create(
    {
      amount: payout,
      currency: "eur",
      destination: params.callerStripeAccountId,
      metadata: {
        meeting_id: params.meetingId,
        mission_id: params.missionId,
        commission_cents: String(commission),
      },
    },
    { idempotencyKey: `transfer-${params.meetingId}` },
  );
  return { transfer, payout, commission };
}

// 3b. Rev-share parrain : part des gains d'un filleul reversée à son parrain.
// Idempotency key = le RDV (un seul rev-share par RDV de filleul).
export async function createReferralTransfer(params: {
  meetingId: string;
  parrainStripeAccountId: string;
  amountCents: number;
}) {
  return stripe().transfers.create(
    {
      amount: params.amountCents,
      currency: "eur",
      destination: params.parrainStripeAccountId,
      metadata: { meeting_id: params.meetingId, kind: "referral_share" },
    },
    { idempotencyKey: `referral-${params.meetingId}` },
  );
}

// 3c. Prime d'apport : versée à l'apporteur quand l'entreprise ramenée active
// (1er dépôt escrow). Idempotency key = l'entreprise (une seule prime).
export async function createApporteurTransfer(params: {
  companyId: string;
  apporteurStripeAccountId: string;
  amountCents: number;
}) {
  return stripe().transfers.create(
    {
      amount: params.amountCents,
      currency: "eur",
      destination: params.apporteurStripeAccountId,
      metadata: { company_id: params.companyId, kind: "apporteur_bonus" },
    },
    { idempotencyKey: `apporteur-${params.companyId}` },
  );
}

// 4. Remboursement du budget non consommé (mission annulée/expirée).
// Idempotency key = le PaymentIntent (un seul escrow par mission) : un retry
// après timeout ne peut pas rembourser deux fois.
export async function refundRemainingBudget(paymentIntentId: string, amountCents: number) {
  return stripe().refunds.create(
    {
      payment_intent: paymentIntentId,
      amount: amountCents,
    },
    { idempotencyKey: `refund-${paymentIntentId}` },
  );
}
