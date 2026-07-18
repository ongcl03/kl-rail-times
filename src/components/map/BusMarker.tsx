"use client";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { BusVehicle } from "@/hooks/useBusVehiclePositions";
import { BUS_OPERATORS } from "@/lib/bus/types";

function createBusIcon(color: string, bearing: number | null) {
  const rotation = bearing ?? 0;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <g transform="rotate(${rotation} 16 16)">
        <!-- Bus body -->
        <rect x="8" y="6" width="16" height="18" rx="3" fill="${color}" stroke="white" stroke-width="1.5"/>
        <!-- Windshield -->
        <rect x="10" y="8" width="12" height="5" rx="1.5" fill="rgba(255,255,255,0.85)"/>
        <!-- Windows -->
        <rect x="10" y="15" width="5" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
        <rect x="17" y="15" width="5" height="4" rx="1" fill="rgba(255,255,255,0.6)"/>
        <!-- Direction arrow -->
        <polygon points="16,2 20,7 12,7" fill="${color}" stroke="white" stroke-width="1" stroke-linejoin="round"/>
      </g>
    </svg>`;

  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  });
}

export function BusMarker({ vehicle }: { vehicle: BusVehicle }) {
  if (!vehicle.latitude || !vehicle.longitude) return null;

  const operatorMeta = BUS_OPERATORS[vehicle.operator];
  const color = operatorMeta?.color || "#6B7280";
  const icon = createBusIcon(color, vehicle.bearing);

  return (
    <Marker
      position={[vehicle.latitude, vehicle.longitude]}
      icon={icon}
    >
      <Popup>
        <div className="text-center min-w-[140px]">
          {vehicle.routeId && (
            <p
              className="inline-block text-xs font-bold px-2 py-0.5 rounded mb-1"
              style={{ backgroundColor: color, color: operatorMeta?.textColor || "#fff" }}
            >
              {vehicle.routeId}
            </p>
          )}
          <p className="text-xs font-semibold text-slate-700">
            {operatorMeta?.name || vehicle.operator}
          </p>
          {vehicle.speed != null && vehicle.speed > 0 && (
            <p className="text-xs text-slate-500 mt-0.5">
              {Math.round(vehicle.speed)} km/h
            </p>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
