"use client";
import { Search, X } from "lucide-react";
import { useStationSearch } from "@/hooks/useStationSearch";
import type { LineInfo } from "@/lib/gtfs/types";
import { useRef, useState, useCallback, useEffect } from "react";

interface StationPickerProps {
  label: string;
  lines: LineInfo[];
  value: { stopId: string; stopName: string; lineColor: string } | null;
  onChange: (station: { stopId: string; stopName: string; lineColor: string } | null) => void;
}

export function StationPicker({ label, lines, value, onChange }: StationPickerProps) {
  const { query, setQuery, results } = useStationSearch(lines);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setActiveIndex(-1); }, [results]);

  const handleSelect = useCallback(
    (r: (typeof results)[0]) => {
      onChange({ stopId: r.stopId, stopName: r.stopName, lineColor: r.lineColor });
      setQuery("");
      inputRef.current?.blur();
    },
    [onChange, setQuery]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results.length) return;
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((p) => (p < results.length - 1 ? p + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((p) => (p > 0 ? p - 1 : results.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0) handleSelect(results[activeIndex]);
          break;
        case "Escape":
          inputRef.current?.blur();
          break;
      }
    },
    [results, activeIndex, handleSelect]
  );

  useEffect(() => {
    if (activeIndex >= 0 && listRef.current?.children[activeIndex]) {
      (listRef.current.children[activeIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  if (value) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: value.lineColor }} />
        <span className="flex-1 text-sm font-medium text-slate-900 dark:text-white truncate">
          {value.stopName}
        </span>
        <button
          onClick={() => onChange(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1 block">
        {label}
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={`Search ${label.toLowerCase()} station...`}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
        />
      </div>

      {focused && results.length > 0 && (
        <div
          ref={listRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-48 overflow-y-auto"
        >
          {results.map((r, i) => (
            <button
              key={`${r.stopId}_${r.lineId}`}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === activeIndex ? "bg-blue-50 dark:bg-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: r.lineColor }} />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{r.stopName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{r.lineName}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
