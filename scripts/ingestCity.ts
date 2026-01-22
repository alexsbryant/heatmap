/**
 * City Ingestion Pipeline
 *
 * Processes grid cells through Google Places API and LLM vibe scoring,
 * writing results to Supabase.
 *
 * Usage:
 *   npm run ingest-city -- san-francisco
 *   npm run ingest-city -- san-francisco --force
 *   npm run ingest-city -- san-francisco --dry-run
 *   npm run ingest-city -- san-francisco --limit 10
 */

import { config } from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';

import {
  CliOptions,
  GridCell,
  VenueData,
  CellVibeData,
  FailedCell,
  PLACE_TYPES,
  MIN_REVIEW_COUNT,
  TOP_VENUES_PER_CELL,
  RATE_LIMITS,
  LLM_MODEL,
} from './lib/config';
import { RateLimiter, sleep } from './lib/rateLimiter';
import {
  GooglePlacesClient,
  parsePointWKT,
  rankVenues,
  filterQualifiedVenues,
  getPrimaryCategory,
} from './lib/googlePlaces';
import { VibeScorer, aggregateReviews, emptyVibeScores } from './lib/vibeScorer';

// Load environment variables
config({ path: '.env.local' });

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY!;

function validateEnv(): void {
  const missing: string[] = [];
  if (!SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!SUPABASE_SERVICE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!GOOGLE_PLACES_API_KEY) missing.push('GOOGLE_PLACES_API_KEY');
  if (!OPENAI_API_KEY) missing.push('OPENAI_API_KEY');

  if (missing.length > 0) {
    console.error('Missing environment variables:', missing.join(', '));
    process.exit(1);
  }
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0].startsWith('-')) {
    console.error('Usage: npm run ingest-city -- <city-slug> [options]');
    console.error('Options:');
    console.error('  --force    Reprocess all cells (ignore existing)');
    console.error('  --dry-run  Log only, no database writes');
    console.error('  --limit N  Process only N cells');
    process.exit(1);
  }

  const options: CliOptions = {
    citySlug: args[0],
    force: args.includes('--force'),
    dryRun: args.includes('--dry-run'),
    limit: null,
  };

  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1], 10);
    if (isNaN(options.limit) || options.limit <= 0) {
      console.error('Invalid --limit value');
      process.exit(1);
    }
  }

  return options;
}

async function getCityId(
  supabase: SupabaseClient,
  citySlug: string
): Promise<string> {
  const { data, error } = await supabase
    .from('cities')
    .select('id')
    .eq('slug', citySlug)
    .single();

  if (error || !data) {
    console.error(`City not found: ${citySlug}`);
    process.exit(1);
  }

  return data.id;
}

async function getGridCells(
  supabase: SupabaseClient,
  cityId: string,
  options: CliOptions
): Promise<GridCell[]> {
  // Try to get centroids using RPC function
  const { data: centroidData, error: centroidError } = await supabase.rpc(
    'get_grid_centroids',
    { p_city_id: cityId }
  );

  let cellsWithCentroids: GridCell[];

  if (centroidError || !centroidData) {
    console.error('');
    console.error('ERROR: The get_grid_centroids function is not available.');
    console.error('Please run the following migration in your Supabase SQL Editor:');
    console.error('');
    console.error('  supabase/migrations/20260122000001_add_helper_functions.sql');
    console.error('');
    console.error('Or execute this SQL directly:');
    console.error('');
    console.error(`  CREATE OR REPLACE FUNCTION get_grid_centroids(p_city_id UUID)
  RETURNS TABLE(id UUID, city_id UUID, centroid TEXT) AS $$
  BEGIN
    RETURN QUERY
    SELECT gc.id, gc.city_id, ST_AsText(gc.centroid) as centroid
    FROM grid_cells gc
    WHERE gc.city_id = p_city_id;
  END;
  $$ LANGUAGE plpgsql;`);
    console.error('');
    process.exit(1);
  }

  cellsWithCentroids = centroidData as GridCell[];

  // Filter out cells that already have vibe scores (unless --force)
  if (!options.force) {
    const { data: existingVibes } = await supabase
      .from('cell_vibes')
      .select('grid_cell_id')
      .in(
        'grid_cell_id',
        cellsWithCentroids.map((c) => c.id)
      );

    const processedIds = new Set(existingVibes?.map((v) => v.grid_cell_id) || []);
    const originalCount = cellsWithCentroids.length;
    cellsWithCentroids = cellsWithCentroids.filter((c) => !processedIds.has(c.id));

    if (originalCount !== cellsWithCentroids.length) {
      console.log(
        `Skipping ${originalCount - cellsWithCentroids.length} already processed cells`
      );
    }
  }

  // Apply limit if specified
  if (options.limit) {
    cellsWithCentroids = cellsWithCentroids.slice(0, options.limit);
  }

  return cellsWithCentroids;
}

