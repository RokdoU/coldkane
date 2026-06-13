-- =========================================================
-- Stats plateforme : le total versé aux callers, exposé publiquement
-- =========================================================

-- Le chiffre de preuve sociale n°1 de la landing : « X € versés aux callers ».
-- Vue en droits propriétaire (bypass RLS volontaire, même pattern que
-- recent_validations) — n'expose QUE deux agrégats, aucune ligne individuelle.
create or replace view platform_stats as
select
  coalesce(sum(amount_cents) filter (where type = 'release'), 0) as total_paid_cents,
  count(*) filter (where type = 'release') as payouts_count
from transactions;

grant select on platform_stats to anon, authenticated;

comment on view platform_stats is
  'Agrégats publics du ledger : total versé aux callers (type release) + nombre de payouts. Alimente le compteur de la landing.';
