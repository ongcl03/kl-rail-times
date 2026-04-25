"use client";
import { useState, useEffect } from "react";
import { ArrivalRow } from "./ArrivalRow";
import { ArrivalSkeleton } from "../ui/Skeleton";
import { useArrivals } from "@/hooks/useArrivals";
import { RefreshCw, Clock, Calendar, ExternalLink } from "lucide-react";
import Link from "next/link";

const COUNTDOWN_LIMIT = 5;
const KTMB_TIMETABLE_URL = "https://www.ktmb.com.my/TrainTime.html";

export function ArrivalBoard({ stopId, stopName, routeId, lineId }: { stopId: string; stopName: string; routeId?: string; lineId?: string }) {
  const { direction0, direction1, dir0Label, dir1Label, isLoading, refresh } = useArrivals(stopId, routeId);
  const [activeDir, setActiveDir] = useState(0);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const isKtmStation = /^\d+$/.test(stopId);

  useEffect(() => {
    if (!isLoading) setLastUpdate(new Date());
  }, [direction0, direction1, isLoading]);

  const arrivals = activeDir === 0 ? direction0 : direction1;
  const label0 = dir0Label;
  const label1 = dir1Label;

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
      {(label0 || label1) && (
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
          <button
            onClick={() => setActiveDir(0)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
              activeDir === 0
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            To {label0}
          </button>
          <button
            onClick={() => setActiveDir(1)}
            className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
              activeDir === 1
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            To {label1}
          </button>
        </div>
      )}

      {/* Arrivals list */}
      {isLoading ? (
        <ArrivalSkeleton />
      ) : arrivals.length > 0 ? (
        <div className="space-y-2">
          {/* First N with full countdown cards */}
          {arrivals.slice(0, COUNTDOWN_LIMIT).map((a, i) => (
            <ArrivalRow key={`${a.tripId}-${i}`} arrival={a} showCountdown />
          ))}

          {/* Full timetable link + remaining trains */}
          {arrivals.length > COUNTDOWN_LIMIT && (
            <>
              <div className="flex items-center gap-2 mt-4 mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Later
                </span>
                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  {arrivals.length - COUNTDOWN_LIMIT} more trains
                </span>
              </div>
              <div className="grid grid-cols-1 gap-1">
                {arrivals.slice(COUNTDOWN_LIMIT).map((a, i) => (
                  <ArrivalRow key={`${a.tripId}-later-${i}`} arrival={a} showCountdown={false} />
                ))}
              </div>
            </>
          )}
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

      {/* Full timetable link — always visible */}
      <Link
        href={`/station/${stopId}/timetable${lineId ? `?line=${lineId}` : ""}`}
        className="flex items-center justify-center gap-2 py-2.5 mt-4 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-950 transition-all"
      >
        <Calendar className="w-4 h-4" />
        View full day timetable
      </Link>

      {isKtmStation && (
        <a
          href={KTMB_TIMETABLE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 py-2.5 mt-2 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View official KTMB timetable
        </a>
      )}

      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-6">
        Based on scheduled timetable. Auto-refreshes every 30s.
      </p>
    </div>
  );
}
