"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/map/MapSkeleton";

const LiveTrainMap = dynamic(
  () => import("@/components/map/LiveTrainMap").then((m) => m.LiveTrainMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export default function MapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
        <LiveTrainMap />
      </div>
    </Suspense>
  );
}
