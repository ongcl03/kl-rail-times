"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useBusRoute } from "@/hooks/useBusRoute";
import { BackButton } from "@/components/layout/BackButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";
import Link from "next/link";
import { MapPin, ArrowRightLeft } from "lucide-react";

export default function BusRoutePage() {
  const { operator, routeId } = useParams<{ operator: string; routeId: string }>();
  const [activeDir, setActiveDir] = useState<0 | 1>(0);

  const meta = BUS_OPERATORS[operator as BusOperator];
  const { route, isLoading } = useBusRoute(
    operator as BusOperator,
    decodeURIComponent(routeId)
  );

  const stops = activeDir === 0 ? route?.stopsDir0 : route?.stopsDir1;
  const headsign = activeDir === 0 ? route?.dir0Headsign : route?.dir1Headsign;

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Skeleton className="h-10 w-24 mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-32 mb-8" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        <p className="text-center text-slate-500 mt-12">Route not found</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Route header */}
      <div
        className="relative overflow-hidden"
        style={{ backgroundColor: route.color }}
      >
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <BackButton variant="light" />
          <div className="mt-4 flex items-end gap-4">
            <div className="flex-1 min-w-0">
              {meta && (
                <span
                  className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: route.textColor }}
                >
                  {meta.shortName}
                </span>
              )}
              <h1 className="text-2xl font-bold" style={{ color: route.textColor }}>
                {route.shortName}
              </h1>
              {route.longName && (
                <p
                  className="text-sm mt-1 opacity-80 line-clamp-2"
                  style={{ color: route.textColor }}
                >
                  {route.longName}
                </p>
              )}
            </div>
            <span
              className="text-5xl font-black opacity-20 flex-shrink-0"
              style={{ color: route.textColor }}
            >
              Bus
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Direction toggle */}
        {(route.dir0Headsign || route.dir1Headsign) && (
          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-5">
            <button
              onClick={() => setActiveDir(0)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 0
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              To {route.dir0Headsign || "Direction 1"}
            </button>
            <button
              onClick={() => setActiveDir(1)}
              className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-all truncate ${
                activeDir === 1
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              To {route.dir1Headsign || "Direction 2"}
            </button>
          </div>
        )}

        {/* Headsign + stop count */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {headsign ? `To ${headsign}` : `Direction ${activeDir + 1}`}
            </span>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {stops?.length || 0} stops
          </span>
        </div>

        {/* Stop list */}
        {stops && stops.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[23px] top-5 bottom-5 w-0.5"
              style={{ backgroundColor: route.color, opacity: 0.3 }}
            />
            <div className="space-y-0">
              {stops.map((stop, i) => (
                <Link
                  key={`${stop.stopId}-${i}`}
                  href={`/bus/${operator}/stop/${stop.stopId}`}
                >
                  <div className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    {/* Stop dot */}
                    <div
                      className="flex-shrink-0 w-5 h-5 rounded-full border-2 bg-white dark:bg-slate-900 z-10"
                      style={{ borderColor: route.color }}
                    />
                    {/* Stop name */}
                    <div className="flex-1 min-w-0 flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white truncate">
                        {stop.stopName}
                      </span>
                      <MapPin className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-400 flex-shrink-0 ml-2 transition-colors" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-slate-500 dark:text-slate-400 text-center py-8">
            No stop data available for this direction
          </p>
        )}
      </div>
    </div>
  );
}
