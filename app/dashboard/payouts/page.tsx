// Onboarding Stripe Connect Express : sans compte, pas de virements.

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Nav, Footer } from "@/components/nav";
import { getSessionProfile, supabaseServer } from "@/lib/supabase-server";
import { isSupabaseConfigured } from "@/lib/supabase";
import {
  isStripeConfigured,
  createCallerAccount,
  createOnboardingLink,
} from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { DemoBanner } from "@/components/demo-banner";
import { ShieldCheck } from "@/components/icons";

export const metadata: Metadata = {
  title: "Mes virements",
};

async function startOnboarding() {
  "use server";
  const profile = await getSessionProfile();
  if (!profile || profile.role !== "caller") redirect("/connexion");
  if (!isStripeConfigured()) redirect("/dashboard/payouts?demo=1");

  const supabase = await supabaseServer();
  const { data: caller } = await supabase
    .from("callers")
    .select("stripe_account_id")
    .eq("profile_id", profile.id)
    .single();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let accountId = caller?.stripe_account_id;
  if (!accountId) {
    const account = await createCallerAccount(user?.email ?? "");
    accountId = account.id;
    await supabaseAdmin()
      .from("callers")
      .update({ stripe_account_id: accountId })
      .eq("profile_id", profile.id);
  }

  const link = await createOnboardingLink(
    accountId!,
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  );
  redirect(link.url);
}

export default async function PayoutsPage() {
  const profile = await getSessionProfile();
  const demo = !isSupabaseConfigured() || !isStripeConfigured();

  let hasAccount = false;
  if (profile && isSupabaseConfigured()) {
    const supabase = await supabaseServer();
    const { data } = await supabase
      .from("callers")
      .select("stripe_account_id")
      .eq("profile_id", profile.id)
      .single();
    hasAccount = Boolean(data?.stripe_account_id);
  }

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-14">
        {demo && <DemoBanner />}
        <h1 className="display text-3xl tracking-tight">Mes virements</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/45">
          Chaque RDV validé déclenche un virement automatique vers ton compte,
          via Stripe. Configuration en 5 minutes : identité + IBAN.
        </p>

        <section className="mt-8 rounded-xl border border-night-600 bg-night-800 p-6">
          {hasAccount ? (
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-ice-400" />
              <div>
                <p className="font-medium">Compte de virement configuré</p>
                <p className="mt-1 text-sm text-foreground/45">
                  Tes payouts partent automatiquement à chaque RDV validé. Tu
                  peux mettre à jour tes informations bancaires ci-dessous.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="font-medium">Aucun compte de virement</p>
              <p className="mt-1 text-sm leading-relaxed text-foreground/45">
                Tes RDV validés comptent pour ton score, mais l&apos;argent
                reste en attente tant que ton compte n&apos;est pas configuré.
              </p>
            </div>
          )}
          <form action={startOnboarding} className="mt-5">
            <button
              type="submit"
              className="w-full cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
            >
              {hasAccount ? "Mettre à jour mes informations" : "Configurer mes virements"}
            </button>
          </form>
          <p className="mt-3 text-xs text-foreground/30">
            Géré par Stripe — ColdKane n&apos;a jamais accès à ton IBAN.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
