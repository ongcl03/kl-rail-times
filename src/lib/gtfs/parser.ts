import Papa from "papaparse";
import type {
  Stop,
  Route,
  Trip,
  StopTime,
  CalendarEntry,
  Frequency,
  ShapePoint,
} from "./types";

function parse<T>(csv: string): T[] {
  const result = Papa.parse<T>(csv, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return result.data;
}

export function parseStops(csv: string): Map<string, Stop> {
  const rows = parse<Stop>(csv);
  const map = new Map<string, Stop>();
  for (const row of rows) {
    if (row.stop_id) map.set(String(row.stop_id), { ...row, stop_id: String(row.stop_id) });
  }
  return map;
}

export function parseRoutes(csv: string): Map<string, Route> {
  const rows = parse<Route>(csv);
  const map = new Map<string, Route>();
  for (const row of rows) {
    if (row.route_id) map.set(String(row.route_id), { ...row, route_id: String(row.route_id) });
  }
  return map;
}

export function parseTrips(csv: string): Map<string, Trip> {
  const rows = parse<Trip>(csv);
  const map = new Map<string, Trip>();
  for (const row of rows) {
    if (row.trip_id) {
      map.set(String(row.trip_id), {
        ...row,
        trip_id: String(row.trip_id),
        route_id: String(row.route_id),
        service_id: String(row.service_id),
        direction_id: Number(row.direction_id) || 0,
      });
    }
  }
  return map;
}

export function parseStopTimes(csv: string): {
  byStop: Map<string, StopTime[]>;
  byTrip: Map<string, StopTime[]>;
} {
  const rows = parse<StopTime>(csv);
  const byStop = new Map<string, StopTime[]>();
  const byTrip = new Map<string, StopTime[]>();

  for (const row of rows) {
    if (!row.trip_id || !row.stop_id) continue;
    const normalized: StopTime = {
      ...row,
      trip_id: String(row.trip_id),
      stop_id: String(row.stop_id),
      stop_sequence: Number(row.stop_sequence),
    };

    const stopList = byStop.get(normalized.stop_id) || [];
    stopList.push(normalized);
    byStop.set(normalized.stop_id, stopList);

    const tripList = byTrip.get(normalized.trip_id) || [];
    tripList.push(normalized);
    byTrip.set(normalized.trip_id, tripList);
  }

  for (const [, list] of byTrip) {
    list.sort((a, b) => a.stop_sequence - b.stop_sequence);
  }

  return { byStop, byTrip };
}

export function parseCalendar(csv: string): Map<string, CalendarEntry> {
  const rows = parse<CalendarEntry>(csv);
  const map = new Map<string, CalendarEntry>();
  for (const row of rows) {
    if (row.service_id) {
      map.set(String(row.service_id), {
        ...row,
        service_id: String(row.service_id),
        start_date: String(row.start_date),
        end_date: String(row.end_date),
      });
    }
  }
  return map;
}

export function parseFrequencies(csv: string): Map<string, Frequency[]> {
  const rows = parse<Frequency>(csv);
  const map = new Map<string, Frequency[]>();
  for (const row of rows) {
    if (!row.trip_id) continue;
    const tripId = String(row.trip_id);
    const list = map.get(tripId) || [];
    list.push({
      trip_id: tripId,
      start_time: String(row.start_time),
      end_time: String(row.end_time),
      headway_secs: Number(row.headway_secs),
    });
    map.set(tripId, list);
  }
  return map;
}

export function parseShapes(csv: string): Map<string, [number, number][]> {
  const rows = parse<ShapePoint>(csv);
  const byId = new Map<string, ShapePoint[]>();
  for (const row of rows) {
    if (!row.shape_id) continue;
    const id = String(row.shape_id);
    const list = byId.get(id) || [];
    list.push({ ...row, shape_id: id });
    byId.set(id, list);
  }

  const result = new Map<string, [number, number][]>();
  for (const [id, pts] of byId) {
    pts.sort((a, b) => a.shape_pt_sequence - b.shape_pt_sequence);
    result.set(id, pts.map((p) => [p.shape_pt_lat, p.shape_pt_lon]));
  }
  return result;
}
