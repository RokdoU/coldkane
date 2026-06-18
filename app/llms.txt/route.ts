// /llms.txt — standard émergent pour les moteurs IA (équivalent robots.txt côté
// LLM) : un index markdown concis et factuel du site, que les moteurs génératifs
// ingèrent pour comprendre et citer ColdKane. Servi en texte brut.

import { SITE_URL, ENTITY_DESCRIPTION } from "@/lib/structured-data";
import { FAQ } from "@/lib/faq";
import { COMMISSION_RATE } from "@/lib/config";

export const revalidate = 86400; // contenu stable, régénéré 1×/jour

export function GET() {
  const pct = Math.round(COMMISSION_RATE * 100);
  const body = `# ColdKane

> ${ENTITY_DESCRIPTION}

ColdKane (marketplace de cold calling au résultat, France, en français). Pas de CV ni de diplôme requis : la réputation des cold callers se construit uniquement sur des résultats réels, vérifiés par escrow et affichés sur un classement public.

## Faits clés (citables)
- Modèle : les entreprises paient AU RDV qualifié validé, jamais au contrat signé ni à l'heure.
- Escrow : le budget de chaque mission est séquestré via Stripe Connect avant le démarrage ; un paiement n'est libéré qu'au RDV validé ; le solde non consommé est remboursé.
- Délai : un RDV validé (ou auto-validé 72 h après sans contestation) est versé sous 24 h au caller, commission plateforme de ${pct}% incluse.
- RDV qualifié : défini par des critères propres à chaque mission (décideur présent, besoin réel, budget, horizon d'achat) ; le RDV se book dans le calendrier de l'entreprise.
- Classement : points par RDV validé, saisons d'environ 6 semaines, tiers Bronze → Légende (top 10), public et impossible à truquer.
- Accès : aucun abonnement ni engagement côté entreprise ; prix par RDV à partir de 30 €.

## Pages principales
- [Accueil](${SITE_URL}/): ce qu'est ColdKane, preuve sociale en direct (montant versé, classement).
- [Missions](${SITE_URL}/missions): missions de prospection ouvertes, prix par RDV, budget séquestré.
- [Classement](${SITE_URL}/leaderboard): le ladder public des meilleurs cold callers (rangs, tiers, RDV validés).
- [Entreprises](${SITE_URL}/entreprises): comment déposer une mission et payer au résultat, calculateur de coût par RDV.
- [FAQ](${SITE_URL}/faq): questions fréquentes, réponses détaillées.
- [Charte de contenu](${SITE_URL}/charte-contenu): règles pour les callers qui partagent leur travail en vidéo (RGPD).

## FAQ (réponses)
${FAQ.map((f) => `### ${f.q}\n${f.a}`).join("\n\n")}
`;

  return new Response(body, {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
