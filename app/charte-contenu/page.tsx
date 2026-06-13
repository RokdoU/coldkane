import type { Metadata } from "next";
import { Nav, Footer } from "@/components/nav";

export const metadata: Metadata = { title: "Charte de contenu" };

// L'UGC vit sur TikTok/IG — ColdKane n'héberge aucune vidéo. Trois règles,
// pas vingt : protéger le prospect, libérer le caller. Même gabarit visuel
// que les pages légales (app/(legal)/layout.tsx).
export default function CharteContenuPage() {
  return (
    <>
      <Nav />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-14">
        <article className="space-y-6 text-sm leading-relaxed text-foreground/65 [&_h1]:text-3xl [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground">
          <h1 className="display">Charte de contenu</h1>
          <p>
            Tu te filmes en train de caller ? Très bien. C&apos;est comme ça
            que le ladder sort de la plateforme : tes calls, tes wins, ta
            progression — sur TikTok, Instagram, où tu veux. ColdKane
            n&apos;héberge aucune vidéo et n&apos;en demandera jamais. Trois
            règles, non négociables.
          </p>

          <h2>1. Jamais la voix du prospect identifiable</h2>
          <p>
            Si un prospect réel apparaît dans ton enregistrement, sa voix ne
            doit pas être reconnaissable. Coupe-la au montage, ne garde que ton
            côté de la conversation, ou modifie-la au point qu&apos;elle soit
            impossible à identifier. Un doute ? Coupe.
          </p>

          <h2>2. Jamais son nom, jamais son entreprise</h2>
          <p>
            Aucun nom de prospect, aucun nom d&apos;entreprise prospectée,
            aucun détail qui permettrait de remonter jusqu&apos;à eux (poste +
            ville + secteur, par exemple). Flouter un écran ne suffit pas si tu
            prononces le nom à voix haute. Le prospect n&apos;a pas signé pour
            devenir ton contenu.
          </p>

          <h2>3. Role-play libre et encouragé</h2>
          <p>
            Tu veux montrer ton pitch, ta gestion d&apos;objection, ton closing
            ? Rejoue la scène. Le role-play est sans limite : pas de vraie
            personne, pas de vraie donnée, donc aucune contrainte. C&apos;est
            le format le plus puissant — et le plus propre.
          </p>

          <h2>Ce qui se passe si tu ne respectes pas ça</h2>
          <p>
            Un contenu qui expose un prospect, c&apos;est une suspension du
            compte — mêmes règles que pour la fraude au classement. Ta
            réputation est vérifiée par escrow ; elle se détruit aussi vite
            qu&apos;elle se construit.
          </p>
        </article>
      </main>
      <Footer />
    </>
  );
}
