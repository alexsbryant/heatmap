# 🌆 Prism — Heatmap of City Vibes
A web app that shows which neighborhoods of a city match the user’s desired “vibe” (nightlife, photogenic, chill, trendy, etc) using a heatmap over a live map.

The core idea:
> We are not mapping places — we are mapping how areas feel.

The app is powered by a precomputed geospatial database built from Google Places + LLM-based vibe classification.

The core value comes from:
	•	Review language
	•	Human sentiment
	•	Qualitative vibes
	•	LLM interpretation

---

# 🧠 Product Model

Users:
- Choose a city
- Choose a vibe (e.g. “Night Out”, “Photogenic”, “Brooklyn Vibes”)
- See which neighborhoods light up on the map

Internally:
- Cities are split into grid cells (~300m squares)
- Each cell has:
  - Venue density
  - Ratings
  - LLM-generated vibe scores
- The heatmap is generated from those numbers — not live API calls

---

# 🧰 Tech Stack

## Frontend
- Next.js (App Router)
- React
- TypeScript
- Tailwind CSS
- Mapbox GL JS (map + heatmap layers)

## Backend
- Next.js API routes (or server actions)
- Supabase (Postgres + PostGIS)

## External APIs
- Google Places API (venues + reviews)
- LLM API (GPT-4o-mini or Claude Sonnet) for vibe classification

## AI usage
- Claude Code: writes the app, SQL, scripts, migrations
- GPT-4o-mini / Sonnet: processes review text → vibe scores

These roles are separate.

---

# 🗺️ Core Data Model

Each city is split into ~300m grid cells.

Each grid cell has:
- Location (lat/lng or polygon)
- Venue count
- Average rating
- Vibe scores (frozen primitives):
  - lively (energy, noise, activity)
  - social (group-oriented vs solo)
  - upscale (price level, polish)
  - casual (relaxed, informal)
  - trendy (new, popular, fashionable)
  - local (neighborhood feel vs touristy)
  - photogenic (visual/Instagram appeal)

These values are computed once during ingestion and stored in Supabase.

Users only query the database.

---

# 🧩 System Architecture

Two independent systems:

## 1) Data Ingestion Pipeline (runs rarely)
This is run manually or on a schedule.

For a city (e.g. San Francisco):
- Build grid
- Query Google Places for each cell
- Collect venues + reviews
- Send reviews to LLM
- Save vibe scores into Supabase

This is expensive and slow — but runs once per city (or once per month).

## 2) Web App (runs constantly)
- Users choose a city and vibes
- Next.js reads grid + vibe scores from Supabase
- Heatmap is generated in the browser
- No LLM or Google calls happen during normal use

---

# 📍 Phase Roadmap

## Phase 1 — UI Skeleton - Complete
Goal: Get a working web app shell.

- Create Next.js project
- Add Tailwind
- Build layout:
  - City selector (SF only for now)
  - Left sidebar (desktop)
  - Dropdown (mobile)
  - Large map container
- No data, no APIs yet

---

## Phase 2 — Map Foundation - Complete
Goal: See San Francisco on a live map.

- Add Mapbox GL JS
- Load San Francisco
- Support zoom, pan, mobile
- No heatmap yet

---

## Phase 3 — Database - Complete
Goal: Create the real product database.

- Create Supabase project
- Enable PostGIS
- Create tables:
  - cities
  - grid_cells
  - venues
  - cell_vibes
- Use Claude Code to write SQL migrations

---

## Phase 4 — Grid System - Complete
Goal: Divide SF into meaningful “areas”.

- Generate ~300m × 300m grid over SF bounding box
- Store cells in Supabase
- Draw grid on the map (debug toggle)
- Each cell has:
  - id
  - lat/lng or polygon
  - city_id



Step 1 — Create San Francisco in the database

You manually provide:
	•	SF bounding box (Claude can find it)
	•	Insert it into cities

Now the database knows:

“This city exists.”

⸻

Step 2 — Generate the grid (Claude writes this)

Now you ask Claude:

“Write a Next.js API route or Node script that:
	•	Reads SF bounds from Supabase
	•	Generates a 300m × 300m grid
	•	Writes grid cells to grid_cells table”

This script:
	•	Uses PostGIS functions
	•	Or Turf.js
	•	Or simple math

It only runs once.

You run it from terminal or via:
/api/admin/generate-sf-grid

Now Supabase contains ~1,300 grid cells.

Step 3 — Draw the grid on the map (debug mode)

Claude now helps you:
	•	Query grid_cells from Supabase
	•	Convert polygons → GeoJSON
	•	Add a Mapbox layer that draws them as:
	•	Thin outlines
	•	Semi-transparent fill
	•	Add a “Show Grid” toggle

Now when you click it, you see SF broken into cells.

That’s your product skeleton.
---

## Phase 5 — Ingestion Pipeline - Complete
Goal: Turn SF into a vibe dataset.

### Implementation Summary

Created `/scripts/ingestCity.ts` to process grid cells through Google Places API and LLM vibe scoring, writing results to Supabase.

**Files Created:**

