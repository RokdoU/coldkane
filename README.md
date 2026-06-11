# ColdKane

**Le ladder des cold callers.** Marketplace gamifiée où les commerciaux buildent une réputation publique, vérifiée et impossible à truquer, en bookant des RDV pour des entreprises — paiement à la performance via escrow.

> Le "Strava des cold callers" : ranked, profils publics vérifiés, bounties, saisons. Le cash est l'hameçon, le statut est le crochet.

## État : V1

Tout le produit est codé et fonctionne en **mode démo** sans configuration (données fictives). Brancher Supabase + Stripe (checklist ci-dessous) active le mode réel : comptes, missions, escrow, payouts.

**Parcours complets implémentés :**

| Parcours | Détail |
|---|---|
| Inscription / connexion | Caller ou entreprise, profil créé par trigger Postgres |
| Entreprise dépose une mission | Formulaire → mission draft → checkout Stripe → webhook → mission financée |
| Caller postule | Candidature → acceptation/refus par l'entreprise |
| Caller déclare un RDV | Prospect dédupliqué par hash (anti-farming), date, mission |
| Validation du RDV | Par l'entreprise (1 clic) **ou automatique 72h après le RDV** si non contesté |
| RDV validé | Transaction SQL atomique : payout Stripe Connect + commission 15% + points + streak + ledger + badges |
| Contestation | Raison obligatoire, gel de la validation, arbitrage |
| Payouts caller | Onboarding Stripe Connect Express depuis le dashboard |
| Saisons | Clôture automatique (cron) : badges podium, reset partiel 20%, saison suivante |
| Viralité | Image OG dynamique par profil (carte joueur partageable), leaderboard temps réel |

## Démarrage

```bash
npm install
npm run dev   # mode démo immédiat
npm test      # tests de la logique de ranking/business
```

## Architecture

**Stack :** Next.js 16 (App Router, proxy) · TypeScript · Tailwind 4 · Supabase (Postgres, Auth, RLS, Realtime) · Stripe (Checkout + Connect Express) · Vercel (hosting + crons).

```
app/
  page.tsx, leaderboard/, missions/, c/[username]/   # face publique (dark)
  connexion/, inscription/                            # auth
  dashboard/                                          # caller : RDV, gains, payouts
  entreprises/                                        # face B2B (claire)
    dashboard/                                        # validation RDV, candidatures
    poster/                                           # dépôt mission → checkout
  (legal)/cgu, confidentialite, mentions-legales      # à faire relire par un avocat
  api/
    og/[username]/                                    # carte joueur en image OG
    cron/auto-validate, cron/close-season             # crons Vercel (vercel.json)
    webhooks/stripe/                                  # dépôt escrow → mission funded
    meetings/validate/                                # back-office (secret interne)
lib/
  config.ts                # marque, commission, règles de points — LE fichier à régler
  ranking.ts (+tests)      # tiers, progression
  actions/                 # server actions (auth, missions, RDV)
  dashboard-data.ts        # données dashboards (Supabase ou démo)
  meeting-validation.ts    # validation + payout (action, cron, API)
  stripe.ts, supabase*.ts
supabase/migrations/       # 001 schéma+RLS · 002 validate_meeting · 003 flux V1
proxy.ts                   # session + protection des dashboards
```

**Sécurité :** RLS sur toutes les tables, écritures sensibles uniquement via fonctions Postgres `security definer`, ownership vérifié dans chaque server action, emails de prospects jamais stockés en clair (hash SHA-256), crons et API internes protégés par secrets.

## Checklist de mise en production

1. **Supabase** — créer le projet, exécuter `supabase/migrations/001`, `002`, `003` dans l'ordre (SQL Editor). Activer Realtime sur la table `season_scores` (Database → Replication).
2. **Stripe** — activer Connect (Express). Créer le webhook → `https://<domaine>/api/webhooks/stripe` avec `payment_intent.succeeded` et `account.updated`.
3. **Vercel** — importer le repo, poser les variables de `.env.example` (Production + Preview). Les crons de `vercel.json` s'activent au déploiement.
4. **Vérifier le flux complet en mode test Stripe** : inscription entreprise → mission → paiement (carte test `4242…`) → inscription caller → candidature → acceptation → déclaration RDV → validation → vérifier le transfer dans le dashboard Stripe.
5. **Légal** — compléter les mentions légales (société), faire relire CGU + confidentialité.

## Décisions produit à trancher (associés)

- Nom définitif (`lib/config.ts` → `BRAND`, un seul endroit) + dépôt INPI + domaine.
- Montant des récompenses de saison et leur financement (cagnotte sur commission).
- Règles d'arbitrage des litiges (qui tranche, sous quel SLA).
- Intégration calendrier (Cal.com / Google Calendar) pour une preuve de RDV encore plus forte — la V1 fonctionne avec validation entreprise + auto-72h.

## V2 (brief)

Clips brandés TikTok/X, squads/écuries, rookie spotlight, Cold Call Arena (events live).
