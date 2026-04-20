"use client";
import { Countdown } from "../ui/Countdown";
import { Badge } from "../ui/Badge";
import type { Arrival } from "@/lib/gtfs/types";

export function ArrivalRow({ arrival }: { arrival: Arrival }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: arrival.lineColor }}
        />
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-white truncate">
            {arrival.headsign}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {arrival.scheduledArrival}
            </span>
            {arrival.status === "approaching" && (
              <Badge label="Approaching" color="#F59E0B" textColor="#000" />
            )}
          </div>
        </div>
      </div>
      <Countdown minutesAway={arrival.minutesAway} status={arrival.status} />
    </div>
  );
}
