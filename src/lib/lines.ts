export interface LineMeta {
  id: string;
  name: string;
  shortName: string;
  color: string;
  textColor: string;
  type: string;
  gtfsRouteId: string;
  realtimeRouteId: string;
}

// ─── Prasarana (LRT / MRT / Monorail / BRT) ─────────────────────────────────

const PRASARANA_LINES: LineMeta[] = [
  {
    id: "kelana-jaya",
    name: "LRT Kelana Jaya",
    shortName: "KJ",
    color: "#D50032",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "KJ",
    realtimeRouteId: "KJ",
  },
  {
    id: "ampang",
    name: "LRT Ampang",
    shortName: "AG",
    color: "#E57200",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "AG",
    realtimeRouteId: "AG",
  },
  {
    id: "sri-petaling",
    name: "LRT Sri Petaling",
    shortName: "SP",
    color: "#76232F",
    textColor: "#FFFFFF",
    type: "LRT",
    gtfsRouteId: "PH",
    realtimeRouteId: "SP",
  },
  {
    id: "mrt-kajang",
    name: "MRT Kajang",
    shortName: "KG",
    color: "#047940",
    textColor: "#FFFFFF",
    type: "MRT",
    gtfsRouteId: "KGL",
    realtimeRouteId: "KG",
  },
  {
    id: "mrt-putrajaya",
    name: "MRT Putrajaya",
    shortName: "PY",
    color: "#FFCD00",
    textColor: "#000000",
    type: "MRT",
    gtfsRouteId: "PYL",
    realtimeRouteId: "PY",
  },
  {
    id: "monorail",
    name: "KL Monorail",
    shortName: "MR",
    color: "#84BD00",
    textColor: "#000000",
    type: "Monorail",
    gtfsRouteId: "MR",
    realtimeRouteId: "MR",
  },
  {
    id: "brt-sunway",
    name: "BRT Sunway",
    shortName: "BRT",
    color: "#115740",
    textColor: "#FFFFFF",
    type: "BRT",
    gtfsRouteId: "BRT",
    realtimeRouteId: "BRT",
  },
];

// ─── KTM (Komuter / ETS / Intercity) ────────────────────────────────────────
// Data source: api.data.gov.my/gtfs-static/ktmb
// Note: ES (Ekspres Selatan) excluded — GTFS feed has zero stop_times for it.
//       ETS has partial data (6 of 24 trips have schedules).

const KTM_LINES: LineMeta[] = [
  // Komuter lines (serve KL area)
  {
    id: "ktm-seremban",
    name: "KTM Seremban Line",
    shortName: "KTM-SB",
    color: "#3C5A9F",
    textColor: "#FFFFFF",
    type: "KTM Komuter",
    gtfsRouteId: "KC05_KB18",
    realtimeRouteId: "KC05_KB18",
  },
  {
    id: "ktm-port-klang",
    name: "KTM Port Klang Line",
    shortName: "KTM-PK",
    color: "#DC2420",
    textColor: "#FFFFFF",
    type: "KTM Komuter",
    gtfsRouteId: "KA15_KD19",
    realtimeRouteId: "KA15_KD19",
  },
  // ETS
  {
    id: "ktm-ets",
    name: "KTM ETS",
    shortName: "ETS",
    color: "#F7941D",
    textColor: "#000000",
    type: "KTM ETS",
    gtfsRouteId: "ETS",
    realtimeRouteId: "ETS",
  },
  // Northern Komuter
  {
    id: "ktm-padang-besar",
    name: "KTM Padang Besar Line",
    shortName: "KTM-PB",
    color: "#018000",
    textColor: "#FFFFFF",
    type: "KTM Komuter",
    gtfsRouteId: "100_47300",
    realtimeRouteId: "100_47300",
  },
  {
    id: "ktm-ipoh",
    name: "KTM Ipoh Line",
    shortName: "KTM-IP",
    color: "#1964B7",
    textColor: "#FFFFFF",
    type: "KTM Komuter",
    gtfsRouteId: "100_9000",
    realtimeRouteId: "100_9000",
  },
  // Intercity
  {
    id: "ktm-shuttle",
    name: "KTM Shuttle",
    shortName: "SH",
    color: "#8B6914",
    textColor: "#FFFFFF",
    type: "KTM Intercity",
    gtfsRouteId: "SH",
    realtimeRouteId: "SH",
  },
  {
    id: "ktm-ert",
    name: "KTM Ekspres Rakyat Timuran",
    shortName: "ERT",
    color: "#6B4C9A",
    textColor: "#FFFFFF",
    type: "KTM Intercity",
    gtfsRouteId: "ERT",
    realtimeRouteId: "ERT",
  },
  {
    id: "ktm-es",
    name: "KTM Ekspres Selatan",
    shortName: "ES",
    color: "#2E8B57",
    textColor: "#FFFFFF",
    type: "KTM Intercity",
    gtfsRouteId: "ES",
    realtimeRouteId: "ES",
  },
  {
    id: "ktm-tebrau",
    name: "KTM Shuttle Tebrau",
    shortName: "ST",
    color: "#CD5C5C",
    textColor: "#FFFFFF",
    type: "KTM Intercity",
    gtfsRouteId: "ST",
    realtimeRouteId: "ST",
  },
];

// ─── Combined ────────────────────────────────────────────────────────────────

export const LINES: LineMeta[] = [...PRASARANA_LINES, ...KTM_LINES];

export function matchLineByRouteId(routeId: string): LineMeta | undefined {
  return LINES.find((line) => line.gtfsRouteId === routeId);
}

export function matchLineByRealtimeRouteId(routeId: string): LineMeta | undefined {
  return LINES.find((line) => line.realtimeRouteId === routeId);
}
