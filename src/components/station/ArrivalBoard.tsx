"use client";
import { useState, useEffect } from "react";
import { ArrivalRow } from "./ArrivalRow";
import { ArrivalSkeleton } from "../ui/Skeleton";
import { useArrivals } from "@/hooks/useArrivals";
import { RefreshCw, Clock } from "lucide-react";

export function ArrivalBoard({ stopId, stopName }: { stopId: string; stopName: string }) {
  const { direction0, direction1, dir0Label, dir1Label, isLoading, refresh } = useArrivals(stopId);
  const [activeDir, setActiveDir] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    if (!isLoading) setLastUpdate(new Date());
  }, [direction0, direction1, isLoading]);

  const arrivals = activeDir === 0 ? direction0 : direction1;

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
              ? `Updated ${lastUpdate.toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Connecting..."}
          </span>
        </div>
        <button
          onClick={() => refresh()}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Direction tabs */}
      {(dir0Label || dir1Label) && (
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
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
        </div>
      )}

      {/* Arrivals list */}
      {isLoading ? (
        <ArrivalSkeleton />
      ) : arrivals.length > 0 ? (
        <div className="space-y-2">
          {arrivals.map((a, i) => (
            <ArrivalRow key={`${a.tripId}-${i}`} arrival={a} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Clock className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            No upcoming trains
          </p>
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
