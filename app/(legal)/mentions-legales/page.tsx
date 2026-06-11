import type { Metadata } from "next";

export const metadata: Metadata = { title: "Mentions légales" };

// À compléter avec la société une fois immatriculée.
export default function MentionsLegalesPage() {
  return (
    <>
      <h1 className="display">Mentions légales</h1>

      <h2>Éditeur</h2>
      <p>
        ColdKane — société en cours de constitution. Cette page sera complétée
        avec la dénomination sociale, le siège, le RCS et le capital dès
        l&apos;immatriculation.
      </p>

      <h2>Directeur de la publication</h2>
      <p>À compléter.</p>

      <h2>Hébergement</h2>
      <p>
        Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis —
        vercel.com. Données hébergées via Supabase (supabase.com).
      </p>

      <h2>Contact</h2>
      <p>À compléter (email de contact officiel).</p>
    </>
  );
}
