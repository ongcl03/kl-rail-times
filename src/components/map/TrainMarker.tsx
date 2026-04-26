import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { matchLineByRealtimeRouteId } from "@/lib/lines";
import type { VehiclePosition } from "@/hooks/useVehiclePositions";

const STATUS_LABELS: Record<number, string> = {
  0: "Incoming",
  1: "Stopped",
  2: "In Transit",
};

function createTrainIcon(color: string, bearing: number | null): L.DivIcon {
  const rotation = bearing ?? 0;

  return L.divIcon({
    className: "",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `
      <div style="
        width:36px;height:36px;
        transform:rotate(${rotation}deg);
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.35));
      ">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L8 5V15C8 16.1 8.9 17 10 17H14C15.1 17 16 16.1 16 15V5L12 2Z" fill="${color}" stroke="white" stroke-width="1.2"/>
          <rect x="10" y="7" width="4" height="3" rx="0.5" fill="white" opacity="0.9"/>
          <circle cx="10.5" cy="14" r="1" fill="white" opacity="0.9"/>
          <circle cx="13.5" cy="14" r="1" fill="white" opacity="0.9"/>
          <path d="M12 17L12 20" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
          <path d="M9 20H15" stroke="${color}" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </div>
    `,
  });
}

export function TrainMarker({
  vehicle,
  stopName,
}: {
  vehicle: VehiclePosition;
  stopName?: string;
}) {
  const line = vehicle.routeId
    ? matchLineByRealtimeRouteId(vehicle.routeId)
    : undefined;
  const color = line?.color || "#6B7280";
  const icon = createTrainIcon(color, vehicle.bearing);

  return (
    <Marker
      position={[vehicle.latitude!, vehicle.longitude!]}
      icon={icon}
    >
      <Popup>
        <div className="text-sm space-y-1">
          <p className="font-semibold" style={{ color }}>
            {line ? `${line.shortName} — ${line.name}` : vehicle.routeId || "Unknown"}
          </p>
          <p className="text-slate-600">
            {STATUS_LABELS[vehicle.currentStatus] || "Unknown"}
            {stopName && ` · ${stopName}`}
          </p>
          {vehicle.speed != null && vehicle.speed > 0 && (
            <p className="text-slate-500 text-xs">
              {Math.round(vehicle.speed * 3.6)} km/h
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
