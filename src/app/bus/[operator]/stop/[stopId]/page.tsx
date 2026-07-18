"use client";
import { useParams } from "next/navigation";
import { BackButton } from "@/components/layout/BackButton";
import { BusArrivalBoard } from "@/components/bus/BusArrivalBoard";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";
import { Bus } from "lucide-react";

const VALID_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export default function BusStopPage() {
  const { operator, stopId } = useParams<{ operator: string; stopId: string }>();

  const isValid = VALID_OPERATORS.includes(operator as BusOperator);
  const meta = isValid ? BUS_OPERATORS[operator as BusOperator] : null;

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
      {/* Stop header */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-2xl mx-auto px-4 pt-4 pb-5">
          <BackButton />
          <div className="mt-3 flex items-center gap-4">
            <div
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: meta.color }}
            />
            <div className="flex-1">
              {/* Operator badge */}
              <span
                className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-md mb-1"
                style={{ backgroundColor: meta.color, color: meta.textColor }}
              >
                <Bus className="w-3 h-3" />
                {meta.shortName}
              </span>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Stop {stopId}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {meta.area}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Arrivals board */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <BusArrivalBoard
          stopId={stopId}
          operator={operator as BusOperator}
        />
      </div>
    </div>
  );
}
