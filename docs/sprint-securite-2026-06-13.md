# Sprint sécurité + confiance + vision — 2026-06-13

Suite à l'audit de l'associé fondateur (3 failles critiques argent/triche + trous business),
trois sprints livrés. Objectif : rendre la plateforme déployable avec de l'argent réel.

État : `npm test` (15/15) et `npm run build` verts. Migrations 006→010 à appliquer dans
Supabase avant déploiement.

---

## Sprint 1 — Sécuriser l'argent (P0)

### Lockdown RLS — `supabase/migrations/006_rls_lockdown.sql`
Le ladder était falsifiable (`UPDATE callers SET lifetime_points=999999` via l'API REST
publique) et l'escrow contournable (`UPDATE missions SET status='funded'` sans payer).

- `REVOKE UPDATE` global puis `GRANT` colonne par colonne sur `callers`, `profiles`,
  `companies`, `missions`, `assignments` : seuls les champs éditoriaux restent modifiables
  côté client. `lifetime_points`, `status`, prix, budget, `stripe_account_id`,
  `payouts_enabled`… → service role / RPC uniquement.
- `REVOKE INSERT, UPDATE` sur `meetings` (la déclaration passe désormais par RPC).
- `REVOKE INSERT, UPDATE, DELETE` sur `transactions` (ledger en lecture seule).

### RPC `declare_meeting` + garde anti-overbooking (faille 6)
Garde en DB (pas dans l'action TS — pas de race condition) : `SELECT … FOR UPDATE` sur la
mission sérialise les déclarations concurrentes. **Un RDV `disputed` réserve sa place dans
le budget** (décision produit 2026-06-13) : le count inclut `booked + validated + disputed`.
Invariant `booked + validated + disputed ≤ meetings_target` → une mission ne peut jamais
passer `completed` avec un litige en suspens.

### Payouts robustes (failles 3, 4)
- Colonne `callers.payouts_enabled`, mise à jour par le webhook `account.updated`
  (qui était un no-op : `SET stripe_account_id=X WHERE stripe_account_id=X`).
- Payout immédiat seulement si `payouts_enabled = true` ; sinon le RDV reste validé avec
  `stripe_transfer_id` null.
- Nouveau cron `api/cron/retry-payouts` : rattrape les payouts orphelins dès que le compte
  Connect est prêt. Règle aussi le settlement Stripe (fonds dispo ~J+7 au début).
- **Idempotency key Stripe** (`transfer-${meetingId}`) : le cron peut retenter à l'infini
  sans jamais payer deux fois. try/catch partout : un échec ne bloque plus la boucle.

---

## Sprint 2 — Confiance (P1)

### Emails transactionnels (Resend) — `lib/email.ts`
**Condition de mise en prod de l'auto-validation** : une PME ne doit jamais être
auto-débitée sans avoir été notifiée. 4 templates FR (no-op silencieux sans clé API,
jamais bloquants) :
1. RDV déclaré → entreprise (lien valider/contester + mention 72h)
2. Rappel ~48h avant auto-validation → entreprise (cron `auto-validate`, `reminder_sent_at`)
3. RDV validé → caller (net versé + points) ET entreprise (récap) — auto-validations incluses
4. Candidature acceptée → caller

### Résolution des litiges — `migrations/007` + `api/internal/resolve-dispute`
Un RDV `disputed` restait gelé pour toujours (aucun `resolve_dispute`). Désormais :
- RPC `resolve_dispute` (outcome `cancelled` → RDV annulé, hash prospect redéclarable) et
  `undispute_meeting` (outcome `validated` → repasse `booked` puis `validateMeetingAndPay` :
  le payout reste centralisé, jamais de transfer direct). Service-role only.
- Route POST protégée par `INTERNAL_API_SECRET` (saison 0 : l'équipe arbitre, SLA 48h).

### Clôture de mission + refund — `lib/actions/mission-lifecycle.ts`
`refundRemainingBudget` n'était jamais appelé → solde non consommé séquestré à vie.
`closeMission` (action entreprise, bouton dashboard) : bloquée tant qu'il reste des
`booked`/`disputed`, rembourse `budget − Σ(release + commission)`, rejouable sans double
refund (idempotency key `refund-${paymentIntentId}`).

### Crons — `vercel.json`
`auto-validate` repassé en horaire (`0 * * * *`), `retry-payouts` ajouté (`30 * * * *`).

---

## Sprint 3 — Vision / marketing

- **Messaging** (`lib/config.ts`) : tagline « Pas de CV. Pas de diplôme. Que des résultats. »
- **Compteur public** « X € versés aux callers » (vue `platform_stats`, migration 008),
  au-dessus de la fold + section entreprise. Revalidation 60s.
- **Kill feed** monté au-dessus de la fold de la landing (preuve sociale live).
- **Cartes OG événementielles vérifiables** (décision 2026-06-13) : `/api/og/event/[eventId]`
  lit l'événement réel en base (RDV validé ou badge via migration 010). Événement
  inexistant → 404. L'URL est elle-même la preuve — impossible de forger un faux montant.
- **Page `/charte-contenu`** : 3 règles UGC pour les callers qui se filment (jamais la voix
  ni le nom du prospect, role-play encouragé). La plateforme n'héberge aucune vidéo.

---

## Checklist avant beta fermée

- [ ] Appliquer les migrations **006 → 010** dans Supabase
- [ ] Env vars Vercel : `RESEND_API_KEY`, `EMAIL_FROM`, `INTERNAL_API_SECRET`,
      `CRON_SECRET`, `NEXT_PUBLIC_SITE_URL` + clés Supabase/Stripe
- [ ] **Domaine Resend vérifié DKIM/SPF** + test réel de délivrabilité (déclarer un RDV en
      staging, vérifier Gmail ET une boîte OVH/pro). Si les emails tombent en spam,
      l'auto-validation redevient silencieuse de facto — exactement la bombe désamorcée.
- [ ] Flux complet en mode test Stripe (carte 4242)
- [ ] **⚠️ Plan Vercel** : le Hobby limite à 2 crons quotidiens. On a 3 crons horaires
      (`auto-validate`, `retry-payouts`, `close-season`) → nécessite le plan **Pro**, ou
      regrouper les crons et réduire la fréquence. Bloquant au déploiement sinon.
- [ ] Caler la date de beta fermée (~30-50 callers connus)

## Points laissés ouverts (non bloquants beta)

- Cartes OG : le type `rankup` a été retiré (non matérialisé en base) — le tier vérifié vit
  déjà sur la carte profil `/c/[username]`.
- Bannière démo : vérifier l'orthographe « Supabase » (cosmétique).
