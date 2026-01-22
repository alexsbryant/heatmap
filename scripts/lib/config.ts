/**
 * Configuration constants and types for the city ingestion pipeline
 */

// Place types to search for in each grid cell
export const PLACE_TYPES = [
  'restaurant',
  'bar',
  'cafe',
  'night_club',
  'park',
  'tourist_attraction',
] as const;

export type PlaceType = (typeof PLACE_TYPES)[number];

// Search radius in meters (covers ~300m cell diagonally)
export const SEARCH_RADIUS_METERS = 212;

// Maximum results per place type search
export const MAX_RESULTS_PER_TYPE = 10;

// Minimum review count for a venue to be considered qualified
export const MIN_REVIEW_COUNT = 10;

// Maximum venues to fetch details for per cell
export const TOP_VENUES_PER_CELL = 5;

// Rate limiting configuration
export const RATE_LIMITS = {
  googlePlaces: {
    requestsPerSecond: 8,
  },
  openai: {
    requestsPerSecond: 3,
  },
  betweenCells: {
    delayMs: 500,
  },
} as const;

// Retry configuration
export const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [429, 500, 503],
} as const;

// LLM model configuration
export const LLM_MODEL = 'gpt-4.1-mini';

// Vibe dimensions
export const VIBE_DIMENSIONS = [
  'lively',
  'social',
  'upscale',
  'casual',
  'trendy',
  'local',
  'photogenic',
] as const;

export type VibeDimension = (typeof VIBE_DIMENSIONS)[number];

// Vibe scores type
export type VibeScores = Record<VibeDimension, number | null>;

// Google Places API response types
export interface GooglePlace {
  id: string;
  displayName?: { text: string };
  rating?: number;
  userRatingCount?: number;
  types?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
}

export interface GooglePlaceDetails extends GooglePlace {
  reviews?: Array<{
    text?: { text: string };
    rating?: number;
    relativePublishTimeDescription?: string;
  }>;
}

// Grid cell type from database
export interface GridCell {
  id: string;
  city_id: string;
  centroid: string; // WKT format: POINT(lng lat)
}

// Venue data for upserting
export interface VenueData {
  google_place_id: string;
  grid_cell_id: string;
  name: string;
  category: string | null;
  rating: number | null;
  review_count: number | null;
  location: string; // WKT format: POINT(lng lat)
}

// Cell vibe data for upserting
export interface CellVibeData {
  grid_cell_id: string;
  lively: number | null;
  social: number | null;
  upscale: number | null;
  casual: number | null;
  trendy: number | null;
  local: number | null;
  photogenic: number | null;
  source_review_count: number;
  model_name: string | null;
  computed_at: string;
}

// CLI options
export interface CliOptions {
  citySlug: string;
  force: boolean;
  dryRun: boolean;
  limit: number | null;
}

// Failed cell record for logging
export interface FailedCell {
  cellId: string;
  error: string;
  timestamp: string;
}
