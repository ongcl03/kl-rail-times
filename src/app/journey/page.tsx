"use client";
import { useState, Suspense } from "react";
import { useLines } from "@/hooks/useLines";
import { useJourney } from "@/hooks/useJourney";
import { StationPicker } from "@/components/journey/StationPicker";
import { JourneyResult } from "@/components/journey/JourneyResult";
import { Skeleton } from "@/components/ui/Skeleton";
import { BackButton } from "@/components/layout/BackButton";
import { ArrowUpDown, Navigation, MapPin, Clock } from "lucide-react";

type Station = { stopId: string; stopName: string; lineColor: string } | null;

function JourneyContent() {
  const { lines, isLoading: linesLoading } = useLines();
  const [from, setFrom] = useState<Station>(null);
  const [to, setTo] = useState<Station>(null);
  const [searched, setSearched] = useState(false);
  const [searchFrom, setSearchFrom] = useState<string | null>(null);
  const [searchTo, setSearchTo] = useState<string | null>(null);
  const [departureMode, setDepartureMode] = useState<"now" | "custom">("now");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [searchTime, setSearchTime] = useState<string | undefined>(undefined);
  const [searchDate, setSearchDate] = useState<string | undefined>(undefined);

  const { data, isLoading, mutate } = useJourney(searchFrom, searchTo, searchTime, searchDate);

  const handleSearch = () => {
    if (!from) return;
    const newTime = departureMode === "custom" && selectedTime ? selectedTime : undefined;
    const newDate = departureMode === "custom" && selectedDate ? selectedDate : undefined;
    if (
      searchFrom === from.stopId &&
      searchTo === (to?.stopId || null) &&
      searchTime === newTime &&
      searchDate === newDate
    ) {
      mutate();
    } else {
      setSearchFrom(from.stopId);
      setSearchTo(to?.stopId || null);
      setSearchTime(newTime);
      setSearchDate(newDate);
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
        <BackButton />
        <div className="flex items-center gap-3 mt-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950">
            <Navigation className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
              Journey Planner
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Plan your route across the Klang Valley rail network
            </p>
          </div>
        </div>
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

        {/* Departure time selector */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Depart at
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setDepartureMode("now")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                departureMode === "now"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Now
            </button>
            <button
              onClick={() => {
                setDepartureMode("custom");
                if (!selectedDate) {
                  const now = new Date().toLocaleString("en-CA", { timeZone: "Asia/Kuala_Lumpur" });
                  setSelectedDate(now.split(",")[0].trim());
                }
                if (!selectedTime) {
                  const now = new Date().toLocaleString("en-GB", {
                    timeZone: "Asia/Kuala_Lumpur",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  setSelectedTime(now);
                }
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                departureMode === "custom"
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
              }`}
            >
              Choose time
            </button>
          </div>
          {departureMode === "custom" && (
            <div className="flex gap-2 mt-2">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white"
              />
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="px-3 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white"
              />
            </div>
          )}
        </div>

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
