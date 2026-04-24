# How Train Times Are Computed

## Overview

KL Rail Times does **not** receive live train arrival data from any API. Instead, it computes arrival times mathematically from three pieces of schedule data provided by Malaysia's GTFS (General Transit Feed Specification) static feed.

## The Three Data Sources

### 1. Template Trip (`stop_times.txt`)

A single example journey for each line and direction, showing the travel time between consecutive stations.

| stop_id | arrival_time | stop_sequence |
|---------|-------------|---------------|
| AG18    | 6:00:00     | 1             |
| AG17    | 6:02:03     | 2             |
| AG16    | 6:03:15     | 3             |
| AG15    | 6:04:43     | 4             |
| AG14    | 6:06:21     | 5             |

This tells us: AG18 → AG17 takes ~2 min, AG17 → AG16 takes ~1.2 min, etc.

> There is only **one** template trip per line per direction. It defines the **time gaps** between stations, not actual departure times.

### 2. Frequency Windows (`frequencies.txt`)

How often trains depart, broken into time-of-day windows.

| trip_id        | start_time | end_time  | headway_secs |
|----------------|-----------|-----------|-------------|
| AGL_MonFri_0   | 6:00:00   | 9:00:00   | 180 (3 min) |
| AGL_MonFri_0   | 9:00:00   | 17:00:00  | 300 (5 min) |
| AGL_MonFri_0   | 17:00:00  | 19:00:00  | 180 (3 min) |
| AGL_MonFri_0   | 19:00:00  | 23:25:00  | 300 (5 min) |

This means: during weekday morning peak (6–9am), a train departs every 3 minutes. Off-peak (9am–5pm), every 5 minutes.

### 3. Service Calendar (`calendar.txt`)

Which days each service pattern runs.

| service_id | Mon | Tue | Wed | Thu | Fri | Sat | Sun | Valid dates          |
|-----------|-----|-----|-----|-----|-----|-----|-----|----------------------|
| MonFri    | 1   | 1   | 1   | 1   | 1   | 0   | 0   | 2019-01-01 → 2026-12-31 |
| Sat       | 0   | 0   | 0   | 0   | 0   | 1   | 0   | 2019-01-01 → 2026-12-31 |
| Sun       | 0   | 0   | 0   | 0   | 0   | 0   | 1   | 2019-01-01 → 2026-12-31 |

## How It All Comes Together

### Step-by-Step Example

**Scenario:** It's **Wednesday 8:47am**. You're at **AG14** (station 5 on the Ampang line). When is the next train?

```
Step 1: Which service is active today?
         → Wednesday = weekday → "MonFri" service is active ✓

Step 2: What frequency window are we in?
         → 8:47am falls in 6:00–9:00 → headway = 180 seconds (every 3 min)

Step 3: What's the time offset for AG14 from the template?
         → Template: AG18 departs at 6:00:00, AG14 arrives at 6:06:21
         → Offset = 6:06:21 - 6:00:00 = 381 seconds

Step 4: Generate all departures from station 1 (AG18) during this window
         → 6:00:00, 6:03:00, 6:06:00, ..., 8:45:00, 8:48:00, 8:51:00, ...

Step 5: Add the offset to get arrival times at AG14
         → 8:45:00 + 381s = 8:51:21
         → 8:48:00 + 381s = 8:54:21
         → 8:51:00 + 381s = 8:57:21

Step 6: Filter to show only future arrivals (after 8:47:00)
         → 8:51 (4 min away), 8:54 (7 min away), 8:57 (10 min away)
```

### Visual Diagram

```
GTFS Data:
┌──────────────────┐    ┌───────────────────────┐    ┌──────────────┐
│   Template Trip   │    │   Frequency Windows    │    │   Calendar   │
│                   │    │                        │    │              │
│  AG18 → 0:00     │    │  6am-9am: every 3 min  │    │  MonFri: ✓   │
│  AG17 → 2:03     │    │  9am-5pm: every 5 min  │    │  Sat: ✓      │
│  AG16 → 3:15     │    │  5pm-7pm: every 3 min  │    │  Sun: ✓      │
│  AG15 → 4:43     │    │  7pm-11pm: every 5 min │    │              │
│  AG14 → 6:21     │    │                        │    │              │
└──────────────────┘    └───────────────────────┘    └──────────────┘
         │                         │                        │
         └─────────┬───────────────┘                        │
                   ▼                                        │
        ┌─────────────────────┐                             │
        │  For each headway   │◄────────────────────────────┘
        │  departure time:    │     "Is this service active today?"
        │                     │
        │  arrival at AG14 =  │
        │  departure + 6:21   │
        └─────────────────────┘
                   │
                   ▼
        ┌─────────────────────┐
        │  Filter: only show  │
        │  arrivals after NOW │
        └─────────────────────┘
                   │
                   ▼
          "Next train: 4 min"
```

## Key Implementation Details

| Aspect | Detail |
|--------|--------|
| **Source file** | `src/lib/gtfs/schedule.ts` |
| **Data fetch** | ZIP from `api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl` |
| **Cache** | Server-side in-memory, 6-hour TTL (`src/lib/gtfs/cache.ts`) |
| **Overnight trains** | Handled by checking yesterday's schedule when current time is before 4am |
| **Timezone** | All calculations use Malaysia time (UTC+8) |

## Important: These Are Not Real-Time

The times shown are **schedule-based estimates**, not live GPS positions. If a train is delayed, the app won't know. The GTFS-realtime feed for Prasarana rail positions is not yet stable, so the app relies entirely on the published schedule.
