"use client";
import { useState, Suspense } from "react";
import { useLines } from "@/hooks/useLines";
import { useJourney } from "@/hooks/useJourney";
import { StationPicker } from "@/components/journey/StationPicker";
import { JourneyResult } from "@/components/journey/JourneyResult";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowUpDown, Navigation, MapPin } from "lucide-react";

type Station = { stopId: string; stopName: string; lineColor: string } | null;

function JourneyContent() {
  const { lines, isLoading: linesLoading } = useLines();
  const [from, setFrom] = useState<Station>(null);
  const [to, setTo] = useState<Station>(null);
  const [searched, setSearched] = useState(false);
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);

  const { data, isLoading, mutate } = useJourney(searchFrom, searchTo);

  const handleSearch = () => {
    if (!from) return;
    if (searchFrom === from.stopId && searchTo === (to?.stopId || null)) {
      mutate();
    } else {
      setSearchFrom(from.stopId);
      setSearchTo(to?.stopId || null);
    }
    setSearched(true);
  };

  const handleSwap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  if (linesLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-14 w-full mb-3" />
        <Skeleton className="h-14 w-full mb-3" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 mb-3">
          <Navigation className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Journey Planner
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Plan your route across the Klang Valley rail network
        </p>
      </div>

      {/* Form */}
      <div className="space-y-3 mb-6">
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <StationPicker label="From" lines={lines} value={from} onChange={setFrom} />
          </div>
          {from && to && (
            <button
              onClick={handleSwap}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all mb-0.5"
              title="Swap stations"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          )}
        </div>

        <StationPicker label="To" lines={lines} value={to} onChange={setTo} />

        <button
          onClick={handleSearch}
          disabled={!from}
          className="w-full py-3 px-4 rounded-xl font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
        >
          {to ? "Plan Journey" : from ? "View Schedule" : "Select a station"}
        </button>
      </div>

      {/* Results */}
      {searched && (
        <div className="animate-fade-in">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : data?.mode === "journey" && data.journey ? (
            <JourneyResult journey={data.journey} />
          ) : data?.mode === "journey" && !data.journey ? (
            <div className="text-center py-12">
              <MapPin className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                No route found
              </p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                These stations may not be connected
              </p>
            </div>
          ) : data?.mode === "schedule" ? (
            <div className="text-center py-8">
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                Showing schedule for {from?.stopName}.{" "}
                <a href={`/station/${from?.stopId}`} className="text-blue-600 dark:text-blue-400 underline">
                  View full station page
                </a>
              </p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default function JourneyPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-14 w-full mb-3" />
        <Skeleton className="h-14 w-full" />
      </div>
    }>
      <JourneyContent />
    </Suspense>
  );
}
