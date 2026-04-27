"use client";
import { useState, useMemo, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, Popup, useMap } from "react-leaflet";
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
  const journeyTransfers = searchParams.getAll("transfer"); // "fromStop,toStop"

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

  // Compute offset coordinates for overlapping lines (KTM shared tracks)
  const offsetLineCoords = useMemo(() => {
    const OFFSET = 0.003; // ~300m at Malaysia latitude

    // Build raw coords per line (only non-shape lines can overlap)
    const rawCoords = new Map<string, [number, number][]>();
    for (const line of lines) {
      const coords: [number, number][] = line.shape
        ? line.shape
        : line.stations
            .filter((s) => s.stopLat && s.stopLon)
            .map((s) => [s.stopLat, s.stopLon]);
      rawCoords.set(line.id, coords);
    }

    // Index segments: "roundedLat1,roundedLon1->roundedLat2,roundedLon2" => lineId[]
    const segKey = (a: [number, number], b: [number, number]) => {
      const r = (n: number) => n.toFixed(3);
      const k1 = `${r(a[0])},${r(a[1])}->${r(b[0])},${r(b[1])}`;
      const k2 = `${r(b[0])},${r(b[1])}->${r(a[0])},${r(a[1])}`;
      return k1 < k2 ? k1 : k2; // canonical order
    };

    const segmentLines = new Map<string, string[]>();
    for (const line of lines) {
      if (line.shape) continue; // Prasarana lines with shapes don't overlap
      const coords = rawCoords.get(line.id)!;
      for (let i = 0; i < coords.length - 1; i++) {
        const key = segKey(coords[i], coords[i + 1]);
        const arr = segmentLines.get(key) || [];
        if (!arr.includes(line.id)) arr.push(line.id);
        segmentLines.set(key, arr);
      }
    }

    // Offset function: perpendicular to segment direction
    const offsetPoint = (
      pt: [number, number],
      prev: [number, number] | null,
      next: [number, number] | null,
      amount: number
    ): [number, number] => {
      const ref = next || prev;
      if (!ref) return pt;
      const dlat = ref[0] - pt[0];
      const dlon = ref[1] - pt[1];
      const len = Math.sqrt(dlat * dlat + dlon * dlon);
      if (len === 0) return pt;
      // Perpendicular: rotate 90 degrees
      const perpLat = -dlon / len;
      const perpLon = dlat / len;
      return [pt[0] + perpLat * amount, pt[1] + perpLon * amount];
    };

    // Build offset coords per line
    const result = new Map<string, [number, number][]>();
    for (const line of lines) {
      const coords = rawCoords.get(line.id)!;
      if (line.shape) {
        result.set(line.id, coords); // No offset for shaped lines
        continue;
      }

      const offsetCoords: [number, number][] = [];
      for (let i = 0; i < coords.length; i++) {
        // Check if segments around this point are shared
        let maxOverlap = 1;
        let myIndex = 0;

        // Check segment before (i-1 -> i)
        if (i > 0) {
          const key = segKey(coords[i - 1], coords[i]);
          const shared = segmentLines.get(key) || [line.id];
          if (shared.length > maxOverlap) {
            maxOverlap = shared.length;
            myIndex = shared.indexOf(line.id);
          }
        }
        // Check segment after (i -> i+1)
        if (i < coords.length - 1) {
          const key = segKey(coords[i], coords[i + 1]);
          const shared = segmentLines.get(key) || [line.id];
          if (shared.length > maxOverlap) {
            maxOverlap = shared.length;
            myIndex = shared.indexOf(line.id);
          }
        }

        if (maxOverlap <= 1) {
          offsetCoords.push(coords[i]);
        } else {
          // Center the group: offset = (index - (count-1)/2) * OFFSET
          const centerOffset = (myIndex - (maxOverlap - 1) / 2) * OFFSET;
          offsetCoords.push(
            offsetPoint(
              coords[i],
              i > 0 ? coords[i - 1] : null,
              i < coords.length - 1 ? coords[i + 1] : null,
              centerOffset
            )
          );
        }
      }
      result.set(line.id, offsetCoords);
    }

    return result;
  }, [lines]);

  // Build shape lookup per line shortName
  const lineShapeMap = useMemo(() => {
    const map = new Map<string, [number, number][]>();
    for (const line of lines) {
      if (line.shape) map.set(line.shortName, line.shape);
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

      // Try to use shape data for smoother polyline
      const shape = lineShapeMap.get(leg.lineShortName);
      let coords: [number, number][];
      if (shape && segment.length >= 2) {
        const firstStation = segment[0];
        const lastStation = segment[segment.length - 1];
        // Find closest shape points to the first and last station
        const findClosest = (lat: number, lon: number) => {
          let bestIdx = 0;
          let bestDist = Infinity;
          for (let i = 0; i < shape.length; i++) {
            const d = (shape[i][0] - lat) ** 2 + (shape[i][1] - lon) ** 2;
            if (d < bestDist) { bestDist = d; bestIdx = i; }
          }
          return bestIdx;
        };
        const si = findClosest(firstStation.lat, firstStation.lon);
        const ei = findClosest(lastStation.lat, lastStation.lon);
        const sliceStart = Math.min(si, ei);
        const sliceEnd = Math.max(si, ei);
        coords = shape.slice(sliceStart, sliceEnd + 1);
      } else {
        coords = segment.map((s) => [s.lat, s.lon] as [number, number]);
      }

      return { coords, stations: segment, color: leg.color };
    });
  }, [isJourneyMode, parsedLegs, lineStationOrder, lineShapeMap]);

  // Parse transfer walks into coordinate pairs
  const transferSegments = useMemo(() => {
    if (!isJourneyMode) return [];
    return journeyTransfers.map((t) => {
      const [fromStop, toStop] = t.split(",");
      const fromStation = stationLookup.get(fromStop);
      const toStation = stationLookup.get(toStop);
      if (fromStation && toStation) {
        return {
          coords: [[fromStation.lat, fromStation.lon], [toStation.lat, toStation.lon]] as [number, number][],
          fromName: fromStation.name,
          toName: toStation.name,
        };
      }
      return null;
    }).filter(Boolean) as { coords: [number, number][]; fromName: string; toName: string }[];
  }, [isJourneyMode, journeyTransfers, stationLookup]);

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
            {journeySegments.map((seg, i) => {
              const leg = parsedLegs[i];
              const lineMeta = leg ? LINES.find((l) => l.shortName === leg.lineShortName) : undefined;
              return (
                <Polyline
                  key={`journey-line-${i}`}
                  positions={seg.coords}
                  pathOptions={{ color: seg.color, weight: 5, opacity: 0.9 }}
                >
                  {lineMeta && (
                    <Popup>
                      <div className="text-center">
                        <p className="font-semibold text-sm" style={{ color: seg.color }}>
                          {lineMeta.shortName} — {lineMeta.name}
                        </p>
                        <p className="text-xs text-slate-500">{seg.stations.length} stops on this segment</p>
                        <a
                          href={`/line/${lineMeta.id}`}
                          className="text-xs text-blue-600 underline mt-1 inline-block"
                        >
                          View line details
                        </a>
                      </div>
                    </Popup>
                  )}
                </Polyline>
              );
            })}

            {/* Walking transfer dashed lines */}
            {transferSegments.map((seg, i) => (
              <Polyline
                key={`transfer-${i}`}
                positions={seg.coords}
                pathOptions={{
                  color: "#94a3b8",
                  weight: 3,
                  opacity: 0.7,
                  dashArray: "6, 8",
                }}
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
                  showLabel
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
            {lines.map((line, lineIndex) => {
              const realtimeId = lineIdToRealtimeId.get(line.id);
              if (realtimeId && !visibleLines.has(realtimeId)) return null;

              const coords = offsetLineCoords.get(line.id) || (line.shape
                ? line.shape
                : line.stations
                    .filter((s) => s.stopLat && s.stopLon)
                    .map((s) => [s.stopLat, s.stopLon] as [number, number]));

              return (
                <Polyline
                  key={`line-${line.id}`}
                  positions={coords}
                  pathOptions={{ color: line.color, weight: 3, opacity: 1 }}
                >
                  <Popup>
                    <div className="text-center">
                      <p className="font-semibold text-sm" style={{ color: line.color }}>
                        {line.shortName} — {line.name}
                      </p>
                      <p className="text-xs text-slate-500">{line.stationCount} stations</p>
                      <a
                        href={`/line/${line.id}`}
                        className="text-xs text-blue-600 underline mt-1 inline-block"
                      >
                        View line details
                      </a>
                    </div>
                  </Popup>
                </Polyline>
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

      {/* KTM disclaimer */}
      <div className="absolute top-3 left-3 z-[1000] max-w-[220px] px-3 py-2 rounded-lg bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm shadow-sm text-[11px] text-slate-400 dark:text-slate-500 leading-snug">
        KTM lines shown as straight lines between stations (actual track geometry not available)
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
