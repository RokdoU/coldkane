-- =========================================================
-- 020 — Supprime la surcharge héritée declare_meeting(4 args).
--
-- (Renuméroté 020 : la 019 du repo porte déjà le pool de leads.)
--
-- 016 a recréé declare_meeting avec une NOUVELLE signature (7 args, plafond
-- earn-as-you-go). En Postgres, create or replace sur une signature différente
-- crée une SURCHARGE — il ne remplace pas l'ancienne. L'ancienne 4-args (006)
-- restait donc en base, toujours grant execute à authenticated, SANS plafond.
--
-- Conséquence : un caller pouvait appeler la RPC avec les 4 seuls params de base
-- via PostgREST et contourner entièrement le filtre qualité earn-as-you-go.
--
-- RÈGLE D'ÉQUIPE : toute RPC recréée avec signature modifiée → dropper
-- l'ancienne dans la même migration.
-- =========================================================

drop function if exists declare_meeting(uuid, text, text, timestamptz);

-- =========================================================
-- Vérification : il ne doit rester qu'UNE seule fonction declare_meeting,
-- la 7-args. Doit retourner exactement 1 ligne, args = 7 paramètres.
-- =========================================================
select p.proname, pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where p.proname = 'declare_meeting' and n.nspname = 'public';
