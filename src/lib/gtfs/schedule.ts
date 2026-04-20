import { getGTFSData } from "./cache";
import type { Arrival, CalendarEntry, TimetableEntry, FullDaySchedule } from "./types";
import { matchLineByRouteId } from "../lines";
import {
  parseGTFSTime,
  getCurrentSeconds,
  formatTime,
  getMalaysiaTime,
  getMalaysiaDayOfWeek,
  getMalaysiaDateString,
} from "../utils";

const DAY_KEYS: (keyof CalendarEntry)[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const SECONDS_IN_DAY = 86400;
// Before this hour (4 AM), also check previous day's late-night schedule
const EARLY_MORNING_CUTOFF = 4 * 3600;

function getActiveServiceIdsForDay(
  calendar: Map<string, CalendarEntry>,
  dayOfWeek: number,
  dateString: string
): Set<string> {
  const active = new Set<string>();
  for (const [id, entry] of calendar) {
    const dayKey = DAY_KEYS[dayOfWeek];
    if (Number(entry[dayKey]) !== 1) continue;
    const startDate = String(entry.start_date);
    const endDate = String(entry.end_date);
    if (dateString >= startDate && dateString <= endDate) {
      active.add(id);
    }
  }
  return active;
}

/** Get yesterday's day-of-week and date string in Malaysia timezone */
function getYesterdayInfo(): { dayOfWeek: number; dateString: string } {
  const now = getMalaysiaTime();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const y = yesterday.getFullYear();
  const m = String(yesterday.getMonth() + 1).padStart(2, "0");
  const day = String(yesterday.getDate()).padStart(2, "0");
  return {
    dayOfWeek: yesterday.getDay(),
    dateString: `${y}${m}${day}`,
  };
}

function computeArrivalsForServices(
  data: Awaited<ReturnType<typeof getGTFSData>>,
  stopIds: string[],
  activeServices: Set<string>,
  nowSeconds: number,
  isOvernight: boolean,
  maxSeconds: number = 3600
): Arrival[] {
  const results: Arrival[] = [];

  for (const sid of stopIds) {
    const stopTimes = data.stopTimesByStop.get(sid);
    if (!stopTimes) continue;

    for (const st of stopTimes) {
      const trip = data.trips.get(st.trip_id);
      if (!trip) continue;
      if (!activeServices.has(trip.service_id)) continue;

      const line = matchLineByRouteId(trip.route_id);

      // Determine headsign
      let headsign = trip.trip_headsign || "";
      if (!headsign) {
        const tripStops = data.stopTimesByTrip.get(trip.trip_id);
        if (tripStops && tripStops.length > 0) {
          const lastStopId = tripStops[tripStops.length - 1].stop_id;
          const lastStop = data.stops.get(lastStopId);
          headsign = lastStop?.stop_name || "Unknown";
        }
      }
      const toMatch = headsign.match(/to\s+(.+)$/i);
      if (toMatch) headsign = toMatch[1];

      const freqs = data.frequencies.get(trip.trip_id);

      if (freqs && freqs.length > 0) {
        const tripStops = data.stopTimesByTrip.get(trip.trip_id);
        if (!tripStops || tripStops.length === 0) continue;

        const tripStartSeconds = parseGTFSTime(tripStops[0].departure_time);
        const stopArrivalSeconds = parseGTFSTime(st.arrival_time);
        const offsetSeconds = stopArrivalSeconds - tripStartSeconds;

        for (const freq of freqs) {
          const windowStart = parseGTFSTime(freq.start_time);
          const windowEnd = parseGTFSTime(freq.end_time);
          const headway = freq.headway_secs;

          for (
            let departureTime = windowStart;
            departureTime < windowEnd;
            departureTime += headway
          ) {
            const arrivalAtStop = departureTime + offsetSeconds;
            const diff = arrivalAtStop - nowSeconds;

            if (diff < -60) continue;
            if (diff > maxSeconds) continue;

            const minutesAway = Math.max(0, Math.round(diff / 60));
            let status: Arrival["status"] = "scheduled";
            if (minutesAway <= 0) status = "arriving";
            else if (minutesAway <= 2) status = "approaching";

            results.push({
              tripId: `${trip.trip_id}_${departureTime}`,
              routeId: trip.route_id,
              lineName: line?.name || trip.route_id,
              lineColor: line?.color || "#6B7280",
              lineId: line?.id || trip.route_id,
              headsign,
              // For overnight trains, the display time wraps past midnight
              scheduledArrival: formatTime(arrivalAtStop % SECONDS_IN_DAY),
              arrivalSeconds: arrivalAtStop,
              minutesAway,
              status,
              directionId: trip.direction_id,
            });
          }
        }
      } else {
        const arrivalSeconds = parseGTFSTime(st.arrival_time);
        const diff = arrivalSeconds - nowSeconds;
        if (diff < -60 || diff > maxSeconds) continue;

        const minutesAway = Math.max(0, Math.round(diff / 60));
        let status: Arrival["status"] = "scheduled";
        if (minutesAway <= 0) status = "arriving";
        else if (minutesAway <= 2) status = "approaching";

        results.push({
          tripId: trip.trip_id,
          routeId: trip.route_id,
          lineName: line?.name || trip.route_id,
          lineColor: line?.color || "#6B7280",
          lineId: line?.id || trip.route_id,
          headsign,
          scheduledArrival: formatTime(arrivalSeconds % SECONDS_IN_DAY),
          arrivalSeconds,
          minutesAway,
          status,
          directionId: trip.direction_id,
        });
      }
    }
  }

  return results;
}

/** Look up the headsign labels for both directions of a stop's route */
function getDirectionLabels(
  data: Awaited<ReturnType<typeof getGTFSData>>,
  stopIds: string[]
): { dir0Label: string; dir1Label: string } {
  let dir0Label = "";
  let dir1Label = "";

  for (const sid of stopIds) {
    const stopTimes = data.stopTimesByStop.get(sid);
    if (!stopTimes) continue;

    for (const st of stopTimes) {
      if (dir0Label && dir1Label) break;
      const trip = data.trips.get(st.trip_id);
      if (!trip || !trip.trip_headsign) continue;

      const toMatch = trip.trip_headsign.match(/to\s+(.+)$/i);
      const label = toMatch ? toMatch[1] : trip.trip_headsign;

      if (trip.direction_id === 0 && !dir0Label) dir0Label = label;
      if (trip.direction_id === 1 && !dir1Label) dir1Label = label;
    }
    if (dir0Label && dir1Label) break;
  }

  return { dir0Label, dir1Label };
}

export async function getNextArrivals(
  stopId: string,
  limit = 5,
  maxSeconds = 3600
): Promise<{
  direction0: Arrival[];
  direction1: Arrival[];
  dir0Label: string;
  dir1Label: string;
}> {
  const data = await getGTFSData();
  const nowSeconds = getCurrentSeconds();

  // Collect all stop IDs to check (the given stop + any child stops)
  const stopIds = [stopId];
  for (const [sid, stop] of data.stops) {
    if (stop.parent_station === stopId) {
      stopIds.push(sid);
    }
  }

  // Get direction labels from GTFS trip headsigns (always available)
  const { dir0Label, dir1Label } = getDirectionLabels(data, stopIds);

  // Today's services
  const todayDow = getMalaysiaDayOfWeek();
  const todayDate = getMalaysiaDateString();
  const todayServices = getActiveServiceIdsForDay(data.calendar, todayDow, todayDate);

  let allArrivals = computeArrivalsForServices(
    data, stopIds, todayServices, nowSeconds, false, maxSeconds
  );

  // If it's early morning (before 4 AM), also check yesterday's late-night schedule
  // Yesterday's trains with arrival times > 86400 are still running past midnight
  if (nowSeconds < EARLY_MORNING_CUTOFF) {
    const yesterday = getYesterdayInfo();
    const yesterdayServices = getActiveServiceIdsForDay(
      data.calendar, yesterday.dayOfWeek, yesterday.dateString
    );

    // Shift nowSeconds by +86400 so it can compare against yesterday's GTFS times
    // e.g., 00:18 becomes 86400 + 1080 = 87480, which can match against arrival 88873
    const overnightArrivals = computeArrivalsForServices(
      data, stopIds, yesterdayServices, nowSeconds + SECONDS_IN_DAY, true, maxSeconds
    );

    allArrivals = [...allArrivals, ...overnightArrivals];
  }

  const direction0: Arrival[] = [];
  const direction1: Arrival[] = [];

  for (const a of allArrivals) {
    if (a.directionId === 0) direction0.push(a);
    else direction1.push(a);
  }

  direction0.sort((a, b) => a.minutesAway - b.minutesAway);
  direction1.sort((a, b) => a.minutesAway - b.minutesAway);

  return {
    direction0: direction0.slice(0, limit),
    direction1: direction1.slice(0, limit),
    dir0Label,
    dir1Label,
  };
}

// --- Full Day Timetable ---

// dayType: "weekday" | "saturday" | "sunday" — maps to a fake day-of-week for calendar lookup
const DAY_TYPE_TO_DOW: Record<string, number> = {
  weekday: 1,  // Monday
  saturday: 6,
  sunday: 0,
};

const fullDayCache = new Map<
  string,
  { key: string; result: FullDaySchedule }
>();

export async function getFullDaySchedule(
  stopId: string,
  dayType?: string
): Promise<FullDaySchedule> {
  const resolvedDayType = dayType || getDayType();
  const cacheKey = `${stopId}_${resolvedDayType}`;
  const today = getMalaysiaDateString();
  const cached = fullDayCache.get(cacheKey);
  if (cached && cached.key === `${today}_${resolvedDayType}`) {
    return cached.result;
  }

  const data = await getGTFSData();

  const stopIds = [stopId];
  for (const [sid, stop] of data.stops) {
    if (stop.parent_station === stopId) stopIds.push(sid);
  }

  const { dir0Label, dir1Label } = getDirectionLabels(data, stopIds);

  const dow = DAY_TYPE_TO_DOW[resolvedDayType] ?? getMalaysiaDayOfWeek();
  const activeServices = getActiveServiceIdsForDay(data.calendar, dow, today);

  const direction0: TimetableEntry[] = [];
  const direction1: TimetableEntry[] = [];

  for (const sid of stopIds) {
    const stopTimes = data.stopTimesByStop.get(sid);
    if (!stopTimes) continue;

    for (const st of stopTimes) {
      const trip = data.trips.get(st.trip_id);
      if (!trip) continue;
      if (!activeServices.has(trip.service_id)) continue;

      const line = matchLineByRouteId(trip.route_id);

      let headsign = trip.trip_headsign || "";
      if (!headsign) {
        const tripStops = data.stopTimesByTrip.get(trip.trip_id);
        if (tripStops && tripStops.length > 0) {
          const lastStopId = tripStops[tripStops.length - 1].stop_id;
          const lastStop = data.stops.get(lastStopId);
          headsign = lastStop?.stop_name || "Unknown";
        }
      }
      const toMatch = headsign.match(/to\s+(.+)$/i);
      if (toMatch) headsign = toMatch[1];

      const freqs = data.frequencies.get(trip.trip_id);

      if (freqs && freqs.length > 0) {
        const tripStops = data.stopTimesByTrip.get(trip.trip_id);
        if (!tripStops || tripStops.length === 0) continue;

        const tripStartSeconds = parseGTFSTime(tripStops[0].departure_time);
        const stopArrivalSeconds = parseGTFSTime(st.arrival_time);
        const offsetSeconds = stopArrivalSeconds - tripStartSeconds;

        for (const freq of freqs) {
          const windowStart = parseGTFSTime(freq.start_time);
          const windowEnd = parseGTFSTime(freq.end_time);
          const headway = freq.headway_secs;

          for (
            let departureTime = windowStart;
            departureTime < windowEnd;
            departureTime += headway
          ) {
            const arrivalAtStop = departureTime + offsetSeconds;

            const entry: TimetableEntry = {
              scheduledArrival: formatTime(arrivalAtStop % SECONDS_IN_DAY),
              arrivalSeconds: arrivalAtStop % SECONDS_IN_DAY,
              lineColor: line?.color || "#6B7280",
              lineName: line?.name || trip.route_id,
              headsign,
              directionId: trip.direction_id,
            };

            if (trip.direction_id === 0) direction0.push(entry);
            else direction1.push(entry);
          }
        }
      } else {
        const arrivalSeconds = parseGTFSTime(st.arrival_time);
        const entry: TimetableEntry = {
          scheduledArrival: formatTime(arrivalSeconds % SECONDS_IN_DAY),
          arrivalSeconds: arrivalSeconds % SECONDS_IN_DAY,
          lineColor: line?.color || "#6B7280",
          lineName: line?.name || trip.route_id,
          headsign,
          directionId: trip.direction_id,
        };

        if (trip.direction_id === 0) direction0.push(entry);
        else direction1.push(entry);
      }
    }
  }

  direction0.sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);
  direction1.sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);

  const result: FullDaySchedule = { direction0, direction1, dir0Label, dir1Label };
  fullDayCache.set(cacheKey, { key: `${today}_${resolvedDayType}`, result });
  return result;
}

/** Get current day type from Malaysia time */
function getDayType(): string {
  const dow = getMalaysiaDayOfWeek();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}
