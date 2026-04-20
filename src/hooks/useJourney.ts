"use client";
import useSWR from "swr";
import type { JourneyRoute } from "@/lib/journey/types";
import type { Arrival } from "@/lib/gtfs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useJourney(from: string | null, to: string | null, time?: string, date?: string) {
  const params = new URLSearchParams();
  if (from) params.set("from", from);
  if (to) params.set("to", to);
  if (time) params.set("time", time);
  if (date) params.set("date", date);

  const key = from ? `/api/journey?${params.toString()}` : null;

  const { data, error, isLoading, mutate } = useSWR<{
    mode: "schedule" | "journey";
    journey?: JourneyRoute | null;
    direction0?: Arrival[];
    direction1?: Arrival[];
    dir0Label?: string;
    dir1Label?: string;
    error?: string;
  }>(key, fetcher, {
    revalidateOnFocus: false,
  });

  return { data, error, isLoading, mutate };
}
