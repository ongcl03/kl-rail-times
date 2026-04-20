import type { GTFSData } from "../gtfs/types";
import type { NetworkGraph, JourneyLeg, JourneyRoute } from "./types";
import { matchLineByRouteId } from "../lines";
import { parseGTFSTime, getCurrentSeconds, formatTime, getMalaysiaDayOfWeek, getMalaysiaDateString } from "../utils";
import { getNetworkGraph } from "./graph";
import { getGTFSData } from "../gtfs/cache";

const TRANSFER_PENALTY = 120; // seconds penalty per transfer to discourage unnecessary ones

interface DijkstraNode {
  stopId: string;
  cost: number;
  path: { fromStopId: string; toStopId: string; routeId: string; travelSeconds: number; type: "rail" | "transfer" }[];
}

function dijkstra(
  graph: NetworkGraph,
  fromStopId: string,
  toStopId: string
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
      const newCost = current.cost + edge.travelSeconds + penalty;

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
  };
}

/** Find next departures from origin on the first leg's route */
function computeDepartures(
  originStopId: string,
  firstLegRouteId: string,
  totalTravelSeconds: number,
  data: GTFSData,
  requestedTimeSeconds: number
): JourneyRoute["departures"] {
  const departures: JourneyRoute["departures"] = [];
  const nowSeconds = requestedTimeSeconds;

  // Find the direction: check if origin appears before destination in stopsForRoute
  const orderedStops = data.stopsForRoute.get(firstLegRouteId);
  if (!orderedStops) return [];

  // Find stop_times for this stop on this route
  const stopTimes = data.stopTimesByStop.get(originStopId);
  if (!stopTimes) return [];

  // Get active services for today
  const dayOfWeek = getMalaysiaDayOfWeek();
  const today = getMalaysiaDateString();
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
  timeSeconds?: number
): Promise<JourneyRoute | null> {
  const data = await getGTFSData();
  const graph = getNetworkGraph(data);

  const result = dijkstra(graph, fromStopId, toStopId);
  if (!result) return null;

  const legs = buildLegs(result.path, data);

  // Count transfers (transitions between different rail legs)
  let transfers = 0;
  for (const leg of legs) {
    if (leg.type === "transfer") transfers++;
  }

  // Compute actual travel time (without penalties)
  const totalSeconds = legs.reduce((sum, leg) => sum + leg.travelSeconds, 0);

  // Find next departures
  const firstRailLeg = legs.find((l) => l.type === "rail");
  const requestTime = timeSeconds ?? getCurrentSeconds();
  const departures = firstRailLeg
    ? computeDepartures(fromStopId, firstRailLeg.routeId, totalSeconds, data, requestTime)
    : [];

  return {
    legs,
    totalSeconds,
    transfers,
    departures,
  };
}
