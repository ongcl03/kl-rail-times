import { fetchGTFSStaticZip, fetchKTMBStaticZip } from "./fetcher";
import {
  parseStops,
  parseRoutes,
  parseTrips,
  parseStopTimes,
  parseCalendar,
  parseFrequencies,
  parseShapes,
} from "./parser";
import type { GTFSData, Stop } from "./types";

// Prasarana: 6-hour cache (frequency-based schedules rarely change)
let prasaranaCache: ReturnType<typeof parseGTFSFiles> | null = null;
let prasaranaCacheTime = 0;
const PRASARANA_TTL = 6 * 60 * 60 * 1000;

// KTMB: daily cache, refreshes after midnight MYT (data updates at 00:01 MYT)
let ktmbCache: ReturnType<typeof parseGTFSFiles> | null = null;
let ktmbCacheDate = ""; // "YYYY-MM-DD" in Malaysia timezone

let cachedMerged: GTFSData | null = null;
let loadingPromise: Promise<GTFSData> | null = null;

function getMalaysiaDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

function parseGTFSFiles(files: Map<string, string>) {
  const stops = parseStops(files.get("stops.txt") || "");
  const routes = parseRoutes(files.get("routes.txt") || "");
  const trips = parseTrips(files.get("trips.txt") || "");
  const { byStop: stopTimesByStop, byTrip: stopTimesByTrip } =
    parseStopTimes(files.get("stop_times.txt") || "");
  const calendar = parseCalendar(files.get("calendar.txt") || "");
  const frequencies = parseFrequencies(files.get("frequencies.txt") || "");
  const shapes = parseShapes(files.get("shapes.txt") || "");
  return { stops, routes, trips, stopTimesByStop, stopTimesByTrip, calendar, frequencies, shapes };
}

function mergeMaps<K, V>(a: Map<K, V>, b: Map<K, V>): Map<K, V> {
  const merged = new Map(a);
  for (const [k, v] of b) merged.set(k, v);
  return merged;
}

function mergeStopTimeMaps(a: Map<string, import("./types").StopTime[]>, b: Map<string, import("./types").StopTime[]>): Map<string, import("./types").StopTime[]> {
  const merged = new Map(a);
  for (const [k, v] of b) {
    const existing = merged.get(k);
    merged.set(k, existing ? [...existing, ...v] : v);
  }
  return merged;
}

function mergeFrequencyMaps(a: Map<string, import("./types").Frequency[]>, b: Map<string, import("./types").Frequency[]>): Map<string, import("./types").Frequency[]> {
  const merged = new Map(a);
  for (const [k, v] of b) {
    const existing = merged.get(k);
    merged.set(k, existing ? [...existing, ...v] : v);
  }
  return merged;
}

function buildDerivedData(
  stops: GTFSData["stops"],
  trips: GTFSData["trips"],
  stopTimesByTrip: GTFSData["stopTimesByTrip"],
  shapes: Map<string, [number, number][]>
) {
  const stopsForRoute = new Map<string, Stop[]>();
  for (const [, trip] of trips) {
    if (trip.direction_id !== 0) continue;
    const tripStopTimes = stopTimesByTrip.get(trip.trip_id);
    if (!tripStopTimes) continue;

    const orderedStops: Stop[] = [];
    for (const st of tripStopTimes) {
      const stop = stops.get(st.stop_id);
      if (stop) orderedStops.push(stop);
    }
    const existing = stopsForRoute.get(trip.route_id);
    if (!existing || orderedStops.length > existing.length) {
      stopsForRoute.set(trip.route_id, orderedStops);
    }
  }

  const shapesForRoute = new Map<string, [number, number][]>();
  for (const [, trip] of trips) {
    if (shapesForRoute.has(trip.route_id)) continue;
    if (trip.direction_id !== 0 || !trip.shape_id) continue;
    const coords = shapes.get(trip.shape_id);
    if (coords && coords.length > 0) {
      shapesForRoute.set(trip.route_id, coords);
    }
  }

  return { stopsForRoute, shapesForRoute };
}

function mergeAndBuild(
  p: ReturnType<typeof parseGTFSFiles>,
  k: ReturnType<typeof parseGTFSFiles>
): GTFSData {
  const stops = mergeMaps(p.stops, k.stops);
  const routes = mergeMaps(p.routes, k.routes);
  const trips = mergeMaps(p.trips, k.trips);
  const stopTimesByStop = mergeStopTimeMaps(p.stopTimesByStop, k.stopTimesByStop);
  const stopTimesByTrip = mergeStopTimeMaps(p.stopTimesByTrip, k.stopTimesByTrip);
  const calendar = mergeMaps(p.calendar, k.calendar);
  const frequencies = mergeFrequencyMaps(p.frequencies, k.frequencies);
  const shapes = mergeMaps(p.shapes, k.shapes);

  const { stopsForRoute, shapesForRoute } = buildDerivedData(stops, trips, stopTimesByTrip, shapes);

  console.log(
    `[GTFS] Loaded: ${stops.size} stops, ${routes.size} routes, ${trips.size} trips, ${frequencies.size} frequency entries`
  );

  return {
    stops, routes, trips, stopTimesByStop, stopTimesByTrip,
    calendar, frequencies, stopsForRoute, shapesForRoute,
  };
}

async function loadGTFSData(): Promise<GTFSData> {
  const now = Date.now();
  const todayMYT = getMalaysiaDate();

  // Refresh Prasarana if stale (6-hour TTL)
  const needPrasarana = !prasaranaCache || now - prasaranaCacheTime >= PRASARANA_TTL;
  // Refresh KTMB if date changed (daily at midnight MYT)
  const needKtmb = !ktmbCache || ktmbCacheDate !== todayMYT;

  if (!needPrasarana && !needKtmb && cachedMerged) {
    return cachedMerged;
  }

  console.log(`[GTFS] Refreshing: Prasarana=${needPrasarana}, KTMB=${needKtmb}`);

  const [newPrasarana, newKtmb] = await Promise.all([
    needPrasarana
      ? fetchGTFSStaticZip().then(parseGTFSFiles).then((data) => {
          prasaranaCache = data;
          prasaranaCacheTime = now;
          return data;
        })
      : Promise.resolve(prasaranaCache!),
    needKtmb
      ? fetchKTMBStaticZip().then(parseGTFSFiles).then((data) => {
          ktmbCache = data;
          ktmbCacheDate = todayMYT;
          return data;
        }).catch((err) => {
          console.error("[GTFS] KTMB fetch failed:", err);
          return ktmbCache || parseGTFSFiles(new Map());
        })
      : Promise.resolve(ktmbCache!),
  ]);

  cachedMerged = mergeAndBuild(newPrasarana, newKtmb);
  return cachedMerged;
}

export async function getGTFSData(): Promise<GTFSData> {
  const now = Date.now();
  const todayMYT = getMalaysiaDate();

  // Quick check: if both caches are fresh, return merged
  const prasaranaFresh = prasaranaCache && now - prasaranaCacheTime < PRASARANA_TTL;
  const ktmbFresh = ktmbCache && ktmbCacheDate === todayMYT;
  if (prasaranaFresh && ktmbFresh && cachedMerged) {
    return cachedMerged;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = loadGTFSData()
    .then((data) => {
      loadingPromise = null;
      return data;
    })
    .catch((err) => {
      loadingPromise = null;
      if (cachedMerged) {
        console.error("[GTFS] Refresh failed, serving stale:", err);
        return cachedMerged;
      }
      throw err;
    });

  return loadingPromise;
}
