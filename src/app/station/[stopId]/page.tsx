"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useLines } from "@/hooks/useLines";
import { ArrivalBoard } from "@/components/station/ArrivalBoard";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CalendarDays } from "lucide-react";

export default function StationPage() {
  const { stopId } = useParams<{ stopId: string }>();
  const { lines, isLoading } = useLines();

  let stationName = stopId;
  const stationLines: { name: string; shortName: string; color: string; textColor: string }[] = [];

  for (const line of lines) {
    for (const station of line.stations) {
      if (station.stopId === stopId) {
        stationName = station.stopName;
        stationLines.push({
          name: line.name,
          shortName: line.shortName,
          color: line.color,
          textColor: line.textColor,
        });
        break;
      }
    }
  }

  const primaryColor = stationLines[0]?.color || "#6B7280";

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
            </div>
          </div>
        </div>
      </div>

      {/* Arrival board */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <ArrivalBoard stopId={stopId} stopName={stationName} />

        {/* Link to full timetable */}
        <Link
          href={`/station/${stopId}/timetable`}
          className="mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <CalendarDays className="w-4 h-4" />
          View Full Day Timetable
        </Link>
      </div>
    </div>
  );
}
