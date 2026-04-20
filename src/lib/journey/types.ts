export interface GraphEdge {
  toStopId: string;
  routeId: string;
  travelSeconds: number;
  type: "rail" | "transfer";
}

export type NetworkGraph = Map<string, GraphEdge[]>;

export interface JourneyLeg {
  routeId: string;
  lineName: string;
  lineColor: string;
  lineShortName: string;
  fromStopId: string;
  fromStopName: string;
  toStopId: string;
  toStopName: string;
  intermediateStops: string[]; // stop names
  travelSeconds: number;
  type: "rail" | "transfer";
}

export interface JourneyRoute {
  legs: JourneyLeg[];
  totalSeconds: number;
  transfers: number;
  departures: {
    time: string;
    minutesAway: number;
    arrivalTime: string;
  }[];
}
