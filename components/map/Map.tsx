"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import { supabase } from "@/lib/supabase";

const currentCity = "San Francisco, CA";

interface GridCell {
  id: string;
  geom: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

// San Francisco coordinates (centered on Alamo Square / Painted Ladies)
const SF_CENTER: [number, number] = [-122.4346, 37.7764];
const DEFAULT_ZOOM = 12;

/**
 * Convert grid cells to GeoJSON FeatureCollection
 */
function cellsToGeoJSON(cells: GridCell[]): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: cells.map(cell => ({
      type: "Feature" as const,
      properties: { id: cell.id },
      geometry: cell.geom,
    })),
  };
}

export function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [gridLoaded, setGridLoaded] = useState(false);

  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    // Set the access token
    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

    // Initialize the map
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: SF_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    // Add navigation controls (zoom buttons)
    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    // Add attribution in a custom position
    map.current.addControl(
      new mapboxgl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    // Mark as loaded when ready
    map.current.on("load", async () => {
      setIsLoaded(true);

      // Fetch all grid cells from Supabase (using view that returns GeoJSON)
      // Supabase has a default 1000 row limit, so we fetch in batches
      const allCells: GridCell[] = [];
      const batchSize = 1000;
      let offset = 0;
      let hasMore = true;

      while (hasMore) {
        const { data: batch, error } = await supabase
          .from("grid_cells_geojson")
          .select("id, geom")
          .range(offset, offset + batchSize - 1);

        if (error) {
          console.error("Failed to fetch grid cells:", error);
          return;
        }

        if (batch && batch.length > 0) {
          allCells.push(...batch);
          offset += batchSize;
          hasMore = batch.length === batchSize;
        } else {
          hasMore = false;
        }
      }

      if (allCells.length === 0 || !map.current) return;
      const cells = allCells;

      // Convert to GeoJSON
      const geojson = cellsToGeoJSON(cells);

      // Add source
      map.current.addSource("grid-cells", {
        type: "geojson",
        data: geojson,
      });

      // Add fill layer (semi-transparent)
      map.current.addLayer({
        id: "grid-cells-fill",
        type: "fill",
        source: "grid-cells",
        paint: {
          "fill-color": "#6366f1",
          "fill-opacity": 0.1,
        },
        layout: {
          visibility: "none",
        },
      });

      // Add line layer (cell borders)
      map.current.addLayer({
        id: "grid-cells-line",
        type: "line",
        source: "grid-cells",
        paint: {
          "line-color": "#6366f1",
          "line-width": 0.5,
          "line-opacity": 0.4,
        },
        layout: {
          visibility: "none",
        },
      });

      setGridLoaded(true);
      console.log(`Loaded ${cells.length} grid cells`);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Toggle grid visibility
  useEffect(() => {
    if (!map.current || !gridLoaded) return;

    const visibility = showGrid ? "visible" : "none";
    map.current.setLayoutProperty("grid-cells-fill", "visibility", visibility);
    map.current.setLayoutProperty("grid-cells-line", "visibility", visibility);
  }, [showGrid, gridLoaded]);

  const toggleGrid = useCallback(() => {
    setShowGrid(prev => !prev);
  }, []);

  return (
    <div className="relative flex-1 w-full h-full">
      {/* Map container */}
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading state */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-stone-100">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-stone-300 border-t-coral-500 rounded-full animate-spin" />
            <span className="text-sm text-stone-500">Loading map...</span>
          </div>
        </div>
      )}

      {/* Location badge */}
      <div className="absolute top-4 right-4 md:top-5 md:right-5 z-10">
        <div className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-stone-200 shadow-sm opacity-90">
          <span className="text-xs font-medium text-stone-600">
            {currentCity}
          </span>
        </div>
      </div>

      {/* Grid debug toggle - positioned above zoom controls */}
      {gridLoaded && (
        <button
          onClick={toggleGrid}
          className={`absolute bottom-28 right-4 z-10 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
            showGrid
              ? "bg-indigo-500 text-white"
              : "bg-white/90 text-stone-600 border border-stone-200"
          } backdrop-blur-sm shadow-sm hover:shadow-md`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            Grid
          </span>
        </button>
      )}
    </div>
  );
}
