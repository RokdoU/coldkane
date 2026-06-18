import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Nav, Footer } from "@/components/nav";
import { Users } from "@/components/icons";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
  description:
    "Crée ton compte ColdKane : prends des missions de cold calling, encaisse à la validation et grimpe le classement public. Pas de CV, que des résultats.",
  alternates: { canonical: "/inscription" },
};

const USERNAME_RE = /^[a-z0-9_]{3,20}$/;

export default async function InscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  // Parrain : depuis ?ref, sinon depuis le cookie d'attribution posé par le
  // middleware (lien d'affiliation suivi depuis la home jusqu'au signup).
  let referredBy = ref && USERNAME_RE.test(ref) ? ref : null;
  if (!referredBy) {
    const cookieRef = (await cookies()).get("ck_ref")?.value;
    if (cookieRef && USERNAME_RE.test(cookieRef)) referredBy = cookieRef;
  }

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
