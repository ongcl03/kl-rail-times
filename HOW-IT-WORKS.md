# How KL Rail Times Calculates Arrival Times

## TL;DR — How It Works

This app shows **estimated arrival times** for KL's rail transit (LRT, MRT, Monorail). The estimates are based on **official timetable data + our own calculations** — it is **not real-time GPS tracking**.

### What the timetable gives us (from data.gov.my)

- A **template trip** — the travel time from start to each station (e.g., "KLCC is 74 min from Putra Heights")
- **Frequencies** — how often trains repeat (e.g., "every 4 min during peak, every 7 min off-peak")
- **Calendar** — which schedule to use (weekday vs weekend)

### What we calculate

- **All actual train departures** — expand "every 7 min from 6:00-7:00" into 6:00, 6:07, 6:14, 6:21...
- **Arrival time at your station** — each departure + travel time offset
- **Minutes away** — arrival time minus current time, counting down live

### In plain English

```
The timetable says:
  "A train takes 74 min from start to KLCC"
  "Trains repeat every 7 min from 6:00 to 7:00"

We calculate:
  "So trains arrive at KLCC at 7:14, 7:21, 7:28, 7:35..."
  "It's now 7:19, so next train is in 2 minutes"
```

The timetable never literally says "a train arrives at KLCC at 7:21". It only provides the trip pattern and repeat frequency. We do the math to produce actual arrival times.

### Limitations

- **Not real-time tracking** — if a train is delayed 5 minutes, we won't know. We show the scheduled time regardless.
- **No disruption awareness** — breakdowns, maintenance, service changes are not reflected.
- **Accuracy depends on schedule adherence** — for KL rail (fixed tracks, no traffic), this is usually within 1-2 minutes. Buses would be much less accurate.
- **Future improvement** — when data.gov.my launches their Trip Updates API (planned 2026), we can switch to actual real-time predictions.

---

## Data Source

All data comes from **data.gov.my**'s GTFS Static API:

```
https://api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl
```

This returns a ZIP file containing these key CSV files:

| File              | What it contains                                      |
|-------------------|-------------------------------------------------------|
| `stops.txt`       | All stations (name, ID, lat/lng)                      |
| `routes.txt`      | Rail lines (Kelana Jaya, Ampang, MRT Kajang, etc.)    |
| `trips.txt`       | One "template trip" per line per direction per service |
| `stop_times.txt`  | Time at each station for each template trip            |
| `frequencies.txt` | How often each template trip repeats                   |
| `calendar.txt`    | Which services run on which days                       |

---

## The Key Insight: Frequency-Based Scheduling

Prasarana's GTFS data does **NOT** list every individual train. Instead, it defines:

1. **One template trip** per line/direction (e.g., "KJL_MonFri_0" = Kelana Jaya, Monday-Friday, direction 0)
2. **Frequencies** that say "repeat this trip every N seconds within time windows"

### Example: LRT Kelana Jaya on a weekday

**Template trip** `KJL_MonFri_0` (Putra Heights → Gombak):

```
stop_times.txt:
  KJ37 (Putra Heights)  depart  06:00:00   ← trip starts here
  KJ36 (Subang Alam)    arrive  06:03:19
  KJ35 (Alam Megah)     arrive  06:05:58
  ...
  KJ10 (KLCC)           arrive  07:14:39   ← 74 min 39 sec after start
  ...
  KJ1  (Gombak)         arrive  07:38:03
```

**Frequencies** for this trip:

```
frequencies.txt:
  06:00 - 07:00  →  every 420 sec (7 min)    [off-peak]
  07:00 - 09:00  →  every 240 sec (4 min)    [peak hour]
  09:00 - 17:00  →  every 420 sec (7 min)    [off-peak]
  17:00 - 19:00  →  every 240 sec (4 min)    [peak hour]
  19:00 - 23:15  →  every 420 sec (7 min)    [off-peak]
```

---

## The Calculation (Step by Step)

### Step 1: Determine the travel offset

For each station on a trip, we calculate how long it takes to get there from the first station:

```
offset = station_arrival_time - first_station_departure_time
```

**Example for KLCC (KJ10):**

```
offset = 07:14:39 - 06:00:00 = 4,479 seconds (74 min 39 sec)
```

This offset is constant — it takes ~75 minutes for a train to travel from Putra Heights to KLCC regardless of when it departs.

### Step 2: Generate all train departures from frequency windows

For each frequency window, we generate departure times:

```
Window: 07:00 - 09:00, headway = 240 seconds (4 min)

Train 1 departs at  07:00:00
Train 2 departs at  07:04:00
Train 3 departs at  07:08:00
Train 4 departs at  07:12:00
...and so on until 09:00
```

