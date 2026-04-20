"use client";
import type { JourneyLeg } from "@/lib/journey/types";
import { Badge } from "../ui/Badge";
import { Footprints, ChevronDown } from "lucide-react";
import { useState } from "react";

function formatDuration(seconds: number): string {
  const m = Math.round(seconds / 60);
  return `${m} min`;
}

export function LegCard({
  leg,
  isFirst,
  isLast,
  departTime,
  arriveTime,
}: {
  leg: JourneyLeg;
  isFirst: boolean;
  isLast: boolean;
  departTime?: string;
  arriveTime?: string;
}) {
  const [expanded, setExpanded] = useState(false);

  if (leg.type === "transfer") {
    return (
      <div className="flex items-center justify-between py-3 px-4">
        <div className="flex items-center gap-3">
          <div className="w-8 flex justify-center">
            <Footprints className="w-4 h-4 text-slate-400" />
          </div>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Walk {formatDuration(leg.travelSeconds)} to change line
          </span>
        </div>
        {departTime && arriveTime && (
          <span className="text-xs font-mono text-slate-400 dark:text-slate-500">
            {departTime} → {arriveTime}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Colored line on left */}
      <div
        className="absolute left-[19px] top-0 bottom-0 w-1 rounded-full"
        style={{ backgroundColor: leg.lineColor }}
      />

      <div className="pl-12 py-3 pr-4">
        {/* Line badge + duration + direction */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Badge label={leg.lineShortName} color={leg.lineColor} textColor="#fff" />
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {leg.lineName} · {formatDuration(leg.travelSeconds)}
          </span>
          {leg.direction && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              · Toward {leg.direction}
            </span>
          )}
        </div>

        {/* From station */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div
              className="absolute left-[15px] w-[13px] h-[13px] rounded-full border-2 bg-white dark:bg-slate-900"
              style={{ borderColor: leg.lineColor, backgroundColor: isFirst ? leg.lineColor : undefined }}
            />
            <span className={`text-sm ${isFirst ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
              {leg.fromStopName}
            </span>
          </div>
          {departTime && (
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
              {departTime}
            </span>
          )}
        </div>

        {/* Intermediate stops (collapsible) */}
        {leg.intermediateStops.length > 0 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 my-1.5 ml-0.5"
          >
            <ChevronDown className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} />
            {leg.intermediateStops.length} stop{leg.intermediateStops.length > 1 ? "s" : ""}
          </button>
        )}
        {expanded && (
          <div className="space-y-1 my-1.5 ml-0.5">
            {leg.intermediateStops.map((name, i) => (
              <p key={i} className="text-xs text-slate-400 dark:text-slate-500">{name}</p>
            ))}
          </div>
        )}

        {/* To station */}
        <div className="flex items-center justify-between mt-1">
          <div className="flex items-center gap-2">
            <div
              className="absolute left-[15px] w-[13px] h-[13px] rounded-full border-2 bg-white dark:bg-slate-900"
              style={{ borderColor: leg.lineColor, backgroundColor: isLast ? leg.lineColor : undefined }}
            />
            <span className={`text-sm ${isLast ? "font-semibold text-slate-900 dark:text-white" : "text-slate-700 dark:text-slate-300"}`}>
              {leg.toStopName}
            </span>
          </div>
          {arriveTime && (
            <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
              {arriveTime}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
