"use client";
import { useMemo } from "react";
import { useLines } from "@/hooks/useLines";
import { LineCard } from "@/components/home/LineCard";
import { SearchBar } from "@/components/home/SearchBar";
import { LineCardSkeleton } from "@/components/ui/Skeleton";
import { FavoriteStations } from "@/components/home/FavoriteStations";
import { Train } from "lucide-react";

const LINE_GROUPS = [
  { label: "Prasarana (Rapid KL)", types: ["LRT", "MRT", "Monorail", "BRT"] },
  { label: "KTM Komuter", types: ["KTM Komuter"] },
  { label: "KTM ETS", types: ["KTM ETS"] },
  { label: "KTM Intercity", types: ["KTM Intercity"] },
];

export default function HomePage() {
  const { lines, isLoading } = useLines();

  const groups = useMemo(() => {
    return LINE_GROUPS
      .map((g) => ({
        label: g.label,
        lines: lines.filter((l) => g.types.includes(l.type)),
      }))
      .filter((g) => g.lines.length > 0);
  }, [lines]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950 mb-4">
          <Train className="w-7 h-7 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          KL Rail Times
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Live arrival estimates for Klang Valley rail transit
        </p>
      </div>

      <div className="mb-6">
        <SearchBar lines={lines} />
      </div>

      <FavoriteStations />

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <LineCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <div key={group.label}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                {group.label}
              </h2>
              <div className="space-y-3">
                {group.lines.map((line) => (
                  <LineCard key={line.id} line={line} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && lines.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">
            Loading transit data...
          </p>
        </div>
      )}
    </div>
  );
}
