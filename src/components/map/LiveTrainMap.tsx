"use client";
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, useMap } from "react-leaflet";
import { useSearchParams } from "next/navigation";
import L from "leaflet";
import { useVehiclePositions } from "@/hooks/useVehiclePositions";
import { useLines } from "@/hooks/useLines";
import { LINES, matchLineByRealtimeRouteId } from "@/lib/lines";
import { TrainMarker } from "./TrainMarker";
import { StationMarker } from "./StationMarker";
import { JourneyMarker } from "./JourneyMarker";
import { LineFilter } from "./LineFilter";
import { RefreshCw, Layers } from "lucide-react";
import "leaflet/dist/leaflet.css";

const KL_CENTER: [number, number] = [3.14, 101.69];
const DEFAULT_ZOOM = 12;

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

function MapFitBounds({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length >= 2) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [60, 60] });
    }
  }, [map, bounds[0]?.[0], bounds[0]?.[1], bounds[1]?.[0], bounds[1]?.[1]]);
  return null;
}

export function LiveTrainMap() {
  const { vehicles, isLoading: vehiclesLoading, refresh } = useVehiclePositions();
  const { lines } = useLines();
  const [mapStyle, setMapStyle] = useState<MapStyle>("light");
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [visibleLines, setVisibleLines] = useState<Set<string>>(
    () => new Set(LINES.map((l) => l.realtimeRouteId))
  );

  const handleToggle = (routeId: string) => {
    setVisibleLines((prev) => {
      const next = new Set(prev);
      if (next.has(routeId)) next.delete(routeId);
      else next.add(routeId);
      return next;
    });
  };

  // Build stop name lookup from lines data
  const stopNameMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of lines) {
      for (const s of line.stations) {
        map.set(s.stopId, s.stopName);
      }
    }
    return map;
  }, [lines]);

  // Filter vehicles with valid coords and visible lines
  const visibleVehicles = useMemo(
    () =>
      vehicles.filter(
        (v) =>
          v.latitude != null &&
          v.longitude != null &&
          v.routeId != null &&
          visibleLines.has(v.routeId)
      ),
    [vehicles, visibleLines]
  );

  // Map line IDs to realtimeRouteIds for filtering
  const lineIdToRealtimeId = useMemo(() => {
    const map = new Map<string, string>();
    for (const line of LINES) {
      map.set(line.id, line.realtimeRouteId);
    }
    return map;
  }, []);

  // Journey params
  const searchParams = useSearchParams();
  const journeyFrom = searchParams.get("from");
  const journeyTo = searchParams.get("to");
  const journeyLegs = searchParams.getAll("leg"); // "fromStop,toStop,lineShortName"

  const isJourneyMode = journeyFrom && journeyTo && journeyLegs.length > 0;

  // Parse journey legs into structured data
  const parsedLegs = useMemo(() => {
    return journeyLegs.map((leg) => {
      const [fromStop, toStop, lineShortName] = leg.split(",");
      const lineMeta = LINES.find((l) => l.shortName === lineShortName);
      return { fromStop, toStop, lineShortName, color: lineMeta?.color || "#6B7280" };
    });
  }, [journeyLegs.join("|")]);

  // Build coordinate + color lookup for all stations
  const stationLookup = useMemo(() => {
    const map = new Map<string, { lat: number; lon: number; color: string; name: string }>();
    for (const line of lines) {
      for (const s of line.stations) {
        if (s.stopLat && s.stopLon && !map.has(s.stopId)) {
          map.set(s.stopId, { lat: s.stopLat, lon: s.stopLon, color: line.color, name: s.stopName });
        }
      }
    }
    return map;
  }, [lines]);

  // Build ordered station lists per line for segment extraction
  const lineStationOrder = useMemo(() => {
    const map = new Map<string, { stopId: string; lat: number; lon: number }[]>();
    for (const line of lines) {
      const stops = line.stations
        .filter((s) => s.stopLat && s.stopLon)
        .map((s) => ({ stopId: s.stopId, lat: s.stopLat, lon: s.stopLon }));
      map.set(line.shortName, stops);
    }
    return map;
  }, [lines]);

  // For journey mode: extract route segments (polylines + station dots)
  const journeySegments = useMemo(() => {
    if (!isJourneyMode) return [];
    return parsedLegs.map((leg) => {
      const stops = lineStationOrder.get(leg.lineShortName) || [];
      const fromIdx = stops.findIndex((s) => s.stopId === leg.fromStop);
      const toIdx = stops.findIndex((s) => s.stopId === leg.toStop);
      if (fromIdx === -1 || toIdx === -1) return { coords: [], stations: [], color: leg.color };
      const start = Math.min(fromIdx, toIdx);
      const end = Math.max(fromIdx, toIdx);
      const segment = stops.slice(start, end + 1);
      return {
        coords: segment.map((s) => [s.lat, s.lon] as [number, number]),
        stations: segment,
        color: leg.color,
      };
    });
  }, [isJourneyMode, parsedLegs, lineStationOrder]);

  // All bounds for journey fitBounds
  const journeyBounds = useMemo(() => {
    if (!isJourneyMode) return [];
    const allCoords: [number, number][] = [];
    for (const seg of journeySegments) {
      allCoords.push(...seg.coords);
    }
    return allCoords;
  }, [isJourneyMode, journeySegments]);

  const journeyFromStation = journeyFrom ? stationLookup.get(journeyFrom) : undefined;
  const journeyToStation = journeyTo ? stationLookup.get(journeyTo) : undefined;

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

        {isJourneyMode ? (
          <>
            {/* Journey route segments */}
            {journeySegments.map((seg, i) => (
              <Polyline
                key={`journey-line-${i}`}
                positions={seg.coords}
                pathOptions={{ color: seg.color, weight: 5, opacity: 0.9 }}
              />
            ))}

            {/* Journey station dots */}
            {journeySegments.map((seg, i) =>
              seg.stations.map((s) => (
                <StationMarker
                  key={`j-${i}-${s.stopId}`}
                  position={[s.lat, s.lon]}
                  name={stopNameMap.get(s.stopId) || s.stopId}
                  stopId={s.stopId}
                  color={seg.color}
                />
              ))
            )}

            {/* Start / End markers */}
            {journeyFromStation && journeyFrom && (
              <JourneyMarker
                position={[journeyFromStation.lat, journeyFromStation.lon]}
                label="A"
                name={journeyFromStation.name}
                stopId={journeyFrom}
                color={journeyFromStation.color}
                type="start"
              />
            )}
            {journeyToStation && journeyTo && (
              <JourneyMarker
                position={[journeyToStation.lat, journeyToStation.lon]}
                label="B"
                name={journeyToStation.name}
                stopId={journeyTo}
                color={journeyToStation.color}
                type="end"
              />
            )}

            {/* Fit bounds to journey */}
            {journeyBounds.length >= 2 && <MapFitBounds bounds={journeyBounds} />}
          </>
        ) : (
          <>
            {/* Rail lines */}
            {lines.map((line) => {
              const realtimeId = lineIdToRealtimeId.get(line.id);
              if (realtimeId && !visibleLines.has(realtimeId)) return null;

              const coords = line.stations
                .filter((s) => s.stopLat && s.stopLon)
                .map((s) => [s.stopLat, s.stopLon] as [number, number]);

              return (
                <Polyline
                  key={`line-${line.id}`}
                  positions={coords}
                  pathOptions={{ color: line.color, weight: 3, opacity: 0.7 }}
                />
              );
            })}

            {/* Station markers */}
            {lines.map((line) => {
              const realtimeId = lineIdToRealtimeId.get(line.id);
              if (realtimeId && !visibleLines.has(realtimeId)) return null;

              return line.stations.map((station) =>
                station.stopLat && station.stopLon ? (
                  <StationMarker
                    key={station.stopId}
                    position={[station.stopLat, station.stopLon]}
                    name={station.stopName}
                    stopId={station.stopId}
                    color={line.color}
                  />
                ) : null
              );
            })}

            {/* Train markers */}
            {visibleVehicles.map((v) => (
              <TrainMarker
                key={v.id}
                vehicle={v}
                stopName={v.stopId ? stopNameMap.get(v.stopId) : undefined}
              />
            ))}
          </>
        )}
      </MapContainer>

      {/* Line filter (hidden in journey mode) */}
      {!isJourneyMode && <LineFilter visibleLines={visibleLines} onToggle={handleToggle} />}

      {/* Map style picker */}
      <div className="absolute bottom-12 right-4 z-[1000]">
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

      {/* Status bar */}
      <div className="absolute bottom-12 left-4 z-[1000] flex items-center gap-2 px-5 py-3 rounded-xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-md text-sm text-slate-500 dark:text-slate-400">
        {visibleVehicles.length > 0 ? (
          <>
            <div className="relative flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <div className="w-2 h-2 rounded-full bg-green-500 absolute animate-ping" />
            </div>
            <span>{visibleVehicles.length} trains</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-slate-400" />
            <span>Live train positions unavailable</span>
          </>
        )}
        <button onClick={() => refresh()} className="p-1 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
          <RefreshCw className={`w-3 h-3 ${vehiclesLoading ? "animate-spin" : ""}`} />
        </button>
      </div>
    </div>
  );
}
