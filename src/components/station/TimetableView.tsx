"use client";
import { useEffect, useRef, useMemo } from "react";
import type { TimetableEntry } from "@/lib/gtfs/types";

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function TimetableView({
  entries,
  nowSeconds,
}: {
  entries: TimetableEntry[];
  nowSeconds: number;
}) {
  const currentHourRef = useRef<HTMLDivElement>(null);

  // Group entries by hour
  const hourGroups = useMemo(() => {
    const groups = new Map<number, TimetableEntry[]>();
    for (const entry of entries) {
      const hour = Math.floor(entry.arrivalSeconds / 3600);
      const list = groups.get(hour) || [];
      list.push(entry);
      groups.set(hour, list);
    }
    // Sort each group
    for (const [, list] of groups) {
      list.sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);
    }
    return groups;
  }, [entries]);

  // Find the next upcoming entry
  const nextEntrySeconds = useMemo(() => {
    for (const entry of entries) {
      if (entry.arrivalSeconds >= nowSeconds) return entry.arrivalSeconds;
    }
    return -1;
  }, [entries, nowSeconds]);

  const currentHour = Math.floor(nowSeconds / 3600);

  // Auto-scroll to current hour on mount
  useEffect(() => {
    if (currentHourRef.current) {
      currentHourRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  const sortedHours = Array.from(hourGroups.keys()).sort((a, b) => a - b);

  if (sortedHours.length === 0) {
    return (
      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
        No schedule data available for today
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {sortedHours.map((hour) => {
        const group = hourGroups.get(hour)!;
        const isPastHour = hour < currentHour;
        const isCurrentHour = hour === currentHour;
        // Compute average headway for this hour
        const headway =
          group.length > 1
            ? Math.round(
                (group[group.length - 1].arrivalSeconds -
                  group[0].arrivalSeconds) /
                  (group.length - 1) /
                  60
              )
            : null;

        return (
          <div
            key={hour}
            ref={isCurrentHour ? currentHourRef : undefined}
            className={isPastHour ? "opacity-40" : ""}
          >
            {/* Hour header */}
            <div className="flex items-center gap-2 mb-2 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${
                  isCurrentHour
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {formatHourLabel(hour)}
              </span>
              {headway && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  every ~{headway} min
                </span>
              )}
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            {/* Time pills grid */}
            <div className="flex flex-wrap gap-1.5">
              {group.map((entry, i) => {
                const isPast = entry.arrivalSeconds < nowSeconds;
                const isNext = entry.arrivalSeconds === nextEntrySeconds;

                return (
                  <span
                    key={`${entry.arrivalSeconds}-${i}`}
                    className={`inline-flex items-center text-sm font-mono px-2.5 py-1 rounded-lg border transition-all ${
                      isNext
                        ? "bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/30 font-semibold"
                        : isPast
                          ? "bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/50 text-slate-400 dark:text-slate-500"
                          : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                    style={
                      isNext
                        ? undefined
                        : { borderLeftColor: entry.lineColor, borderLeftWidth: "3px" }
                    }
                  >
                    {entry.scheduledArrival}
                  </span>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
