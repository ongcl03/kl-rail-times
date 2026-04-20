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
  nowSeconds: number; // pass -1 to disable highlighting/dimming
}) {
  const currentHourRef = useRef<HTMLDivElement>(null);
  const hasTimeContext = nowSeconds >= 0;

  const hourGroups = useMemo(() => {
    const groups = new Map<number, TimetableEntry[]>();
    for (const entry of entries) {
      const hour = Math.floor(entry.arrivalSeconds / 3600);
      const list = groups.get(hour) || [];
      list.push(entry);
      groups.set(hour, list);
    }
    for (const [, list] of groups) {
      list.sort((a, b) => a.arrivalSeconds - b.arrivalSeconds);
    }
    return groups;
  }, [entries]);

  const nextEntrySeconds = useMemo(() => {
    if (!hasTimeContext) return -1;
    for (const entry of entries) {
      if (entry.arrivalSeconds >= nowSeconds) return entry.arrivalSeconds;
    }
    return -1;
  }, [entries, nowSeconds, hasTimeContext]);

  const currentHour = hasTimeContext ? Math.floor(nowSeconds / 3600) : -1;

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
        No schedule data available
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {sortedHours.map((hour) => {
        const group = hourGroups.get(hour)!;
        const isPastHour = hasTimeContext && hour < currentHour;
        const isCurrentHour = hasTimeContext && hour === currentHour;
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
            <div className="flex items-center gap-2 mb-2.5 sticky top-14 bg-background/95 backdrop-blur-sm py-1.5 z-10">
              <span
                className={`text-xs font-bold uppercase tracking-wider ${
                  isCurrentHour
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {formatHourLabel(hour)}
              </span>
              {headway && (
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  ~{headway} min interval
                </span>
              )}
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {group.length}
              </span>
            </div>

            {/* Time pills */}
            <div className="flex flex-wrap gap-2">
              {group.map((entry, i) => {
                const isPast = hasTimeContext && entry.arrivalSeconds < nowSeconds;
                const isNext = entry.arrivalSeconds === nextEntrySeconds;

                return (
                  <span
                    key={`${entry.arrivalSeconds}-${i}`}
                    className={`inline-flex items-center text-sm font-mono rounded-lg transition-all ${
                      isNext
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/40 font-bold px-3 py-1.5"
                        : isPast
                          ? "text-slate-400 dark:text-slate-600 px-2.5 py-1"
                          : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1"
                    }`}
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
