"use client";
import useSWR from "swr";
import type { BusRouteInfo, BusOperator } from "@/lib/bus/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBusRoutes(operator: BusOperator) {
  const { data, error, isLoading } = useSWR<BusRouteInfo[]>(
    `/api/bus/routes/${operator}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  return { routes: data || [], isLoading, error };
}
