"use client";
import useSWR from "swr";
import type { LineInfo } from "@/lib/gtfs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useLines() {
  const { data, error, isLoading } = useSWR<LineInfo[]>("/api/lines", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60_000,
  });

  return {
    lines: data || [],
    isLoading,
    error,
  };
}
