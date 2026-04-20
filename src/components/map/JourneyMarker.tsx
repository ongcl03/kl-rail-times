import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

function createJourneyIcon(label: string, color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `
      <div style="
        width:28px;height:28px;
        border-radius:50%;
        background:${color};
        border:3px solid white;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-weight:700;font-size:12px;
        font-family:system-ui,sans-serif;
      ">${label}</div>
    `,
  });
}

export function JourneyMarker({
  position,
  label,
  name,
  stopId,
  color,
  type,
}: {
  position: [number, number];
  label: string;
  name: string;
  stopId?: string;
  color: string;
  type: "start" | "end";
}) {
  const icon = createJourneyIcon(label, color);

  return (
    <Marker position={position} icon={icon} zIndexOffset={1000}>
      <Popup>
        <div className="text-center">
          <p className="text-xs text-slate-500 uppercase font-semibold">
            {type === "start" ? "Start" : "End"}
          </p>
          <p className="font-semibold text-sm">{name}</p>
          {stopId && (
            <a
              href={`/station/${stopId}`}
              className="text-xs text-blue-600 underline"
            >
              View arrivals
            </a>
          )}
        </div>
      </Popup>
    </Marker>
  );
}