| File | Purpose |
|------|---------|
| `supabase/migrations/20260122000000_update_cell_vibes_schema.sql` | Schema migration: add social/casual/local, drop chill_local/divey |
| `supabase/migrations/20260122000001_add_helper_functions.sql` | Helper function `get_grid_centroids()` |
| `supabase/migrations/20260122000002_add_paginated_centroids.sql` | Paginated + geographically ordered centroid query |
| `scripts/lib/config.ts` | Types, constants, place types array |
| `scripts/lib/rateLimiter.ts` | Token bucket rate limiter with retry logic |
| `scripts/lib/googlePlaces.ts` | Google Places API wrapper (Nearby Search + Place Details) |
| `scripts/lib/vibeScorer.ts` | OpenAI LLM integration for vibe scoring |
| `scripts/ingestCity.ts` | Main orchestrator script |

### Runnable Scripts

```bash
# Normal run - process all unprocessed cells
npm run ingest-city -- san-francisco

# Force reprocess all cells (ignore existing)
npm run ingest-city -- san-francisco --force

# Dry run - log only, no database writes
npm run ingest-city -- san-francisco --dry-run

# Skip first N cells (see "Skipping Ocean Cells" below)
npm run ingest-city -- san-francisco --skip 735

# Process only N cells
npm run ingest-city -- san-francisco --limit 10

# Combine options: skip ocean, test 20 land cells
npm run ingest-city -- san-francisco --skip 735 --limit 20
```

### Skipping Ocean Cells (--skip)

SF's grid has 2,450 cells. The western ~735 cells are over the Pacific Ocean and have no venues. Processing them wastes ~$141 in API calls.

**How --skip works:**

The `get_grid_centroids_paginated` database function orders cells geographically:
```sql
ORDER BY ST_X(centroid), ST_Y(centroid)  -- longitude, then latitude
```

Since SF's ocean is on the **west** (most negative longitude), ocean cells come first:
- Cells #1-735: Ocean (longitude ≤ -122.47, west of Ocean Beach)
- Cells #736-2450: Land

`--skip 735` tells the script to skip the first 735 cells in this ordered list. The script doesn't "know" they're ocean—the geographic ordering ensures they come first.

**Recommended production run:**
```bash
npm run ingest-city -- san-francisco --skip 735
```

### Before Running

1. Run all migrations in Supabase SQL Editor:
   - `20260122000000_update_cell_vibes_schema.sql`
   - `20260122000001_add_helper_functions.sql`
   - `20260122000002_add_paginated_centroids.sql` ← enables --skip

2. Verify `.env.local` has:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_PLACES_API_KEY`
   - `OPENAI_API_KEY`

### Pipeline per grid cell

1. Check if cell_vibes exists (skip unless --force)
2. Search Google Places (6 types: restaurant, bar, cafe, night_club, park, tourist_attraction)
3. Dedupe venues by google_place_id
4. Filter venues with < 10 reviews
5. Rank by (review_count × 0.7 + rating × 0.3)
6. Upsert all qualified venues to `venues` table
7. Fetch Place Details for top 5 venues (reviews)
8. Aggregate review text
9. Send to LLM (gpt-4.1-mini) for vibe scores
10. Write cell_vibes row (null scores if no qualified venues)

### Cost Breakdown (San Francisco, 2,450 cells)

**Cell Distribution:**
| Type | Count | Description |
|------|-------|-------------|
| Ocean | 735 | West of Ocean Beach, no venues |
| Land | 1,715 | Potentially have venues |
| Developed | ~1,127 | Likely have qualified venues |

**Full Run (all 2,450 cells):**
| Operation | Formula | Cost |
|-----------|---------|------|
| Nearby Search | 2,450 × 6 types × $0.032 | $470 |
| Place Details | ~3,400 calls × $0.025 | ~$85 |
| OpenAI | ~1,000 calls × $0.003 | ~$3 |
| **Total** | | **~$558** |

**With --skip 735 (recommended):**
| Operation | Formula | Cost |
|-----------|---------|------|
| Nearby Search | 1,715 × 6 × $0.032 | $329 |
| Place Details | ~3,400 × $0.025 | ~$85 |
| OpenAI | ~1,000 × $0.003 | ~$3 |
| **Total** | | **~$417** |

**Savings from --skip 735:** ~$141

---

## Phase 6 — Heatmap
Goal: Make the product real.

- Query grid_cells + cell_vibes from Supabase
- Convert them into weighted points
- Render Mapbox heatmap layer
- Add sliders / presets:
  - Night Out
  - Photogenic
  - Chill
  - Trendy
  - etc

---

## Phase 7 — Presets & UX
Goal: Make it magical.

Add presets like:
- “Night Out”
- “Record Store Browsing”
- “Brooklyn Vibes”
- “Fine Dining”
- “Dive Bars”

These are just weighted combinations of vibe scores.

---

# 💰 Cost Model (San Francisco)

Actual (2,450 grid cells):
- ~$417 with --skip 735 (skip ocean cells)
- ~$558 without skip (full grid)
- ~1,000 LLM calls (only cells with qualified venues)
- Zero API cost during normal usage (all data precomputed)

---

# 🚀 Vision

Over time:
- Add more cities
- Refresh vibe scores monthly
- Improve LLM prompts
- Build a global “how cities feel” database

The map is just the window into that data.

---