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

    // Deduplicate by stopId+lineId (allows same station to appear per line)
    const seen = new Set<string>();
    return matches.filter((m) => {
      const key = `${m.stopId}_${m.lineId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 10);
  }, [query, lines]);

  return { query, setQuery, results };
}
