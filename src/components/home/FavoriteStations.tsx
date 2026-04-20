"use client";
import Link from "next/link";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteStations() {
  const { favoriteStations, isLoaded } = useFavorites();

  if (!isLoaded || favoriteStations.length === 0) return null;

  return (
    <section className="mb-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
        Favorite Stations
      </h2>
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
        {favoriteStations.map((station) => (
          <Link
            key={station.stopId}
            href={`/station/${station.stopId}`}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all flex-shrink-0"
          >
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: station.lineColor }}
            />
            <span className="text-sm font-medium text-slate-900 dark:text-white whitespace-nowrap">
              {station.stopName}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
