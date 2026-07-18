"use client";
import useSWR from "swr";
import type { BusRouteDetail, BusOperator } from "@/lib/bus/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useBusRoute(operator: BusOperator, routeId: string) {
  const { data, error, isLoading } = useSWR<BusRouteDetail>(
    `/api/bus/routes/${operator}/${encodeURIComponent(routeId)}`,
    fetcher,
    { revalidateOnFocus: false, dedupingInterval: 300_000 }
  );
  return { route: data || null, isLoading, error };
}
