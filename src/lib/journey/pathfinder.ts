import type { GTFSData } from "../gtfs/types";
import type { NetworkGraph, JourneyLeg, JourneyRoute } from "./types";
import { matchLineByRouteId } from "../lines";
import { parseGTFSTime, getCurrentSeconds, formatTime, getMalaysiaDayOfWeek, getMalaysiaDateString, getDayOfWeekForDate, dateToGTFSDateString } from "../utils";
import { getNetworkGraph } from "./graph";
import { getGTFSData } from "../gtfs/cache";

const TRANSFER_PENALTY = 120; // seconds penalty per transfer to discourage unnecessary ones

/** Haversine distance between two lat/lon points in km */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Calculate track distance for a leg using shape polyline or station coords */
function legDistanceKm(leg: JourneyLeg, data: GTFSData): number {
  if (leg.type === "transfer") {
    // Walking transfer: straight-line between the two stops
    const from = data.stops.get(leg.fromStopId);
    const to = data.stops.get(leg.toStopId);
    if (from && to) return haversineKm(from.stop_lat, from.stop_lon, to.stop_lat, to.stop_lon);
    return 0;
  }

  // Rail leg: try shape data for actual track distance
  const shape = data.shapesForRoute.get(leg.routeId);
  if (shape && shape.length > 0) {
    const fromStop = data.stops.get(leg.fromStopId);
    const toStop = data.stops.get(leg.toStopId);
    if (fromStop && toStop) {
      // Find closest shape points to from/to stations
      let fromIdx = 0, toIdx = 0, bestFromDist = Infinity, bestToDist = Infinity;
      for (let i = 0; i < shape.length; i++) {
        const df = (shape[i][0] - fromStop.stop_lat) ** 2 + (shape[i][1] - fromStop.stop_lon) ** 2;
        const dt = (shape[i][0] - toStop.stop_lat) ** 2 + (shape[i][1] - toStop.stop_lon) ** 2;
        if (df < bestFromDist) { bestFromDist = df; fromIdx = i; }
        if (dt < bestToDist) { bestToDist = dt; toIdx = i; }
      }
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      let dist = 0;
      for (let i = start; i < end; i++) {
        dist += haversineKm(shape[i][0], shape[i][1], shape[i + 1][0], shape[i + 1][1]);
      }
      return dist;
    }
  }

  // Fallback: straight-line between from and to
  const from = data.stops.get(leg.fromStopId);
  const to = data.stops.get(leg.toStopId);
  if (from && to) return haversineKm(from.stop_lat, from.stop_lon, to.stop_lat, to.stop_lon);
  return 0;
}

interface DijkstraNode {
  stopId: string;
  cost: number;
  path: { fromStopId: string; toStopId: string; routeId: string; travelSeconds: number; type: "rail" | "transfer" }[];
}

function dijkstra(
  graph: NetworkGraph,
  fromStopId: string,
  toStopId: string,
  edgePenalties?: Map<string, number>
): DijkstraNode | null {
  const visited = new Set<string>();
  // Simple priority queue (sorted insert) — fine for ~200 nodes
  const queue: DijkstraNode[] = [{ stopId: fromStopId, cost: 0, path: [] }];

  while (queue.length > 0) {
    // Pop lowest cost
    queue.sort((a, b) => a.cost - b.cost);
    const current = queue.shift()!;

    if (current.stopId === toStopId) {
      return current;
    }

    if (visited.has(current.stopId)) continue;
    visited.add(current.stopId);

    const edges = graph.get(current.stopId);
    if (!edges) continue;

    for (const edge of edges) {
      if (visited.has(edge.toStopId)) continue;

      const penalty = edge.type === "transfer" ? TRANSFER_PENALTY : 0;
      const extraPenalty = edgePenalties?.get(`${current.stopId}->${edge.toStopId}`) ?? 0;
      const newCost = current.cost + edge.travelSeconds + penalty + extraPenalty;

      queue.push({
        stopId: edge.toStopId,
        cost: newCost,
        path: [
          ...current.path,
          {
            fromStopId: current.stopId,
            toStopId: edge.toStopId,
            routeId: edge.routeId,
            travelSeconds: edge.travelSeconds,
            type: edge.type,
          },
        ],
      });
    }
  }

  return null; // No path found
}

/** Collapse consecutive rail edges on the same route into single legs */
function buildLegs(
  path: DijkstraNode["path"],
  data: GTFSData
): JourneyLeg[] {
  if (path.length === 0) return [];

  const legs: JourneyLeg[] = [];
  let currentLeg: {
    routeId: string;
    type: "rail" | "transfer";
    stops: string[]; // ordered stop_ids
    travelSeconds: number;
  } | null = null;

  for (const step of path) {
    if (
      currentLeg &&
      currentLeg.type === "rail" &&
      step.type === "rail" &&
      step.routeId === currentLeg.routeId
    ) {
      // Continue same rail leg
      currentLeg.stops.push(step.toStopId);
      currentLeg.travelSeconds += step.travelSeconds;
    } else {
      // Start a new leg
      if (currentLeg) {
        legs.push(finalizeLeg(currentLeg, data));
      }
      currentLeg = {
        routeId: step.routeId,
        type: step.type,
        stops: [step.fromStopId, step.toStopId],
        travelSeconds: step.travelSeconds,
      };
    }
  }

  if (currentLeg) {
    legs.push(finalizeLeg(currentLeg, data));
  }

  return legs;
}

