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
  intermediateStops: string[];
  travelSeconds: number;
  type: "rail" | "transfer";
  direction?: string; // "Toward Gombak", "Toward Putra Heights", etc.
}

export interface JourneyFare {
  cash: string;
  cashless: string;
  concession: string;
}

export interface JourneyRoute {
  legs: JourneyLeg[];
  totalSeconds: number;
  transfers: number;
  distanceKm?: number;
  fare?: JourneyFare;
  departures: {
    time: string;
    minutesAway: number;
    arrivalTime: string;
  }[];
}
