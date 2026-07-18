"use client";
import { useState, useEffect } from "react";
import { BusArrivalRow } from "./BusArrivalRow";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBusArrivals } from "@/hooks/useBusArrivals";
import { RefreshCw, Clock } from "lucide-react";
import type { BusOperator } from "@/lib/bus/types";

const COUNTDOWN_LIMIT = 5;

export function BusArrivalBoard({
  stopId,
  operator,
  routeId,
}: {
  stopId: string;
  operator: BusOperator;
  routeId?: string;
}) {
  const { arrivals, dir0Label, dir1Label, isLoading, refresh } = useBusArrivals(
    stopId,
    operator,
    routeId
  );
  const [activeDir, setActiveDir] = useState<0 | 1 | "all">("all");
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading) setLastUpdate(new Date());
  }, [arrivals, isLoading]);

  const hasDir0 = arrivals.some((a) => a.directionId === 0);
  const hasDir1 = arrivals.some((a) => a.directionId === 1);
  const hasBothDirs = hasDir0 && hasDir1;

  const filtered =
    activeDir === "all"
      ? arrivals
      : arrivals.filter((a) => a.directionId === activeDir);

  return (
    <div>
      {/* Live indicator */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="w-2 h-2 rounded-full bg-green-500 absolute animate-ping" />
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {lastUpdate
              ? `Updated ${lastUpdate.toLocaleTimeString("en-MY", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}`
              : "Loading..."}
          </span>
        </div>
        <button
          onClick={() => refresh()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Direction tabs — only show when there are two distinct directions */}
      {hasBothDirs && (
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
          <button
            onClick={() => setActiveDir("all")}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
              activeDir === "all"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            All
          </button>
          {dir0Label && (
            <button
              onClick={() => setActiveDir(0)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 0
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              To {dir0Label}
            </button>
          )}
          {dir1Label && (
            <button
              onClick={() => setActiveDir(1)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 1
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              To {dir1Label}
            </button>
          )}
        </div>
      )}

      {/* Arrivals */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.slice(0, COUNTDOWN_LIMIT).map((a, i) => (
            <BusArrivalRow key={`${a.tripId}-${i}`} arrival={a} showCountdown />
          ))}
          {filtered.length > COUNTDOWN_LIMIT && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Later
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {filtered.length - COUNTDOWN_LIMIT} more buses
                </span>
              </div>
              <div className="space-y-0.5">
                {filtered.slice(COUNTDOWN_LIMIT).map((a, i) => (
                  <BusArrivalRow
                    key={`${a.tripId}-later-${i}`}
                    arrival={a}
                    showCountdown={false}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">No upcoming buses</p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
            Service may have ended for today
          </p>
        </div>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
        Based on scheduled timetable. Auto-refreshes every 30s.
      </p>
    </div>
  );
}
