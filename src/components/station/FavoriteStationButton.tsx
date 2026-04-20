"use client";
import { Heart } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function FavoriteStationButton({
  stopId,
  stopName,
  lineColor,
}: {
  stopId: string;
  stopName: string;
  lineColor: string;
}) {
  const { isStationFavorite, toggleStation, isLoaded } = useFavorites();
  if (!isLoaded) return null;

  const isFav = isStationFavorite(stopId);

  return (
    <button
      onClick={() => toggleStation({ stopId, stopName, lineColor })}
      className={`p-2 rounded-lg transition-all ${
        isFav
          ? "text-red-500 hover:text-red-600"
          : "text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800"
      }`}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart className="w-5 h-5" fill={isFav ? "currentColor" : "none"} />
    </button>
  );
}
