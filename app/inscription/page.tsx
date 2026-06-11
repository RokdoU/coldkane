import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { Users } from "@/components/icons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // Le pseudo du parrain suit les mêmes règles que tous les usernames
  const referredBy = ref && /^[a-z0-9_]{3,20}$/.test(ref) ? ref : null;

  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-20">
        <h1 className="display text-3xl tracking-tight">Rejoindre ColdKane</h1>
        <p className="mt-2 text-sm text-foreground/45">
          Caller : grimpe le ladder. Entreprise : achète des RDV au résultat.
        </p>
        {referredBy && (
          <p className="mt-4 flex items-center gap-2 rounded-md border border-ice-500/25 bg-ice-500/5 px-4 py-2.5 text-sm text-ice-300">
            <Users className="h-3.5 w-3.5 shrink-0" />
            Invité par @{referredBy} — vous grimperez ensemble.
          </p>
        )}
        <SignupForm referredBy={referredBy} />
      </main>
      <Footer />
    </>
  );
}
