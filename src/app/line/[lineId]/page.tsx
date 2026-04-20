"use client";
import { useParams } from "next/navigation";
import { useLines } from "@/hooks/useLines";
import { StationList } from "@/components/line/StationList";
import { BackButton } from "@/components/layout/BackButton";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { MapPin } from "lucide-react";

export default function LinePage() {
  const { lineId } = useParams<{ lineId: string }>();
  const { lines, isLoading } = useLines();
  const line = lines.find((l) => l.id === lineId);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-24 mb-4" />
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
    <div className="animate-fade-in">
      {/* Colored header banner */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: line.color }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <BackButton variant="light" />
          <div className="mt-4 flex items-end gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: "rgba(255,255,255,0.2)",
                    color: line.textColor,
                  }}
                >
                  {line.type}
                </span>
              </div>
              <h1
                className="text-2xl font-bold"
                style={{ color: line.textColor }}
              >
                {line.name}
              </h1>
              <div className="flex items-center gap-1.5 mt-1" style={{ color: line.textColor, opacity: 0.8 }}>
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-sm">{line.stationCount} stations</span>
              </div>
            </div>
            <span
              className="text-5xl font-black opacity-20"
              style={{ color: line.textColor }}
            >
              {line.shortName}
            </span>
          </div>
        </div>
      </div>

      {/* Station list */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <StationList line={line} />
      </div>
    </div>
  );
}
