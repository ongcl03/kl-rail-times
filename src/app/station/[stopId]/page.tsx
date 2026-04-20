"use client";
import { useParams } from "next/navigation";
import { useLines } from "@/hooks/useLines";
import { ArrivalBoard } from "@/components/station/ArrivalBoard";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function StationPage() {
  const { stopId } = useParams<{ stopId: string }>();
  const { lines, isLoading } = useLines();

  // Find station info from lines data
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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-6 w-24 mb-4" />
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
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <BackButton />

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {stationLines.map((l) => (
            <Badge
              key={l.shortName}
              label={l.shortName}
              color={l.color}
              textColor={l.textColor}
            />
          ))}
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {stationName}
        </h1>
      </div>

      <ArrivalBoard stopId={stopId} stopName={stationName} />
    </div>
  );
}
