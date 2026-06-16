-- =========================================================
-- 011 — Lockdown EXECUTE sur les fonctions security definer héritées.
--
-- Postgres accorde EXECUTE à PUBLIC par défaut sur toute fonction. Les
-- fonctions sensibles des migrations 002/003 n'avaient pas de revoke :
-- un caller authentifié pouvait les appeler via PostgREST (clé anon publique)
-- et notamment s'AUTO-VALIDER un RDV (validate_meeting) — le cron retry-payouts
-- le payait ensuite en argent réel. Failles fermées ici.
--
-- RÈGLE D'ÉQUIPE PERMANENTE : toute nouvelle fonction `security definer` doit
-- être créée avec `revoke execute from public, anon, authenticated` suivi d'un
-- `grant execute` au seul rôle nécessaire. Les migrations 006/007 le font déjà
-- (declare_meeting, resolve_dispute, undispute_meeting) — ne jamais l'oublier.
-- =========================================================

-- Ces 5 fonctions ne sont appelées que côté serveur via la clé service_role
-- (actions vérifiant l'ownership, crons, route interne). Aucun client direct.
revoke execute on function validate_meeting(uuid, uuid, numeric) from public, anon, authenticated;
revoke execute on function mark_no_show(uuid) from public, anon, authenticated;
revoke execute on function dispute_meeting(uuid, uuid, text) from public, anon, authenticated;
revoke execute on function auto_validate_due_meetings(numeric) from public, anon, authenticated;
revoke execute on function close_season(numeric) from public, anon, authenticated;

grant execute on function validate_meeting(uuid, uuid, numeric) to service_role;
grant execute on function mark_no_show(uuid) to service_role;
grant execute on function dispute_meeting(uuid, uuid, text) to service_role;
grant execute on function auto_validate_due_meetings(numeric) to service_role;
grant execute on function close_season(numeric) to service_role;

-- =========================================================
-- Vérification : doit retourner 0 ligne.
-- Liste toute fonction security definer du schéma public encore exécutable
-- par anon ou authenticated, SAUF celles intentionnellement ouvertes aux
-- clients (declare_meeting, submit_dispute_evidence — voir 006/012).
-- =========================================================
select
  p.proname            as fonction_exposee,
  r.rolname            as role
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
cross join (values ('anon'), ('authenticated')) as r(rolname)
where n.nspname = 'public'
  and p.prosecdef
  -- les fonctions trigger ne sont pas appelables via PostgREST : on les ignore
  and p.prorettype <> 'pg_catalog.trigger'::regtype
  and p.proname not in ('declare_meeting', 'submit_dispute_evidence')
  and has_function_privilege(r.rolname, p.oid, 'EXECUTE');
