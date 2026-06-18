-- =========================================================
-- 022 — Index de performance (montée en charge / boucles autonomes).
-- Cible les requêtes chaudes des crons et dashboards qui scannaient
-- jusqu'ici sans index dédié. Tous additifs, aucun changement de schéma.
-- =========================================================

-- transactions n'avait AUCUN index (hors PK). Très requêtée :
--   - par mission + type (closeMission, dashboard entreprise, apporteur)
--   - agrégée par type (vue platform_stats : sum filter type='release')
create index if not exists transactions_by_mission_type on transactions (mission_id, type);
create index if not exists transactions_by_type on transactions (type);

-- meetings : payouts à rattraper (runRetryPayouts) — scan status='validated'
-- + stripe_transfer_id null. Index partiel = ne couvre que les impayés.
create index if not exists meetings_unpaid
  on meetings (validated_at)
  where status = 'validated' and stripe_transfer_id is null;

-- meetings : rev-share parrain à traiter (runReferralPayouts).
create index if not exists meetings_referral_todo
  on meetings (validated_at)
  where status = 'validated' and referral_transfer_id is null;

-- meetings : litiges à résoudre / rappeler (runAutoResolveDisputes).
create index if not exists meetings_disputed_due
  on meetings (disputed_at)
  where status = 'disputed';

-- meetings : RDV à auto-valider / rappeler (runAutoValidate).
create index if not exists meetings_autovalidate_due
  on meetings (auto_validate_at)
  where status = 'booked';

-- leads : leads réservés par un caller (dashboard caller).
create index if not exists leads_claimed_by
  on leads (claimed_by)
  where claimed_by is not null;
