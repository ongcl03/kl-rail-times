import { fetchBusStaticZip } from "./fetcher";
import {
  parseStops,
  parseRoutes,
  parseTrips,
  parseStopTimes,
  parseCalendar,
} from "@/lib/gtfs/parser";
import type { BusGTFSData, BusOperator } from "./types";
import type { Stop } from "@/lib/gtfs/types";

function getMalaysiaDate(): string {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
}

// Luminance-based text color contrast helper
function getTextColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

function parseAndBuild(files: Map<string, string>): BusGTFSData {
  const stops = parseStops(files.get("stops.txt") || "");
  const routes = parseRoutes(files.get("routes.txt") || "");
  const trips = parseTrips(files.get("trips.txt") || "");
  const { byStop: stopTimesByStop, byTrip: stopTimesByTrip } = parseStopTimes(
    files.get("stop_times.txt") || ""
  );
  const calendar = parseCalendar(files.get("calendar.txt") || "");

  // Patch route colors — GTFS stores them without '#'
  // PapaParse dynamicTyping may parse numeric hex codes (e.g. "123456") as numbers;
  // always coerce to string first.
  for (const [, route] of routes) {
    const raw = route.route_color != null ? String(route.route_color).trim() : "";
    if (raw && !raw.startsWith("#")) {
      route.route_color = `#${raw}`;
    } else if (!raw) {
      route.route_color = "#6B7280";
    } else {
      route.route_color = raw;
    }
    // Coerce short/long names to strings (numeric route IDs get parsed as numbers)
    route.route_short_name = String(route.route_short_name ?? "");
    route.route_long_name = String(route.route_long_name ?? "");
  }

  // Build stopsForRoute for both directions (take longest trip per direction)
  const stopsForRoute = new Map<string, { dir0: Stop[]; dir1: Stop[] }>();
  const headsignsForRoute = new Map<string, { dir0: string; dir1: string }>();

  for (const [, trip] of trips) {
    const tripStopTimes = stopTimesByTrip.get(trip.trip_id);
    if (!tripStopTimes || tripStopTimes.length === 0) continue;

    const existing = stopsForRoute.get(trip.route_id) || { dir0: [], dir1: [] };
    const orderedStops: Stop[] = [];
    for (const st of tripStopTimes) {
      const stop = stops.get(st.stop_id);
      if (stop) orderedStops.push(stop);
    }

    const dirKey = trip.direction_id === 0 ? "dir0" : "dir1";
    if (orderedStops.length > existing[dirKey].length) {
      existing[dirKey] = orderedStops;
    }
    stopsForRoute.set(trip.route_id, existing);

    // Capture first headsign found per direction
    if (trip.trip_headsign) {
      const existingH = headsignsForRoute.get(trip.route_id) || { dir0: "", dir1: "" };
      const dirKeyH = trip.direction_id === 0 ? "dir0" : "dir1";
      if (!existingH[dirKeyH]) {
        existingH[dirKeyH] = trip.trip_headsign;
        headsignsForRoute.set(trip.route_id, existingH);
      }
    }
  }

  // For routes with no direction 1 stops (circular/one-way), infer from reversed dir0
  for (const [, dirs] of stopsForRoute) {
    if (dirs.dir0.length > 0 && dirs.dir1.length === 0) {
      dirs.dir1 = [...dirs.dir0].reverse();
    }
  }

  // Fill missing headsigns from last stop name
  for (const [routeId, dirs] of stopsForRoute) {
    const h = headsignsForRoute.get(routeId) || { dir0: "", dir1: "" };
    if (!h.dir0 && dirs.dir0.length > 0) {
      h.dir0 = dirs.dir0[dirs.dir0.length - 1].stop_name;
    }
    if (!h.dir1 && dirs.dir1.length > 0) {
      h.dir1 = dirs.dir1[dirs.dir1.length - 1].stop_name;
    }
    headsignsForRoute.set(routeId, h);
  }

  console.log(
    `[Bus GTFS] Loaded: ${stops.size} stops, ${routes.size} routes, ${trips.size} trips`
  );

  return {
    stops,
    routes,
    trips,
    stopTimesByStop,
    stopTimesByTrip,
    calendar,
    stopsForRoute,
    headsignsForRoute,
  };
}

// ─── Per-operator cache ───────────────────────────────────────────────────────

interface OperatorCacheEntry {
  data: BusGTFSData | null;
  cacheDate: string;
  loadingPromise: Promise<BusGTFSData> | null;
}

const operatorCaches = new Map<BusOperator, OperatorCacheEntry>();

function getOrInitCache(operator: BusOperator): OperatorCacheEntry {
  if (!operatorCaches.has(operator)) {
    operatorCaches.set(operator, {
      data: null,
      cacheDate: "",
      loadingPromise: null,
    });
  }
  return operatorCaches.get(operator)!;
}

async function loadOperatorData(operator: BusOperator): Promise<BusGTFSData> {
  const files = await fetchBusStaticZip(operator);
  return parseAndBuild(files);
}

export async function getBusData(operator: BusOperator): Promise<BusGTFSData> {
  const cache = getOrInitCache(operator);
  const todayMYT = getMalaysiaDate();

  // Return from cache if today's data is already loaded
  if (cache.data && cache.cacheDate === todayMYT) {
    return cache.data;
  }

  // Return the in-flight promise if already loading
  if (cache.loadingPromise) {
    return cache.loadingPromise;
  }

  // Start loading
  cache.loadingPromise = loadOperatorData(operator)
    .then((data) => {
      cache.data = data;
      cache.cacheDate = todayMYT;
      cache.loadingPromise = null;
      return data;
    })
    .catch((err) => {
      cache.loadingPromise = null;
      if (cache.data) {
        console.error(`[Bus GTFS] Refresh failed for ${operator}, serving stale:`, err);
        return cache.data;
      }
      throw err;
    });

  return cache.loadingPromise;
}

export { getTextColor };
