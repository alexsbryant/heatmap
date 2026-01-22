-- ============================================================================
-- Update cell_vibes schema to align with frozen vibe primitives
-- Adds: social, casual, local
-- Removes: chill_local, divey
-- ============================================================================

-- Add new columns
ALTER TABLE cell_vibes ADD COLUMN IF NOT EXISTS social NUMERIC CHECK (social >= 0 AND social <= 1);
ALTER TABLE cell_vibes ADD COLUMN IF NOT EXISTS casual NUMERIC CHECK (casual >= 0 AND casual <= 1);
ALTER TABLE cell_vibes ADD COLUMN IF NOT EXISTS local NUMERIC CHECK (local >= 0 AND local <= 1);

-- Drop deprecated columns
ALTER TABLE cell_vibes DROP COLUMN IF EXISTS chill_local;
ALTER TABLE cell_vibes DROP COLUMN IF EXISTS divey;

-- Update column comments
COMMENT ON COLUMN cell_vibes.social IS 'Score for group-oriented vs solo atmosphere (0-1)';
COMMENT ON COLUMN cell_vibes.casual IS 'Score for relaxed, informal atmosphere (0-1)';
COMMENT ON COLUMN cell_vibes.local IS 'Score for neighborhood feel vs touristy (0-1)';