function finalizeLeg(
  leg: { routeId: string; type: "rail" | "transfer"; stops: string[]; travelSeconds: number },
  data: GTFSData
): JourneyLeg {
  const line = leg.type === "rail" ? matchLineByRouteId(leg.routeId) : null;
  const fromStop = data.stops.get(leg.stops[0]);
  const toStop = data.stops.get(leg.stops[leg.stops.length - 1]);

  const intermediateStops = leg.stops
    .slice(1, -1)
    .map((sid) => data.stops.get(sid)?.stop_name || sid);

  // Determine direction (terminal station name) for rail legs
  let direction: string | undefined;
  if (leg.type === "rail") {
    const orderedStops = data.stopsForRoute.get(leg.routeId);
    if (orderedStops && orderedStops.length > 0) {
      // Check if we're going forward (direction 0) or backward (direction 1)
      const fromIdx = orderedStops.findIndex((s) => s.stop_id === leg.stops[0]);
      const toIdx = orderedStops.findIndex((s) => s.stop_id === leg.stops[leg.stops.length - 1]);

      if (fromIdx !== -1 && toIdx !== -1) {
        if (fromIdx < toIdx) {
          // Going forward: terminal is the last stop of the route
          direction = orderedStops[orderedStops.length - 1].stop_name;
        } else {
          // Going backward: terminal is the first stop of the route
          direction = orderedStops[0].stop_name;
        }
      }
    }
  }

  return {
    routeId: leg.routeId,
    lineName: line?.name || (leg.type === "transfer" ? "Walk" : leg.routeId),
    lineColor: line?.color || "#6B7280",
    lineShortName: line?.shortName || "",
    fromStopId: leg.stops[0],
    fromStopName: fromStop?.stop_name || leg.stops[0],
    toStopId: leg.stops[leg.stops.length - 1],
    toStopName: toStop?.stop_name || leg.stops[leg.stops.length - 1],
    intermediateStops,
    travelSeconds: leg.travelSeconds,
    type: leg.type,
    direction,
  };
}

/** Find next departures from origin on the first leg's route */
function computeDepartures(
  originStopId: string,
  firstLegRouteId: string,
  totalTravelSeconds: number,
  data: GTFSData,
  requestedTimeSeconds: number,
  dateStr?: string
): JourneyRoute["departures"] {
  const departures: JourneyRoute["departures"] = [];
  const nowSeconds = requestedTimeSeconds;

  // Find the direction: check if origin appears before destination in stopsForRoute
  const orderedStops = data.stopsForRoute.get(firstLegRouteId);
  if (!orderedStops) return [];

  // Find stop_times for this stop on this route
  const stopTimes = data.stopTimesByStop.get(originStopId);
  if (!stopTimes) return [];

  // Get active services for the target date (or today)
  const dayOfWeek = dateStr ? getDayOfWeekForDate(dateStr) : getMalaysiaDayOfWeek();
  const today = dateStr ? dateToGTFSDateString(dateStr) : getMalaysiaDateString();
  const DAY_KEYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

  const activeServices = new Set<string>();
  for (const [id, entry] of data.calendar) {
    const dayKey = DAY_KEYS[dayOfWeek] as keyof typeof entry;
    if (Number(entry[dayKey]) !== 1) continue;
    if (today >= String(entry.start_date) && today <= String(entry.end_date)) {
      activeServices.add(id);
    }
  }

  // Find matching trips (on the right route and active today)
  for (const st of stopTimes) {
    const trip = data.trips.get(st.trip_id);
    if (!trip) continue;
    if (trip.route_id !== firstLegRouteId) continue;
    if (!activeServices.has(trip.service_id)) continue;

    // Get frequencies for this trip
    const freqs = data.frequencies.get(trip.trip_id);
    if (!freqs || freqs.length === 0) continue;

    const tripStops = data.stopTimesByTrip.get(trip.trip_id);
    if (!tripStops || tripStops.length === 0) continue;

    const tripStartSeconds = parseGTFSTime(tripStops[0].departure_time);
    const stopArrivalSeconds = parseGTFSTime(st.arrival_time);
    const offsetSeconds = stopArrivalSeconds - tripStartSeconds;

    for (const freq of freqs) {
      const windowStart = parseGTFSTime(freq.start_time);
      const windowEnd = parseGTFSTime(freq.end_time);

      for (let dep = windowStart; dep < windowEnd; dep += freq.headway_secs) {
        const arrivalAtOrigin = dep + offsetSeconds;
        if (arrivalAtOrigin < nowSeconds) continue;
        if (arrivalAtOrigin > nowSeconds + 3600) break; // next hour only

        const arrivalAtDestination = arrivalAtOrigin + totalTravelSeconds;

        departures.push({
          time: formatTime(arrivalAtOrigin % 86400),
          minutesAway: Math.round((arrivalAtOrigin - nowSeconds) / 60),
          arrivalTime: formatTime(arrivalAtDestination % 86400),
        });

        if (departures.length >= 5) return departures;
      }
    }

    if (departures.length >= 5) break;
  }

  departures.sort((a, b) => a.minutesAway - b.minutesAway);
  return departures.slice(0, 5);
}

