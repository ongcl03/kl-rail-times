"use client";
import { useParams, useSearchParams } from "next/navigation";
import { useLines } from "@/hooks/useLines";
import { LINES } from "@/lib/lines";
import { ArrivalBoard } from "@/components/station/ArrivalBoard";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { FavoriteStationButton } from "@/components/station/FavoriteStationButton";
import Link from "next/link";
import { Navigation } from "lucide-react";

export default function StationPage() {
  const { stopId } = useParams<{ stopId: string }>();
  const searchParams = useSearchParams();
  const lineParam = searchParams.get("line"); // e.g., "ktm-shuttle"
  const { lines, isLoading } = useLines();

  let stationName = stopId;
  const stationLines: { id: string; name: string; shortName: string; color: string; textColor: string; gtfsRouteId: string }[] = [];

  for (const line of lines) {
    for (const station of line.stations) {
      if (station.stopId === stopId) {
        stationName = station.stopName;
        const meta = LINES.find((l) => l.id === line.id);
        stationLines.push({
          id: line.id,
          name: line.name,
          shortName: line.shortName,
          color: line.color,
          textColor: line.textColor,
          gtfsRouteId: meta?.gtfsRouteId || "",
        });
        break;
      }
    }
  }

  // When ?line= is set, filter to only that line
  const filteredLines = lineParam
    ? stationLines.filter((l) => l.id === lineParam)
    : stationLines;

  const displayLines = filteredLines.length > 0 ? filteredLines : stationLines;
  const primaryColor = displayLines[0]?.color || "#6B7280";

  // Pass the gtfsRouteId to filter arrivals when a specific line is selected
  const routeId = lineParam && displayLines.length === 1 ? displayLines[0].gtfsRouteId : undefined;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Station header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-5">
          <BackButton />
          <div className="mt-3 flex items-center gap-4">
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            />
            <div className="flex-1 flex items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {displayLines.map((l) => (
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
              </div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/journey?from=${stopId}`}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all"
                  title="Plan journey from here"
                >
                  <Navigation className="w-5 h-5" />
                </Link>
                <FavoriteStationButton stopId={stopId} stopName={stationName} lineColor={primaryColor} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrival board */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ArrivalBoard stopId={stopId} stopName={stationName} routeId={routeId} lineId={lineParam || undefined} />
      </div>
    </div>
  );
}
