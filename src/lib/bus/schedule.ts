import { getBusData } from "./cache";
import type { BusArrival, BusOperator } from "./types";
import type { CalendarEntry } from "@/lib/gtfs/types";
import {
  parseGTFSTime,
  getCurrentSeconds,
  formatTime,
  getMalaysiaTime,
  getMalaysiaDayOfWeek,
  getMalaysiaDateString,
} from "@/lib/utils";

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
const EARLY_MORNING_CUTOFF = 4 * 3600;

function getActiveServiceIds(
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

export async function getBusArrivals(
  stopId: string,
  operator: BusOperator,
  limit = 20,
  maxSeconds = 36 * 3600, // covers rest of day + overnight
  routeIdFilter?: string
): Promise<{
  arrivals: BusArrival[];
  dir0Label: string;
  dir1Label: string;
}> {
  const data = await getBusData(operator);
  const nowSeconds = getCurrentSeconds();

  const stopTimes = data.stopTimesByStop.get(stopId);
  if (!stopTimes) {
    return { arrivals: [], dir0Label: "", dir1Label: "" };
  }

  const todayDow = getMalaysiaDayOfWeek();
  const todayDate = getMalaysiaDateString();
  const todayServices = getActiveServiceIds(data.calendar, todayDow, todayDate);

  const collected: BusArrival[] = [];
  const seenTripIds = new Set<string>();
  let dir0Label = "";
  let dir1Label = "";

  function processStopTimes(
    activeServices: Set<string>,
    nowRef: number // nowSeconds, or nowSeconds + SECONDS_IN_DAY for overnight
  ) {
    for (const st of stopTimes!) {
      const trip = data.trips.get(st.trip_id);
      if (!trip) continue;
      if (!activeServices.has(trip.service_id)) continue;
      if (routeIdFilter && trip.route_id !== routeIdFilter) continue;
      if (seenTripIds.has(trip.trip_id)) continue;

      const route = data.routes.get(trip.route_id);
      // MRT Feeder uses internal IDs as route_short_name; real code is in route_long_name
      const rawShortName = route ? String(route.route_short_name ?? "") : "";
      const rawLongName = route ? String(route.route_long_name ?? "") : "";
      const routeShortName = (rawShortName === trip.route_id || rawShortName === "")
        ? (rawLongName || trip.route_id)
        : rawShortName;
      const routeLongName = (rawShortName === trip.route_id || rawShortName === "")
        ? ""
        : rawLongName;
      const routeColor = route?.route_color || "#6B7280";
      const routeTextColor = routeColor.startsWith("#")
        ? getContrastColor(routeColor)
        : "#FFFFFF";

      let headsign = trip.trip_headsign || "";
      if (!headsign) {
        const tripStops = data.stopTimesByTrip.get(trip.trip_id);
        if (tripStops && tripStops.length > 0) {
          const lastStop = data.stops.get(tripStops[tripStops.length - 1].stop_id);
          headsign = lastStop?.stop_name || "Unknown";
        }
      }

      // Capture direction labels from first occurrence
      if (trip.direction_id === 0 && !dir0Label) dir0Label = headsign;
      if (trip.direction_id === 1 && !dir1Label) dir1Label = headsign;

      const arrivalSeconds = parseGTFSTime(st.arrival_time);
      const diff = arrivalSeconds - nowRef;
      if (diff < -60 || diff > maxSeconds) continue;

      const minutesAway = Math.max(0, Math.round(diff / 60));
      const status: BusArrival["status"] =
        minutesAway <= 0 ? "arriving" : minutesAway <= 2 ? "approaching" : "scheduled";

      seenTripIds.add(trip.trip_id);
      collected.push({
        tripId: trip.trip_id,
        routeId: trip.route_id,
        routeShortName,
        routeLongName,
        routeColor,
        routeTextColor,
        headsign,
        scheduledArrival: formatTime(arrivalSeconds % SECONDS_IN_DAY),
        arrivalSeconds,
        minutesAway,
        status,
        directionId: trip.direction_id,
      });
    }
  }

  // Today's services
  processStopTimes(todayServices, nowSeconds);

  // Before 4 AM, also check yesterday's overnight schedules
  if (nowSeconds < EARLY_MORNING_CUTOFF) {
    const yesterday = getYesterdayInfo();
    const yesterdayServices = getActiveServiceIds(
      data.calendar,
      yesterday.dayOfWeek,
      yesterday.dateString
    );
    processStopTimes(yesterdayServices, nowSeconds + SECONDS_IN_DAY);
  }

  collected.sort((a, b) => a.minutesAway - b.minutesAway);

  return {
    arrivals: collected.slice(0, limit),
    dir0Label,
    dir1Label,
  };
}

function getContrastColor(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.5 ? "#000000" : "#FFFFFF";
}
