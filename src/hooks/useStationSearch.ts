"use client";
import { useState, useMemo } from "react";
import type { LineInfo } from "@/lib/gtfs/types";

export function useStationSearch(lines: LineInfo[]) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: { stopId: string; stopName: string; lineName: string; lineColor: string; lineId: string }[] = [];

    for (const line of lines) {
      for (const station of line.stations) {
        if (station.stopName.toLowerCase().includes(q)) {
          matches.push({
            ...station,
            lineName: line.name,
            lineColor: line.color,
            lineId: line.id,
          });
        }
      }
    }

    // Deduplicate by stopId
    const seen = new Set<string>();
    return matches.filter((m) => {
      if (seen.has(m.stopId)) return false;
      seen.add(m.stopId);
      return true;
    }).slice(0, 10);
  }, [query, lines]);

  return { query, setQuery, results };
}
