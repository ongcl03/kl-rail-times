import { LINES } from "@/lib/lines";

export function LineFilter({
  visibleLines,
  onToggle,
}: {
  visibleLines: Set<string>;
  onToggle: (routeId: string) => void;
}) {
  return (
    <div className="absolute top-3 right-3 z-[1000] flex flex-wrap gap-1.5 max-w-[280px]">
      {LINES.map((line) => {
        const active = visibleLines.has(line.realtimeRouteId);
        return (
          <button
            key={line.id}
            onClick={() => onToggle(line.realtimeRouteId)}
            className="px-2 py-1 rounded-lg text-xs font-bold transition-all shadow-sm"
            style={{
              backgroundColor: active ? line.color : "rgba(255,255,255,0.85)",
              color: active ? line.textColor : "#94a3b8",
              border: active ? "none" : "1px solid #e2e8f0",
            }}
          >
            {line.shortName}
          </button>
        );
      })}
    </div>
  );
}
