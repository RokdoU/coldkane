# ColdKane

**Le ladder des cold callers.** Marketplace gamifiée où les commerciaux buildent une réputation publique, vérifiée et impossible à truquer, en bookant des RDV pour des entreprises — paiement à la performance via escrow.

> Le "Strava des cold callers" : ranked à la Valorant, profils publics vérifiés, bounties FOMO, saisons. Le cash est l'hameçon, le statut est le crochet.

## Démarrage rapide

```bash
npm install
npm run dev
```

Ouvre [http://localhost:3000](http://localhost:3000). **Sans configuration, l'app tourne en mode démo** avec des données fictives (ladder, missions, profils) — parfait pour montrer le produit.

## Architecture

**Deux faces, un produit :**

| Face | Routes | Ambiance |
|---|---|---|
| Callers (publique) | `/` `/leaderboard` `/missions` `/c/[username]` | Dark, compétitive, hype |
| Entreprises | `/entreprises` `/entreprises/poster` | Claire, sobre, rassurante |

**Stack :** Next.js 16 (App Router) · TypeScript · Tailwind 4 · Supabase (Postgres + RLS + realtime) · Stripe Connect Express (escrow) · Vercel.

```
app/
  page.tsx                    # Landing hype + top ladder + bounties
  leaderboard/                # Classement complet + tiers
  c/[username]/               # Profil public vérifié (le CV vivant)
  missions/                   # Missions & bounties
  entreprises/                # Face B2B (layout clair séparé)
    poster/                   # Dépôt de mission + calcul escrow
  api/
    meetings/validate/        # LA route critique : RDV validé → payout + score
    webhooks/stripe/          # Dépôt escrow confirmé → mission funded
lib/
  config.ts                   # Marque, commission (15%), règles de points
  ranking.ts                  # Tiers Bronze→Légende, progression, formats
  data.ts                     # Couche données : Supabase ou mode démo
  stripe.ts                   # Escrow : dépôt, onboarding Express, transfers
  supabase.ts                 # Clients public + service role
supabase/migrations/
  001_init.sql                # Schéma complet + RLS
  002_validate_meeting.sql    # Transaction atomique de validation (score+ledger)
```

## Le cœur du système : la validation d'un RDV

Un RDV validé (preuve calendrier + présence du prospect) déclenche **atomiquement** :

1. Statut `booked → validated`
2. Libération du payout vers le compte Stripe Connect du caller (prix − 15% de commission)
3. Écriture au ledger escrow (`release` + `commission`)
4. Points de saison : 100 pts + bonus de streak (+10/RDV consécutif, max +50)
5. Stats lifetime (le CV vivant)
6. Mission complétée si l'objectif est atteint

Tout est dans `validate_meeting()` (fonction Postgres, transaction unique) appelée par `POST /api/meetings/validate`.

**Anti-farming :** index unique sur le hash du contact prospect par mission (un prospect = un RDV comptabilisé), no-show = −30 pts + streak reset, validation par service role uniquement.

## Règles du ladder (saison)

- **Tiers :** Bronze 0 · Argent 300 · Or 800 · Platine 1500 · Diamant 2500 · **Légende = top 10 du ladder**
- **Saisons de 6 semaines**, reset partiel (on repart avec 20% de ses points)
- Modifiable dans `lib/config.ts` et `lib/ranking.ts`

## Mise en production

1. **Supabase** : créer un projet, exécuter `supabase/migrations/*.sql` dans l'ordre (SQL Editor), récupérer URL + clés.
2. **Stripe** : activer Connect (comptes Express), récupérer la clé secrète, créer un webhook → `/api/webhooks/stripe` (événements `payment_intent.succeeded`, `account.updated`).
3. Copier `.env.example` → `.env.local` et remplir.
4. Déployer sur Vercel (mêmes variables d'environnement).

Dès que les variables Supabase sont posées, `lib/data.ts` bascule automatiquement du mode démo aux vraies données.

## Reste à faire (V1)

- [ ] Auth Supabase (signup caller / entreprise) + onboarding
- [ ] Intégration calendrier (Google Calendar / Cal.com) pour la preuve de RDV
- [ ] Checkout Stripe sur le dépôt de mission (la route et le webhook sont prêts)
- [ ] Onboarding Stripe Connect des callers (`lib/stripe.ts` prêt)
- [ ] Realtime sur le leaderboard (Supabase channels)
- [ ] Back-office validation/litiges

**V2 (brief) :** clips brandés, squads/écuries, rookie spotlight, Cold Call Arena.

## Décisions à trancher (associés)

- Nom définitif (actuellement **ColdKane**, modifiable en un point : `lib/config.ts` → `BRAND`)
- Définition contractuelle précise d'un « RDV validé »
- Niveau et financement des récompenses de saison
- Vérifier dispo `.fr`/`.com` + antériorité INPI