async function upsertVenues(
  supabase: SupabaseClient,
  venues: VenueData[],
  dryRun: boolean
): Promise<void> {
  if (dryRun || venues.length === 0) return;

  // Upsert venues - on conflict update all fields
  const { error } = await supabase.from('venues').upsert(
    venues.map((v) => ({
      google_place_id: v.google_place_id,
      grid_cell_id: v.grid_cell_id,
      name: v.name,
      category: v.category,
      rating: v.rating,
      review_count: v.review_count,
      location: v.location,
    })),
    { onConflict: 'google_place_id' }
  );

  if (error) {
    console.error('  Failed to upsert venues:', error.message);
  }
}

async function upsertCellVibes(
  supabase: SupabaseClient,
  vibes: CellVibeData,
  dryRun: boolean
): Promise<void> {
  if (dryRun) return;

  // Delete existing vibe record for this cell (if any)
  await supabase
    .from('cell_vibes')
    .delete()
    .eq('grid_cell_id', vibes.grid_cell_id);

  // Insert new vibe record
  const { error } = await supabase.from('cell_vibes').insert(vibes);

  if (error) {
    console.error('  Failed to insert cell vibes:', error.message);
    throw error;
  }
}

function saveFailedCells(failedCells: FailedCell[]): void {
  if (failedCells.length === 0) return;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `scripts/failed-cells-${timestamp}.json`;
  fs.writeFileSync(filename, JSON.stringify(failedCells, null, 2));
  console.log(`\nFailed cells saved to: ${filename}`);
}

