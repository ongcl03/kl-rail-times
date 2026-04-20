import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";

const VEHICLE_POSITION_URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-rail-kl";

let cachedPositions: unknown[] = [];
let cacheTime = 0;
const CACHE_TTL = 25_000; // 25 seconds

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPositions.length > 0 && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ vehicles: cachedPositions, cached: true });
    }

    const response = await fetch(VEHICLE_POSITION_URL);
    if (!response.ok) {
      return NextResponse.json({
        vehicles: cachedPositions,
        error: `Upstream ${response.status}`,
      });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const feed =
      GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

    const vehicles = feed.entity
      .filter((e) => e.vehicle)
      .map((e) => {
        const v = e.vehicle!;
        return {
          id: e.id,
          tripId: v.trip?.tripId || null,
          routeId: v.trip?.routeId || null,
          latitude: v.position?.latitude || null,
          longitude: v.position?.longitude || null,
          bearing: v.position?.bearing || null,
          speed: v.position?.speed || null,
          stopId: v.stopId || null,
          currentStatus: v.currentStatus,
          timestamp: v.timestamp
            ? Number(v.timestamp)
            : null,
        };
      });

    cachedPositions = vehicles;
    cacheTime = now;

    return NextResponse.json({ vehicles, cached: false });
  } catch (error) {
    console.error("[API] vehicle-positions error:", error);
    return NextResponse.json(
      { vehicles: cachedPositions, error: "Failed to fetch vehicle positions" },
    );
  }
}
