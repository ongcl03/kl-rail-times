"use client";
import useSWR from "swr";
import type { Arrival } from "@/lib/gtfs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useArrivals(stopId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{
    direction0: Arrival[];
    direction1: Arrival[];
    dir0Label: string;
    dir1Label: string;
  }>(stopId ? `/api/arrivals/${stopId}` : null, fetcher, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
  });

  return {
    direction0: data?.direction0 || [],
    direction1: data?.direction1 || [],
    dir0Label: data?.dir0Label || "",
    dir1Label: data?.dir1Label || "",
    isLoading,
    error,
    refresh: mutate,
  };
}
