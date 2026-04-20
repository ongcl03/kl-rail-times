"use client";
import { useState, useEffect, useCallback } from "react";

export interface FavoriteStation {
  stopId: string;
  stopName: string;
  lineColor: string;
}

export interface FavoriteJourney {
  fromStopId: string;
  fromStopName: string;
  fromLineColor: string;
  toStopId: string;
  toStopName: string;
  toLineColor: string;
}

const STATIONS_KEY = "favorite-stations";
const JOURNEYS_KEY = "favorite-journeys";

function readStorage<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useFavorites() {
  const [stations, setStations] = useState<FavoriteStation[]>([]);
  const [journeys, setJourneys] = useState<FavoriteJourney[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setStations(readStorage<FavoriteStation>(STATIONS_KEY));
    setJourneys(readStorage<FavoriteJourney>(JOURNEYS_KEY));
    setIsLoaded(true);
  }, []);

  const isStationFavorite = useCallback(
    (stopId: string) => stations.some((s) => s.stopId === stopId),
    [stations]
  );

  const toggleStation = useCallback(
    (station: FavoriteStation) => {
      const exists = stations.some((s) => s.stopId === station.stopId);
      const next = exists
        ? stations.filter((s) => s.stopId !== station.stopId)
        : [...stations, station];
      setStations(next);
      localStorage.setItem(STATIONS_KEY, JSON.stringify(next));
    },
    [stations]
  );

  const isJourneyFavorite = useCallback(
    (fromStopId: string, toStopId: string) =>
      journeys.some((j) => j.fromStopId === fromStopId && j.toStopId === toStopId),
    [journeys]
  );

  const toggleJourney = useCallback(
    (journey: FavoriteJourney) => {
      const exists = journeys.some(
        (j) => j.fromStopId === journey.fromStopId && j.toStopId === journey.toStopId
      );
      const next = exists
        ? journeys.filter(
            (j) => !(j.fromStopId === journey.fromStopId && j.toStopId === journey.toStopId)
          )
        : [...journeys, journey];
      setJourneys(next);
      localStorage.setItem(JOURNEYS_KEY, JSON.stringify(next));
    },
    [journeys]
  );

  return {
    favoriteStations: stations,
    isStationFavorite,
    toggleStation,
    favoriteJourneys: journeys,
    isJourneyFavorite,
    toggleJourney,
    isLoaded,
  };
}
