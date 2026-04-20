import { NextResponse } from "next/server";
import { getNextArrivals } from "@/lib/gtfs/schedule";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ stopId: string }> }
) {
  try {
    const { stopId } = await params;
    const arrivals = await getNextArrivals(stopId);
    return NextResponse.json(arrivals);
  } catch (error) {
    console.error("[API] arrivals error:", error);
    return NextResponse.json(
      { error: "Failed to fetch arrivals" },
      { status: 500 }
    );
  }
}
