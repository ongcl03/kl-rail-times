export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  parent_station?: string;
}

export interface Route {
  route_id: string;
  route_short_name: string;
  route_long_name: string;
  route_type: number;
  route_color?: string;
}

export interface Trip {
  trip_id: string;
  route_id: string;
  service_id: string;
  trip_headsign?: string;
  direction_id: number;
  shape_id?: string;
}

export interface StopTime {
  trip_id: string;
  arrival_time: string;
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export interface CalendarEntry {
  service_id: string;
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  start_date: string;
  end_date: string;
}

export interface Frequency {
  trip_id: string;
  start_time: string;
  end_time: string;
  headway_secs: number;
}

export interface GTFSData {
  stops: Map<string, Stop>;
  routes: Map<string, Route>;
  trips: Map<string, Trip>;
  stopTimesByStop: Map<string, StopTime[]>;
  stopTimesByTrip: Map<string, StopTime[]>;
  calendar: Map<string, CalendarEntry>;
  frequencies: Map<string, Frequency[]>; // by trip_id
  stopsForRoute: Map<string, Stop[]>;
}

export interface Arrival {
  tripId: string;
  routeId: string;
  lineName: string;
  lineColor: string;
  lineId: string;
  headsign: string;
  scheduledArrival: string;
  minutesAway: number;
  status: "scheduled" | "approaching" | "arriving" | "departed";
  directionId: number;
}

export interface LineInfo {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  type: string;
  stationCount: number;
  stations: { stopId: string; stopName: string }[];
}

export interface TimetableEntry {
  scheduledArrival: string; // "HH:MM"
  arrivalSeconds: number;
  lineColor: string;
  lineName: string;
  headsign: string;
  directionId: number;
}

export interface FullDaySchedule {
  direction0: TimetableEntry[];
  direction1: TimetableEntry[];
  dir0Label: string;
  dir1Label: string;
}
