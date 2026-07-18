"use client";
import { useState, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import { useBusVehiclePositions } from "@/hooks/useBusVehiclePositions";
import { BusMarker } from "./BusMarker";
import { BUS_OPERATORS, type BusOperator } from "@/lib/bus/types";
import { RefreshCw, Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

const KL_CENTER: [number, number] = [3.14, 101.69];
const DEFAULT_ZOOM = 11;

type MapStyle = "light" | "dark" | "standard";
const TILE_URLS: Record<MapStyle, string> = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  standard: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
};
const STYLE_LABELS: Record<MapStyle, string> = {
  light: "Light",
  dark: "Dark",
  standard: "Standard",
};

const ALL_OPERATORS: BusOperator[] = [
  "rapid-bus-kl",
  "rapid-bus-mrtfeeder",
  "rapid-bus-penang",
  "rapid-bus-kuantan",
];

export function LiveBusMap() {
  const { vehicles, isLoading, refresh } = useBusVehiclePositions();
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [visibleOperators, setVisibleOperators] = useState<Set<BusOperator>>(
    new Set(ALL_OPERATORS)
  );

  const toggleOperator = (op: BusOperator) => {
    setVisibleOperators((prev) => {
      const next = new Set(prev);
      if (next.has(op)) next.delete(op);
      else next.add(op);
      return next;
    });
  };

  const visibleVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.latitude != null &&
          v.longitude != null &&
          visibleOperators.has(v.operator)
      ),
    [vehicles, visibleOperators]
  );

  const tileUrl = TILE_URLS[mapStyle];

  return (
    <div className="relative flex-1">
      <MapContainer
        center={KL_CENTER}
        zoom={DEFAULT_ZOOM}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer url={tileUrl} key={tileUrl} />
        {visibleVehicles.map((v) => (
          <BusMarker key={v.id} vehicle={v} />
        ))}
      </MapContainer>

      {/* Operator filter — top-left */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-1.5">
        {ALL_OPERATORS.map((op) => {
          const meta = BUS_OPERATORS[op];
          const active = visibleOperators.has(op);
          return (
            <button
              key={op}
              onClick={() => toggleOperator(op)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all"
              style={{
                backgroundColor: active ? meta.color : "#f1f5f9",
                color: active ? meta.textColor : "#94a3b8",
                border: `1.5px solid ${active ? meta.color : "#e2e8f0"}`,
              }}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: active ? meta.textColor : meta.color, opacity: active ? 0.8 : 0.4 }}
              />
              {meta.shortName}
            </button>
          );
        })}
      </div>

      {/* Map style picker — bottom-right */}
      <div className="absolute bottom-12 right-4 z-[1000]">
        <div className="relative">
          <button
            onClick={() => setShowStylePicker((p) => !p)}
            className="p-3 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            aria-label="Change map style"
          >
            <Layers className="w-5 h-5" />
          </button>
          {showStylePicker && (
            <div className="absolute bottom-14 right-0 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[140px]">
              {(Object.keys(TILE_URLS) as MapStyle[]).map((style) => (
                <button
                  key={style}
                  onClick={() => {
                    setMapStyle(style);
                    setShowStylePicker(false);
                  }}
                  className={`block w-full text-left px-5 py-3 text-sm transition-colors ${
                    mapStyle === style
                      ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-medium"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  }`}
                >
                  {STYLE_LABELS[style]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar — bottom-left */}
      <div className="absolute bottom-12 left-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md text-sm text-slate-500 dark:text-slate-400">
        {visibleVehicles.length > 0 ? (
          <>
            <div className="relative flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="w-2 h-2 rounded-full bg-green-500 absolute animate-ping" />
            </div>
            <span>{visibleVehicles.length} buses</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span>No live data</span>
          </>
        )}
        <button
          onClick={() => refresh()}
          className="p-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
