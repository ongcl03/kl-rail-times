import { NextResponse } from "next/server";
import { findJourneyRoute } from "@/lib/journey/pathfinder";
import { fetchFare } from "@/lib/journey/fare";
import { getNextArrivals } from "@/lib/gtfs/schedule";
import { parseGTFSTime } from "@/lib/utils";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const timeParam = url.searchParams.get("time"); // "HH:MM" format

    if (!from) {
      return NextResponse.json({ error: "Missing 'from' parameter" }, { status: 400 });
    }

    const timeSeconds = timeParam ? parseGTFSTime(`${timeParam}:00`) : undefined;

    // Mode 1: Single station schedule
    if (!to) {
      const arrivals = await getNextArrivals(from, 200, 24 * 3600);
      return NextResponse.json({ mode: "schedule", ...arrivals });
    }

    // Mode 2: Journey planning
    const journey = await findJourneyRoute(from, to, timeSeconds);
    if (!journey) {
      return NextResponse.json({ mode: "journey", journey: null, error: "No route found" });
    }

    // Fetch fare for the overall journey (first rail origin → last rail destination)
    const railLegs = journey.legs.filter((l) => l.type === "rail");
    if (railLegs.length > 0) {
      const fareFrom = railLegs[0].fromStopId;
      const fareTo = railLegs[railLegs.length - 1].toStopId;
      const fare = await fetchFare(fareFrom, fareTo);
      if (fare) {
        journey.fare = fare;
      }
    }

    return NextResponse.json({ mode: "journey", journey });
  } catch (error) {
    console.error("[API] journey error:", error);
    return NextResponse.json({ error: "Failed to plan journey" }, { status: 500 });
  }
}
