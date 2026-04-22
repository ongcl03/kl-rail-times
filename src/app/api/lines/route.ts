import { NextResponse } from "next/server";
import { getGTFSData } from "@/lib/gtfs/cache";
import { LINES } from "@/lib/lines";
import type { LineInfo } from "@/lib/gtfs/types";

export async function GET() {
  try {
    const data = await getGTFSData();
    const lines: LineInfo[] = [];

    for (const lineMeta of LINES) {
      const stations: { stopId: string; stopName: string; stopLat: number; stopLon: number }[] = [];
      const orderedStops = data.stopsForRoute.get(lineMeta.gtfsRouteId);
      if (orderedStops) {
        for (const stop of orderedStops) {
          stations.push({ stopId: stop.stop_id, stopName: stop.stop_name, stopLat: stop.stop_lat, stopLon: stop.stop_lon });
        }
      }

      lines.push({
        id: lineMeta.id,
        name: lineMeta.name,
        shortName: lineMeta.shortName,
        color: lineMeta.color,
        textColor: lineMeta.textColor,
        type: lineMeta.type,
        stationCount: stations.length,
        stations,
        shape: data.shapesForRoute.get(lineMeta.gtfsRouteId),
      });
    }

    return NextResponse.json(lines);
  } catch (error) {
    console.error("[API] lines error:", error);
    return NextResponse.json(
      { error: "Failed to fetch lines" },
      { status: 500 }
    );
  }
}
