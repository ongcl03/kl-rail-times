# How Routes Are Found

## Overview

The journey planner finds the fastest route between two stations using **Dijkstra's shortest-path algorithm** on a network graph, then finds alternative routes using a **penalty-based re-running** approach.

## Part 1: The Network Graph

Before any route can be found, the app builds a graph representing the entire rail network.

### Nodes

Every station is a node. There are ~166 stations across 7 lines.

### Edges

Two types of edges connect the nodes:

| Edge Type | What It Connects | Weight (cost) |
|-----------|-----------------|---------------|
| **Rail** | Consecutive stations on the same line | Actual travel time in seconds (from GTFS `stop_times.txt`) |
| **Transfer** | Stations at the same interchange (different lines) | Walking time in seconds (manually defined per interchange) |

Rail edges are **bidirectional** — you can travel in both directions on any line.

### Example: A Small Section of the Graph

```
           KJ Line                    AG/SP Line
        ┌──────────┐               ┌──────────┐
        │   KJ12   │               │   AG6    │
        │ Dang Wangi│               │ Bandaraya│
        └────┬─────┘               └────┬─────┘
             │ 120s (rail)               │ 90s (rail)
        ┌────┴─────┐               ┌────┴─────┐
        │   KJ13   │───── 240s ────│   AG7    │  ← Transfer edge (4 min walk)
        │Masjid Jamek│  (transfer)  │Masjid Jamek│
        └────┬─────┘               └────┬─────┘
             │ 90s (rail)                │ 120s (rail)
        ┌────┴─────┐               ┌────┴─────┐
        │   KJ14   │               │   AG8    │
        │ Pasar Seni│               │Plaza Rakyat│
        └──────────┘               └──────────┘
```

### Transfer Times

Each interchange has a manually defined walking time based on the physical station layout:

| Walk Time | Interchanges |
|-----------|-------------|
| **0 min** | AG/SP shared trunk stations (same platform — Sentul Timur, Sentul, PWTC, Sultan Ismail, Bandaraya, Plaza Rakyat, Pudu) |
| **3 min** | Putra Heights |
| **4 min** | Masjid Jamek, Hang Tuah, Chan Sow Lin, Pasar Seni, Ampang Park, Kwasa Damansara, Tun Razak Exchange, Sungai Besi |
| **5 min** | Titiwangsa, Maluri, KL Sentral, Bukit Bintang |

Source: `src/lib/journey/interchanges.ts`

## Part 2: Finding the Shortest Path (Dijkstra's Algorithm)

### How It Works

1. Start at the origin station with cost = 0
2. Explore the cheapest unvisited neighbor
3. Update costs if a cheaper path is found
4. Repeat until the destination is reached

### Transfer Penalty

A **120-second penalty** is added to every transfer edge. This prevents the algorithm from choosing a route with unnecessary transfers that saves only a few seconds.

Without penalty: "29 min with 2 transfers" would beat "30 min direct"
With penalty: "30 min direct" wins because the transfers add 2 × 120s = 240s to the cost

> The penalty affects only the **route selection** — the displayed travel time does not include the penalty.

### Walkthrough Example

**Find the route from AG18 (Ampang) to KJ14 (Pasar Seni)**

```
Start: AG18, cost = 0

Step 1: Visit AG18 → neighbors: AG17 (120s)
        Queue: [AG17: 120s]

Step 2: Visit AG17 → neighbors: AG16 (73s)
        Queue: [AG16: 193s]

    ... (continues through AG line stations) ...

Step N: Visit AG7 (Masjid Jamek) → neighbors:
        - AG8 via rail: cost + 120s
        - KJ13 via transfer: cost + 240s + 120s penalty

Step N+1: Visit KJ13 (Masjid Jamek KJ) → neighbors:
          - KJ14 via rail: cost + 90s  ← DESTINATION REACHED!

Result: AG18 → AG17 → ... → AG7 → [walk] → KJ13 → KJ14
```

### Collapsing Into Legs

The raw Dijkstra path is a sequence of individual station-to-station steps. These are collapsed into human-readable legs:

```
Raw path:  AG18→AG17, AG17→AG16, ..., AG7→KJ13 (transfer), KJ13→KJ14

Collapsed:
  Leg 1: AG18 → AG7 (LRT Ampang, 15 min, 12 stops)
  Leg 2: Walk 4 min to change line
  Leg 3: KJ13 → KJ14 (LRT Kelana Jaya, 1.5 min, 1 stop)
```

## Part 3: Finding Alternative Routes

### The Problem

Dijkstra finds the single best route. But users want to see options — maybe a different transfer point is more convenient even if slightly slower.

### The Approach: Penalty-Based Re-Running

```
┌─────────────────────────────────────────────┐
│  Run 1: Normal Dijkstra                      │
│  → Route 1: via Sungai Besi (34 min) ✓      │
│                                              │
│  Penalize Route 1's edges:                   │
│  - Transfer edges: +9999s (blocks them)      │
│  - Rail edges: +600s (discourages them)      │
│                                              │
│  Run 2: Dijkstra with penalties              │
│  → Route 2: via Chan Sow Lin (36 min) ✓     │
│                                              │
│  Add Route 2's penalties too                 │
│                                              │
│  Run 3: Dijkstra with accumulated penalties  │
│  → Route 3: via Titiwangsa (56 min) ✓       │
└─────────────────────────────────────────────┘
```

### Why This Works

- **Transfer edges get +9999s** — this effectively blocks the interchange point used by the previous route, forcing the algorithm to find a route through a different interchange
- **Rail edges get +600s** — this discourages using the exact same track segments but doesn't block them entirely (since some track must be shared)
- **Penalties accumulate** — Route 3 avoids both Route 1 and Route 2's interchanges

### Deduplication

Each route gets a **signature** — the sequence of lines and transfer points:

```
Route 1: "PH|xfer:SP16-PY29|PYL"     (SP line → walk at Sungai Besi → PY line)
Route 2: "PH|xfer:SP11-PY24|PYL"     (SP line → walk at Chan Sow Lin → PY line)
Route 3: "PH|xfer:SP3-PY17|PYL"      (SP line → walk at Titiwangsa → PY line)
```

If two runs produce the same signature, the duplicate is skipped and Dijkstra runs again.

### Filtering

Routes more than **2x slower** than the fastest are dropped — a 90-minute alternative to a 30-minute route isn't useful.

### Summary

| Parameter | Value | Purpose |
|-----------|-------|---------|
| Max routes | 3 | Cap on alternatives returned |
| Max attempts | maxRoutes + 3 = 6 | Extra runs to handle duplicates |
| Transfer penalty | 9999s | Block previous interchange points |
| Rail penalty | 600s | Discourage same segments |
| Slowness filter | 2x fastest | Drop unreasonably slow routes |

## Key Implementation Details

| Aspect | Detail |
|--------|--------|
| **Graph builder** | `src/lib/journey/graph.ts` — `buildNetworkGraph()` |
| **Dijkstra** | `src/lib/journey/pathfinder.ts` — `dijkstra()` |
| **Alternative routes** | `src/lib/journey/pathfinder.ts` — `findAlternativeRoutes()` |
| **Interchange data** | `src/lib/journey/interchanges.ts` — manually defined |
| **Leg collapsing** | `src/lib/journey/pathfinder.ts` — `buildLegs()` |
| **Graph cache** | Rebuilt every 6 hours (aligned with GTFS cache) |
