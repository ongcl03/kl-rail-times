"use client";
import { useState } from "react";
import type { JourneyRoute } from "@/lib/journey/types";
import { LegCard } from "./LegCard";
import { Clock, ArrowRight, RefreshCw, MapPin, Route } from "lucide-react";

function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
import Link from "next/link";

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

export function JourneyResult({ journeys }: { journeys: JourneyRoute[] }) {
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [selectedDepIndex, setSelectedDepIndex] = useState(0);

  const journey = journeys[selectedRouteIndex] || journeys[0];
  if (!journey) return null;

  const selectedDep = journey.departures[selectedDepIndex] || journey.departures[0];
  const legTimes = selectedDep ? computeLegTimes(journey, selectedDep.time) : [];

  const fromStopId = journey.legs[0]?.fromStopId;
  const toStopId = journey.legs[journey.legs.length - 1]?.toStopId;

  const mapUrl = (() => {
    if (!fromStopId || !toStopId) return "";
    const params = new URLSearchParams();
    params.set("from", fromStopId);
    params.set("to", toStopId);
    journey.legs
      .filter((l) => l.type === "rail")
      .forEach((l) => params.append("leg", `${l.fromStopId},${l.toStopId},${l.lineShortName}`));
    journey.legs
      .filter((l) => l.type === "transfer")
      .forEach((l) => params.append("transfer", `${l.fromStopId},${l.toStopId}`));
    return `/map?${params.toString()}`;
  })();

  return (
    <div className="space-y-4">
      {/* Route selector (hidden when no departures) */}
      {journeys.length > 1 && journey.departures.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <Route className="w-3.5 h-3.5 text-slate-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {journeys.length} Routes
            </h3>
          </div>
          <div className="space-y-1.5">
          {journeys.map((j, i) => {
            const railLegs = j.legs.filter((l) => l.type === "rail");
            const transferLeg = j.legs.find((l) => l.type === "transfer");
            const isSelected = i === selectedRouteIndex;
            const viaStation = transferLeg ? titleCase(transferLeg.fromStopName) : null;
            const stopCount = railLegs.reduce((s, l) => s + l.intermediateStops.length + 2, 0) - (railLegs.length - 1);

            return (
              <button
                key={i}
                onClick={() => { setSelectedRouteIndex(i); setSelectedDepIndex(0); }}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-lg transition-all text-left ${
                  isSelected
                    ? "bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800"
                    : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p className={`text-[15px] font-medium truncate leading-snug tracking-wide ${
                    isSelected ? "text-blue-800 dark:text-blue-200" : "text-slate-700 dark:text-slate-300"
                  }`}>
                    {viaStation ? `via ${viaStation}` : "Direct"}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`text-[12px] tracking-wide shrink-0 min-w-[110px] ${
                      isSelected ? "text-slate-500 dark:text-slate-400" : "text-slate-500 dark:text-slate-400"
                    }`}>
                      {stopCount} stops  ·  {j.distanceKm ?? "?"} km
                    </span>
                    <div className="w-px h-3 bg-slate-200 dark:bg-slate-600 shrink-0" />
                    <div
                      className="flex items-center gap-1 flex-nowrap overflow-x-auto"
                      style={{ scrollbarWidth: "none" }}
                    >
                      {railLegs.map((leg, li) => (
                        <div key={li} className="flex items-center gap-1 shrink-0">
                          {li > 0 && <span className="text-[12px] font-medium text-slate-400 dark:text-slate-500">→</span>}
                          <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                            style={{ backgroundColor: leg.lineColor }}
                          >
                            {leg.lineShortName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <span className={`text-[15px] font-semibold tabular-nums ${
                    isSelected ? "text-blue-800 dark:text-blue-200" : "text-slate-600 dark:text-slate-400"
                  }`}>
                    {formatDuration(j.totalSeconds)}
                  </span>
                  {i === 0 && (
                    <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Fastest</p>
                  )}
                </div>
              </button>
            );
          })}
          </div>
        </div>
      )}

      {/* Summary bar (hidden when no departures) */}
      {journey.departures.length > 0 && <div className="px-4 py-4 sm:p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
        {/* Top row: times + line badges */}
        <div className="flex items-start sm:items-center gap-4">
          <div className="min-w-0 flex-1">
            {selectedDep && (
              <div className="flex items-center gap-2 text-2xl font-bold text-slate-900 dark:text-white font-mono">
                {selectedDep.time}
                <ArrowRight className="w-5 h-5 text-slate-400" />
                {selectedDep.arrivalTime}
              </div>
            )}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-slate-500 dark:text-slate-400 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatDuration(journey.totalSeconds)}</span>
              {journey.distanceKm != null && (
                <>
                  <span>·</span>
                  <span>{journey.distanceKm} km</span>
                </>
              )}
              <span>·</span>
              <span>
                {journey.transfers === 0
                  ? "Direct — no transfers"
                  : `${journey.transfers} transfer${journey.transfers > 1 ? "s" : ""}`}
              </span>
              {journey.fare && (
                <>
                  <span>·</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    RM {journey.fare.cashless}
                  </span>
                </>
              )}
            </div>
          </div>
          {/* Desktop (few legs): line badges inline */}
          {(() => {
            const railLegs = journey.legs.filter((l) => l.type === "rail");
            if (railLegs.length > 3) return null;
            const totalTravel = railLegs.reduce((s, l) => s + l.travelSeconds, 0);
            return (
              <div className="hidden sm:flex items-center gap-2 shrink-0">
                <div className="flex items-center gap-1">
                  {railLegs.map((leg, i) => (
                    <div key={i} className="flex items-center gap-1 shrink-0">
                      {i > 0 && <RefreshCw className="w-3 h-3 text-slate-400 mx-0.5" />}
                      <div
                        className="h-3 rounded-full"
                        style={{
                          backgroundColor: leg.lineColor,
                          width: `${Math.max(28, Math.min(80, leg.travelSeconds / 10))}px`,
                        }}
                      />
                      <span className="text-[10px] font-bold whitespace-nowrap" style={{ color: leg.lineColor }}>
                        {leg.lineShortName}
                      </span>
                    </div>
                  ))}
                </div>
                {mapUrl && (
                  <Link
                    href={mapUrl}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                    title="View on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </Link>
                )}
              </div>
            );
          })()}
        </div>

        {/* Line visualization: full-width row for many legs, or mobile-only for few legs */}
        {(() => {
          const railLegs = journey.legs.filter((l) => l.type === "rail");
          const totalTravel = railLegs.reduce((s, l) => s + l.travelSeconds, 0);
          const isManyLegs = railLegs.length > 3;
          return (
            <>
              {/* Proportional bars: always on desktop for many legs, mobile-only for few legs */}
              <div className={`items-center gap-1 mt-3 ${isManyLegs ? "hidden sm:flex" : "flex sm:hidden"}`}>
                {railLegs.map((leg, i) => (
                  <div key={i} className="flex items-center gap-1" style={{ flex: leg.travelSeconds / totalTravel }}>
                    {i > 0 && <RefreshCw className="w-3 h-3 text-slate-400 shrink-0" />}
                    <div className="h-2.5 sm:h-3 rounded-full flex-1 min-w-3" style={{ backgroundColor: leg.lineColor }} />
                    <span className="text-[10px] font-bold leading-none shrink-0" style={{ color: leg.lineColor }}>
                      {leg.lineShortName}
                    </span>
                  </div>
                ))}
                {mapUrl && (
                  <Link
                    href={mapUrl}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0 ml-0.5"
                    title="View on map"
                  >
                    <MapPin className="w-4 h-4" />
                  </Link>
                )}
              </div>
              {/* Mobile badge chain: scrollable badges for many legs */}
              {isManyLegs && (
                <div
                  className="flex sm:hidden items-center gap-1.5 mt-3 overflow-x-auto pb-1"
                  style={{ scrollbarWidth: "none" }}
                >
                  {railLegs.map((leg, i) => (
                    <div key={i} className="flex items-center gap-1.5 shrink-0">
                      {i > 0 && <span className="text-[11px] text-slate-400">→</span>}
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded text-white whitespace-nowrap"
                        style={{ backgroundColor: leg.lineColor }}
                      >
                        {leg.lineShortName}
                      </span>
                    </div>
                  ))}
                  {mapUrl && (
                    <Link
                      href={mapUrl}
                      className="p-1 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 shrink-0 ml-0.5"
                      title="View on map"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              )}
            </>
          );
        })()}
        {journey.fare && (
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100/80 dark:border-slate-700/60">
            <span>
              <span className="font-medium text-slate-500 dark:text-slate-400">RM {journey.fare.cashless}</span> cashless
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>
              <span className="font-medium text-slate-500 dark:text-slate-400">RM {journey.fare.cash}</span> cash
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span>
              <span className="font-medium text-slate-500 dark:text-slate-400">RM {journey.fare.concession}</span> concession
            </span>
          </div>
        )}
      </div>}

      {/* Legs */}
      {journey.departures.length > 0 && (
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
      )}

      {/* Departures list */}
      {journey.departures.length === 0 && (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
            No departures available right now
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Service may have ended for today. Try a different time.
          </p>
        </div>
      )}
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
