import { NextResponse } from "next/server";
import GtfsRealtimeBindings from "gtfs-realtime-bindings";
import { getGTFSData } from "@/lib/gtfs/cache";

const PRASARANA_URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/prasarana?category=rapid-rail-kl";
const KTMB_URL =
  "https://api.data.gov.my/gtfs-realtime/vehicle-position/ktmb";

let cachedPositions: unknown[] = [];
let cacheTime = 0;
const CACHE_TTL = 25_000; // 25 seconds

interface VehiclePosition {
  id: string;
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

async function fetchVehicles(url: string): Promise<VehiclePosition[]> {
  const response = await fetch(url);
  if (!response.ok) return [];

  const buffer = Buffer.from(await response.arrayBuffer());
  const feed = GtfsRealtimeBindings.transit_realtime.FeedMessage.decode(buffer);

  return feed.entity
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
        timestamp: v.timestamp ? Number(v.timestamp) : null,
      };
    });
}

export async function GET() {
  try {
    const now = Date.now();
    if (cachedPositions.length > 0 && now - cacheTime < CACHE_TTL) {
      return NextResponse.json({ vehicles: cachedPositions, cached: true });
    }

    const [prasaranaVehicles, ktmbVehiclesRaw, gtfsData] = await Promise.all([
      fetchVehicles(PRASARANA_URL).catch(() => []),
      fetchVehicles(KTMB_URL).catch(() => []),
      getGTFSData().catch(() => null),
    ]);

    // KTMB realtime feed has empty routeId — look it up from tripId via GTFS trips data
    const ktmbVehicles = ktmbVehiclesRaw.map((v) => {
      if (!v.routeId && v.tripId && gtfsData) {
        const trip = gtfsData.trips.get(v.tripId);
        if (trip) return { ...v, routeId: trip.route_id };
      }
      return v;
    });

    const vehicles = [...prasaranaVehicles, ...ktmbVehicles];

    cachedPositions = vehicles;
    cacheTime = now;

    return NextResponse.json({ vehicles, cached: false });
  } catch (error) {
    console.error("[API] vehicle-positions error:", error);
    return NextResponse.json({
      vehicles: cachedPositions,
      error: "Failed to fetch vehicle positions",
    });
  }
}
