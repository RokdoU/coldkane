import type { Metadata } from "next";

export const metadata: Metadata = { title: "Politique de confidentialité" };

// Trame solide à faire relire par un avocat / DPO avant le lancement commercial.
export default function ConfidentialitePage() {
  return (
    <>
      <h1 className="display">Politique de confidentialité</h1>
      <p>Dernière mise à jour : juin 2026 — version préliminaire.</p>

      <h2>1. Responsable de traitement</h2>
      <p>
        ColdKane (coordonnées dans les mentions légales) traite les données
        décrites ci-dessous pour fournir la place de marché et garantir
        l&apos;intégrité du classement.
      </p>

      <h2>2. Données des utilisateurs</h2>
      <p>
        Comptes : email, nom, pseudo, rôle, données de connexion. Callers :
        statistiques de performance (rendez-vous, points, badges) — publiques
        par nature, c&apos;est l&apos;objet du service. Paiements : gérés par
        Stripe ; ColdKane n&apos;accède jamais aux coordonnées bancaires
        complètes.
      </p>

      <h2>3. Données des prospects</h2>
      <p>
        Lorsqu&apos;un caller déclare un rendez-vous, la plateforme enregistre
        le nom de l&apos;entreprise prospectée et une empreinte cryptographique
        (hash SHA-256) de l&apos;email du contact — jamais l&apos;email en
        clair. Cette empreinte sert exclusivement à empêcher la comptabilisation
        multiple d&apos;un même prospect. Aucune donnée de prospect n&apos;est
        publiée. Aucun enregistrement d&apos;appel avec un prospect réel
        n&apos;est diffusé par la plateforme.
      </p>

      <h2>4. Durées de conservation</h2>
      <p>
        Données de compte : durée de vie du compte + 3 ans. Données de
        facturation : 10 ans (obligation légale). Empreintes de prospects :
        durée de la mission + 12 mois (anti-fraude).
      </p>

      <h2>5. Sous-traitants</h2>
      <p>
        Hébergement : Vercel. Base de données et authentification : Supabase.
        Paiements : Stripe. Chacun présente des garanties de conformité RGPD
        (clauses contractuelles types pour les transferts hors UE).
      </p>

      <h2>6. Vos droits</h2>
      <p>
        Accès, rectification, effacement, portabilité, opposition : écrivez à
        l&apos;adresse indiquée dans les mentions légales. Vous pouvez saisir la
        CNIL si vous estimez vos droits non respectés. Les statistiques de
        performance liées à des missions payées peuvent être conservées sous
        forme agrégée après suppression du compte (intégrité de
        l&apos;historique des classements).
      </p>
    </>
  );
}
