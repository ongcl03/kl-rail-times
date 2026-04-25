# Data Limitations & Known Gaps

This app relies on Malaysia's open government GTFS data feeds. While the data is generally accurate, there are known gaps and limitations.

## Data Sources

| Provider | Feed | URL |
|----------|------|-----|
| **Prasarana** (Rapid KL) | LRT, MRT, Monorail, BRT | `api.data.gov.my/gtfs-static/prasarana?category=rapid-rail-kl` |
| **KTMB** | KTM Komuter, ETS, Intercity | `api.data.gov.my/gtfs-static/ktmb` |

## Prasarana (Rapid KL)

Prasarana data is generally **complete and reliable**:
- All 7 lines have full station lists, frequency windows, and service calendars
- Route geometry (`shapes.txt`) is included for accurate map polylines
- Realtime vehicle positions are available but **unstable for rail** — the feed works intermittently

### Limitation: Schedule-based only

Arrival times are computed from the published schedule (frequency windows), not from live GPS. If a train is delayed, the app won't reflect it.

## KTMB

KTMB data has **significant gaps** in the government feed. The data updates daily at 00:01 MYT.

### KTM Komuter (Seremban & Port Klang Lines)

| Issue | Detail |
|-------|--------|
| **Short-turn services** | Most trips don't run the full route. E.g., Seremban Line: only 2–3 of ~14 weekday trains go past Midvalley to Seremban/Tampin. Most terminate at Midvalley or KL Sentral. This is real — not a bug. |
| **Missing stop_times** | ~36 of 85 Seremban trips and ~14 of 86 Port Klang trips have no schedule data in the GTFS feed. These trips exist but their timetables weren't included. |
| **No shapes** | KTMB provides no `shapes.txt`. Map draws station-to-station straight lines instead of curved track geometry. |
| **No frequencies** | Unlike Prasarana, KTMB uses individual trip schedules, not frequency windows. Each train has its own specific timetable. |

### ETS (Electric Train Service)

| Issue | Detail |
|-------|--------|
| **Missing southern leg** | The GTFS route says "Padang Besar - Gemas", but in reality ETS runs **KL Sentral → Gemas → JB Sentral** with 7 daily departures. The entire KL Sentral → JB Sentral section is missing from the feed. |
| **Mostly empty** | Only 6 of 24 ETS trips have stop_times. The other 18 trips are defined but have no schedule data. |

### ES (Ekspres Selatan)

| Issue | Detail |
|-------|--------|
| **Zero schedule data** | All 6 trips have zero stop_times. The route (Gemas → JB Sentral) exists in KTMB's timetable but wasn't included in the GTFS feed. The line appears in the app but shows no arrivals. |

### Other Intercity Lines

| Line | Status |
|------|--------|
| **SH (Shuttle)** | Mostly complete — 12 of 14 trips have data. Tumpat → Kuala Lipis. |
| **ERT (Ekspres Rakyat Timuran)** | Complete — 2 trips (1 each way). Tumpat → JB Sentral overnight service. |
| **ST (Shuttle Tebrau)** | Complete — 31 trips. JB Sentral → Woodlands (Singapore). |

### Shared Stations

KTMB routes share the same stop IDs at physical stations. For example, Tumpat (`86300`) is served by both SH and ERT. The app handles this by showing separate line-filtered views when you select a specific line.

### Missing Stop

Stop ID `37200` is referenced in ERT's stop_times but is missing from `stops.txt` (no name or coordinates). This station is likely near JB Sentral. It is silently skipped.

## What This Means for Users

- **Prasarana arrivals**: Reliable schedule estimates, updated every 6 hours
- **KTM Komuter arrivals**: Accurate for trips that have data, but some services are missing from the feed
- **ETS arrivals**: Very limited — only a few trips shown, southern leg to JB Sentral not available
- **ES arrivals**: Not available at all
- **All arrival times**: Based on scheduled timetable, not real-time GPS

## Recommendation

For KTMB services, users should cross-reference with the official KTMB timetable:
**[ktmb.com.my/TrainTime.html](https://www.ktmb.com.my/TrainTime.html)**

The app shows a direct link to this page on all KTM station pages.
