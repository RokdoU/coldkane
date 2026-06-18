import type { Metadata } from "next";
import { Suspense } from "react";
import { Nav, Footer } from "@/components/nav";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connecte-toi à ton espace ColdKane.",
  // Page utilitaire d'authentification : hors index.
  robots: { index: false, follow: true },
};

export default function ConnexionPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-md flex-1 px-4 py-20">
        <h1 className="display text-3xl tracking-tight">Connexion</h1>
        <p className="mt-2 text-sm text-foreground/45">
          Reprends ta place sur le ladder.
        </p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