async function processCell(
  supabase: SupabaseClient,
  cell: GridCell,
  placesClient: GooglePlacesClient,
  vibeScorer: VibeScorer,
  options: CliOptions
): Promise<void> {
  const coords = parsePointWKT(cell.centroid);
  if (!coords) {
    throw new Error(`Failed to parse centroid for cell ${cell.id}`);
  }

  console.log(`  Centroid: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`);

  // Step 1: Search for all place types
  const allPlaces = await placesClient.searchAllTypes(
    coords.lat,
    coords.lng,
    PLACE_TYPES
  );
  console.log(`  Found ${allPlaces.length} unique places`);

  // Step 2: Filter venues with minimum reviews
  const qualifiedVenues = filterQualifiedVenues(allPlaces, MIN_REVIEW_COUNT);
  console.log(`  Qualified venues (>=${MIN_REVIEW_COUNT} reviews): ${qualifiedVenues.length}`);

  // Step 3: Rank and select top venues
  const rankedVenues = rankVenues(qualifiedVenues);
  const topVenues = rankedVenues.slice(0, TOP_VENUES_PER_CELL);

  // Step 4: Prepare venue data for upserting
  const venueData: VenueData[] = rankedVenues.map((place) => ({
    google_place_id: place.id,
    grid_cell_id: cell.id,
    name: place.displayName?.text || 'Unknown',
    category: getPrimaryCategory(place.types),
    rating: place.rating || null,
    review_count: place.userRatingCount || null,
    location: place.location
      ? `POINT(${place.location.longitude} ${place.location.latitude})`
      : `POINT(${coords.lng} ${coords.lat})`,
  }));

  // Step 5: Upsert all qualified venues
  await upsertVenues(supabase, venueData, options.dryRun);

  // Step 6: Handle empty cells
  if (topVenues.length === 0) {
    console.log('  No qualified venues - writing null scores');
    const emptyScores = emptyVibeScores();
    await upsertCellVibes(
      supabase,
      {
        grid_cell_id: cell.id,
        ...emptyScores,
        source_review_count: 0,
        model_name: null,
        computed_at: new Date().toISOString(),
      },
      options.dryRun
    );
    return;
  }

  // Step 7: Fetch place details for top venues
  console.log(`  Fetching details for ${topVenues.length} top venues...`);
  const placeDetails = [];
  for (const venue of topVenues) {
    const details = await placesClient.getPlaceDetails(venue.id);
    if (details) {
      placeDetails.push(details);
    }
  }

  // Step 8: Aggregate reviews
  const { text: reviewText, count: reviewCount } = aggregateReviews(placeDetails);
  console.log(`  Aggregated ${reviewCount} reviews (${reviewText.length} chars)`);

  // Step 9: Score vibes with LLM
  let vibeScores;
  if (reviewText.length === 0) {
    console.log('  No review text - writing null scores');
    vibeScores = emptyVibeScores();
  } else {
    console.log('  Scoring vibes with LLM...');
    vibeScores = await vibeScorer.scoreVibes(reviewText);
    console.log(`  Scores: ${JSON.stringify(vibeScores)}`);
  }

  // Step 10: Write cell vibes
  await upsertCellVibes(
    supabase,
    {
      grid_cell_id: cell.id,
      ...vibeScores,
      source_review_count: reviewCount,
      model_name: reviewText.length > 0 ? LLM_MODEL : null,
      computed_at: new Date().toISOString(),
    },
    options.dryRun
  );

  console.log('  Done');
}

async function main(): Promise<void> {
  console.log('City Ingestion Pipeline\n');

  validateEnv();
  const options = parseArgs();

  console.log(`City: ${options.citySlug}`);
  console.log(`Options: force=${options.force}, dryRun=${options.dryRun}, limit=${options.limit}`);
  console.log('');

  // Initialize clients
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const placesRateLimiter = new RateLimiter(RATE_LIMITS.googlePlaces.requestsPerSecond);
  const openaiRateLimiter = new RateLimiter(RATE_LIMITS.openai.requestsPerSecond);

  const placesClient = new GooglePlacesClient(GOOGLE_PLACES_API_KEY, placesRateLimiter);
  const vibeScorer = new VibeScorer(OPENAI_API_KEY, openaiRateLimiter);

  // Get city and grid cells
  const cityId = await getCityId(supabase, options.citySlug);
  console.log(`City ID: ${cityId}`);

  const cells = await getGridCells(supabase, cityId, options);
  console.log(`Processing ${cells.length} cells\n`);

  if (cells.length === 0) {
    console.log('No cells to process. Done.');
    return;
  }

  // Process cells
  const failedCells: FailedCell[] = [];
  let processed = 0;

  for (const cell of cells) {
    processed++;
    console.log(`\n[${processed}/${cells.length}] Cell ${cell.id}`);

    try {
      await processCell(supabase, cell, placesClient, vibeScorer, options);
    } catch (error) {
      const errorMessage = (error as Error).message;
      console.error(`  ERROR: ${errorMessage}`);
      failedCells.push({
        cellId: cell.id,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });
    }

    // Delay between cells
    if (processed < cells.length) {
      await sleep(RATE_LIMITS.betweenCells.delayMs);
    }
  }

  // Summary
  console.log('\n========================================');
  console.log('Ingestion Complete');
  console.log(`  Processed: ${processed}`);
  console.log(`  Succeeded: ${processed - failedCells.length}`);
  console.log(`  Failed: ${failedCells.length}`);
  console.log(`  Venue cache size: ${placesClient.getCacheSize()}`);

  if (options.dryRun) {
    console.log('\n  (Dry run - no data written to database)');
  }

  saveFailedCells(failedCells);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
