import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";
import { SignupForm } from "./signup-form";

export const metadata: Metadata = {
  title: "Inscription",
};

export default function InscriptionPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-20">
        <h1 className="display text-3xl tracking-tight">Rejoindre ColdKane</h1>
        <p className="mt-2 text-sm text-foreground/45">
          Caller : grimpe le ladder. Entreprise : achète des RDV au résultat.
        </p>
        <SignupForm />
      </main>
      <Footer />
    </>
  );
}