### Step 3: Calculate arrival at your station

For each generated departure, add the offset:

```
arrival_at_KLCC = departure_time + offset

Train 1: 07:00:00 + 4,479s = 08:14:39
Train 2: 07:04:00 + 4,479s = 08:18:39
Train 3: 07:08:00 + 4,479s = 08:22:39
```

### Step 4: Filter to upcoming trains

Compare each computed arrival against the current time:

```
minutes_away = (arrival_time - current_time) / 60

If current time is 08:16:00:
  Train 1: 08:14:39 → -1 min  → SKIP (already passed)
  Train 2: 08:18:39 → 3 min   → SHOW ✓
  Train 3: 08:22:39 → 7 min   → SHOW ✓
```

### Step 5: Show only the next 60 minutes, top 5

We keep only arrivals within the next 60 minutes and return the nearest 5 per direction.

---

## Weekday vs Weekend Scheduling

The GTFS `calendar.txt` defines which services run on which days:

```
calendar.txt:
  service_id  | Mon | Tue | Wed | Thu | Fri | Sat | Sun
  ────────────┼─────┼─────┼─────┼─────┼─────┼─────┼────
  MonFri      |  ✓  |  ✓  |  ✓  |  ✓  |  ✓  |     |
  MonThu      |  ✓  |  ✓  |  ✓  |  ✓  |     |     |
  Fri         |     |     |     |     |  ✓  |     |
  Sat         |     |     |     |     |     |  ✓  |
  Sun         |     |     |     |     |     |     |  ✓
  SatSun      |     |     |     |     |     |  ✓  |  ✓
  weekday     |  ✓  |  ✓  |  ✓  |  ✓  |  ✓  |     |
  weekend     |     |     |     |     |     |  ✓  |  ✓
```

Each template trip is tied to a service. For example:
- `SPL_MonFri_0` → runs on `MonFri` service → active Mon-Fri only
- `SPL_Sat_0` → runs on `Sat` service → active Saturday only
- `SPL_Sun_0` → runs on `Sun` service → active Sunday only

**When you query arrivals, we check the current day of week and only use matching services:**

```
Wednesday 10:00 AM → active services: MonThu, MonFri, weekday
Saturday 3:00 PM   → active services: Sat, SatSun, weekend
Sunday 8:00 PM     → active services: Sun, SatSun, weekend
```

This means weekday peak-hour frequencies (every 3-4 min) are automatically used on weekdays, and weekend frequencies (every 5-7 min) on weekends.

---

## The Midnight Edge Case

### The Problem

Last trains depart around **23:50-23:55**, but stations far along the line don't get reached until **after midnight**. For example on LRT Sri Petaling:

```
Last train departs Sentul Timur at 23:55 (Sunday schedule)
  ↓ travels 46 minutes...
Arrives at IOI Puchong Jaya at 00:41 (now technically Monday!)
```

This creates two problems:

1. **Time wraps around:** The GTFS arrival time is `86400 + 2473 = 88873 seconds` (i.e., 24:41:13), but after midnight `getCurrentSeconds()` returns `~1080` (00:18:00). The difference is 87,793 seconds — way beyond our 60-minute window, so it gets filtered out.

2. **Wrong calendar day:** At 00:18 AM Monday, the system picks Monday's services. But the trains still running were dispatched under **Sunday's schedule**.

### The Fix

Before 4:00 AM, we run **two passes**:

```
┌─────────────────────────────────────────────────────────┐
│                  Current time: 00:18 AM Monday          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  PASS 1: Today's schedule (Monday)                      │
│  ─────────────────────────────────                      │
│  • Services: MonThu, MonFri, weekday                    │
│  • nowSeconds = 1,080 (00:18:00)                        │
│  • Finds: Monday's early trains (if any ran this early) │
│  • Result: usually empty (trains start at 6 AM)         │
│                                                         │
│  PASS 2: Yesterday's overnight schedule (Sunday)        │
│  ──────────────────────────────────────────────          │
│  • Services: Sun, SatSun, weekend                       │
│  • nowSeconds = 1,080 + 86,400 = 87,480                 │
│  • This shifted time can compare against GTFS times     │
│    like 88,873 (which is 24:41:13 in GTFS notation)     │
│  • diff = 88,873 - 87,480 = 1,393 sec (23 min) ✓       │
│  • Result: shows the late-night trains still arriving!   │
│                                                         │
│  MERGE: combine both passes, sort by minutesAway        │
└─────────────────────────────────────────────────────────┘
```

