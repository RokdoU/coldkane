import type { Metadata } from "next";
import Link from "next/link";
import { Nav, Footer } from "@/components/nav";
import { JsonLd } from "@/components/json-ld";
import { FAQ } from "@/lib/faq";
import { faqLd, breadcrumbLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  title: "FAQ — comment fonctionne ColdKane",
  description:
    "Tout sur ColdKane : prospection commerciale au résultat, paiement au RDV qualifié, escrow, classement public des cold callers. Réponses claires aux questions fréquentes.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <>
      <Nav />
      <JsonLd
        data={[
          faqLd(FAQ),
          breadcrumbLd([
            { name: "Accueil", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
        ]}
      />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="display text-3xl tracking-tight">Questions fréquentes</h1>
        <p className="mt-2 text-sm leading-relaxed text-foreground/50">
          Comment fonctionne ColdKane, en clair.
        </p>

        <div className="mt-10 divide-y divide-night-600">
          {FAQ.map((item) => (
            <section key={item.q} className="py-7">
              <h2 className="display text-lg leading-snug">{item.q}</h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/65">{item.a}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/missions"
            className="cursor-pointer rounded-md bg-foreground px-6 py-3 text-sm font-semibold text-background transition-opacity duration-200 hover:opacity-85"
          >
            Voir les missions
          </Link>
          <Link
            href="/entreprises"
            className="cursor-pointer rounded-md border border-night-500 px-6 py-3 text-sm font-medium text-foreground/75 transition-colors duration-200 hover:text-foreground"
          >
            Je suis une entreprise
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
