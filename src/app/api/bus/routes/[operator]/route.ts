import { NextResponse } from "next/server";
import { getBusData, getTextColor } from "@/lib/bus/cache";
import type { BusOperator } from "@/lib/bus/types";

const VALID_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ operator: string }> }
) {
  const { operator } = await params;

  if (!VALID_OPERATORS.includes(operator as BusOperator)) {
    return NextResponse.json({ error: "Unknown operator" }, { status: 400 });
  }

  try {
    const data = await getBusData(operator as BusOperator);
    const routes = [];

    for (const [routeId, route] of data.routes) {
      const dirs = data.stopsForRoute.get(routeId) || { dir0: [], dir1: [] };
      const color = route.route_color || "#6B7280";
      const textColor = getTextColor(color.replace("#", "").padEnd(6, "0"));

      // Some operators (e.g. MRT Feeder) set route_short_name = route_id (internal DB key).
      // In that case, route_long_name holds the actual human-readable code (e.g. "T808").
      const rawShort = String(route.route_short_name || "");
      const rawLong = String(route.route_long_name || "");
      const shortIsInternalId = rawShort === routeId || rawShort === "";
      const shortName = shortIsInternalId
        ? (rawLong || routeId)
        : rawShort;
      const rawLongName = shortIsInternalId ? "" : rawLong;

      // Derive "First Stop ~ Last Stop" for routes with no meaningful long name
      let longName = rawLongName;
      if (!longName || longName === shortName) {
        const activeStops = dirs.dir0.length > 0 ? dirs.dir0 : dirs.dir1;
        const firstStop = activeStops[0]?.stop_name || "";
        const lastStop = activeStops[activeStops.length - 1]?.stop_name || "";
        if (firstStop && lastStop) {
          longName = firstStop === lastStop
            ? `${firstStop} (loop)`          // circular route
            : `${firstStop} ~ ${lastStop}`;  // point-to-point
        }
      }

      routes.push({
        routeId,
        shortName: String(shortName),
        longName: String(longName),
        color,
        textColor,
        operator,
        stopCount: Math.max(dirs.dir0.length, dirs.dir1.length),
      });
    }

    // Sort by route short name (natural sort: T1 < T2 < T10)
    routes.sort((a, b) =>
      a.shortName.localeCompare(b.shortName, undefined, { numeric: true, sensitivity: "base" })
    );

    return NextResponse.json(routes, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch (error) {
    console.error(`[API] bus/routes/${operator} error:`, error);
    return NextResponse.json({ error: "Failed to fetch routes" }, { status: 500 });
  }
}
