import { NextResponse } from "next/server";
import { findAlternativeRoutes } from "@/lib/journey/pathfinder";
import { fetchFare } from "@/lib/journey/fare";
import { getNextArrivals } from "@/lib/gtfs/schedule";
import { parseGTFSTime } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const timeParam = url.searchParams.get("time"); // "HH:MM" format
    const dateParam = url.searchParams.get("date"); // "YYYY-MM-DD" format

    if (!from) {
      return NextResponse.json({ error: "Missing 'from' parameter" }, { status: 400 });
    }

    const timeSeconds = timeParam ? parseGTFSTime(`${timeParam}:00`) : undefined;

    // Mode 1: Single station schedule
    if (!to) {
      const arrivals = await getNextArrivals(from, 200, 24 * 3600);
      return NextResponse.json({ mode: "schedule", ...arrivals });
    }

    // Mode 2: Journey planning (with alternatives)
    const journeys = await findAlternativeRoutes(from, to, timeSeconds, dateParam || undefined);
    if (journeys.length === 0) {
      return NextResponse.json({ mode: "journey", journeys: [], error: "No route found" });
    }

    // Fetch fare for each route
    await Promise.all(
      journeys.map(async (journey) => {
        const railLegs = journey.legs.filter((l) => l.type === "rail");
        if (railLegs.length > 0) {
          const fareFrom = railLegs[0].fromStopId;
          const fareTo = railLegs[railLegs.length - 1].toStopId;
          const fare = await fetchFare(fareFrom, fareTo);
          if (fare) journey.fare = fare;
        }
      })
    );

    return NextResponse.json({ mode: "journey", journeys });
  } catch (error) {
    console.error("[API] journey error:", error);
    return NextResponse.json({ error: "Failed to plan journey" }, { status: 500 });
  }
}
