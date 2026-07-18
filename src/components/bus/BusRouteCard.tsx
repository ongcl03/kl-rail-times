"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { BusRouteInfo } from "@/lib/bus/types";

export function BusRouteCard({
  route,
  operator,
}: {
  route: BusRouteInfo;
  operator: string;
}) {
  return (
    <Link href={`/bus/${operator}/route/${encodeURIComponent(route.routeId)}`}>
      <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden">
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: route.color }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge label={route.shortName} color={route.color} textColor={route.textColor} />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {route.longName || route.shortName}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {route.stopCount} stops
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
