"use client";
import { useParams } from "next/navigation";
import { useLines } from "@/hooks/useLines";
import { StationList } from "@/components/line/StationList";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function LinePage() {
  const { lineId } = useParams<{ lineId: string }>();
  const { lines, isLoading } = useLines();
  const line = lines.find((l) => l.id === lineId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-6 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!line) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        <div className="text-center py-12">
          <p className="text-slate-500">Line not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-in">
      <BackButton />

      <div className="mt-4 mb-6">
        <div className="flex items-center gap-3 mb-1">
          <Badge label={line.shortName} color={line.color} textColor={line.textColor} />
          <span className="text-xs font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            {line.type}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {line.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {line.stationCount} stations
        </p>
      </div>

      <StationList line={line} />
    </div>
  );
}
