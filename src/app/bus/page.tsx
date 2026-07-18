"use client";
import Link from "next/link";
import { Bus, Map } from "lucide-react";
import { OperatorCard } from "@/components/bus/OperatorCard";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";

const OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export default function BusHomePage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-orange-50 dark:bg-orange-950 mb-4">
          <Bus className="w-7 h-7 text-orange-600 dark:text-orange-400" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Bus Times
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Prasarana bus schedules for Klang Valley, Penang & Kuantan
        </p>
      </div>

      {/* Live map shortcut */}
      <Link href="/bus/map">
        <div className="group relative p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-lg hover:border-slate-200 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden mb-8">
          <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl bg-blue-500" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-500 text-white">
                Live
              </span>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Live Bus Map</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Track buses in real time</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex items-center">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <div className="w-2 h-2 rounded-full bg-green-500 absolute animate-ping" />
              </div>
              <Map className="w-5 h-5 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
          </div>
        </div>
      </Link>

      {/* Operator cards */}
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
        Select Operator
      </h2>
      <div className="space-y-3">
        {OPERATORS.map((op) => (
          <OperatorCard key={op} operatorId={op} />
        ))}
      </div>

      {/* Data note */}
      <p className="text-xs text-slate-400 dark:text-slate-500 text-center mt-8">
        Data from{" "}
        <a
          href="https://developer.data.gov.my"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          data.gov.my
        </a>
        {" "}· Refreshed daily
      </p>
    </div>
  );
}
