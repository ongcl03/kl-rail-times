"use client";
import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useStationSearch } from "@/hooks/useStationSearch";
import type { LineInfo } from "@/lib/gtfs/types";
import { useRef, useEffect, useState, useCallback } from "react";

export function SearchBar({ lines }: { lines: LineInfo[] }) {
  const { query, setQuery, results } = useStationSearch(lines);
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  // "/" shortcut to focus search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "/" && !focused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [focused]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!results.length) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case "ArrowUp":
          e.preventDefault();
          setActiveIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (activeIndex >= 0 && activeIndex < results.length) {
            const r = results[activeIndex];
            router.push(`/station/${r.stopId}?line=${r.lineId}`);
            setQuery("");
            inputRef.current?.blur();
          }
          break;
        case "Escape":
          inputRef.current?.blur();
          break;
      }
    },
    [results, activeIndex, router, setQuery]
  );

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[activeIndex]) {
      (items[activeIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stations..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-expanded={focused && results.length > 0}
          aria-activedescendant={
            activeIndex >= 0 ? `search-result-${activeIndex}` : undefined
          }
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {focused && results.length > 0 && (
        <div
          ref={listRef}
          role="listbox"
          className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden z-50 max-h-80 overflow-y-auto"
        >
          {results.map((r, i) => (
            <a
              key={`${r.stopId}_${r.lineId}`}
              id={`search-result-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              href={`/station/${r.stopId}?line=${r.lineId}`}
              onClick={(e) => {
                e.preventDefault();
                router.push(`/station/${r.stopId}?line=${r.lineId}`);
                setQuery("");
              }}
              className={`flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer ${
                i === activeIndex
                  ? "bg-blue-50 dark:bg-slate-700"
                  : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
              }`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: r.lineColor }}
              />
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">
                  {r.stopName}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {r.lineName}
                </p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
