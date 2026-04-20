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

    if (mode === "fullday") {
      const dayType = url.searchParams.get("day") || undefined;
      const schedule = await getFullDaySchedule(stopId, dayType);
      return NextResponse.json(schedule, {
        headers: { "Cache-Control": "public, max-age=300" },
      });
    }

    // Default: return all remaining trains for today (no limit)
    const arrivals = await getNextArrivals(stopId, 200, REST_OF_DAY);
    return NextResponse.json(arrivals);
  } catch (error) {
    console.error("[API] arrivals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch arrivals" },
      { status: 500 }
    );
  }
}
