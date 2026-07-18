export type BusOperator =
  | "rapid-bus-kl"
  | "rapid-bus-mrtfeeder"
  | "rapid-bus-penang"
  | "rapid-bus-kuantan";

export const BUS_OPERATORS: Record<
  BusOperator,
  { name: string; shortName: string; area: string; color: string; textColor: string }
> = {
  "rapid-bus-kl": {
    name: "Rapid Bus KL",
    shortName: "RapidKL Bus",
    area: "Klang Valley",
    color: "#E31937",
    textColor: "#FFFFFF",
  },
  "rapid-bus-mrtfeeder": {
    name: "MRT Feeder Bus",
    shortName: "MRT Feeder",
    area: "Klang Valley (MRT Stations)",
    color: "#005BAA",
    textColor: "#FFFFFF",
  },
  "rapid-bus-penang": {
    name: "Rapid Bus Penang",
    shortName: "RapidPenang",
    area: "Penang",
    color: "#FF6B35",
    textColor: "#FFFFFF",
  },
  "rapid-bus-kuantan": {
    name: "Rapid Bus Kuantan",
    shortName: "RapidKuantan",
    area: "Kuantan, Pahang",
    color: "#009B77",
    textColor: "#FFFFFF",
  },
};

export interface BusRouteInfo {
  routeId: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
  operator: BusOperator;
  stopCount: number;
}

export interface BusStopInfo {
  stopId: string;
  stopName: string;
  stopLat: number;
  stopLon: number;
  stopSequence: number;
}

export interface BusRouteDetail {
  routeId: string;
  shortName: string;
  longName: string;
  color: string;
  textColor: string;
  operator: BusOperator;
  stopsDir0: BusStopInfo[];
  stopsDir1: BusStopInfo[];
  dir0Headsign: string;
  dir1Headsign: string;
}

export interface BusArrival {
  tripId: string;
  routeId: string;
  routeShortName: string;
  routeLongName: string;
  routeColor: string;
  routeTextColor: string;
  headsign: string;
  scheduledArrival: string; // "HH:MM"
  arrivalSeconds: number;
  minutesAway: number;
  status: "scheduled" | "approaching" | "arriving";
  directionId: number;
}

// Internal GTFS data per operator (parsed + derived)
export interface BusGTFSData {
  stops: Map<string, import("@/lib/gtfs/types").Stop>;
  routes: Map<string, import("@/lib/gtfs/types").Route>;
  trips: Map<string, import("@/lib/gtfs/types").Trip>;
  stopTimesByStop: Map<string, import("@/lib/gtfs/types").StopTime[]>;
  stopTimesByTrip: Map<string, import("@/lib/gtfs/types").StopTime[]>;
  calendar: Map<string, import("@/lib/gtfs/types").CalendarEntry>;
  // route_id → { dir0: ordered stops, dir1: ordered stops }
  stopsForRoute: Map<string, { dir0: import("@/lib/gtfs/types").Stop[]; dir1: import("@/lib/gtfs/types").Stop[] }>;
  // route_id → { dir0: headsign, dir1: headsign }
  headsignsForRoute: Map<string, { dir0: string; dir1: string }>;
}
