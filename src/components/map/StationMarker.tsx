import { CircleMarker, Popup, Tooltip } from "react-leaflet";

export function StationMarker({
  position,
  name,
  stopId,
  color,
  showLabel,
}: {
  position: [number, number];
  name: string;
  stopId: string;
  color: string;
  showLabel?: boolean;
}) {
  return (
    <CircleMarker
      center={position}
      radius={4}
      pathOptions={{
        color: "white",
        fillColor: color,
        fillOpacity: 1,
        weight: 1.5,
      }}
    >
      <Popup>
        <div className="text-center">
          <p className="font-semibold text-sm">{name}</p>
          <a
            href={`/station/${stopId}`}
            className="text-xs text-blue-600 underline"
          >
            View arrivals
          </a>
        </div>
      </Popup>
      {showLabel && (
        <Tooltip
          direction="top"
          offset={[0, -6]}
          opacity={0.9}
          permanent={false}
        >
          <span className="text-xs font-medium">{name}</span>
        </Tooltip>
      )}
    </CircleMarker>
  );
}
