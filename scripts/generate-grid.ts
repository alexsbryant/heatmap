/**
 * Grid Generation Script for Prism
 *
 * Generates ~300m × 300m grid cells for a city and inserts them into Supabase.
 *
 * Usage: npm run generate-grid
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing environment variables. Check .env.local');
  process.exit(1);
}

// Create Supabase client with service role key (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Grid cell size in meters
const CELL_SIZE_METERS = 300;

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Calculate the latitude step for a given cell size in meters
 * Latitude: 1 degree ≈ 111km everywhere on Earth
 */
function latitudeStep(meters: number): number {
  return meters / 111_000;
}

/**
 * Calculate the longitude step for a given cell size at a specific latitude
 * Longitude distance varies by latitude: 1 degree = 111km * cos(latitude)
 */
function longitudeStep(meters: number, latitude: number): number {
  const latRadians = toRadians(latitude);
  return meters / (111_000 * Math.cos(latRadians));
}

/**
 * Parse PostGIS polygon text into bounds
 * Input format: "POLYGON((-122.52 37.70,-122.35 37.70,-122.35 37.83,-122.52 37.83,-122.52 37.70))"
 */
function parseBounds(polygonText: string): { minLng: number; minLat: number; maxLng: number; maxLat: number } {
  // Extract coordinates from POLYGON((...))
  const match = polygonText.match(/POLYGON\(\((.+)\)\)/);
  if (!match) throw new Error(`Invalid polygon format: ${polygonText}`);

  const coordPairs = match[1].split(',').map(pair => {
    const [lng, lat] = pair.trim().split(' ').map(Number);
    return { lng, lat };
  });

  const lngs = coordPairs.map(c => c.lng);
  const lats = coordPairs.map(c => c.lat);

  return {
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
  };
}

/**
 * Generate WKT polygon string for a grid cell
 */
function cellToPolygon(minLng: number, minLat: number, maxLng: number, maxLat: number): string {
  // Polygon must close (first point = last point)
  return `POLYGON((${minLng} ${minLat},${maxLng} ${minLat},${maxLng} ${maxLat},${minLng} ${maxLat},${minLng} ${minLat}))`;
}

/**
 * Generate WKT point string for centroid
 */
function cellToCentroid(minLng: number, minLat: number, maxLng: number, maxLat: number): string {
  const centerLng = (minLng + maxLng) / 2;
  const centerLat = (minLat + maxLat) / 2;
  return `POINT(${centerLng} ${centerLat})`;
}

/**
 * Main function
 */
