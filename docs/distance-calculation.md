# How Distance Is Calculated

## The Problem

Station-to-station straight-line distance is inaccurate because rail tracks curve, loop, and follow roads — they don't go in straight lines.

```
Straight-line (haversine):          Actual track:

  A ─────────────── B               A ──╮
                                        │  ╭──╮
  Distance: 5.2 km                      ╰──╯  │
                                               B
                                    Distance: 7.8 km
```

## Our Approach: Track Geometry from `shapes.txt`

The GTFS data includes `shapes.txt` — a file with thousands of GPS points tracing the actual rail corridor. We sum the distances between consecutive points along the track to get the real distance.

### The Data

`shapes.txt` contains ~6,000 points across all 7 lines:

| shape_id  | shape_pt_lat | shape_pt_lon | shape_pt_sequence |
|-----------|-------------|-------------|-------------------|
| shp_AG_0  | 3.150787    | 101.760359  | 1                 |
| shp_AG_0  | 3.144578    | 101.760196  | 2                 |
| shp_AG_0  | 3.143878    | 101.759990  | 3                 |
| shp_AG_0  | 3.142863    | 101.759510  | 4                 |
| ...       | ...         | ...         | ...               |

These points, connected in order, trace the exact path the train follows.

## Step-by-Step Example

**Calculate the distance from Sungai Besi (SP16) to Tun Razak Exchange (PY23).**

```
Step 1: Get the shape polyline for the SP line
         → shp_PH_0: [point1, point2, point3, ..., point800]

Step 2: Find the closest shape point to Sungai Besi station
         → Station coords: (3.0625, 101.7110)
         → Closest shape point: index 245

Step 3: Find the closest shape point to TRX station
         → Station coords: (3.1428, 101.7190)
         → Closest shape point: index 412

Step 4: Sum haversine distances between consecutive points from 245 → 412
         → point[245] → point[246]: 0.032 km
         → point[246] → point[247]: 0.028 km
         → point[247] → point[248]: 0.041 km
         → ...
         → Total: 12.34 km
```

## The Haversine Formula

Used to calculate the distance between two GPS coordinates on Earth's surface:

```
R = 6,371 km  (Earth's radius)

a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)

distance = R × 2 × atan2(√a, √(1-a))
```

We don't use haversine between stations directly — we use it between **consecutive shape points** (which are very close together), then sum up all the tiny segments to get the total track distance.

## Different Cases

| Leg Type | How Distance Is Calculated |
|----------|---------------------------|
| **Rail leg** | Sum of haversine distances along shape points between the from/to stations |
| **Transfer (walk)** | Straight-line haversine between the two interchange stations |
| **Rail leg (no shape data)** | Fallback: straight-line haversine between from and to stations |

## Multi-Leg Journey Distance

For a journey with transfers, the total distance is the sum of all leg distances:

```
Example: IOI Puchong Jaya → Tun Razak Exchange

  Leg 1 (SP rail):  IOI Puchong Jaya → Sungai Besi    = 8.5 km (track distance)
  Leg 2 (walk):     SP16 → PY29 (interchange walk)     = 0.1 km (straight-line)
  Leg 3 (PY rail):  Sungai Besi → TRX                  = 13.2 km (track distance)
                                                ─────────────────
  Total:                                                  21.8 km
```

## Key Implementation Details

| Aspect | Detail |
|--------|--------|
| **Source file** | `src/lib/journey/pathfinder.ts` — `haversineKm()` and `legDistanceKm()` |
| **Shape data** | Parsed from `shapes.txt` in `src/lib/gtfs/parser.ts` — `parseShapes()` |
| **Precision** | Rounded to 2 decimal places (e.g., 21.80 km) |
| **Shape matching** | Finds closest shape point to each station using squared Euclidean distance |
