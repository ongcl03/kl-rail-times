"use client";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";

export function OperatorCard({ operatorId }: { operatorId: BusOperator }) {
  const meta = BUS_OPERATORS[operatorId];

  return (
    <Link href={`/bus/${operatorId}`}>
      <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden">
        {/* Colored left strip */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl"
          style={{ backgroundColor: meta.color }}
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge label={meta.shortName} color={meta.color} textColor={meta.textColor} />
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {meta.name}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {meta.area}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
