/**
 * Google Places API wrapper for the ingestion pipeline
 */

import {
  GooglePlace,
  GooglePlaceDetails,
  PlaceType,
  SEARCH_RADIUS_METERS,
  MAX_RESULTS_PER_TYPE,
  RETRY_CONFIG,
} from './config';
import { RateLimiter, withRetry } from './rateLimiter';

const NEARBY_SEARCH_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const PLACE_DETAILS_URL = 'https://places.googleapis.com/v1/places';

// Field masks for API requests
const NEARBY_SEARCH_FIELDS = [
  'places.id',
  'places.displayName',
  'places.rating',
  'places.userRatingCount',
  'places.types',
  'places.location',
].join(',');

const PLACE_DETAILS_FIELDS = [
  'id',
  'displayName',
  'rating',
  'userRatingCount',
  'reviews.text.text',
  'reviews.rating',
].join(',');

export class GooglePlacesClient {
  private apiKey: string;
  private rateLimiter: RateLimiter;
  private detailsCache: Map<string, GooglePlaceDetails>;

  constructor(apiKey: string, rateLimiter: RateLimiter) {
    this.apiKey = apiKey;
    this.rateLimiter = rateLimiter;
    this.detailsCache = new Map();
  }

  /**
   * Search for places of a specific type near a location
   */
  async nearbySearch(
    lat: number,
    lng: number,
    placeType: PlaceType
  ): Promise<GooglePlace[]> {
    await this.rateLimiter.acquire();

    const body = {
      includedTypes: [placeType],
      maxResultCount: MAX_RESULTS_PER_TYPE,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    };

    const response = await withRetry(
      () => this.fetchWithError(NEARBY_SEARCH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
          'X-Goog-FieldMask': NEARBY_SEARCH_FIELDS,
        },
        body: JSON.stringify(body),
      }),
      {
        ...RETRY_CONFIG,
        onRetry: (attempt, error) => {
          console.log(`  Retry ${attempt}/${RETRY_CONFIG.maxRetries} for nearbySearch: ${error.message}`);
        },
      }
    );

    const data = await response.json();
    return data.places || [];
  }

  /**
   * Search for all place types near a location and dedupe results
   */
  async searchAllTypes(
    lat: number,
    lng: number,
    placeTypes: readonly PlaceType[]
  ): Promise<GooglePlace[]> {
    const allPlaces: GooglePlace[] = [];
    const seenIds = new Set<string>();

    for (const placeType of placeTypes) {
      const places = await this.nearbySearch(lat, lng, placeType);

      for (const place of places) {
        if (!seenIds.has(place.id)) {
          seenIds.add(place.id);
          allPlaces.push(place);
        }
      }
    }

    return allPlaces;
  }

  /**
   * Get place details including reviews
   * Uses caching to avoid re-fetching the same place
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    // Check cache first
    const cached = this.detailsCache.get(placeId);
    if (cached) {
      return cached;
    }

    await this.rateLimiter.acquire();

    const url = `${PLACE_DETAILS_URL}/${placeId}`;

    try {
      const response = await withRetry(
        () => this.fetchWithError(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': this.apiKey,
            'X-Goog-FieldMask': PLACE_DETAILS_FIELDS,
          },
        }),
        {
          ...RETRY_CONFIG,
          onRetry: (attempt, error) => {
            console.log(`  Retry ${attempt}/${RETRY_CONFIG.maxRetries} for getPlaceDetails: ${error.message}`);
          },
        }
      );

      const data = await response.json();
      this.detailsCache.set(placeId, data);
      return data;
    } catch (error) {
      // Non-retryable error - return null
      console.error(`  Failed to get details for ${placeId}:`, (error as Error).message);
      return null;
    }
  }

  /**
   * Get the number of cached place details
   */
  getCacheSize(): number {
    return this.detailsCache.size;
  }

  /**
   * Fetch with error handling
   */
  private async fetchWithError(url: string, options: RequestInit): Promise<Response> {
    const response = await fetch(url, options);

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(`HTTP ${response.status}: ${text}`);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    return response;
  }
}

/**
 * Parse WKT POINT to lat/lng
 * Input: "POINT(-122.4194 37.7749)" or "0101000020E6100000..."
 */
export function parsePointWKT(wkt: string): { lat: number; lng: number } | null {
  // Handle WKT text format
  const match = wkt.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
  if (match) {
    return {
      lng: parseFloat(match[1]),
      lat: parseFloat(match[2]),
    };
  }
  return null;
}

/**
 * Rank venues by (review_count * 0.7 + rating * 0.3)
 */
export function rankVenues(venues: GooglePlace[]): GooglePlace[] {
  return [...venues].sort((a, b) => {
    const scoreA = (a.userRatingCount || 0) * 0.7 + (a.rating || 0) * 0.3;
    const scoreB = (b.userRatingCount || 0) * 0.7 + (b.rating || 0) * 0.3;
    return scoreB - scoreA;
  });
}

/**
 * Filter venues with minimum review count
 */
export function filterQualifiedVenues(
  venues: GooglePlace[],
  minReviewCount: number
): GooglePlace[] {
  return venues.filter((v) => (v.userRatingCount || 0) >= minReviewCount);
}

/**
 * Get primary category from place types
 */
export function getPrimaryCategory(types: string[] | undefined): string | null {
  if (!types || types.length === 0) return null;

  // Prioritize specific types over generic ones
  const priorityTypes = [
    'night_club',
    'bar',
    'restaurant',
    'cafe',
    'park',
    'tourist_attraction',
  ];

  for (const type of priorityTypes) {
    if (types.includes(type)) return type;
  }

  return types[0];
}
