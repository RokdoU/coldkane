-- =========================================================
-- 017 — Vidéo de pitch du caller (preuve sociale optionnelle)
--
-- La plateforme N'HÉBERGE AUCUNE vidéo (cf. app/charte-contenu) : on stocke
-- seulement l'URL d'une vidéo hébergée ailleurs (TikTok / Instagram / YouTube)
-- que le caller affiche sur son profil public. Ce n'est ni un gate d'accès ni
-- un système de notation — juste un lien.
--
-- La colonne devient éditable par le caller (en plus de headline). La policy
-- RLS "own caller row" (cf. 001) gère déjà QUELLE ligne ; il suffit d'accorder
-- l'UPDATE sur la colonne (cf. lockdown 006). Aucune fonction security definer.
-- =========================================================

alter table callers add column if not exists pitch_video_url text;

comment on column callers.pitch_video_url is
  'URL externe (TikTok/Instagram/YouTube) de la vidéo de pitch du caller — jamais hébergée, juste liée sur le profil public';

-- Le caller peut renseigner/vider sa propre URL (RLS "own caller row" filtre la ligne).
grant update (pitch_video_url) on table callers to authenticated;
