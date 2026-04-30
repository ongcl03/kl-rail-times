import { NextResponse } from "next/server";
import { findAlternativeRoutes } from "@/lib/journey/pathfinder";
import { fetchJourneyFare } from "@/lib/journey/fare";
import { getNextArrivals } from "@/lib/gtfs/schedule";
import { parseGTFSTime } from "@/lib/utils";
import type { JourneyRoute, JourneyFare } from "@/lib/journey/types";
import { isKtmKomuterStop, isKtmNorthernStop, isKtmEtsStop } from "@/lib/journey/ktm-fares";

function addFares(a: JourneyFare, b: JourneyFare): JourneyFare {
  return {
    cash: (parseFloat(a.cash) + parseFloat(b.cash)).toFixed(2),
    cashless: (parseFloat(a.cashless) + parseFloat(b.cashless)).toFixed(2),
    concession: (parseFloat(a.concession) + parseFloat(b.concession)).toFixed(2),
  };
}

function isKtmStop(stopId: string): boolean {
  return isKtmKomuterStop(stopId) || isKtmNorthernStop(stopId) || isKtmEtsStop(stopId);
}

async function computeJourneyFare(journey: JourneyRoute) {
  const railLegs = journey.legs.filter((l) => l.type === "rail");
  if (railLegs.length === 0) return;

  // Group consecutive rail legs by operator using stop IDs (not route IDs)
  const segments: { from: string; to: string }[] = [];
  let currentFrom = railLegs[0].fromStopId;
  let currentTo = railLegs[0].toStopId;
  let prevIsKtm = isKtmStop(railLegs[0].fromStopId);

  for (let i = 1; i < railLegs.length; i++) {
    const leg = railLegs[i];
    const legIsKtm = isKtmStop(leg.fromStopId);

    if (legIsKtm === prevIsKtm) {
      currentTo = leg.toStopId;
    } else {
      segments.push({ from: currentFrom, to: currentTo });
      currentFrom = leg.fromStopId;
      currentTo = leg.toStopId;
    }
    prevIsKtm = legIsKtm;
  }
  segments.push({ from: currentFrom, to: currentTo });

  // If single segment, simple lookup
  if (segments.length === 1) {
    const result = await fetchJourneyFare(segments[0].from, segments[0].to);
    if (result.fare) journey.fare = result.fare;
    if (result.fareRange) journey.fareRange = result.fareRange;
    return;
  }

  // Multiple segments: fetch each and sum
  const results = await Promise.all(
    segments.map((s) => fetchJourneyFare(s.from, s.to))
  );

  let totalFare: JourneyFare | null = null;
  let hasUncalculable = false;
  let fareRangeResult: typeof results[0]["fareRange"] = undefined;

  for (const result of results) {
    if (result.fareRange) {
      hasUncalculable = true;
      if (!fareRangeResult) fareRangeResult = result.fareRange;
    }
    if (result.fare) {
      totalFare = totalFare ? addFares(totalFare, result.fare) : result.fare;
    }
    if (!result.fare && !result.fareRange) {
      hasUncalculable = true;
    }
  }

  if (hasUncalculable) {
    // Some segments can't be calculated — don't show partial fare as total
    journey.fare = undefined;
    journey.fareRange = fareRangeResult ?? {
      min: "", max: "",
      bookingUrl: "https://online.ktmb.com.my/",
      service: "KTMB",
    };
  } else if (totalFare) {
    journey.fare = totalFare;
  }
}

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

    // Fetch fare for each route (per-segment for mixed journeys)
    await Promise.all(journeys.map(computeJourneyFare));

    return NextResponse.json({ mode: "journey", journeys });
  } catch (error) {
    console.error("[API] journey error:", error);
    return NextResponse.json({ error: "Failed to plan journey" }, { status: 500 });
  }
}
