# KL Rail Times

A real-time train arrival and journey planning app for the Klang Valley rail network (LRT, MRT, Monorail, BRT).

## Features

- **Live arrivals** — Next train countdown for any station, with direction tabs
- **Journey planner** — Route planning with fare info, distance, and up to 3 alternative routes
- **Interactive map** — Rail network map with actual track geometry from GTFS shapes data
- **Full timetable** — Complete daily schedule for every station (weekday/Saturday/Sunday)
- **Favorites** — Save frequently used stations and journeys

## Lines Supported

| Line | Short Name | Type |
|------|-----------|------|
| LRT Kelana Jaya | KJ | LRT |
| LRT Ampang | AG | LRT |
| LRT Sri Petaling | SP | LRT |
| MRT Kajang | KG | MRT |
| MRT Putrajaya | PY | MRT |
| KL Monorail | MR | Monorail |
| BRT Sunway | BRT | BRT |

## Data Source

All schedule data comes from Malaysia's open data GTFS feed:
- **Static schedule**: `api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl`
- **Fare data**: RapidKL fare API (`jp-web.myrapid.com.my`)

Train times are computed from the published schedule, not live GPS data. See the technical docs below for how this works.

## Technical Documentation

- **[How Train Times Are Computed](docs/train-times.md)** — How the app generates arrival times from GTFS frequency-based schedule data
- **[How Distance Is Calculated](docs/distance-calculation.md)** — Track distance using shapes.txt geometry vs straight-line haversine
- **[How Routes Are Found](docs/routing-algorithm.md)** — Dijkstra's algorithm, transfer penalties, and alternative route generation

## Tech Stack

- **Framework**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Map**: React-Leaflet
- **Data fetching**: SWR
- **GTFS parsing**: PapaParse, adm-zip

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/                    # Next.js pages
│   ├── api/                # API routes (arrivals, journey, lines, vehicle-positions)
│   ├── journey/            # Journey planner page
│   ├── map/                # Interactive map page
│   └── station/[stopId]/   # Station detail + timetable pages
├── components/             # React components
│   ├── journey/            # Journey planner UI (result cards, leg cards, station picker)
│   ├── map/                # Map components (train markers, station markers, line filter)
│   ├── station/            # Station page components (arrival board, timetable)
│   └── ui/                 # Shared UI (badge, countdown, skeleton)
├── hooks/                  # Client-side data hooks (SWR-based)
└── lib/                    # Core logic
    ├── gtfs/               # GTFS data fetching, parsing, caching, schedule computation
    ├── journey/            # Pathfinding (graph, Dijkstra, interchanges, fare)
    ├── lines.ts            # Line metadata (colors, names, route IDs)
    └── utils.ts            # Time/date utilities (Malaysia timezone)
```
