// Webhook Stripe : le dépôt escrow confirmé fait passer la mission en "funded".

import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { supabaseAdmin, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  if (!isStripeConfigured() || !isSupabaseConfigured()) {
    return NextResponse.json({ error: "non configuré" }, { status: 503 });
  }

  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    return NextResponse.json({ error: "signature manquante" }, { status: 400 });
  }

  let event;
  try {
    event = stripe().webhooks.constructEvent(await req.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "signature invalide" }, { status: 400 });
  }

  const db = supabaseAdmin();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const pi = event.data.object;
      const missionId = pi.metadata?.mission_id;
      if (missionId && pi.metadata?.kind === "escrow_deposit") {
        await db
          .from("missions")
          .update({ status: "funded", escrow_payment_intent_id: pi.id })
          .eq("id", missionId)
          .eq("status", "draft");
        await db.from("transactions").insert({
          mission_id: missionId,
          type: "deposit",
          amount_cents: pi.amount,
          stripe_ref: pi.id,
        });
      }
      break;
    }
    case "account.updated": {
      const account = event.data.object;
      await db
        .from("callers")
        .update({ payouts_enabled: Boolean(account.payouts_enabled) })
        .eq("stripe_account_id", account.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
