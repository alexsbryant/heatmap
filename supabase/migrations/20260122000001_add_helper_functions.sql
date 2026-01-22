-- ============================================================================
-- Helper functions for the ingestion pipeline
-- ============================================================================

-- Function to get grid cell centroids as WKT text
CREATE OR REPLACE FUNCTION get_grid_centroids(p_city_id UUID)
RETURNS TABLE(id UUID, city_id UUID, centroid TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT gc.id, gc.city_id, ST_AsText(gc.centroid) as centroid
  FROM grid_cells gc
  WHERE gc.city_id = p_city_id;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated and service role
GRANT EXECUTE ON FUNCTION get_grid_centroids(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_grid_centroids(UUID) TO service_role;
