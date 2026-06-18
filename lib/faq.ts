// FAQ canonique, partagée entre la page /faq et la home. Réponses « answer-first »
// (factuelles, autonomes, sans contexte implicite) : format optimal pour être
// repris/cité par les moteurs génératifs.

import type { QA } from "./structured-data";
import { COMMISSION_RATE } from "./config";

const COMMISSION_PCT = Math.round(COMMISSION_RATE * 100);

export const FAQ: QA[] = [
  {
    q: "Qu'est-ce que ColdKane ?",
    a: "ColdKane est une marketplace française de prospection commerciale au résultat. Des entreprises déposent des missions et séquestrent leur budget via un escrow Stripe ; des cold callers indépendants, classés et vérifiés sur leurs résultats réels, prennent ces missions et bookent des rendez-vous commerciaux qualifiés. L'entreprise ne paie que les RDV réellement obtenus.",
  },
  {
    q: "Comment les cold callers sont-ils payés sur ColdKane ?",
    a: `Au rendez-vous qualifié validé — ni à l'heure, ni au contrat signé. Dès qu'un RDV qualifié a eu lieu et qu'il est validé par l'entreprise (ou auto-validé 72 h après, sans contestation), le paiement est libéré de l'escrow et versé sous 24 h sur le compte du caller, commission plateforme de ${COMMISSION_PCT} % déduite.`,
  },
  {
    q: "Qu'est-ce qu'un RDV qualifié sur ColdKane ?",
    a: "Un RDV est qualifié selon des critères définis par l'entreprise pour chaque mission : décideur présent, besoin réel exprimé, budget et horizon d'achat. Le rendez-vous se book directement dans le calendrier de l'entreprise, qui le valide ou le conteste après coup.",
  },
  {
    q: "Combien coûte ColdKane pour une entreprise ?",
    a: `Aucun abonnement ni engagement. L'entreprise fixe son prix par RDV (30 € minimum), séquestre le budget correspondant via Stripe, et ne paie que les RDV validés. Le solde non consommé est remboursé automatiquement. La commission plateforme de ${COMMISSION_PCT} % est incluse dans le prix par RDV.`,
  },
  {
    q: "Comment fonctionne le classement (ladder) des cold callers ?",
    a: "Chaque RDV validé rapporte des points (100 de base, plus un bonus de série). Les callers sont classés par saison d'environ 6 semaines, en tiers Bronze, Argent, Or, Platine, Diamant puis Légende (top 10). Le classement est public et vérifié par escrow : chaque point correspond à un RDV réellement payé, donc impossible à truquer.",
  },
  {
    q: "Faut-il un diplôme ou de l'expérience pour devenir cold caller ?",
    a: "Non. ColdKane est volontairement méritocratique : pas de CV ni de diplôme requis. Un nouveau caller démarre avec un plafond de RDV ouverts simultanés, débloqué à la performance (RDV validés sans litige). La réputation se construit uniquement sur les résultats réels, affichés sur un profil public.",
  },
  {
    q: "Comment ColdKane garantit le paiement aux deux parties ?",
    a: "Le budget de chaque mission est séquestré via Stripe Connect avant que les callers ne commencent. Le paiement n'est libéré qu'au RDV validé. Le caller est ainsi certain d'être payé pour un RDV honoré, et l'entreprise certaine de ne payer que des résultats. En cas de litige, une procédure d'arbitrage tranche selon les critères de la mission.",
  },
  {
    q: "ColdKane est-il disponible en dehors de la France ?",
    a: "ColdKane est lancé en France, en français, pour des missions de prospection B2B sur le marché français.",
  },
];

// Sous-ensemble mis en avant sur la page d'accueil.
export const FAQ_HOME: QA[] = FAQ.slice(0, 5);