### All midnight-crossing scenarios

```
┌────────────────────────────────────┬──────────────────────┬──────────────────────────┐
│ Current Time                       │ Today's Services     │ Yesterday's Overnight    │
├────────────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Saturday 00:30 AM                  │ Sat, SatSun, weekend │ Fri → MonFri, Fri,       │
│ (Friday night trains still going)  │                      │      weekday             │
├────────────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Sunday 00:15 AM                    │ Sun, SatSun, weekend │ Sat → Sat, SatSun,       │
│ (Saturday night trains still going)│                      │      weekend             │
├────────────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Monday 00:20 AM                    │ MonThu, MonFri,      │ Sun → Sun, SatSun,       │
│ (Sunday night trains still going)  │ weekday              │      weekend             │
├────────────────────────────────────┼──────────────────────┼──────────────────────────┤
│ Tuesday 00:10 AM                   │ MonThu, MonFri,      │ Mon → MonThu, MonFri,    │
│ (Monday night trains still going)  │ weekday              │      weekday             │
└────────────────────────────────────┴──────────────────────┴──────────────────────────┘
```

The 4:00 AM cutoff is safe because:
- Last trains depart at ~23:55
- The longest route (end-to-end) takes ~98 minutes
- So the absolute latest a train could arrive is ~01:33 AM
- 4 AM gives plenty of margin

---

## Visual Diagram

```
                         GTFS DATA
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
         calendar.txt   stop_times.txt  frequencies.txt
              │             │             │
              ▼             │             │
    ┌───────────────────┐   │             │
    │ What day is it?   │   │             │
    │                   │   │             │
    │ Before 4 AM?      │   │             │
    │ → also check      │   │             │
    │   yesterday!      │   │             │
    └────────┬──────────┘   │             │
             │              │             │
             ▼              ▼             ▼
    ┌─────────────────────────────────────────────────┐
    │         ARRIVAL COMPUTATION ENGINE               │
    │                                                  │
    │  For each active service (today + yesterday):    │
    │                                                  │
    │  1. Find stop_times for requested station        │
    │  2. Get template trip's first departure          │
    │  3. offset = station_time - first_departure      │
    │  4. For each frequency window:                   │
    │     For each headway interval:                   │
    │       arrival = departure + offset               │
    │  5. Filter: now < arrival < now + 60 min         │
    │     (overnight: use now + 86400 for comparison)  │
    │  6. Merge today + yesterday results              │
    │  7. Sort by arrival time, take top 5             │
    │                                                  │
    └──────────────────┬──────────────────────────────┘
                       │
                       ▼
               ┌───────────────┐
               │  JSON Response │
               │               │
               │  "IOI Puchong" │
               │  To P.Heights:│
               │   4 min       │
               │   9 min       │
               └───────────────┘
```

---

## What About the Realtime Vehicle Position API?

data.gov.my also offers a GTFS Realtime API:

```
https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-rail-kl
```

This returns **GPS positions** of trains (latitude/longitude), updated every 30 seconds. However:

- It only provides **where the train is**, not **when it will arrive**
- The feed for rail is **not fully stable** yet
- **Trip Updates** (actual predicted arrival times) are planned for 2026 but haven't launched yet

We have this endpoint wired up at `/api/vehicle-positions` for future use. When Trip Updates become available, we can switch from schedule-based to prediction-based arrivals.

---

## How Accurate Is This?

| Factor | Impact |
|--------|--------|
| Trains run on fixed tracks | Very predictable — schedule is reliable |
| No traffic variability (unlike buses) | Schedule-based times are usually within 1-2 minutes |
| Delays, breakdowns, maintenance | NOT accounted for — we show scheduled time regardless |
| Peak vs off-peak frequency changes | Correctly handled via frequency windows |
| Weekday vs weekend schedules | Correctly handled via calendar.txt |
| Late-night trains crossing midnight | Correctly handled via overnight pass |

**Bottom line:** For KL's rail system, scheduled times are **surprisingly accurate** most of the time. The main gap is during disruptions, which we can't detect until Trip Updates or Service Alerts become available.

---

## Data Refresh Cycle

```
GTFS Static ZIP ──── cached in server memory ──── refreshed every 6 hours
                          │
                          ▼
  /api/arrivals/[stopId] ── computed on every request (fast, ~5ms)
                          │
                          ▼
    Browser (SWR) ──── polls every 30 seconds
                          │
                          ▼
    Countdown timer ──── ticks every 1 second (client-side)
```

The countdown you see ticking in the UI is a **client-side timer** that counts down between API refreshes. Every 30 seconds, it syncs with fresh calculations from the server.
