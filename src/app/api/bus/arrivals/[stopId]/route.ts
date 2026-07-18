import { NextResponse } from "next/server";
import { getBusArrivals } from "@/lib/bus/schedule";
import type { BusOperator } from "@/lib/bus/types";

const VALID_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ stopId: string }> }
) {
  const { stopId } = await params;
  const url = new URL(request.url);
  const operator = url.searchParams.get("operator");
  const routeId = url.searchParams.get("route") || undefined;

  if (!operator || !VALID_OPERATORS.includes(operator as BusOperator)) {
    return NextResponse.json({ error: "Missing or invalid operator" }, { status: 400 });
  }

  try {
    const result = await getBusArrivals(stopId, operator as BusOperator, 30, 36 * 3600, routeId);
    return NextResponse.json(result);
  } catch (error) {
    console.error(`[API] bus/arrivals/${stopId} error:`, error);
    return NextResponse.json({ error: "Failed to fetch bus arrivals" }, { status: 500 });
  }
}
