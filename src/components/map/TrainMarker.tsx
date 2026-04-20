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
  const showArrow = bearing != null;

  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div style="position:relative;width:20px;height:20px;">
        <div style="
          width:14px;height:14px;
          border-radius:50%;
          background:${color};
          border:2px solid white;
          box-shadow:0 1px 4px rgba(0,0,0,0.3);
          position:absolute;top:3px;left:3px;
        "></div>
        ${
          showArrow
            ? `<div style="
            position:absolute;top:-4px;left:7px;
            width:0;height:0;
            border-left:3px solid transparent;
            border-right:3px solid transparent;
            border-bottom:6px solid ${color};
            transform:rotate(${rotation}deg);
            transform-origin:3px 14px;
          "></div>`
            : ""
        }
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
