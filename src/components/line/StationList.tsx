"use client";
import Link from "next/link";
import type { LineInfo } from "@/lib/gtfs/types";

export function StationList({ line }: { line: LineInfo }) {
  return (
    <div className="relative pl-8">
      {/* Vertical line */}
      <div
        className="absolute left-[11px] top-2 bottom-2 w-0.5 rounded-full"
        style={{ backgroundColor: line.color }}
      />

      <div className="space-y-0">
        {line.stations.map((station, idx) => {
          const isFirst = idx === 0;
          const isLast = idx === line.stations.length - 1;
          const isTerminal = isFirst || isLast;

          return (
            <Link
              key={station.stopId}
              href={`/station/${station.stopId}?line=${line.id}`}
              className="group flex items-center gap-3 py-2.5 -ml-8 pl-8 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg transition-colors"
            >
              {/* Station dot */}
              <div
                className="absolute left-1.5 w-[13px] h-[13px] rounded-full border-2 bg-white dark:bg-slate-900 z-10"
                style={{
                  borderColor: line.color,
                  backgroundColor: isTerminal ? line.color : undefined,
                }}
              />

              <span
                className={`text-sm ${
                  isTerminal
                    ? "font-semibold text-slate-900 dark:text-white"
                    : "text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white"
                } transition-colors`}
              >
                {station.stopName}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
