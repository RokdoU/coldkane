-- Ajout des champs de détail mission pour les callers
ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS target_persona  TEXT,
  ADD COLUMN IF NOT EXISTS meeting_type    TEXT,
  ADD COLUMN IF NOT EXISTS pitch_notes     TEXT;

COMMENT ON COLUMN missions.target_persona IS 'Qui appeler : persona cible (poste, taille entreprise, zone géo)';
COMMENT ON COLUMN missions.meeting_type   IS 'Type de RDV attendu (démo, discovery, physique…)';
COMMENT ON COLUMN missions.pitch_notes    IS 'Notes de pitch réservées aux callers acceptés (objections, accroche, cas clients)';
