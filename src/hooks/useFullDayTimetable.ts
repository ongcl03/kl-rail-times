"use client";
import useSWR from "swr";
import type { TimetableEntry } from "@/lib/gtfs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFullDayTimetable(stopId: string | null) {
  const { data, error, isLoading } = useSWR<{
    direction0: TimetableEntry[];
    direction1: TimetableEntry[];
    dir0Label: string;
    dir1Label: string;
  }>(stopId ? `/api/arrivals/${stopId}?mode=fullday` : null, fetcher, {
    revalidateOnFocus: false,
    refreshInterval: 0,
    dedupingInterval: 300_000,
  });

  return {
    direction0: data?.direction0 || [],
    direction1: data?.direction1 || [],
    dir0Label: data?.dir0Label || "",
    dir1Label: data?.dir1Label || "",
    isLoading,
    error,
  };
}
