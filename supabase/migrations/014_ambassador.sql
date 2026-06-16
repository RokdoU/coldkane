-- =========================================================
-- 014 — Programme ambassadeur / affiliation
--
-- Un ambassadeur (caller) partage un lien `?ref=<username>`. On track le clic,
-- l'arrivée éventuelle se transforme en filleul (profiles.referred_by, posé au
-- signup par handle_new_user — cf. 005). Le rev-share dû au parrain est CALCULÉ
-- et AFFICHÉ côté app (lib/affiliate.ts, fenêtre REFERRAL de lib/config.ts) ;
-- le VERSEMENT effectif est câblé ailleurs (flux financier de payout).
--
-- RÈGLE D'ÉQUIPE (cf. 011/012) : toute fonction `security definer` est créée
-- avec `revoke execute from public, anon, authenticated` puis `grant execute`
-- au seul rôle nécessaire.
-- =========================================================

-- =========================================================
-- Tracking d'attribution : un clic sur un lien d'affiliation.
-- Alimentée même pour un visiteur NON connecté (donc rôle anon) — mais jamais
-- en INSERT direct : l'insertion passe par la RPC track_referral_click ci-dessous
-- (cohérent avec la règle sécurité du projet : pas d'écriture client directe).
-- Aucune donnée perso : on ne stocke que le pseudo du parrain et le chemin visé.
-- =========================================================
create table referral_clicks (
  id uuid primary key default uuid_generate_v4(),
  referrer_username text not null,
  landing_path text,
  created_at timestamptz not null default now()
);

create index referral_clicks_by_referrer on referral_clicks (referrer_username, created_at desc);

alter table referral_clicks enable row level security;
-- Aucune policy : RLS activé sans policy = aucun accès client direct (select ni
-- insert). Tout passe par la RPC security definer (insert) et la vue agrégée
-- en droits propriétaire (lecture). Personne ne lit la table brute des clics.

-- =========================================================
-- track_referral_click : enregistre un clic d'affiliation.
-- security definer → bypass RLS pour l'insert contrôlé. Le visiteur peut être
-- anonyme (lien partagé sur un réseau, pas encore inscrit). On valide le format
-- du pseudo (même contrainte que profiles.username) pour éviter le bruit.
-- =========================================================
create or replace function track_referral_click(
  p_ref text,
  p_path text default null
) returns void
language plpgsql
security definer
as $$
begin
  -- Pseudo absent ou hors format → on ignore silencieusement (no-op).
  if p_ref is null or p_ref !~ '^[a-z0-9_]{3,20}$' then
    return;
  end if;

  insert into referral_clicks (referrer_username, landing_path)
  values (p_ref, p_path);
end;
$$;

-- EXECUTE ouvert aux visiteurs (anon) et aux connectés, jamais à public.
revoke execute on function track_referral_click(text, text) from public;
grant execute on function track_referral_click(text, text) to anon, authenticated;

-- =========================================================
-- Vue agrégée publique ambassador_stats (pattern platform_stats / 008).
-- Vue en droits propriétaire (bypass RLS volontaire) — n'expose QUE des
-- colonnes sûres par parrain : pseudo, nombre de filleuls, total des gains
-- générés par ses filleuls (somme des payouts validés). Jamais d'email ni
-- d'info perso. La commission cumulée DUE n'est pas ici : elle dépend de la
-- fenêtre REFERRAL (lib/config.ts) et se calcule côté app.
-- =========================================================
create or replace view ambassador_stats as
select
  p.username                                  as referrer_username,
  count(distinct f.id)                        as referrals_count,
  coalesce(sum(m.payout_cents), 0)            as generated_cents
from profiles p
-- les filleuls : profils dont referred_by pointe sur le parrain
join profiles f on f.referred_by = p.id
-- les gains validés de chaque filleul (payouts encaissés)
left join meetings m
  on m.caller_id = f.id
  and m.status = 'validated'
  and m.payout_cents is not null
group by p.username;

grant select on ambassador_stats to anon, authenticated;

comment on view ambassador_stats is
  'Agrégats publics par ambassadeur : nombre de filleuls + total des gains validés générés par ses filleuls. Colonnes sûres uniquement (jamais d''email). La commission due est calculée côté app (lib/affiliate.ts, fenêtre REFERRAL).';
