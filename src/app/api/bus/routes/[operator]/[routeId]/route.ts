import { NextResponse } from "next/server";
import { getBusData, getTextColor } from "@/lib/bus/cache";
import type { BusOperator, BusStopInfo } from "@/lib/bus/types";

const VALID_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ operator: string; routeId: string }> }
) {
  const { operator, routeId } = await params;

  if (!VALID_OPERATORS.includes(operator as BusOperator)) {
    return NextResponse.json({ error: "Unknown operator" }, { status: 400 });
  }

  try {
    const data = await getBusData(operator as BusOperator);
    const route = data.routes.get(routeId);

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    const dirs = data.stopsForRoute.get(routeId) || { dir0: [], dir1: [] };
    const headsigns = data.headsignsForRoute.get(routeId) || { dir0: "", dir1: "" };

    const color = route.route_color || "#6B7280";
    const textColor = getTextColor(color.replace("#", "").padEnd(6, "0"));

    const toStopInfos = (stops: typeof dirs.dir0): BusStopInfo[] =>
      stops.map((s, i) => ({
        stopId: s.stop_id,
        stopName: s.stop_name,
        stopLat: s.stop_lat,
        stopLon: s.stop_lon,
        stopSequence: i + 1,
      }));

    return NextResponse.json({
      routeId,
      shortName: route.route_short_name || routeId,
      longName: route.route_long_name || "",
      color,
      textColor,
      operator,
      stopsDir0: toStopInfos(dirs.dir0),
      stopsDir1: toStopInfos(dirs.dir1),
      dir0Headsign: headsigns.dir0,
      dir1Headsign: headsigns.dir1,
    });
  } catch (error) {
    console.error(`[API] bus/routes/${operator}/${routeId} error:`, error);
    return NextResponse.json({ error: "Failed to fetch route detail" }, { status: 500 });
  }
}
