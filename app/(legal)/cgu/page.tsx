import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation",
  description:
    "Les conditions générales d'utilisation de ColdKane : droits et obligations des cold callers et des entreprises sur la plateforme.",
  alternates: { canonical: "/cgu" },
};

// Trame solide à faire relire par un avocat avant le lancement commercial.
export default function CguPage() {
  return (
    <>
      <h1 className="display">Conditions générales d&apos;utilisation</h1>
      <p>Dernière mise à jour : juin 2026 — version préliminaire.</p>

      <h2>1. Objet</h2>
      <p>
        ColdKane est une place de marché mettant en relation des prospecteurs
        commerciaux indépendants (« callers ») et des entreprises clientes. Les
        entreprises déposent des missions de prise de rendez-vous ; les callers
        les réalisent ; la rémunération est conditionnée à la validation des
        rendez-vous obtenus.
      </p>

      <h2>2. Statut des callers</h2>
      <p>
        Les callers interviennent en qualité de professionnels indépendants. Ils
        sont seuls responsables de leur statut juridique, social et fiscal
        (micro-entreprise ou autre) et de la déclaration de leurs revenus.
        ColdKane n&apos;est l&apos;employeur d&apos;aucun caller.
      </p>

      <h2>3. Séquestre et paiement</h2>
      <p>
        Le budget d&apos;une mission est séquestré via notre prestataire de
        paiement Stripe au moment du dépôt. Chaque rendez-vous validé déclenche
        le versement au caller du prix unitaire convenu, déduction faite de la
        commission de la plateforme (15&nbsp;%). Le budget non consommé à la
        clôture d&apos;une mission est remboursé à l&apos;entreprise.
      </p>

      <h2>4. Validation des rendez-vous</h2>
      <p>
        Un rendez-vous déclaré est validé soit explicitement par
        l&apos;entreprise, soit automatiquement 72 heures après l&apos;horaire
        prévu en l&apos;absence de contestation. Une contestation motivée
        suspend la validation jusqu&apos;à arbitrage par ColdKane, dont la
        décision est rendue sous 48 heures ouvrées.
      </p>

      <h2>5. Intégrité du classement</h2>
      <p>
        Toute manipulation (faux rendez-vous, prospects fictifs, collusion,
        multi-comptes) entraîne la suspension du compte, l&apos;annulation des
        points et paiements concernés, et le cas échéant des poursuites. Les
        mécanismes anti-fraude incluent la déduplication des prospects et
        l&apos;analyse des taux de présence.
      </p>

      <h2>6. Données des prospects</h2>
      <p>
        Les callers s&apos;engagent à respecter la réglementation applicable à
        la prospection téléphonique (RGPD, opposition Bloctel le cas échéant).
        Les coordonnées des prospects ne sont jamais rendues publiques par la
        plateforme ; voir la politique de confidentialité.
      </p>

      <h2>7. Résiliation</h2>
      <p>
        Chaque partie peut fermer son compte à tout moment. Les missions en
        cours sont menées à terme ou remboursées au prorata. La réputation
        (points, badges, historique) est attachée au compte et n&apos;est ni
        cessible ni monnayable en dehors de la plateforme.
      </p>

      <h2>8. Droit applicable</h2>
      <p>
        Les présentes conditions sont régies par le droit français. Tout litige
        relève des tribunaux compétents du ressort du siège de la société
        éditrice, après tentative de résolution amiable.
      </p>
    </>
  );
}
