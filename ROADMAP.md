# 🌆 Prism — Heatmap of City Vibes
A web app that shows which neighborhoods of a city match the user’s desired “vibe” (nightlife, photogenic, chill, trendy, etc) using a heatmap over a live map.

The core idea:
> We are not mapping places — we are mapping how areas feel.

The app is powered by a precomputed geospatial database built from Google Places + LLM-based vibe classification.

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
- Vibe scores:
  - photogenic
  - trendy
  - lively
  - chill/local
  - divey
  - upscale

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

## Phase 5 — Ingestion Pipeline
Goal: Turn SF into a vibe dataset.

Freeze core primitive vibe dimensions into:

	•	DB schema (already mostly done)
	•	LLM prompt

Core primitive vibe dimensions to score:

- lively // Energy, noise, activity
- social // Group-oriented vs solo
- upscale // Price level, polish
- casual // Relaxed, informal
- trendy // New, popular, fashionable
- local // Feels local vs touristy
- photogenic // Visual, photographers commented, Instagram / socials appeal

Create a backend script or admin API route that:
- Loops through each grid cell
- Queries Google Places
- Saves venues + reviews
- Sends reviews to LLM
- Receives vibe scores
- Writes to Supabase

This is how a city is “loaded” into the system.

The ingestion script should be implemented as:
	•	a Node.js script in /scripts/ingestCity.ts (preferred)
	•	OR a protected /api/admin/ingest-city route
  
  Default to a Node script unless there is a strong reason otherwise.

  The script will use the Supabase service role key for writes (server-side only).

  The script should log progress per grid cell and be safe to re-run (skip cells that already have vibe scores unless forced).

This avoids:
	•	accidental double billing
	•	partial failures ruining a run


Ingestion Pipeline:
  Correct order per grid cell
	1.	Query Google Places (by category types)
	2.	Store venues
	3.	Aggregate review text per cell
	4.	Send batched reviews to LLM
	5.	Receive primitive vibe scores
	6.	Write to cell_vibes

This ingestion pipeline is offline / admin-only.
It is not user-facing, not triggered automatically, and is run manually from the terminal or a protected admin route.

⚠️ Important Google Places constraints:

1. You cannot fetch all reviews
	•	Google returns limited review samples
	•	Usually ~5 reviews per place
	•	That’s fine for MVP

2. Rate limits exist
	•	Claude must:
    •	throttle requests
    •	batch by grid cell
    •	respect per-second limits

3. You must choose types

You will query by types like:
	•	restaurant
	•	bar
	•	cafe
	•	night_club

You cannot query “vibes” directly.

LLM prompt responsibility

The LLM should:
	•	Read aggregated review text for a cell
	•	Output only primitive scores
	•	Normalize to 0–1
	•	Explain nothing (for cost + consistency)

LLM should NOT:
	•	Invent categories
	•	Reason about user intent
	•	Produce prose explanations

You will create one canonical prompt and never change it lightly.

Example (simplified):

“Given the following reviews aggregated for a city grid cell, return JSON with numeric scores (0–1) for:
lively, social, upscale, casual, trendy, local, photogenic.
Respond with JSON only.”

This prompt becomes infrastructure.

Check back with prompt before continuing. 

⚠️ Important:
Do NOT call the LLM per venue — only per grid cell.

LLM Recommended:
	•	GPT-4.1 mini or equivalent reasoning-light model

Connect via API for pay-per-token useage when script is run, keeps usage payments seperate from Claude for build and OpenAI for LLM scoring. 


Cost & scalability implication (why this matters)

If you:
	•	store primitives
	•	cache per cell
	•	only recompute when reviews materially change

Then:
	•	cities are loaded once
	•	adding UI features is free
	•	experimentation is cheap



Checklist before telling Claude “write the script”

You’re ready once:
  x OpenAI API set up and key saved in env.local
  x OpenAI Billing and quota set
	•	Google Cloud project created
	•	Places API enabled
	•	API key created + restricted
	•	Billing attached + quota set
	•	Key saved in .env.local
	x	Grid cells exist in Supabase

Once those are true, Claude can safely write:
	•	the ingestion script
	•	retry logic
	•	throttling
	•	logging


PHASE 5 PROMPT:

You are acting as a senior backend engineer helping plan Phase 5 of a geospatial web app called Prism.

Do NOT write code yet.
First respond with a clear, structured PLAN ONLY.

Context:
Prism is a web app that shows heatmap-style “vibe” overlays for cities.
We have already completed:
- Mapbox map with SF loaded
- A Supabase database with PostGIS enabled
- Grid cells (~300m × 300m) generated for San Francisco
- Tables: cities, grid_cells, venues, cell_vibes

Phase 5 — Ingestion Pipeline
Goal: Turn San Francisco into a vibe dataset.

This ingestion pipeline is:
- offline / admin-only
- not user-facing
- run manually from the terminal or a protected admin route
- expected to run once per city (or on rare recomputation)

Primitive vibe dimensions are frozen and must not be changed lightly:

- lively (energy, noise, activity)
- social (group-oriented vs solo)
- upscale (price level, polish)
- casual (relaxed, informal)
- trendy (new, popular, fashionable)
- local (feels local vs touristy)
- photogenic (visual / Instagram appeal)

These are stored as numeric scores (0–1) in `cell_vibes`.

LLM responsibilities:
- Read aggregated review text per grid cell
- Output ONLY JSON with numeric scores (0–1) for the primitives
- No prose, no explanations, no invented categories
- One canonical prompt used consistently

LLM should NOT:
- Invent categories
- Reason about user intent
- Produce text explanations

Data sources & constraints:
- Google Places API (Nearby Search + Details)
- Limited review samples (~5 per place)
- Rate limits must be respected
- Query by place types only (restaurant, bar, cafe, night_club, etc.)
- Do NOT call the LLM per venue — only per grid cell

Recommended LLM:
- GPT-4.1 mini or equivalent reasoning-light OpenAI model
- Accessed via OpenAI API (pay-per-token)
- Separate from Claude usage

Ingestion order per grid cell:
1. Query Google Places by type
2. Store venues + reviews
3. Aggregate review text per cell
4. Send batched reviews to LLM
5. Receive primitive vibe scores
6. Write to cell_vibes

Environment assumptions:
- OPENAI_API_KEY is set
- GOOGLE_PLACES_API_KEY is set
- Supabase service role key is available server-side
- Grid cells already exist in Supabase

Requirements:
- The script should be safe to re-run (skip cells already scored unless forced)
- Include basic throttling and retry logic
- Include logging so progress is visible
- Prefer a Node.js script in /scripts unless there is a strong reason to use an API route

Task:
Provide a clear step-by-step PLAN for implementing this ingestion pipeline, including:
- script structure
- data flow
- API usage strategy
- error handling approach
- cost control considerations

Do not write code yet.


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

Approx:
- 1,300 grid cells
- 1 LLM call per cell
- ≈ $5–$15 per city to ingest
- Zero LLM cost during normal usage

---

# 🚀 Vision

Over time:
- Add more cities
- Refresh vibe scores monthly
- Improve LLM prompts
- Build a global “how cities feel” database

The map is just the window into that data.

---