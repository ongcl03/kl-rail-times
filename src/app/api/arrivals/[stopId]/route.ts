import { NextResponse } from "next/server";
import { getNextArrivals, getFullDaySchedule } from "@/lib/gtfs/schedule";

const REST_OF_DAY = 36 * 3600; // 36 hours — covers overnight trains past midnight

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stopId: string }> }
) {
  try {
    const { stopId } = await params;
    const url = new URL(request.url);
    const mode = url.searchParams.get("mode");
    const routeId = url.searchParams.get("route") || undefined;

    if (mode === "fullday") {
      const dayType = url.searchParams.get("day") || undefined;
      const schedule = await getFullDaySchedule(stopId, dayType, routeId);
      return NextResponse.json(schedule, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    const arrivals = await getNextArrivals(stopId, 200, REST_OF_DAY, routeId);
    return NextResponse.json(arrivals);
  } catch (error) {
    console.error("[API] arrivals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch arrivals" },
      { status: 500 }
    );
  }
}
