"use client";
import { useState } from "react";
import type { JourneyRoute } from "@/lib/journey/types";
import { LegCard } from "./LegCard";
import { Clock, ArrowRight, RefreshCw } from "lucide-react";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}min`;
  return `${m} min`;
}

function formatTimeFromSeconds(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600) % 24;
  const m = Math.floor((totalSeconds % 3600) / 60);
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function parseTimeToSeconds(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 3600 + m * 60;
}

function computeLegTimes(journey: JourneyRoute, departureTime: string) {
  const times: { departTime: string; arriveTime: string }[] = [];
  let currentSeconds = parseTimeToSeconds(departureTime);
  for (const leg of journey.legs) {
    const departTime = formatTimeFromSeconds(currentSeconds);
    currentSeconds += leg.travelSeconds;
    const arriveTime = formatTimeFromSeconds(currentSeconds);
    times.push({ departTime, arriveTime });
  }
  return times;
}

export function JourneyResult({ journey }: { journey: JourneyRoute }) {
  const [selectedDepIndex, setSelectedDepIndex] = useState(0);

  const selectedDep = journey.departures[selectedDepIndex] || journey.departures[0];
  const legTimes = selectedDep ? computeLegTimes(journey, selectedDep.time) : [];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="flex items-center gap-4 p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        <div className="flex-1">
          <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white">
            <Clock className="w-5 h-5 text-slate-400" />
            {formatDuration(journey.totalSeconds)}
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {journey.transfers === 0
              ? "Direct — no transfers"
              : `${journey.transfers} transfer${journey.transfers > 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-0.5">
          {journey.legs
            .filter((l) => l.type === "rail")
            .map((leg, i) => (
              <div key={i} className="flex items-center gap-0.5">
                {i > 0 && <RefreshCw className="w-3 h-3 text-slate-400 mx-1" />}
                <div
                  className="h-3 rounded-full"
                  style={{
                    backgroundColor: leg.lineColor,
                    width: `${Math.max(24, Math.min(80, leg.travelSeconds / 10))}px`,
                  }}
                />
                <span className="text-[10px] font-bold" style={{ color: leg.lineColor }}>
                  {leg.lineShortName}
                </span>
              </div>
            ))}
        </div>
      </div>

      {/* Legs (always visible, times update when departure is selected) */}
      <div className="space-y-0">
        {journey.legs.map((leg, i) => (
          <LegCard
            key={i}
            leg={leg}
            isFirst={i === 0}
            isLast={i === journey.legs.length - 1}
            departTime={legTimes[i]?.departTime}
            arriveTime={legTimes[i]?.arriveTime}
          />
        ))}
      </div>

      {/* Departures list */}
      {journey.departures.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            Next Departures
          </h3>
          <div className="space-y-1.5">
            {journey.departures.map((dep, i) => (
              <button
                key={i}
                onClick={() => setSelectedDepIndex(i)}
                className={`w-full flex items-center justify-between py-3 px-4 rounded-lg transition-all text-left ${
                  i === selectedDepIndex
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/30"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-sm font-mono font-semibold ${
                      i === selectedDepIndex ? "text-blue-700 dark:text-blue-300" : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {dep.time}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-sm font-mono text-slate-500 dark:text-slate-400">
                    {dep.arrivalTime}
                  </span>
                </div>
                <span
                  className={`text-sm font-medium ${
                    i === selectedDepIndex ? "text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {dep.minutesAway <= 0 ? "Now" : `${dep.minutesAway} min`}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
