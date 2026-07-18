import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { BUS_REALTIME_URLS } from "@/lib/bus/fetcher";
import type { BusOperator } from "@/lib/bus/types";

interface BusVehiclePosition {
  id: string;
  operator: BusOperator;
  tripId: string | null;
  routeId: string | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  speed: number | null;
  stopId: string | null;
  currentStatus: number | null | undefined;
  timestamp: number | null;
}

let cachedPositions: BusVehiclePosition[] = [];
let cacheTime = 0;
const CACHE_TTL = 25_000; // 25 seconds

async function fetchBusVehicles(operator: BusOperator): Promise<BusVehiclePosition[]> {
  const url = BUS_REALTIME_URLS[operator];
  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const buffer = Buffer.from(await response.arrayBuffer());
    const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    return feed.entity
      .filter((e) => e.vehicle)
      .map((e) => {
        const v = e.vehicle!;
        return {
          id: `${operator}_${e.id}`,
          operator,
          tripId: v.trip?.tripId || null,
          routeId: v.trip?.routeId || null,
          latitude: v.position?.latitude || null,
          longitude: v.position?.longitude || null,
          bearing: v.position?.bearing || null,
          speed: v.position?.speed || null,
          stopId: v.stopId || null,
          currentStatus: v.currentStatus,
          timestamp: v.timestamp ? Number(v.timestamp) : null,
        };
      });
  } catch {
    return [];
  }
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPositions.length > 0 && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ vehicles: cachedPositions, cached: true });
    }

    const operators: BusOperator[] = [
      "rapid-bus-kl",
      "rapid-bus-mrtfeeder",
      "rapid-bus-penang",
      "rapid-bus-kuantan",
    ];

    const results = await Promise.all(
      operators.map((op) => fetchBusVehicles(op).catch(() => []))
    );

    const vehicles = results.flat();
    cachedPositions = vehicles;
    cacheTime = now;

    return NextResponse.json({ vehicles, cached: false });
  } catch (error) {
    console.error("[API] bus/vehicle-positions error:", error);
    return NextResponse.json({
      vehicles: cachedPositions,
      error: "Failed to fetch bus vehicle positions",
    });
  }
}
