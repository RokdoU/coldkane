// Données structurées schema.org (JSON-LD) — cœur du GEO (Generative Engine
// Optimization) : c'est ce que les moteurs IA (ChatGPT, Perplexity, Google AI
// Overviews, Claude…) lisent pour comprendre et CITER le site. Builders purs.

import { BRAND, COMMISSION_RATE } from "./config";
import { TIER_LABELS } from "./ranking";
import type { LadderEntry, Mission } from "./types";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://coldkane.vercel.app";

// Définition canonique de l'entité (réutilisée dans llms.txt / FAQ / about).
export const ENTITY_DESCRIPTION =
  "ColdKane est une marketplace française de prospection commerciale au résultat. " +
  "Des entreprises déposent des missions et séquestrent leur budget via un escrow Stripe ; " +
  "des cold callers indépendants — classés et vérifiés sur leurs résultats réels — prennent " +
  "ces missions et bookent des RDV qualifiés. L'entreprise ne paie que les RDV réellement obtenus.";

// =====================================================
// Organisation + site (injectés site-wide via le layout)
// =====================================================
export function organizationLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.name,
    url: SITE_URL,
    logo: `${SITE_URL}/api/og/logo`,
    image: `${SITE_URL}/api/og/default`,
    description: ENTITY_DESCRIPTION,
    slogan: BRAND.tagline,
    areaServed: { "@type": "Country", name: "France" },
    knowsLanguage: "fr-FR",
  };
}

export function websiteLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: BRAND.name,
    url: SITE_URL,
    inLanguage: "fr-FR",
    description: ENTITY_DESCRIPTION,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

// Le service vendu aux entreprises (page d'accueil / entreprises).
export function serviceLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "ColdKane — RDV commerciaux qualifiés payés au résultat",
    serviceType: "Prise de rendez-vous commerciaux (cold calling au résultat)",
    provider: { "@id": `${SITE_URL}/#organization` },
    areaServed: { "@type": "Country", name: "France" },
    description:
      "Déposez une mission, séquestrez votre budget via escrow Stripe, ne payez que les RDV " +
      "qualifiés réellement obtenus par des cold callers classés et vérifiés. Sans abonnement.",
    offers: {
      "@type": "Offer",
      priceCurrency: "EUR",
      description: `Paiement au RDV qualifié validé, commission plateforme de ${Math.round(
        COMMISSION_RATE * 100,
      )}% incluse. Sans abonnement ni engagement. Solde non consommé remboursé.`,
    },
  };
}

// =====================================================
// FAQ (answer-first → directement citable par les LLM)
// =====================================================
export interface QA {
  q: string;
  a: string;
}

export function faqLd(items: QA[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.a },
    })),
  };
}

// =====================================================
// Profil caller (/c/[username]) — ProfilePage + Person
// =====================================================
export function profileLd(entry: LadderEntry) {
  const url = `${SITE_URL}/c/${entry.caller.username}`;
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    dateModified: new Date().toISOString(),
    mainEntity: {
      "@type": "Person",
      name: entry.caller.username,
      url,
      jobTitle: "Cold caller",
      description: `Tier ${TIER_LABELS[entry.tier]}, rang #${entry.rank} cette saison — ${entry.points} points, ${entry.meetingsValidated} RDV qualifiés validés. Réputation vérifiée par escrow.`,
      memberOf: { "@id": `${SITE_URL}/#organization` },
    },
  };
}

// =====================================================
// Classement (/leaderboard) — ItemList ordonnée
// =====================================================
export function leaderboardLd(entries: LadderEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Classement public des cold callers ColdKane",
    itemListOrder: "https://schema.org/ItemListOrderDescending",
    numberOfItems: entries.length,
    itemListElement: entries.slice(0, 50).map((e) => ({
      "@type": "ListItem",
      position: e.rank,
      name: e.caller.username,
      url: `${SITE_URL}/c/${e.caller.username}`,
    })),
  };
}

// =====================================================
// Mission (/missions/[id]) — Offer
// =====================================================
export function missionOfferLd(mission: Mission) {
  return {
    "@context": "https://schema.org",
    "@type": "Offer",
    name: mission.title,
    category: "Prise de rendez-vous commercial qualifié",
    priceCurrency: "EUR",
    price: (mission.pricePerMeetingCents / 100).toFixed(2),
    availability: "https://schema.org/InStock",
    areaServed: { "@type": "Country", name: "France" },
    description: mission.description,
    seller: { "@type": "Organization", name: mission.companyName },
    offeredBy: { "@id": `${SITE_URL}/#organization` },
  };
}

// =====================================================
// Fil d'Ariane
// =====================================================
export function breadcrumbLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${SITE_URL}${it.path}`,
    })),
  };
}
