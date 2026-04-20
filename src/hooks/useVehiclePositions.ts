"use client";
import useSWR from "swr";

export interface VehiclePosition {
  id: string;
  tripId: string | null;
  routeId: string | null;
  latitude: number | null;
  longitude: number | null;
  bearing: number | null;
  speed: number | null;
  stopId: string | null;
  currentStatus: number;
  timestamp: number | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useVehiclePositions() {
  const { data, error, isLoading, mutate } = useSWR<{
    vehicles: VehiclePosition[];
    cached: boolean;
  }>("/api/vehicle-positions", fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  return {
    vehicles: data?.vehicles || [],
    cached: data?.cached ?? false,
    isLoading,
    error,
    refresh: mutate,
  };
}
