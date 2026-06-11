# ColdKane — Brief associé

Ce document te met à niveau sur tout ce qui est fait, comment le déployer, et comment continuer à travailler dessus. Temps de lecture : ~15 min.

---

## Le projet en une phrase

**Une marketplace gamifiée de cold callers.** Les commerciaux créent un profil public, bookent des RDV pour des entreprises, sont payés à la performance via escrow Stripe — et gagnent des points, un rang, des badges. Le cash est l'hameçon, le statut est le crochet. "Le Strava des cold callers."

### Pourquoi ça tient

- **Côté caller :** revenus complémentaires vérifiés, réputation publique infalsifiable, compétition gamifiée.
- **Côté entreprise :** paiement uniquement si le RDV est honoré, pas de salaire fixe, pas d'agence. Budget séquestré avant le premier appel.
- **Côté plateforme :** commission 15% sur chaque RDV validé, prélevée automatiquement.

---

## État actuel : V1 complète, mode démo

L'app tourne sur [GitHub → RokdoU/coldkane](https://github.com/RokdoU/coldkane) et se déploie sur Vercel. Sans variables d'environnement, elle fonctionne en **mode démo** (données fictives, toutes les pages navigables). Brancher Supabase + Stripe active le mode réel.

### Ce qui est codé et fonctionne

