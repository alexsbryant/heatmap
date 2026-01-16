-- ============================================================================
-- Prism Core Schema Migration
-- Creates the foundational tables for city grid-based vibe mapping
-- ============================================================================

-- Enable pgcrypto for gen_random_uuid() (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CITIES TABLE
-- Stores city metadata including geographic bounds and center point
-- Used for city selection and initial map positioning
-- ============================================================================
CREATE TABLE cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,              -- URL-friendly identifier (e.g., "san-francisco")
    name TEXT NOT NULL,                     -- Display name (e.g., "San Francisco")
    bounds GEOMETRY(POLYGON, 4326) NOT NULL,-- City bounding box for grid generation
    center GEOMETRY(POINT, 4326) NOT NULL,  -- Map center point for initial view
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE cities IS 'City metadata for supported locations';
COMMENT ON COLUMN cities.slug IS 'URL-friendly unique identifier';
COMMENT ON COLUMN cities.bounds IS 'Geographic bounding polygon (WGS84)';
COMMENT ON COLUMN cities.center IS 'Map center point for initial view (WGS84)';

-- ============================================================================
-- GRID_CELLS TABLE
-- ~300m × 300m grid cells that divide each city
-- Each cell aggregates venue data and vibe scores
-- ============================================================================
CREATE TABLE grid_cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
    geom GEOMETRY(POLYGON, 4326) NOT NULL,      -- Grid cell polygon boundary
    centroid GEOMETRY(POINT, 4326) NOT NULL,    -- Precomputed centroid for fast rendering
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE grid_cells IS 'Geographic grid cells (~300m × 300m) for aggregating venue data';
COMMENT ON COLUMN grid_cells.geom IS 'Grid cell polygon boundary (WGS84)';
COMMENT ON COLUMN grid_cells.centroid IS 'Precomputed centroid for efficient map queries';

-- ============================================================================
-- VENUES TABLE
-- Points of interest from Google Places API
-- Linked to grid cells for spatial aggregation
-- ============================================================================
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_cell_id UUID NOT NULL REFERENCES grid_cells(id) ON DELETE CASCADE,
    google_place_id TEXT UNIQUE NOT NULL,   -- Google Places API identifier
    name TEXT NOT NULL,                     -- Venue display name
    category TEXT,                          -- Venue type (e.g., "restaurant", "bar", "cafe")
    rating NUMERIC,                         -- Google rating (1-5 scale)
    review_count INTEGER,                   -- Number of Google reviews
    location GEOMETRY(POINT, 4326) NOT NULL,-- Venue coordinates
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE venues IS 'Points of interest from Google Places API';
COMMENT ON COLUMN venues.google_place_id IS 'Unique Google Places API identifier';
COMMENT ON COLUMN venues.category IS 'Venue type classification';
COMMENT ON COLUMN venues.location IS 'Venue coordinates (WGS84)';

-- ============================================================================
-- CELL_VIBES TABLE
-- LLM-computed vibe scores per grid cell
-- Scores are normalized to 0-1 range
-- ============================================================================
CREATE TABLE cell_vibes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    grid_cell_id UUID NOT NULL REFERENCES grid_cells(id) ON DELETE CASCADE,

    -- Vibe dimensions (0-1 normalized scores)
    photogenic NUMERIC CHECK (photogenic >= 0 AND photogenic <= 1),
    trendy NUMERIC CHECK (trendy >= 0 AND trendy <= 1),
    lively NUMERIC CHECK (lively >= 0 AND lively <= 1),
    chill_local NUMERIC CHECK (chill_local >= 0 AND chill_local <= 1),
    divey NUMERIC CHECK (divey >= 0 AND divey <= 1),
    upscale NUMERIC CHECK (upscale >= 0 AND upscale <= 1),

    -- Metadata for tracking computation provenance
    source_review_count INTEGER,            -- Number of reviews analyzed
    model_name TEXT,                        -- LLM model used for scoring
    computed_at TIMESTAMPTZ                 -- When vibe scores were computed
);

COMMENT ON TABLE cell_vibes IS 'LLM-computed vibe scores per grid cell';
COMMENT ON COLUMN cell_vibes.photogenic IS 'Score for visual appeal (0-1)';
COMMENT ON COLUMN cell_vibes.trendy IS 'Score for trendiness (0-1)';
COMMENT ON COLUMN cell_vibes.lively IS 'Score for energy/activity level (0-1)';
COMMENT ON COLUMN cell_vibes.chill_local IS 'Score for relaxed local atmosphere (0-1)';
COMMENT ON COLUMN cell_vibes.divey IS 'Score for dive bar/casual authenticity (0-1)';
COMMENT ON COLUMN cell_vibes.upscale IS 'Score for upscale/luxury feel (0-1)';
COMMENT ON COLUMN cell_vibes.model_name IS 'LLM model identifier used for scoring';

-- ============================================================================
-- SPATIAL INDEXES (GIST)
-- Enable fast spatial queries using PostGIS
-- ============================================================================

-- Cities spatial indexes
CREATE INDEX idx_cities_bounds ON cities USING GIST (bounds);
CREATE INDEX idx_cities_center ON cities USING GIST (center);

-- Grid cells spatial indexes
CREATE INDEX idx_grid_cells_geom ON grid_cells USING GIST (geom);
CREATE INDEX idx_grid_cells_centroid ON grid_cells USING GIST (centroid);

-- Venues spatial index
CREATE INDEX idx_venues_location ON venues USING GIST (location);

-- ============================================================================
-- BTREE INDEXES
-- Enable fast lookups on foreign keys and common query patterns
-- ============================================================================

-- Grid cells by city (for loading all cells in a city)
CREATE INDEX idx_grid_cells_city_id ON grid_cells (city_id);

-- Venues by grid cell (for aggregating venues per cell)
CREATE INDEX idx_venues_grid_cell_id ON venues (grid_cell_id);

-- Cell vibes by grid cell (for fetching vibe data per cell)
CREATE INDEX idx_cell_vibes_grid_cell_id ON cell_vibes (grid_cell_id);
