"use client";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import { MapSkeleton } from "@/components/map/MapSkeleton";

const LiveBusMap = dynamic(
  () => import("@/components/map/LiveBusMap").then((m) => m.LiveBusMap),
  { ssr: false, loading: () => <MapSkeleton /> }
);

export default function BusMapPage() {
  return (
    <Suspense fallback={<MapSkeleton />}>
      <div className="flex flex-col" style={{ height: "calc(100dvh - 3.5rem)" }}>
        <LiveBusMap />
      </div>
    </Suspense>
  );
}
