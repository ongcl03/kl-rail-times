"use client";
import useSWR from "swr";
import { useCallback } from "react";
import type { BusOperator } from "@/lib/bus/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export interface BusVehicle {
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

export function useBusVehiclePositions() {
  const { data, error, isLoading, mutate } = useSWR<{ vehicles: BusVehicle[] }>(
    "/api/bus/vehicle-positions",
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    vehicles: data?.vehicles || [],
    isLoading,
    error,
    refresh,
  };
}
