"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useLines } from "@/hooks/useLines";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { TimetableView } from "@/components/station/TimetableView";
import useSWR from "swr";
import { useState, useEffect, Suspense } from "react";
import type { TimetableEntry } from "@/lib/gtfs/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const DAY_OPTIONS = [
  { value: "weekday", label: "Weekday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

function getCurrentDayType(): string {
  const dow = new Date().getDay();
  if (dow === 0) return "sunday";
  if (dow === 6) return "saturday";
  return "weekday";
}

function TimetableContent() {
  const { stopId } = useParams<{ stopId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { lines, isLoading: linesLoading } = useLines();

  const dayParam = searchParams.get("day");
  const [dayType, setDayType] = useState(dayParam || getCurrentDayType());
  const [activeDir, setActiveDir] = useState(0);
  const [nowSeconds, setNowSeconds] = useState(() => {
    const d = new Date();
    return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
  });

  useEffect(() => {
    const interval = setInterval(() => {
      const d = new Date();
      setNowSeconds(d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading } = useSWR<{
    direction0: TimetableEntry[];
    direction1: TimetableEntry[];
    dir0Label: string;
    dir1Label: string;
  }>(`/api/arrivals/${stopId}?mode=fullday&day=${dayType}`, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 300_000,
  });

  // Find station info
  let stationName = stopId;
  const stationLines: { shortName: string; name: string; color: string; textColor: string }[] = [];
  for (const line of lines) {
    for (const station of line.stations) {
      if (station.stopId === stopId) {
        stationName = station.stopName;
        stationLines.push({
          shortName: line.shortName,
          name: line.name,
          color: line.color,
          textColor: line.textColor,
        });
        break;
      }
    }
  }

  const entries = activeDir === 0 ? (data?.direction0 || []) : (data?.direction1 || []);
  const dir0Label = data?.dir0Label || "";
  const dir1Label = data?.dir1Label || "";
  const primaryColor = stationLines[0]?.color || "#6B7280";
  const isToday = dayType === getCurrentDayType();

  const handleDayChange = (newDay: string) => {
    setDayType(newDay);
    router.replace(`/station/${stopId}/timetable?day=${newDay}`, { scroll: false });
  };

  if (linesLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-5">
          <BackButton />
          <div className="mt-3 flex items-center gap-4">
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                {stationLines.map((l) => (
                  <Badge
                    key={l.shortName}
                    label={`${l.shortName} ${l.name}`}
                    color={l.color}
                    textColor={l.textColor}
                  />
                ))}
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                {stationName}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Full Day Timetable
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Day type selector */}
        <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-4">
          {DAY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleDayChange(opt.value)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all ${
                dayType === opt.value
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Direction tabs */}
        {(dir0Label || dir1Label) && (
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
            <button
              onClick={() => setActiveDir(0)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 0
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              To {dir0Label}
            </button>
            <button
              onClick={() => setActiveDir(1)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 1
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              To {dir1Label}
            </button>
          </div>
        )}

        {/* Summary */}
        {!isLoading && entries.length > 0 && (
          <div className="flex items-center gap-4 mb-6 text-sm text-slate-500 dark:text-slate-400">
            <span>{entries.length} trains</span>
            <span>First: {entries[0].scheduledArrival}</span>
            <span>Last: {entries[entries.length - 1].scheduledArrival}</span>
          </div>
        )}

        {/* Timetable */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i}>
                <Skeleton className="h-4 w-20 mb-2" />
                <div className="flex flex-wrap gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <Skeleton key={j} className="h-8 w-14" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : entries.length > 0 ? (
          <TimetableView
            entries={entries}
            nowSeconds={isToday ? nowSeconds : -1}
          />
        ) : (
          <p className="text-center text-slate-400 dark:text-slate-500 py-12">
            No trains scheduled for this day
          </p>
        )}

        <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-8">
          Based on scheduled timetable from data.gov.my
        </p>
      </div>
    </div>
  );
}

export default function TimetablePage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    }>
      <TimetableContent />
    </Suspense>
  );
}
