-- ============================================================================
-- Add paginated version of get_grid_centroids to handle >1000 cells
-- Orders cells geographically: west-to-east (longitude), then south-to-north (latitude)
-- This allows --skip to reliably skip ocean cells on the western edge
-- ============================================================================

-- Paginated function to get grid cell centroids as WKT text
-- Ordered geographically so ocean cells (west) come first
CREATE OR REPLACE FUNCTION get_grid_centroids_paginated(
  p_city_id UUID,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(id UUID, city_id UUID, centroid TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT gc.id, gc.city_id, ST_AsText(gc.centroid) as centroid
  FROM grid_cells gc
  WHERE gc.city_id = p_city_id
  ORDER BY ST_X(gc.centroid), ST_Y(gc.centroid)  -- longitude, then latitude
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_grid_centroids_paginated(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grid_centroids_paginated(UUID, INTEGER, INTEGER) TO service_role;
