"use client";

import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

const currentCity = "San Francisco, CA";

// San Francisco coordinates
const SF_CENTER: [number, number] = [-122.4194, 37.7749];
const DEFAULT_ZOOM = 12;

export function Map() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
    map.current.on("load", () => {
      setIsLoaded(true);
    });

    // Cleanup on unmount
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
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
    </div>
  );
}
