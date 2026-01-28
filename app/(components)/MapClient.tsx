"use client";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

export default function MapClient({
  center = [77.5946, 12.9716],
  zoom = 10,
}: {
  center?: [number, number];
  zoom?: number;
}) {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Mapbox token not needed for MapTiler
    mapboxgl.accessToken = "";

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: `https://api.maptiler.com/maps/streets-v2/style.json?key=${process.env.NEXT_PUBLIC_MAPTILER_KEY}`,
      center,
      zoom,
    });

    return () => map.remove();
  }, []);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full rounded-2xl border border-white/10"
    />
  );
}
