"use client";
import { ArrowRight } from "lucide-react";
import type { FavoriteJourney } from "@/hooks/useFavorites";

type Station = { stopId: string; stopName: string; lineColor: string };

export function FavoriteJourneys({
  journeys,
  onSelect,
}: {
  journeys: FavoriteJourney[];
  onSelect: (from: Station, to: Station) => void;
}) {
  if (journeys.length === 0) return null;

  return (
    <section className="mb-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
        Saved Journeys
      </h3>
      <div className="space-y-2">
        {journeys.map((j) => (
          <button
            key={`${j.fromStopId}-${j.toStopId}`}
            onClick={() =>
              onSelect(
                { stopId: j.fromStopId, stopName: j.fromStopName, lineColor: j.fromLineColor },
                { stopId: j.toStopId, stopName: j.toStopName, lineColor: j.toLineColor }
              )
            }
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-md hover:border-slate-200 dark:hover:border-slate-600 transition-all text-left"
          >
            <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: j.fromLineColor }}
              />
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {j.fromStopName}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <div className="flex items-center justify-center gap-2 flex-1 min-w-0">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: j.toLineColor }}
              />
              <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
                {j.toStopName}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
