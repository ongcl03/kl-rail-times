import { fetchGTFSStaticZip } from "./fetcher";
import {
  parseStops,
  parseRoutes,
  parseTrips,
  parseStopTimes,
  parseCalendar,
  parseFrequencies,
} from "./parser";
import type { GTFSData, Stop } from "./types";

let cachedData: GTFSData | null = null;
let cacheTimestamp = 0;
let loadingPromise: Promise<GTFSData> | null = null;
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours

async function loadGTFSData(): Promise<GTFSData> {
  console.log("[GTFS] Downloading and parsing static data...");
  const files = await fetchGTFSStaticZip();

  const stops = parseStops(files.get("stops.txt") || "");
  const routes = parseRoutes(files.get("routes.txt") || "");
  const trips = parseTrips(files.get("trips.txt") || "");
  const { byStop: stopTimesByStop, byTrip: stopTimesByTrip } =
    parseStopTimes(files.get("stop_times.txt") || "");
  const calendar = parseCalendar(files.get("calendar.txt") || "");
  const frequencies = parseFrequencies(files.get("frequencies.txt") || "");

  // Build stopsForRoute: ordered list of stops per route (using direction 0)
  const stopsForRoute = new Map<string, Stop[]>();
  for (const [, trip] of trips) {
    if (stopsForRoute.has(trip.route_id)) continue;
    if (trip.direction_id !== 0) continue;
    const tripStopTimes = stopTimesByTrip.get(trip.trip_id);
    if (!tripStopTimes) continue;

    const orderedStops: Stop[] = [];
    for (const st of tripStopTimes) {
      const stop = stops.get(st.stop_id);
      if (stop) orderedStops.push(stop);
    }
    if (orderedStops.length > 0) {
      stopsForRoute.set(trip.route_id, orderedStops);
    }
  }

  console.log(
    `[GTFS] Loaded: ${stops.size} stops, ${routes.size} routes, ${trips.size} trips, ${frequencies.size} frequency entries`
  );

  return {
    stops,
    routes,
    trips,
    stopTimesByStop,
    stopTimesByTrip,
    calendar,
    frequencies,
    stopsForRoute,
  };
}

export async function getGTFSData(): Promise<GTFSData> {
  const now = Date.now();
  if (cachedData && now - cacheTimestamp < CACHE_TTL) {
    return cachedData;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = loadGTFSData()
    .then((data) => {
      cachedData = data;
      cacheTimestamp = Date.now();
      loadingPromise = null;
      return data;
    })
    .catch((err) => {
      loadingPromise = null;
      if (cachedData) {
        console.error("[GTFS] Refresh failed, serving stale:", err);
        return cachedData;
      }
      throw err;
    });

  return loadingPromise;
}
