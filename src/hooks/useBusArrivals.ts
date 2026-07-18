"use client";
import useSWR from "swr";
import { useCallback } from "react";
import type { BusArrival, BusOperator } from "@/lib/bus/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface BusArrivalsResponse {
  arrivals: BusArrival[];
  dir0Label: string;
  dir1Label: string;
}

export function useBusArrivals(
  stopId: string,
  operator: BusOperator,
  routeId?: string
) {
  const url = routeId
    ? `/api/bus/arrivals/${stopId}?operator=${operator}&route=${encodeURIComponent(routeId)}`
    : `/api/bus/arrivals/${stopId}?operator=${operator}`;

  const { data, error, isLoading, mutate } = useSWR<BusArrivalsResponse>(
    url,
    fetcher,
    { refreshInterval: 30_000, revalidateOnFocus: false }
  );

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    arrivals: data?.arrivals || [],
    dir0Label: data?.dir0Label || "",
    dir1Label: data?.dir1Label || "",
    isLoading,
    error,
    refresh,
  };
}