| Parcours | Ce que ça fait concrètement |
|---|---|
| Inscription / connexion | Caller ou entreprise, profil créé automatiquement |
| Entreprise dépose une mission | Formulaire → budget séquestré via Stripe Checkout → mission en ligne |
| Pages de mission | Cliquer une mission → modal avec persona cible, type de RDV, contexte, notes de pitch |
| Caller postule | Un clic depuis le modal, entreprise accepte/refuse depuis son dashboard |
| Déclaration de RDV | Caller déclare prospect + date (email haché pour l'anti-farming, jamais stocké en clair) |
| Validation du RDV | Entreprise valide en 1 clic **ou automatique 72h après** si elle ne fait rien |
| RDV validé | Payout Stripe instantané + 100 pts + streak mis à jour + badges — en une transaction SQL atomique |
| Contestation | L'entreprise peut contester avec une raison, la validation est gelée |
| Payouts callers | Onboarding Stripe Connect Express depuis le dashboard caller |
| Saisons | Clôture auto (cron quotidien) : badges podium, reset partiel 20%, saison suivante |
| Leaderboard | Classement temps réel (Supabase Realtime), tiers Valorant-style |
| Profils publics | Chaque caller a une page `/c/username` avec ses stats vérifiées + image OG partageable |
| Légal | CGU, confidentialité RGPD, mentions légales (trames à compléter + relire par un avocat) |
| CI | Tests Vitest + build vérifié à chaque push (GitHub Actions) |

---

## Stack technique

| Couche | Choix | Pourquoi |
|---|---|---|
| Framework | Next.js 16 (App Router) | Server components + server actions = moins de JS client, SEO natif |
| Base de données | Supabase (Postgres) | Auth, RLS, Realtime, migrations SQL versionnées |
| Paiements | Stripe Connect Express | Escrow + split automatique + onboarding des callers |
| Hébergement | Vercel | Crons natifs (auto-validation + fermeture de saison), deploy automatique |
| Styles | Tailwind 4 | Design system maison dark/light |
| Tests | Vitest | 13 tests sur la logique de ranking et les invariants métier |

### Deux faces visuelles

- **Face caller** (dark, `/`) — esprit compétitif, Space Grotesk, bleu glacial
- **Face entreprise** (claire, `/entreprises/`) — sobre, IBM Plex, slate

### Le fichier central : `lib/config.ts`

Toutes les règles métier en un endroit : `COMMISSION_RATE`, `SEASON_WEEKS`, `POINTS`, `BRAND`. Changer le nom du produit = changer `BRAND` ici, nulle part ailleurs.

---

## Déploiement (checklist complète)

### 1 — Supabase (base de données + auth)

1. Créer un compte sur [supabase.com](https://supabase.com) → nouveau projet
2. Aller dans **SQL Editor** et exécuter les 4 migrations dans l'ordre :
   - `supabase/migrations/001_init.sql` — schéma complet + RLS
   - `supabase/migrations/002_validate_meeting.sql` — fonction de validation atomique
   - `supabase/migrations/003_v1_flows.sql` — triggers, crons, badges, seed saison 1
   - `supabase/migrations/004_mission_detail_fields.sql` — champs de détail mission
3. **Database → Replication** → activer Realtime sur la table `season_scores`
4. **Project Settings → API** → copier `URL`, `anon key`, `service_role key`

### 2 — Stripe (paiements)

1. Créer un compte sur [stripe.com](https://stripe.com)
2. **Connect → Get started** → activer Connect Express
3. **Developers → Webhooks** → créer un endpoint :
   - URL : `https://<ton-domaine>/api/webhooks/stripe`
   - Événements à écouter : `payment_intent.succeeded`, `account.updated`
4. Copier la `webhook signing secret`
5. **Developers → API keys** → copier la `Secret key`

### 3 — Vercel (hébergement)

1. Aller sur [vercel.com](https://vercel.com) → **Add New Project** → importer `RokdoU/coldkane`
2. **Settings → Environment Variables** → ajouter (en Production ET Preview) :

```
NEXT_PUBLIC_SUPABASE_URL=        (depuis Supabase)
NEXT_PUBLIC_SUPABASE_ANON_KEY=   (depuis Supabase)
SUPABASE_SERVICE_ROLE_KEY=       (depuis Supabase, garder secret)
STRIPE_SECRET_KEY=               (depuis Stripe)
STRIPE_WEBHOOK_SECRET=           (depuis Stripe Webhooks)
INTERNAL_API_SECRET=             (générer : openssl rand -hex 32)
CRON_SECRET=                     (générer : openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=            (ton domaine Vercel, ex: https://coldkane.vercel.app)
```

3. **Redéployer** — les crons de `vercel.json` s'activent automatiquement.

### 4 — Vérifier le flux de bout en bout (mode test Stripe)

Dans Stripe, utiliser la carte de test `4242 4242 4242 4242` (n'importe quelle date future, n'importe quel CVC).

1. S'inscrire comme **entreprise** → déposer une mission → payer (carte test)
2. Vérifier que la mission passe en statut "Active" dans le dashboard
3. S'inscrire comme **caller** → postuler à la mission → être accepté (depuis l'entreprise)
4. Déclarer un RDV → l'entreprise le valide
5. Vérifier le transfer dans **Stripe Dashboard → Connect → Transfers**
6. Vérifier que les points apparaissent dans le leaderboard

### 5 — Légal

- `app/(legal)/mentions-legales/page.tsx` — compléter avec les infos de la société
- Faire relire CGU et politique de confidentialité par un avocat avant le lancement public

---

## Architecture — où trouver quoi

```
lib/config.ts          ← Toutes les règles métier (commission, points, saisons)
lib/types.ts           ← Types TypeScript partagés
lib/data.ts            ← Requêtes publiques (missions, ladder, profils)
lib/actions/           ← Toutes les actions utilisateur (missions, auth, RDV)
lib/stripe.ts          ← Escrow, payouts, onboarding Connect
lib/supabase*.ts       ← Clients Supabase (public, admin, server avec cookies)

app/page.tsx           ← Landing page publique
app/missions/          ← Liste des missions + modal de détail au clic
app/c/[username]/      ← Profil public d'un caller
app/leaderboard/       ← Classement saisonnier
app/dashboard/         ← Dashboard caller (RDV, gains, payouts)
app/entreprises/       ← Tout ce qui touche aux entreprises (layout clair)
  dashboard/           ← Valider/contester des RDV, gérer candidatures
  poster/              ← Déposer une mission

app/api/
  webhooks/stripe/     ← Réception des événements Stripe
  cron/auto-validate/  ← Validation auto des RDV 72h+ (appelé par Vercel)
  cron/close-season/   ← Clôture de saison (appelé par Vercel)
  og/[username]/       ← Carte joueur en image (partageable sur X/LinkedIn)

supabase/migrations/   ← Schéma versionné, à exécuter dans l'ordre
```

---

## Décisions à prendre ensemble

Ces points sont délibérément laissés ouverts — ils impactent le produit, pas le code.

| Sujet | Question |
|---|---|
| **Nom** | ColdKane (= nom du repo) ou autre ? Dépôt INPI + domaine à réserver |
| **Commission** | 15% actuellement (`lib/config.ts`) — à valider |
| **Récompenses de saison** | Montant des prix podium ? Financé comment (sur la commission) ? |
| **Arbitrage des litiges** | Qui tranche ? Sous quel délai ? Quelle procédure ? |
| **Définition d'un RDV validé** | Conditions exactes à mettre dans les CGU et dans les briefs missions |
| **Intégration calendrier** | Cal.com / Google Cal pour preuve de RDV encore plus forte (V1 fonctionne sans) |

---

## Comment continuer à développer

### Option A — Avec Claude Code (recommandé)

Raphael travaille avec [Claude Code](https://claude.ai/code), le CLI d'Anthropic. Il suffit de l'installer et d'ouvrir le repo :

```bash
npm install -g @anthropic-ai/claude-code
cd coldkane
claude
```

Claude connaît déjà toute l'architecture du projet. Il suffit de décrire ce que tu veux en français.

### Option B — Manuellement

```bash
git clone https://github.com/RokdoU/coldkane
cd coldkane
npm install
npm run dev     # mode démo immédiat sur localhost:3000
npm test        # tests unitaires
npm run build   # vérification TypeScript + build complet
```

Le workflow habituel : modifier → `npm run build` pour vérifier → `git push` → Vercel déploie automatiquement.

### Règles à respecter dans le code

- **`lib/config.ts` est la source de vérité** — toutes les constantes métier viennent de là.
- **Toute écriture sensible passe par une fonction Postgres `security definer`** — jamais de `UPDATE` direct sur `meetings` ou `transactions` depuis le code.
- **Les emails de prospects ne sont jamais stockés** — uniquement un hash SHA-256.
- **Tester avant de pousser** : `npm run build` doit passer, `npm test` aussi.

---

## Ce qui reste à faire (backlog V1)

Prêt à implémenter dès que les décisions produit sont prises :

- [ ] **Emails transactionnels** (Resend) — candidature acceptée, RDV validé + montant payé
- [ ] **Admin de litiges** — interface pour arbitrer les RDV contestés
- [ ] **Édition de profil** — le caller peut modifier sa bio/headline
- [ ] **Gestion mission avancée** — l'entreprise peut mettre en pause ou fermer une mission
- [ ] **Filtres sur /missions** — par secteur, prix, bounties seulement
- [ ] **Rate limiting** — limiter les tentatives de login et les déclarations de RDV
- [ ] **Mentions légales** — compléter avec les infos société

## V2 (brief original)

Clips brandés TikTok/X, squads/écuries, rookie spotlight, Cold Call Arena (events live).
