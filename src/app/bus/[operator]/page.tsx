"use client";
import { useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useBusRoutes } from "@/hooks/useBusRoutes";
import { BusRouteCard } from "@/components/bus/BusRouteCard";
import { BackButton } from "@/components/layout/BackButton";
import { Skeleton } from "@/components/ui/Skeleton";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";
import { Search, Bus } from "lucide-react";

const VALID_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export default function OperatorPage() {
  const { operator } = useParams<{ operator: string }>();
  const [query, setQuery] = useState("");

  const isValid = VALID_OPERATORS.includes(operator as BusOperator);
  const meta = isValid ? BUS_OPERATORS[operator as BusOperator] : null;

  const { routes, isLoading } = useBusRoutes(
    isValid ? (operator as BusOperator) : "rapid-bus-kl"
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return routes;
    const q = query.toLowerCase();
    return routes.filter(
      (r) =>
        r.shortName.toLowerCase().includes(q) ||
        r.longName.toLowerCase().includes(q)
    );
  }, [routes, query]);

  if (!isValid || !meta) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BackButton />
        <p className="text-center text-slate-500 mt-12">Unknown operator</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Coloured header */}
      <div className="relative overflow-hidden" style={{ backgroundColor: meta.color }}>
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,white_0%,transparent_60%)] pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-6">
          <BackButton variant="light" />
          <div className="mt-4 flex items-end gap-4">
            <div className="flex-1">
              <span
                className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded mb-2 inline-block"
                style={{ backgroundColor: "rgba(255,255,255,0.2)", color: meta.textColor }}
              >
                {meta.area}
              </span>
              <h1 className="text-2xl font-bold" style={{ color: meta.textColor }}>
                {meta.name}
              </h1>
              {!isLoading && (
                <p
                  className="text-sm mt-1 opacity-80"
                  style={{ color: meta.textColor }}
                >
                  {routes.length} routes
                </p>
              )}
            </div>
            <Bus
              className="w-12 h-12 opacity-20 flex-shrink-0"
              style={{ color: meta.textColor }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search route number or name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Route list */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          <div className="space-y-2">
            {filtered.map((route) => (
              <BusRouteCard key={route.routeId} route={route} operator={operator} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">No routes found</p>
          </div>
        )}
      </div>
    </div>
  );
}
