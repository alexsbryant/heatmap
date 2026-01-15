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

## Phase 1 — UI Skeleton
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

## Phase 2 — Map Foundation
Goal: See San Francisco on a live map.

- Add Mapbox GL JS
- Load San Francisco
- Support zoom, pan, mobile
- No heatmap yet

---

## Phase 3 — Grid System
Goal: Divide SF into meaningful “areas”.

- Generate ~300m × 300m grid over SF bounding box
- Store cells in Supabase
- Draw grid on the map (debug toggle)
- Each cell has:
  - id
  - lat/lng or polygon
  - city_id

---

## Phase 4 — Database
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

## Phase 5 — Ingestion Pipeline
Goal: Turn SF into a vibe dataset.

Create a backend script or admin API route that:
- Loops through each grid cell
- Queries Google Places
- Saves venues + reviews
- Sends reviews to LLM
- Receives vibe scores
- Writes to Supabase

This is how a city is “loaded” into the system.

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