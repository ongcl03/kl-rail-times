import type { GTFSData } from "../gtfs/types";
import type { NetworkGraph } from "./types";
import { INTERCHANGE_GROUPS } from "./interchanges";
import { parseGTFSTime } from "../utils";

let cachedGraph: NetworkGraph | null = null;
let cacheTimestamp = 0;

function addEdge(
  graph: NetworkGraph,
  from: string,
  to: string,
  routeId: string,
  travelSeconds: number,
  type: "rail" | "transfer"
) {
  if (!graph.has(from)) graph.set(from, []);
  graph.get(from)!.push({ toStopId: to, routeId, travelSeconds, type });
}

export function buildNetworkGraph(data: GTFSData): NetworkGraph {
  const graph: NetworkGraph = new Map();

  // Add rail edges for each route (both directions)
  for (const [routeId, orderedStops] of data.stopsForRoute) {
    // Find a direction-0 trip to get travel times
    let templateTripId: string | null = null;
    for (const [tripId, trip] of data.trips) {
      if (trip.route_id === routeId && trip.direction_id === 0) {
        templateTripId = tripId;
        break;
      }
    }

    const tripStopTimes = templateTripId
      ? data.stopTimesByTrip.get(templateTripId)
      : null;

    // Build a stopId -> arrival seconds map for this trip
    const arrivalMap = new Map<string, number>();
    if (tripStopTimes) {
      for (const st of tripStopTimes) {
        arrivalMap.set(st.stop_id, parseGTFSTime(st.arrival_time));
      }
    }

    // Add edges between consecutive stops (bidirectional)
    for (let i = 0; i < orderedStops.length - 1; i++) {
      const fromStop = orderedStops[i];
      const toStop = orderedStops[i + 1];

      const fromTime = arrivalMap.get(fromStop.stop_id);
      const toTime = arrivalMap.get(toStop.stop_id);
      const travelSeconds =
        fromTime !== undefined && toTime !== undefined
          ? Math.abs(toTime - fromTime)
          : 180; // fallback 3 min if no data

      // Forward direction
      addEdge(graph, fromStop.stop_id, toStop.stop_id, routeId, travelSeconds, "rail");
      // Reverse direction (same travel time)
      addEdge(graph, toStop.stop_id, fromStop.stop_id, routeId, travelSeconds, "rail");
    }
  }

  // Add transfer edges for interchange groups
  for (const group of INTERCHANGE_GROUPS) {
    const walkSeconds = group.walkMinutes * 60;
    // Connect every pair of stops in the group
    for (let i = 0; i < group.stops.length; i++) {
      for (let j = i + 1; j < group.stops.length; j++) {
        addEdge(graph, group.stops[i], group.stops[j], "transfer", walkSeconds, "transfer");
        addEdge(graph, group.stops[j], group.stops[i], "transfer", walkSeconds, "transfer");
      }
    }
  }

  return graph;
}

export function getNetworkGraph(data: GTFSData): NetworkGraph {
  const now = Date.now();
  // Rebuild every 6 hours (aligns with GTFS cache)
  if (cachedGraph && now - cacheTimestamp < 6 * 60 * 60 * 1000) {
    return cachedGraph;
  }
  cachedGraph = buildNetworkGraph(data);
  cacheTimestamp = now;
  return cachedGraph;
}