async function main() {
  console.log('🌁 Grid Generation Script for Prism\n');

  // Fetch San Francisco from the database
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('id, slug, name, bounds')
    .eq('slug', 'san-francisco')
    .single();

  if (cityError || !city) {
    console.error('Failed to fetch city:', cityError?.message || 'City not found');
    process.exit(1);
  }

  console.log(`📍 City: ${city.name} (${city.id})`);

  // Parse the bounding box
  // Supabase returns geometry as a string in WKT format when using .select()
  // We need to use a raw query to get ST_AsText(bounds)
  const { data: boundsData, error: boundsError } = await supabase
    .rpc('get_city_bounds_text', { city_slug: 'san-francisco' });

  // If the RPC doesn't exist, fall back to raw SQL
  let boundsText: string;
  if (boundsError) {
    // Fetch bounds using SQL
    const { data: sqlData, error: sqlError } = await supabase.rpc('exec_sql', {
      query: `SELECT ST_AsText(bounds) as bounds_text FROM cities WHERE slug = 'san-francisco'`
    });

    if (sqlError) {
      // Last resort: use hardcoded bounds (we know what we inserted)
      console.log('⚠️  Using hardcoded SF bounds (RPC not available)');
      boundsText = 'POLYGON((-122.52 37.70,-122.35 37.70,-122.35 37.83,-122.52 37.83,-122.52 37.70))';
    } else {
      boundsText = sqlData?.[0]?.bounds_text;
    }
  } else {
    boundsText = boundsData;
  }

  if (!boundsText) {
    // Use hardcoded bounds as fallback
    console.log('⚠️  Using hardcoded SF bounds');
    boundsText = 'POLYGON((-122.52 37.70,-122.35 37.70,-122.35 37.83,-122.52 37.83,-122.52 37.70))';
  }

  const bounds = parseBounds(boundsText);
  console.log(`📐 Bounds: [${bounds.minLng}, ${bounds.minLat}] to [${bounds.maxLng}, ${bounds.maxLat}]`);

  // Calculate grid steps
  const centerLat = (bounds.minLat + bounds.maxLat) / 2;
  const latStep = latitudeStep(CELL_SIZE_METERS);
  const lngStep = longitudeStep(CELL_SIZE_METERS, centerLat);

  console.log(`📏 Cell size: ${CELL_SIZE_METERS}m`);
  console.log(`   Latitude step: ${latStep.toFixed(6)}°`);
  console.log(`   Longitude step: ${lngStep.toFixed(6)}°`);

  // Generate grid cells
  const cells: { city_id: string; geom: string; centroid: string }[] = [];

  let lat = bounds.minLat;
  while (lat < bounds.maxLat) {
    let lng = bounds.minLng;
    while (lng < bounds.maxLng) {
      const cellMinLng = lng;
      const cellMinLat = lat;
      const cellMaxLng = lng + lngStep;
      const cellMaxLat = lat + latStep;

      cells.push({
        city_id: city.id,
        geom: cellToPolygon(cellMinLng, cellMinLat, cellMaxLng, cellMaxLat),
        centroid: cellToCentroid(cellMinLng, cellMinLat, cellMaxLng, cellMaxLat),
      });

      lng += lngStep;
    }
    lat += latStep;
  }

  console.log(`\n🔢 Generated ${cells.length} grid cells`);

  // Check for existing cells
  const { count: existingCount } = await supabase
    .from('grid_cells')
    .select('*', { count: 'exact', head: true })
    .eq('city_id', city.id);

  if (existingCount && existingCount > 0) {
    console.log(`⚠️  Found ${existingCount} existing cells for ${city.name}`);
    console.log('   Deleting existing cells before inserting new ones...');

    const { error: deleteError } = await supabase
      .from('grid_cells')
      .delete()
      .eq('city_id', city.id);

    if (deleteError) {
      console.error('Failed to delete existing cells:', deleteError.message);
      process.exit(1);
    }
  }

  // Insert cells in batches (Supabase has limits on batch size)
  const BATCH_SIZE = 500;
  let inserted = 0;

  console.log('\n📤 Inserting cells into database...');

  for (let i = 0; i < cells.length; i += BATCH_SIZE) {
    const batch = cells.slice(i, i + BATCH_SIZE);

    // Convert WKT strings to PostGIS geometry using raw SQL
    // Supabase doesn't automatically convert WKT, so we need to use an INSERT with ST_GeomFromText
    const values = batch.map(cell =>
      `('${cell.city_id}', ST_GeomFromText('${cell.geom}', 4326), ST_GeomFromText('${cell.centroid}', 4326))`
    ).join(',\n');

    const { error: insertError } = await supabase.rpc('insert_grid_cells', {
      values_sql: values
    });

    // If RPC doesn't exist, generate SQL file for manual execution
    if (insertError) {
      if (i === 0) {
        console.log('\n⚠️  Direct PostGIS insert requires raw SQL execution.');
        console.log('   Generating SQL file for manual execution...\n');

        const fs = await import('fs');
        const sqlContent = `-- Grid cells for San Francisco
-- Generated: ${new Date().toISOString()}
-- Total cells: ${cells.length}

-- Delete existing cells first
DELETE FROM grid_cells WHERE city_id = '${city.id}';

-- Insert all grid cells
INSERT INTO grid_cells (city_id, geom, centroid)
VALUES
${cells.map(cell =>
  `  ('${cell.city_id}', ST_GeomFromText('${cell.geom}', 4326), ST_GeomFromText('${cell.centroid}', 4326))`
).join(',\n')};

-- Verify
SELECT COUNT(*) as total_cells FROM grid_cells WHERE city_id = '${city.id}';
`;

        fs.writeFileSync('scripts/sf-grid-cells.sql', sqlContent);
        console.log('✅ SQL file generated: scripts/sf-grid-cells.sql');
        console.log(`   Contains ${cells.length} cell INSERT statements`);
        console.log('\n📋 Next steps:');
        console.log('   1. Open Supabase Dashboard → SQL Editor');
        console.log('   2. Paste the contents of scripts/sf-grid-cells.sql');
        console.log('   3. Click "Run"');
        console.log('\n   Or run: cat scripts/sf-grid-cells.sql | pbcopy  (to copy to clipboard)');

        process.exit(0);
      }
    }

    inserted += batch.length;
    console.log(`   Inserted ${inserted}/${cells.length} cells`);
  }

  console.log('\n✅ Grid generation complete!');
  console.log(`   Total cells: ${cells.length}`);
}

// Run the script
main().catch(console.error);