export async function findJourneyRoute(
  fromStopId: string,
  toStopId: string,
  timeSeconds?: number,
  dateStr?: string
): Promise<JourneyRoute | null> {
  const data = await getGTFSData();
  const graph = getNetworkGraph(data);

  const result = dijkstra(graph, fromStopId, toStopId);
  if (!result) return null;

  return buildJourneyFromPath(result.path, fromStopId, data, timeSeconds, dateStr);
}

/** Build a JourneyRoute from a raw Dijkstra path */
function buildJourneyFromPath(
  path: DijkstraNode["path"],
  fromStopId: string,
  data: GTFSData,
  timeSeconds?: number,
  dateStr?: string
): JourneyRoute {
  const legs = buildLegs(path, data);

  let transfers = 0;
  for (const leg of legs) {
    if (leg.type === "transfer") transfers++;
  }

  const totalSeconds = legs.reduce((sum, leg) => sum + leg.travelSeconds, 0);

  const firstRailLeg = legs.find((l) => l.type === "rail");
  const requestTime = timeSeconds ?? getCurrentSeconds();
  const departures = firstRailLeg
    ? computeDepartures(firstRailLeg.fromStopId, firstRailLeg.routeId, totalSeconds, data, requestTime, dateStr)
    : [];

  const distanceKm = Math.round(legs.reduce((sum, leg) => sum + legDistanceKm(leg, data), 0) * 100) / 100;

  return { legs, totalSeconds, transfers, distanceKm, departures };
}

/** Get a string signature representing the line sequence (for deduplication) */
function getRouteSignature(path: DijkstraNode["path"]): string {
  const segments: string[] = [];
  let currentRoute = "";
  for (const step of path) {
    if (step.type === "rail" && step.routeId !== currentRoute) {
      segments.push(step.routeId);
      currentRoute = step.routeId;
    } else if (step.type === "transfer") {
      segments.push(`xfer:${step.fromStopId}-${step.toStopId}`);
      currentRoute = "";
    }
  }
  return segments.join("|");
}

/** Build edge penalties from a Dijkstra path to encourage alternative routes */
function buildPenalties(
  path: DijkstraNode["path"],
  existing: Map<string, number>
): Map<string, number> {
  const penalties = new Map(existing);
  for (const step of path) {
    const key = `${step.fromStopId}->${step.toStopId}`;
    const reverseKey = `${step.toStopId}->${step.fromStopId}`;
    // Heavy penalty on transfers (forces different interchange points)
    // Moderate penalty on rail edges (allows same line but discourages identical segments)
    const amount = step.type === "transfer" ? 9999 : 600;
    penalties.set(key, (penalties.get(key) ?? 0) + amount);
    penalties.set(reverseKey, (penalties.get(reverseKey) ?? 0) + amount);
  }
  return penalties;
}

/** Find up to maxRoutes alternative journey routes */
export async function findAlternativeRoutes(
  fromStopId: string,
  toStopId: string,
  timeSeconds?: number,
  dateStr?: string,
  maxRoutes = 3
): Promise<JourneyRoute[]> {
  const data = await getGTFSData();
  const graph = getNetworkGraph(data);

  const routes: JourneyRoute[] = [];
  const seenSignatures = new Set<string>();
  let penalties = new Map<string, number>();

  for (let attempt = 0; attempt < maxRoutes + 3; attempt++) {
    const result = dijkstra(graph, fromStopId, toStopId, penalties.size > 0 ? penalties : undefined);
    if (!result) break;

    const signature = getRouteSignature(result.path);
    if (!seenSignatures.has(signature)) {
      seenSignatures.add(signature);
      const journey = buildJourneyFromPath(result.path, fromStopId, data, timeSeconds, dateStr);

      // Filter: don't include routes more than 2x slower than the best
      if (routes.length === 0 || journey.totalSeconds <= routes[0].totalSeconds * 2) {
        routes.push(journey);
      }
    }

    if (routes.length >= maxRoutes) break;
    penalties = buildPenalties(result.path, penalties);
  }

  return routes;
}
