export interface LineMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  type: string;
  gtfsRouteId: string; // exact match against GTFS route_id
}

export const LINES: LineMeta[] = [
  {
    id: "kelana-jaya",
    name: "LRT Kelana Jaya",
    shortName: "KJ",
    color: "#D50032",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "KJ",
  },
  {
    id: "ampang",
    name: "LRT Ampang",
    shortName: "AG",
    color: "#E57200",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "AG",
  },
  {
    id: "sri-petaling",
    name: "LRT Sri Petaling",
    shortName: "SP",
    color: "#76232F",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "PH",
  },
  {
    id: "mrt-kajang",
    name: "MRT Kajang",
    shortName: "KG",
    color: "#047940",
    textColor: "#FFFFFF",
    type: "MRT",
    gtfsRouteId: "KGL",
  },
  {
    id: "mrt-putrajaya",
    name: "MRT Putrajaya",
    shortName: "PY",
    color: "#FFCD00",
    textColor: "#000000",
    type: "MRT",
    gtfsRouteId: "PYL",
  },
  {
    id: "monorail",
    name: "KL Monorail",
    shortName: "MR",
    color: "#84BD00",
    textColor: "#000000",
    type: "Monorail",
    gtfsRouteId: "MR",
  },
  {
    id: "brt-sunway",
    name: "BRT Sunway",
    shortName: "BRT",
    color: "#115740",
    textColor: "#FFFFFF",
    type: "BRT",
    gtfsRouteId: "BRT",
  },
];

export function matchLineByRouteId(routeId: string): LineMeta | undefined {
  return LINES.find((line) => line.gtfsRouteId === routeId);
}
